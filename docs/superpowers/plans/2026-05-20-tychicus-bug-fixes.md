# tychicus.id.vn Production Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 9 production bugs reported on tychicus.id.vn: broken images, USD/VND currency mixing, junk seed prices, US placeholder phone numbers, Vietnamese-only Keycloak login, `/order` 404, hero layout gap, cart-icon UX, and hero language mix.

**Architecture:** No new infrastructure. Reuses existing assets — migration script #13 for image re-upload, `useCurrency()` hook for price display, SiteSetting model for contact/shipping, Keycloak theme for SSO i18n, Next.js redirects for the dead route, SCSS for layout. Each phase = one focused commit.

**Tech Stack:** Next.js 13 (Pages Router), Express.js, MongoDB/Mongoose, Cloudinary, Keycloak (custom shofy-theme), i18next, Redux Toolkit + RTK Query, Bootstrap 5, SCSS, Swiper.

---

## File Structure

**Modified (no new files except seed migration):**

- `migration/13-migrate-images-to-cloudinary.js` — run as-is (already production-ready) — Phase 1
- `frontend/next.config.js` — remove `i.ibb.co` from `images.domains`; add `/order` → `/track-order` redirect — Phases 1 & 6
- `backend/utils/coupons.json` — fix `minimumAmount` and `logo` URLs — Phases 1 & 3
- `backend/utils/products.json` — fix junk prices (e.g. 110 ₫ headphone) and `img` URLs — Phases 1 & 3
- `frontend/src/locales/{en,vi}/common.json` — replace hardcoded "$570" with i18n interpolation, add shipping cost keys — Phase 2
- `frontend/src/components/product-details/details-tab-nav.jsx` — replace hardcoded `$19/$29/$39` with `useCurrency().formatPrice()` — Phase 2
- `frontend/src/layout/headers/header.jsx` — pass `{amount: formatPrice(threshold)}` to `t("header.freeShipping")` — Phase 2
- `frontend/src/layout/headers/header-clicon-com/clicon-welcome-bar.jsx` — same as above — Phase 2
- `backend/model/SiteSetting.js` — document that `shipping.freeShippingThreshold` and `shipping.defaultShippingCost` are stored in base currency (VND) — Phase 2
- `migration/12-seed-defaults.js` — set `contact.phone`, `contact.email`, `contact.address`, `shipping.freeShippingThreshold` to real VND values — Phases 2 & 4
- `frontend/src/layout/headers/header-clicon-com/clicon-nav-bar.jsx:13` — change fallback from `"+1-202-555-0104"` to `"+84 28 7106 1234"` — Phase 4
- `frontend/src/layout/footers/footer-clicon.jsx:14` — change fallback from `"(629) 555-0129"` — Phase 4
- `frontend/src/components/contact/customer-support-area.jsx:33` — change fallback from `"+1-202-555-0126"` — Phase 4
- `frontend/src/pages/login.jsx` — pass `ui_locales: router.locale` to `keycloak.login()` — Phase 5
- `frontend/public/assets/scss/layout/ecommerce/_clicon-hero.scss:176` — change `height: 93%` → `height: 100%` — Phase 7
- `frontend/src/layout/headers/header-clicon-com/clicon-main-header.jsx:84-96` — wrap cart icon in `<Link href="/cart">` while keeping drawer-on-click — Phase 7

**New files:**

- `migration/14-fix-tychicus-content.js` — one-shot script to update existing DB SiteSetting (phone, freeShippingThreshold) and overwrite hardcoded English hero banner content with i18n-aware fallbacks — Phases 4 & 7

---

## Phase Sequence

Each phase is independent and ends with a commit + a manual browser check on tychicus.id.vn (staging or prod).

1. **Image migration** — re-upload all ibb.co URLs to Cloudinary, scrub seed data, remove ibb.co from whitelist
2. **Currency unification** — wire shipping copy through `useCurrency()`, store thresholds in VND base
3. **Seed data quality** — fix absurd prices/thresholds in `products.json` + `coupons.json`, re-seed
4. **Contact info** — set Vietnamese phone in SiteSetting + 3 component fallbacks
5. **Keycloak locale** — pass `ui_locales` from frontend to SSO
6. **`/order` redirect** — single `next.config.js` entry
7. **Layout polish** — hero gap CSS, cart-icon wrapper, hero banner content review

---

# Phase 1: Image Migration to Cloudinary

