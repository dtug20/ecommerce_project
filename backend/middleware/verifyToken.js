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

    // Resolve MongoDB user (find or auto-create on first login)
    let mongoUser = await User.findOne({ keycloakId: payload.sub });

    const expectedName = req.user.name || payload.email;

    if (!mongoUser) {
      // Try by email (for migrated users whose keycloakId hasn't been set yet)
      mongoUser = await User.findOne({ email: payload.email });
      if (mongoUser) {
        // Link Keycloak identity but preserve existing status (don't reactivate blocked users)
        mongoUser.keycloakId = payload.sub;
        if (mongoUser.name !== expectedName) mongoUser.name = expectedName;
        await mongoUser.save({ validateBeforeSave: false });
      } else {
        // Auto-create MongoDB user record on first Keycloak login
        mongoUser = await User.create({
          name: expectedName,
          email: payload.email,
          keycloakId: payload.sub,
          role: primaryRole,
          status: "active",
        });
      }
    } else {
      // Continuously sync Keycloak profile changes down to the local MongoDB replica
      // Only sync if the token provides a real name (not "Unknown"), or if the DB currently has no name
      if (expectedName !== 'Unknown' && mongoUser.name !== expectedName) {
        mongoUser.name = expectedName;
        await mongoUser.save({ validateBeforeSave: false });
      } else if (mongoUser.name && mongoUser.name !== 'Unknown') {
        // If token has "Unknown" but DB has a real name, keep the DB name
        req.user.name = mongoUser.name;
      }
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
    console.error("[Auth] Token verification failed:", error.name, error.message, error.code);
    res.status(403).json({
      status: "fail",
      error: "Invalid token",
    });
  }
};
