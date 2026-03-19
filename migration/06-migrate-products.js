'use strict';

/**
 * 06-migrate-products.js
 *
 * Merges products from both databases into unified.products.
 *
 * Merge rules:
 *   - CRM (shofy_ecommerce) products are PRIMARY for admin-managed fields.
 *   - Backend (shofy) products fill gaps — if a product _id exists only
 *     in the backend, it is inserted into unified.
 *   - For matched products (_id collision): CRM document is used as the
 *     base, but the reviews[] array is sourced from the backend because
 *     the CRM has no review data.
 *
 * Transformations applied to every product:
 *   - slug     : auto-generated from title when absent
 *   - vendor   : null (no vendor assignment in legacy data)
 *   - variants : [] (new field, empty for migrated products)
 *   - seo      : {} sub-document with null values
 *   - weight   : null
 *   - dimensions: null
 *   - shipping : { freeShipping: false, shippingCost: 0 }
 *   - barcode  : null
 *
 * Idempotency: replaceOne with upsert:true keyed on _id.
 *
 * Usage:
 *   SHOFY_URI=mongodb://...
 *   SHOFY_ECOMMERCE_URI=mongodb://...
 *   UNIFIED_URI=mongodb://...
 *   node migration/06-migrate-products.js
 */

const mongoose = require('mongoose');

const SHOFY_URI           = process.env.SHOFY_URI           || 'mongodb://127.0.0.1:27017/shofy';
const SHOFY_ECOMMERCE_URI = process.env.SHOFY_ECOMMERCE_URI || 'mongodb://127.0.0.1:27017/shofy_ecommerce';
const UNIFIED_URI         = process.env.UNIFIED_URI         || 'mongodb://127.0.0.1:27017/shofy';

const BATCH_SIZE = 100;

