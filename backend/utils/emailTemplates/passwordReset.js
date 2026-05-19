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
  en: () => 'Reset your password',
  vi: () => 'Đặt lại mật khẩu của bạn',
};

const bodies = {
  en: (d) => layout(
    'Password Reset',
    `      <h2>Password Reset Request</h2>
      <p>Hi <strong>${d.customerName}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <a href="${d.resetLink}" class="btn">Reset Password</a>
      <p style="margin-top:24px;">This link expires in <strong>${d.expiryTime}</strong>.</p>
      <p>If you did not request a password reset, you can safely ignore this email — your password will not change.</p>`
  ),
  vi: (d) => layout(
    'Đặt lại mật khẩu',
    `      <h2>Yêu cầu đặt lại mật khẩu</h2>
      <p>Xin chào <strong>${d.customerName}</strong>,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấn vào nút bên dưới để chọn mật khẩu mới.</p>
      <a href="${d.resetLink}" class="btn">Đặt lại mật khẩu</a>
      <p style="margin-top:24px;">Liên kết này hết hạn sau <strong>${d.expiryTime}</strong>.</p>
      <p>Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>`
  ),
};

module.exports = {
  subject: (data = {}, lang = 'en') => (subjects[lang] || subjects.en)(data),
  html:    (data = {}, lang = 'en') => (bodies[lang]   || bodies.en)(data),
};
