${msg("passwordResetGreeting")} ${user.firstName!user.username},

${msg("passwordResetDescriptionText")}

${link}

${msg("passwordResetExpiry")} ${linkExpirationFormatter(linkExpiration)}.

${msg("passwordResetIgnore")}