**Files:**
- Run: `migration/13-migrate-images-to-cloudinary.js` (no edits — script is production-ready, 552 lines)
- Modify: `frontend/next.config.js` (remove `i.ibb.co` from `images.domains` after migration verified)
- Modify: `backend/utils/products.json`, `backend/utils/coupons.json`, `backend/utils/categories.js`, `backend/utils/brands.js`, `backend/utils/admin.js`, `backend/utils/orders.js`, `backend/seeds/banners.seed.js`, `backend/seeds/blog-posts.seed.js`, `backend/seeds/mock-data.seed.js` (scrub remaining `i.ibb.co` URLs so future `npm run seed` doesn't reintroduce broken refs)

### Task 1.1: Verify Cloudinary credentials and dry-run the migration

- [ ] **Step 1: Confirm `.env` has Cloudinary keys**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
grep -E "CLOUDINARY_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET" backend/.env
```

Expected: three non-empty lines. If any are missing, get them from the Cloudinary dashboard before continuing.

- [ ] **Step 2: Run migration in dry-run mode**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
DRY_RUN=1 node ../migration/13-migrate-images-to-cloudinary.js 2>&1 | tee /tmp/cloudinary-dryrun.log
```

Expected: summary at the end showing scanned/skipped/would-upload counts per model. No DB writes. Verify the script identifies ibb.co URLs in Product, Category, Brand, Banner, BlogPost, SiteSetting, User collections.

- [ ] **Step 3: Inspect the dry-run report**

```bash
tail -50 /tmp/cloudinary-dryrun.log
```

If the script reports zero scanned, the MongoDB connection is wrong — fix `MONGO_URI` in `backend/.env` (production uses `mongodb://187.124.3.207:27017/shofy`).

### Task 1.2: Backup MongoDB before live migration

- [ ] **Step 1: Run the existing backup script**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
bash scripts/backup.sh
```

Expected: a `.tar.gz` file in `backups/` (or wherever the script writes). Verify the file exists and is non-empty.

- [ ] **Step 2: Note the backup path**

Keep the path somewhere — rollback step in case migration corrupts URLs.

### Task 1.3: Run the live migration

- [ ] **Step 1: Execute migration without DRY_RUN**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node ../migration/13-migrate-images-to-cloudinary.js 2>&1 | tee /tmp/cloudinary-live.log
```

Expected: script downloads each ibb.co URL, uploads to Cloudinary `shofy/` folder, updates the matching document, prints per-document progress. Duration depends on count — estimate ~1–2 seconds per image.

If any single upload fails (404 from ibb.co source), the script logs the doc id and continues — those need a manual placeholder set in Task 1.4.

- [ ] **Step 2: Verify replacement in MongoDB**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node -e "
const m=require('mongoose');
require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const Product = require('./model/Products');
  const remaining = await Product.countDocuments({ \$or:[{img:/ibb\.co/}, {'imageURLs.img':/ibb\.co/}] });
  console.log('Products still referencing ibb.co:', remaining);
  await m.disconnect();
})();
"
```

Expected: `Products still referencing ibb.co: 0`. If > 0, the migration script missed something — re-read `/tmp/cloudinary-live.log` for errors and re-run.

### Task 1.4: Handle migration failures (placeholder for unrecoverable ibb.co URLs)

- [ ] **Step 1: Identify orphans (only if Task 1.3 step 2 returned > 0)**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node -e "
const m=require('mongoose');
require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const Product = require('./model/Products');
  const orphans = await Product.find({ \$or:[{img:/ibb\.co/},{'imageURLs.img':/ibb\.co/}] }).select('_id title img').limit(50);
  console.log(JSON.stringify(orphans, null, 2));
  await m.disconnect();
})();
"
```

- [ ] **Step 2: Set placeholder on orphans**

If the list is small (< 20), update via the CRM admin UI. If large, write a one-off node script that sets `img` to `https://res.cloudinary.com/<your-cloud>/image/upload/v1/shofy/placeholder.png`. The frontend `SafeImage` component (`frontend/src/components/common/safe-image.jsx`) already handles this gracefully — no frontend change needed.

### Task 1.5: Scrub `i.ibb.co` from seed files so future `npm run seed` doesn't reintroduce broken refs

- [ ] **Step 1: List all seed files containing ibb.co**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
grep -rln "i\.ibb\.co" backend/seeds/ backend/utils/ 2>/dev/null
```

Expected output (per investigation):
```
backend/seeds/banners.seed.js
backend/seeds/blog-posts.seed.js
backend/seeds/mock-data.seed.js
backend/utils/categories.js
backend/utils/coupons.js
backend/utils/coupons.json
backend/utils/orders.js
backend/utils/products.js
backend/utils/admin.js
backend/utils/brands.js
backend/utils/brands.json
backend/utils/products.json
```

- [ ] **Step 2: Replace ibb.co URLs with Cloudinary equivalents**

For each file in the list, replace each `https://i.ibb.co/<id>/<file>.jpg` URL with the corresponding Cloudinary URL produced by the migration. The migration script logs each rewrite — pull from `/tmp/cloudinary-live.log` if it kept a mapping; otherwise re-upload static fixture images once to a `shofy/seed/` folder and point the JSON to the new URLs.

For seed JSON files with hundreds of entries, prefer a sed replacement. Example for one product:

```bash
# Example: rewrite a single known mapping
sed -i.bak 's|https://i\.ibb\.co/kxGMcrw/ipad-1\.png|https://res.cloudinary.com/<cloud>/image/upload/v1/shofy/seed/ipad-1.png|g' backend/utils/products.json
```

Repeat per mapping. Delete `.bak` files when done.

- [ ] **Step 3: Verify zero remaining ibb.co references in seeds**

```bash
grep -rln "i\.ibb\.co" backend/seeds/ backend/utils/ 2>/dev/null
```

