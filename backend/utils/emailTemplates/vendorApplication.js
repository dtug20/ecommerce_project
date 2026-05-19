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
  en: (d) => `Vendor Application Received — ${d.storeName}`,
  vi: (d) => `Đã nhận đơn đăng ký nhà bán hàng — ${d.storeName}`,
};

const bodies = {
  en: (d) => layout(
    'Vendor Application Received',
    `      <h2>Application Received</h2>
      <p>Hi <strong>${d.vendorName}</strong>,</p>
      <p>Thank you for applying to become a vendor on Shofy!</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Store Name:</span> ${d.storeName}</div>
      <div class="info-row"><span class="label">Application Date:</span> ${d.applicationDate}</div>
      <hr class="divider" />
      <p>Our team will review your application and get back to you within 2–3 business days.</p>
      <p>If you have any questions, feel free to reach out to our vendor support team.</p>`
  ),
  vi: (d) => layout(
    'Đã nhận đơn đăng ký nhà bán hàng',
    `      <h2>Đơn đăng ký đã được nhận</h2>
      <p>Xin chào <strong>${d.vendorName}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký trở thành nhà bán hàng trên Shofy!</p>
      <hr class="divider" />
      <div class="info-row"><span class="label">Tên cửa hàng:</span> ${d.storeName}</div>
      <div class="info-row"><span class="label">Ngày đăng ký:</span> ${d.applicationDate}</div>
      <hr class="divider" />
      <p>Đội ngũ của chúng tôi sẽ xem xét đơn của bạn trong vòng 2–3 ngày làm việc.</p>`
  ),
};

module.exports = {
  subject: (data = {}, lang = 'en') => (subjects[lang] || subjects.en)(data),
  html:    (data = {}, lang = 'en') => (bodies[lang]   || bodies.en)(data),
};
