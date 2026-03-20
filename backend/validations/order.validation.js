'use strict';

const Joi = require('joi');

const createOrder = Joi.object({
  cart: Joi.array().min(1).required(),

  // Shipping / billing info
  name:     Joi.string().required(),
  address:  Joi.string().required(),
  email:    Joi.string().email({ tlds: { allow: false } }).required(),
  contact:  Joi.string().required(),
  city:     Joi.string().required(),
  country:  Joi.string().required(),
  zipCode:  Joi.string().required(),

  // Amounts
  subTotal:    Joi.number().min(0).required(),
  totalAmount: Joi.number().min(0).required(),
  shippingCost: Joi.number().min(0).required(),
  discount:    Joi.number().min(0).optional().default(0),

  // Payment
  paymentMethod: Joi.string()
    .valid('COD', 'bank-transfer', 'vnpay', 'momo', 'stripe')
    .required(),

  // Optional fields
  orderNote:  Joi.string().max(500).allow('', null).optional(),
  couponCode: Joi.string().allow('', null).optional(),

  // Stripe payment intent — passed when method is 'stripe'
  paymentIntent: Joi.alternatives().try(
    Joi.string(),
    Joi.object()
  ).allow(null).optional(),

  // Stripe client secret carried by older frontend code
  stripe_client_secret: Joi.string().allow('', null).optional(),

  // Shipping info wrapper (alternate field names from some frontend versions)
  shipping_info: Joi.object().optional(),
  user: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

module.exports = { createOrder };