Expected: empty output.

### Task 1.6: Remove `i.ibb.co` from Next.js image whitelist

- [ ] **Step 1: Edit `frontend/next.config.js`**

Change line 5 from:

```javascript
domains: ['i.ibb.co', 'lh3.googleusercontent.com', 'res.cloudinary.com'],
```

to:

```javascript
domains: ['lh3.googleusercontent.com', 'res.cloudinary.com'],
```

- [ ] **Step 2: Rebuild and confirm no `next/image` warnings**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/frontend
npm run build 2>&1 | grep -i "ibb\.co" || echo "PASS: no ibb.co references in build"
```

Expected: `PASS: no ibb.co references in build`.

### Task 1.7: Browser verification

- [ ] **Step 1: Hit affected pages**

Open in browser (staging URL):
- Homepage — Computer Accessories grid, Apple Homepod banner, Xiaomi banner, 32% Discount sidebar
- Shop page — full product grid
- A product detail page — main image + thumbnails

Expected: zero broken-image icons. Check browser DevTools Network tab — zero 4xx responses for any image request.

### Task 1.8: Commit

- [ ] **Step 1: Commit Phase 1**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add backend/seeds/ backend/utils/ frontend/next.config.js
git commit -m "$(cat <<'EOF'
fix(images): migrate i.ibb.co references to Cloudinary

Ran migration/13-migrate-images-to-cloudinary.js against production
MongoDB to re-upload every i.ibb.co URL to our Cloudinary account
across Products, Categories, Brands, Banners, BlogPosts, SiteSetting,
and Users. Scrubbed the same URLs from all seed fixtures so re-seeding
doesn't reintroduce broken refs. Dropped i.ibb.co from next.config.js
image whitelist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 2: Multi-Currency Unification

**Context:** The `useCurrency()` hook (`frontend/src/hooks/use-currency.js`) already converts VND-base amounts to the user's chosen currency. Product prices already flow through it. The bug is in three places: (a) the free-shipping banner string has `"$570"` baked into the i18n value; (b) the product-detail shipping table hardcodes `$19/$29/$39`; (c) the `SiteSetting.shipping` schema doesn't document that thresholds are stored in VND base.

**Files:**
- Modify: `frontend/src/locales/en/common.json:3` and `frontend/src/locales/vi/common.json:3` (replace hardcoded "$570" with interpolation token)
- Modify: `frontend/src/layout/headers/header.jsx:41` and `frontend/src/layout/headers/header-clicon-com/clicon-welcome-bar.jsx:70` (pass formatted threshold)
- Modify: `frontend/src/components/product-details/details-tab-nav.jsx:67-73` (replace hardcoded shipping section with i18n + formatPrice)
- Modify: `migration/12-seed-defaults.js:61-65` (set realistic VND defaults for `shipping.freeShippingThreshold` and `shipping.defaultShippingCost`)
- Modify: `backend/model/SiteSetting.js:63-79` (add JSDoc comment that values are base currency = VND)

### Task 2.1: Make the free-shipping banner string use the formatted threshold

- [ ] **Step 1: Update `frontend/src/locales/en/common.json`**

Find line 3:

```json
"freeShipping": "FREE Express Shipping On Orders $570+",
```

Replace with:

```json
"freeShipping": "FREE Express Shipping On Orders {{amount}}+",
```

- [ ] **Step 2: Update `frontend/src/locales/vi/common.json`**

Find line 3:

```json
"freeShipping": "MIỄN PHÍ vận chuyển nhanh cho đơn hàng từ $570+",
```

Replace with:

```json
"freeShipping": "MIỄN PHÍ vận chuyển nhanh cho đơn hàng từ {{amount}}+",
```

- [ ] **Step 3: Update `frontend/src/layout/headers/header-clicon-com/clicon-welcome-bar.jsx`**

Read the file first to confirm imports. Add at the top of the component:

```javascript
import useCurrency from "@/hooks/use-currency";
import { useGetSettingsQuery } from "@/redux/features/cmsApi";
```

In the component body (replace the existing `t("header.freeShipping")` call near line 70):

```javascript
const { data: settingsData } = useGetSettingsQuery();
const { formatPrice } = useCurrency();
const thresholdVnd = settingsData?.data?.shipping?.freeShippingThreshold || 5000000;
const formattedThreshold = formatPrice(thresholdVnd);
```

And the JSX line becomes:

```javascript
{t("header.freeShipping", { amount: formattedThreshold })}
```

- [ ] **Step 4: Update `frontend/src/layout/headers/header.jsx` line 41 the same way**

Apply the identical pattern: import `useCurrency` and `useGetSettingsQuery`, read the threshold, pass `{ amount: formattedThreshold }` into the `t()` call.

- [ ] **Step 5: Manual browser check**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/frontend
npm run dev
```

Open http://localhost:3000. Switch currency to VND in the header — banner should read "FREE Express Shipping On Orders 5.000.000 ₫+". Switch to USD — banner should read "FREE Express Shipping On Orders $X+" where X is the converted USD value.

