/**
 * Migration 17: backfill SiteSetting.payment.bankTransfer.vietqrBankBin from
 * bankName for records configured before the VietQR auto-generation feature.
 *
 * Looks up each record's bankName against the VN_BANKS map (mirrored from
 * crm/crm-ui/src/features/settings/vnBanks.ts) and sets the BIN if a match
 * is found. Records whose bankName doesn't match any known bank are left
 * alone (admin can pick from the new CRM dropdown).
 *
 * Idempotent — re-running skips records that already have a BIN.
 *
 * Usage:
 *   cd backend && node ../migration/17-backfill-vietqr-bank-bin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const SiteSetting = require('../backend/model/SiteSetting');

const VN_BANKS = [
  ['Vietcombank', '970436'],
  ['Techcombank', '970407'],
  ['MB Bank', '970422'],
  ['BIDV', '970418'],
  ['Vietinbank', '970415'],
  ['Agribank', '970405'],
  ['VPBank', '970432'],
  ['ACB', '970416'],
  ['TPBank', '970423'],
  ['Sacombank', '970403'],
  ['HDBank', '970437'],
  ['SHB', '970443'],
  ['VIB', '970441'],
  ['LPBank', '970449'],
  ['OCB', '970448'],
  ['SeABank', '970440'],
  ['Eximbank', '970431'],
  ['MSB', '970426'],
  ['NCB', '970419'],
  ['BacABank', '970409'],
  ['VietBank', '970433'],
  ['PVcomBank', '970412'],
  ['KienLongBank', '970452'],
  ['ABBANK', '970425'],
  ['BVBank', '970454'],
  ['Saigonbank', '970400'],
  ['BaoVietBank', '970438'],
  ['NamABank', '970428'],
  ['DongABank', '970406'],
  ['SCB', '970429'],
  ['ShinhanBank', '970424'],
  ['UOB', '970458'],
  ['HongLeong', '970442'],
];

function lookupBin(bankName) {
  if (!bankName) return null;
  const needle = String(bankName).toLowerCase();
  const hit = VN_BANKS.find(([name]) => name.toLowerCase() === needle);
  return hit ? hit[1] : null;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[migration 17] connected to', mongoose.connection.name);

  const docs = await SiteSetting.find({
    'payment.bankTransfer.bankName': { $ne: '' },
    $or: [
      { 'payment.bankTransfer.vietqrBankBin': { $exists: false } },
      { 'payment.bankTransfer.vietqrBankBin': '' },
    ],
  });

  let updated = 0;
  for (const doc of docs) {
    const bin = lookupBin(doc.payment?.bankTransfer?.bankName);
    if (!bin) {
      console.log('[migration 17] skip — unknown bankName:', doc.payment?.bankTransfer?.bankName);
      continue;
    }
    doc.payment.bankTransfer.vietqrBankBin = bin;
    await doc.save();
    updated++;
    console.log('[migration 17] updated', doc._id, 'bankName=', doc.payment.bankTransfer.bankName, 'bin=', bin);
  }

  console.log('[migration 17] candidates:', docs.length, 'updated:', updated);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[migration 17] failed:', err);
  process.exit(1);
});
