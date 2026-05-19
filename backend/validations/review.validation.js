'use strict';

const Joi = require('joi');

const createReview = Joi.object({
  productId: Joi.string().required(),
  rating:    Joi.number().integer().min(1).max(5).required(),
  comment:   Joi.string().max(1000).allow('', null).optional(),
  images:    Joi.array().items(Joi.string().allow('', null)).optional(),
}).options({ stripUnknown: true });

module.exports = { createReview };
