'use strict';

/**
 * 11-validate-migration.js
 *
 * Runs validation checks on the unified database after all migration scripts
 * have completed.
 *
 * Checks:
 *   1. Document counts per collection (prints table).
 *   2. Unique index integrity — queries for duplicate values on fields
 *      with unique indexes.
 *   3. Spot-check — samples 5 random documents per collection and asserts
 *      the presence of required fields.
 *   4. Cross-reference counts — verifies unified totals are at least as
 *      large as the larger of the two source databases (a data-loss guard).
 *
 * Prints PASS / FAIL for every check.
 * Exits with code 1 if any check fails.
 *
 * Usage:
 *   SHOFY_URI=mongodb://...
 *   SHOFY_ECOMMERCE_URI=mongodb://...
 *   UNIFIED_URI=mongodb://...
 *   node migration/11-validate-migration.js
 */

const mongoose = require('mongoose');

const SHOFY_URI           = process.env.SHOFY_URI           || 'mongodb://127.0.0.1:27017/shofy';
const SHOFY_ECOMMERCE_URI = process.env.SHOFY_ECOMMERCE_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce';
const UNIFIED_URI         = process.env.UNIFIED_URI         || 'mongodb://127.0.0.1:27017/shofy';

// Required fields per collection — spot-check will assert these exist and are non-null
const REQUIRED_FIELDS = {
  users:          ['_id', 'name', 'email', 'role', 'status'],
  admins:         ['_id', 'name', 'email', 'role'],
  products:       ['_id', 'title', 'price', 'quantity', 'status', 'productType'],
  categories:     ['_id', 'parent', 'productType', 'status'],
  brands:         ['_id', 'name', 'status'],
  orders:         ['_id', 'user', 'totalAmount', 'status', 'paymentMethod'],
  reviews:        ['_id', 'userId', 'productId', 'rating'],
  coupons:        ['_id', 'couponCode', 'discountPercentage', 'minimumAmount'],
  sitesettings:   ['_id', 'siteName'],
  pages:          ['_id', 'title', 'slug', 'type', 'status'],
  menus:          ['_id', 'name', 'slug', 'location', 'status'],
  banners:        ['_id', 'title', 'type', 'status'],
  blogposts:      ['_id', 'title', 'slug', 'status'],
  wishlists:      ['_id', 'user'],
  emailtemplates: ['_id', 'name', 'slug', 'type', 'subject'],
  activitylogs:   ['_id', 'actor', 'action', 'resource'],
};

// Unique fields per collection — checked for duplicates
const UNIQUE_FIELDS = {
  users:          ['email'],
  admins:         ['email'],
  brands:         ['name'],
  categories:     [],        // slug is sparse; parent uniqueness checked separately
  products:       [],        // slug is sparse
  orders:         [],        // invoice and orderNumber are both sparse
  coupons:        [],        // couponCode is sparse
  menus:          ['name', 'slug'],
  emailtemplates: ['name', 'slug'],
  blogposts:      ['slug'],
  pages:          ['slug'],
  wishlists:      ['user'],
};

// Minimum expected counts per collection in unified
// (at least as many as the larger single-source count)
// These are validated dynamically — see cross-reference check below.
const COLLECTIONS_TO_CHECK = Object.keys(REQUIRED_FIELDS);

let globalPass = true;

function result(label, pass, detail) {
  const tag = pass ? '[PASS]' : '[FAIL]';
  console.log(`${tag} ${label}${detail ? `  — ${detail}` : ''}`);
  if (!pass) globalPass = false;
}

async function countDocs(db, name) {
  try {
    return await db.collection(name).countDocuments();
  } catch (_) {
    return 0;
  }
}

