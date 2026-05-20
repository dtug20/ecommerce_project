# Sprint 2 — tychicus.id.vn Main-Flow Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the ~40 production bugs reported by the QA walk-through covering Flows A–J on tychicus.id.vn — search, filtering, sorting, product detail, cart, currency, compare, checkout/auth, branding, content, and hero carousel. Sprint 1 (Phases 1–7) already shipped image migration, basic currency unification, contact-info defaults, Keycloak locale wiring, `/order` redirect, and hero layout polish. This sprint continues from that baseline.

**Architecture:** No new infrastructure. Reuses existing patterns — migration scripts in `migration/` for prod data fixes, Cloudinary for image hosting, `useCurrency()` hook for price display, `useGetSettingsQuery()` for SiteSetting reads, `cmsApi.searchProducts` endpoint that already exists, RTK Query for state, Keycloak SSO. One new schema field: `Product.baseCurrency`. Each phase = one focused commit; data migrations land alongside the code that depends on them.

**Tech Stack:** Next.js 13 (Pages Router), Express.js, MongoDB/Mongoose, Cloudinary, Keycloak, i18next, Redux Toolkit + RTK Query, Bootstrap 5, SCSS.

**Workflow:** Commit directly to `main` (per feedback_workflow.md). One implementer subagent per phase → spec-review subagent → code-quality-review subagent → fix nits → commit + push. Data migrations run against prod MongoDB with backup snapshots in `backups/<timestamp>/`.

**Brand decision:** Canonical brand is **Shofy**. Replace remaining "Clicon" references (template residue) with "Shofy" in code + CMS data.

---

## File Structure

### Modified

**Phase 8 (Search / Filter / Sort):**
- `frontend/src/pages/search.jsx` — replace `useGetAllProductsQuery` + client-side `.includes()` filter with `useSearchProductsQuery` (already exists in `cmsApi.js:51-60`)
- `frontend/src/redux/features/cmsApi.js` — confirm `searchProducts` endpoint passes `q` correctly; tag invalidation
- `backend/controller/v1/store.controller.js:45-62` — tighten category filter; remove the `parent`-string branch from `$or` so unrelated products stop leaking through
- `backend/controller/v1/store.controller.js:148-171` — verify `searchProducts` handler (no edits expected)
- `backend/model/Products.js:193` — verify `$text` index includes `title`, `description`, `tags`
- `frontend/src/components/shop/shop-top-right.jsx` + `frontend/src/pages/shop.jsx:34-42` — reproduce A4; fix sort mapping if inversion confirmed

**Phase 9 (Product Detail):**
- `frontend/src/components/product-details/details-wrapper.jsx:182-186` — qty input: ensure `onChange` writes, remove any `pointer-events: none` / `readOnly`, add max-stock cap with toast
- `frontend/src/components/clicon/ui/quantity-selector.jsx:54-58` — same fix for cart qty input
- `frontend/public/assets/scss/components/_quantity-selector.scss` (or wherever the qty CSS lives) — drop `pointer-events: none` if present
- `frontend/src/components/product-details/details-thumb-wrapper.jsx:56-72` — already uses `SafeImage`; verify graceful fallback
- New: `migration/15-fix-product-brand-and-thumbs.js` — re-associate Vietnamese clothing products with correct brand (or null), and scrub residual `i.ibb.co` URLs in product thumbnail arrays missed by `migration/13`

**Phase 10 (Cart UX):**
- `frontend/src/redux/features/cartSlice.js:115-120` — add `window.confirm()` to `remove_product` reducer (mirror `clearCart` at line 129)
- `frontend/src/components/clicon/cart/clicon-cart-checkout.jsx` — add coupon code input + apply button wired to `validateCoupon` mutation; show discount line in summary
- `frontend/src/hooks/useCartInfo.js` — audit to confirm subtotal logic is shipping/coupon-free
- `frontend/src/components/clicon/cart/clicon-cart-area.jsx` — trace 387.000₫ ghost: likely Redux `couponInfo` from localStorage being added to subtotal display; fix root cause

