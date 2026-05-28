# Shofy Catalog Cleanup & Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix, reclassify, and Vietnamese-localize the 53 existing Shofy products, add ~66 new products from DummyJSON (→ ~120, balanced across 6 verticals), give every product a unique correct Cloudinary image, via a safe, idempotent, reversible mongoose migration.

**Architecture:** All logic lives in `backend/scripts/`. A frozen single-source-of-truth `lib/mappings.js` defines the taxonomy + every mapping rule. Pure transform functions are unit-tested; DB scripts are integration-tested with `mongodb-memory-server`; network (Gemini, Cloudinary) is mocked in tests. The live run is gated behind a mandatory EJSON backup and a default `--dry-run`; a 12-check `verify.js` confirms correctness; `rollback.js` restores from backup.

**Tech Stack:** Node + Mongoose (existing models), jest 30, mongodb-memory-server 9.5, axios, cloudinary SDK (cloud `dfddeabbs`), Gemini (`GEMINI_API_KEY`/`GEMINI_CHAT_MODEL`).

**Spec:** `docs/superpowers/specs/2026-05-29-shofy-catalog-cleanup-design.md` (read it first).

**Conventions for every task:** run tests from `backend/` with `npx jest <path>`; new test files go under `backend/tests/scripts/`. Commit after each task. Never run a write script against the live DB until Task 17.

---

## File Structure

```
backend/scripts/
  lib/
    mappings.js       # FROZEN taxonomy + all mapping rules + pure fns (price, slug, status)
    db.js             # connect via MONGO_URI, models, --dry-run/--commit flag parsing, safeWrite
    log.js            # structured logger (run log + console)
    translate.js      # Gemini VN translation w/ cache + English fallback
    images.js         # download (axios) + Cloudinary upload, deterministic public_id, manifest
    build-product.js  # buildProductDoc(dj, ctx) — pure transform DJ -> Products doc
  data/
    dummyjson-catalog.json   # source snapshot (copied from /tmp/shofy-catalog/)
    selection.json           # FROZEN list of new-product DJ ids (generated, committed)
    build-selection.js       # generator for selection.json
    translations.cache.json  # idempotency cache (committed after first run)
    image-manifest.json      # idempotency cache (committed after first run)
  backup.js           # EJSON dump products+categories+brands + manifest (pre-write gate)
  import-brands.js    # upsert real + house brands (idempotent by name)
  import-categories.js# upsert/rename frozen tree by parent, soft-delete extras
  fix-existing.js     # re-point + rebrand + localize + image-fix the 53
  import-new.js       # import selection.json new products
  resync-aggregates.js# rebuild category.products[] + nProducts + status
  verify.js           # 12 read-only checks, non-zero exit on fail
  rollback.js         # restore from backup (mongoUriHash guard, --yes)
  migrate.js          # orchestrator: backup->brands->categories->fix->new->resync->verify
backend/backups/.gitkeep
backend/tests/scripts/*.test.js
frontend/src/layout/headers/header-com/header-category.jsx   # menu: 6 types + VN labels
```

---

## Task 0: Scaffolding, gitignore, npm aliases

**Files:**
- Create: `backend/scripts/lib/`, `backend/scripts/data/`, `backend/backups/.gitkeep` (dirs)
- Modify: `backend/.gitignore` (create if absent), `backend/package.json` (scripts)

- [ ] **Step 1: Create directories and keepfile**

```bash
cd backend
mkdir -p scripts/lib scripts/data backups tests/scripts
touch backups/.gitkeep
```

- [ ] **Step 2: Ignore backup payloads but keep the folder**

Append to `backend/.gitignore` (create the file if it does not exist):

```gitignore
# catalog migration backups (payloads are large / contain live data)
scripts/backups/
backups/*
!backups/.gitkeep
```

- [ ] **Step 3: Add npm script aliases**

In `backend/package.json`, add to the `"scripts"` object (keep existing entries):

```json
    "catalog:backup": "node scripts/backup.js",
    "catalog:dry": "node scripts/migrate.js",
    "catalog:commit": "node scripts/migrate.js --commit",
    "catalog:verify": "node scripts/verify.js",
    "catalog:rollback": "node scripts/rollback.js",
    "catalog:selection": "node scripts/data/build-selection.js"
```

- [ ] **Step 4: Copy the source snapshot into the repo**

```bash
cp /tmp/shofy-catalog/dummyjson-catalog.json backend/scripts/data/dummyjson-catalog.json
```
Expected: file exists, `node -e "console.log(require('./backend/scripts/data/dummyjson-catalog.json').length)"` prints `194`.

- [ ] **Step 5: Commit**

```bash
git add backend/.gitignore backend/package.json backend/scripts/data/dummyjson-catalog.json backend/backups/.gitkeep
git commit -m "chore(catalog): scaffold migration scripts dir, aliases, source snapshot"
```

---

## Task 1: `lib/mappings.js` — pure helper functions (TDD)

**Files:**
- Create: `backend/scripts/lib/mappings.js`
- Test: `backend/tests/scripts/mappings-helpers.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/mappings-helpers.test.js`:

```js
const { usdToVnd, statusFromStock, slugify, sizesForType } = require('../../scripts/lib/mappings');

describe('mappings helpers', () => {
  it('converts USD to VND rounded to nearest 1000', () => {
    expect(usdToVnd(9.99)).toBe(250000);    // 249750 -> 250000
    expect(usdToVnd(129.99)).toBe(3250000); // 3249750 -> 3250000
    expect(usdToVnd(0.79)).toBe(20000);     // 19750 -> 20000
  });
  it('maps stock to hyphenated status enum', () => {
    expect(statusFromStock(0)).toBe('out-of-stock');
    expect(statusFromStock(5)).toBe('in-stock');
  });
  it('slugifies including Vietnamese diacritics and &', () => {
    expect(slugify('Tai nghe')).toBe('tai-nghe');
    expect(slugify('Nhà cửa & Đời sống')).toBe('nha-cua-doi-song');
    expect(slugify('Đồng hồ')).toBe('dong-ho');
  });
  it('returns clothing sizes for fashion, shoe sizes for Giày dép, [] otherwise', () => {
    expect(sizesForType('fashion', 'Thời trang nữ')).toEqual(['S', 'M', 'L']);
    expect(sizesForType('fashion', 'Giày dép')).toEqual(['38', '39', '40', '41', '42']);
    expect(sizesForType('electronics', 'Tai nghe')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/mappings-helpers.test.js`
Expected: FAIL — "Cannot find module '../../scripts/lib/mappings'".

- [ ] **Step 3: Write minimal implementation**

Create `backend/scripts/lib/mappings.js`:

```js
'use strict';

const USD_TO_VND = 25000;

const usdToVnd = (usd) => Math.round((Number(usd) * USD_TO_VND) / 1000) * 1000;

const statusFromStock = (stock) => (Number(stock) === 0 ? 'out-of-stock' : 'in-stock');

// Remove Vietnamese diacritics, drop '&', collapse spaces to single dashes, lowercase.
const slugify = (str) =>
  String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining marks
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const sizesForType = (productType, parent) => {
  if (productType === 'fashion' && parent === 'Giày dép') return ['38', '39', '40', '41', '42'];
  if (productType === 'fashion') return ['S', 'M', 'L'];
  return [];
};

module.exports = { USD_TO_VND, usdToVnd, statusFromStock, slugify, sizesForType };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/mappings-helpers.test.js`
Expected: PASS (3+ specs).

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/mappings.js backend/tests/scripts/mappings-helpers.test.js
git commit -m "feat(catalog): mappings price/status/slug/sizes helpers + tests"
```

---

## Task 2: `lib/mappings.js` — FROZEN taxonomy, DJ→category map, brand matrix (TDD)

**Files:**
- Modify: `backend/scripts/lib/mappings.js`
- Test: `backend/tests/scripts/mappings-taxonomy.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/mappings-taxonomy.test.js`:

```js
const {
  CATEGORY_TREE, DJ_CATEGORY_MAP, EXCLUDED_DJ, HOUSE_BRANDS, VN_SPECIAL,
  SOFT_DELETE_PARENTS, PRODUCT_TYPES, mapDjToTaxonomy, brandFixFor,
} = require('../../scripts/lib/mappings');

