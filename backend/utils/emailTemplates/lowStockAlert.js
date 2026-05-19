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
  en: (d) => `Low Stock Alert — ${d.productTitle}`,
  vi: (d) => `Cảnh báo tồn kho thấp — ${d.productTitle}`,
};

const bodies = {
  en: (d) => layout(
    'Low Stock Alert',
    `      <h2>Low Stock Warning</h2>
      <p>This is an automated alert to inform you that the following product is running low on stock:</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Product:</span> ${d.productTitle}</div>
      <div class="info-row"><span class="label">Current Stock:</span> ${d.currentStock} units</div>
      <hr class="divider" />
      <p>Please restock this product to avoid running out.</p>
      <a href="${d.productUrl}" class="btn">View Product</a>`
  ),
  vi: (d) => layout(
    'Cảnh báo tồn kho thấp',
    `      <h2>Cảnh báo tồn kho thấp</h2>
      <p>Đây là cảnh báo tự động về sản phẩm sắp hết hàng:</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Sản phẩm:</span> ${d.productTitle}</div>
      <div class="info-row"><span class="label">Tồn kho hiện tại:</span> ${d.currentStock} đơn vị</div>
      <hr class="divider" />
      <p>Vui lòng nhập thêm hàng để tránh tình trạng hết hàng.</p>
      <a href="${d.productUrl}" class="btn">Xem sản phẩm</a>`
  ),
};

module.exports = {
  subject: (data = {}, lang = 'en') => (subjects[lang] || subjects.en)(data),
  html:    (data = {}, lang = 'en') => (bodies[lang]   || bodies.en)(data),
};