**Phase 11 (Currency + Shipping):**
- `backend/model/Products.js` — add `baseCurrency: { type: String, enum: ['VND','USD'], default: 'VND' }`
- `frontend/src/hooks/use-currency.js:17-30` — accept optional `baseCurrency` arg; route USD inputs through identity when target is USD, multiply×rate when target is VND
- `frontend/src/components/clicon/cart/clicon-cart-checkout.jsx:45,53` — replace hardcoded `formatPrice(20)` / `formatPrice(25)` with values from `useGetSettingsQuery().data.shipping`
- `frontend/src/components/clicon/cart/clicon-cart-area.jsx:12` — replace `FREE_SHIPPING_THRESHOLD = 200` with `settingsData?.data?.shipping?.freeShippingThreshold ?? 5000000`
- New: `migration/16-normalize-product-prices.js` — scan prod products with `price < 10000`, log each, multiply by 25000 (USD→VND rate), set `baseCurrency: 'VND'` on all rows. Includes pre-run backup to `backups/<timestamp>/products-pre-normalize.json`

**Phase 12 (Compare):**
- `frontend/src/components/compare/compare-area.jsx:119` — replace `'Clicon'` fallback with `t('compare.unknownSeller', 'Unknown seller')`
- `frontend/src/components/compare/compare-area.jsx:182-189` — verify `item.img` populated from product payload; fix if missing
- `frontend/src/redux/features/compareSlice.js` — ensure full product (incl. `img`, `vendor`) gets persisted on `add_compare_product`
- `frontend/src/components/compare/compare-area.jsx` — render up to 4 product slots in the table when present; show "Add product" placeholder slots when fewer
- `frontend/src/locales/{en,vi}/common.json` — add `compare.unknownSeller`, `compare.addProductSlot`

**Phase 13 (Guest Checkout + Auth):**
- `backend/controller/v1/order.controller.js` — split `createOrder` into authed + guest branches; guest accepts `guestEmail`, no `userId`
- `backend/routes/v1/store.js` — new public route `POST /orders/guest` (rate-limited)
- `backend/validations/order.js` — Joi schema for guest order (require `guestEmail`, shipping, items, totals)
- `frontend/src/components/checkout/checkout-login.jsx` — add "Continue as guest" branch with email-only form; remember choice in session storage
- `frontend/src/hooks/use-checkout-submit.js` — branch to guest endpoint when no `userInfo` cookie; offer "Create account?" toast on success
- `frontend/src/pages/checkout.jsx:18` — pass `ui_locales: router.locale` to `keycloak.login()` (audit; already done per memory commit `1dcf7a3` but double-check after sprint-1 rebases)
- E2 follow-up: document required Keycloak realm setting `defaultLocale` change in `docs/deployment/keycloak.md` if frontend locale param is being ignored by Keycloak

**Phase 14 (Branding + Blog):**
- Search-replace `Clicon` → `Shofy` across `frontend/src/**` and `crm/crm-ui/src/**` (audit each hit; some may be component class names like `clicon-cart-area` that should stay)
- `crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx:198` — replace `info@shofy.com` placeholder with `support@tychicus.id.vn`
- New: `migration/17-fix-blog-and-branding.js` — replace blog post `featuredImage` URLs with category-appropriate Cloudinary images; update any CMS Page/Banner content containing "Clicon"; verify all SiteSetting `contact.*` fields are Shofy-branded

**Phase 15 (Hero Carousel + Announcement):**
- New: `migration/18-clean-hero-and-announcements.js` — delete "Black Friday 59% OFF" announcement (out of season); normalize active hero Banner content
- `backend/model/Banner.js` — extend schema with `title.en`, `title.vi`, `subtitle.en`, `subtitle.vi`, `cta.en`, `cta.vi` (additive; existing flat fields kept for backward-compat)
- `frontend/src/components/clicon/hero/clicon-hero-area.jsx:13-41` — resolve hero copy via `banner.title?.[locale] ?? banner.title` (handles both schemas); replace hardcoded `$299` in `FALLBACK_SLIDES` with `t('hero.startingAt', {amount: formatPrice(7500000)})`
- `frontend/src/components/clicon/hero/clicon-hero-area.jsx` — fix Fashion Forward empty-space slide: add image OR restructure flex layout
- `frontend/src/locales/{en,vi}/common.json` — add `hero.startingAt` key with `{{amount}}` interpolation

