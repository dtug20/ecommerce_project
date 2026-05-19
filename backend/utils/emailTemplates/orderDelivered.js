'use strict';

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

const subjects = {
  en: (d) => `Your order #${d.orderNumber} has been delivered!`,
  vi: (d) => `Đơn hàng #${d.orderNumber} đã được giao thành công!`,
};

const bodies = {
  en: (d) => layout(
    'Order Delivered',
    `      <h2>Your order has been delivered!</h2>
      <p>Hi <strong>${d.customerName}</strong>,</p>
      <p>We're happy to let you know that your order <strong>#${d.orderNumber}</strong> was delivered on <strong>${d.deliveredDate}</strong>.</p>
      <p>We hope you love your purchase! If anything is not right, please reach out to our support team within 30 days.</p>
      <p>Thank you for shopping with Shofy!</p>`
  ),
  vi: (d) => layout(
    'Đơn hàng đã giao thành công',
    `      <h2>Đơn hàng đã được giao thành công!</h2>
      <p>Xin chào <strong>${d.customerName}</strong>,</p>
      <p>Đơn hàng <strong>#${d.orderNumber}</strong> của bạn đã được giao vào ngày <strong>${d.deliveredDate}</strong>.</p>
      <p>Chúc bạn hài lòng với sản phẩm! Nếu có vấn đề, vui lòng liên hệ bộ phận hỗ trợ trong vòng 30 ngày.</p>
      <p>Cảm ơn bạn đã mua sắm tại Shofy!</p>`
  ),
};

module.exports = {
  subject: (data = {}, lang = 'en') => (subjects[lang] || subjects.en)(data),
  html:    (data = {}, lang = 'en') => (bodies[lang]   || bodies.en)(data),
};
