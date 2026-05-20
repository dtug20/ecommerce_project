// Closes the shared mongoose connection that index.js opens at boot. Without
// this, Jest warns "did not exit one second after the test run completed"
// because the Mongo connection stays open. Suites that manage their own
// connections (e.g. chatbot/* with mongodb-memory-server) clean up themselves;
// this teardown only catches the long-lived connection from connectDB().
const mongoose = require('mongoose');

module.exports = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