async function checkUniqueness(db, collectionName, field) {
  const agg = await db.collection(collectionName).aggregate([
    { $match: { [field]: { $exists: true, $ne: null } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 5 },
  ]).toArray();

  if (agg.length === 0) {
    result(`${collectionName}.${field} unique`, true);
  } else {
    const examples = agg.map(a => `"${a._id}" (${a.count}x)`).join(', ');
    result(`${collectionName}.${field} unique`, false, `duplicates found: ${examples}`);
  }
}

async function spotCheck(db, collectionName, requiredFields) {
  const count = await db.collection(collectionName).countDocuments();
  if (count === 0) {
    result(`${collectionName} spot-check`, true, 'collection is empty — skipped');
    return;
  }

  // Sample up to 5 documents using $sample
  const docs = await db.collection(collectionName).aggregate([
    { $sample: { size: Math.min(5, count) } },
  ]).toArray();

  let allPass = true;
  const missing = [];

  for (const doc of docs) {
    for (const field of requiredFields) {
      if (doc[field] === undefined || doc[field] === null) {
        allPass = false;
        missing.push(`doc ${doc._id}: missing "${field}"`);
      }
    }
  }

  if (allPass) {
    result(`${collectionName} spot-check (${docs.length} docs)`, true);
  } else {
    result(
      `${collectionName} spot-check`,
      false,
      missing.slice(0, 3).join('; ') + (missing.length > 3 ? ` ... +${missing.length - 3} more` : '')
    );
  }
}

function pad(str, w) { return String(str).padEnd(w); }
function padL(str, w) { return String(str).padStart(w); }

async function run() {
  console.log('\n=== 11-validate-migration ===');
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let connShofy;
  let connCRM;
  let connUnified;

  try {
    connShofy   = await mongoose.createConnection(SHOFY_URI).asPromise();
    connCRM     = await mongoose.createConnection(SHOFY_ECOMMERCE_URI).asPromise();
    connUnified = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] All three connections established\n');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  const dbShofy   = connShofy.db;
  const dbCRM     = connCRM.db;
  const dbUnified = connUnified.db;

  // ── Check 1: Document counts ──────────────────────────────────────────────
  console.log('--- Check 1: Document Counts ---');
  console.log(
    pad('Collection', 22) +
    padL('shofy', 10) +
    padL('crm', 10) +
    padL('unified', 10) +
    padL('status', 10)
  );
  console.log('-'.repeat(62));

  for (const name of COLLECTIONS_TO_CHECK) {
    const cShofy   = await countDocs(dbShofy,   name);
    const cCRM     = await countDocs(dbCRM,     name);
    const cUnified = await countDocs(dbUnified, name);
    const expected = Math.max(cShofy, cCRM);
    const pass     = cUnified >= expected || (cShofy === 0 && cCRM === 0);
    const statusStr = pass ? 'PASS' : 'FAIL';

    console.log(
      pad(name, 22) +
      padL(cShofy, 10) +
      padL(cCRM, 10) +
      padL(cUnified, 10) +
      padL(statusStr, 10)
    );

    if (!pass) globalPass = false;
  }

  // ── Check 2: Unique index integrity ──────────────────────────────────────
  console.log('\n--- Check 2: Unique Index Integrity ---');
  for (const [collName, fields] of Object.entries(UNIQUE_FIELDS)) {
    for (const field of fields) {
      await checkUniqueness(dbUnified, collName, field);
    }
  }

  // ── Check 3: Spot-check required fields ──────────────────────────────────
  console.log('\n--- Check 3: Spot-check Required Fields ---');
  for (const [collName, fields] of Object.entries(REQUIRED_FIELDS)) {
    await spotCheck(dbUnified, collName, fields);
  }

  // ── Check 4: Cross-reference integrity ───────────────────────────────────
  console.log('\n--- Check 4: Cross-Reference Counts ---');

  // Orders should reference valid users
  const totalOrders      = await countDocs(dbUnified, 'orders');
  const ordersWithUser   = await dbUnified.collection('orders').countDocuments({ user: { $exists: true, $ne: null } });
  result(
    'orders.user field present',
    ordersWithUser === totalOrders || totalOrders === 0,
    `${ordersWithUser}/${totalOrders} orders have a user field`
  );

  // Reviews should reference valid products
  const totalReviews     = await countDocs(dbUnified, 'reviews');
  const reviewsWithProd  = await dbUnified.collection('reviews').countDocuments({ productId: { $exists: true, $ne: null } });
  result(
    'reviews.productId field present',
    reviewsWithProd === totalReviews || totalReviews === 0,
    `${reviewsWithProd}/${totalReviews} reviews have a productId`
  );

  // Products should have a slug
  const totalProducts    = await countDocs(dbUnified, 'products');
  const productsWithSlug = await dbUnified.collection('products').countDocuments({ slug: { $exists: true, $ne: null, $ne: '' } });
  result(
    'products.slug field populated',
    productsWithSlug === totalProducts || totalProducts === 0,
    `${productsWithSlug}/${totalProducts} products have a slug`
  );

  // Categories should have a slug
  const totalCats        = await countDocs(dbUnified, 'categories');
  const catsWithSlug     = await dbUnified.collection('categories').countDocuments({ slug: { $exists: true, $ne: null, $ne: '' } });
  result(
    'categories.slug field populated',
    catsWithSlug === totalCats || totalCats === 0,
    `${catsWithSlug}/${totalCats} categories have a slug`
  );

  // ── Final result ──────────────────────────────────────────────────────────
  await connShofy.close();
  await connCRM.close();
  await connUnified.close();

  console.log('\n' + '='.repeat(50));
  if (globalPass) {
    console.log('[PASS] All validation checks passed.');
  } else {
    console.log('[FAIL] One or more validation checks FAILED.');
    console.log('Review failures above before switching application traffic to unified DB.');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
