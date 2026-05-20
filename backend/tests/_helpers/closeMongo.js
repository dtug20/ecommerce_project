// Shared teardown for test suites that import ../index.js — closes the
// long-lived mongoose connection so Jest workers exit cleanly. Idempotent: a
// no-op if the connection was already torn down (e.g. by a suite that manages
// its own mongo-memory-server).
const mongoose = require('mongoose');

module.exports = async function closeMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
