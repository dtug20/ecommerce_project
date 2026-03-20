'use strict';

const Joi = require('joi');

// Reusable sub-schemas
const variantSchema = Joi.object({
  sku:    Joi.string().allow('', null).optional(),
  color:  Joi.string().allow('', null).optional(),
  size:   Joi.string().allow('', null).optional(),
  price:  Joi.number().min(0).optional(),
  stock:  Joi.number().integer().min(0).optional(),
  images: Joi.array().items(Joi.string().allow('', null)).optional(),
}).options({ stripUnknown: true });

const seoSchema = Joi.object({
  metaTitle:       Joi.string().max(70).allow('', null).optional(),
  metaDescription: Joi.string().max(160).allow('', null).optional(),
  metaKeywords:    Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  ogImage: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

const categoryRefSchema = Joi.object({
  name: Joi.string().allow('', null).optional(),
  id:   Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

const brandRefSchema = Joi.object({
  name: Joi.string().allow('', null).optional(),
  id:   Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

const dimensionsSchema = Joi.object({
  length: Joi.number().min(0).optional(),
  width:  Joi.number().min(0).optional(),
  height: Joi.number().min(0).optional(),
  unit:   Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

const offerDateSchema = Joi.object({
  startDate: Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
  endDate:   Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
}).options({ stripUnknown: true });

// imageURLs: array of color-variant objects with an images sub-array
const imageURLSchema = Joi.array().items(
  Joi.object({
    color:  Joi.string().allow('', null).optional(),
    img:    Joi.string().allow('', null).optional(),
    images: Joi.array().items(
      Joi.object({
        url:  Joi.string().allow('', null).optional(),
        size: Joi.string().allow('', null).optional(),
      }).options({ stripUnknown: true })
    ).optional(),
  }).options({ stripUnknown: true })
).optional();

// ---------------------------------------------------------------------------
// Create — required fields
// ---------------------------------------------------------------------------
const createProduct = Joi.object({
  title:       Joi.string().min(3).max(200).required(),
  description: Joi.string().allow('', null).optional(),
  price:       Joi.number().min(0).required(),
  discount:    Joi.number().min(0).max(100).optional(),
  quantity:    Joi.number().integer().min(0).required(),
  status:      Joi.string().valid('in-stock', 'out-of-stock', 'discontinued').optional(),
  productType: Joi.string().required(),
  unit:        Joi.string().allow('', null).optional(),
  img:         Joi.string().allow('', null).optional(),
  category:    categoryRefSchema.optional(),
  brand:       brandRefSchema.optional(),
  variants:    Joi.array().items(variantSchema).optional(),
  imageURLs:   imageURLSchema,
  seo:         seoSchema.optional(),
  tags:        Joi.array().items(Joi.string()).optional(),
  sizes:       Joi.array().items(Joi.string()).optional(),
  weight:      Joi.number().min(0).optional(),
  dimensions:  dimensionsSchema.optional(),
  barcode:     Joi.string().allow('', null).optional(),
  featured:    Joi.boolean().optional(),
  offerDate:   offerDateSchema.optional(),
  slug:        Joi.string().allow('', null).optional(),
  additionalInformation: Joi.array().items(
    Joi.object({
      key:   Joi.string().allow('', null).optional(),
      value: Joi.string().allow('', null).optional(),
    }).options({ stripUnknown: true })
  ).optional(),
  reviews:     Joi.array().optional(),
  sellCount:   Joi.number().integer().min(0).optional(),
}).options({ stripUnknown: true });

// ---------------------------------------------------------------------------
// Update — all fields optional
// ---------------------------------------------------------------------------
const updateProduct = createProduct.fork(
  ['title', 'price', 'quantity', 'productType'],
  (field) => field.optional()
);

module.exports = { createProduct, updateProduct };
