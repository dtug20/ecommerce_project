'use strict';

/**
 * Email service — wraps nodemailer with file-based template sending.
 *
 * nodemailer is an optional peer dependency.  If it is not installed the
 * service logs a warning and silently no-ops so the rest of the application
 * continues to function without email.
 *
 * To enable email:
 *   npm install nodemailer
 *   Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in backend/.env
 */

const { getTemplate } = require('./emailTemplates');

// ── env vars ─────────────────────────────────────────────────────────────────
const EMAIL_HOST = process.env.EMAIL_HOST || process.env.SERVICE || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT, 10) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ── try to load nodemailer (optional dep) ─────────────────────────────────────
let transporter = null;

try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const nodemailer = require('nodemailer');

  if (EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });
    console.log('[emailService] Nodemailer transporter initialised');
  } else {
    console.warn('[emailService] EMAIL_USER / EMAIL_PASS not set — email sending disabled');
  }
} catch (_) {
  console.warn('[emailService] nodemailer not installed — email sending disabled');
}

/**
 * Send a templated email.
 *
 * @param {string} templateSlug   Slug of the file-based template (e.g. 'order-confirmation')
 * @param {string} recipientEmail Recipient address
 * @param {Record<string,string>} data  Template data values
 * @param {'en'|'vi'} [language='en']  Preferred language
 * @returns {Promise<void>}
 */
async function sendTemplatedEmail(templateSlug, recipientEmail, data, language = 'en') {
  if (!transporter) {
    console.warn(`[emailService] Skip send — transporter not available (template: ${templateSlug}, to: ${recipientEmail})`);
    return;
  }

  let tpl;
  try {
    tpl = getTemplate(templateSlug);
  } catch (err) {
    console.warn(`[emailService] ${err.message} — skipping email`);
    return;
  }

  const subject = tpl.subject(data, language);
  const html    = tpl.html(data, language);

  await transporter.sendMail({
    from: EMAIL_USER,
    to: recipientEmail,
    subject,
    html,
  });
}

module.exports = { sendTemplatedEmail, transporter };
