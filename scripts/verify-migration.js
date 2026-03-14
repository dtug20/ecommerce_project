/**
 * Verify that all MongoDB users/admins with keycloakId exist in Keycloak
 * and have correct role mappings.
 *
 * Usage:
 *   node scripts/verify-migration.js
 */

const path = require("path");
const backendDir = path.join(__dirname, "..", "backend");

require(path.join(backendDir, "node_modules", "dotenv")).config({
  path: path.join(backendDir, ".env"),
});

const Module = require("module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  try {
    return originalResolve.call(this, request, parent, ...args);
  } catch (e) {
    return originalResolve.call(this, request, { ...parent, paths: [path.join(backendDir, "node_modules")] }, ...args);
  }
};

const mongoose = require("mongoose");
const User = require("../backend/model/User");
const Admin = require("../backend/model/Admin");
const keycloakService = require("../backend/services/keycloak.service");

const ADMIN_ROLE_MAP = {
  Admin: "admin",
  "Super Admin": "admin",
  Manager: "manager",
  CEO: "manager",
};

const issues = [];

async function verifyUsers() {
  const users = await User.find({});
  let withKc = 0;
  let withoutKc = 0;

  console.log(`\n[Users] Checking ${users.length} records...`);

  for (const user of users) {
    if (!user.keycloakId) {
      withoutKc++;
      issues.push(`User ${user.email} (${user._id}) has no keycloakId — not migrated`);
      continue;
    }

    withKc++;
    try {
      const kcUser = await keycloakService.findUserById(user.keycloakId);

      // Check email matches
      if (kcUser.email?.toLowerCase() !== user.email?.toLowerCase()) {
        issues.push(
          `User ${user.email}: email mismatch — KC has "${kcUser.email}"`
        );
      }

      // Check mongoId attribute
      const mongoIdAttr = kcUser.attributes?.mongoId?.[0];
      if (mongoIdAttr !== user._id.toString()) {
        issues.push(
          `User ${user.email}: mongoId attribute mismatch — KC has "${mongoIdAttr}", expected "${user._id}"`
        );
      }

      // Check role mapping
      const kcClient = await keycloakService.getAdminClient();
      const roleMappings = await kcClient.users.listRealmRoleMappings({
        id: user.keycloakId,
      });
      const roleNames = roleMappings.map((r) => r.name);
      const expectedRole = user.role === "admin" ? "admin" : "user";
      if (!roleNames.includes(expectedRole)) {
        issues.push(
          `User ${user.email}: missing expected role "${expectedRole}" — has [${roleNames.join(", ")}]`
        );
      }

      console.log(`  [OK] ${user.email} — ${user.keycloakId}`);
    } catch (err) {
      issues.push(
        `User ${user.email}: Keycloak lookup failed for ${user.keycloakId} — ${err.message}`
      );
    }
  }

  console.log(`  ${withKc} with keycloakId, ${withoutKc} without`);
}

async function verifyAdmins() {
  const admins = await Admin.find({});
  let withKc = 0;
  let withoutKc = 0;

  console.log(`\n[Admins] Checking ${admins.length} records...`);

  for (const admin of admins) {
    if (!admin.keycloakId) {
      withoutKc++;
      issues.push(`Admin ${admin.email} (${admin._id}) has no keycloakId — not migrated`);
      continue;
    }

    withKc++;
    try {
      const kcUser = await keycloakService.findUserById(admin.keycloakId);

      // Check email matches
      if (kcUser.email?.toLowerCase() !== admin.email?.toLowerCase()) {
        issues.push(
          `Admin ${admin.email}: email mismatch — KC has "${kcUser.email}"`
        );
      }

      // Check mongoId attribute
      const mongoIdAttr = kcUser.attributes?.mongoId?.[0];
      if (mongoIdAttr !== admin._id.toString()) {
        issues.push(
          `Admin ${admin.email}: mongoId attribute mismatch — KC has "${mongoIdAttr}", expected "${admin._id}"`
        );
      }

      // Check role mapping
      const kcClient = await keycloakService.getAdminClient();
      const roleMappings = await kcClient.users.listRealmRoleMappings({
        id: admin.keycloakId,
      });
      const roleNames = roleMappings.map((r) => r.name);
      const expectedRole = ADMIN_ROLE_MAP[admin.role] || "staff";
      if (!roleNames.includes(expectedRole)) {
        issues.push(
          `Admin ${admin.email}: missing expected role "${expectedRole}" — has [${roleNames.join(", ")}]`
        );
      }

      console.log(`  [OK] ${admin.email} — ${admin.keycloakId}`);
    } catch (err) {
      issues.push(
        `Admin ${admin.email}: Keycloak lookup failed for ${admin.keycloakId} — ${err.message}`
      );
    }
  }

  console.log(`  ${withKc} with keycloakId, ${withoutKc} without`);
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set. Check backend/.env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");

  console.log("Authenticating with Keycloak admin API...");
  await keycloakService.authenticateAdmin();
  console.log("Authenticated.");

  console.log("\n========================================");
  console.log("  Migration Verification");
  console.log("========================================");

  await verifyUsers();
  await verifyAdmins();

  console.log("\n========================================");
  console.log("  Verification Results");
  console.log("========================================");

  if (issues.length === 0) {
    console.log("  All checks passed! Migration is consistent.");
  } else {
    console.log(`  ${issues.length} issue(s) found:\n`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  }

  console.log("========================================\n");

  await mongoose.disconnect();
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
