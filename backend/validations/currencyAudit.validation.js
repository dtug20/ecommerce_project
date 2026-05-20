'use strict';

const Joi = require('joi');

/**
 * Body schema for POST /api/v1/admin/products/:id/normalize-currency
 */
const normalizeCurrency = Joi.object({
  fromCurrency: Joi.string().valid('USD', 'VND').required(),
});

/**
 * Body schema for POST /api/v1/admin/products/bulk-normalize-currency
 */
const bulkNormalizeCurrency = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required(),
  fromCurrency: Joi.string().valid('USD', 'VND').required(),
});

module.exports = { normalizeCurrency, bulkNormalizeCurrency };