**Phase 16 (Prod Deploy):**
- Run migrations 15, 16, 17, 18 against prod with backups; verify on tychicus.id.vn

### New files

- `migration/15-fix-product-brand-and-thumbs.js`
- `migration/16-normalize-product-prices.js`
- `migration/17-fix-blog-and-branding.js`
- `migration/18-clean-hero-and-announcements.js`
- `docs/deployment/keycloak.md` (if Keycloak realm config change is needed for E2)

---

## Phase Sequence

Each phase = subagent implement → spec review → code review → commit + push. Data migrations land in the same phase as the code that depends on them, but are *executed* against prod only in Phase 16 after the full sprint passes review.

1. **Phase 8** — Search, Filter, Sort (Flow A1, A2, A3, A4)
2. **Phase 9** — Product Detail UX (Flow B1, B3, B4)
3. **Phase 10** — Cart Math + Coupon + Confirmation (Flow D1, D2, D3, D4)
4. **Phase 11** — Currency + Shipping Normalization (Flow D5, D6, D7, F1, F2)
5. **Phase 12** — Compare Page (Flow C2)
6. **Phase 13** — Guest Checkout + Auth (Flow E1, E2)
7. **Phase 14** — Branding + Blog Content (Flow H1, H2, H3, G1, G2)
8. **Phase 15** — Hero Carousel + Announcement (Flow I1, I2, I3, I4)
9. **Phase 16** — Production Data Migrations + Smoke Test

Some bugs are explicitly out of scope this sprint (documented for future):
- **B2** (USD shipping table on VND product) — already fixed in Sprint 1 commit `7440f80`
- **C1** (wishlist works) — no fix needed
- **E2 backend** (Keycloak realm `defaultLocale`) — if frontend locale wiring is confirmed correct, the real fix is a Keycloak admin console setting; will be documented, not implemented

---

# Phase 8 — Search, Filter, Sort (Flow A)

**Goal:** A real search query returns matching products; category radios return only products in the chosen category; "Price: Low to High" returns ascending prices.

**Bugs fixed:** A1 (search returns zero), A2 (shop search input no-op), A3 (category filter cross-contamination), A4 (sort direction inverted — if reproduced).

**Implementation:**
- `frontend/src/pages/search.jsx`: import `useSearchProductsQuery` from `cmsApi`. Pass `q.search` from URL query param. Render results from server response, drop client-side `.filter(...)`. Handle 0-result + loading + error states with i18n keys (`search.noResults`, `search.loading`, `search.error`).
- `backend/controller/v1/store.controller.js:45-62` (category filter): replace the `$or [{ category.id: matched._id }, { parent: matched.parent }]` clause with just `{ 'category.id': matched._id }`. The parent-string fallback is the source of cross-category leak. If frontend ever sends a parent-level slug (e.g. `electronics`), require it to match `Category.parent` exactly AND descend via the existing `children[]` IDs.
- `backend/controller/v1/store.controller.js:112-114` (search filter): verify `filter.$text = { $search: q.search }` is honored by adding a fallback regex search if `$text` returns 0 results (handles non-Atlas Mongo where text index may be missing).
- `backend/model/Products.js`: confirm `productSchema.index({ title: 'text', description: 'text', tags: 'text' })` is present and the index is built in Atlas.
- Sort: reproduce in browser before changing code. If broken, check `shop-top-right.jsx` `selectValue` state and `shop.jsx` query-string read. If `selectValue` is `'High to Low'` but URL has `sort=asc`, the bug is state desync — fix the controlled `<Select>` to read from URL.

**Migration:** none in this phase. Index creation, if missing, runs as a one-off MongoDB shell command captured in Phase 16.

