'use strict';

const Joi = require('joi');

const messageBody = Joi.object({
  sessionId: Joi.string().min(8).max(128).required(),
  message: Joi.string().min(1).max(2000).required(),
  locale: Joi.string().valid('en', 'vi').default('en'),
  cartSnapshot: Joi.array().items(Joi.object({
    productId: Joi.string(),
    title: Joi.string(),
    price: Joi.number(),
    qty: Joi.number().integer().min(1)
  })).default([]),
  recentlyViewedProducts: Joi.array().items(Joi.string()).default([])
});

const feedbackBody = Joi.object({
  sessionId: Joi.string().required(),
  messageId: Joi.string().required(),
  rating: Joi.string().valid('up', 'down').required(),
  reason: Joi.string().max(500).optional()
});

module.exports = { messageBody, feedbackBody };
