'use strict';

const Joi = require('joi');

const displayRulesSchema = Joi.object({
  showOnBanner:      Joi.boolean().optional(),
  showOnCheckout:    Joi.boolean().optional(),
  showOnProductPage: Joi.boolean().optional(),
}).options({ stripUnknown: true });

const createCoupon = Joi.object({
  title:              Joi.string().required(),
  couponCode:         Joi.string().required(),
  discountPercentage: Joi.number().min(0).max(100).required(),
  minimumAmount:      Joi.number().min(0).required(),
  productType:        Joi.string().allow('', null).optional(),
  startTime:          Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
  endTime:            Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
  status:             Joi.string().valid('active', 'inactive').optional(),

  // Extended targeting fields (Phase 3)
  discountType:        Joi.string().valid('percentage', 'fixed').optional(),
  usageLimit:          Joi.number().integer().min(0).allow(null).optional(),
  perUserLimit:        Joi.number().integer().min(0).allow(null).optional(),
  applicableProducts:  Joi.array().items(Joi.string()).optional(),
  applicableCategories:Joi.array().items(Joi.string()).optional(),
  excludedProducts:    Joi.array().items(Joi.string()).optional(),
  displayRules:        displayRulesSchema.optional(),
}).options({ stripUnknown: true });

const updateCoupon = createCoupon.fork(
  ['title', 'couponCode', 'discountPercentage', 'minimumAmount'],
  (field) => field.optional()
);

module.exports = { createCoupon, updateCoupon };
