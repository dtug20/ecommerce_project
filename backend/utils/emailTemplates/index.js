'use strict';

/**
 * File-based email template registry.
 *
 * Each template module exports:
 *   subject(data, lang) → string
 *   html(data, lang)    → string
 *
 * Usage:
 *   const { getTemplate } = require('./emailTemplates');
 *   const tpl = getTemplate('order-confirmation');
 *   tpl.subject({ orderNumber: '1001' }, 'en');
 *   tpl.html({ orderNumber: '1001', customerName: 'Alice', ... }, 'vi');
 */

const templates = {
  'order-confirmation': require('./orderConfirmation'),
  'order-shipped':      require('./orderShipped'),
  'order-delivered':    require('./orderDelivered'),
  'order-cancelled':    require('./orderCancelled'),
  'welcome':            require('./welcome'),
  'password-reset':     require('./passwordReset'),
  'vendor-application': require('./vendorApplication'),
  'vendor-approved':    require('./vendorApproved'),
  'low-stock-alert':    require('./lowStockAlert'),
};

/**
 * Retrieve a template by slug.
 * @param {string} slug
 * @returns {{ subject: Function, html: Function }}
 * @throws {Error} if slug is not registered
 */
function getTemplate(slug) {
  const t = templates[slug];
  if (!t) throw new Error(`Email template not found: ${slug}`);
  return t;
}

module.exports = { getTemplate, templates };
