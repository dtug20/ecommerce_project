'use strict';

const Joi = require('joi');

const bankInfoSchema = Joi.object({
  bankName:      Joi.string().allow('', null).optional(),
  accountNumber: Joi.string().allow('', null).optional(),
  accountName:   Joi.string().allow('', null).optional(),
  branch:        Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Vendor profile update
// ---------------------------------------------------------------------------
const updateVendorProfile = Joi.object({
  storeName:        Joi.string().min(2).max(100).optional(),
  storeSlug:        Joi.string().lowercase().allow('', null).optional(),
  storeDescription: Joi.string().max(1000).allow('', null).optional(),
  storeLogo:        Joi.string().allow('', null).optional(),
  storeBanner:      Joi.string().allow('', null).optional(),
  contactEmail:     Joi.string().email({ tlds: { allow: false } }).allow('', null).optional(),
  contactPhone:     Joi.string().allow('', null).optional(),
  bankInfo:         bankInfoSchema.optional(),
  commissionRate:   Joi.number().min(0).max(100).optional(),
  policies: Joi.object({
    returnPolicy:   Joi.string().allow('', null).optional(),
    shippingPolicy: Joi.string().allow('', null).optional(),
  }).options({ stripUnknown: true }).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Vendor payout request
// ---------------------------------------------------------------------------
const requestPayout = Joi.object({
  amount: Joi.number().min(1).required(),
  notes:  Joi.string().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

module.exports = { updateVendorProfile, requestPayout };
