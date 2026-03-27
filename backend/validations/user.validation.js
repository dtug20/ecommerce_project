'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Password policy (matches Keycloak realm policy)
// Min 8 chars, at least 1 digit, 1 uppercase, 1 lowercase, 1 special char
// ---------------------------------------------------------------------------
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[0-9]/, 'digit')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[^A-Za-z0-9]/, 'special character')
  .messages({
    'string.min':            'Password must be at least 8 characters',
    'string.max':            'Password must not exceed 128 characters',
    'string.pattern.name':   'Password must contain at least 1 {#name}',
  });

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

// ---------------------------------------------------------------------------
// Admin — create user
// ---------------------------------------------------------------------------
const createUser = Joi.object({
  name:     Joi.string().min(1).max(100).required(),
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  password: passwordSchema.required(),
  role:     Joi.string().valid('user', 'admin', 'vendor').default('user').optional(),
  status:   Joi.string().valid('active', 'inactive', 'blocked').default('active').optional(),
  phone:    Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Admin — create staff
// ---------------------------------------------------------------------------
const addStaff = Joi.object({
  name:        Joi.string().min(1).max(100).required(),
  email:       Joi.string().email({ tlds: { allow: false } }).required(),
  password:    passwordSchema.required(),
  role:        Joi.string().valid('Admin', 'Super Admin', 'Manager', 'CEO').required(),
  phone:       Joi.string().allow('', null).optional(),
  joiningDate: Joi.string().allow('', null).optional(),
  image:       Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

module.exports = { updateUser, updateUserStatus, vendorApplication, createUser, addStaff, passwordSchema };