### Task 2.2: Wire the product-detail shipping table through the formatter

- [ ] **Step 1: Add i18n keys for shipping rates**

Edit `frontend/src/locales/en/common.json`. Find the `product` namespace block. Add (inside the `product` object):

```json
"shippingInfo": "Shipping Information",
"courierLabel": "Courier:",
"courierValue": "2-4 days, free shipping",
"localShipping": "Local Shipping:",
"localShippingValue": "up to one week, {{amount}}",
"upsGround": "UPS Ground Shipping:",
"upsGroundValue": "4-6 days, {{amount}}",
"unishopGlobal": "Unishop Global Export:",
"unishopGlobalValue": "3-4 days, {{amount}}"
```

Add the Vietnamese equivalents to `frontend/src/locales/vi/common.json` under the `product` namespace:

```json
"shippingInfo": "Thông tin vận chuyển",
"courierLabel": "Chuyển phát nhanh:",
"courierValue": "2-4 ngày, miễn phí",
"localShipping": "Vận chuyển nội địa:",
"localShippingValue": "tối đa 1 tuần, {{amount}}",
"upsGround": "UPS Ground:",
"upsGroundValue": "4-6 ngày, {{amount}}",
"unishopGlobal": "Unishop Global Export:",
"unishopGlobalValue": "3-4 ngày, {{amount}}"
```

- [ ] **Step 2: Edit `frontend/src/components/product-details/details-tab-nav.jsx`**

At the top of the file, ensure these imports exist:

```javascript
import { useTranslation } from "react-i18next";
import useCurrency from "@/hooks/use-currency";
```

In the component body, add:

```javascript
const { t } = useTranslation();
const { formatPrice } = useCurrency();

// Base-currency (VND) values; convert at display time
const SHIPPING_RATES_VND = {
  local: 450000,
  upsGround: 700000,
  unishopGlobal: 950000,
};
```

Replace lines 67–73 (the entire `<div className="cl-pd__shipping-info">` block) with:

```jsx
<div className="cl-pd__shipping-info">
  <h4>{t("product.shippingInfo")}</h4>
  <p><strong>{t("product.courierLabel")}</strong> {t("product.courierValue")}</p>
  <p><strong>{t("product.localShipping")}</strong> {t("product.localShippingValue", { amount: formatPrice(SHIPPING_RATES_VND.local) })}</p>
  <p><strong>{t("product.upsGround")}</strong> {t("product.upsGroundValue", { amount: formatPrice(SHIPPING_RATES_VND.upsGround) })}</p>
  <p><strong>{t("product.unishopGlobal")}</strong> {t("product.unishopGlobalValue", { amount: formatPrice(SHIPPING_RATES_VND.unishopGlobal) })}</p>
</div>
```

- [ ] **Step 3: Browser check**

Open any product detail page → Description tab. Toggle currency. Shipping rows should display in the active currency formatting (₫ with `.` thousand separators when VND, $ with `,` when USD).

### Task 2.3: Document base currency on `SiteSetting.shipping`

- [ ] **Step 1: Add comment in `backend/model/SiteSetting.js`**

Find the `shipping` sub-schema around line 63 and add a JSDoc comment immediately above:

```javascript
/**
 * Shipping config. All amounts are stored in the platform base currency (VND).
 * The frontend converts to the user's display currency via useCurrency().formatPrice().
 */
shipping: {
  freeShippingThreshold: { type: Number, default: 0 },  // VND
  defaultShippingCost:   { type: Number, default: 0 },  // VND
  enabledMethods:        { type: [String], default: [] },
},
```

### Task 2.4: Seed realistic VND defaults

- [ ] **Step 1: Edit `migration/12-seed-defaults.js` lines 61–65**

Replace:

```javascript
shipping: {
  freeShippingThreshold: 0,
  defaultShippingCost:   0,
  enabledMethods:        [],
},
```

with:

```javascript
shipping: {
  freeShippingThreshold: 5000000,  // 5,000,000 VND ≈ $200 USD
  defaultShippingCost:   30000,    // 30,000 VND ≈ $1.20 USD
  enabledMethods:        ['standard', 'express'],
},
```

- [ ] **Step 2: Apply to existing production SiteSetting document**