function toSlug(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
 * Merges CRM document (primary) with backend document (secondary) and
 * applies all new-field defaults.
 *
 * @param {object} primary   - CRM or backend document (authoritative base)
 * @param {object|null} secondary - backend document, used only for reviews
 * @param {Set} usedSlugs    - set of slugs already claimed this run
 */
function transformProduct(primary, secondary, usedSlugs) {
  const baseSlug = primary.slug && primary.slug.trim()
    ? primary.slug.trim()
    : toSlug(primary.title || String(primary._id));

  const slug = makeUniqueSlug(baseSlug, usedSlugs);

  // Prefer reviews from backend because CRM strips them
  const reviews = (secondary && Array.isArray(secondary.reviews) && secondary.reviews.length > 0)
    ? secondary.reviews
    : (Array.isArray(primary.reviews) ? primary.reviews : []);

  return {
    _id:                   primary._id,
    id:                    primary.id                    || null,
    sku:                   primary.sku                   || null,
    img:                   primary.img                   || null,
    title:                 primary.title                 || '',
    slug,
    unit:                  primary.unit                  || 'pcs',
    imageURLs:             Array.isArray(primary.imageURLs) ? primary.imageURLs : [],
    parent:                primary.parent                || '',
    children:              primary.children              || '',
    price:                 primary.price                 || 0,
    discount:              primary.discount              != null ? primary.discount : 0,
    quantity:              primary.quantity              != null ? primary.quantity : 0,
    brand: {
      name: (primary.brand && primary.brand.name) || '',
      id:   (primary.brand && primary.brand.id)   || null,
    },
    category: {
      name: (primary.category && primary.category.name) || '',
      id:   (primary.category && primary.category.id)   || null,
    },
    status:                primary.status                || 'in-stock',
    reviews,
    productType:           primary.productType           || 'general',
    description:           primary.description           || '',
    videoId:               primary.videoId               || null,
    additionalInformation: Array.isArray(primary.additionalInformation)
                             ? primary.additionalInformation
                             : [],
    tags:                  Array.isArray(primary.tags)    ? primary.tags    : [],
    sizes:                 Array.isArray(primary.sizes)   ? primary.sizes   : [],
    offerDate: {
      startDate: (primary.offerDate && primary.offerDate.startDate) || null,
      endDate:   (primary.offerDate && primary.offerDate.endDate)   || null,
    },
    featured:    primary.featured    || false,
    sellCount:   primary.sellCount   != null ? primary.sellCount : 0,
    // New unified fields — preserve from backend if already set
    vendor:      primary.vendor      || null,
    barcode:     primary.barcode     || null,
    weight:      primary.weight      != null ? primary.weight : null,
    dimensions:  primary.dimensions  || null,
    variants:    Array.isArray(primary.variants)  ? primary.variants  : [],
    shipping: {
      freeShipping:      (primary.shipping && primary.shipping.freeShipping)  || false,
      shippingCost:      (primary.shipping && primary.shipping.shippingCost)  != null
                           ? primary.shipping.shippingCost
                           : 0,
      estimatedDelivery: (primary.shipping && primary.shipping.estimatedDelivery) || null,
    },
    seo: {
      metaTitle:       (primary.seo && primary.seo.metaTitle)       || null,
      metaDescription: (primary.seo && primary.seo.metaDescription) || null,
      metaKeywords:    (primary.seo && Array.isArray(primary.seo.metaKeywords))
                         ? primary.seo.metaKeywords
                         : [],
      ogImage:         (primary.seo && primary.seo.ogImage)         || null,
    },
    createdAt: primary.createdAt || new Date(),
    updatedAt: primary.updatedAt || new Date(),
  };
}

async function run() {
  console.log('\n=== 06-migrate-products ===');
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

  const crmCol     = connCRM.db.collection('products');
  const backendCol = connBackend.db.collection('products');
  const targetCol  = connUnified.db.collection('products');

  const crmCount     = await crmCol.countDocuments();
  const backendCount = await backendCol.countDocuments();
  console.log(`CRM products    : ${crmCount}`);
  console.log(`Backend products: ${backendCount}\n`);

  // Pre-populate usedSlugs from any products already in unified (re-run safety)
  const usedSlugs = new Set();
  const existingCursor = targetCol.find({}, { projection: { slug: 1 } });
  while (await existingCursor.hasNext()) {
    const doc = await existingCursor.next();
    if (doc.slug) usedSlugs.add(doc.slug);
  }

  // Build backend _id → document map for O(1) lookup during CRM merge pass
  console.log('Building backend product lookup map...');
  const backendMap = new Map();
  const backendCursor = backendCol.find({}, { projection: { _id: 1, reviews: 1 } });
  while (await backendCursor.hasNext()) {
    const doc = await backendCursor.next();
    backendMap.set(String(doc._id), doc);
  }
  console.log(`  Loaded ${backendMap.size} backend products into memory\n`);

  // Track which backend _ids we've handled via the CRM pass
  const handledIds = new Set();

  let crmInserted  = 0;
  let crmReplaced  = 0;
  const crmBatches = Math.ceil(crmCount / BATCH_SIZE);

  // ── Pass 1: CRM products (authoritative) ─────────────────────────────────
  console.log('Pass 1: migrating CRM products...');
  for (let i = 0; i < crmBatches; i++) {
    const docs = await crmCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const crmDoc of docs) {
      const idStr      = String(crmDoc._id);
      const backendDoc = backendMap.get(idStr) || null;
      const transformed = transformProduct(crmDoc, backendDoc, usedSlugs);

      const result = await targetCol.replaceOne(
        { _id: transformed._id },
        transformed,
        { upsert: true }
      );

      if (result.upsertedCount > 0) crmInserted++;
      else if (result.modifiedCount > 0) crmReplaced++;

      handledIds.add(idStr);
    }
    console.log(`  [CRM] Batch ${i + 1}/${crmBatches} processed`);
  }

  // ── Pass 2: backend-only products not present in CRM ─────────────────────
  console.log('\nPass 2: migrating backend-only products...');
  let beInserted = 0;
  let beReplaced = 0;
  const beBatches = Math.ceil(backendCount / BATCH_SIZE);

  for (let i = 0; i < beBatches; i++) {
    const docs = await backendCol
      .find({})
      .skip(i * BATCH_SIZE)
      .limit(BATCH_SIZE)
      .toArray();

    for (const doc of docs) {
      if (handledIds.has(String(doc._id))) continue; // already handled in Pass 1

      const transformed = transformProduct(doc, null, usedSlugs);

      const result = await targetCol.replaceOne(
        { _id: transformed._id },
        transformed,
        { upsert: true }
      );

      if (result.upsertedCount > 0) beInserted++;
      else if (result.modifiedCount > 0) beReplaced++;
    }
    console.log(`  [Backend] Batch ${i + 1}/${beBatches} processed`);
  }

  const unifiedCount = await targetCol.countDocuments();

  console.log('\n--- Summary ---');
  console.log(`CRM products processed   : ${crmCount}`);
  console.log(`  Inserted               : ${crmInserted}`);
  console.log(`  Replaced (re-run)      : ${crmReplaced}`);
  console.log(`Backend-only products    : ${beInserted + beReplaced}`);
  console.log(`  Inserted               : ${beInserted}`);
  console.log(`  Replaced (re-run)      : ${beReplaced}`);
  console.log(`Unified total            : ${unifiedCount}`);

  await connBackend.close();
  await connCRM.close();
  await connUnified.close();

  console.log('\n[DONE] Product migration complete.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
