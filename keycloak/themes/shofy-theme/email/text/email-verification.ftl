${msg("emailVerificationGreeting")} ${user.firstName!user.username},

${msg("emailVerificationAccountCreatedText", user.username)}

${link}

${msg("emailVerificationExpiry")} ${linkExpirationFormatter(linkExpiration)}.

${msg("emailVerificationIgnore")}