**Acceptance criteria:**
- [ ] Search "headphone" returns the Headphones with Mic product
- [ ] Search "watch" returns Smart Watch Series 9 + Sony Smart Watch
- [ ] Clicking "Headphones" filter shows ONLY headphone-category products
- [ ] Sort "Price: Low to High" shows lowest price first

---

# Phase 9 — Product Detail UX (Flow B)

**Goal:** Qty input accepts typed numbers; thumbnails don't show broken-image placeholder; products show their real brand.

**Bugs fixed:** B1 (wrong brand), B3 (broken thumbnail), B4 (read-only qty input).

**Implementation:**
- **B4**: Inspect `details-wrapper.jsx:182-186` and `quantity-selector.jsx:54-58`. Ensure `<input type="number" value={qty} onChange={...}/>` has no `readOnly` attr. Find SCSS rule applying `pointer-events: none` (likely in `_quantity-selector.scss` or `_details.scss`) and remove. Add `min={1} max={stock}` and onBlur clamp toast.
- **B1**: Migration `15-fix-product-brand-and-thumbs.js` queries Mongo for products where `category.name` matches `/^(Ao Dai|Fashion|Clothing|Apparel)/i` AND `brand.name` matches `/^(Logitech|Apple|Samsung|Sony)/i`. Default strategy: **null the brand** on each mismatch (`brand: null`) so the product detail page hides the Brand row instead of showing wrong data. Admin can re-assign in CRM later. Output a CSV report `backups/<timestamp>/brand-mismatches.csv` listing every affected product before applying the writes.
- **B3**: Same migration also scans `imageURLs[*].img` for any remaining `i.ibb.co` URL (extension of `migration/13`) and replaces with Cloudinary placeholder.

**Acceptance criteria:**
- [ ] Typing "5" into product qty input updates the qty to 5
- [ ] Typing a value > stock (e.g. 9999) clamps to stock with a toast
- [ ] Ao Dai products no longer show "Brand: Logitech"
- [ ] No `i.ibb.co` URLs remain in product thumbnails

---

# Phase 10 — Cart UX (Flow D1-D4)

**Goal:** Subtotal math is correct, no ghost values; remove + clear cart prompt for confirmation; coupon can be applied directly on the cart page.

**Bugs fixed:** D1 (ghost 387.000₫ in subtotal), D2 (ghost amount after removal), D3 (no remove confirmation), D4 (no coupon input on cart).

**Implementation:**
- **D1/D2**: Reproduce by adding 2× Headphone (110₫) + 3× Ao Dai (1.161.000₫). Expected subtotal: 3.483.220₫. Observed: 3.870.220₫ (delta 387.000₫). Suspect: stale `couponInfo` from localStorage being treated as a positive surcharge, or `shippingCost` from a prior session leaking into subtotal. Trace `clicon-cart-area.jsx` subtotal render → if it pulls from a different selector than `useCartInfo`, unify. After fix, ensure removing items leaves no stale state.
- **D3**: Add `window.confirm(t('cart.confirmRemove', 'Remove this item from cart?'))` inside `remove_product` reducer (cartSlice.js:115). Mirror the existing `clearCart` confirmation at line 129.
- **D4**: Insert coupon input row inside `clicon-cart-checkout.jsx` between the shipping section and the total. Wire to existing `validateCoupon` RTK Query mutation from `couponApi`. Show applied coupon as a line item with discount and an "X" to remove. Persist `couponInfo` to `couponSlice` (which already exists).

**Acceptance criteria:**
- [ ] 2×110 + 3×1161000 = 3.483.220₫ subtotal exactly
- [ ] Removing items immediately updates subtotal with no residual amount
- [ ] Clicking X on cart row prompts "Remove this item?"
- [ ] Entering FIF50 in cart coupon input shows a 50% discount line and updated total

---

# Phase 11 — Currency + Shipping Normalization (Flow D5-D7, F1-F2)

**Goal:** All product prices respect their declared base currency; shipping costs and free-shipping threshold come from `SiteSetting`; switching currency updates every monetary value on every page consistently.

