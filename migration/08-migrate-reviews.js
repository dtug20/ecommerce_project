'use strict';

/**
 * 08-migrate-reviews.js
 *
 * Copies all review documents from shofy (backend) to unified.
 * CRM has no review model, so the backend is the sole source.
 *
 * New fields added to every migrated review:
 *   - status             : 'approved'  (existing reviews were auto-published
 *                          because the old schema had no moderation gate)
 *   - isVerifiedPurchase : true        (old schema enforced purchase validation
 *                          before a review could be created)
 *   - images             : []          (no images in legacy reviews)
 *   - helpful            : { count: 0, users: [] }
 *   - adminReply         : null
 *
 * Idempotency: replaceOne with upsert:true keyed on _id.
 *
 * Usage:
 *   SHOFY_URI=mongodb://... UNIFIED_URI=mongodb://... node migration/08-migrate-reviews.js
 */

const mongoose = require('mongoose');

const SHOFY_URI   = process.env.SHOFY_URI   || 'mongodb://127.0.0.1:27017/shofy';
const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 500;

function transformReview(doc) {
  return {
    _id:                doc._id,
    userId:             doc.userId,
    productId:          doc.productId,
    rating:             doc.rating,
    comment:            doc.comment || null,
    // New unified fields
    images:             Array.isArray(doc.images) ? doc.images : [],
    status:             doc.status || 'approved',   // legacy = auto-approved
    isVerifiedPurchase: doc.isVerifiedPurchase != null
                          ? doc.isVerifiedPurchase
                          : true,                   // legacy required purchase check
    helpful: {
      count: (doc.helpful && doc.helpful.count != null) ? doc.helpful.count : 0,
      users: (doc.helpful && Array.isArray(doc.helpful.users)) ? doc.helpful.users : [],
    },
    adminReply: doc.adminReply || null,
    createdAt:  doc.createdAt  || new Date(),
    updatedAt:  doc.updatedAt  || new Date(),
  };
}

async function run() {
  console.log('\n=== 08-migrate-reviews ===');
  console.log(`Source : ${SHOFY_URI}`);
  console.log(`Target : ${UNIFIED_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let connSource;
  let connTarget;

  try {
    connSource = await mongoose.createConnection(SHOFY_URI).asPromise();
    console.log('[OK] Connected to source (shofy)');
    connTarget = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to target (unified)\n');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  // The backend Mongoose model registers the collection as 'reviews'
  const sourceCol = connSource.db.collection('reviews');
  const targetCol = connTarget.db.collection('reviews');

  const sourceCount = await sourceCol.countDocuments();
  console.log(`Source review count: ${sourceCount}`);

  if (sourceCount === 0) {
    console.log('[INFO] No reviews to migrate.');
    await connSource.close();
    await connTarget.close();
    console.log('\n[DONE] 0 reviews migrated.');
    return;
  }

  let inserted = 0;
  let replaced = 0;
  const batches = Math.ceil(sourceCount / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const docs = await sourceCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const doc of docs) {
      const transformed = transformReview(doc);

      const result = await targetCol.replaceOne(
        { _id: transformed._id },
        transformed,
        { upsert: true }
      );

      if (result.upsertedCount > 0) inserted++;
      else if (result.modifiedCount > 0) replaced++;
    }
    console.log(`  Batch ${i + 1}/${batches} processed`);
  }

  const targetCount = await targetCol.countDocuments();

  console.log('\n--- Summary ---');
  console.log(`Source reviews : ${sourceCount}`);
  console.log(`Inserted       : ${inserted}`);
  console.log(`Replaced       : ${replaced}`);
  console.log(`Target total   : ${targetCount}`);

  await connSource.close();
  await connTarget.close();

  console.log('\n[DONE] Review migration complete.');
  console.log('NOTE: All migrated reviews have status=approved and isVerifiedPurchase=true.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