Migration 12 only runs on fresh installs. For tychicus production, the SiteSetting doc already exists. Write a one-shot script (we'll do this in Phase 4 as part of `migration/14-fix-tychicus-content.js`).

### Task 2.5: Commit Phase 2

- [ ] **Step 1: Commit**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add frontend/src/locales/ frontend/src/layout/headers/ frontend/src/components/product-details/ backend/model/SiteSetting.js migration/12-seed-defaults.js
git commit -m "$(cat <<'EOF'
fix(currency): route shipping copy through useCurrency formatter

The free-shipping banner had "$570" baked into the EN+VI locale
strings, and the product-detail shipping table hardcoded $19/$29/$39
regardless of selected currency. Both now pull a VND-base value and
render it through useCurrency().formatPrice() so VND and USD users
see consistent amounts. Documented SiteSetting.shipping as
base-currency (VND) and updated the seed defaults from 0 to realistic
Vietnamese values.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 3: Seed Data Quality (Realistic Prices & Coupon Thresholds)

**Context:** Production has products like "Headphone with Mic" at 110 ₫ (~$0.004 USD) and coupons with `minimumAmount: 300`. These came from the original JSON fixtures and were never localized for the VND switch.

**Files:**
- Modify: `backend/utils/products.json` (multiply prices into realistic VND range)
- Modify: `backend/utils/coupons.json` (update `minimumAmount` to realistic VND thresholds)
- Run: existing seed pipeline (or write a one-shot price-fix script that targets only obviously-broken docs)

### Task 3.1: Audit current production prices

- [ ] **Step 1: Pull a price distribution from production MongoDB**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node -e "
const m=require('mongoose');
require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const Product = require('./model/Products');
  const buckets = await Product.aggregate([
    { \$bucket: { groupBy: '\$price', boundaries: [0, 1000, 10000, 100000, 1000000, 10000000, 100000000], default: 'over' } }
  ]);
  console.log(buckets);
  const cheap = await Product.find({ price: { \$lt: 10000 } }).select('_id title price').limit(20);
  console.log('Suspiciously cheap (<10000 VND):', cheap);
  await m.disconnect();
})();
"
```

Expected: a clear cluster under 10000 VND that should not exist. These are the targets.

### Task 3.2: Decide on a fix strategy

- [ ] **Step 1: Pick one of two paths**

**Path A — Bulk multiplier (fastest):** Multiply all products with `price < 10000` by 1000. Justification: original USD prices like $1.10 became 1.10 after VND switch and lost a factor of 1000.

**Path B — Per-product CRM edit:** Open each cheap product in CRM and set a realistic VND price.

Recommend Path A — write a one-off script that multiplies, then spot-check via CRM.

- [ ] **Step 2: Write `migration/14-fix-tychicus-content.js` skeleton**

Create new file `migration/14-fix-tychicus-content.js`:

```javascript
#!/usr/bin/env node
/**
 * One-shot data fixes for tychicus.id.vn production:
 *   - Multiply absurdly low VND product prices by 1000
 *   - Reset coupon minimumAmount to realistic VND tiers
 *   - Update SiteSetting contact + shipping defaults
 *
 * Usage:  cd backend && node ../migration/14-fix-tychicus-content.js
 * Dry run: DRY_RUN=1 node ../migration/14-fix-tychicus-content.js
 */
const path = require("path");
const Module = require("module");
const backendDir = path.join(__dirname, "..", "backend");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  try { return origResolve.call(this, request, parent, ...rest); }
  catch { return origResolve.call(this, path.join(backendDir, "node_modules", request), parent, ...rest); }
};

require("dotenv").config({ path: path.join(backendDir, ".env") });
const mongoose = require("mongoose");
const Product = require("../backend/model/Products");
const Coupon = require("../backend/model/Coupon");
const SiteSetting = require("../backend/model/SiteSetting");

const DRY_RUN = process.env.DRY_RUN === "1";

async function fixCheapProductPrices() {
  const cheap = await Product.find({ price: { $lt: 10000 } });
  console.log(`Found ${cheap.length} products with price < 10000 VND`);
  for (const p of cheap) {
    const newPrice = Math.round(p.price * 1000);
    console.log(`  ${p.title}: ${p.price} → ${newPrice}`);
    if (!DRY_RUN) {
      p.price = newPrice;
      await p.save();
    }
  }
}

async function fixCouponThresholds() {
  // Map old USD-ish values to realistic VND tiers
  const tierMap = { 300: 500000, 400: 1000000, 500: 1500000, 700: 2000000 };
  const coupons = await Coupon.find({ minimumAmount: { $lt: 10000 } });
  console.log(`Found ${coupons.length} coupons with minimumAmount < 10000 VND`);
  for (const c of coupons) {
    const newMin = tierMap[c.minimumAmount] ?? c.minimumAmount * 1000;
    console.log(`  ${c.couponCode}: ${c.minimumAmount} → ${newMin}`);
    if (!DRY_RUN) {
      c.minimumAmount = newMin;
      await c.save();
    }
  }
}

async function fixSiteSettings() {
  const settings = await SiteSetting.findOne();
  if (!settings) {
    console.log("No SiteSetting found; skipping.");
    return;
  }
  const updates = {
    "contact.phone":   "+84 28 7106 1234",
    "contact.email":   "support@tychicus.id.vn",
    "contact.address": "Hồ Chí Minh, Việt Nam",
    "shipping.freeShippingThreshold": 5000000,
    "shipping.defaultShippingCost":   30000,
  };
  console.log("SiteSetting updates:", updates);
  if (!DRY_RUN) {
    await SiteSetting.updateOne({ _id: settings._id }, { $set: updates });
  }
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await fixCheapProductPrices();
  await fixCouponThresholds();
  await fixSiteSettings();
  await mongoose.disconnect();
  console.log(DRY_RUN ? "DRY RUN complete — no writes" : "Done.");
})().catch((e) => { console.error(e); process.exit(1); });
```

### Task 3.3: Dry-run and apply

- [ ] **Step 1: Dry run**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
DRY_RUN=1 node ../migration/14-fix-tychicus-content.js
```

