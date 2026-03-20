'use strict';

/**
 * Email Template controller — v1
 *
 * Manages the EmailTemplate documents used by emailService.js.
 * Supports listing, single fetch, update, preview rendering, and test send.
 */

const EmailTemplate = require('../../model/EmailTemplate');
const respond = require('../../utils/respond');
const { renderTemplate } = require('../../utils/emailRenderer');
const { sendTemplatedEmail } = require('../../utils/emailService');

// ---------------------------------------------------------------------------
// Sample data used to render previews for each template type
// ---------------------------------------------------------------------------

const SAMPLE_DATA = {
  'order-confirmation': {
    customerName: 'John Doe',
    orderNumber: 'ORD-1001',
    orderTotal: '$150.00',
    orderDate: '2026-03-20',
    itemsHtml: '<li>Product A x2 — $100.00</li><li>Product B x1 — $50.00</li>',
    shippingAddress: '123 Main St, City, Country',
  },
  'order-shipped': {
    customerName: 'John Doe',
    orderNumber: 'ORD-1001',
    trackingNumber: '1234567890',
    carrier: 'DHL',
    trackingUrl: 'https://www.dhl.com/tracking/1234567890',
    estimatedDelivery: '2026-03-25',
  },
  'order-delivered': {
    customerName: 'John Doe',
    orderNumber: 'ORD-1001',
    deliveredDate: '2026-03-25',
  },
  'order-cancelled': {
    customerName: 'John Doe',
    orderNumber: 'ORD-1001',
    cancellationReason: 'Customer requested cancellation',
  },
  welcome: {
    customerName: 'John Doe',
    siteName: 'Shofy',
    loginUrl: 'http://localhost:3000/login',
  },
  'password-reset': {
    customerName: 'John Doe',
    resetLink: 'http://localhost:3000/reset?token=abc123',
    expiryTime: '10 minutes',
  },
  'vendor-application': {
    vendorName: 'Jane Store',
    storeName: 'Jane Electronics',
    applicationDate: '2026-03-20',
  },
  'vendor-approved': {
    vendorName: 'Jane Store',
    storeName: 'Jane Electronics',
    dashboardUrl: 'http://localhost:3000/vendor/dashboard',
  },
  'low-stock-alert': {
    productTitle: 'Wireless Headphone',
    currentStock: '3',
    productUrl: 'http://localhost:8080/products',
  },
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/email-templates
// ---------------------------------------------------------------------------

exports.listTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().sort({ type: 1, name: 1 });
    return respond.success(res, templates, 'Email templates retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/email-templates/:id
// ---------------------------------------------------------------------------

exports.getTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return respond.notFound(res);
    return respond.success(res, template, 'Email template retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/admin/email-templates/:id
// Updateable fields: subject, subjectVi, body, bodyVi, variables, status
// ---------------------------------------------------------------------------

exports.updateTemplate = async (req, res, next) => {
  try {
    const ALLOWED = ['subject', 'subjectVi', 'body', 'bodyVi', 'variables', 'status'];
    const updates = {};
    for (const key of ALLOWED) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return respond.error(res, 'NO_CHANGES', 'No updatable fields provided', 400);
    }

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!template) return respond.notFound(res);

    if (global.io) {
      global.io.emit('email-template:updated', { _id: template._id, slug: template.slug });
    }

    return respond.success(res, template, 'Email template updated');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/admin/email-templates/:id/preview
// Renders the template with sample data. Returns {subject, html}.
// ---------------------------------------------------------------------------

exports.previewTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return respond.notFound(res);

    const language = req.body.language === 'vi' ? 'vi' : 'en';
    const sampleData = SAMPLE_DATA[template.type] || {};
    // Allow caller to override sample values
    const mergeData = { ...sampleData, ...(req.body.data || {}) };

    const subject =
      language === 'vi' && template.subjectVi
        ? renderTemplate(template.subjectVi, mergeData)
        : renderTemplate(template.subject, mergeData);

    const html =
      language === 'vi' && template.bodyVi
        ? renderTemplate(template.bodyVi, mergeData)
        : renderTemplate(template.body, mergeData);

    return respond.success(res, { subject, html, mergeData }, 'Template preview generated');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/admin/email-templates/:id/test
// Sends the rendered template to the provided recipient email.
// Body: { recipient: string, language?: 'en'|'vi', data?: object }
// ---------------------------------------------------------------------------

exports.testTemplate = async (req, res, next) => {
  try {
    const { recipient, language = 'en', data: overrideData = {} } = req.body;

    if (!recipient) {
      return respond.error(res, 'MISSING_RECIPIENT', 'A recipient email address is required', 400);
    }

    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return respond.notFound(res);

    const sampleData = SAMPLE_DATA[template.type] || {};
    const mergeData = { ...sampleData, ...overrideData };

    const subjectTpl =
      language === 'vi' && template.subjectVi ? template.subjectVi : template.subject;
    const bodyTpl =
      language === 'vi' && template.bodyVi ? template.bodyVi : template.body;

    const subject = renderTemplate(subjectTpl, mergeData);
    const html = renderTemplate(bodyTpl, mergeData);

    // Import transporter lazily to handle optional nodemailer
    const { transporter } = require('../../utils/emailService');

    if (!transporter) {
      return respond.error(
        res,
        'EMAIL_NOT_CONFIGURED',
        'Email transport is not configured — install nodemailer and set EMAIL_USER/EMAIL_PASS',
        503
      );
    }

    const EMAIL_USER = process.env.EMAIL_USER;
    await transporter.sendMail({ from: EMAIL_USER, to: recipient, subject, html });

    return respond.success(
      res,
      { recipient, subject },
      `Test email sent to ${recipient}`
    );
  } catch (err) {
    next(err);
  }
};
