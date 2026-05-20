'use strict';

const ExchangeRate = require('../../model/ExchangeRate');
const respond = require('../../utils/respond');

// Swagger annotation lives in backend/routes/v1/store/index.js (swagger-jsdoc scans routes only).
exports.getExchangeRates = async (req, res, next) => {
  try {
    let doc = await ExchangeRate.findOne({});
    if (!doc) {
      // Cron may not have fired yet on first boot — seed defaults
      doc = await ExchangeRate.create({
        base: 'VND',
        rates: { USD: 25450, EUR: 27600, GBP: 32100, JPY: 168 },
        source: 'seed',
        stale: true,
        fetchedAt: new Date(),
      });
    }
    res.set('Cache-Control', 'public, max-age=3600');
    return respond.success(res, {
      base: doc.base,
      rates: doc.rates,
      stale: doc.stale,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};
