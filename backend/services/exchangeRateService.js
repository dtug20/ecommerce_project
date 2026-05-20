// backend/services/exchangeRateService.js
const cron = require('node-cron');
const axios = require('axios');
const ExchangeRate = require('../model/ExchangeRate');

const API_URL = 'https://api.exchangerate.host/latest?base=VND&symbols=USD,EUR,GBP,JPY';
const TARGETS = ['USD', 'EUR', 'GBP', 'JPY'];

async function refreshRates() {
  try {
    const { data } = await axios.get(API_URL, { timeout: 10_000 });
    if (!data || !data.rates) throw new Error('Invalid API response');

    // API returns "1 VND = X target". We invert to "1 target = X VND".
    const rates = {};
    for (const code of TARGETS) {
      const r = data.rates[code];
      if (!r || r <= 0) throw new Error(`Missing rate for ${code}`);
      rates[code] = 1 / r;
    }

    await ExchangeRate.findOneAndUpdate(
      {},
      { base: 'VND', rates, source: 'exchangerate.host', stale: false, fetchedAt: new Date() },
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
