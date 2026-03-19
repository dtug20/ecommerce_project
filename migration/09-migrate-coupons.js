'use strict';

/**
 * 09-migrate-coupons.js
 *
 * Copies all coupon documents from shofy (backend) to unified.
 * CRM has no coupon model, so the backend is the sole source.
 *
 * New fields added to every migrated coupon:
 *   - usageLimit          : null   (unlimited by default)
 *   - usageCount          : 0
 *   - perUserLimit        : 1
 *   - usedBy              : []
 *   - applicableProducts  : []
 *   - applicableCategories: []
 *   - excludedProducts    : []
 *   - displayRules        : {
 *       showOnBanner:      false,
 *       showOnCheckout:    true,
 *       showOnProductPage: false,
 *       targetPages:       []
 *     }
 *
 * Idempotency: replaceOne with upsert:true keyed on _id.
 *
 * Usage:
 *   SHOFY_URI=mongodb://... UNIFIED_URI=mongodb://... node migration/09-migrate-coupons.js
 */

const mongoose = require('mongoose');

const SHOFY_URI   = process.env.SHOFY_URI   || 'mongodb://127.0.0.1:27017/shofy';
const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 500;

function transformCoupon(doc) {
  return {
    _id:                doc._id,
    title:              doc.title              || '',
    logo:               doc.logo               || '',
    couponCode:         doc.couponCode         || '',
    startTime:          doc.startTime          || null,
    endTime:            doc.endTime            || null,
    discountPercentage: doc.discountPercentage || 0,
    minimumAmount:      doc.minimumAmount      || 0,
    productType:        doc.productType        || 'general',
    status:             doc.status             || 'active',
    // New unified fields — preserve if already present (idempotency)
    usageLimit:           doc.usageLimit           != null  ? doc.usageLimit           : null,
    usageCount:           doc.usageCount           != null  ? doc.usageCount           : 0,
    perUserLimit:         doc.perUserLimit          != null  ? doc.perUserLimit          : 1,
    usedBy:               Array.isArray(doc.usedBy)          ? doc.usedBy               : [],
    applicableProducts:   Array.isArray(doc.applicableProducts)
                            ? doc.applicableProducts
                            : [],
    applicableCategories: Array.isArray(doc.applicableCategories)
                            ? doc.applicableCategories
                            : [],
    excludedProducts:     Array.isArray(doc.excludedProducts)
                            ? doc.excludedProducts
                            : [],
    displayRules: {
      showOnBanner:      (doc.displayRules && doc.displayRules.showOnBanner      != null)
                           ? doc.displayRules.showOnBanner
                           : false,
      showOnCheckout:    (doc.displayRules && doc.displayRules.showOnCheckout    != null)
                           ? doc.displayRules.showOnCheckout
                           : true,
      showOnProductPage: (doc.displayRules && doc.displayRules.showOnProductPage != null)
                           ? doc.displayRules.showOnProductPage
                           : false,
      targetPages: (doc.displayRules && Array.isArray(doc.displayRules.targetPages))
                     ? doc.displayRules.targetPages
                     : [],
    },
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || new Date(),
  };
}

async function run() {
  console.log('\n=== 09-migrate-coupons ===');
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

  const sourceCol = connSource.db.collection('coupons');
  const targetCol = connTarget.db.collection('coupons');

  const sourceCount = await sourceCol.countDocuments();
  console.log(`Source coupon count: ${sourceCount}`);

  if (sourceCount === 0) {
    console.log('[INFO] No coupons to migrate.');
    await connSource.close();
    await connTarget.close();
    console.log('\n[DONE] 0 coupons migrated.');
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
      const transformed = transformCoupon(doc);

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
  console.log(`Source coupons : ${sourceCount}`);
  console.log(`Inserted       : ${inserted}`);
  console.log(`Replaced       : ${replaced}`);
  console.log(`Target total   : ${targetCount}`);

  await connSource.close();
  await connTarget.close();

  console.log('\n[DONE] Coupon migration complete.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
