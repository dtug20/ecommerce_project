'use strict';

const mongoose = require('mongoose');
const Products = require('../../model/Products');
const ExchangeRate = require('../../model/ExchangeRate');
const respond = require('../../utils/respond');
const ApiError = require('../../errors/api-error');
const { getPaginationParams } = require('../../utils/pagination');

const SUSPECT_THRESHOLD = 5000;

/**
 * GET /api/v1/admin/products/currency-audit
 * Returns products with price < SUSPECT_THRESHOLD (likely USD-priced instead of VND).
 * Enriches each product with a suggestedVndPrice using the live exchange rate.
 */
exports.listAuditCandidates = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const showReviewed = req.query.showReviewed === 'true';

    const filter = { price: { $lt: SUSPECT_THRESHOLD, $gt: 0 } };
    if (!showReviewed) filter.currencyReviewedAt = null;

    const [totalItems, items, rateDoc] = await Promise.all([
      Products.countDocuments(filter),
      Products.find(filter)
        .select('title slug price discount img imageURLs currencyReviewedAt')
        .sort({ price: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExchangeRate.findOne({}).lean(),
    ]);

    const usdRate = rateDoc?.rates?.USD ?? 25450;
    const enriched = items.map((p) => ({
      ...p,
      suggestedVndPrice: Math.round(p.price * usdRate),
    }));

    return respond.success(res, {
      items: enriched,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
      currentRate: usdRate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/products/:id/normalize-currency
 * Converts a single product's price from the given currency to VND,
 * then stamps currencyReviewedAt.
 */
exports.normalizeOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fromCurrency } = req.body;

    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id');

    const product = await Products.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');

    if (fromCurrency === 'USD') {
      const rateDoc = await ExchangeRate.findOne({});
      const rate = rateDoc?.rates?.USD;
      if (!rate) throw new ApiError(500, 'Exchange rate unavailable');
      product.price = Math.round(product.price * rate);
    }
    product.currencyReviewedAt = new Date();
    await product.save();

    return respond.success(res, {
      _id: product._id,
      title: product.title,
      price: product.price,
      currencyReviewedAt: product.currencyReviewedAt,
    }, 'Product currency normalized');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/products/bulk-normalize-currency
 * Converts a batch of products' prices and stamps currencyReviewedAt on each.
 */
exports.normalizeBulk = async (req, res, next) => {
  try {
    const { ids, fromCurrency } = req.body;

    const rateDoc = await ExchangeRate.findOne({});
    const rate = rateDoc?.rates?.USD;
    if (fromCurrency === 'USD' && !rate) throw new ApiError(500, 'Exchange rate unavailable');

    let updated = 0;
    for (const id of ids) {
      if (!mongoose.isValidObjectId(id)) continue;
      const product = await Products.findById(id);
      if (!product) continue;
      if (fromCurrency === 'USD') {
        product.price = Math.round(product.price * rate);
      }
      product.currencyReviewedAt = new Date();
      await product.save();
      updated++;
    }

    return respond.success(res, { updated }, `${updated} product(s) normalized`);
  } catch (err) {
    next(err);
  }
};
