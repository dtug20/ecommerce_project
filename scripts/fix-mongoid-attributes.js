/**
 * Fix mongoId attributes for already-migrated users in Keycloak.
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

async function main() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shofy";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  await keycloakService.authenticateAdmin();
  console.log("Authenticated with Keycloak.\n");

  const users = await User.find({ keycloakId: { $exists: true, $ne: null } });
  const admins = await Admin.find({ keycloakId: { $exists: true, $ne: null } });
  const all = [...users.map(u => ({ doc: u, type: "User" })), ...admins.map(a => ({ doc: a, type: "Admin" }))];

  console.log(`Found ${all.length} records to fix.\n`);

  for (const { doc, type } of all) {
    try {
      await keycloakService.updateUserAttributes(doc.keycloakId, {
        mongoId: [doc._id.toString()],
      });
      console.log(`  [OK] ${type} ${doc.email} — set mongoId=${doc._id}`);
    } catch (err) {
      console.log(`  [ERR] ${type} ${doc.email} — ${err.message}`);
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
