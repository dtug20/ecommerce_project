'use strict';

const Joi = require('joi');

const bankInfoSchema = Joi.object({
  bankName:      Joi.string().allow('', null).optional(),
  accountNumber: Joi.string().allow('', null).optional(),
  accountName:   Joi.string().allow('', null).optional(),
  branch:        Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Update own profile (user)
// ---------------------------------------------------------------------------
const updateUser = Joi.object({
  name:    Joi.string().min(1).max(100).optional(),
  email:   Joi.string().email({ tlds: { allow: false } }).optional(),
  phone:   Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  bio:     Joi.string().max(500).allow('', null).optional(),
  // Avatar URL (updated via separate upload endpoint in most flows)
  imageURL: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Admin — update user status
// ---------------------------------------------------------------------------
const updateUserStatus = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'blocked').required(),
  reason: Joi.string().max(500).allow('', null).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Vendor application
// ---------------------------------------------------------------------------
const vendorApplication = Joi.object({
  storeName:        Joi.string().min(2).max(100).required(),
  storeSlug:        Joi.string().lowercase().allow('', null).optional(),
  storeDescription: Joi.string().max(1000).allow('', null).optional(),
  storeLogo:        Joi.string().allow('', null).optional(),
  storeBanner:      Joi.string().allow('', null).optional(),
  bankInfo:         bankInfoSchema.optional(),
}).options({ stripUnknown: true });

module.exports = { updateUser, updateUserStatus, vendorApplication };
