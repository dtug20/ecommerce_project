const jwt = require("jsonwebtoken");
const jwksRsa = require("jwks-rsa");
const { keycloakConfig } = require("../config/keycloak");
const User = require("../model/User");

const ROLE_PRIORITY = ["admin", "manager", "staff", "user"];

// JWKS client with caching (matches MediaSoft pattern)
const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
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
    const realmRoles = payload.realm_access?.roles || [];
    const primaryRole =
      ROLE_PRIORITY.find((r) => realmRoles.includes(r)) || "user";

    req.user = {
      keycloakId: payload.sub,
      email: payload.email,
      name: payload.preferred_username || payload.name || payload.given_name,
      roles: realmRoles,
      role: primaryRole,
    };

    // Resolve MongoDB user (find or auto-create on first login)
    let mongoUser = await User.findOne({ keycloakId: payload.sub });

    if (!mongoUser) {
      // Try by email (for migrated users whose keycloakId hasn't been set yet)
      mongoUser = await User.findOne({ email: payload.email });
      if (mongoUser) {
        mongoUser.keycloakId = payload.sub;
        mongoUser.status = "active";
        await mongoUser.save({ validateBeforeSave: false });
      } else {
        // Auto-create MongoDB user record on first Keycloak login
        mongoUser = await User.create({
          name: payload.name || payload.preferred_username || payload.email,
          email: payload.email,
          keycloakId: payload.sub,
          role: primaryRole,
          status: "active",
        });
      }
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
    console.error("[Auth] Token verification failed:", error.message);
    res.status(403).json({
      status: "fail",
      error: "Invalid token",
    });
  }
};