describe('frozen taxonomy', () => {
  it('only uses the 6 productTypes (lowercase) and unique parents', () => {
    const types = new Set(CATEGORY_TREE.map(c => c.productType));
    expect([...types].sort()).toEqual(['beauty','electronics','fashion','home','jewelry','sports']);
    const parents = CATEGORY_TREE.map(c => c.parent);
    expect(new Set(parents).size).toBe(parents.length); // unique
    expect(PRODUCT_TYPES).toEqual(['electronics','fashion','beauty','jewelry','home','sports']);
  });
  it('covers home and sports so nothing is orphaned', () => {
    expect(CATEGORY_TREE.some(c => c.productType === 'home')).toBe(true);
    expect(CATEGORY_TREE.some(c => c.productType === 'sports')).toBe(true);
  });
  it('maps every non-excluded DummyJSON category to a parent that exists in the tree', () => {
    const parents = new Set(CATEGORY_TREE.map(c => c.parent));
    for (const [dj, m] of Object.entries(DJ_CATEGORY_MAP)) {
      expect(PRODUCT_TYPES).toContain(m.productType);
      expect(parents.has(m.parent)).toBe(true);
    }
  });
  it('routes watches to the dedicated Đồng hồ jewelry category (finding #6)', () => {
    expect(mapDjToTaxonomy('mens-watches', { title: 'Rolex' })).toMatchObject({ productType: 'jewelry', parent: 'Đồng hồ' });
    expect(mapDjToTaxonomy('womens-watches', { title: 'Datejust' })).toMatchObject({ productType: 'jewelry', parent: 'Đồng hồ' });
  });
  it('routes smartphones to electronics/Điện thoại with a children value', () => {
    const r = mapDjToTaxonomy('smartphones', { title: 'iPhone 14 Pro', brand: 'Apple' });
    expect(r).toMatchObject({ productType: 'electronics', parent: 'Điện thoại' });
    expect(typeof r.children).toBe('string');
    expect(r.children.length).toBeGreaterThan(0);
  });
  it('excludes groceries/motorcycle/vehicle', () => {
    expect(EXCLUDED_DJ).toEqual(expect.arrayContaining(['groceries','motorcycle','vehicle']));
    expect(DJ_CATEGORY_MAP['groceries']).toBeUndefined();
  });
  it('has a house brand per productType and freezes 7 VN-special items', () => {
    expect(Object.keys(HOUSE_BRANDS).sort()).toEqual(['beauty','electronics','fashion','home','jewelry','sports']);
    expect(VN_SPECIAL.length).toBe(7);
  });
  it('brandFixFor reassigns Logitech-on-clothing to a sensible brand', () => {
    const fix = brandFixFor({ title: 'Ao Dai Truyen Thong Lua new', productType: 'fashion', brandName: 'Logitech' });
    expect(fix).toBeTruthy();
    expect(fix).not.toBe('Logitech');
  });
  it('soft-delete list names the 3 merged-away categories', () => {
    expect(SOFT_DELETE_PARENTS).toEqual(expect.arrayContaining(['CPU Heat Pipes','Beauty of Skin','Facial Care']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/mappings-taxonomy.test.js`
Expected: FAIL — exports undefined.

- [ ] **Step 3: Write the implementation (append to `lib/mappings.js`)**

Append to `backend/scripts/lib/mappings.js` (before the `module.exports` line, then extend the export):

```js
const PRODUCT_TYPES = ['electronics', 'fashion', 'beauty', 'jewelry', 'home', 'sports'];

// FROZEN canonical taxonomy. `oldParent` (when present) is the existing Category.parent to
// RENAME in place (preserves _id); absorb[] lists extra old parents merged into this one.
const CATEGORY_TREE = [
  // electronics
  { parent: 'Tai nghe',            productType: 'electronics', oldParent: 'Headphones',     children: ['Bluetooth','Nhét tai','Chụp tai'], featured: true,  sortOrder: 1 },
  { parent: 'Điện thoại',          productType: 'electronics',                              children: ['Apple','Samsung','Android'],       featured: true,  sortOrder: 2 },
  { parent: 'Máy tính bảng',       productType: 'electronics', oldParent: 'Mobile Tablets', children: ['Apple','Samsung'],                  featured: false, sortOrder: 3 },
  { parent: 'Laptop',              productType: 'electronics', oldParent: 'pc',             children: ['Apple','Dell','Asus','Lenovo'],     featured: false, sortOrder: 4 },
  { parent: 'Đồng hồ thông minh',  productType: 'electronics', oldParent: 'Smart Watch',    children: ['Apple Watch','Thể thao'],           featured: false, sortOrder: 5 },
  { parent: 'Phụ kiện điện tử',    productType: 'electronics', oldParent: 'Bluetooth', absorb: ['CPU Heat Pipes'], children: ['Sạc & Cáp','Loa','Phụ kiện PC'], featured: false, sortOrder: 6 },
  // fashion
  { parent: 'Thời trang nữ',       productType: 'fashion', oldParent: 'Clothing', children: ['Đầm','Áo','Truyền thống'], featured: true,  sortOrder: 7 },
  { parent: 'Thời trang nam',      productType: 'fashion',                        children: ['Sơ mi','Áo thun'],         featured: false, sortOrder: 8 },
  { parent: 'Giày dép',            productType: 'fashion', oldParent: 'Shoes',    children: ['Nam','Nữ'],                featured: false, sortOrder: 9 },
  { parent: 'Túi xách',            productType: 'fashion', oldParent: 'Bags',     children: ['Túi đeo','Túi du lịch'],   featured: false, sortOrder: 10 },
  { parent: 'Kính mát',            productType: 'fashion',                        children: ['Nam','Nữ'],                featured: false, sortOrder: 11 },
  // beauty
  { parent: 'Chăm sóc da',         productType: 'beauty', oldParent: 'Discover Skincare', absorb: ['Beauty of Skin'], children: ['Serum','Kem dưỡng','Mặt nạ'], featured: true,  sortOrder: 12 },
  { parent: 'Trang điểm',          productType: 'beauty', oldParent: 'Awesome Lip Care',  absorb: ['Facial Care'],    children: ['Son','Phấn','Cọ trang điểm'], featured: false, sortOrder: 13 },
  { parent: 'Nước hoa',            productType: 'beauty',                                                              children: ['Nữ','Nam'],                   featured: false, sortOrder: 14 },
  // jewelry
  { parent: 'Vòng tay',            productType: 'jewelry', oldParent: 'Bracelets', children: ['Vàng','Bạc'], featured: false, sortOrder: 15 },
  { parent: 'Hoa tai',             productType: 'jewelry', oldParent: 'Earrings',  children: ['Vàng','Bạc'], featured: false, sortOrder: 16 },
  { parent: 'Dây chuyền',          productType: 'jewelry', oldParent: 'Necklaces', children: ['Vàng','Bạc'], featured: false, sortOrder: 17 },
  { parent: 'Nhẫn',                productType: 'jewelry',                         children: ['Vàng','Bạc'], featured: false, sortOrder: 18 },
  { parent: 'Đồng hồ',             productType: 'jewelry',                         children: ['Nam','Nữ'],   featured: true,  sortOrder: 19 },
  // home
  { parent: 'Trang trí nhà cửa',   productType: 'home', children: ['Đèn','Đồ trang trí'],     featured: true,  sortOrder: 20 },
  { parent: 'Nội thất',            productType: 'home', children: ['Phòng khách','Phòng ngủ'], featured: false, sortOrder: 21 },
  { parent: 'Đồ bếp',              productType: 'home', children: ['Dụng cụ','Bộ ấm trà'],     featured: false, sortOrder: 22 },
  // sports
  { parent: 'Dụng cụ thể thao',    productType: 'sports', children: ['Yoga','Gym','Phụ kiện'], featured: false, sortOrder: 23 },
];

const EXCLUDED_DJ = ['groceries', 'motorcycle', 'vehicle'];

// DummyJSON category slug -> { productType, parent }. Excluded cats intentionally absent.
const DJ_CATEGORY_MAP = {
  laptops:             { productType: 'electronics', parent: 'Laptop' },
  smartphones:         { productType: 'electronics', parent: 'Điện thoại' },
  'mobile-accessories':{ productType: 'electronics', parent: 'Phụ kiện điện tử' },
  tablets:             { productType: 'electronics', parent: 'Máy tính bảng' },
  'womens-dresses':    { productType: 'fashion', parent: 'Thời trang nữ' },
  tops:                { productType: 'fashion', parent: 'Thời trang nữ' },
  'mens-shirts':       { productType: 'fashion', parent: 'Thời trang nam' },
  'mens-shoes':        { productType: 'fashion', parent: 'Giày dép' },
  'womens-shoes':      { productType: 'fashion', parent: 'Giày dép' },
  'womens-bags':       { productType: 'fashion', parent: 'Túi xách' },
  sunglasses:          { productType: 'fashion', parent: 'Kính mát' },
  beauty:              { productType: 'beauty', parent: 'Trang điểm' },
  fragrances:          { productType: 'beauty', parent: 'Nước hoa' },
  'skin-care':         { productType: 'beauty', parent: 'Chăm sóc da' },
  'womens-jewellery':  { productType: 'jewelry', parent: 'Nhẫn' },
  'womens-watches':    { productType: 'jewelry', parent: 'Đồng hồ' },
  'mens-watches':      { productType: 'jewelry', parent: 'Đồng hồ' },
  'home-decoration':   { productType: 'home', parent: 'Trang trí nhà cửa' },
  furniture:           { productType: 'home', parent: 'Nội thất' },
  'kitchen-accessories':{ productType: 'home', parent: 'Đồ bếp' },
  'sports-accessories':{ productType: 'sports', parent: 'Dụng cụ thể thao' },
};

const HOUSE_BRANDS = {
  electronics: 'Shofy Tech',
  fashion: 'Shofy Wear',
  beauty: 'Shofy Beauty',
  jewelry: 'Shofy Jewels',
  home: 'Shofy Home',
  sports: 'Shofy Sport',
};

// 7 frozen VN-special items (match by title substring, case-insensitive).
const VN_SPECIAL = [
  'Ao Dai Truyen Thong Lua',
  'Linen Summer Dress',
  'Silk Scarf Hand-painted',
  'K-Beauty Cleansing Set',
  'Bamboo Tea Set',
  'Rattan Pendant Lamp',
  'Linen Bedding Set Queen',
];

const SOFT_DELETE_PARENTS = ['CPU Heat Pipes', 'Beauty of Skin', 'Facial Care'];

// Brand-fix matrix for existing products. Each rule: { when:(p)=>bool, brand:string }.
// First matching rule wins. `p` = { title, productType, brandName }.
const _wrongBrands = new Set(['Logitech', 'Antec', 'Sony', 'Deepcool', 'Lenovo']);
const BRAND_FIX_RULES = [
  { when: (p) => p.productType === 'fashion' && /ao dai|linen summer dress|silk scarf|tote|traveling bag/i.test(p.title), brand: 'Legendary Whitetails' },
  { when: (p) => p.productType === 'beauty', brand: 'INIKA' },
  { when: (p) => p.productType === 'home',   brand: HOUSE_BRANDS.home },
  { when: (p) => p.productType === 'sports', brand: HOUSE_BRANDS.sports },
  { when: (p) => p.productType === 'jewelry', brand: HOUSE_BRANDS.jewelry },
  { when: (p) => p.productType === 'electronics' && /headphone|earbud|speaker|wireless/i.test(p.title) && _wrongBrands.has(p.brandName), brand: 'Sony' },
];

// Returns a corrected brand name if the current brand is wrong for the product, else null.
const brandFixFor = (p) => {
  for (const r of BRAND_FIX_RULES) if (r.when(p)) return r.brand;
  return null;
};

// Choose the single `children` String for a product given its DJ category + fields.
const pickChildren = (djCategory, dj, parent) => {
  const node = CATEGORY_TREE.find((c) => c.parent === parent);
  const kids = (node && node.children) || [];
  const title = (dj.title || '').toLowerCase();
  const brand = (dj.brand || '').toLowerCase();
  if (kids.includes('Apple') && (/apple|iphone|ipad|macbook/.test(title) || brand === 'apple')) return 'Apple';
  if (kids.includes('Samsung') && (/samsung|galaxy/.test(title) || brand === 'samsung')) return 'Samsung';
  if (djCategory === 'mens-shoes' || djCategory === 'mens-shirts' || djCategory === 'mens-watches') return kids.includes('Nam') ? 'Nam' : kids[0];
  if (djCategory === 'womens-shoes' || djCategory === 'womens-watches') return kids.includes('Nữ') ? 'Nữ' : kids[0];
  return kids[0] || 'Khác';
};

const mapDjToTaxonomy = (djCategory, dj = {}) => {
  const m = DJ_CATEGORY_MAP[djCategory];
  if (!m) return null; // excluded / unknown
  return { productType: m.productType, parent: m.parent, children: pickChildren(djCategory, dj, m.parent) };
};
```

Then change the final export line to:

```js
module.exports = {
  USD_TO_VND, usdToVnd, statusFromStock, slugify, sizesForType,
  PRODUCT_TYPES, CATEGORY_TREE, EXCLUDED_DJ, DJ_CATEGORY_MAP, HOUSE_BRANDS,
  VN_SPECIAL, SOFT_DELETE_PARENTS, brandFixFor, pickChildren, mapDjToTaxonomy,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/mappings-taxonomy.test.js`
Expected: PASS (all specs).

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/mappings.js backend/tests/scripts/mappings-taxonomy.test.js
git commit -m "feat(catalog): frozen taxonomy, DJ->category map, brand-fix matrix + tests"
```

---

## Task 3: `lib/db.js` — connection, models, flag parsing (TDD for parseFlags)

**Files:**
- Create: `backend/scripts/lib/db.js`
- Test: `backend/tests/scripts/db-flags.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/db-flags.test.js`:

```js
const { parseFlags } = require('../../scripts/lib/db');

describe('parseFlags', () => {
  it('defaults to dry-run (commit false)', () => {
    expect(parseFlags([])).toMatchObject({ commit: false, dryRun: true });
  });
  it('--commit enables writes', () => {
    expect(parseFlags(['--commit'])).toMatchObject({ commit: true, dryRun: false });
  });
  it('captures --yes and positional timestamp', () => {
    const f = parseFlags(['--commit', '--yes', '2026-05-29T00-00-00']);
    expect(f.yes).toBe(true);
    expect(f.positional).toContain('2026-05-29T00-00-00');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/db-flags.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`backend/scripts/lib/db.js`:

```js
'use strict';
const mongoose = require('mongoose');
const { secret } = require('../../config/secret');
const Products = require('../../model/Products');
const Category = require('../../model/Category');
const Brand = require('../../model/Brand');

function parseFlags(argv = process.argv.slice(2)) {
  const flags = { commit: false, dryRun: true, yes: false, positional: [] };
  for (const a of argv) {
    if (a === '--commit') { flags.commit = true; flags.dryRun = false; }
    else if (a === '--yes') flags.yes = true;
    else if (!a.startsWith('--')) flags.positional.push(a);
  }
  return flags;
}

async function connect(uri = secret.db_url) {
  if (!uri) throw new Error('MONGO_URI is not set (config/secret.js db_url)');
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  return mongoose.connection;
}

async function disconnect() { await mongoose.disconnect(); }

module.exports = { mongoose, parseFlags, connect, disconnect, Products, Category, Brand };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/db-flags.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/db.js backend/tests/scripts/db-flags.test.js
git commit -m "feat(catalog): db lib (connect, models, dry-run/commit flags) + tests"
```

---

## Task 4: `lib/log.js` — structured logger (TDD)

**Files:**
- Create: `backend/scripts/lib/log.js`
- Test: `backend/tests/scripts/log.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/log.test.js`:

```js
const { createLogger } = require('../../scripts/lib/log');

describe('createLogger', () => {
  it('buffers lines and prefixes level + step', () => {
    const out = [];
    const log = createLogger({ sink: (l) => out.push(l) });
    log.info('start', { n: 1 });
    log.warn('careful');
    expect(out[0]).toMatch(/INFO .*start.*"n":1/);
    expect(out[1]).toMatch(/WARN .*careful/);
    expect(log.lines().length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/log.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`backend/scripts/lib/log.js`:

```js
'use strict';
const fs = require('fs');

function createLogger({ sink = console.log, file = null } = {}) {
  const buffer = [];
  const emit = (level, msg, meta) => {
    const line = `${level} ${msg}` + (meta !== undefined ? ` ${JSON.stringify(meta)}` : '');
    buffer.push(line);
    sink(line);
    if (file) fs.appendFileSync(file, line + '\n');
  };
  return {
    info: (m, meta) => emit('INFO', m, meta),
    warn: (m, meta) => emit('WARN', m, meta),
    error: (m, meta) => emit('ERROR', m, meta),
    lines: () => buffer.slice(),
  };
}

module.exports = { createLogger };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/log.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/log.js backend/tests/scripts/log.test.js
git commit -m "feat(catalog): structured logger + tests"
```

---

## Task 5: `lib/build-product.js` — pure DJ→Products transform (TDD)

**Files:**
- Create: `backend/scripts/lib/build-product.js`
- Test: `backend/tests/scripts/build-product.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/build-product.test.js`:

```js
const { buildProductDoc } = require('../../scripts/lib/build-product');

const phone = {
  title: 'iPhone 14 Pro', description: 'A great phone', category: 'smartphones',
  price: 999, discountPercentage: 10.5, stock: 12, rating: 4.8, sku: 'ELE-APP-001',
  weight: 1, tags: ['phone'], brand: 'Apple',
};

describe('buildProductDoc', () => {
  it('produces a schema-valid product doc with VND price and resolved refs', () => {
    const doc = buildProductDoc(phone, {
      importId: 'dummyjson:1', categoryId: 'cat1', brandName: 'Apple', brandId: 'br1',
      translation: { title_vi: 'iPhone 14 Pro', description_vi: 'Điện thoại tuyệt vời' },
      images: ['https://res.cloudinary.com/dfddeabbs/image/upload/dj-ele-app-001-0.webp'],
    });
    expect(doc.price).toBe(24975000);
    expect(doc.status).toBe('in-stock');
    expect(doc.productType).toBe('electronics');
    expect(doc.parent).toBe('Điện thoại');
    expect(doc.category).toEqual({ name: 'Điện thoại', id: 'cat1' });
    expect(doc.brand).toEqual({ name: 'Apple', id: 'br1' });
    expect(doc.img).toMatch(/^https:\/\/res\.cloudinary\.com\/dfddeabbs\//);
    expect(doc.imageURLs[0].sizes).toEqual([]); // electronics -> no sizes
    expect(doc.unit).toBe('1pc');
    expect(doc.importId).toBe('dummyjson:1');
    expect(doc.featured).toBe(true);
  });

  it('falls back to English title when no translation, and sets fashion sizes', () => {
    const dress = { ...phone, title: 'Red Summer Dress', category: 'womens-dresses', price: 40, stock: 0, rating: 3.9, sku: 'FAS-DRS-001', brand: null };
    const doc = buildProductDoc(dress, { importId: 'dummyjson:2', categoryId: 'c2', brandName: 'Shofy Wear', brandId: 'b2', translation: null, images: ['https://res.cloudinary.com/dfddeabbs/x.webp'] });
    expect(doc.title).toBe('Red Summer Dress');
    expect(doc.status).toBe('out-of-stock');
    expect(doc.productType).toBe('fashion');
    expect(doc.imageURLs[0].sizes).toEqual(['S', 'M', 'L']);
    expect(doc.featured).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/build-product.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`backend/scripts/lib/build-product.js`:

```js
'use strict';
const { usdToVnd, statusFromStock, slugify, sizesForType, mapDjToTaxonomy } = require('./mappings');

// ctx: { importId, categoryId, brandName, brandId, translation:{title_vi,description_vi}|null, images:[secure_url], taxonomy?:{productType,parent,children} }
function buildProductDoc(dj, ctx) {
  const tax = ctx.taxonomy || mapDjToTaxonomy(dj.category, dj);
  if (!tax) throw new Error(`No taxonomy mapping for DummyJSON category "${dj.category}"`);
  const title = ((ctx.translation && ctx.translation.title_vi) || dj.title || '').slice(0, 200);
  const description = (ctx.translation && ctx.translation.description_vi) || dj.description || title;
  const images = (ctx.images || []).filter(Boolean).slice(0, 4);
  const sizes = sizesForType(tax.productType, tax.parent);
  return {
    importId: ctx.importId,
    sku: dj.sku,
    title,
    slug: slugify(title),
    unit: '1pc',
    productType: tax.productType,
    parent: tax.parent,
    children: tax.children,
    category: { name: tax.parent, id: ctx.categoryId },
    brand: { name: ctx.brandName, id: ctx.brandId },
    price: usdToVnd(dj.price),
    discount: Math.round((dj.discountPercentage || 0) * 100) / 100,
    quantity: dj.stock,
    status: statusFromStock(dj.stock),
    description,
    img: images[0],
    imageURLs: images.map((u) => ({ img: u, color: { name: 'Mặc định', clrCode: '#000000' }, sizes })),
    tags: dj.tags || [],
    sizes,
    weight: dj.weight,
    featured: (dj.rating || 0) >= 4.5,
    sellCount: 0,
  };
}

module.exports = { buildProductDoc };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/build-product.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/build-product.js backend/tests/scripts/build-product.test.js
git commit -m "feat(catalog): pure DJ->Products transform + tests"
```

---

## Task 6: Test memory-server helper + `backup.js` (TDD, integration)

**Files:**
- Create: `backend/tests/scripts/_mem.js`, `backend/scripts/backup.js`
- Test: `backend/tests/scripts/backup.test.js`

- [ ] **Step 1: Write the in-memory Mongo helper**

`backend/tests/scripts/_mem.js`:

```js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mem;
async function startMem() {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'shofy_test' });
  return mongoose.connection;
}
async function stopMem() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (mem) await mem.stop();
}
module.exports = { startMem, stopMem, mongoose };
```

- [ ] **Step 2: Write the failing test**

`backend/tests/scripts/backup.test.js`:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startMem, stopMem } = require('./_mem');
const { Brand, Category, Products } = require('../../scripts/lib/db');
const { runBackup } = require('../../scripts/backup');

let dir;
beforeAll(async () => {
  await startMem();
  await Brand.create({ name: 'Apple', status: 'active' });
  await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show' });
  await Products.create({ title: 'X headset', img: 'https://res.cloudinary.com/dfddeabbs/a.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 100000, quantity: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Apple', id: new (require('mongoose').Types.ObjectId)() }, category: { name: 'Tai nghe', id: new (require('mongoose').Types.ObjectId)() } });
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-'));
});
afterAll(async () => { await stopMem(); });

it('writes EJSON dumps + manifest and reports counts', async () => {
  const res = await runBackup({ dir });
  expect(res.counts).toMatchObject({ products: 1, categories: 1, brands: 1 });
  expect(fs.existsSync(path.join(res.outDir, 'products.json'))).toBe(true);
  const manifest = JSON.parse(fs.readFileSync(path.join(res.outDir, 'manifest.json'), 'utf8'));
  expect(manifest.counts.products).toBe(1);
  expect(manifest.mongoUriHash).toMatch(/^[a-f0-9]{64}$/);
  expect(manifest).not.toHaveProperty('mongoUri');
});

it('aborts when a collection is empty', async () => {
  await Products.deleteMany({});
  await expect(runBackup({ dir })).rejects.toThrow(/empty|0 docs/i);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/backup.test.js`
Expected: FAIL — `runBackup` not found.

- [ ] **Step 4: Write the implementation**

`backend/scripts/backup.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EJSON } = require('bson');
const { mongoose, connect, disconnect, Products, Category, Brand, parseFlags } = require('./lib/db');
const { secret } = require('../config/secret');

function tsNow() { return new Date().toISOString().replace(/[:.]/g, '-'); }

async function runBackup({ dir = path.join(__dirname, '..', 'backups'), timestamp = tsNow(), allowEmpty = false } = {}) {
  const outDir = path.join(dir, timestamp);
  fs.mkdirSync(outDir, { recursive: true });
  const cols = { products: Products, categories: Category, brands: Brand };
  const counts = {};
  for (const [name, Model] of Object.entries(cols)) {
    const docs = await Model.find({}).lean();
    counts[name] = docs.length;
    if (!allowEmpty && docs.length === 0) throw new Error(`Refusing backup: collection "${name}" is empty (0 docs)`);
    fs.writeFileSync(path.join(outDir, `${name}.json`), EJSON.stringify(docs, null, 2));
  }
  const mongoUriHash = crypto.createHash('sha256').update(String(secret.db_url || '')).digest('hex');
  const manifest = { timestamp, counts, mongoUriHash, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { outDir, counts, manifest, timestamp };
}

if (require.main === module) {
  (async () => {
    parseFlags();
    await connect();
    const res = await runBackup({});
    console.log('Backup written:', res.outDir, res.counts);
    await disconnect();
  })().catch((e) => { console.error('BACKUP FAILED:', e.message); process.exit(1); });
}

module.exports = { runBackup, tsNow };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/backup.test.js`
Expected: PASS (2 specs).

- [ ] **Step 6: Commit**

```bash
git add backend/tests/scripts/_mem.js backend/scripts/backup.js backend/tests/scripts/backup.test.js
git commit -m "feat(catalog): EJSON backup with manifest + integration tests"
```

---

## Task 7: `import-brands.js` — upsert real + house brands (TDD, integration)

**Files:**
- Create: `backend/scripts/import-brands.js`
- Test: `backend/tests/scripts/import-brands.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/import-brands.test.js`:

```js
const { startMem, stopMem } = require('./_mem');
const { Brand } = require('../../scripts/lib/db');
const { importBrands } = require('../../scripts/import-brands');

beforeAll(async () => { await startMem(); await Brand.create({ name: 'Apple', status: 'active' }); });
afterAll(async () => { await stopMem(); });

it('upserts real + house brands idempotently (no dupes, reuses existing)', async () => {
  const names = ['Apple', 'Essence', null, 'essence']; // null + dup-by-case
  const r1 = await importBrands({ djBrandNames: names });
  const r2 = await importBrands({ djBrandNames: names }); // second run = no-op
  const all = await Brand.find({});
  const lc = all.map((b) => b.name.toLowerCase());
  expect(new Set(lc).size).toBe(lc.length);          // unique
  expect(lc).toContain('apple');
  expect(lc).toContain('essence');
  expect(lc).toContain('shofy home');                // house brands present
  expect(r2.created).toBe(0);                         // idempotent
  const idByName = await importBrands.idByName();
  expect(idByName.get('apple')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/import-brands.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/import-brands.js`:

```js
'use strict';
const { Brand, connect, disconnect, parseFlags } = require('./lib/db');
const { slugify, HOUSE_BRANDS } = require('./lib/mappings');

async function importBrands({ djBrandNames = [], commit = true } = {}) {
  const wanted = new Map(); // lc -> display
  for (const n of [...Object.values(HOUSE_BRANDS), ...djBrandNames]) {
    const name = (n || '').trim();
    if (!name) continue;
    if (!wanted.has(name.toLowerCase())) wanted.set(name.toLowerCase(), name);
  }
  let created = 0;
  for (const [lc, display] of wanted) {
    const existing = await Brand.findOne({ name: new RegExp(`^${display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (existing) continue;
    if (commit) await Brand.create({ name: display, status: 'active', slug: slugify(display) });
    created += 1;
  }
  return { created, total: wanted.size };
}

// Map lowercased brand name -> _id (string). Used by product importers.
importBrands.idByName = async function idByName() {
  const all = await Brand.find({}).lean();
  return new Map(all.map((b) => [b.name.toLowerCase(), String(b._id)]));
};

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const cat = require('./data/dummyjson-catalog.json');
    const names = [...new Set(cat.map((p) => p.brand).filter(Boolean))];
    const r = await importBrands({ djBrandNames: names, commit: flags.commit });
    console.log(flags.commit ? 'Brands upserted:' : '[dry-run] would create:', r);
    await disconnect();
  })().catch((e) => { console.error('import-brands FAILED:', e.message); process.exit(1); });
}

module.exports = { importBrands };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/import-brands.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/import-brands.js backend/tests/scripts/import-brands.test.js
git commit -m "feat(catalog): idempotent brand upsert (real + house) + tests"
```

---

## Task 8: `import-categories.js` — upsert/rename tree, soft-delete extras (TDD, integration)

**Files:**
- Create: `backend/scripts/import-categories.js`
- Test: `backend/tests/scripts/import-categories.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/import-categories.test.js`:

```js
const { startMem, stopMem } = require('./_mem');
const { Category } = require('../../scripts/lib/db');
const { importCategories } = require('../../scripts/import-categories');

let oldId;
beforeAll(async () => {
  await startMem();
  const oldHead = await Category.create({ parent: 'Headphones', productType: 'electronics', status: 'Show', children: ['Kids Headphones'] });
  oldId = String(oldHead._id);
  await Category.create({ parent: 'CPU Heat Pipes', productType: 'electronics', status: 'Show' }); // soft-delete target
});
afterAll(async () => { await stopMem(); });

it('renames in place (keeps _id), creates new, soft-deletes extras — idempotent', async () => {
  await importCategories({ commit: true });
  await importCategories({ commit: true }); // re-run safe

  const headphones = await Category.findOne({ parent: 'Headphones' });
  expect(headphones).toBeNull();                                   // renamed away
  const taiNghe = await Category.findOne({ parent: 'Tai nghe' });
  expect(String(taiNghe._id)).toBe(oldId);                         // SAME _id preserved
  expect(taiNghe.productType).toBe('electronics');
  expect(taiNghe.children).toEqual(expect.arrayContaining(['Bluetooth']));

  const dienThoai = await Category.findOne({ parent: 'Điện thoại' });
  expect(dienThoai).toBeTruthy();                                  // new created
  expect(dienThoai.slug).toBe('dien-thoai');

  const cpu = await Category.findOne({ parent: 'CPU Heat Pipes' });
  expect(cpu.status).toBe('Hide');                                 // soft-deleted

  const shows = await Category.find({ status: 'Show' });
  expect(shows.length).toBe(23);                                   // full frozen tree visible
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/import-categories.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/import-categories.js`:

```js
'use strict';
const { Category, connect, disconnect, parseFlags } = require('./lib/db');
const { CATEGORY_TREE, SOFT_DELETE_PARENTS, slugify } = require('./lib/mappings');

async function importCategories({ commit = true } = {}) {
  const result = { renamed: 0, created: 0, updated: 0, hidden: 0 };
  for (const node of CATEGORY_TREE) {
    const fields = {
      parent: node.parent,
      name: node.parent,
      productType: node.productType,
      children: node.children,
      slug: slugify(node.parent),
      status: 'Show',
      featured: !!node.featured,
      sortOrder: node.sortOrder,
      level: 0,
    };
    // 1) rename in place if an oldParent doc exists (preserve _id)
    let doc = node.oldParent ? await Category.findOne({ parent: node.oldParent }) : null;
    if (doc) {
      if (commit) { Object.assign(doc, fields); await doc.save(); }
      result.renamed += 1;
    } else {
      // 2) upsert by the new parent
      const existing = await Category.findOne({ parent: node.parent });
      if (existing) { if (commit) { Object.assign(existing, fields); await existing.save(); } result.updated += 1; }
      else { if (commit) await Category.create(fields); result.created += 1; }
    }
  }
  // 3) soft-delete merged-away + any leftover category not in the frozen tree
  const keep = new Set([...CATEGORY_TREE.map((c) => c.parent), ...CATEGORY_TREE.map((c) => c.oldParent).filter(Boolean)]);
  const toHide = await Category.find({ status: 'Show' });
  for (const c of toHide) {
    const inTree = CATEGORY_TREE.some((n) => n.parent === c.parent);
    if (!inTree && (SOFT_DELETE_PARENTS.includes(c.parent) || !keep.has(c.parent))) {
      if (commit) { c.status = 'Hide'; await c.save(); }
      result.hidden += 1;
    }
  }
  return result;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await importCategories({ commit: flags.commit });
    console.log(flags.commit ? 'Categories:' : '[dry-run] categories:', r);
    await disconnect();
  })().catch((e) => { console.error('import-categories FAILED:', e.message); process.exit(1); });
}

module.exports = { importCategories };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/import-categories.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/import-categories.js backend/tests/scripts/import-categories.test.js
git commit -m "feat(catalog): category rename/upsert/soft-delete to frozen tree + tests"
```

---

## Task 9: `lib/translate.js` — Gemini VN translation w/ cache + fallback (TDD, mocked)

**Files:**
- Create: `backend/scripts/lib/translate.js`
- Test: `backend/tests/scripts/translate.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/translate.test.js`:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { translateProducts } = require('../../scripts/lib/translate');

const items = [
  { sku: 'A1', title: 'Red Dress', description: 'A red dress' },
  { sku: 'B2', title: 'Blue Hat', description: 'A blue hat' },
];

it('translates via injected callGemini, matches by sku, and caches (idempotent)', async () => {
  const cachePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tr-')), 'cache.json');
  let calls = 0;
  const callGemini = async (batch) => { calls += 1; return batch.map((b) => ({ sku: b.sku, title_vi: b.title + ' VI', description_vi: b.description + ' VI' })); };
  const r1 = await translateProducts(items, { cachePath, callGemini, batchSize: 10 });
  expect(r1.get('A1').title_vi).toBe('Red Dress VI');
  const r2 = await translateProducts(items, { cachePath, callGemini, batchSize: 10 }); // cache hit
  expect(calls).toBe(1);                       // not called again
  expect(r2.get('B2').description_vi).toBe('A blue hat VI');
});

it('falls back to English on batch failure without caching the fallback', async () => {
  const cachePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tr-')), 'cache.json');
  const callGemini = async () => { throw new Error('429'); };
  const r = await translateProducts(items, { cachePath, callGemini, batchSize: 10 });
  expect(r.get('A1').title_vi).toBe('Red Dress');     // English fallback
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  expect(cache.A1).toBeUndefined();                   // fallback NOT cached
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/translate.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/lib/translate.js`:

```js
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { secret } = require('../../config/secret');

const hash = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 12);
const loadCache = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };
const saveCache = (p, c) => fs.writeFileSync(p, JSON.stringify(c, null, 1));

// Default real Gemini call: returns [{sku,title_vi,description_vi}] for a batch.
async function defaultCallGemini(batch, { model = process.env.GEMINI_CHAT_MODEL, key = process.env.GEMINI_API_KEY } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const prompt = 'Dịch sang tiếng Việt thương mại tự nhiên. Trả về JSON array [{"sku","title_vi","description_vi"}], giữ nguyên sku:\n' + JSON.stringify(batch.map((b) => ({ sku: b.sku, title: b.title, description: b.description })));
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, response_mime_type: 'application/json' } };
  const { data } = await axios.post(url, body, { timeout: 30000 });
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

async function translateProducts(items, { cachePath, callGemini = defaultCallGemini, batchSize = 10 } = {}) {
  const cache = loadCache(cachePath);
  const out = new Map();
  const todo = [];
  for (const it of items) {
    const h = hash((it.title || '') + '|' + (it.description || ''));
    const c = cache[it.sku];
    if (c && c.src_hash === h) out.set(it.sku, { title_vi: c.title_vi, description_vi: c.description_vi });
    else todo.push({ ...it, _h: h });
  }
  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize);
    let translated;
    try {
      const res = await callGemini(batch.map(({ sku, title, description }) => ({ sku, title, description })));
      translated = new Map(res.map((r) => [r.sku, r]));
    } catch (e) {
      translated = null; // whole-batch failure -> English fallback for this batch
    }
    for (const b of batch) {
      const t = translated && translated.get(b.sku);
      if (t && t.title_vi) {
        out.set(b.sku, { title_vi: t.title_vi, description_vi: t.description_vi || b.description });
        cache[b.sku] = { title_vi: t.title_vi, description_vi: t.description_vi || b.description, src_hash: b._h, model: process.env.GEMINI_CHAT_MODEL || 'gemini' };
      } else {
        out.set(b.sku, { title_vi: b.title, description_vi: b.description }); // fallback, NOT cached
      }
    }
  }
  if (cachePath) saveCache(cachePath, cache);
  return out;
}

module.exports = { translateProducts, defaultCallGemini };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/translate.test.js`
Expected: PASS (2 specs).

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/translate.js backend/tests/scripts/translate.test.js
git commit -m "feat(catalog): Gemini VN translation with cache + English fallback + tests"
```

---

## Task 10: `lib/images.js` — download + Cloudinary upload, idempotent (TDD, mocked)

**Files:**
- Create: `backend/scripts/lib/images.js`
- Test: `backend/tests/scripts/images.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/images.test.js`:

```js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { processImages } = require('../../scripts/lib/images');

it('uploads each source once, caps at 4, and is idempotent via manifest', async () => {
  const manifestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'im-')), 'm.json');
  let uploads = 0;
  const download = async () => Buffer.from('img');
  const upload = async (buf, publicId) => { uploads += 1; return { secure_url: `https://res.cloudinary.com/dfddeabbs/${publicId}.webp`, public_id: publicId }; };
  const srcs = ['a', 'b', 'c', 'd', 'e']; // 5 -> capped to 4
  const r1 = await processImages(srcs, 'dj-sku-001', { manifestPath, download, upload });
  expect(r1).toHaveLength(4);
  expect(r1[0]).toMatch(/^https:\/\/res\.cloudinary\.com\/dfddeabbs\//);
  expect(uploads).toBe(4);
  const r2 = await processImages(srcs, 'dj-sku-001', { manifestPath, download, upload }); // cached
  expect(uploads).toBe(4);                    // no new uploads
  expect(r2).toEqual(r1);
});

it('skips a source that fails to download but keeps the rest', async () => {
  const manifestPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'im-')), 'm.json');
  const download = async (url) => { if (url === 'bad') throw new Error('404'); return Buffer.from('x'); };
  const upload = async (buf, publicId) => ({ secure_url: `https://res.cloudinary.com/dfddeabbs/${publicId}.webp`, public_id: publicId });
  const r = await processImages(['ok', 'bad'], 'dj-sku-002', { manifestPath, download, upload });
  expect(r).toHaveLength(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/images.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/lib/images.js`:

```js
'use strict';
const fs = require('fs');
const axios = require('axios');
const cloudinary = require('../../utils/cloudinary'); // configured with dfddeabbs

const loadManifest = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };
const saveManifest = (p, m) => { if (p) fs.writeFileSync(p, JSON.stringify(m, null, 1)); };

async function defaultDownload(url) {
  const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  return Buffer.from(data);
}

async function defaultUpload(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shofy/products', public_id: publicId, overwrite: false, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

// sources: array of remote image URLs. prefix: deterministic public_id stem.
// Returns array of Cloudinary secure_urls (cap 4), idempotent via manifest[publicId].
async function processImages(sources, prefix, { manifestPath, download = defaultDownload, upload = defaultUpload, retries = 3 } = {}) {
  const manifest = loadManifest(manifestPath);
  const urls = [];
  const capped = [...new Set(sources.filter(Boolean))].slice(0, 4);
  for (let k = 0; k < capped.length; k++) {
    const publicId = `${prefix}-${k}`;
    if (manifest[publicId]) { urls.push(manifest[publicId]); continue; }
    let buf = null;
    for (let attempt = 0; attempt < retries && !buf; attempt++) {
      try { buf = await download(capped[k]); } catch (e) { if (attempt === retries - 1) buf = null; }
    }
    if (!buf) continue; // skip this image, keep the rest
    const res = await upload(buf, publicId);
    manifest[publicId] = res.secure_url;
    urls.push(res.secure_url);
  }
  saveManifest(manifestPath, manifest);
  return urls;
}

module.exports = { processImages, defaultDownload, defaultUpload };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/images.test.js`
Expected: PASS (2 specs).

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/images.js backend/tests/scripts/images.test.js
git commit -m "feat(catalog): idempotent image download+Cloudinary upload + tests"
```

---

## Task 11: `data/build-selection.js` → generate & commit `selection.json` (TDD)

**Files:**
- Create: `backend/scripts/data/build-selection.js`, `backend/scripts/data/selection.json` (generated)
- Test: `backend/tests/scripts/selection.test.js`

Targets (sum = 66 → 53 + 66 = 119): electronics 6, fashion 9, beauty 8, jewelry 10, home 17, sports 16.

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/selection.test.js`:

```js
const { buildSelection, TARGETS } = require('../../scripts/data/build-selection');
const catalog = require('../../scripts/data/dummyjson-catalog.json');

it('selects the target count per vertical, no dupes, no excluded categories', () => {
  const sel = buildSelection(catalog);
  const byType = {};
  sel.forEach((s) => { byType[s.productType] = (byType[s.productType] || 0) + 1; });
  expect(byType).toEqual(TARGETS);
  const ids = sel.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(sel.every((s) => !['groceries', 'motorcycle', 'vehicle'].includes(s.category))).toBe(true);
  expect(sel.length).toBe(66);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/selection.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/data/build-selection.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');
const { mapDjToTaxonomy } = require('../lib/mappings');

const TARGETS = { electronics: 6, fashion: 9, beauty: 8, jewelry: 10, home: 17, sports: 16 };

function buildSelection(catalog) {
  // group catalog by destination productType (deterministic: sort by DJ id)
  const byType = {};
  for (const dj of [...catalog].sort((a, b) => a.id - b.id)) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    if (!tax) continue;
    (byType[tax.productType] = byType[tax.productType] || []).push(dj);
  }
  const selection = [];
  for (const [type, n] of Object.entries(TARGETS)) {
    const pool = byType[type] || [];
    if (pool.length < n) throw new Error(`Not enough source products for ${type}: have ${pool.length}, need ${n}`);
    for (const dj of pool.slice(0, n)) selection.push({ id: dj.id, sku: dj.sku, category: dj.category, productType: type });
  }
  return selection;
}

if (require.main === module) {
  const catalog = require('./dummyjson-catalog.json');
  const sel = buildSelection(catalog);
  fs.writeFileSync(path.join(__dirname, 'selection.json'), JSON.stringify(sel, null, 1));
  console.log(`Wrote selection.json: ${sel.length} products`);
}

module.exports = { buildSelection, TARGETS };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/selection.test.js`
Expected: PASS.

- [ ] **Step 5: Generate the committed selection file**

Run: `cd backend && node scripts/data/build-selection.js`
Expected: prints `Wrote selection.json: 66 products`; file `scripts/data/selection.json` exists.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/data/build-selection.js backend/scripts/data/selection.json backend/tests/scripts/selection.test.js
git commit -m "feat(catalog): deterministic new-product selection (66) + tests"
```

---

## Task 12: `reclassifyExisting` + `isVnSpecial` in `lib/mappings.js` (TDD)

**Files:**
- Modify: `backend/scripts/lib/mappings.js`
- Test: `backend/tests/scripts/reclassify.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/reclassify.test.js`:

```js
const { reclassifyExisting, isVnSpecial } = require('../../scripts/lib/mappings');

it('re-files the 5 orphans into home/sports', () => {
  expect(reclassifyExisting({ title: 'Bamboo Tea Set', parent: 'Headphones', productType: 'home' })).toMatchObject({ productType: 'home', parent: 'Đồ bếp' });
  expect(reclassifyExisting({ title: 'Rattan Pendant Lamp', parent: 'Headphones', productType: 'home' })).toMatchObject({ parent: 'Trang trí nhà cửa' });
  expect(reclassifyExisting({ title: 'Linen Bedding Set Queen', parent: 'Headphones', productType: 'home' })).toMatchObject({ parent: 'Nội thất' });
  expect(reclassifyExisting({ title: 'Yoga Mat Premium 6mm', parent: 'Headphones', productType: 'sports' })).toMatchObject({ productType: 'sports', parent: 'Dụng cụ thể thao' });
});
it('uses oldParent map for normal items and re-files watches', () => {
  expect(reclassifyExisting({ title: 'Gaming Headphone', parent: 'Headphones', productType: 'electronics' })).toMatchObject({ parent: 'Tai nghe' });
  expect(reclassifyExisting({ title: 'Rolex Datejust Women', parent: 'Bracelets', productType: 'jewelry' })).toMatchObject({ parent: 'Đồng hồ' });
  expect(reclassifyExisting({ title: 'iPhone 14 Pro', parent: 'Mobile Tablets', productType: 'electronics' })).toMatchObject({ parent: 'Điện thoại' });
});
it('flags the 7 VN-special items', () => {
  expect(isVnSpecial('Ao Dai Truyen Thong Lua new')).toBe(true);
  expect(isVnSpecial('Gaming Headphone')).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/reclassify.test.js`
Expected: FAIL — exports undefined.

- [ ] **Step 3: Add to `lib/mappings.js`** (before `module.exports`, then add to exports)

```js
const _catByParent = (parent) => CATEGORY_TREE.find((c) => c.parent === parent);

const isVnSpecial = (title) => VN_SPECIAL.some((s) => String(title || '').toLowerCase().includes(s.toLowerCase()));

// Reclassify an EXISTING product (not from DummyJSON). p = {title, parent, productType, brandName}.
function reclassifyExisting(p) {
  const t = String(p.title || '').toLowerCase();
  const target = (parent) => {
    const node = _catByParent(parent);
    return { productType: node.productType, parent: node.parent, children: pickChildren(null, { title: p.title, brand: p.brandName }, node.parent) };
  };
  if (/tea set|bamboo/.test(t)) return target('Đồ bếp');
  if (/pendant lamp|rattan|\blamp\b/.test(t)) return target('Trang trí nhà cửa');
  if (/bedding|duvet|bed sheet/.test(t)) return target('Nội thất');
  if (/yoga|resistance band|dumbbell|treadmill|gym/.test(t)) return target('Dụng cụ thể thao');
  if (/\bwatch\b/.test(t) && !/smart\s*watch|apple watch/.test(t)) return target('Đồng hồ');
  if (/(iphone|galaxy s\d|smartphone|\bphone\b)/.test(t) && !/case|cover|charger|cable|headphone/.test(t)) return target('Điện thoại');
  const node = CATEGORY_TREE.find((c) => c.oldParent === p.parent);
  if (node) return { productType: node.productType, parent: node.parent, children: pickChildren(null, { title: p.title, brand: p.brandName }, node.parent) };
  const byType = CATEGORY_TREE.find((c) => c.productType === p.productType);
  if (byType) return { productType: byType.productType, parent: byType.parent, children: byType.children[0] };
  return null;
}
```

Add `isVnSpecial` and `reclassifyExisting` to the `module.exports` object.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/reclassify.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/lib/mappings.js backend/tests/scripts/reclassify.test.js
git commit -m "feat(catalog): reclassifyExisting + isVnSpecial rules + tests"
```

---

## Task 13: `fix-existing.js` — re-point + rebrand + localize + re-image the 53 (TDD, integration)

**Files:**
- Create: `backend/scripts/fix-existing.js`
- Test: `backend/tests/scripts/fix-existing.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/fix-existing.test.js`:

```js
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products, Category } = require('../../scripts/lib/db');
const { importCategories } = require('../../scripts/import-categories');
const { importBrands } = require('../../scripts/import-brands');
const { fixExisting } = require('../../scripts/fix-existing');

beforeAll(async () => {
  await startMem();
  await importCategories({ commit: true });
  await importBrands({ djBrandNames: ['Sony', 'Legendary Whitetails', 'INIKA'], commit: true });
  const oid = () => new mongoose.Types.ObjectId();
  await Products.create({ title: 'Ao Dai Truyen Thong Lua new', img: 'https://res.cloudinary.com/dfddeabbs/shared.png', unit: '1pc', parent: 'Clothing', children: "Women's", price: 1290000, quantity: 24, status: 'in-stock', productType: 'fashion', description: 'd', brand: { name: 'Logitech', id: oid() }, category: { name: 'Clothing', id: oid() } });
  await Products.create({ title: 'Gaming Headphone', img: 'https://res.cloudinary.com/dfddeabbs/shared.png', unit: '1pc', parent: 'Headphones', children: 'Kids Headphones', price: 500000, quantity: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Logitech', id: oid() }, category: { name: 'Headphones', id: oid() } });
});
afterAll(async () => { await stopMem(); });

it('corrects taxonomy, brand, and gives unique images; keeps VN-special name', async () => {
  const translateFn = async (items) => new Map(items.map((i) => [i.sku || i.title, { title_vi: i.title + ' (VI)', description_vi: 'mo ta' }]));
  const processImagesFn = async (srcs, prefix) => [`https://res.cloudinary.com/dfddeabbs/${prefix}-0.webp`];
  // make repImages non-empty by pointing fixExisting at the committed catalog (default)
  const res = await fixExisting({ commit: true, translateFn, processImagesFn });
  expect(res.fixed).toBe(2);

  const aoDai = await Products.findOne({ title: /Ao Dai/ });
  expect(aoDai.parent).toBe('Thời trang nữ');
  expect(aoDai.brand.name).not.toBe('Logitech');
  expect(aoDai.title).toMatch(/^Ao Dai/);              // VN-special: NOT translated
  expect(aoDai.img).toMatch(/dfddeabbs\/fix-/);        // unique re-image

  const head = await Products.findOne({ title: /VI\)$|Gaming/ });
  expect(head.parent).toBe('Tai nghe');
  const taiNghe = await Category.findOne({ parent: 'Tai nghe' });
  expect(String(head.category.id)).toBe(String(taiNghe._id)); // resolved ref
  expect(head.productType).toBe('electronics');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/fix-existing.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/fix-existing.js`:

```js
'use strict';
const path = require('path');
const { Products, Category, connect, disconnect, parseFlags } = require('./lib/db');
const { importBrands } = require('./import-brands');
const { translateProducts } = require('./lib/translate');
const { processImages } = require('./lib/images');
const { mapDjToTaxonomy, reclassifyExisting, brandFixFor, isVnSpecial, sizesForType, HOUSE_BRANDS } = require('./lib/mappings');

// Build parent -> representative image URLs from the DummyJSON catalog.
function repImagesByParent(catalog) {
  const map = {};
  for (const dj of catalog) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    if (!tax || map[tax.parent]) continue;
    map[tax.parent] = [dj.thumbnail, ...(dj.images || [])].filter(Boolean).slice(0, 4);
  }
  return map;
}

async function fixExisting({ commit = true, translateFn, processImagesFn, manifestPath, translationsPath, catalog } = {}) {
  catalog = catalog || require('./data/dummyjson-catalog.json');
  const reps = repImagesByParent(catalog);
  const cats = await Category.find({}).lean();
  const catIdByParent = new Map(cats.map((c) => [c.parent, c._id]));
  const brandIdByName = await importBrands.idByName();
  const originals = await Products.find({ importId: { $exists: false } }).lean();

  const items = originals.map((p) => ({ sku: p.sku || String(p._id), title: p.title, description: p.description }));
  const tr = translateFn ? await translateFn(items) : await translateProducts(items, { cachePath: translationsPath });
  const proc = processImagesFn || processImages;

  const out = { fixed: 0, skipped: 0 };
  for (const p of originals) {
    const reclass = reclassifyExisting({ title: p.title, parent: p.parent, productType: p.productType, brandName: p.brand && p.brand.name });
    const categoryId = reclass && catIdByParent.get(reclass.parent);
    if (!reclass || !categoryId) { out.skipped += 1; continue; }

    let brandName = brandFixFor({ title: p.title, productType: reclass.productType, brandName: p.brand && p.brand.name })
      || (p.brand && p.brand.name) || HOUSE_BRANDS[reclass.productType];
    let brandId = brandIdByName.get(String(brandName).toLowerCase());
    if (!brandId) { brandName = HOUSE_BRANDS[reclass.productType]; brandId = brandIdByName.get(brandName.toLowerCase()); }

    const sizes = sizesForType(reclass.productType, reclass.parent);
    const imgs = await proc(reps[reclass.parent] || [], `fix-${String(p._id)}`, { manifestPath });
    const t = tr.get(p.sku || String(p._id)) || {};
    const vn = isVnSpecial(p.title);

    const update = {
      productType: reclass.productType,
      parent: reclass.parent,
      children: reclass.children,
      category: { name: reclass.parent, id: categoryId },
      brand: { name: brandName, id: brandId },
      title: vn ? p.title : (t.title_vi || p.title),
      description: t.description_vi || p.description,
      sizes,
    };
    if (imgs.length) {
      update.img = imgs[0];
      update.imageURLs = imgs.map((u) => ({ img: u, color: { name: 'Mặc định', clrCode: '#000000' }, sizes }));
    }
    if (commit) await Products.updateOne({ _id: p._id }, { $set: update });
    out.fixed += 1;
  }
  return out;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await fixExisting({ commit: flags.commit, manifestPath: path.join(__dirname, 'data', 'image-manifest.json'), translationsPath: path.join(__dirname, 'data', 'translations.cache.json') });
    console.log(flags.commit ? 'Fixed existing:' : '[dry-run] would fix:', r);
    await disconnect();
  })().catch((e) => { console.error('fix-existing FAILED:', e.message); process.exit(1); });
}

module.exports = { fixExisting, repImagesByParent };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/fix-existing.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/fix-existing.js backend/tests/scripts/fix-existing.test.js
git commit -m "feat(catalog): fix-existing (re-point, rebrand, localize, re-image) + tests"
```

---

## Task 14: `import-new.js` — import the 66 selected products (TDD, integration)

**Files:**
- Create: `backend/scripts/import-new.js`
- Test: `backend/tests/scripts/import-new.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/import-new.test.js`:

```js
const { startMem, stopMem } = require('./_mem');
const { Products, Category } = require('../../scripts/lib/db');
const { importCategories } = require('../../scripts/import-categories');
const { importBrands } = require('../../scripts/import-brands');
const { importNew } = require('../../scripts/import-new');

const fakeCatalog = [
  { id: 901, sku: 'PHN-901', title: 'Test Phone', description: 'd', category: 'smartphones', price: 500, discountPercentage: 5, stock: 10, rating: 4.9, weight: 1, tags: [], brand: 'Apple', thumbnail: 'https://cdn.dummyjson.com/t.webp', images: ['https://cdn.dummyjson.com/a.webp'] },
  { id: 902, sku: 'WAT-902', title: 'Test Watch', description: 'd', category: 'mens-watches', price: 200, discountPercentage: 0, stock: 0, rating: 4.0, weight: 1, tags: [], brand: null, thumbnail: 'https://cdn.dummyjson.com/w.webp', images: [] },
];

beforeAll(async () => {
  await startMem();
  await importCategories({ commit: true });
  await importBrands({ djBrandNames: ['Apple'], commit: true });
});
afterAll(async () => { await stopMem(); });

it('imports selected products, resolves refs, routes watch to jewelry, idempotent', async () => {
  const selection = [{ id: 901 }, { id: 902 }];
  const catalogById = new Map(fakeCatalog.map((p) => [p.id, p]));
  const translateFn = async (items) => new Map(items.map((i) => [i.sku, { title_vi: i.title + ' VI', description_vi: 'mo ta' }]));
  const processImagesFn = async (srcs, prefix) => [`https://res.cloudinary.com/dfddeabbs/${prefix}-0.webp`];

  const r1 = await importNew({ commit: true, selection, catalogById, translateFn, processImagesFn });
  const r2 = await importNew({ commit: true, selection, catalogById, translateFn, processImagesFn }); // idempotent
  expect(r1.inserted).toBe(2);
  expect(r2.inserted).toBe(0);

  const phone = await Products.findOne({ importId: 'dummyjson:901' });
  expect(phone.productType).toBe('electronics');
  expect(phone.price).toBe(12500000);              // 500*25000 rounded
  const watch = await Products.findOne({ importId: 'dummyjson:902' });
  expect(watch.parent).toBe('Đồng hồ');            // routed to jewelry (finding #6)
  expect(watch.productType).toBe('jewelry');
  expect(watch.status).toBe('out-of-stock');       // stock 0
  expect(watch.brand.name).toBe('Shofy Jewels');   // null brand -> house brand
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/import-new.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/import-new.js`:

```js
'use strict';
const path = require('path');
const { Products, Category, mongoose, connect, disconnect, parseFlags } = require('./lib/db');
const { importBrands } = require('./import-brands');
const { translateProducts } = require('./lib/translate');
const { processImages } = require('./lib/images');
const { buildProductDoc } = require('./lib/build-product');
const { mapDjToTaxonomy, HOUSE_BRANDS } = require('./lib/mappings');

async function importNew({ commit = true, selection, catalogById, translateFn, processImagesFn, manifestPath, translationsPath } = {}) {
  selection = selection || require('./data/selection.json');
  catalogById = catalogById || new Map(require('./data/dummyjson-catalog.json').map((p) => [p.id, p]));
  const cats = await Category.find({}).lean();
  const catIdByParent = new Map(cats.map((c) => [c.parent, c._id]));
  const brandIdByName = await importBrands.idByName();

  const djItems = selection.map((s) => catalogById.get(s.id)).filter(Boolean);
  const items = djItems.map((d) => ({ sku: d.sku, title: d.title, description: d.description }));
  const tr = translateFn ? await translateFn(items) : await translateProducts(items, { cachePath: translationsPath });
  const proc = processImagesFn || processImages;

  const out = { inserted: 0, updated: 0, skipped: 0 };
  for (const dj of djItems) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    const categoryId = tax && catIdByParent.get(tax.parent);
    if (!tax || !categoryId) { out.skipped += 1; continue; }

    let brandName = (dj.brand && String(dj.brand).trim()) || HOUSE_BRANDS[tax.productType];
    let brandId = brandIdByName.get(String(brandName).toLowerCase());
    if (!brandId) { brandName = HOUSE_BRANDS[tax.productType]; brandId = brandIdByName.get(brandName.toLowerCase()); }

    const imgs = await proc([dj.thumbnail, ...(dj.images || [])], `dj-${String(dj.sku || dj.id).toLowerCase()}`, { manifestPath });
    if (!imgs.length) { out.skipped += 1; continue; } // img is REQUIRED

    const doc = buildProductDoc(dj, { importId: `dummyjson:${dj.id}`, categoryId, brandName, brandId, translation: tr.get(dj.sku), images: imgs, taxonomy: tax });
    if (commit) {
      const res = await Products.updateOne({ importId: doc.importId }, { $set: doc, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      if (res.upsertedCount) out.inserted += 1; else out.updated += 1;
    } else out.inserted += 1;
  }
  return out;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await importNew({ commit: flags.commit, manifestPath: path.join(__dirname, 'data', 'image-manifest.json'), translationsPath: path.join(__dirname, 'data', 'translations.cache.json') });
    console.log(flags.commit ? 'Imported new:' : '[dry-run] would import:', r);
    await disconnect();
  })().catch((e) => { console.error('import-new FAILED:', e.message); process.exit(1); });
}

module.exports = { importNew };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/import-new.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/import-new.js backend/tests/scripts/import-new.test.js
git commit -m "feat(catalog): import-new (selected DummyJSON products, idempotent) + tests"
```

---

## Task 15: `resync-aggregates.js` — rebuild `category.products[]` + status (TDD, integration)

**Files:**
- Create: `backend/scripts/resync-aggregates.js`
- Test: `backend/tests/scripts/resync.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/resync.test.js`:

```js
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products, Category } = require('../../scripts/lib/db');
const { resyncAggregates } = require('../../scripts/resync-aggregates');

let catId;
beforeAll(async () => {
  await startMem();
  const c = await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show', products: [] });
  catId = c._id;
  const base = { img: 'https://res.cloudinary.com/dfddeabbs/x.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', productType: 'electronics', description: 'd', brand: { name: 'Sony', id: new mongoose.Types.ObjectId() } };
  await Products.create({ ...base, title: 'H1', price: 1, quantity: 5, status: 'in-stock', category: { name: 'Tai nghe', id: catId } });
  await Products.create({ ...base, title: 'H2', price: 1, quantity: 0, status: 'in-stock', category: { name: 'Tai nghe', id: catId } }); // wrong status
});
afterAll(async () => { await stopMem(); });

it('rebuilds products[] and fixes status from quantity', async () => {
  await resyncAggregates({ commit: true });
  const c = await Category.findById(catId);
  expect(c.products.length).toBe(2);
  const h2 = await Products.findOne({ title: 'H2' });
  expect(h2.status).toBe('out-of-stock');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/resync.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/resync-aggregates.js`:

```js
'use strict';
const { Products, Category, connect, disconnect, parseFlags } = require('./lib/db');

async function resyncAggregates({ commit = true } = {}) {
  const cats = await Category.find({});
  let updated = 0;
  for (const c of cats) {
    const ids = await Products.find({ 'category.id': c._id }).distinct('_id');
    if (commit) { c.products = ids; await c.save(); }
    updated += 1;
  }
  if (commit) {
    await Products.updateMany({ quantity: { $lte: 0 } }, { $set: { status: 'out-of-stock' } });
    await Products.updateMany({ quantity: { $gt: 0 }, status: 'out-of-stock' }, { $set: { status: 'in-stock' } });
  }
  return { categories: updated };
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await resyncAggregates({ commit: flags.commit });
    console.log(flags.commit ? 'Resynced:' : '[dry-run] resync:', r);
    await disconnect();
  })().catch((e) => { console.error('resync FAILED:', e.message); process.exit(1); });
}

module.exports = { resyncAggregates };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/resync.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/resync-aggregates.js backend/tests/scripts/resync.test.js
git commit -m "feat(catalog): resync category.products[] + status + tests"
```

---

## Task 16: `verify.js` — 12 read-only checks (TDD, integration)

**Files:**
- Create: `backend/scripts/verify.js`
- Test: `backend/tests/scripts/verify.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/verify.test.js`:

```js
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products, Category, Brand } = require('../../scripts/lib/db');
const { runChecks } = require('../../scripts/verify');

let catId, brandId;
beforeAll(async () => {
  await startMem();
  const c = await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show', products: [] });
  const b = await Brand.create({ name: 'Sony', status: 'active' });
  catId = c._id; brandId = b._id;
  await Products.create({ title: 'Good', img: 'https://res.cloudinary.com/dfddeabbs/g.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 1, quantity: 5, discount: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Sony', id: brandId }, category: { name: 'Tai nghe', id: catId } });
  await Category.findByIdAndUpdate(catId, { products: [ (await Products.findOne())._id ] });
});
afterAll(async () => { await stopMem(); });

it('passes on clean data', async () => {
  const r = await runChecks();
  expect(r.pass).toBe(true);
  expect(r.failures).toEqual([]);
});

it('flags a productType/category mismatch (check #11)', async () => {
  await Products.create({ title: 'Bad', img: 'https://res.cloudinary.com/dfddeabbs/b.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 1, quantity: 5, discount: 5, status: 'in-stock', productType: 'beauty', description: 'd', brand: { name: 'Sony', id: brandId }, category: { name: 'Tai nghe', id: catId } });
  const r = await runChecks();
  expect(r.pass).toBe(false);
  expect(r.failures.join(' ')).toMatch(/productType!=category/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/verify.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/verify.js`:

```js
'use strict';
const { Products, Category, Brand, connect, disconnect } = require('./lib/db');
const { PRODUCT_TYPES } = require('./lib/mappings');

async function runChecks() {
  const failures = [];
  const products = await Products.find({}).lean();
  const cats = await Category.find({}).lean();
  const brands = await Brand.find({}).lean();
  const catById = new Map(cats.map((c) => [String(c._id), c]));
  const brandIds = new Set(brands.map((b) => String(b._id)));
  const allowed = new Set(PRODUCT_TYPES);

  for (const p of products) {
    if (!allowed.has(p.productType)) failures.push(`orphan productType ${p.productType} on ${p._id}`);
    if (!/^https:\/\/res\.cloudinary\.com\/dfddeabbs\//.test(p.img || '')) failures.push(`bad img ${p._id}`);
    if (/cdn\.dummyjson\.com/.test(p.img || '')) failures.push(`dummyjson img leaked ${p._id}`);
    const c = p.category && catById.get(String(p.category.id));
    if (!c) failures.push(`unresolved category ${p._id}`);
    else {
      if (c.parent !== p.category.name) failures.push(`category name mismatch ${p._id}`);
      if (c.productType !== p.productType) failures.push(`productType!=category ${p._id} (${p.productType} vs ${c.productType})`);
    }
    if (!(p.brand && brandIds.has(String(p.brand.id)))) failures.push(`unresolved brand ${p._id}`);
    if (!['in-stock', 'out-of-stock', 'discontinued'].includes(p.status)) failures.push(`bad status ${p._id}`);
    if (p.price < 0) failures.push(`neg price ${p._id}`);
    if (p.quantity < 0) failures.push(`neg qty ${p._id}`);
    if (p.discount != null && (p.discount < 0 || p.discount > 100)) failures.push(`bad discount ${p._id}`);
  }
  const imgCount = {};
  products.forEach((p) => { imgCount[p.img] = (imgCount[p.img] || 0) + 1; });
  for (const [img, n] of Object.entries(imgCount)) if (n > 5) failures.push(`image shared by ${n}: ${img}`);
  for (const c of cats) {
    if (c.status === 'Hide') continue;
    const cnt = products.filter((p) => p.category && String(p.category.id) === String(c._id)).length;
    if ((c.products || []).length !== cnt) failures.push(`stale products[] on ${c.parent}: ${(c.products || []).length} vs ${cnt}`);
    if (!['Show', 'Hide'].includes(c.status)) failures.push(`bad cat status ${c.parent}`);
  }
  for (const key of ['importId', 'slug', 'sku']) {
    const vals = products.map((p) => p[key]).filter(Boolean);
    if (new Set(vals).size !== vals.length) failures.push(`duplicate ${key}`);
  }
  return { pass: failures.length === 0, failures, counts: { products: products.length, categories: cats.length, brands: brands.length } };
}

if (require.main === module) {
  (async () => {
    await connect();
    const r = await runChecks();
    console.log('Counts:', r.counts);
    if (r.pass) console.log('VERIFY PASS ✅');
    else { console.error('VERIFY FAIL ❌\n' + r.failures.map((f) => ' - ' + f).join('\n')); }
    await disconnect();
    process.exit(r.pass ? 0 : 1);
  })().catch((e) => { console.error('verify FAILED:', e.message); process.exit(1); });
}

module.exports = { runChecks };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/verify.test.js`
Expected: PASS (2 specs).

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/verify.js backend/tests/scripts/verify.test.js
git commit -m "feat(catalog): verify.js (12 checks incl productType==category) + tests"
```

---

## Task 17: `rollback.js` — restore from backup with guards (TDD, integration)

**Files:**
- Create: `backend/scripts/rollback.js`
- Test: `backend/tests/scripts/rollback.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/rollback.test.js`:

```js
const fs = require('fs'); const os = require('os'); const path = require('path');
const { startMem, stopMem } = require('./_mem');
const { Brand, Category, Products } = require('../../scripts/lib/db');
const { runBackup } = require('../../scripts/backup');
const { rollback } = require('../../scripts/rollback');

let dir, ts;
beforeAll(async () => {
  await startMem();
  await Brand.create({ name: 'Apple', status: 'active' });
  await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show' });
  await Products.create({ title: 'Keep me', img: 'https://res.cloudinary.com/dfddeabbs/x.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 1, quantity: 1, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Apple', id: new (require('mongoose').Types.ObjectId)() }, category: { name: 'Tai nghe', id: new (require('mongoose').Types.ObjectId)() } });
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-'));
  const res = await runBackup({ dir }); ts = res.timestamp;
});
afterAll(async () => { await stopMem(); });

it('refuses without --yes and restores the pre-mutation state with --yes', async () => {
  await expect(rollback({ dir, timestamp: ts, yes: false })).rejects.toThrow(/--yes/);
  await Products.deleteMany({});                 // simulate a bad migration
  expect(await Products.countDocuments()).toBe(0);
  const r = await rollback({ dir, timestamp: ts, yes: true });
  expect(r.restored.products).toBe(1);
  expect(await Products.countDocuments()).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/rollback.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/rollback.js`:

```js
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EJSON } = require('bson');
const { Products, Category, Brand, connect, disconnect, parseFlags } = require('./lib/db');
const { secret } = require('../config/secret');

async function rollback({ dir = path.join(__dirname, '..', 'backups'), timestamp, yes = false, checkHash = false } = {}) {
  if (!timestamp) throw new Error('rollback requires a timestamp (or --latest)');
  const outDir = path.join(dir, timestamp);
  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
  if (checkHash) {
    const cur = crypto.createHash('sha256').update(String(secret.db_url || '')).digest('hex');
    if (manifest.mongoUriHash !== cur) throw new Error('mongoUriHash mismatch — refusing cross-DB restore');
  }
  if (!yes) throw new Error('rollback requires --yes to proceed');
  const cols = { products: Products, categories: Category, brands: Brand };
  for (const [name, Model] of Object.entries(cols)) {
    const docs = EJSON.parse(fs.readFileSync(path.join(outDir, `${name}.json`), 'utf8'));
    await Model.deleteMany({});
    if (docs.length) await Model.collection.insertMany(docs);
  }
  return { restored: manifest.counts };
}

function latestTimestamp(dir) {
  const dirs = fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'manifest.json')));
  return dirs.sort().pop();
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    const dir = path.join(__dirname, '..', 'backups');
    const ts = flags.positional.includes('--latest') || !flags.positional.length ? latestTimestamp(dir) : flags.positional[0];
    await connect();
    const r = await rollback({ dir, timestamp: ts, yes: flags.yes, checkHash: true });
    console.log('Rolled back:', r.restored);
    await disconnect();
  })().catch((e) => { console.error('rollback FAILED:', e.message); process.exit(1); });
}

module.exports = { rollback, latestTimestamp };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/rollback.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/rollback.js backend/tests/scripts/rollback.test.js
git commit -m "feat(catalog): rollback.js (EJSON restore, --yes/hash guards) + tests"
```

---

## Task 18: `migrate.js` — orchestrator (TDD dry-run, integration)

**Files:**
- Create: `backend/scripts/migrate.js`
- Test: `backend/tests/scripts/migrate.test.js`

- [ ] **Step 1: Write the failing test**

`backend/tests/scripts/migrate.test.js`:

```js
const fs = require('fs'); const os = require('os'); const path = require('path');
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products } = require('../../scripts/lib/db');
const { runMigration } = require('../../scripts/migrate');

const fakeCatalog = [
  { id: 901, sku: 'PHN-901', title: 'Test Phone', description: 'd', category: 'smartphones', price: 500, discountPercentage: 5, stock: 10, rating: 4.9, weight: 1, tags: [], brand: 'Apple', thumbnail: 'https://cdn.dummyjson.com/t.webp', images: ['https://cdn.dummyjson.com/a.webp'] },
];

beforeAll(async () => {
  await startMem();
  await Products.create({ title: 'Gaming Headphone', img: 'https://res.cloudinary.com/dfddeabbs/shared.png', unit: '1pc', parent: 'Headphones', children: 'Kids Headphones', price: 5, quantity: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Logitech', id: new mongoose.Types.ObjectId() }, category: { name: 'Headphones', id: new mongoose.Types.ObjectId() } });
});
afterAll(async () => { await stopMem(); });

it('runs the full pipeline with --commit and ends with a passing verify', async () => {
  const deps = {
    commit: true,
    backupDir: fs.mkdtempSync(path.join(os.tmpdir(), 'mg-')),
    selection: [{ id: 901 }],
    catalogById: new Map(fakeCatalog.map((p) => [p.id, p])),
    translateFn: async (items) => new Map(items.map((i) => [i.sku || i.title, { title_vi: i.title + ' VI', description_vi: 'mo ta' }])),
    processImagesFn: async (srcs, prefix) => [`https://res.cloudinary.com/dfddeabbs/${prefix}-0.webp`],
    djBrandNames: ['Apple'],
  };
  const r = await runMigration(deps);
  expect(r.verify.pass).toBe(true);
  expect(await Products.findOne({ importId: 'dummyjson:901' })).toBeTruthy();
  const head = await Products.findOne({ title: /Gaming/ });
  expect(head.parent).toBe('Tai nghe');           // existing fixed
  expect(head.img).toMatch(/dfddeabbs\/fix-/);     // re-imaged
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest tests/scripts/migrate.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`backend/scripts/migrate.js`:

```js
'use strict';
const path = require('path');
const { connect, disconnect, parseFlags } = require('./lib/db');
const { runBackup, tsNow } = require('./backup');
const { importBrands } = require('./import-brands');
const { importCategories } = require('./import-categories');
const { fixExisting } = require('./fix-existing');
const { importNew } = require('./import-new');
const { resyncAggregates } = require('./resync-aggregates');
const { runChecks } = require('./verify');

async function runMigration({ commit = false, backupDir = path.join(__dirname, '..', 'backups'), selection, catalogById, translateFn, processImagesFn, djBrandNames } = {}) {
  const manifestPath = path.join(__dirname, 'data', 'image-manifest.json');
  const translationsPath = path.join(__dirname, 'data', 'translations.cache.json');
  const steps = {};

  if (commit) steps.backup = await runBackup({ dir: backupDir, timestamp: tsNow() });
  else steps.backup = '[dry-run] skipped';

  const djNames = djBrandNames || [...new Set(require('./data/dummyjson-catalog.json').map((p) => p.brand).filter(Boolean))];
  steps.brands = await importBrands({ djBrandNames: djNames, commit });
  steps.categories = await importCategories({ commit });
  steps.fixed = await fixExisting({ commit, translateFn, processImagesFn, manifestPath, translationsPath, catalog: catalogById ? [...catalogById.values()] : undefined });
  steps.imported = await importNew({ commit, selection, catalogById, translateFn, processImagesFn, manifestPath, translationsPath });
  steps.resync = await resyncAggregates({ commit });
  steps.verify = await runChecks();
  return steps;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    console.log(flags.commit ? '=== COMMIT RUN ===' : '=== DRY RUN (no writes) ===');
    const r = await runMigration({ commit: flags.commit });
    console.log(JSON.stringify({ backup: r.backup && r.backup.outDir, brands: r.brands, categories: r.categories, fixed: r.fixed, imported: r.imported, resync: r.resync, verifyCounts: r.verify.counts, verifyPass: r.verify.pass }, null, 1));
    if (!r.verify.pass) console.error('VERIFY FAILURES:\n' + r.verify.failures.map((f) => ' - ' + f).join('\n'));
    await disconnect();
    process.exit(r.verify.pass ? 0 : 1);
  })().catch((e) => { console.error('MIGRATE FAILED:', e.message); process.exit(1); });
}

module.exports = { runMigration };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx jest tests/scripts/migrate.test.js`
Expected: PASS.

- [ ] **Step 5: Run the FULL test suite for the migration**

Run: `cd backend && npx jest tests/scripts/`
Expected: all suites PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/scripts/migrate.js backend/tests/scripts/migrate.test.js
git commit -m "feat(catalog): migrate.js orchestrator (backup->...->verify) + tests"
```

---

## Task 19: Frontend menu — show 6 verticals with Vietnamese labels

**Files:**
- Modify: `frontend/src/layout/headers/header-com/header-category.jsx`

> **NOTE:** This touches a storefront component. REQUIRED SUB-SKILL when executing this task: invoke `storefront-redesign` for design-system/i18n conventions, then apply the edit below.

- [ ] **Step 1: Replace the `defaultTypes` line and add a label map**

Find:

```jsx
    // Use the exact 5 predefined default types
    const defaultTypes = ["fashion", "electronics", "beauty", "jewelry", "other"];
```

Replace with:

```jsx
    // 6 store verticals with Vietnamese display labels
    const defaultTypes = ["fashion", "electronics", "beauty", "jewelry", "home", "sports"];
    const TYPE_LABELS = {
      fashion: "Thời trang",
      electronics: "Đồ điện tử",
      beauty: "Làm đẹp",
      jewelry: "Trang sức",
      home: "Nhà cửa & Đời sống",
      sports: "Thể thao",
    };
```

- [ ] **Step 2: Render the Vietnamese label for the top-level type**

Find:

```jsx
          {type.charAt(0).toUpperCase() + type.slice(1)}
```

Replace with:

```jsx
          {TYPE_LABELS[type] || (type.charAt(0).toUpperCase() + type.slice(1))}
```

- [ ] **Step 3: Manual verification (no FE unit-test harness for this menu)**

Run the storefront, open the header category dropdown:
```bash
cd frontend && npm run dev
```
Expected: top-level menu shows **Thời trang · Đồ điện tử · Làm đẹp · Trang sức · Nhà cửa & Đời sống · Thể thao**; each expands to its Vietnamese sub-categories; clicking one routes to `/shop?category=<slug>` and returns products.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/layout/headers/header-com/header-category.jsx
git commit -m "feat(storefront): category menu shows 6 verticals with Vietnamese labels"
```

---

## Task 20: Live dress-rehearsal, commit, verify (OPERATIONAL — user-gated)

> ⚠️ This task writes to the **live semi-prod DB** (`187.124.3.207`). Do NOT run until the user explicitly approves. Each step has a checkpoint.

**Files:** none (runs the committed scripts).

- [ ] **Step 1: Generate the selection (if not already committed)**

Run: `cd backend && npm run catalog:selection`
Expected: `Wrote selection.json: 66 products`.

- [ ] **Step 2: Dry-run the full migration and review the plan**

Run: `cd backend && npm run catalog:dry`
Expected: prints `=== DRY RUN (no writes) ===`, the per-step counts, and `verifyPass`. **Review the output with the user.** No DB writes happen.

- [ ] **Step 3: Take a manual backup first (independent safety net)**

Run: `cd backend && npm run catalog:backup`
Expected: `Backup written: backups/<timestamp> { products: 53, categories: 16, brands: 11 }`.

- [ ] **Step 4: Commit run (writes to live DB; auto-backup runs inside)**

Run: `cd backend && npm run catalog:commit`
Expected: `=== COMMIT RUN ===`, step counts (`fixed: {fixed:53}`, `imported: {inserted:66}`), `verifyPass: true`, exit 0.
If `verifyPass: false` → STOP, read failures, and consider `npm run catalog:rollback -- --latest --yes`.

- [ ] **Step 5: Independent verify**

Run: `cd backend && npm run catalog:verify`
Expected: `VERIFY PASS ✅`, counts ~`{ products: 119, categories: 23(+hidden), brands: ... }`.

- [ ] **Step 6: Cross-check via read-only MongoDB MCP**

Using the read-only `mcp__mongodb__*` tools: confirm `products` count ≈ 119, `distinct productType` ⊆ the 6, no image shared by >5 products, and spot-check 3 products render Vietnamese titles + Cloudinary images. Any discrepancy vs `verify.js` is a failure.

- [ ] **Step 7: Visual confirmation in the apps**

- CRM `localhost:8081/products` and `/categories`: products show correct images, Vietnamese names, balanced categories.
- Storefront `localhost:3001`: category menu shows 6 Vietnamese verticals; a category page lists its products.

- [ ] **Step 8: Commit the idempotency caches produced by the real run**

```bash
git add backend/scripts/data/translations.cache.json backend/scripts/data/image-manifest.json
git commit -m "chore(catalog): commit translation + image idempotency caches from live run"
```

---

## Self-Review

**Spec coverage** — every spec section maps to a task:
- §4 taxonomy → Task 2 (`CATEGORY_TREE`) + Task 8 (apply). §5 field mapping → Task 5. §6 reclassify/orphans/VN-special → Tasks 12–13. §7.1 pricing → Task 1/5; §7.2 localization → Task 9; §7.3 images → Task 10/13/14; §7.4 brands → Tasks 2/7. §8 allocation → Task 11. §9 backup/order/idempotency/dry-run/rollback → Tasks 6,17,18. §10 verify (12 checks) → Task 16. §11 frontend → Task 19. §12 deliverables → all. §13 findings → resolved in the cited tasks.
- **Live execution** of the spec's "loop" → Task 20.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; every test shows real assertions. ✔

**Type consistency:** function names used across tasks are consistent — `mapDjToTaxonomy`, `reclassifyExisting`, `pickChildren`, `brandFixFor`, `isVnSpecial`, `sizesForType` (mappings); `buildProductDoc` (build-product); `translateProducts` (translate); `processImages` (images); `importBrands`/`importBrands.idByName`, `importCategories`, `fixExisting`, `importNew`, `resyncAggregates`, `runChecks`, `runBackup`, `rollback`, `runMigration`. `selection.json` shape `{id,sku,category,productType}` is produced in Task 11 and consumed (by `id`) in Tasks 14/18. ✔

**Known caveat:** Task 13 `fixExisting` test relies on the committed `dummyjson-catalog.json` for representative images; if a parent has no representative source image, that product keeps its old `img` — `verify.js` check #4 still passes (uniqueness), but a stale `img` could remain. Mitigation: the 16-shared-image set all map to parents with DJ sources; the VN-special Silk Scarf maps to `Thời trang nữ` which has sources. If any product is left on the shared image, verify check #4 (>5) will catch a residual cluster.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-shofy-catalog-cleanup.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`.

**2. Inline Execution** — execute tasks in this session with checkpoints. REQUIRED SUB-SKILL: `superpowers:executing-plans`.

Note: Tasks 1–19 are safe (tests run in-memory, no live DB). **Task 20 writes to the live DB and is separately user-gated.**