**Bugs fixed:** D5 (USD prices stored as VND), D6 (hardcoded 20₫/25₫ shipping), D7 (hardcoded 200₫ threshold), F1 (uneven currency conversion), F2 (shipping + banner ignore currency switch).

**Implementation:**
- **F1 schema**: Add `baseCurrency: { type: String, enum: ['VND','USD'], default: 'VND' }` to `backend/model/Products.js`. Backfill default on existing docs in migration `16`.
- **F1 hook**: Update `useCurrency.formatPrice(amount, baseCurrency = 'VND')`. Logic: normalize to VND base first (if `baseCurrency === 'USD'`, multiply by rate to get VND), then format in target currency.
- **F1 callsites**: Audit every `formatPrice(price)` call across `product-item-*.jsx`, `details-wrapper.jsx`, `cart-checkout.jsx`, `checkout.jsx`, `order-detail`, etc. Pass `product.baseCurrency` where available.
- **D5 migration** (`16-normalize-product-prices.js`): Pre-flight: backup all `products` to `backups/<timestamp>/products-pre-normalize.json`. For each product with `price < 10000`, log `{title, currentPrice, suggestedPrice: currentPrice*25000}`. After human-confirm via stdout `y`, write the new prices and set `baseCurrency: 'VND'`. For all other products, just set `baseCurrency: 'VND'` (idempotent).
- **D6**: `clicon-cart-checkout.jsx` lines 45/53 — replace hardcoded `formatPrice(20)` / `formatPrice(25)` with `formatPrice(settings?.shipping?.defaultShippingCost ?? 30000)` / `formatPrice(settings?.shipping?.localPickupCost ?? 0)`. Add `localPickupCost` field to SiteSetting if missing.
- **D7**: `clicon-cart-area.jsx:12` — replace `const FREE_SHIPPING_THRESHOLD = 200` with `const threshold = settings?.shipping?.freeShippingThreshold ?? 5000000`. Recompute `remaining` on every render.
- **F2**: Verify the welcome bar (`clicon-welcome-bar.jsx:29`) and header (`header.jsx:32`) both route through `formatPrice` — already done per Sprint 1 commits `7440f80` and `8010832`, just confirm.

**Migration:**
- `16-normalize-product-prices.js`: backup → identify → confirm → write. Idempotent on re-run.
- The Atlas vector index for chatbot (Phase 6) is not affected.

**Acceptance criteria:**
- [ ] Headphone with Mic shows 2.750.000₫ (110×25000) in VND mode
- [ ] Switching to USD shows $110 for the same product
- [ ] Switching currency updates shipping cost (e.g. 30.000₫ → $1.20)
- [ ] Free-shipping banner threshold matches `SiteSetting.shipping.freeShippingThreshold`
- [ ] No product has `price < 10000` after migration

---

# Phase 12 — Compare Page (Flow C2)

**Goal:** Compare page shows product image + correct seller; supports up to 4 product slots.

**Bugs fixed:** C2 (missing image, "Clicon" ghost seller, single-slot only).

**Implementation:**
- **Seller fallback**: `compare-area.jsx:119` — replace `'Clicon'` with `t('compare.unknownSeller', 'Unknown seller')`.
- **Image**: Inspect `compareSlice.js` `add_compare_product` reducer. Ensure it persists `img` and `vendor` fields. If the slice strips them, fix to keep full product payload.
- **Multi-slot**: Update `compare-area.jsx` table to render `compareItems.map(...)` columns up to 4. Empty slots render an "Add product" CTA linking to `/shop`.
- i18n: `compare.unknownSeller`, `compare.addProductSlot` keys in en/vi.

**Acceptance criteria:**
- [ ] Compare page shows product image (not grey box)
- [ ] Seller name matches product detail page
- [ ] Can add up to 4 products and compare side-by-side

---

# Phase 13 — Guest Checkout + Auth (Flow E1, E2)

**Goal:** Buyer can complete an order without creating a Keycloak account; Keycloak login page respects site language.

