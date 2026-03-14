<html>
<body style="margin:0; padding:0; font-family:'Jost', 'Segoe UI', Tahoma, sans-serif; background-color:#f8faff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8faff; padding:40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.06); overflow:hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #010F1C 0%, #1a2a3c 100%); padding:32px 40px; text-align:center;">
                            <span style="font-size:28px; font-weight:700; color:#ffffff; letter-spacing:1px;">Shofy</span>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="font-size:16px; color:#010F1C; margin:0 0 16px; font-weight:500;">
                                ${msg("emailVerificationGreeting")} <strong>${user.firstName!user.username}</strong>,
                            </p>

                            <p style="font-size:15px; color:#55585B; margin:0 0 24px; line-height:1.6;">
                                ${msg("emailVerificationAccountCreated", user.username)?no_esc}
                            </p>

                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                                <tr>
                                    <td style="background-color:#0989FF; border-radius:8px; padding:14px 36px; text-align:center;">
                                        <a href="${link}" style="color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; display:inline-block;">
                                            ${msg("emailVerificationButtonText")}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size:13px; color:#767A7D; margin:0 0 8px; line-height:1.5;">
                                ${msg("emailVerificationExpiry")} <strong>${linkExpirationFormatter(linkExpiration)}</strong>.
                            </p>

                            <p style="font-size:13px; color:#767A7D; margin:0;">
                                ${msg("emailVerificationIgnore")}
                            </p>

                            <hr style="border:none; border-top:1px solid #EAEBED; margin:28px 0 16px;" />
                            <p style="font-size:12px; color:#A0A2A4; margin:0; text-align:center;">
                                Shofy E-Commerce &copy; 2024
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
