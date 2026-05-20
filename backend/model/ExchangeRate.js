// backend/model/ExchangeRate.js
const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema(
  {
    base: { type: String, default: 'VND', immutable: true },
    rates: {
      USD: { type: Number, required: true },
      EUR: { type: Number, required: true },
      GBP: { type: Number, required: true },
      JPY: { type: Number, required: true },
    },
    source: { type: String, default: 'exchangerate.host' },
    stale: { type: Boolean, default: false },
    fetchedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
