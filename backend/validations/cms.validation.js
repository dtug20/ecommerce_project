'use strict';

const Joi = require('joi');

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

const seoSchema = Joi.object({
  metaTitle:       Joi.string().max(70).allow('', null).optional(),
  metaDescription: Joi.string().max(160).allow('', null).optional(),
  metaKeywords:    Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string().allow('', null)
  ).optional(),
  ogImage: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true }).optional();

const blockSchema = Joi.object({
  blockType: Joi.string().required(),
  order:     Joi.number().integer().min(0).optional(),
  visible:   Joi.boolean().optional(),
  content:   Joi.object().unknown(true).optional(),
  settings:  Joi.object().unknown(true).optional(),
}).options({ allowUnknown: true });

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const createPage = Joi.object({
  title:  Joi.string().required(),
  slug:   Joi.string().allow('', null).optional(),
  type:   Joi.string().valid('home', 'landing', 'custom', 'blog', 'shop', 'about', 'contact').optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  blocks: Joi.array().items(blockSchema).optional(),
  seo:    seoSchema,
  layout: Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

const updatePage = createPage.fork(['title'], (f) => f.optional());

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

const menuItemSchema = Joi.object({
  label:    Joi.string().required(),
  url:      Joi.string().allow('', null).optional(),
  target:   Joi.string().valid('_self', '_blank').optional(),
  icon:     Joi.string().allow('', null).optional(),
  order:    Joi.number().integer().min(0).optional(),
  children: Joi.array().items(Joi.object().unknown(true)).optional(),
}).options({ allowUnknown: true });

const createMenu = Joi.object({
  name:     Joi.string().required(),
  location: Joi.string().required(),
  items:    Joi.array().items(menuItemSchema).optional(),
  status:   Joi.string().valid('active', 'inactive').optional(),
}).options({ stripUnknown: true });

const updateMenu = createMenu.fork(['name', 'location'], (f) => f.optional());

// ---------------------------------------------------------------------------
// Banners
// ---------------------------------------------------------------------------

const schedulingSchema = Joi.object({
  startDate: Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
  endDate:   Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
}).options({ stripUnknown: true });

const createBanner = Joi.object({
  title:      Joi.string().required(),
  type:       Joi.string().valid('hero', 'promo', 'sidebar', 'popup', 'announcement').optional(),
  content:    Joi.object().unknown(true).optional(),
  scheduling: schedulingSchema.optional(),
  status:     Joi.string().valid('active', 'inactive', 'scheduled').optional(),
  priority:   Joi.number().integer().min(0).optional(),
  imageUrl:   Joi.string().allow('', null).optional(),
  link:       Joi.string().allow('', null).optional(),
  position:   Joi.string().allow('', null).optional(),
}).options({ stripUnknown: true });

const updateBanner = createBanner.fork(['title'], (f) => f.optional());

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

const createBlogPost = Joi.object({
  title:    Joi.string().required(),
  content:  Joi.string().allow('', null).optional(),
  slug:     Joi.string().allow('', null).optional(),
  excerpt:  Joi.string().max(500).allow('', null).optional(),
  category: Joi.string().allow('', null).optional(),
  tags:     Joi.array().items(Joi.string()).optional(),
  status:   Joi.string().valid('draft', 'published', 'archived').optional(),
  seo:      seoSchema,
  featuredImage: Joi.string().allow('', null).optional(),
  author:        Joi.string().allow('', null).optional(),
  featured:      Joi.boolean().optional(),
  publishedAt:   Joi.alternatives().try(Joi.date(), Joi.string().allow('', null)).optional(),
}).options({ stripUnknown: true });

const updateBlogPost = createBlogPost.fork(['title'], (f) => f.optional());

// ---------------------------------------------------------------------------
// Settings  (flexible — allow any key/value pairs)
// ---------------------------------------------------------------------------

// Settings are a free-form object — any key/value pair is permitted.
// stripUnknown is deliberately NOT set so the full payload passes through.
const updateSettings = Joi.object().unknown(true);

module.exports = {
  createPage,
  updatePage,
  createMenu,
  updateMenu,
  createBanner,
  updateBanner,
  createBlogPost,
  updateBlogPost,
  updateSettings,
};
