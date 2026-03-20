'use strict';

/**
 * Seed default email templates.
 *
 * Run standalone:
 *   node backend/seeds/email-templates.seed.js
 *
 * Or call seedEmailTemplates() from the main seed.js.
 *
 * Uses upsert by slug so it is safe to re-run without creating duplicates.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const EmailTemplate = require('../model/EmailTemplate');

// ── HTML layout helpers ────────────────────────────────────────────────────

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

// ── Template definitions ───────────────────────────────────────────────────

const templates = [
  // ── Order Confirmation ────────────────────────────────────────────────────
  {
    name: 'Order Confirmation',
    slug: 'order-confirmation',
    type: 'order-confirmation',
    subject: 'Order Confirmation — #{{orderNumber}}',
    subjectVi: 'Xác nhận đơn hàng — #{{orderNumber}}',
    body: layout(
      'Order Confirmation',
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
      <p>If you have any questions, please contact our support team.</p>`
    ),
    bodyVi: layout(
      'Xác nhận đơn hàng',
      `      <h2>Cảm ơn bạn đã đặt hàng!</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Mã đơn hàng:</span> #{{orderNumber}}</div>
      <div class="info-row"><span class="label">Ngày đặt hàng:</span> {{orderDate}}</div>
      <div class="info-row"><span class="label">Tổng tiền:</span> {{orderTotal}}</div>
      <div class="info-row"><span class="label">Địa chỉ giao hàng:</span> {{shippingAddress}}</div>
      <hr class="divider" />
      <p><strong>Sản phẩm đã đặt:</strong></p>
      <ul>{{itemsHtml}}</ul>
      <p>Chúng tôi sẽ gửi email cho bạn khi đơn hàng được giao đi.</p>`
    ),
    variables: ['customerName', 'orderNumber', 'orderTotal', 'orderDate', 'itemsHtml', 'shippingAddress'],
    isDefault: true,
  },

  // ── Order Shipped ─────────────────────────────────────────────────────────
  {
    name: 'Order Shipped',
    slug: 'order-shipped',
    type: 'order-shipped',
    subject: 'Your order #{{orderNumber}} has been shipped!',
    subjectVi: 'Đơn hàng #{{orderNumber}} đã được giao đi!',
    body: layout(
      'Order Shipped',
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
      <p style="margin-top:24px;">If you have questions about your shipment, please reply to this email.</p>`
    ),
    bodyVi: layout(
      'Đơn hàng đã được giao đi',
      `      <h2>Đơn hàng của bạn đang trên đường!</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Tin vui — đơn hàng của bạn đã được giao cho đơn vị vận chuyển.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Mã đơn hàng:</span> #{{orderNumber}}</div>
      <div class="info-row"><span class="label">Đơn vị vận chuyển:</span> {{carrier}}</div>
      <div class="info-row"><span class="label">Mã vận đơn:</span> {{trackingNumber}}</div>
      <div class="info-row"><span class="label">Ngày dự kiến nhận hàng:</span> {{estimatedDelivery}}</div>
      <hr class="divider" />
      <a href="{{trackingUrl}}" class="btn">Theo dõi đơn hàng</a>`
    ),
    variables: ['customerName', 'orderNumber', 'trackingNumber', 'carrier', 'trackingUrl', 'estimatedDelivery'],
    isDefault: true,
  },

  // ── Order Delivered ───────────────────────────────────────────────────────
  {
    name: 'Order Delivered',
    slug: 'order-delivered',
    type: 'order-delivered',
    subject: 'Your order #{{orderNumber}} has been delivered!',
    subjectVi: 'Đơn hàng #{{orderNumber}} đã được giao thành công!',
    body: layout(
      'Order Delivered',
      `      <h2>Your order has been delivered!</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We're happy to let you know that your order <strong>#{{orderNumber}}</strong> was delivered on <strong>{{deliveredDate}}</strong>.</p>
      <p>We hope you love your purchase! If anything is not right, please reach out to our support team within 30 days.</p>
      <p>Thank you for shopping with Shofy!</p>`
    ),
    bodyVi: layout(
      'Đơn hàng đã giao thành công',
      `      <h2>Đơn hàng đã được giao thành công!</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Đơn hàng <strong>#{{orderNumber}}</strong> của bạn đã được giao vào ngày <strong>{{deliveredDate}}</strong>.</p>
      <p>Chúc bạn hài lòng với sản phẩm! Nếu có vấn đề, vui lòng liên hệ bộ phận hỗ trợ trong vòng 30 ngày.</p>
      <p>Cảm ơn bạn đã mua sắm tại Shofy!</p>`
    ),
    variables: ['customerName', 'orderNumber', 'deliveredDate'],
    isDefault: true,
  },

  // ── Order Cancelled ───────────────────────────────────────────────────────
  {
    name: 'Order Cancelled',
    slug: 'order-cancelled',
    type: 'order-cancelled',
    subject: 'Your order #{{orderNumber}} has been cancelled',
    subjectVi: 'Đơn hàng #{{orderNumber}} đã bị hủy',
    body: layout(
      'Order Cancelled',
      `      <h2>Order Cancellation Notice</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We're sorry to inform you that your order <strong>#{{orderNumber}}</strong> has been cancelled.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Cancellation Reason:</span> {{cancellationReason}}</div>
      <hr class="divider" />
      <p>If you paid for this order, a refund will be processed within 5–7 business days.</p>
      <p>If you have any questions, please contact our support team.</p>`
    ),
    bodyVi: layout(
      'Hủy đơn hàng',
      `      <h2>Thông báo hủy đơn hàng</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Rất tiếc khi thông báo rằng đơn hàng <strong>#{{orderNumber}}</strong> của bạn đã bị hủy.</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Lý do hủy:</span> {{cancellationReason}}</div>
      <hr class="divider" />
      <p>Nếu bạn đã thanh toán, tiền sẽ được hoàn lại trong vòng 5–7 ngày làm việc.</p>`
    ),
    variables: ['customerName', 'orderNumber', 'cancellationReason'],
    isDefault: true,
  },

  // ── Welcome ───────────────────────────────────────────────────────────────
  {
    name: 'Welcome',
    slug: 'welcome',
    type: 'welcome',
    subject: 'Welcome to {{siteName}}, {{customerName}}!',
    subjectVi: 'Chào mừng bạn đến với {{siteName}}, {{customerName}}!',
    body: layout(
      'Welcome',
      `      <h2>Welcome to {{siteName}}!</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>Thank you for creating an account with us. We're excited to have you on board!</p>
      <p>Start exploring our wide range of products and enjoy exclusive offers for new members.</p>
      <a href="{{loginUrl}}" class="btn">Start Shopping</a>
      <p style="margin-top:24px;">If you did not create this account, please ignore this email.</p>`
    ),
    bodyVi: layout(
      'Chào mừng',
      `      <h2>Chào mừng đến với {{siteName}}!</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Cảm ơn bạn đã tạo tài khoản. Chúng tôi rất vui khi có bạn đồng hành!</p>
      <p>Khám phá hàng nghìn sản phẩm và tận hưởng ưu đãi dành riêng cho thành viên mới.</p>
      <a href="{{loginUrl}}" class="btn">Mua sắm ngay</a>`
    ),
    variables: ['customerName', 'siteName', 'loginUrl'],
    isDefault: true,
  },

  // ── Password Reset ────────────────────────────────────────────────────────
  {
    name: 'Password Reset',
    slug: 'password-reset',
    type: 'password-reset',
    subject: 'Reset your password',
    subjectVi: 'Đặt lại mật khẩu của bạn',
    body: layout(
      'Password Reset',
      `      <h2>Password Reset Request</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <a href="{{resetLink}}" class="btn">Reset Password</a>
      <p style="margin-top:24px;">This link expires in <strong>{{expiryTime}}</strong>.</p>
      <p>If you did not request a password reset, you can safely ignore this email — your password will not change.</p>`
    ),
    bodyVi: layout(
      'Đặt lại mật khẩu',
      `      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Xin chào <strong>{{customerName}}</strong>,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấn vào nút bên dưới để chọn mật khẩu mới.</p>
      <a href="{{resetLink}}" class="btn">Đặt lại mật khẩu</a>
      <p style="margin-top:24px;">Liên kết này hết hạn sau <strong>{{expiryTime}}</strong>.</p>
      <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>`
    ),
    variables: ['customerName', 'resetLink', 'expiryTime'],
    isDefault: true,
  },

  // ── Vendor Application ────────────────────────────────────────────────────
  {
    name: 'Vendor Application Received',
    slug: 'vendor-application',
    type: 'vendor-application',
    subject: 'Vendor Application Received — {{storeName}}',
    subjectVi: 'Đã nhận đơn đăng ký nhà bán hàng — {{storeName}}',
    body: layout(
      'Vendor Application Received',
      `      <h2>Application Received</h2>
      <p>Hi <strong>{{vendorName}}</strong>,</p>
      <p>Thank you for applying to become a vendor on Shofy!</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Store Name:</span> {{storeName}}</div>
      <div class="info-row"><span class="label">Application Date:</span> {{applicationDate}}</div>
      <hr class="divider" />
      <p>Our team will review your application and get back to you within 2–3 business days.</p>
      <p>If you have any questions, feel free to reach out to our vendor support team.</p>`
    ),
    bodyVi: layout(
      'Đã nhận đơn đăng ký nhà bán hàng',
      `      <h2>Đơn đăng ký đã được nhận</h2>
      <p>Xin chào <strong>{{vendorName}}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký trở thành nhà bán hàng trên Shofy!</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Tên cửa hàng:</span> {{storeName}}</div>
      <div class="info-row"><span class="label">Ngày đăng ký:</span> {{applicationDate}}</div>
      <hr class="divider" />
      <p>Đội ngũ của chúng tôi sẽ xem xét đơn của bạn trong vòng 2–3 ngày làm việc.</p>`
    ),
    variables: ['vendorName', 'storeName', 'applicationDate'],
    isDefault: true,
  },

  // ── Vendor Approved ───────────────────────────────────────────────────────
  {
    name: 'Vendor Approved',
    slug: 'vendor-approved',
    type: 'vendor-approved',
    subject: 'Congratulations! Your vendor application for {{storeName}} has been approved',
    subjectVi: 'Chúc mừng! Đơn đăng ký của {{storeName}} đã được phê duyệt',
    body: layout(
      'Vendor Approved',
      `      <h2>Your Vendor Application is Approved!</h2>
      <p>Hi <strong>{{vendorName}}</strong>,</p>
      <p>We are delighted to inform you that your vendor application for <strong>{{storeName}}</strong> has been approved!</p>
      <p>You can now log in to your vendor dashboard and start adding products.</p>
      <a href="{{dashboardUrl}}" class="btn">Go to Vendor Dashboard</a>
      <p style="margin-top:24px;">Welcome to the Shofy vendor community!</p>`
    ),
    bodyVi: layout(
      'Đơn đăng ký nhà bán hàng được phê duyệt',
      `      <h2>Đơn đăng ký nhà bán hàng đã được phê duyệt!</h2>
      <p>Xin chào <strong>{{vendorName}}</strong>,</p>
      <p>Chúng tôi vui mừng thông báo rằng đơn đăng ký của <strong>{{storeName}}</strong> đã được phê duyệt!</p>
      <p>Bạn có thể đăng nhập vào trang quản trị nhà bán hàng và bắt đầu thêm sản phẩm.</p>
      <a href="{{dashboardUrl}}" class="btn">Đến trang quản trị</a>`
    ),
    variables: ['vendorName', 'storeName', 'dashboardUrl'],
    isDefault: true,
  },

  // ── Low Stock Alert ───────────────────────────────────────────────────────
  {
    name: 'Low Stock Alert',
    slug: 'low-stock-alert',
    type: 'low-stock-alert',
    subject: 'Low Stock Alert — {{productTitle}}',
    subjectVi: 'Cảnh báo tồn kho thấp — {{productTitle}}',
    body: layout(
      'Low Stock Alert',
      `      <h2>Low Stock Warning</h2>
      <p>This is an automated alert to inform you that the following product is running low on stock:</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Product:</span> {{productTitle}}</div>
      <div class="info-row"><span class="label">Current Stock:</span> {{currentStock}} units</div>
      <hr class="divider" />
      <p>Please restock this product to avoid running out.</p>
      <a href="{{productUrl}}" class="btn">View Product</a>`
    ),
    bodyVi: layout(
      'Cảnh báo tồn kho thấp',
      `      <h2>Cảnh báo tồn kho thấp</h2>
      <p>Đây là cảnh báo tự động về sản phẩm sắp hết hàng:</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Sản phẩm:</span> {{productTitle}}</div>
      <div class="info-row"><span class="label">Tồn kho hiện tại:</span> {{currentStock}} đơn vị</div>
      <hr class="divider" />
      <p>Vui lòng nhập thêm hàng để tránh tình trạng hết hàng.</p>
      <a href="{{productUrl}}" class="btn">Xem sản phẩm</a>`
    ),
    variables: ['productTitle', 'currentStock', 'productUrl'],
    isDefault: true,
  },
];

// ── Seed function ──────────────────────────────────────────────────────────

async function seedEmailTemplates() {
  let ownConnection = false;

  if (mongoose.connection.readyState === 0) {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shofy';
    await mongoose.connect(MONGO_URI);
    ownConnection = true;
    console.log('[seed] Connected to MongoDB:', MONGO_URI);
  }

  let created = 0;
  let updated = 0;

  for (const tmpl of templates) {
    const result = await EmailTemplate.findOneAndUpdate(
      { slug: tmpl.slug },
      { $setOnInsert: tmpl },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // findOneAndUpdate with $setOnInsert returns the existing doc if it existed
    // We detect new vs existing by checking if updatedAt === createdAt
    const isNew =
      result.createdAt &&
      result.updatedAt &&
      Math.abs(result.createdAt - result.updatedAt) < 1000;
    if (isNew) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`[seed] Email templates — ${created} created, ${updated} already existed`);

  if (ownConnection) {
    await mongoose.disconnect();
    console.log('[seed] Disconnected from MongoDB');
  }
}

// ── Run as standalone script ───────────────────────────────────────────────

if (require.main === module) {
  seedEmailTemplates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] Error seeding email templates:', err);
      process.exit(1);
    });
}

module.exports = { seedEmailTemplates };
