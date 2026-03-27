const jwt = require("jsonwebtoken");
const jwksRsa = require("jwks-rsa");
const { keycloakConfig } = require("../config/keycloak");
const User = require("../model/User");

const ROLE_PRIORITY = ["admin", "manager", "staff", "shipper", "vendor", "user"];

// JWKS client with caching (matches MediaSoft pattern)
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 30,
  jwksUri: keycloakConfig.jwksUri,
});

function getSigningKey(header) {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
}

module.exports = async (req, res, next) => {
  try {
    const token = req.headers?.authorization?.split(" ")?.[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        error: "You are not logged in",
      });
    }

    // Decode header to get kid for JWKS lookup
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
      return res.status(401).json({
        status: "fail",
        error: "Invalid token format",
      });
    }

    // Verify with RS256 public key from Keycloak JWKS
    const publicKey = await getSigningKey(decoded.header);
    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: keycloakConfig.authority,
    });

    // Map Keycloak token claims to req.user
    // Merge both realm roles AND all client-level roles so 'shipper' is found regardless of how it was configured
    // Normalize to lowercase to avoid case-sensitivity issues (e.g., 'Shipper' vs 'shipper')
    const realmRoles = (payload.realm_access?.roles || []).map(r => r.toLowerCase());
    const clientRoles = Object.values(payload.resource_access || {}).flatMap(c => (c.roles || []).map(r => r.toLowerCase()));
    const allRoles = [...new Set([...realmRoles, ...clientRoles])];
    const primaryRole =
      ROLE_PRIORITY.find((r) => allRoles.includes(r.toLowerCase())) || "user";

    // Build the best display name from available Keycloak token fields
    const tokenName = payload.name
      || [payload.given_name, payload.family_name].filter(Boolean).join(' ')
      || payload.preferred_username
      || payload.email
      || 'Unknown';

    req.user = {
      keycloakId: payload.sub,
      email: payload.email,
      name: tokenName,
      roles: allRoles,
      role: primaryRole,
    };

    console.log(`[Auth] Token verified for: ${payload.email} (sub: ${payload.sub}, role: ${primaryRole})`);

    // Resolve MongoDB user (find or auto-create on first login)
    let mongoUser = await User.findOne({ keycloakId: payload.sub });

    const expectedName = req.user.name || payload.email;

    if (!mongoUser) {
      // Try by email (for users migrated via migrate-users-to-keycloak.js
      // whose keycloakId hasn't been set yet).
      // ONLY link if the existing record was explicitly migrated — i.e. it
      // does NOT already have a different keycloakId and it has NO password
      // (Keycloak-managed users don't store passwords in MongoDB).
      const existingByEmail = await User.findOne({ email: payload.email });

      if (existingByEmail && !existingByEmail.keycloakId && !existingByEmail.password) {
        // Legitimate migrated user — link Keycloak identity
        mongoUser = existingByEmail;
      } else if (existingByEmail && existingByEmail.keycloakId && existingByEmail.keycloakId !== payload.sub) {
        // Email belongs to a DIFFERENT Keycloak user — don't hijack their record.
        // Create a new record with a slightly modified email to avoid unique constraint.
        console.warn(`[Auth] Email ${payload.email} already linked to keycloakId ${existingByEmail.keycloakId}. Creating separate record.`);
        mongoUser = await User.create({
          name: expectedName,
          email: `${payload.sub}@keycloak.local`,
          keycloakId: payload.sub,
          role: primaryRole,
          status: "active",
          emailVerified: payload.email_verified || false,
          lastLogin: new Date(),
        });
      } else if (!existingByEmail) {
        // Brand new user — create fresh MongoDB record
        console.log(`[Auth] Creating new MongoDB user for: ${payload.email} (keycloakId: ${payload.sub})`);
        mongoUser = await User.create({
          name: expectedName,
          email: payload.email,
          keycloakId: payload.sub,
          role: primaryRole,
          status: "active",
          emailVerified: payload.email_verified || false,
          lastLogin: new Date(),
        });
      } else {
        // Existing record has a password (seed data / legacy local auth) —
        // do NOT auto-link. Create fresh record for this Keycloak user.
        console.warn(`[Auth] Email ${payload.email} belongs to a legacy/seed user. Creating fresh record for Keycloak user.`);
        mongoUser = await User.create({
          name: expectedName,
          email: `${payload.sub}@keycloak.local`,
          keycloakId: payload.sub,
          role: primaryRole,
          status: "active",
          emailVerified: payload.email_verified || false,
          lastLogin: new Date(),
        });
      }
    }

    // ── Full sync: Keycloak → MongoDB (runs for ALL existing users) ──
    let needsSave = false;

    // Link keycloakId if missing (email-fallback users, seed data)
    if (!mongoUser.keycloakId) {
      mongoUser.keycloakId = payload.sub;
      needsSave = true;
    }

    // Sync name (only if token provides a real name)
    if (expectedName !== 'Unknown' && mongoUser.name !== expectedName) {
      mongoUser.name = expectedName;
      needsSave = true;
    } else if (mongoUser.name && mongoUser.name !== 'Unknown') {
      // If token has "Unknown" but DB has a real name, keep the DB name
      req.user.name = mongoUser.name;
    }

    // Sync role if changed in Keycloak
    if (mongoUser.role !== primaryRole) {
      mongoUser.role = primaryRole;
      needsSave = true;
    }

    // Sync email if changed in Keycloak
    if (payload.email && mongoUser.email !== payload.email) {
      mongoUser.email = payload.email;
      needsSave = true;
    }

    // Sync emailVerified from Keycloak token
    if (payload.email_verified !== undefined && mongoUser.emailVerified !== payload.email_verified) {
      mongoUser.emailVerified = payload.email_verified;
      needsSave = true;
    }

    // Update lastLogin timestamp
    mongoUser.lastLogin = new Date();
    needsSave = true;

    if (needsSave) {
      await mongoUser.save({ validateBeforeSave: false });
    }

    // Check if user is blocked or inactive
    if (mongoUser.status === "blocked") {
      return res.status(403).json({
        status: "fail",
        error: "Your account has been blocked. Please contact support.",
      });
    }
    if (mongoUser.status === "inactive") {
      return res.status(403).json({
        status: "fail",
        error: "Your account is inactive. Please verify your email.",
      });
    }

    // Preserve MongoDB ObjectId for backward compatibility with order queries
    req.user._id = mongoUser._id;
    req.user.mongoId = mongoUser._id;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "fail",
        error: "Token expired",
      });
    }
    console.error("[Auth] Token verification failed:", error.name, error.message, error.code, error.stack?.split('\n')[1]);
    res.status(403).json({
      status: "fail",
      error: "Invalid token",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
