'use strict';

/**
 * 10-post-migration-fixes.js
 *
 * Run AFTER all entity migrations (02–09).
 *
 * Checks performed:
 *   1. category.products[] — verifies each ObjectId resolves to a real product;
 *      removes stale refs and logs the count of removals.
 *   2. brand.products[]    — same check against products collection.
 *   3. orders.user         — verifies each order's user ref exists in users.
 *   4. reviews.userId      — verifies each review's userId exists in users.
 *   5. reviews.productId   — verifies each review's productId exists in products.
 *
 * This script DOES modify data: it removes orphaned ObjectId references from
 * category.products[] and brand.products[].  All other issues are logged only.
 *
 * Idempotency: safe to re-run — removals are only made when a ref is genuinely
 * absent from the referenced collection.
 *
 * Usage:
 *   UNIFIED_URI=mongodb://... node migration/10-post-migration-fixes.js
 */

const mongoose = require('mongoose');

const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

// How many ObjectIds to batch-lookup in one $in query
const LOOKUP_BATCH = 500;

/**
 * Splits an array into chunks of the given size.
 */
function chunks(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Given an array of ObjectId values, returns a Set of string representations
 * of those that actually exist in `collection`.
 */
async function findExistingIds(collection, ids) {
  const existing = new Set();
  for (const chunk of chunks(ids, LOOKUP_BATCH)) {
    const docs = await collection
      .find({ _id: { $in: chunk } }, { projection: { _id: 1 } })
      .toArray();
    docs.forEach(d => existing.add(String(d._id)));
  }
  return existing;
}

async function fixProductRefArray(parentCol, productCol, parentLabel) {
  console.log(`\n  Checking ${parentLabel}.products[] refs...`);

  const docs = await parentCol
    .find({ products: { $exists: true, $not: { $size: 0 } } })
    .toArray();

  let totalRefs    = 0;
  let orphanedRefs = 0;
  let docsFixed    = 0;

  for (const doc of docs) {
    const refs = (doc.products || []).map(id => new mongoose.Types.ObjectId(String(id)));
    if (refs.length === 0) continue;
    totalRefs += refs.length;

    const existing = await findExistingIds(productCol, refs);
    const valid    = refs.filter(id => existing.has(String(id)));
    const stale    = refs.length - valid.length;

    if (stale > 0) {
      orphanedRefs += stale;
      docsFixed++;
      await parentCol.updateOne(
        { _id: doc._id },
        { $set: { products: valid } }
      );
      console.log(`    Fixed ${parentLabel} ${doc._id}: removed ${stale} orphaned product ref(s)`);
    }
  }

  console.log(`    Total refs checked   : ${totalRefs}`);
  console.log(`    Orphaned refs removed: ${orphanedRefs}`);
  console.log(`    Documents updated    : ${docsFixed}`);
}

async function auditOrderUsers(orderCol, userCol) {
  console.log('\n  Checking orders.user refs...');

  const orders = await orderCol
    .find({ user: { $exists: true } }, { projection: { _id: 1, user: 1 } })
    .toArray();

  const userIds = orders
    .filter(o => o.user)
    .map(o => new mongoose.Types.ObjectId(String(o.user)));

  const existingUsers = await findExistingIds(userCol, userIds);

  const orphaned = orders.filter(
    o => o.user && !existingUsers.has(String(o.user))
  );

  console.log(`    Orders checked       : ${orders.length}`);
  console.log(`    Orphaned user refs   : ${orphaned.length}`);

  if (orphaned.length > 0) {
    console.log('    Affected order IDs (user ref missing):');
    orphaned.slice(0, 20).forEach(o => console.log(`      - ${o._id} (user: ${o.user})`));
    if (orphaned.length > 20) {
      console.log(`      ... and ${orphaned.length - 20} more`);
    }
    console.log('    ACTION NEEDED: these orders reference users that do not exist.');
    console.log('    Re-run 03-migrate-users.js or manually reassign the user field.');
  }
}

async function auditReviewRefs(reviewCol, userCol, productCol) {
  console.log('\n  Checking reviews refs...');

  const reviews = await reviewCol
    .find({}, { projection: { _id: 1, userId: 1, productId: 1 } })
    .toArray();

  const userIds    = reviews.filter(r => r.userId).map(r => new mongoose.Types.ObjectId(String(r.userId)));
  const productIds = reviews.filter(r => r.productId).map(r => new mongoose.Types.ObjectId(String(r.productId)));

  const existingUsers    = await findExistingIds(userCol,    userIds);
  const existingProducts = await findExistingIds(productCol, productIds);

  const orphanedUsers    = reviews.filter(r => r.userId    && !existingUsers.has(String(r.userId)));
  const orphanedProducts = reviews.filter(r => r.productId && !existingProducts.has(String(r.productId)));

  console.log(`    Reviews checked             : ${reviews.length}`);
  console.log(`    Orphaned userId refs        : ${orphanedUsers.length}`);
  console.log(`    Orphaned productId refs     : ${orphanedProducts.length}`);

  if (orphanedUsers.length > 0) {
    console.log('    Reviews with missing userId:');
    orphanedUsers.slice(0, 10).forEach(r => console.log(`      - review ${r._id} (userId: ${r.userId})`));
  }
  if (orphanedProducts.length > 0) {
    console.log('    Reviews with missing productId:');
    orphanedProducts.slice(0, 10).forEach(r => console.log(`      - review ${r._id} (productId: ${r.productId})`));
  }
}

async function run() {
  console.log('\n=== 10-post-migration-fixes ===');
  console.log(`Unified: ${UNIFIED_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let conn;
  try {
    conn = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to unified database');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  const db         = conn.db;
  const userCol    = db.collection('users');
  const productCol = db.collection('products');
  const categoryCol = db.collection('categories');
  const brandCol   = db.collection('brands');
  const orderCol   = db.collection('orders');
  const reviewCol  = db.collection('reviews');

  // 1. Fix category.products[]
  await fixProductRefArray(categoryCol, productCol, 'category');

  // 2. Fix brand.products[]
  await fixProductRefArray(brandCol, productCol, 'brand');

  // 3. Audit order user refs
  await auditOrderUsers(orderCol, userCol);

  // 4. Audit review refs
  await auditReviewRefs(reviewCol, userCol, productCol);

  await conn.close();

  console.log('\n[DONE] Post-migration fixes complete.');
  console.log('Review any ACTION NEEDED messages above before proceeding.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
