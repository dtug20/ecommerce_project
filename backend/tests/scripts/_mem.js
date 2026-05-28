const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mem;
async function startMem() {
  mem = await MongoMemoryServer.create({ instance: { startupTimeoutMS: 120000 } });
  await mongoose.connect(mem.getUri(), { dbName: 'shofy_test' });
  return mongoose.connection;
}
async function stopMem() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (mem) await mem.stop();
}
module.exports = { startMem, stopMem, mongoose };