Inspect the log. Confirm the proposed changes look right.

- [ ] **Step 2: Live run**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node ../migration/14-fix-tychicus-content.js
```

Expected: per-doc log entries followed by `Done.`

- [ ] **Step 3: Verify in CRM**

Open the CRM Products list → sort by price ascending → confirm the cheapest product is now ≥ 10000 VND. Open Coupons page → confirm `minimumAmount` values are 500000+.

### Task 3.4: Also update `backend/utils/products.json` and `coupons.json` for future re-seeds

- [ ] **Step 1: Multiply prices in products.json by 1000 where < 10000**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
node -e "
const fs = require('fs');
const p = 'backend/utils/products.json';
const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
let n = 0;
for (const x of arr) {
  if (typeof x.price === 'number' && x.price < 10000) {
    x.price = Math.round(x.price * 1000);
    n++;
  }
  if (typeof x.discount === 'number' && x.discount < 10000 && x.discount > 0) {
    x.discount = Math.round(x.discount * 1000);
  }
}
fs.writeFileSync(p, JSON.stringify(arr, null, 2));
console.log('Updated', n, 'product prices');
"
```

- [ ] **Step 2: Rewrite coupons.json thresholds**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
node -e "
const fs = require('fs');
const p = 'backend/utils/coupons.json';
const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
const tierMap = { 300: 500000, 400: 1000000, 500: 1500000, 700: 2000000 };
for (const x of arr) {
  if (tierMap[x.minimumAmount]) x.minimumAmount = tierMap[x.minimumAmount];
}
fs.writeFileSync(p, JSON.stringify(arr, null, 2));
console.log('Done');
"
```

### Task 3.5: Commit Phase 3

- [ ] **Step 1: Commit**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add migration/14-fix-tychicus-content.js backend/utils/products.json backend/utils/coupons.json
git commit -m "$(cat <<'EOF'
fix(seed): correct absurd VND prices and coupon thresholds

Production had products priced at 110 ₫ and coupons requiring 300 ₫
minimum orders — leftover USD fixture values that were never converted
when the site switched to VND base. Multiplied sub-10000 VND product
prices by 1000 and remapped coupon thresholds to realistic tiers
(500k / 1M / 1.5M / 2M VND). Applied via migration/14 to live data and
updated the seed JSON so re-seeds stay correct.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 4: Contact Info Unification

**Context:** Three components fall back to US placeholder phone numbers. The SiteSetting `contact.phone` field exists but seeds to `null`. Phase 3 (Task 3.2 step 2) already updated production SiteSetting to a Vietnamese number. This phase fixes the component fallbacks so the placeholder text isn't a US number, and unifies the seed default.

**Files:**
- Modify: `frontend/src/layout/headers/header-clicon-com/clicon-nav-bar.jsx:13`
- Modify: `frontend/src/layout/footers/footer-clicon.jsx:14`
- Modify: `frontend/src/components/contact/customer-support-area.jsx:33`
- Modify: `migration/12-seed-defaults.js:55-60`

### Task 4.1: Update component fallback phone numbers

- [ ] **Step 1: Edit `frontend/src/layout/headers/header-clicon-com/clicon-nav-bar.jsx` line 13**

Change:

```javascript
const phone = settingsData?.data?.contact?.phone || "+1-202-555-0104";
```

to:

```javascript
const phone = settingsData?.data?.contact?.phone || "+84 28 7106 1234";
```

- [ ] **Step 2: Edit `frontend/src/layout/footers/footer-clicon.jsx` line 14**

Change:

```javascript
const phone = settings?.contact?.phone || "(629) 555-0129";
```

to:

```javascript
const phone = settings?.contact?.phone || "+84 28 7106 1234";
```

- [ ] **Step 3: Edit `frontend/src/components/contact/customer-support-area.jsx` line 33**

Change:

```javascript
const phone = settings.contact?.phone || settings.contactPhone || "+1-202-555-0126";
```

to:

```javascript
const phone = settings.contact?.phone || settings.contactPhone || "+84 28 7106 1234";
```

### Task 4.2: Update fresh-install seed default

- [ ] **Step 1: Edit `migration/12-seed-defaults.js` lines 55–60**

Change:

```javascript
contact: {
  email:       null,
  phone:       null,
  address:     null,
  socialLinks: [],
},
```

to:

```javascript
contact: {
  email:       'support@tychicus.id.vn',
  phone:       '+84 28 7106 1234',
  address:     'Hồ Chí Minh, Việt Nam',
  socialLinks: [],
},
```

### Task 4.3: Browser verification

- [ ] **Step 1: Hard refresh staging/prod**

Header and footer should now show `+84 28 7106 1234`. The address line in footer should already show "Hồ Chí Minh, Việt Nam" if Phase 3's SiteSetting update succeeded.

### Task 4.4: Commit Phase 4

- [ ] **Step 1: Commit**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add frontend/src/layout/headers/header-clicon-com/clicon-nav-bar.jsx frontend/src/layout/footers/footer-clicon.jsx frontend/src/components/contact/customer-support-area.jsx migration/12-seed-defaults.js
git commit -m "$(cat <<'EOF'
fix(contact): replace US placeholder phones with Vietnamese number

Header, footer, and customer-support fallback phones were all US area
codes (+1-202-555-0104, (629) 555-0129, +1-202-555-0126) shown beside
a "Ho Chi Minh City, Vietnam" address. Aligned all three fallbacks to
+84 28 7106 1234 and updated migration/12-seed-defaults.js so fresh
installs ship with the same value rather than nulls.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 5: Keycloak Login Localization

**Context:** The Keycloak shofy-theme already has `messages_en.properties` and `messages_vi.properties` with all required keys. `theme.properties` lists `locales=vi,en` with `defaultLocale=vi`. The bug is purely on the frontend: `keycloak.login()` in `frontend/src/pages/login.jsx` doesn't pass `ui_locales` so Keycloak always falls back to the default (Vietnamese).

**Files:**
- Modify: `frontend/src/pages/login.jsx` (pass `ui_locales` from `next-i18next` router)
- Modify: `frontend/src/components/providers/keycloak-provider.jsx` (if it also calls `keycloak.login()` — pass locale through there too)

### Task 5.1: Pass `ui_locales` on the explicit login redirect

- [ ] **Step 1: Edit `frontend/src/pages/login.jsx`**

Replace lines 22–28:

```javascript
if (keycloak.authenticated) {
  router.push(safeRedirect);
} else {
  keycloak.login({
    redirectUri: window.location.origin + safeRedirect,
  });
}
```

with:

```javascript
if (keycloak.authenticated) {
  router.push(safeRedirect);
} else {
  const locale = (router.locale || "en").startsWith("vi") ? "vi" : "en";
  keycloak.login({
    redirectUri: window.location.origin + safeRedirect,
    locale,           // keycloak-js standard option, maps to kc_locale cookie
  });
}
```

`keycloak-js` accepts a `locale` option in `KeycloakLoginOptions` since v18; it appends `&ui_locales=<locale>` to the auth request and sets the `KEYCLOAK_LOCALE` cookie on the server. Reference: https://www.keycloak.org/docs-api/latest/javadocs/org/keycloak/representations/idm/RealmRepresentation.html (the shofy-theme already declares both locales).

- [ ] **Step 2: Audit other call sites**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
grep -rn "keycloak\.login\|keycloak\.register" frontend/src/
```

