'use strict';

/**
 * 14-seed-email-templates.js
 *
 * Seeds the 9 default email templates into the unified database.
 * Uses upsert by slug so it is safe to re-run without creating duplicates.
 *
 * Documents created (all idempotent):
 *   - order-confirmation
 *   - order-shipped
 *   - order-delivered
 *   - order-cancelled
 *   - welcome
 *   - password-reset
 *   - vendor-application
 *   - vendor-approved
 *   - low-stock-alert
 *
 * Usage:
 *   UNIFIED_URI=mongodb://... node migration/14-seed-email-templates.js
 */

const path = require('path');
// Resolve mongoose from backend/node_modules since migration/ is outside backend/
module.paths.unshift(path.join(__dirname, '..', 'backend', 'node_modules'));
const mongoose = require('mongoose');

const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

// ── HTML layout helper ────────────────────────────────────────────────────────

function layout(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f4f4f4; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background: #0989FF; padding: 24px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; }
    .body { padding: 32px; color: #333333; font-size: 15px; line-height: 1.6; }
    .body h2 { color: #0989FF; margin-top: 0; }
    .body ul { padding-left: 20px; }
    .body a { color: #0989FF; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #0989FF; color: #ffffff !important; border-radius: 6px; text-decoration: none; font-weight: bold; }
    .footer { padding: 20px 32px; background: #f4f4f4; text-align: center; font-size: 12px; color: #888888; }
    .divider { border: none; border-top: 1px solid #eeeeee; margin: 20px 0; }
    .info-row { margin: 8px 0; }
    .label { font-weight: bold; color: #555555; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Shofy</h1></div>
    <div class="body">
${bodyContent}
    </div>
    <div class="footer">
      &copy; 2026 Shofy. All rights reserved.<br />
      This is an automated message — please do not reply.
    </div>
  </div>
</body>
</html>`;
}

// ── Template definitions ─────────────────────────────────────────────────────

const templates = [
  {
    name: 'Order Confirmation',
    slug: 'order-confirmation',
    type: 'order-confirmation',
    subject: 'Order Confirmation — #{{orderNumber}}',
    subjectVi: 'Xac nhan don hang — #{{orderNumber}}',
    body: layout('Order Confirmation',
      `      <h2>Thank you for your order!</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We have received your order and it is now being processed.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Order Number:</span> #{{orderNumber}}</div>
      <div class="info-row"><span class="label">Order Date:</span> {{orderDate}}</div>
      <div class="info-row"><span class="label">Order Total:</span> {{orderTotal}}</div>
      <div class="info-row"><span class="label">Shipping To:</span> {{shippingAddress}}</div>
      <hr class="divider" />
      <p><strong>Items Ordered:</strong></p>
      <ul>{{itemsHtml}}</ul>
      <p>We will send you another email once your order has shipped.</p>
      <p>If you have any questions, please contact our support team.</p>`),
    bodyVi: layout('Xac nhan don hang',
      `      <h2>Cam on ban da dat hang!</h2>
      <p>Xin chao <strong>{{customerName}}</strong>,</p>
      <p>Chung toi da nhan duoc don hang cua ban va dang xu ly.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Ma don hang:</span> #{{orderNumber}}</div>
      <div class="info-row"><span class="label">Ngay dat hang:</span> {{orderDate}}</div>
      <div class="info-row"><span class="label">Tong tien:</span> {{orderTotal}}</div>
      <div class="info-row"><span class="label">Dia chi giao hang:</span> {{shippingAddress}}</div>
      <hr class="divider" />
      <p><strong>San pham da dat:</strong></p>
      <ul>{{itemsHtml}}</ul>
      <p>Chung toi se gui email cho ban khi don hang duoc giao di.</p>`),
    variables: ['customerName', 'orderNumber', 'orderTotal', 'orderDate', 'itemsHtml', 'shippingAddress'],
    isDefault: true,
  },
  {
    name: 'Order Shipped',
    slug: 'order-shipped',
    type: 'order-shipped',
    subject: 'Your order #{{orderNumber}} has been shipped!',
    subjectVi: 'Don hang #{{orderNumber}} da duoc giao di!',
    body: layout('Order Shipped',
      `      <h2>Your order is on its way!</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>Great news — your order has been shipped and is heading your way.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Order Number:</span> #{{orderNumber}}</div>
      <div class="info-row"><span class="label">Carrier:</span> {{carrier}}</div>
      <div class="info-row"><span class="label">Tracking Number:</span> {{trackingNumber}}</div>
      <div class="info-row"><span class="label">Estimated Delivery:</span> {{estimatedDelivery}}</div>
      <hr class="divider" />
      <a href="{{trackingUrl}}" class="btn">Track Your Package</a>
      <p style="margin-top:24px;">If you have questions about your shipment, please reply to this email.</p>`),
    bodyVi: layout('Don hang da duoc giao di',
      `      <h2>Don hang cua ban dang tren duong!</h2>
      <p>Xin chao <strong>{{customerName}}</strong>,</p>
      <p>Tin vui — don hang cua ban da duoc giao cho don vi van chuyen.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Ma don hang:</span> #{{orderNumber}}</div>
      <div class="info-row"><span class="label">Don vi van chuyen:</span> {{carrier}}</div>
      <div class="info-row"><span class="label">Ma van don:</span> {{trackingNumber}}</div>
      <div class="info-row"><span class="label">Ngay du kien nhan hang:</span> {{estimatedDelivery}}</div>
      <hr class="divider" />
      <a href="{{trackingUrl}}" class="btn">Theo doi don hang</a>`),
    variables: ['customerName', 'orderNumber', 'trackingNumber', 'carrier', 'trackingUrl', 'estimatedDelivery'],
    isDefault: true,
  },
  {
    name: 'Order Delivered',
    slug: 'order-delivered',
    type: 'order-delivered',
    subject: 'Your order #{{orderNumber}} has been delivered!',
    subjectVi: 'Don hang #{{orderNumber}} da duoc giao thanh cong!',
    body: layout('Order Delivered',
      `      <h2>Your order has been delivered!</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We're happy to let you know that your order <strong>#{{orderNumber}}</strong> was delivered on <strong>{{deliveredDate}}</strong>.</p>
      <p>We hope you love your purchase! If anything is not right, please reach out to our support team within 30 days.</p>
      <p>Thank you for shopping with Shofy!</p>`),
    bodyVi: layout('Don hang da giao thanh cong',
      `      <h2>Don hang da duoc giao thanh cong!</h2>
      <p>Xin chao <strong>{{customerName}}</strong>,</p>
      <p>Don hang <strong>#{{orderNumber}}</strong> cua ban da duoc giao vao ngay <strong>{{deliveredDate}}</strong>.</p>
      <p>Chuc ban hai long voi san pham! Neu co van de, vui long lien he bo phan ho tro trong vong 30 ngay.</p>
      <p>Cam on ban da mua sam tai Shofy!</p>`),
    variables: ['customerName', 'orderNumber', 'deliveredDate'],
    isDefault: true,
  },
  {
    name: 'Order Cancelled',
    slug: 'order-cancelled',
    type: 'order-cancelled',
    subject: 'Your order #{{orderNumber}} has been cancelled',
    subjectVi: 'Don hang #{{orderNumber}} da bi huy',
    body: layout('Order Cancelled',
      `      <h2>Order Cancellation Notice</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We're sorry to inform you that your order <strong>#{{orderNumber}}</strong> has been cancelled.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Cancellation Reason:</span> {{cancellationReason}}</div>
      <hr class="divider" />
      <p>If you paid for this order, a refund will be processed within 5-7 business days.</p>
      <p>If you have any questions, please contact our support team.</p>`),
    bodyVi: layout('Huy don hang',
      `      <h2>Thong bao huy don hang</h2>
      <p>Xin chao <strong>{{customerName}}</strong>,</p>
      <p>Rat tiec khi thong bao rang don hang <strong>#{{orderNumber}}</strong> cua ban da bi huy.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Ly do huy:</span> {{cancellationReason}}</div>
      <hr class="divider" />
      <p>Neu ban da thanh toan, tien se duoc hoan lai trong vong 5-7 ngay lam viec.</p>`),
    variables: ['customerName', 'orderNumber', 'cancellationReason'],
    isDefault: true,
  },
  {
    name: 'Welcome',
    slug: 'welcome',
    type: 'welcome',
    subject: 'Welcome to {{siteName}}, {{customerName}}!',
    subjectVi: 'Chao mung ban den voi {{siteName}}, {{customerName}}!',
    body: layout('Welcome',
      `      <h2>Welcome to {{siteName}}!</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>Thank you for creating an account with us. We're excited to have you on board!</p>
      <p>Start exploring our wide range of products and enjoy exclusive offers for new members.</p>
      <a href="{{loginUrl}}" class="btn">Start Shopping</a>
      <p style="margin-top:24px;">If you did not create this account, please ignore this email.</p>`),
    bodyVi: layout('Chao mung',
      `      <h2>Chao mung den voi {{siteName}}!</h2>
      <p>Xin chao <strong>{{customerName}}</strong>,</p>
      <p>Cam on ban da tao tai khoan. Chung toi rat vui khi co ban dong hanh!</p>
      <p>Kham pha hang nghin san pham va tan huong uu dai danh rieng cho thanh vien moi.</p>
      <a href="{{loginUrl}}" class="btn">Mua sam ngay</a>`),
    variables: ['customerName', 'siteName', 'loginUrl'],
    isDefault: true,
  },
  {
    name: 'Password Reset',
    slug: 'password-reset',
    type: 'password-reset',
    subject: 'Reset your password',
    subjectVi: 'Dat lai mat khau cua ban',
    body: layout('Password Reset',
      `      <h2>Password Reset Request</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <a href="{{resetLink}}" class="btn">Reset Password</a>
      <p style="margin-top:24px;">This link expires in <strong>{{expiryTime}}</strong>.</p>
      <p>If you did not request a password reset, you can safely ignore this email — your password will not change.</p>`),
    bodyVi: layout('Dat lai mat khau',
      `      <h2>Yeu cau dat lai mat khau</h2>
      <p>Xin chao <strong>{{customerName}}</strong>,</p>
      <p>Chung toi nhan duoc yeu cau dat lai mat khau cua ban. Nhan vao nut ben duoi de chon mat khau moi.</p>
      <a href="{{resetLink}}" class="btn">Dat lai mat khau</a>
      <p style="margin-top:24px;">Lien ket nay het han sau <strong>{{expiryTime}}</strong>.</p>
      <p>Neu ban khong yeu cau dieu nay, hay bo qua email nay.</p>`),
    variables: ['customerName', 'resetLink', 'expiryTime'],
    isDefault: true,
  },
  {
    name: 'Vendor Application Received',
    slug: 'vendor-application',
    type: 'vendor-application',
    subject: 'Vendor Application Received — {{storeName}}',
    subjectVi: 'Da nhan don dang ky nha ban hang — {{storeName}}',
    body: layout('Vendor Application Received',
      `      <h2>Application Received</h2>
      <p>Hi <strong>{{vendorName}}</strong>,</p>
      <p>Thank you for applying to become a vendor on Shofy!</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Store Name:</span> {{storeName}}</div>
      <div class="info-row"><span class="label">Application Date:</span> {{applicationDate}}</div>
      <hr class="divider" />
      <p>Our team will review your application and get back to you within 2-3 business days.</p>
      <p>If you have any questions, feel free to reach out to our vendor support team.</p>`),
    bodyVi: layout('Da nhan don dang ky nha ban hang',
      `      <h2>Don dang ky da duoc nhan</h2>
      <p>Xin chao <strong>{{vendorName}}</strong>,</p>
      <p>Cam on ban da dang ky tro thanh nha ban hang tren Shofy!</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Ten cua hang:</span> {{storeName}}</div>
      <div class="info-row"><span class="label">Ngay dang ky:</span> {{applicationDate}}</div>
      <hr class="divider" />
      <p>Doi ngu cua chung toi se xem xet don cua ban trong vong 2-3 ngay lam viec.</p>`),
    variables: ['vendorName', 'storeName', 'applicationDate'],
    isDefault: true,
  },
  {
    name: 'Vendor Approved',
    slug: 'vendor-approved',
    type: 'vendor-approved',
    subject: 'Congratulations! Your vendor application for {{storeName}} has been approved',
    subjectVi: 'Chuc mung! Don dang ky cua {{storeName}} da duoc phe duyet',
    body: layout('Vendor Approved',
      `      <h2>Your Vendor Application is Approved!</h2>
      <p>Hi <strong>{{vendorName}}</strong>,</p>
      <p>We are delighted to inform you that your vendor application for <strong>{{storeName}}</strong> has been approved!</p>
      <p>You can now log in to your vendor dashboard and start adding products.</p>
      <a href="{{dashboardUrl}}" class="btn">Go to Vendor Dashboard</a>
      <p style="margin-top:24px;">Welcome to the Shofy vendor community!</p>`),
    bodyVi: layout('Don dang ky nha ban hang duoc phe duyet',
      `      <h2>Don dang ky nha ban hang da duoc phe duyet!</h2>
      <p>Xin chao <strong>{{vendorName}}</strong>,</p>
      <p>Chung toi vui mung thong bao rang don dang ky cua <strong>{{storeName}}</strong> da duoc phe duyet!</p>
      <p>Ban co the dang nhap vao trang quan tri nha ban hang va bat dau them san pham.</p>
      <a href="{{dashboardUrl}}" class="btn">Den trang quan tri</a>`),
    variables: ['vendorName', 'storeName', 'dashboardUrl'],
    isDefault: true,
  },
  {
    name: 'Low Stock Alert',
    slug: 'low-stock-alert',
    type: 'low-stock-alert',
    subject: 'Low Stock Alert — {{productTitle}}',
    subjectVi: 'Canh bao ton kho thap — {{productTitle}}',
    body: layout('Low Stock Alert',
      `      <h2>Low Stock Warning</h2>
      <p>This is an automated alert to inform you that the following product is running low on stock:</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Product:</span> {{productTitle}}</div>
      <div class="info-row"><span class="label">Current Stock:</span> {{currentStock}} units</div>
      <hr class="divider" />
      <p>Please restock this product to avoid running out.</p>
      <a href="{{productUrl}}" class="btn">View Product</a>`),
    bodyVi: layout('Canh bao ton kho thap',
      `      <h2>Canh bao ton kho thap</h2>
      <p>Day la canh bao tu dong ve san pham sap het hang:</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">San pham:</span> {{productTitle}}</div>
      <div class="info-row"><span class="label">Ton kho hien tai:</span> {{currentStock}} don vi</div>
      <hr class="divider" />
      <p>Vui long nhap them hang de tranh tinh trang het hang.</p>
      <a href="{{productUrl}}" class="btn">Xem san pham</a>`),
    variables: ['productTitle', 'currentStock', 'productUrl'],
    isDefault: true,
  },
];

// ── Migration ─────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n=== 14-seed-email-templates ===');
  console.log(`Target: ${UNIFIED_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let conn;
  try {
    conn = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to unified database\n');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  const col = conn.db.collection('emailtemplates');

  // Ensure indexes match the Mongoose model (unique slug + name, type, status)
  await col.createIndex({ name: 1 }, { unique: true, background: true });
  await col.createIndex({ slug: 1 }, { unique: true, background: true });
  await col.createIndex({ type: 1 }, { background: true });
  await col.createIndex({ status: 1 }, { background: true });
  await col.createIndex({ type: 1, isDefault: 1 }, { background: true });
  console.log('[OK] Indexes ensured\n');

  let created = 0;
  let skipped = 0;

  for (const tmpl of templates) {
    const existing = await col.findOne({ slug: tmpl.slug });
    if (existing) {
      console.log(`  [SKIP] ${tmpl.slug} — already exists (id: ${existing._id})`);
      skipped++;
    } else {
      const now = new Date();
      await col.insertOne({ ...tmpl, status: 'active', __v: 0, createdAt: now, updatedAt: now });
      console.log(`  [CREATED] ${tmpl.slug}`);
      created++;
    }
  }

  await conn.close();

  console.log(`\n[DONE] Email templates — ${created} created, ${skipped} already existed.`);
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
