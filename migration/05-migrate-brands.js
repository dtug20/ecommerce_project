'use strict';

/**
 * 05-migrate-brands.js
 *
 * Copies brand documents from shofy (backend) to unified.
 * CRM has no brand model, so the backend is the only source.
 *
 * Transformations applied:
 *   - slug      : auto-generated from name when absent
 *   - featured  : defaults to false
 *   - sortOrder : defaults to 0
 *   - _id is preserved so product.brand.id references remain valid
 *
 * Idempotency: replaceOne with upsert:true keyed on _id.
 *
 * Usage:
 *   SHOFY_URI=mongodb://... UNIFIED_URI=mongodb://... node migration/05-migrate-brands.js
 */

const mongoose = require('mongoose');

const SHOFY_URI   = process.env.SHOFY_URI   || 'mongodb://127.0.0.1:27017/shofy';
const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 500;

/**
 * Converts a brand name to a URL-safe slug.
 *   "Nike & Co." → "nike-co"
 */
function toSlug(str) {
  return String(str)
    .toLowerCase()
    .replace(/[&+]/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Ensures slug uniqueness within the in-progress migration batch.
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
 * Returns the unified brand document shape.
 */
function transformBrand(doc, usedSlugs) {
  const baseSlug = doc.slug && doc.slug.trim()
    ? doc.slug.trim()
    : toSlug(doc.name || String(doc._id));

  const slug = makeUniqueSlug(baseSlug, usedSlugs);

  return {
    _id:         doc._id,
    logo:        doc.logo        || null,
    name:        doc.name        || '',
    description: doc.description || null,
    email:       doc.email       || null,
    website:     doc.website     || null,
    location:    doc.location    || null,
    status:      doc.status      || 'active',
    products:    Array.isArray(doc.products) ? doc.products : [],
    // New unified fields
    slug,
    featured:    false,
    sortOrder:   0,
    createdAt:   doc.createdAt || new Date(),
    updatedAt:   doc.updatedAt || new Date(),
  };
}

async function run() {
  console.log('\n=== 05-migrate-brands ===');
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

  const sourceCol = connSource.db.collection('brands');
  const targetCol = connTarget.db.collection('brands');

  const sourceCount = await sourceCol.countDocuments();
  console.log(`Source brand count: ${sourceCount}`);

  if (sourceCount === 0) {
    console.log('[INFO] No brands to migrate.');
    await connSource.close();
    await connTarget.close();
    console.log('\n[DONE] 0 brands migrated.');
    return;
  }

  // Pre-populate usedSlugs from existing target documents to avoid
  // collisions on re-runs.
  const usedSlugs = new Set();
  const existingCursor = targetCol.find({}, { projection: { slug: 1 } });
  while (await existingCursor.hasNext()) {
    const doc = await existingCursor.next();
    if (doc.slug) usedSlugs.add(doc.slug);
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
      const transformed = transformBrand(doc, usedSlugs);

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
  console.log(`Source count  : ${sourceCount}`);
  console.log(`Inserted      : ${inserted}`);
  console.log(`Replaced      : ${replaced}`);
  console.log(`Target total  : ${targetCount}`);

  await connSource.close();
  await connTarget.close();

  console.log('\n[DONE] Brand migration complete.');
  console.log('NOTE: product.brand.id references are preserved — no re-linking needed.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