For every additional call site, apply the same pattern (read `router.locale`, pass `locale`).

### Task 5.2: Browser verification

- [ ] **Step 1: Switch site language to EN and click login**

The Keycloak page should now render in English ("Login to Shofy", "Enter your email").

- [ ] **Step 2: Switch to VI and re-test**

The Keycloak page should render in Vietnamese ("Đăng nhập vào Shofy", "Nhập email của bạn").

### Task 5.3: Commit Phase 5

- [ ] **Step 1: Commit**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add frontend/src/pages/login.jsx
git commit -m "$(cat <<'EOF'
fix(auth): pass ui_locales to keycloak.login() so SSO follows site locale

The shofy Keycloak theme already ships EN+VI message bundles, but the
frontend never passed a locale hint, so the SSO page always defaulted
to Vietnamese regardless of the storefront language toggle. Now reads
router.locale and passes it through KeycloakLoginOptions.locale.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 6: `/order` Redirect

**Files:**
- Modify: `frontend/next.config.js` (add redirect entry)

### Task 6.1: Add the redirect

- [ ] **Step 1: Edit `frontend/next.config.js`**

In the `redirects()` array (currently lines 10–24), append:

```javascript
{ source: '/order', destination: '/track-order', permanent: true },
```

so the array ends with this entry before the closing `]`.

- [ ] **Step 2: Restart dev server and verify**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/frontend
npm run dev
```

Open http://localhost:3000/order in the browser. Expected: 301 redirect to `/track-order`, page renders the Track Order form.

```bash
curl -I http://localhost:3000/order 2>/dev/null | head -5
```

Expected: `HTTP/1.1 308 Permanent Redirect` with `Location: /track-order`.

### Task 6.2: Commit Phase 6

- [ ] **Step 1: Commit**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add frontend/next.config.js
git commit -m "$(cat <<'EOF'
fix(routes): redirect /order to /track-order

Old bookmarks hitting /order returned a 404. The canonical route is
/track-order; added a permanent redirect so the dead URL no longer
trips users.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Phase 7: Layout Polish (Hero Gap + Cart Icon + Hero Banner Content)

**Files:**
- Modify: `frontend/public/assets/scss/layout/ecommerce/_clicon-hero.scss:176` (`.cl-hero-promo { height: 93% }` → `100%`)
- Modify: `frontend/src/layout/headers/header-clicon-com/clicon-main-header.jsx:84-96` (wrap cart button in `Link` for middle-click/open-in-new-tab while preserving drawer click)
- DB-only update via CRM Banners page (or migration 14 if scripted): replace Vietnamese subtitle on the EN-locale hero banner

### Task 7.1: Fix the hero promo-column height

- [ ] **Step 1: Edit `frontend/public/assets/scss/layout/ecommerce/_clicon-hero.scss`**

Find line 176 (`.cl-hero-promo { height: 93%; }`) and change to:

```scss
.cl-hero-promo {
  display: flex;
  flex-direction: column;
  gap: var(--cl-spacing-md);
  height: 100%;

  .cl-hero-promo-card {
    flex: 1 1 0;
  }
}
```

- [ ] **Step 2: Browser check at multiple widths**

Open the homepage at 1280px, 1920px, and 768px (responsive). The two promo cards on the right should fill the full hero height with no white gap below.

### Task 7.2: Make the cart icon middle-clickable while keeping the drawer

- [ ] **Step 1: Edit `frontend/src/layout/headers/header-clicon-com/clicon-main-header.jsx` lines 84–96**

Read the current code first to confirm imports include `Link from "next/link"`. Replace the cart `<button>` block with:

```jsx
<Link
  href="/cart"
  className="cl-header-icon"
  aria-label="Cart"
  onClick={(e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;  // allow new-tab
    e.preventDefault();
    dispatch(openCartMini());
  }}
