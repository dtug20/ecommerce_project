'use strict';

/**
 * 12-seed-defaults.js
 *
 * Seeds the minimum CMS data required for the application to start
 * correctly after migration to the unified database.
 *
 * Documents created (all idempotent — skipped if already present):
 *
 *   SiteSetting (singleton)
 *     - siteName           : "Shofy"
 *     - theme.primaryColor : "#a42c48"
 *     - theme.fontFamily   : "Jost"
 *     - payment.enabledGateways: ["cod"]
 *     - i18n.defaultLanguage   : "en"
 *     - i18n.supportedLanguages: ["en","vi"]
 *
 *   Menu (location: "header-main")
 *     - items: Home, Shop, Coupons, Blog, Contact
 *     - status: "active", isDefault: true
 *
 *   Page (type: "home")
 *     - title: "Home", slug: "home", status: "published", blocks: []
 *
 * Idempotency:
 *   - SiteSetting: inserted only when the collection is empty.
 *   - Menu:        inserted only when no menu with location "header-main"
 *                  and isDefault=true already exists.
 *   - Page:        inserted only when no page with slug "home" exists.
 *
 * Usage:
 *   UNIFIED_URI=mongodb://... node migration/12-seed-defaults.js
 */

const mongoose = require('mongoose');

const UNIFIED_URI = process.env.UNIFIED_URI || 'mongodb://127.0.0.1:27017/shofy';

// ─── Default SiteSetting document ────────────────────────────────────────────
const DEFAULT_SITE_SETTING = {
  siteName:        'Shofy',
  siteDescription: 'Your one-stop online shop',
  logo:            null,
  favicon:         null,
  ogImage:         null,
  theme: {
    primaryColor:   '#a42c48',
    secondaryColor: '#821F40',
    accentColor:    '#F57F17',
    fontFamily:     'Jost',
    headerStyle:    'default',
    footerStyle:    'default',
  },
  contact: {
    email:       null,
    phone:       null,
    address:     null,
    socialLinks: [],
  },
  shipping: {
    freeShippingThreshold: 0,
    defaultShippingCost:   0,
    enabledMethods:        [],
  },
  payment: {
    enabledGateways: ['cod'],
    currency:        'USD',
    currencySymbol:  '$',
  },
  seo: {
    defaultTitle:       'Shofy — Online Store',
    defaultDescription: 'Shop the best products at Shofy.',
    defaultKeywords:    ['ecommerce', 'shop', 'online store'],
    googleAnalyticsId:  null,
    facebookPixelId:    null,
  },
  maintenance: {
    isEnabled: false,
    message:   null,
  },
  i18n: {
    defaultLanguage:    'en',
    supportedLanguages: ['en', 'vi'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Default header menu ──────────────────────────────────────────────────────
function buildHeaderMenu() {
  const now = new Date();
  const items = [
    { label: 'Home',    url: '/',        type: 'link', order: 0, isVisible: true, children: [] },
    { label: 'Shop',    url: '/shop',    type: 'link', order: 1, isVisible: true, children: [] },
    { label: 'Coupons', url: '/coupons', type: 'link', order: 2, isVisible: true, children: [] },
    { label: 'Blog',    url: '/blog',    type: 'link', order: 3, isVisible: true, children: [] },
    { label: 'Contact', url: '/contact', type: 'link', order: 4, isVisible: true, children: [] },
  ].map(item => ({
    _id:       new mongoose.Types.ObjectId(),
    label:     item.label,
    labelVi:   null,
    type:      item.type,
    url:       item.url,
    target:    '_self',
    reference: null,
    icon:      null,
    image:     null,
    children:  item.children,
    order:     item.order,
    isVisible: item.isVisible,
  }));

  return {
    name:      'Main Navigation',
    slug:      'header-main',
    location:  'header-main',
    items,
    status:    'active',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Default home page ────────────────────────────────────────────────────────
function buildHomePage() {
  const now = new Date();
  return {
    title:       'Home',
    slug:        'home',
    type:        'home',
    status:      'published',
    blocks:      [],
    seo: {
      metaTitle:       null,
      metaDescription: null,
      ogImage:         null,
    },
    publishedAt: now,
    createdBy:   null,
    updatedBy:   null,
    createdAt:   now,
    updatedAt:   now,
  };
}

async function seedSiteSetting(db) {
  const col   = db.collection('sitesettings');
  const count = await col.countDocuments();

  if (count > 0) {
    console.log('  [SKIP] SiteSetting already exists — not overwriting.');
    return;
  }

  await col.insertOne(DEFAULT_SITE_SETTING);
  console.log('  [CREATED] SiteSetting singleton');
}

async function seedHeaderMenu(db) {
  const col = db.collection('menus');

  const existing = await col.findOne({ location: 'header-main', isDefault: true });
  if (existing) {
    console.log(`  [SKIP] Default header menu already exists (id: ${existing._id})`);
    return;
  }

  await col.insertOne(buildHeaderMenu());
  console.log('  [CREATED] Default header-main menu with 5 items');
}

async function seedHomePage(db) {
  const col = db.collection('pages');

  const existing = await col.findOne({ slug: 'home' });
  if (existing) {
    console.log(`  [SKIP] Home page already exists (id: ${existing._id})`);
    return;
  }

  await col.insertOne(buildHomePage());
  console.log('  [CREATED] Home page (slug: "home", status: "published")');
}

async function run() {
  console.log('\n=== 12-seed-defaults ===');
  console.log(`Target: ${UNIFIED_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let conn;
  try {
    conn = await mongoose.createConnection(UNIFIED_URI).asPromise();
    console.log('[OK] Connected to unified database\n');
  } catch (err) {
    console.error('[ERROR] Connection failed:', err.message);
    process.exit(1);
  }

  const db = conn.db;

  console.log('Seeding SiteSetting...');
  await seedSiteSetting(db);

  console.log('\nSeeding default Menu...');
  await seedHeaderMenu(db);

  console.log('\nSeeding Home Page...');
  await seedHomePage(db);

  await conn.close();

  console.log('\n[DONE] Default CMS data seeded.');
  console.log('The application can now start and read configuration from the unified database.');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
