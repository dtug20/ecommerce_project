'use strict';

/**
 * 03-migrate-users.js
 *
 * Merges users from both source databases into unified.users.
 *
 * Merge rules:
 *   1. Backend (shofy) users are PRIMARY — their documents are the base.
 *   2. CRM (shofy_ecommerce) users are SECONDARY — matched on email
 *      (case-insensitive).
 *   3. For matched users: keep all backend fields; backfill CRM-only
 *      fields that are missing from the backend record.
 *   4. For CRM-only users (no email match in backend): insert as-is
 *      after applying the unified schema defaults.
 *   5. emailVerified is derived: true when status === 'active' (applies
 *      to CRM users that have no explicit emailVerified field).
 *   6. addresses defaults to [] when absent.
 *   7. vendorProfile is preserved from backend; undefined for CRM-only.
 *
 * Idempotency: uses replaceOne with upsert:true keyed on _id for backend
 * users and on email for CRM-only users so repeated runs are safe.
 *
 * Usage:
 *   SHOFY_URI=mongodb://...
 *   SHOFY_ECOMMERCE_URI=mongodb://...
 *   UNIFIED_URI=mongodb://...
 *   node migration/03-migrate-users.js
 */

const mongoose = require('mongoose');

const SHOFY_URI           = process.env.SHOFY_URI           || 'mongodb://127.0.0.1:27017/shofy';
const SHOFY_ECOMMERCE_URI = process.env.SHOFY_ECOMMERCE_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce';
const UNIFIED_URI         = process.env.UNIFIED_URI         || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 200;

// Fields that exist only in the CRM schema and should be backfilled
// onto a matched backend user if not already present.
const CRM_ONLY_FIELDS = [
  'confirmationToken',
  'confirmationTokenExpires',
  'passwordChangedAt',
  'passwordResetToken',
  'passwordResetExpires',
];

/**
 * Applies unified schema defaults to a raw document so every inserted
 * document has a consistent shape.
 */
function normaliseUser(doc) {
  const out = Object.assign({}, doc);

  // emailVerified: backends with status==='active' are considered verified
  if (out.emailVerified === undefined || out.emailVerified === null) {
    out.emailVerified = out.status === 'active';
  }

  // addresses array must always exist
  if (!Array.isArray(out.addresses)) {
    out.addresses = [];
  }

  // Role: CRM only has 'user'/'admin'; unified adds 'vendor'
  if (!['user', 'admin', 'vendor'].includes(out.role)) {
    out.role = 'user';
  }

  return out;
}

async function run() {
  console.log('\n=== 03-migrate-users ===');
  console.log(`Source backend : ${SHOFY_URI}`);
  console.log(`Source CRM     : ${SHOFY_ECOMMERCE_URI}`);
  console.log(`Target unified : ${UNIFIED_URI}`);
  console.log(`Timestamp      : ${new Date().toISOString()}\n`);

  let connBackend;
  let connCRM;
  let connUnified;

  try {
    connBackend = await mongoose.createConnection(SHOFY_URI).asPromise();
    console.log('[OK] Connected to backend (shofy)');
    connCRM     = await mongoose.createConnection(SHOFY_ECOMMERCE_URI).asPromise();
    console.log('[OK] Connected to CRM (shofy_ecommerce)');
    connUnified = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to unified\n');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  const backendCol = connBackend.db.collection('users');
  const crmCol     = connCRM.db.collection('users');
  const unifiedCol = connUnified.db.collection('users');

  // ── Step 1: migrate backend users (primary) ──────────────────────────────
  const backendCount = await backendCol.countDocuments();
  console.log(`Backend users  : ${backendCount}`);

  let beInserted  = 0;
  let beReplaced  = 0;
  const beTotals  = Math.ceil(backendCount / BATCH_SIZE);

  for (let i = 0; i < beTotals; i++) {
    const docs = await backendCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const doc of docs) {
      const normalised = normaliseUser(doc);
      const result = await unifiedCol.replaceOne(
        { _id: normalised._id },
        normalised,
        { upsert: true }
      );
      if (result.upsertedCount > 0) beInserted++;
      else if (result.modifiedCount > 0) beReplaced++;
    }
    console.log(`  [Backend] Batch ${i + 1}/${beTotals} done`);
  }

  console.log(`  Backend result — inserted: ${beInserted}, replaced: ${beReplaced}\n`);

  // ── Step 2: build email→_id lookup from unified (to detect matches) ──────
  console.log('Building email lookup from unified...');
  const emailLookup = new Map();
  const lookupCursor = unifiedCol.find({}, { projection: { email: 1 } });
  while (await lookupCursor.hasNext()) {
    const doc = await lookupCursor.next();
    if (doc.email) {
      emailLookup.set(doc.email.toLowerCase(), doc._id);
    }
  }
  console.log(`  Lookup built: ${emailLookup.size} entries\n`);

  // ── Step 3: process CRM users ────────────────────────────────────────────
  const crmCount = await crmCol.countDocuments();
  console.log(`CRM users      : ${crmCount}`);

  let crmMatched   = 0;
  let crmBackfilled = 0;
  let crmInserted  = 0;
  let crmSkipped   = 0;
  const crmTotals  = Math.ceil(crmCount / BATCH_SIZE);

  for (let i = 0; i < crmTotals; i++) {
    const docs = await crmCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const crmDoc of docs) {
      const emailKey = (crmDoc.email || '').toLowerCase();

      if (emailLookup.has(emailKey)) {
        // Matched — backfill CRM-only fields if not already set on unified doc
        crmMatched++;
        const unifiedDoc = await unifiedCol.findOne({ email: emailKey });
        if (!unifiedDoc) {
          crmSkipped++;
          continue;
        }

        const update = {};
        for (const field of CRM_ONLY_FIELDS) {
          if (
            crmDoc[field] !== undefined &&
            crmDoc[field] !== null &&
            (unifiedDoc[field] === undefined || unifiedDoc[field] === null)
          ) {
            update[field] = crmDoc[field];
          }
        }

        if (Object.keys(update).length > 0) {
          await unifiedCol.updateOne(
            { _id: unifiedDoc._id },
            { $set: update }
          );
          crmBackfilled++;
        }
      } else {
        // CRM-only user — insert into unified
        const normalised = normaliseUser(crmDoc);
        // Remove vendorProfile since CRM schema does not have it
        delete normalised.vendorProfile;

        try {
          await unifiedCol.insertOne(normalised);
          emailLookup.set(emailKey, normalised._id);
          crmInserted++;
        } catch (err) {
          if (err.code === 11000) {
            // Race condition or _id collision — skip gracefully
            crmSkipped++;
          } else {
            throw err;
          }
        }
      }
    }
    console.log(`  [CRM] Batch ${i + 1}/${crmTotals} done`);
  }

  const unifiedCount = await unifiedCol.countDocuments();

  console.log('\n--- Summary ---');
  console.log(`Backend users migrated   : ${beInserted + beReplaced}`);
  console.log(`  Fresh inserts          : ${beInserted}`);
  console.log(`  Replaced (re-run)      : ${beReplaced}`);
  console.log(`CRM users processed      : ${crmCount}`);
  console.log(`  Matched + backfilled   : ${crmBackfilled}/${crmMatched}`);
  console.log(`  CRM-only inserted      : ${crmInserted}`);
  console.log(`  Skipped/errors         : ${crmSkipped}`);
  console.log(`Unified total            : ${unifiedCount}`);

  await connBackend.close();
  await connCRM.close();
  await connUnified.close();

  console.log('\n[DONE] User migration complete.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
