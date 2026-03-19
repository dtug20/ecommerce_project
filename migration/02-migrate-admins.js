'use strict';

/**
 * 02-migrate-admins.js
 *
 * Copies all documents from shofy.admins to unified.admins.
 * No field transformations are required — the Admin schema is identical
 * in both environments.
 *
 * Strategy:
 *   - Uses insertMany with ordered:false so a duplicate _id / email
 *     causes a WriteError on that document only, not an abort.
 *   - Already-migrated documents are skipped (idempotent).
 *
 * Usage:
 *   SHOFY_URI=mongodb://... UNIFIED_URI=mongodb://... node migration/02-migrate-admins.js
 */

const mongoose = require('mongoose');

const SHOFY_URI   = process.env.SHOFY_URI   || 'mongodb://127.0.0.1:27017/shofy';
const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 500;

async function run() {
  console.log('\n=== 02-migrate-admins ===');
  console.log(`Source : ${SHOFY_URI}`);
  console.log(`Target : ${UNIFIED_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let connSource;
  let connTarget;

  try {
    connSource = await mongoose.createConnection(SHOFY_URI).asPromise();
    console.log('[OK] Connected to source (shofy)');
  } catch (err) {
    console.error('[ERROR] Source connection failed:', err.message);
    process.exit(1);
  }

  try {
    connTarget = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to target (unified)\n');
  } catch (err) {
    console.error('[ERROR] Target connection failed:', err.message);
    await connSource.close();
    process.exit(1);
  }

  const sourceCol = connSource.db.collection('admins');
  const targetCol = connTarget.db.collection('admins');

  const sourceCount = await sourceCol.countDocuments();
  console.log(`Source admin count : ${sourceCount}`);

  if (sourceCount === 0) {
    console.log('[INFO] No admins to migrate.');
    await connSource.close();
    await connTarget.close();
    console.log('\n[DONE] 0 admins migrated.');
    return;
  }

  let inserted    = 0;
  let skipped     = 0;
  let batchNumber = 0;

  const cursor = sourceCol.find({});

  while (true) {
    const batch = await cursor.limit(BATCH_SIZE).toArray();
    // Move cursor forward manually
    await cursor.skip(batchNumber * BATCH_SIZE);
    break; // We will use a different approach below
  }
  await cursor.close();

  // Restart using skip/limit for reliable batching
  const totalBatches = Math.ceil(sourceCount / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const docs = await sourceCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    if (docs.length === 0) break;

    batchNumber++;
    console.log(`Processing batch ${batchNumber}/${totalBatches} (${docs.length} documents)`);

    try {
      const result = await targetCol.insertMany(docs, { ordered: false });
      inserted += result.insertedCount;
      console.log(`  Inserted: ${result.insertedCount}`);
    } catch (err) {
      if (err.code === 11000 && err.result) {
        // Partial success — some docs already exist
        const batchInserted = err.result.nInserted || 0;
        const batchSkipped  = docs.length - batchInserted;
        inserted += batchInserted;
        skipped  += batchSkipped;
        console.log(`  Inserted: ${batchInserted}  |  Skipped (duplicates): ${batchSkipped}`);
      } else {
        console.error(`  [ERROR] Batch ${batchNumber} failed:`, err.message);
        throw err;
      }
    }
  }

  const targetCount = await targetCol.countDocuments();

  console.log('\n--- Summary ---');
  console.log(`Source docs  : ${sourceCount}`);
  console.log(`Inserted     : ${inserted}`);
  console.log(`Skipped      : ${skipped}`);
  console.log(`Target total : ${targetCount}`);

  await connSource.close();
  await connTarget.close();

  console.log('\n[DONE] Admin migration complete.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