**Bugs fixed:** E1 (no guest checkout), E2 (login defaults to Vietnamese).

**Implementation:**
- **Backend**:
  - `backend/routes/v1/store.js`: new public route `POST /orders/guest` (rate-limited)
  - `backend/validations/order.js`: new `guestOrderSchema` requiring `guestEmail` (Joi email), `shippingAddress`, `items[]`, `totals`, `paymentMethod` (COD or bank-transfer only — card payments stay behind auth)
  - `backend/controller/v1/order.controller.js`: extract shared order-creation logic into `_createOrder(userId | guestEmail, payload)`. Guest orders set `user: null`, `guestEmail: email`, `invoiceNumber` from same sequence.
  - `backend/model/Order.js`: add optional `guestEmail` field; relax `user: { required: true }` if guestEmail present
  - Order confirmation email sent to `guestEmail` via existing `emailService.sendTemplatedEmail('order-confirmation', email, ...)`.
- **Frontend**:
  - `checkout-login.jsx`: add "Continue as guest" toggle revealing an email-only field; pass via checkout flow
  - `use-checkout-submit.js`: if no `userInfo` cookie + guest flag set, call `POST /orders/guest`; otherwise existing authed flow
  - On guest order success: toast "Create account with this email to track your order? [Create] [No thanks]"
- **E2**: Verify `pages/checkout.jsx:18` already passes `ui_locales: router.locale` (per Sprint 1 commit `1dcf7a3`). If verified correct, write `docs/deployment/keycloak.md` documenting that Keycloak realm setting `internationalizationEnabled: true` and `supportedLocales: ['en','vi']` must be configured in the Keycloak admin console — the frontend param is honored only when the realm allows it.

**Migration:** none. Order model field is backward-compatible.

**Acceptance criteria:**
- [ ] User can click "Proceed to Checkout" without logging in, choose "Continue as guest", enter email + shipping, place a COD order
- [ ] Order confirmation email arrives at guest email
- [ ] Card / online payment methods remain locked behind login
- [ ] Keycloak login page opens in English when site is English (or documented as Keycloak realm config requirement)

---

# Phase 14 — Branding + Blog Content (Flow H, G)

**Goal:** Zero references to "Clicon" template branding; blog posts have hero images that match their content.

**Bugs fixed:** H1 (phone numbers — verify Sprint 1 fix held), H2 (Shofy vs Clicon mismatch), H3 (US phone + VN timezone — resolved by H1), G1 (blog hero mismatched), G2 (future blog dates).

**Implementation:**
- **H1 audit**: `grep -rE '\+1-?202-?555|\(629\)' frontend/src/ crm/crm-ui/src/` should return 0 hits. Verify against memory commit `a6397c2`. Move `+84 28 7106 1234` to `frontend/src/constants/contact.js` as a single source of truth (follow-up from previous sprint).
- **H2 audit**:
  - `grep -rE '\bClicon\b' frontend/src/ crm/crm-ui/src/` — review each hit; replace user-facing text with "Shofy"; leave component CSS class names like `clicon-cart-area` alone (refactoring class names is out of scope).
  - `compare-area.jsx:119`: already covered by Phase 12.
  - `crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx:198`: replace `info@shofy.com` placeholder with `support@tychicus.id.vn`.
- **G1 migration** (`17-fix-blog-and-branding.js`): for each blog post, check if `featuredImage` matches `category` (e.g. "Home Decor" post should have a home-decor image, not iPhone). Maintain a category→image map of curated Cloudinary URLs. Backup before write.
- **G2**: re-date any blog post with `publishedAt > today` to `today - 30 days`. Or document that future dates are intentional staging content.

**Migration:** `17-fix-blog-and-branding.js` — backup BlogPost + SiteSetting collections, apply changes.

**Acceptance criteria:**
- [ ] grep for "Clicon" in user-facing strings: 0 hits
- [ ] grep for "+1-202-555" or "(629) 555": 0 hits
- [ ] Blog "How to Style Your Home on a Budget" shows a home-decor image
- [ ] No blog post date is in the future

