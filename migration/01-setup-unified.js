'use strict';

/**
 * 01-setup-unified.js
 *
 * Connects to the unified (target) database and ensures all 16 collections
 * exist with their production indexes.  Safe to re-run — createCollection()
 * is a no-op when the collection already exists, and createIndex() is
 * idempotent by default.
 *
 * Usage:
 *   UNIFIED_URI=mongodb://... node migration/01-setup-unified.js
 */

const mongoose = require('mongoose');

const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

/**
 * Each entry describes one collection and the indexes that must exist on it.
 * Index spec format: { spec, options }
 * spec    — field-key object passed to createIndex()
 * options — MongoDB createIndex options (unique, sparse, expireAfterSeconds …)
 */
const SCHEMA = [
  {
    name: 'users',
    indexes: [
      { spec: { email: 1 },                         options: { unique: true, name: 'email_1_unique' } },
      { spec: { keycloakId: 1 },                    options: { unique: true, sparse: true, name: 'keycloakId_1' } },
      { spec: { 'vendorProfile.storeSlug': 1 },     options: { unique: true, sparse: true, name: 'vendorProfile_storeSlug_1' } },
      { spec: { role: 1, status: 1 },               options: { name: 'role_1_status_1' } },
      { spec: { createdAt: -1 },                    options: { name: 'createdAt_-1' } },
    ],
  },
  {
    name: 'admins',
    indexes: [
      { spec: { email: 1 },      options: { unique: true, name: 'email_1_unique' } },
      { spec: { keycloakId: 1 }, options: { unique: true, sparse: true, name: 'keycloakId_1' } },
      { spec: { role: 1 },       options: { name: 'role_1' } },
      { spec: { status: 1 },     options: { name: 'status_1' } },
    ],
  },
  {
    name: 'products',
    indexes: [
      { spec: { slug: 1 },              options: { unique: true, sparse: true, name: 'slug_1_unique' } },
      { spec: { vendor: 1 },            options: { sparse: true, name: 'vendor_1' } },
      { spec: { price: 1 },             options: { name: 'price_1' } },
      { spec: { sellCount: -1 },        options: { name: 'sellCount_-1' } },
      { spec: { 'offerDate.endDate': 1 }, options: { sparse: true, name: 'offerDate_endDate_1' } },
      { spec: { tags: 1 },              options: { name: 'tags_1' } },
      { spec: { createdAt: -1 },        options: { name: 'createdAt_-1' } },
      {
        spec: { title: 'text', description: 'text', tags: 'text' },
        options: { name: 'text_search' },
      },
    ],
  },
  {
    name: 'categories',
    indexes: [
      { spec: { slug: 1 },          options: { unique: true, sparse: true, name: 'slug_1_unique' } },
      { spec: { parentCategory: 1 }, options: { sparse: true, name: 'parentCategory_1' } },
      { spec: { level: 1 },         options: { name: 'level_1' } },
      { spec: { sortOrder: 1 },     options: { name: 'sortOrder_1' } },
      { spec: { 'ancestors._id': 1 }, options: { name: 'ancestors__id_1' } },
    ],
  },
  {
    name: 'brands',
    indexes: [
      { spec: { name: 1 },      options: { unique: true, name: 'name_1_unique' } },
      { spec: { slug: 1 },      options: { unique: true, sparse: true, name: 'slug_1_unique' } },
      { spec: { featured: 1 },  options: { name: 'featured_1' } },
      { spec: { sortOrder: 1 }, options: { name: 'sortOrder_1' } },
    ],
  },
  {
    name: 'orders',
    indexes: [
      { spec: { invoice: 1 },          options: { unique: true, sparse: true, name: 'invoice_1_unique' } },
      { spec: { orderNumber: 1 },      options: { unique: true, sparse: true, name: 'orderNumber_1_unique' } },
      { spec: { user: 1 },             options: { name: 'user_1' } },
      { spec: { status: 1 },           options: { name: 'status_1' } },
      { spec: { paymentStatus: 1 },    options: { name: 'paymentStatus_1' } },
      { spec: { paymentMethod: 1 },    options: { name: 'paymentMethod_1' } },
      { spec: { createdAt: -1 },       options: { name: 'createdAt_-1' } },
      { spec: { 'items.vendor': 1 },   options: { sparse: true, name: 'items_vendor_1' } },
      { spec: { trackingNumber: 1 },   options: { sparse: true, name: 'trackingNumber_1' } },
      { spec: { parentOrder: 1 },      options: { sparse: true, name: 'parentOrder_1' } },
    ],
  },
  {
    name: 'reviews',
    indexes: [
      { spec: { userId: 1, productId: 1 }, options: { name: 'userId_1_productId_1' } },
      { spec: { productId: 1 },            options: { name: 'productId_1' } },
      { spec: { status: 1 },               options: { name: 'status_1' } },
      { spec: { rating: 1 },               options: { name: 'rating_1' } },
      { spec: { isVerifiedPurchase: 1 },   options: { name: 'isVerifiedPurchase_1' } },
      { spec: { createdAt: -1 },           options: { name: 'createdAt_-1' } },
    ],
  },
  {
    name: 'coupons',
    indexes: [
      { spec: { couponCode: 1 },              options: { unique: true, sparse: true, name: 'couponCode_1_unique' } },
      { spec: { status: 1 },                  options: { name: 'status_1' } },
      { spec: { 'usedBy.userId': 1 },         options: { name: 'usedBy_userId_1' } },
      { spec: { applicableCategories: 1 },    options: { sparse: true, name: 'applicableCategories_1' } },
      { spec: { applicableProducts: 1 },      options: { sparse: true, name: 'applicableProducts_1' } },
    ],
  },
  {
    name: 'sitesettings',
    indexes: [
      { spec: { siteName: 1 }, options: { name: 'siteName_1' } },
    ],
  },
  {
    name: 'pages',
    indexes: [
      { spec: { slug: 1 },        options: { unique: true, name: 'slug_1_unique' } },
      { spec: { type: 1 },        options: { name: 'type_1' } },
      { spec: { status: 1 },      options: { name: 'status_1' } },
      { spec: { createdBy: 1 },   options: { name: 'createdBy_1' } },
      { spec: { publishedAt: -1 }, options: { name: 'publishedAt_-1' } },
    ],
  },
  {
    name: 'menus',
    indexes: [
      { spec: { name: 1 },                  options: { unique: true, name: 'name_1_unique' } },
      { spec: { slug: 1 },                  options: { unique: true, name: 'slug_1_unique' } },
      { spec: { location: 1 },              options: { name: 'location_1' } },
      { spec: { status: 1 },                options: { name: 'status_1' } },
      { spec: { location: 1, isDefault: 1 }, options: { name: 'location_1_isDefault_1' } },
    ],
  },
  {
    name: 'banners',
    indexes: [
      { spec: { type: 1 },                    options: { name: 'type_1' } },
      { spec: { status: 1 },                  options: { name: 'status_1' } },
      { spec: { priority: -1 },               options: { name: 'priority_-1' } },
      { spec: { 'scheduling.startDate': 1 },  options: { name: 'scheduling_startDate_1' } },
      { spec: { 'scheduling.endDate': 1 },    options: { name: 'scheduling_endDate_1' } },
      { spec: { 'targeting.pages': 1 },       options: { name: 'targeting_pages_1' } },
    ],
  },
  {
    name: 'blogposts',
    indexes: [
      { spec: { slug: 1 },      options: { unique: true, name: 'slug_1_unique' } },
      { spec: { author: 1 },    options: { name: 'author_1' } },
      { spec: { status: 1 },    options: { name: 'status_1' } },
      { spec: { featured: 1 },  options: { name: 'featured_1' } },
      { spec: { category: 1 },  options: { name: 'category_1' } },
      { spec: { tags: 1 },      options: { name: 'tags_1' } },
      { spec: { publishedAt: -1 }, options: { name: 'publishedAt_-1' } },
      {
        spec: { title: 'text', excerpt: 'text', content: 'text', tags: 'text' },
        options: { name: 'text_search' },
      },
    ],
  },
  {
    name: 'wishlists',
    indexes: [
      { spec: { user: 1 },                options: { unique: true, name: 'user_1_unique' } },
      { spec: { 'products.product': 1 },  options: { name: 'products_product_1' } },
    ],
  },
  {
    name: 'emailtemplates',
    indexes: [
      { spec: { name: 1 },              options: { unique: true, name: 'name_1_unique' } },
      { spec: { slug: 1 },              options: { unique: true, name: 'slug_1_unique' } },
      { spec: { type: 1 },              options: { name: 'type_1' } },
      { spec: { status: 1 },            options: { name: 'status_1' } },
      { spec: { type: 1, isDefault: 1 }, options: { name: 'type_1_isDefault_1' } },
    ],
  },
  {
    name: 'activitylogs',
    indexes: [
      // TTL index: auto-delete documents after 90 days (7 776 000 seconds)
      { spec: { timestamp: 1 }, options: { expireAfterSeconds: 7776000, name: 'timestamp_ttl' } },
      { spec: { 'actor.id': 1 },       options: { name: 'actor_id_1' } },
      { spec: { 'actor.type': 1 },     options: { name: 'actor_type_1' } },
      { spec: { action: 1 },           options: { name: 'action_1' } },
      { spec: { 'resource.type': 1 },  options: { name: 'resource_type_1' } },
      { spec: { 'resource.id': 1 },    options: { name: 'resource_id_1' } },
      { spec: { timestamp: -1 },       options: { name: 'timestamp_-1' } },
      { spec: { 'actor.id': 1, timestamp: -1 }, options: { name: 'actor_id_1_timestamp_-1' } },
    ],
  },
];