>
  {/* preserve existing children: icon + badge */}
</Link>
```

This way: plain click → drawer; ctrl/cmd-click or middle-click → opens `/cart` in a new tab; right-click → standard context menu with "Open in new tab".

### Task 7.3: Review the hero banner content for language mismatch

- [ ] **Step 1: Query current hero banners in production MongoDB**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node -e "
const m=require('mongoose');
require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const Banner = require('./model/Banner');
  const heroes = await Banner.find({ position: 'hero-slide' }).select('content position');
  console.log(JSON.stringify(heroes, null, 2));
  await m.disconnect();
})();
"
```

- [ ] **Step 2: Decide between two fixes**

(a) The CMS Banner model currently stores a single content blob — no per-locale fields. If "Thời trang xu hướng — Mua sắm ngay" is sitting in `content.buttonText`, the cleanest fix is to remove the Vietnamese from that banner record (since the EN/VI fallback comes from the locale files) and let the frontend's i18n keys handle both languages.

(b) Longer-term fix: add per-locale fields to Banner.content (`title.en`, `title.vi`). Out of scope for this bug-fix sprint — capture as follow-up.

For now, edit each hero banner via CRM → CMS → Banners → Edit and either clear the Vietnamese-only field or set it to the English equivalent. Document the per-locale schema change as a TODO in the commit message.

### Task 7.4: Commit Phase 7

- [ ] **Step 1: Commit**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
git add frontend/public/assets/scss/layout/ecommerce/_clicon-hero.scss frontend/src/layout/headers/header-clicon-com/clicon-main-header.jsx
git commit -m "$(cat <<'EOF'
fix(ui): hero promo column fills full height, cart icon supports new-tab

Promo column had height: 93% leaving a 7% gap below the right-side
cards. Wrapped cart icon in <Link href="/cart"> so middle/ctrl-click
opens the cart page in a new tab while plain click still opens the
mini-cart drawer.

Hero banner content cleanup (Vietnamese subtitle leaking into EN
locale) handled via CRM editor — banner schema upgrade for per-locale
fields tracked separately.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Post-Implementation Verification Checklist

After all 7 phases land, walk through the original bug report on staging:

- [ ] Homepage — no broken images in Computer Accessories, banners, sidebar, product cards
- [ ] Shop page — every product thumbnail loads
- [ ] Product detail — main image + thumbnails load
- [ ] Header banner — "FREE Express Shipping On Orders 5.000.000 ₫+" (VND mode) or USD equivalent
- [ ] Product detail Description tab — shipping rates display in active currency
- [ ] Header + footer phone — `+84 28 7106 1234` (or whatever was set in SiteSetting)
- [ ] Login flow — Keycloak page renders in current site language
- [ ] `/order` — redirects to `/track-order` (301/308)
- [ ] Cart "Headphone with Mic" no longer at 110 ₫
- [ ] Coupons page — thresholds ≥ 500,000 ₫
- [ ] Homepage hero — no gap below the right promo cards
- [ ] Cart icon — middle-click opens `/cart` in new tab; plain click opens drawer
- [ ] Hero subtitle on EN locale — no Vietnamese text mixed in

---

## Out of Scope (Follow-up Work)

- **Banner per-locale content schema** — Banner.content currently lacks `title.{en,vi}` / `subtitle.{en,vi}`. Should be added so CMS editors can author both languages without leaking. File a separate spec.
- **SiteSetting currency-aware fields** — `shipping.freeShippingThreshold` is now documented as VND-base via a code comment, but the CRM admin form should add a hint "(stored in VND, converted to your currency on the storefront)" so admin users don't input the wrong scale.
- **CRM admin doesn't currently have a "Shipping rate per method" form** for the product-detail page rates — they're hardcoded constants in `details-tab-nav.jsx`. If shipping rates need to be admin-editable, move them onto `SiteSetting.shipping.methods[]` and read from settings.
