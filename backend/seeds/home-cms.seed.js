/**
 * CMS Home page seed — builds the home page using clicon-* wrapper blocks
 * so the CMS-rendered output is pixel-identical to FallbackHomeClicon
 * (frontend/src/pages/index.jsx).
 *
 * Each clicon-* block is a thin wrapper that renders the existing hardcoded
 * Clicon section component. This gives CMS-driven content + visual parity.
 *
 * Run:  node backend/seeds/home-cms.seed.js
 */

const path = require('path');
const { MongoClient, ObjectId } = require(path.join(__dirname, '..', 'node_modules', 'mongodb'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://187.124.3.207:27017/shofy';

async function seed() {
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db('shofy');
  const now = new Date();

  const del = await db.collection('pages').deleteMany({ slug: 'home' });
  if (del.deletedCount) console.log(`Removed ${del.deletedCount} existing home page(s)`);

  // Order matches FallbackHomeClicon exactly
  const blocks = [
    { blockType: 'clicon-hero',                  order: 1 },
    { blockType: 'clicon-features-bar',          order: 2 },
    { blockType: 'clicon-best-deals',            order: 3 },
    { blockType: 'clicon-category-showcase',     order: 4 },
    { blockType: 'clicon-featured-products',     order: 5 },
    { blockType: 'clicon-double-banner',         order: 6 },
    {
      blockType: 'clicon-product-section-promo', order: 7,
      title: 'Computer Accessories',
      settings: { productType: 'electronics', queryType: 'new' },
    },
    { blockType: 'clicon-full-banner',           order: 8 },
    { blockType: 'clicon-product-columns',       order: 9 },
    { blockType: 'clicon-blog-area',             order: 10 },
    { blockType: 'clicon-newsletter',            order: 11 },
  ].map((b) => ({
    _id: new ObjectId(),
    isVisible: true,
    settings: {},
    ...b,
  }));

  const doc = {
    title: 'Home',
    slug: 'home',
    type: 'home',
    status: 'published',
    publishedAt: now,
    blocks,
    seo: {
      metaTitle: 'Shofy — Curated Vietnamese Marketplace',
      metaDescription:
        'Discover fashion, beauty, electronics, and more from trusted Vietnamese vendors.',
    },
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('pages').insertOne(doc);
  console.log(`Created home page with ${blocks.length} clicon-* blocks:`);
  blocks.forEach((b) => console.log(`  ${b.order}. ${b.blockType}${b.title ? ' — ' + b.title : ''}`));

  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