---

# Phase 15 — Hero Carousel + Announcement (Flow I)

**Goal:** Hero carousel matches site language + currency; no contradictory promo messages; Fashion Forward slide isn't 70% empty.

**Bugs fixed:** I1 (Black Friday vs Spring Sale contradiction), I2 (mixed EN/VI in same slide), I3 (hardcoded $299 in VND mode), I4 (empty space on hero slide).

**Implementation:**
- **I1 migration** (`18-clean-hero-and-announcements.js`): Delete `Announcement` doc where `key === 'black-friday-banner'` OR `validUntil < today`. Keep one default announcement (e.g. Spring Sale message).
- **I2 schema**:
  - `backend/model/Banner.js`: extend with `title: { en: String, vi: String }`, `subtitle: { en: String, vi: String }`, `cta: { label: { en, vi }, link }`. Keep flat `title`/`subtitle` as fallback for backward-compat — Mongoose mixed schema.
  - Migration `18` rewrites existing flat banners into the new shape: if `title` is detected English, populate `title.en`; same for VI.
- **I2 frontend**: `clicon-hero-area.jsx:91-95` — resolve copy with `banner.title?.[locale] ?? banner.title` (works for both schemas).
- **I3**: `FALLBACK_SLIDES` in `clicon-hero-area.jsx:13-41` — replace hardcoded `$299` with `t('hero.startingAt', { amount: formatPrice(7500000) })`. Add i18n key in en/vi.
- **I4**: For Fashion Forward slide layout — either populate `image` from Cloudinary or rebalance flex layout to drop empty whitespace. Inspect SCSS `_clicon-hero.scss`.

**Migration:** `18-clean-hero-and-announcements.js`.

**Acceptance criteria:**
- [ ] No "Black Friday 59% OFF" announcement visible in May
- [ ] Hero slide in EN mode shows only English copy; switching to VI shows only Vietnamese
- [ ] Hero copy shows price in selected currency (VND or USD)
- [ ] No hero slide has > 30% empty whitespace

---

# Phase 16 — Production Data Migration + Smoke Test

**Goal:** All migration scripts have executed against prod MongoDB with backups; tychicus.id.vn smoke-tested across all flows.

**Steps:**
- [ ] Snapshot `products`, `blogposts`, `banners`, `announcements`, `sitesettings` to `backups/<timestamp>/`
- [ ] Run `node migration/15-fix-product-brand-and-thumbs.js`
- [ ] Run `node migration/16-normalize-product-prices.js` — review proposed changes before confirming
- [ ] Run `node migration/17-fix-blog-and-branding.js`
- [ ] Run `node migration/18-clean-hero-and-announcements.js`
- [ ] Verify `$text` index on `products` collection (`db.products.getIndexes()`)
- [ ] Walk through Flows A–J on tychicus.id.vn, confirm all acceptance criteria pass
- [ ] Document any leftover issues for follow-up

---

## Out of Scope (Document & Defer)

- **Multi-slot compare** as a true side-by-side scrollable table (Phase 12 ships basic multi-slot, but a Wirecutter-style detailed spec comparison is a separate feature)
- **Real exchange-rate API** for currency conversion (currently a hardcoded `~25000`; future work: fetch from `currency.shopify.com` or similar)
- **Keycloak realm config** changes (E2 may need an admin-console change; documented in `docs/deployment/keycloak.md` if so)
- **G2 future-dated blog posts** if confirmed intentional staging content

---

## Risk Notes

- **`migration/16-normalize-product-prices.js`** is the riskiest data change: multiplying live prod prices by 25000. Must (a) backup, (b) print a per-product diff, (c) require explicit `y` confirmation, (d) be idempotent (won't double-multiply if rerun).
- **Banner schema migration** in Phase 15 — additive only; existing flat fields preserved. Old banners keep working until they're updated.
- **Guest checkout** changes `Order.user` from required → optional. Verify all downstream consumers (CRM order list, analytics, email service) handle `user: null` gracefully.