async function ensureCollection(db, name) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name);
    console.log(`  [CREATED] collection: ${name}`);
  } else {
    console.log(`  [EXISTS]  collection: ${name}`);
  }
}

async function ensureIndex(db, collectionName, spec, options) {
  try {
    await db.collection(collectionName).createIndex(spec, options);
    console.log(`    [INDEX] ${options.name || JSON.stringify(spec)}`);
  } catch (err) {
    if (err.codeName === 'IndexOptionsConflict' || err.code === 85) {
      console.log(`    [SKIP]  index already exists with different options: ${options.name}`);
    } else if (err.code === 86) {
      console.log(`    [SKIP]  index key pattern conflict (already exists): ${options.name}`);
    } else {
      throw err;
    }
  }
}

async function run() {
  console.log('\n=== 01-setup-unified: Create Collections & Indexes ===');
  console.log(`Target: ${UNIFIED_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let conn;
  try {
    conn = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to unified database\n');
  } catch (err) {
    console.error('[ERROR] Cannot connect:', err.message);
    process.exit(1);
  }

  const db = conn.db;

  for (const entry of SCHEMA) {
    console.log(`\nProcessing: ${entry.name}`);
    await ensureCollection(db, entry.name);

    for (const idx of entry.indexes) {
      await ensureIndex(db, entry.name, idx.spec, idx.options);
    }
  }

  await conn.close();

  console.log(`\n[DONE] ${SCHEMA.length} collections verified with indexes.`);
  console.log('Safe to re-run — all operations are idempotent.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
