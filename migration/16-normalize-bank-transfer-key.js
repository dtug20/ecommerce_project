/**
 * Migration 16: normalize 'bank_transfer' → 'bank-transfer' in
 * SiteSetting.payment.enabledGateways.
 *
 * Reason: backend (paymentService) and frontend (checkout) use the
 * hyphenated form; the CRM previously stored the underscore form,
 * so the gateway never matched.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   node migration/16-normalize-bank-transfer-key.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI not set (looked in backend/.env)');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[migration 16] connected to', mongoose.connection.name);

  const result = await mongoose.connection.collection('sitesettings').updateMany(
    { 'payment.enabledGateways': 'bank_transfer' },
    { $set: { 'payment.enabledGateways.$': 'bank-transfer' } }
  );

  console.log('[migration 16] matched:', result.matchedCount, 'modified:', result.modifiedCount);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[migration 16] failed:', err);
  process.exit(1);
});
