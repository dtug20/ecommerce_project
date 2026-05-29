// backend/services/exchangeRateService.js
const cron = require('node-cron');
const axios = require('axios');
const ExchangeRate = require('../model/ExchangeRate');

// open.er-api.com: free, no API key required, returns USD-based rates.
// (exchangerate.host was retired to a paid, access_key-gated API.)
// Override via EXCHANGE_RATE_API_URL if you have a keyed provider.
const API_URL = process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD';
const TARGETS = ['USD', 'EUR', 'GBP', 'JPY'];

async function refreshRates() {
  try {
    const { data } = await axios.get(API_URL, { timeout: 10_000 });
    // open.er-api.com returns { result: 'success', base_code: 'USD', rates: {...} }.
    if (!data || data.result === 'error' || !data.rates) {
      throw new Error(`Invalid API response${data && data['error-type'] ? `: ${data['error-type']}` : ''}`);
    }

    const usdRates = data.rates; // "1 USD = X <code>"
    const vndPerUsd = usdRates.VND;
    if (!vndPerUsd || vndPerUsd <= 0) throw new Error('Missing VND rate');

    // We want "1 <target> = X VND".
    // VND per target = (VND per USD) / (target per USD).
    const rates = {};
    for (const code of TARGETS) {
      const perUsd = usdRates[code];
      if (!perUsd || perUsd <= 0) throw new Error(`Missing rate for ${code}`);
      rates[code] = vndPerUsd / perUsd;
    }

    await ExchangeRate.findOneAndUpdate(
      {},
      { base: 'VND', rates, source: 'open.er-api.com', stale: false, fetchedAt: new Date() },
      { upsert: true, new: true, runValidators: true },
    );
    console.log('[exchangeRate] refreshed:', rates);
  } catch (err) {
    console.error('[exchangeRate] refresh failed:', err.message);
    await ExchangeRate.updateOne({}, { $set: { stale: true } });
  }
}

function startCron() {
  cron.schedule('0 * * * *', refreshRates); // every hour, top of hour
  refreshRates(); // initial fetch on boot
}

module.exports = { startCron, refreshRates };
