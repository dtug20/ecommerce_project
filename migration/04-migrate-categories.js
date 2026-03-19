'use strict';

/**
 * 04-migrate-categories.js
 *
 * CRM (shofy_ecommerce) categories are authoritative.
 * Fallback: if the CRM has no categories, backend (shofy) categories
 * are used instead.
 *
 * Transformations applied:
 *   - slug  : auto-generated from parent (lowercase, spaces → dashes,
 *             non-alphanumeric removed)
 *   - name  : set to parent
 *   - level : 0  (all current categories are root-level)
 *   - ancestors: []
 *   - _id is preserved so existing product.category.id references stay valid
 *
 * Idempotency: replaceOne with upsert:true keyed on _id.
 * Duplicate slug protection: appends a counter suffix when a slug collision
 * is detected during the in-memory pass.
 *
 * Usage:
 *   SHOFY_URI=mongodb://...
 *   SHOFY_ECOMMERCE_URI=mongodb://...
 *   UNIFIED_URI=mongodb://...
 *   node migration/04-migrate-categories.js
 */

const mongoose = require('mongoose');

const SHOFY_URI           = process.env.SHOFY_URI           || 'mongodb://127.0.0.1:27017/shofy';
const SHOFY_ECOMMERCE_URI = process.env.SHOFY_ECOMMERCE_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce';
const UNIFIED_URI         = process.env.UNIFIED_URI         || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 200;

/**
 * Converts a human-readable string to a URL-safe slug.
 *   "Men's Clothing" → "mens-clothing"
 */
function toSlug(str) {
  return String(str)
    .toLowerCase()
    .replace(/['''`]/g, '')          // remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (except spaces/dashes)
    .trim()
    .replace(/\s+/g, '-')           // spaces → dashes
    .replace(/-+/g, '-');           // collapse consecutive dashes
}

/**
 * Ensures slug uniqueness within the current migration batch by appending
 * an incrementing counter when a collision is detected.
 */
function makeUniqueSlug(base, usedSlugs) {
  let slug    = base;
  let counter = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  usedSlugs.add(slug);
  return slug;
}

/**
 * Transforms a raw category document from either database into the
 * unified category shape.
 */
function transformCategory(doc, usedSlugs) {
  const baseSlug = doc.slug && doc.slug.trim()
    ? doc.slug.trim()
    : toSlug(doc.parent || doc.name || String(doc._id));

  const slug = makeUniqueSlug(baseSlug, usedSlugs);

  return {
    _id:            doc._id,
    img:            doc.img            || null,
    parent:         doc.parent         || '',
    children:       Array.isArray(doc.children) ? doc.children : [],
    productType:    doc.productType    || 'general',
    description:    doc.description    || null,
    products:       Array.isArray(doc.products) ? doc.products : [],
    status:         doc.status         || 'Show',
    featured:       doc.featured       || false,
    // New unified fields
    name:           doc.parent         || doc.name || '',
    slug,
    icon:           doc.icon           || null,
    parentCategory: doc.parentCategory || null,
    ancestors:      [],    // all current categories are root-level
    level:          0,
    sortOrder:      doc.sortOrder != null ? doc.sortOrder : 0,
    createdAt:      doc.createdAt      || new Date(),
    updatedAt:      doc.updatedAt      || new Date(),
  };
}

async function migrateFromSource(sourceCol, targetCol, sourceLabel) {
  const count = await sourceCol.countDocuments();
  console.log(`${sourceLabel} category count: ${count}`);

  if (count === 0) return { count: 0, inserted: 0, replaced: 0 };

  const usedSlugs = new Set();

  // Pre-populate usedSlugs from what is already in the target to avoid
  // collisions with documents inserted by earlier script runs.
  const existingSlugsCursor = targetCol.find({}, { projection: { slug: 1 } });
  while (await existingSlugsCursor.hasNext()) {
    const doc = await existingSlugsCursor.next();
    if (doc.slug) usedSlugs.add(doc.slug);
  }

  let inserted = 0;
  let replaced = 0;
  const batches = Math.ceil(count / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const docs = await sourceCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const doc of docs) {
      const transformed = transformCategory(doc, usedSlugs);

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

  return { count, inserted, replaced };
}

async function run() {
  console.log('\n=== 04-migrate-categories ===');
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

  const crmCol     = connCRM.db.collection('categories');
  const backendCol = connBackend.db.collection('categories');
  const targetCol  = connUnified.db.collection('categories');

  const crmCount = await crmCol.countDocuments();

  let stats;

  if (crmCount > 0) {
    console.log(`CRM has ${crmCount} categories — using CRM as authoritative source.\n`);
    stats = await migrateFromSource(crmCol, targetCol, 'CRM');
  } else {
    console.log('CRM has no categories — falling back to backend as source.\n');
    stats = await migrateFromSource(backendCol, targetCol, 'Backend');
  }

  const unifiedCount = await targetCol.countDocuments();

  console.log('\n--- Summary ---');
  console.log(`Source count   : ${stats.count}`);
  console.log(`Inserted       : ${stats.inserted}`);
  console.log(`Replaced       : ${stats.replaced}`);
  console.log(`Unified total  : ${unifiedCount}`);

  await connBackend.close();
  await connCRM.close();
  await connUnified.close();

  console.log('\n[DONE] Category migration complete.');
  console.log('NOTE: product.category.id references are preserved — no re-linking needed.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
