'use strict';

/**
 * 00-audit-diff.js
 *
 * Connects to both source databases and prints a document-count comparison
 * table for every shared collection.  Does NOT modify any data.
 *
 * Usage:
 *   SHOFY_URI=mongodb://... SHOFY_ECOMMERCE_URI=mongodb://... node migration/00-audit-diff.js
 */

const mongoose = require('mongoose');

const SHOFY_URI           = process.env.SHOFY_URI           || 'mongodb://127.0.0.1:27017/shofy';
const SHOFY_ECOMMERCE_URI = process.env.SHOFY_ECOMMERCE_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce';

// All collection names that either database may contain
const COLLECTIONS = [
  'users',
  'admins',
  'products',
  'categories',
  'brands',
  'orders',
  'reviews',
  'coupons',
  'sitesettings',
  'pages',
  'menus',
  'banners',
  'blogposts',
  'wishlists',
  'emailtemplates',
  'activitylogs',
];

async function countCollection(db, name) {
  try {
    return await db.collection(name).countDocuments();
  } catch (_) {
    return 0;
  }
}

function pad(str, width) {
  return String(str).padEnd(width);
}

function padLeft(str, width) {
  return String(str).padStart(width);
}

async function run() {
  console.log('\n=== Shofy Dual-Database Audit ===');
  console.log(`Timestamp : ${new Date().toISOString()}`);
  console.log(`shofy     : ${SHOFY_URI}`);
  console.log(`shofy_ecommerce: ${SHOFY_ECOMMERCE_URI}\n`);

  let connShofy;
  let connEcommerce;

  try {
    connShofy = await mongoose.createConnection(SHOFY_URI).asPromise();
    console.log('[OK] Connected to shofy');
  } catch (err) {
    console.error('[ERROR] Cannot connect to shofy:', err.message);
    process.exit(1);
  }

  try {
    connEcommerce = await mongoose.createConnection(SHOFY_ECOMMERCE_URI).asPromise();
    console.log('[OK] Connected to shofy_ecommerce\n');
  } catch (err) {
    console.error('[ERROR] Cannot connect to shofy_ecommerce:', err.message);
    await connShofy.close();
    process.exit(1);
  }

  const dbShofy      = connShofy.db;
  const dbEcommerce  = connEcommerce.db;

  const COL_W   = 22;
  const NUM_W   = 14;
  const DIFF_W  = 12;

  const header =
    pad('Collection', COL_W) +
    padLeft('shofy', NUM_W) +
    padLeft('shofy_ecommerce', NUM_W) +
    padLeft('Diff', DIFF_W);

  const separator = '-'.repeat(COL_W + NUM_W + NUM_W + DIFF_W);

  console.log(header);
  console.log(separator);

  const results = [];
  let totalShofy      = 0;
  let totalEcommerce  = 0;
  let totalDiff       = 0;
  let discrepancies   = 0;

  for (const name of COLLECTIONS) {
    const countA = await countCollection(dbShofy,     name);
    const countB = await countCollection(dbEcommerce, name);
    const diff   = countA - countB;

    totalShofy     += countA;
    totalEcommerce += countB;
    totalDiff      += diff;

    if (diff !== 0) discrepancies++;

    const diffStr = diff === 0 ? '  --' : (diff > 0 ? `+${diff}` : `${diff}`);
    const marker  = diff !== 0 ? '  <--' : '';

    console.log(
      pad(name, COL_W) +
      padLeft(countA, NUM_W) +
      padLeft(countB, NUM_W) +
      padLeft(diffStr, DIFF_W) +
      marker
    );

    results.push({ collection: name, shofy: countA, ecommerce: countB, diff });
  }

  console.log(separator);
  console.log(
    pad('TOTAL', COL_W) +
    padLeft(totalShofy, NUM_W) +
    padLeft(totalEcommerce, NUM_W) +
    padLeft(totalDiff > 0 ? `+${totalDiff}` : totalDiff, DIFF_W)
  );

  console.log(`\nSummary:`);
  console.log(`  Collections audited  : ${COLLECTIONS.length}`);
  console.log(`  Collections with diff: ${discrepancies}`);
  console.log(`  Total docs in shofy  : ${totalShofy}`);
  console.log(`  Total docs in crm    : ${totalEcommerce}`);

  if (discrepancies > 0) {
    console.log('\nCollections with differences (will need merge logic):');
    results.filter(r => r.diff !== 0).forEach(r => {
      console.log(`  - ${r.collection}: shofy=${r.shofy}, ecommerce=${r.ecommerce}`);
    });
  } else {
    console.log('\nNo count discrepancies found between databases.');
  }

  await connShofy.close();
  await connEcommerce.close();

  console.log('\n[DONE] Audit complete. No data was modified.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
