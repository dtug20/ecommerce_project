/**
 * Migrate existing MongoDB users (User + Admin) to Keycloak.
 *
 * For each record the script:
 *  1. Creates a Keycloak user (username = email)
 *  2. Assigns the matching realm role
 *  3. Sets requiredActions: UPDATE_PASSWORD + VERIFY_EMAIL
 *  4. Stores the MongoDB _id as a Keycloak user attribute (mongoId)
 *  5. Updates the MongoDB record with the new keycloakId
 *
 * Usage:
 *   node scripts/migrate-users-to-keycloak.js
 *
 * Env vars are loaded from backend/.env via backend/config/keycloak.js
 */

const path = require("path");
const backendDir = path.join(__dirname, "..", "backend");

// Load dotenv from backend's node_modules
require(path.join(backendDir, "node_modules", "dotenv")).config({
  path: path.join(backendDir, ".env"),
});

// Resolve backend dependencies from backend's node_modules
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

// Map Admin.role → Keycloak realm role
const ADMIN_ROLE_MAP = {
  Admin: "admin",
  "Super Admin": "admin",
  Manager: "manager",
  CEO: "manager",
};

const stats = {
  users: { total: 0, migrated: 0, skipped: 0, errors: 0 },
  admins: { total: 0, migrated: 0, skipped: 0, errors: 0 },
};

async function migrateUsers() {
  const users = await User.find({});
  stats.users.total = users.length;
  console.log(`\n[Users] Found ${users.length} users to migrate`);

  for (const user of users) {
    try {
      // Skip if already migrated
      if (user.keycloakId) {
        console.log(`  [SKIP] ${user.email} — already has keycloakId ${user.keycloakId}`);
        stats.users.skipped++;
        continue;
      }

      // Check if user already exists in Keycloak (e.g. from a previous partial run)
      const existing = await keycloakService.findUserByEmail(user.email);
      if (existing) {
        console.log(`  [LINK] ${user.email} — found existing Keycloak user ${existing.id}`);
        user.keycloakId = existing.id;
        await user.save();
        stats.users.migrated++;
        continue;
      }

      // Create in Keycloak
      const keycloakUserId = await keycloakService.createUser({
        username: user.email,
        email: user.email,
        firstName: user.name || user.email.split("@")[0],
        enabled: user.status === "active",
        emailVerified: false,
        requiredActions: ["UPDATE_PASSWORD", "VERIFY_EMAIL"],
        attributes: {
          mongoId: [user._id.toString()],
        },
      });

      // Assign realm role
      const role = user.role === "admin" ? "admin" : "user";
      await keycloakService.assignRealmRole(keycloakUserId, role);

      // Update MongoDB
      user.keycloakId = keycloakUserId;
      await user.save();

      console.log(`  [OK] ${user.email} → ${keycloakUserId} (role: ${role})`);
      stats.users.migrated++;
    } catch (err) {
      console.error(`  [ERR] ${user.email}: ${err.message}`);
      stats.users.errors++;
    }
  }
}

async function migrateAdmins() {
  const admins = await Admin.find({});
  stats.admins.total = admins.length;
  console.log(`\n[Admins] Found ${admins.length} admins to migrate`);

  for (const admin of admins) {
    try {
      // Skip if already migrated
      if (admin.keycloakId) {
        console.log(`  [SKIP] ${admin.email} — already has keycloakId ${admin.keycloakId}`);
        stats.admins.skipped++;
        continue;
      }

      // Check if already exists in Keycloak
      const existing = await keycloakService.findUserByEmail(admin.email);
      if (existing) {
        console.log(`  [LINK] ${admin.email} — found existing Keycloak user ${existing.id}`);
        admin.keycloakId = existing.id;
        await admin.save();
        stats.admins.migrated++;
        continue;
      }

      // Create in Keycloak
      const keycloakUserId = await keycloakService.createUser({
        username: admin.email,
        email: admin.email,
        firstName: admin.name || admin.email.split("@")[0],
        enabled: admin.status === "Active",
        emailVerified: false,
        requiredActions: ["UPDATE_PASSWORD", "VERIFY_EMAIL"],
        attributes: {
          mongoId: [admin._id.toString()],
        },
      });

      // Assign realm role
      const keycloakRole = ADMIN_ROLE_MAP[admin.role] || "staff";
      await keycloakService.assignRealmRole(keycloakUserId, keycloakRole);

      // Update MongoDB
      admin.keycloakId = keycloakUserId;
      await admin.save();

      console.log(`  [OK] ${admin.email} → ${keycloakUserId} (role: ${keycloakRole})`);
      stats.admins.migrated++;
    } catch (err) {
      console.error(`  [ERR] ${admin.email}: ${err.message}`);
      stats.admins.errors++;
    }
  }
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
  console.log("Authenticated.\n");

  console.log("========================================");
  console.log("  Keycloak User Migration");
  console.log("========================================");

  await migrateUsers();
  await migrateAdmins();

  console.log("\n========================================");
  console.log("  Migration Summary");
  console.log("========================================");
  console.log(`  Users:  ${stats.users.migrated} migrated, ${stats.users.skipped} skipped, ${stats.users.errors} errors (${stats.users.total} total)`);
  console.log(`  Admins: ${stats.admins.migrated} migrated, ${stats.admins.skipped} skipped, ${stats.admins.errors} errors (${stats.admins.total} total)`);
  console.log("========================================\n");

  await mongoose.disconnect();
  console.log("Done.");
  process.exit(stats.users.errors + stats.admins.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
