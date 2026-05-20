# Sprint 2 — Main-Flow Bug Fix Executable Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the ~40 production bugs reported across Flows A–J on tychicus.id.vn — search, filtering, sorting, product detail, cart math, currency, compare, guest checkout, branding, blog content, and hero carousel.

**Architecture:** No new infrastructure. Adds one schema field (`Product.baseCurrency`), one optional schema field (`Order.guestEmail`), and one additive schema extension (Banner per-locale title/subtitle). Reuses `useCurrency()` hook, `cmsApi.searchProducts` (already exists), `useGetSettingsQuery()`, existing migration script pattern. Each phase = one focused commit; each prod data change is a migration script that runs in Phase 16.

**Tech Stack:** Next.js 13 Pages Router, Express.js, MongoDB/Mongoose, Cloudinary, Keycloak, i18next, Redux Toolkit + RTK Query, Bootstrap 5, SCSS, Joi.

**Workflow:** Commit directly to `main` after each phase passes spec + code review. Data migrations are written in their phase but executed against prod only in Phase 16.

**Spec:** [docs/superpowers/plans/2026-05-21-sprint-2-bug-fixes.md](2026-05-21-sprint-2-bug-fixes.md)

---

# Phase 8 — Search, Filter, Sort (Flow A)

**Bugs fixed:** A1 (search returns zero), A2 (shop search input no-op), A3 (category filter cross-contamination), A4 (sort direction inverted — if reproducible).

### Task 8.1: Reproduce all four Flow A bugs

- [ ] **Step 1: Start the dev environment**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- [ ] **Step 2: Reproduce A1 (search returns zero)**

Go to homepage → use header search → type `headphone` → submit. Confirm: "Sorry, nothing matched". Verify in Network tab the request URL — it should be hitting `/api/v1/store/products` (no search param) rather than `/api/v1/store/products/search`.

- [ ] **Step 3: Reproduce A2 (shop search no-op)**

Go to `/shop` → use the shop-page search input → type `wireless` → confirm visible products do NOT change.

- [ ] **Step 4: Reproduce A3 (category cross-contamination)**

Go to `/shop` → click "Headphones" category radio in sidebar. Confirm unrelated products appear (e.g. tea sets, bedding).

- [ ] **Step 5: Reproduce A4 (sort inverted)**

Go to `/shop` → change sort to "Price: Low to High". Confirm products appear in descending price order. **If sort behaves correctly, mark A4 as not-reproducible and remove from this phase scope.**

- [ ] **Step 6: Record reproduction notes**

Write `docs/superpowers/notes/2026-05-21-phase8-repro.md` capturing: URL hit, params sent, observed response shape, expected. Commit:

```bash
git add docs/superpowers/notes/2026-05-21-phase8-repro.md
git commit -m "docs: record Phase 8 bug reproduction baseline"
```

### Task 8.2: Fix A1 — switch search page to backend search endpoint

**Files:**
- Modify: `frontend/src/pages/search.jsx`
- Modify (if needed): `frontend/src/redux/features/cmsApi.js:51-60`

- [ ] **Step 1: Verify `searchProducts` RTK Query endpoint exists**

```bash
grep -n "searchProducts" frontend/src/redux/features/cmsApi.js
```

Expected: a `searchProducts` builder.query entry hitting `/store/products/search?q=...`. If missing, add it:

```js
searchProducts: builder.query({
  query: (q) => `/store/products/search?q=${encodeURIComponent(q)}`,
  providesTags: ['Products'],
}),
```

and export `useSearchProductsQuery` from the slice.

- [ ] **Step 2: Replace client-side filter in `search.jsx`**

Open `frontend/src/pages/search.jsx`. Replace the `useGetAllProductsQuery()` + client `.filter(...)` block with:

```jsx
import { useSearchProductsQuery } from '@/redux/features/cmsApi';
// ...
const router = useRouter();
const query = router.query.q || '';
const { data, isLoading, isError } = useSearchProductsQuery(query, { skip: !query });
const products = data?.data?.products ?? [];
```

Drop the `.filter(p => p.title.toLowerCase().includes(...))` block and any `useMemo` that wrapped it.

- [ ] **Step 3: Add empty-state copy**

```jsx
{!isLoading && products.length === 0 && query && (
  <p>{t('search.noResults', { query })}</p>
)}
```

Add the i18n key in `frontend/src/locales/en/common.json` and `vi/common.json`:

```json
"search": { "noResults": "No results for \"{{query}}\"" }
```

Vietnamese: `"Không có kết quả cho \"{{query}}\""`.

- [ ] **Step 4: Verify in browser**

Restart `npm run dev`, search "headphone", "watch", "iphone". Each must return matching products.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/search.jsx frontend/src/redux/features/cmsApi.js frontend/src/locales/
git commit -m "$(cat <<'EOF'
fix(search): use backend search endpoint instead of client-side title filter

Search page now hits /api/v1/store/products/search which uses the
\$text index on title/description/tags. Previously the page fetched
all products and filtered client-side by title substring, which
missed common queries like "headphone" (matches "Headphones") and
exact product names.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Task 8.3: Fix A2 — verify $text index + add regex fallback

**Files:**
- Modify: `backend/controller/v1/store.controller.js:112-114`

- [ ] **Step 1: Check whether $text index exists on prod**

```bash
cd /Users/mac/Downloads/ecommerce_website-main/backend
node -e "
const m=require('mongoose');
require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const idx = await m.connection.db.collection('products').indexes();
  console.log(idx.filter(i => i.weights).map(i => i.name));
  await m.disconnect();
})();
"
```

Expected: at least one entry with weights on `title`, `description`, `tags`. If empty, the index is missing — Phase 16 will create it.

- [ ] **Step 2: Add regex fallback in `searchProducts` handler**

In `backend/controller/v1/store.controller.js:148-171` (`searchProducts`), wrap the `$text` query in a try/fallback:

```js
let products = [];
try {
  products = await Product.find({ ...baseFilter, $text: { $search: q.q } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
} catch (e) {
  // Fallback: case-insensitive regex on title (slower but works without index)
  const safe = q.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  products = await Product.find({ ...baseFilter, title: { $regex: safe, $options: 'i' } }).limit(limit);
}
```

- [ ] **Step 3: Verify shop-page search now filters**

Restart backend (`cd backend && npm run dev`). In browser, go to `/shop`, type `wireless` in the shop search input, confirm products filter to only wireless-related items.

- [ ] **Step 4: Commit**

```bash
git add backend/controller/v1/store.controller.js
git commit -m "fix(search): add regex fallback when \$text index is unavailable

Some environments (non-Atlas, missing index) return empty results
even when products match. Fall back to case-insensitive regex on
title so search degrades gracefully."
```

### Task 8.4: Fix A3 — tighten category filter

**Files:**
- Modify: `backend/controller/v1/store.controller.js:45-62`

- [ ] **Step 1: Read current category-filter block**

```bash
sed -n '40,70p' backend/controller/v1/store.controller.js
```

Locate the `$or` clause mixing `'category.id'` with `parent: matched.parent`.

- [ ] **Step 2: Replace the $or with strict ObjectId match**

Find this block:

```js
if (matched) {
  filter.$or = [
    { 'category.id': matched._id },
    { parent: matched.parent },
  ];
}
```

Replace with:

```js
if (matched) {
  filter['category.id'] = matched._id;
}
```

Also remove the `filter.parent = { $regex: q.category, $options: 'i' }` fallback further down — drop the regex branch entirely. If `matched` is null, return empty (no products) rather than scanning all.

- [ ] **Step 3: Verify in browser**

Restart backend. In browser, go to `/shop`, click "Headphones" radio. Confirm ONLY headphone products appear. Then click "Bedding" or similar — confirm only that category.

- [ ] **Step 4: Commit**

```bash
git add backend/controller/v1/store.controller.js
git commit -m "fix(filter): match category strictly by ObjectId, drop parent-string fallback

The previous \$or clause matched products by either category.id
OR by parent-name string, which leaked unrelated products into
every category (e.g. Headphones filter returned bedding, tea sets).
Now we match strictly by category._id."
```

### Task 8.5: Fix A4 — sort direction (if reproduced)

**Files:**
- Modify (conditional): `frontend/src/components/shop/shop-top-right.jsx`
- Modify (conditional): `frontend/src/pages/shop.jsx:34-42`

- [ ] **Step 1: Trace the sort path**

Add `console.log` in `shop.jsx` line ~38 and in `shop-top-right.jsx` `onChange` to confirm the actual `sort` value being sent. Reproduce in browser, capture the network request URL.

- [ ] **Step 2: Identify the mismatch**

Three common causes:
- (a) `selectValue` state not synced with URL query → reset to `'High to Low'` after navigation. Fix: read initial value from `router.query.sort`.
- (b) Mapping inverted in `shop.jsx`: `query.sort === 'Low to High' ? 'desc' : 'asc'` — should be `'asc' : 'desc'`. Fix the conditional.
- (c) Backend `pagination.js` flips it back. Verify `utils/pagination.js:28-29` reads `query.sortOrder` and matches `'asc' → 1`.

Apply whichever fix matches the trace.

- [ ] **Step 3: Verify in browser**

Reload `/shop?sort=Low to High`. Confirm prices appear in ascending order (cheapest first).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "fix(shop): sort by price ascending when 'Low to High' selected

[describe actual root cause found in step 1]"
```

If A4 turned out to not be reproducible, skip this task and commit an explicit note in `docs/superpowers/notes/`.

### Task 8.6: Phase 8 cross-cutting verification

- [ ] **Step 1: Manual flow A test**

Walk through the full search + filter + sort flow in the browser:
1. Search "headphone" → returns Headphones with Mic
2. Search "watch" → returns Smart Watch + Sony Smart Watch
3. Click Headphones filter → only headphones
4. Sort by Low to High → ascending prices

All four must pass.

- [ ] **Step 2: Push Phase 8**

```bash
git push origin main
```

---

# Phase 9 — Product Detail UX (Flow B)

**Bugs fixed:** B1 (wrong brand), B3 (broken thumbnail), B4 (read-only qty input).

### Task 9.1: Fix B4 — qty input accepts typed numbers

**Files:**
- Modify: `frontend/src/components/product-details/details-wrapper.jsx:182-186`
- Modify: `frontend/src/components/clicon/ui/quantity-selector.jsx:54-58`
- Modify (if found): `frontend/public/assets/scss/components/_quantity-selector.scss` or wherever qty CSS lives

- [ ] **Step 1: Inspect current qty input**

```bash
grep -n "type=\"number\"" frontend/src/components/product-details/details-wrapper.jsx frontend/src/components/clicon/ui/quantity-selector.jsx
```

Confirm both have `type="number"`, an `onChange` handler, and lack a `readOnly` attr.

- [ ] **Step 2: Search SCSS for pointer-events**

```bash
grep -rn "pointer-events.*none" frontend/public/assets/scss/ | grep -iE "quantity|qty|input"
```

Remove any `pointer-events: none` rule applied to the qty input. If the rule is general (e.g. on `.input-group input`), scope it tighter.

- [ ] **Step 3: Add stock cap clamp**

In each onChange handler, clamp to `[1, stock]`:

```jsx
const handleQtyChange = (e) => {
  const raw = parseInt(e.target.value, 10) || 1;
  const next = Math.max(1, Math.min(stock || 999, raw));
  if (next !== raw && raw > stock) {
    toast.warn(t('product.maxStock', { stock }));
  }
  setOrderQuantity(next);
};
```

Add the i18n key:

```json
"product": { "maxStock": "Only {{stock}} in stock" }
```

- [ ] **Step 4: Browser verification**

Open any product detail. Type `5` in qty → updates to 5. Type `9999` → clamps to stock with toast.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/product-details/details-wrapper.jsx \
       frontend/src/components/clicon/ui/quantity-selector.jsx \
       frontend/public/assets/scss/ \
       frontend/src/locales/
git commit -m "fix(product): qty input accepts typed numbers, clamps to stock

Removed pointer-events:none that blocked typed input. Added clamp
to [1, stock] with a toast when user tries to exceed stock."
```

### Task 9.2: Write `migration/15-fix-product-brand-and-thumbs.js`

**Files:**
- Create: `migration/15-fix-product-brand-and-thumbs.js`

- [ ] **Step 1: Scaffold script with backup**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
cp migration/14-fix-tychicus-content.js migration/15-fix-product-brand-and-thumbs.js
```

Edit the file to:
1. Connect to MongoDB via `process.env.MONGO_URI`
2. Dump all products to `backups/<ts>/products-pre-15.json` first
3. Query: `Product.find({ /* clothing categories */ })`
4. For each: if brand name is in the electronics block-list (Logitech, Apple, Samsung, Sony, Microsoft, Razer, Asus), set `brand: null`. Write a row to a CSV at `backups/<ts>/brand-mismatches.csv` with `_id, title, oldBrand`.
5. For each: scan `imageURLs[*].img` and `img` for `i.ibb.co` references; replace with the Cloudinary placeholder URL used by `migration/13`.
6. Print summary at the end.

Include a `DRY_RUN=1` mode that skips all writes but still prints the report.

- [ ] **Step 2: Run dry-run against prod**

```bash
cd backend
DRY_RUN=1 node ../migration/15-fix-product-brand-and-thumbs.js 2>&1 | tee /tmp/m15-dry.log
tail -40 /tmp/m15-dry.log
```

Verify the count of brand mismatches looks reasonable (single digits, not all products). Open `backups/<ts>/brand-mismatches.csv` and spot-check.

- [ ] **Step 3: Commit script (do NOT run live yet)**

```bash
git add migration/15-fix-product-brand-and-thumbs.js
git commit -m "feat(migration): add 15-fix-product-brand-and-thumbs

Re-associates clothing products misassigned to electronics brands
(sets brand to null so the product page hides the row). Also scrubs
residual i.ibb.co URLs missed by migration/13. Runs in DRY_RUN mode
by default; live run happens in Phase 16."
```

### Task 9.3: Verify SafeImage fallback handles bad thumbnails

**Files:**
- Verify only: `frontend/src/components/common/safe-image.jsx`
- Verify only: `frontend/src/components/product-details/details-thumb-wrapper.jsx:56-72`

- [ ] **Step 1: Inspect SafeImage onError handler**

```bash
sed -n '1,40p' frontend/src/components/common/safe-image.jsx
```

Confirm there's an `onError` swap to a placeholder SVG or Cloudinary placeholder URL.

- [ ] **Step 2: Force-broken thumbnail in dev tools**

Open a product detail page. In DevTools, edit the first thumbnail `<img src>` to a known-404 URL. Confirm the placeholder shows immediately.

If SafeImage already does this, no code change. If it shows the broken-image icon, fix the `onError` swap.

- [ ] **Step 3: Commit only if changed**

If no change, skip. Otherwise:

```bash
git add frontend/src/components/common/safe-image.jsx
git commit -m "fix(image): SafeImage onError swaps to placeholder"
```

### Task 9.4: Phase 9 verification + push

- [ ] **Step 1: Manual flow B test**

1. Open any product → type `5` in qty → updates
2. Type `9999` → clamps with toast
3. Open Ao Dai product → Brand row should be hidden (after Phase 16 migration runs)

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

# Phase 10 — Cart UX (Flow D1-D4)

**Bugs fixed:** D1/D2 (ghost subtotal), D3 (no remove confirmation), D4 (no coupon input on cart).

### Task 10.1: Reproduce D1/D2 and trace the ghost amount

- [ ] **Step 1: Reproduce ghost subtotal**

Open browser → clear localStorage (`localStorage.clear()` in console). Add 2× Headphone (110₫) + 3× Ao Dai (1.161.000₫). Open `/cart`. Confirm subtotal shows 3.870.220₫ (off by 387.000₫ from expected 3.483.220₫).

- [ ] **Step 2: Inspect localStorage state**

```js
JSON.parse(localStorage.getItem('couponInfo'))
JSON.parse(localStorage.getItem('shipping_info'))
JSON.parse(localStorage.getItem('cart_products'))
```

Capture each. Likely culprit: `couponInfo` from a prior session with a stale `discountAmount` or `appliedCoupon`.

- [ ] **Step 3: Find where subtotal is rendered**

```bash
grep -rn "subtotal\|sub_total\|subTotal" frontend/src/components/clicon/cart/ frontend/src/pages/cart.jsx
```

Identify the exact JSX rendering "Subtotal". Trace its data source — it should be `useCartInfo().total`, not anything else.

- [ ] **Step 4: Document the root cause**

In `docs/superpowers/notes/2026-05-21-phase10-cart-ghost.md`, write 3 lines: what the source is, what extra value was being added, why.

### Task 10.2: Fix D1/D2 — subtotal must equal sum of line items only

**Files:**
- Modify: whichever component identified in 10.1 step 3

- [ ] **Step 1: Update the rendering to use useCartInfo only**

Replace any reference to coupon discount, shipping, or stale state in the subtotal calc with `useCartInfo().total`. Coupon discount should be shown as a separate line, not folded into subtotal.

- [ ] **Step 2: Clear localStorage on logout to prevent stale state**

In `frontend/src/redux/features/auth/authSlice.js` `userLoggedOut` reducer, add:

```js
localStorage.removeItem('couponInfo');
localStorage.removeItem('shipping_info');
```

- [ ] **Step 3: Verify**

Reproduce step 1 above. Expected: subtotal = 3.483.220₫ exactly.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/clicon/cart/ frontend/src/redux/features/auth/authSlice.js
git commit -m "fix(cart): subtotal renders sum of line items only, not stale coupon state

The cart subtotal was adding a stale couponInfo.discountAmount from
localStorage instead of treating coupons as a separate line. Also
clears couponInfo/shipping_info on logout to prevent cross-session
state leaking back in."
```

### Task 10.3: Fix D3 — confirmation prompt on remove

**Files:**
- Modify: `frontend/src/redux/features/cartSlice.js:115-120`

- [ ] **Step 1: Add window.confirm to remove_product reducer**

Locate the `remove_product` reducer (around line 115). Wrap the mutation in:

```js
remove_product: (state, { payload }) => {
  if (typeof window !== 'undefined' &&
      !window.confirm(payload.title
        ? `Remove "${payload.title}" from cart?`
        : 'Remove this item from cart?')) {
    return;
  }
  state.cart_products = state.cart_products.filter(item =>
    item._id !== payload.id || item.selectedVariant !== payload.selectedVariant);
  localStorage.setItem('cart_products', JSON.stringify(state.cart_products));
}
```

Note: title comes from the action payload, so update the dispatcher to include it.

- [ ] **Step 2: Find dispatchers and pass title**

```bash
grep -rn "remove_product(" frontend/src/components/
```

For each, change `dispatch(remove_product({ id: product._id }))` to `dispatch(remove_product({ id: product._id, title: product.title }))`.

- [ ] **Step 3: i18n the prompt**

Add to en/vi common.json:

```json
"cart": { "confirmRemove": "Remove \"{{title}}\" from cart?" }
```

Use `t('cart.confirmRemove', { title })` in the reducer — but reducers can't use hooks, so move the confirm OUT of the reducer and into the component dispatcher. Pattern:

```jsx
// In component:
const handleRemove = () => {
  if (!window.confirm(t('cart.confirmRemove', { title: product.title }))) return;
  dispatch(remove_product({ id: product._id }));
};
```

Revert the reducer change from step 1. The confirm lives in component layer.

- [ ] **Step 4: Verify in browser**

Click X on a cart row. Confirm prompt appears with product title. Cancel → item stays. Confirm → item leaves.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/clicon/ frontend/src/redux/features/cartSlice.js frontend/src/locales/
git commit -m "fix(cart): confirm before removing an item

Adds window.confirm prompt at the component dispatcher layer so
the user can cancel an accidental X click. Matches the existing
Clear Cart confirmation pattern."
```

### Task 10.4: Fix D4 — coupon input on cart page

**Files:**
- Modify: `frontend/src/components/clicon/cart/clicon-cart-checkout.jsx`
- Use: existing `validateCoupon` mutation in `frontend/src/redux/features/coupon/couponApi.js`
- Use: existing `couponSlice`

- [ ] **Step 1: Add coupon input UI**

In `clicon-cart-checkout.jsx`, between the shipping section and the total, add:

```jsx
<div className="cl-cart-coupon">
  <input
    type="text"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value)}
    placeholder={t('cart.couponPlaceholder')}
  />
  <button onClick={handleApplyCoupon} disabled={!couponCode || isApplying}>
    {isApplying ? t('common.applying') : t('cart.applyCoupon')}
  </button>
</div>
{appliedCoupon && (
  <div className="cl-cart-coupon-applied">
    {appliedCoupon.code} — −{formatPrice(appliedCoupon.discountAmount)}
    <button onClick={handleRemoveCoupon}><X /></button>
  </div>
)}
```

- [ ] **Step 2: Wire to validateCoupon mutation**

```jsx
import { useValidateCouponMutation } from '@/redux/features/coupon/couponApi';
import { setCoupon, clearCoupon } from '@/redux/features/coupon/couponSlice';

const [validateCoupon, { isLoading: isApplying }] = useValidateCouponMutation();
const appliedCoupon = useSelector(s => s.coupon.couponInfo);

const handleApplyCoupon = async () => {
  try {
    const res = await validateCoupon({ code: couponCode, cartTotal: total }).unwrap();
    dispatch(setCoupon(res.data));
    toast.success(t('cart.couponApplied'));
  } catch (e) {
    toast.error(e?.data?.message || t('cart.couponInvalid'));
  }
};

const handleRemoveCoupon = () => dispatch(clearCoupon());
```

- [ ] **Step 3: Add i18n keys**

```json
"cart": {
  "couponPlaceholder": "Enter coupon code",
  "applyCoupon": "Apply",
  "couponApplied": "Coupon applied",
  "couponInvalid": "Invalid coupon"
}
```

VI equivalents.

- [ ] **Step 4: Update total display**

Show `total - appliedCoupon.discountAmount` as the final total when a coupon is applied; show discount as its own line.

- [ ] **Step 5: SCSS**

Add `.cl-cart-coupon` styling to `frontend/src/styles/clicon-cart.scss` (or wherever cart styles live).

- [ ] **Step 6: Verify in browser**

Add items. Type `FIF50` in coupon input → see 50% discount line, total reduces. Type `INVALID` → toast error. Click X next to applied coupon → coupon removes.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/clicon/cart/ frontend/src/redux/features/coupon/ frontend/src/locales/ frontend/src/styles/
git commit -m "feat(cart): coupon code input on cart page

Buyers can now apply coupons before reaching checkout. Reuses the
existing validateCoupon RTK Query mutation and couponSlice. Shows
the applied discount as its own line and lets the user remove it."
```

### Task 10.5: Phase 10 verification + push

- [ ] **Step 1: Manual flow D test**

1. 2× Headphone + 3× Ao Dai → subtotal = 3.483.220₫ exact
2. Remove Headphone line → subtotal = 3.483.000₫ exact (no ghost)
3. Click X → confirm prompt → cancel keeps item
4. Apply FIF50 → see discount line + new total
5. Remove coupon → discount disappears

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

# Phase 11 — Currency + Shipping Normalization (Flow D5-D7, F1-F2)

**Bugs fixed:** D5 (USD-as-VND prices), D6 (hardcoded shipping costs), D7 (hardcoded threshold), F1 (uneven conversion), F2 (shipping/banner ignore currency switch).

### Task 11.1: Add Product.baseCurrency schema field

**Files:**
- Modify: `backend/model/Products.js`

- [ ] **Step 1: Add field to schema**

Open `backend/model/Products.js`. Inside the `productsSchema` definition, add:

```js
baseCurrency: {
  type: String,
  enum: ['VND', 'USD'],
  default: 'VND',
},
```

Place it near the `price` field.

- [ ] **Step 2: Backfill index on baseCurrency? No — low cardinality, skip.**

- [ ] **Step 3: Restart backend, smoke-test**

```bash
cd backend && npm run dev
```

In another terminal:

```bash
curl http://localhost:7001/api/v1/store/products | jq '.data.products[0].baseCurrency'
```

Expected: `"VND"` (default).

- [ ] **Step 4: Commit**

```bash
git add backend/model/Products.js
git commit -m "feat(product): add baseCurrency field (default VND)

Required to disambiguate USD-tagged-as-VND legacy data and to support
future per-product currency overrides. Backfilled to 'VND' for all
existing docs via migration 16."
```

### Task 11.2: Update useCurrency.formatPrice to accept baseCurrency

**Files:**
- Modify: `frontend/src/hooks/use-currency.js`

- [ ] **Step 1: Update signature and logic**

Replace `formatPrice(amountVnd)` with `formatPrice(amount, baseCurrency = 'VND')`:

```js
const formatPrice = (amount, baseCurrency = 'VND') => {
  const num = Number(amount) || 0;
  // Normalize to VND base
  const vndValue = baseCurrency === 'USD' ? num * rate : num;
  // Format in target
  if (currency === 'VND' || !rate) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency: 'VND', maximumFractionDigits: 0,
    }).format(vndValue);
  }
  const converted = vndValue / rate;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(converted);
};
```

- [ ] **Step 2: Find every formatPrice call and pass baseCurrency where available**

```bash
grep -rn "formatPrice(" frontend/src/ | wc -l
```

For each call that has access to a product object, change `formatPrice(p.price)` → `formatPrice(p.price, p.baseCurrency)`. Calls for shipping or threshold can keep the default (VND).

- [ ] **Step 3: Verify in browser**

Force-set a product's `baseCurrency: 'USD'` via Mongo shell, reload, switch currencies. Confirm conversion respects the origin.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/use-currency.js frontend/src/components/
git commit -m "feat(currency): formatPrice accepts baseCurrency arg

Lets product detail/cart/checkout respect a product's declared
base currency. Defaults to VND so existing callsites are unaffected."
```

### Task 11.3: Write `migration/16-normalize-product-prices.js`

**Files:**
- Create: `migration/16-normalize-product-prices.js`

- [ ] **Step 1: Scaffold**

```bash
cp migration/14-fix-tychicus-content.js migration/16-normalize-product-prices.js
```

Edit to:
1. Connect via `process.env.MONGO_URI`
2. Backup: dump full `products` collection to `backups/<ts>/products-pre-normalize.json`
3. Query: `Product.find({ price: { $lt: 10000 } })`. For each, log `{_id, title, currentPrice, proposed: currentPrice * 25000}`
4. Write a CSV at `backups/<ts>/price-normalize-proposals.csv`
5. Print: "Found N products to normalize. Confirm with `y` to apply: " — read stdin
6. If `y`: `Product.updateOne({_id}, { $set: { price: proposed, baseCurrency: 'VND' }})` for each
7. Also `Product.updateMany({ baseCurrency: { $exists: false }}, { $set: { baseCurrency: 'VND' }})` to backfill the new field
8. Print final summary

Include `DRY_RUN=1` flag.

- [ ] **Step 2: Dry-run against prod**

```bash
cd backend
DRY_RUN=1 node ../migration/16-normalize-product-prices.js 2>&1 | tee /tmp/m16-dry.log
```

Open `backups/<ts>/price-normalize-proposals.csv`. Confirm proposed prices are reasonable.

- [ ] **Step 3: Idempotency check**

Re-run dry-run. Expected: 0 products found (since none should have price < 10000 after first normalize). Confirms script is idempotent.

- [ ] **Step 4: Commit (do NOT live-run yet)**

```bash
git add migration/16-normalize-product-prices.js
git commit -m "feat(migration): add 16-normalize-product-prices

Identifies products with price < 10000 (clearly USD-as-VND legacy
data) and multiplies by 25000 to convert to VND. Also backfills
baseCurrency='VND' on every product. Includes pre-flight backup,
interactive confirmation, and DRY_RUN mode. Idempotent."
```

### Task 11.4: Fix D6 — shipping costs from SiteSetting

**Files:**
- Modify: `frontend/src/components/clicon/cart/clicon-cart-checkout.jsx:45,53`
- Modify (if needed): `backend/model/SiteSetting.js` — add `localPickupCost` field

- [ ] **Step 1: Add localPickupCost to SiteSetting schema**

```bash
grep -n "shippingSchema\|freeShippingThreshold\|defaultShippingCost" backend/model/SiteSetting.js
```

Add `localPickupCost: { type: Number, default: 0 }` to the shipping subschema if not present.

- [ ] **Step 2: Read settings in cart-checkout component**

```jsx
import { useGetSettingsQuery } from '@/redux/features/cmsApi';
const { data: settings } = useGetSettingsQuery();
const shipping = settings?.data?.shipping ?? {};
const flatRate = shipping.defaultShippingCost ?? 30000;
const localPickup = shipping.localPickupCost ?? 0;
```

- [ ] **Step 3: Replace hardcoded values**

Lines 45 and 53:

```jsx
// before: <span>{t('cart.flatRate')}: {formatPrice(20)}</span>
<span>{t('cart.flatRate')}: {formatPrice(flatRate)}</span>
// before: <span>{t('cart.localPickup')}: {formatPrice(25)}</span>
<span>{t('cart.localPickup')}: {formatPrice(localPickup)}</span>
```

- [ ] **Step 4: Verify**

In CRM, update `ShippingSettingsPage` `defaultShippingCost` to 30000. Reload cart. Expected: "Flat rate: 30.000 ₫".

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/clicon/cart/clicon-cart-checkout.jsx backend/model/SiteSetting.js
git commit -m "fix(cart): shipping costs come from SiteSetting, not hardcoded 20/25"
```

### Task 11.5: Fix D7 — free-shipping threshold from SiteSetting

**Files:**
- Modify: `frontend/src/components/clicon/cart/clicon-cart-area.jsx:12`

- [ ] **Step 1: Replace hardcoded 200**

```jsx
const { data: settings } = useGetSettingsQuery();
const threshold = settings?.data?.shipping?.freeShippingThreshold ?? 5000000;
const remaining = Math.max(0, threshold - total);
```

Drop `const FREE_SHIPPING_THRESHOLD = 200;`.

- [ ] **Step 2: Update copy**

```jsx
{remaining > 0
  ? t('cart.spendMoreForFreeShipping', { amount: formatPrice(remaining) })
  : t('cart.qualifiesForFreeShipping')}
```

- [ ] **Step 3: Verify**

With cart total 220₫ and SiteSetting threshold 5.000.000₫, banner should say "Spend 4.999.780₫ more for free shipping" — NOT "You qualify".

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/clicon/cart/clicon-cart-area.jsx frontend/src/locales/
git commit -m "fix(cart): free-shipping banner uses SiteSetting threshold, not hardcoded 200"
```

### Task 11.6: Phase 11 verification + push

- [ ] **Step 1: F2 sweep — every monetary display routes through formatPrice**

```bash
grep -rn "₫\|\\\$\\$" frontend/src/ | grep -v "useCurrency\|formatPrice\|locales/" | grep -v "// "
```

Investigate every hit. Each should be either a label (e.g. "VND") or already passing through `formatPrice`.

- [ ] **Step 2: Switch currency and walk pages**

In browser, set currency to USD. Walk: homepage → shop → product detail → cart → checkout. Every price label should be `$X.XX`. Switch to VND, walk again — every label `X.XXX ₫`.

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

# Phase 12 — Compare Page (Flow C2)

**Bugs fixed:** C2 (missing image, "Clicon" seller fallback, single-slot only).

### Task 12.1: Fix "Clicon" seller fallback

**Files:**
- Modify: `frontend/src/components/compare/compare-area.jsx:119`
- Modify: `frontend/src/locales/{en,vi}/common.json`

- [ ] **Step 1: Replace literal fallback**

Find:

```jsx
{item.vendor?.storeName || 'Clicon'}
```

Replace:

```jsx
{item.vendor?.storeName || t('compare.unknownSeller')}
```

- [ ] **Step 2: Add i18n keys**

```json
"compare": {
  "unknownSeller": "Unknown seller",
  "addProductSlot": "Add product to compare"
}
```

VI: `"Người bán không xác định"`, `"Thêm sản phẩm để so sánh"`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/compare/compare-area.jsx frontend/src/locales/
git commit -m "fix(compare): replace 'Clicon' template fallback with i18n 'Unknown seller'"
```

### Task 12.2: Ensure full product payload persists to compareSlice

**Files:**
- Modify: `frontend/src/redux/features/compareSlice.js`

- [ ] **Step 1: Audit reducer**

```bash
grep -n "add_compare_product\|compareSlice" frontend/src/redux/features/compareSlice.js
```

Confirm `add_compare_product` stores the full product object (or at minimum: `_id`, `title`, `price`, `baseCurrency`, `img`, `imageURLs`, `vendor`, `reviews`).

If it strips fields, fix to keep them all. Or store full product.

- [ ] **Step 2: Bump localStorage version**

If field shape changed, bump `compare_items_v2` key so old stripped data doesn't reload. On mount, read `_v2`; if absent, clear `_v1`.

- [ ] **Step 3: Verify**

`localStorage.clear()`. Add a product to compare. Refresh `/compare`. Expected: image visible, vendor correct.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/redux/features/compareSlice.js
git commit -m "fix(compare): persist full product payload (img, vendor) to localStorage"
```

### Task 12.3: Render multi-slot compare table

**Files:**
- Modify: `frontend/src/components/compare/compare-area.jsx`

- [ ] **Step 1: Generalize column rendering**

Find the JSX rendering a single product. Wrap in `compareItems.map(item => ...)`. Pad to 4 slots with `"add product" placeholders`:

```jsx
const SLOTS = 4;
const items = [...compareItems, ...Array(Math.max(0, SLOTS - compareItems.length)).fill(null)];

// In each row (Image, Title, Price, Rating, Description, Action):
{items.map((item, i) =>
  item ? <td key={i}>...real cell...</td>
       : <td key={i}><Link href="/shop">{t('compare.addProductSlot')}</Link></td>
)}
```

- [ ] **Step 2: Verify**

Add 2 products to compare. Open `/compare`. Expected: 2 filled slots + 2 "Add product" CTA slots.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/compare/compare-area.jsx
git commit -m "feat(compare): render up to 4 product slots side-by-side

Empty slots show an Add Product CTA linking to /shop."
```

### Task 12.4: Phase 12 verification + push

- [ ] **Step 1: Manual flow C test**

1. Add product from product detail → goes to compare
2. /compare shows image, real vendor name, multi-slot layout
3. Add a second product → shows in slot 2

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

# Phase 13 — Guest Checkout + Auth (Flow E1, E2)

**Bugs fixed:** E1 (no guest checkout), E2 (Keycloak locale mismatch — verify).

### Task 13.1: Add guestEmail field to Order model

**Files:**
- Modify: `backend/model/Order.js`

- [ ] **Step 1: Add optional guestEmail field**

```js
guestEmail: {
  type: String,
  trim: true,
  lowercase: true,
  match: /^[\w.+-]+@[\w-]+\.[\w.-]+$/,
},
```

Make `user` optional when `guestEmail` is present:

```js
user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  validate: {
    validator: function() { return this.user || this.guestEmail; },
    message: 'Order must have either user or guestEmail',
  },
},
```

- [ ] **Step 2: Restart backend, smoke**

```bash
cd backend && npm run dev
```

Confirm no schema errors on startup.

- [ ] **Step 3: Commit**

```bash
git add backend/model/Order.js
git commit -m "feat(order): support guest orders via optional guestEmail field"
```

### Task 13.2: Add guest order Joi validation

**Files:**
- Modify: `backend/validations/order.js`

- [ ] **Step 1: Add guestOrderSchema**

```js
const guestOrderSchema = Joi.object({
  guestEmail: Joi.string().email().required(),
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().default('VN'),
  }).required(),
  items: Joi.array().items(/* same as createOrderSchema items */).min(1).required(),
  totals: Joi.object({
    subtotal: Joi.number().required(),
    shipping: Joi.number().required(),
    discount: Joi.number().default(0),
    total: Joi.number().required(),
  }).required(),
  paymentMethod: Joi.string().valid('cod', 'bank-transfer').required(),
  couponCode: Joi.string().optional(),
});

module.exports = { ..., guestOrderSchema };
```

Card / VNPay / MoMo / Stripe are deliberately excluded — guests stay COD or bank-transfer.

- [ ] **Step 2: Commit**

```bash
git add backend/validations/order.js
git commit -m "feat(order): Joi schema for guest order (COD + bank-transfer only)"
```

### Task 13.3: Add `_createOrder` shared logic + guest route

**Files:**
- Modify: `backend/controller/v1/order.controller.js`
- Modify: `backend/routes/v1/store.js`

- [ ] **Step 1: Extract shared logic**

Refactor existing `createOrder` to call an internal `async function _createOrder({ user, guestEmail, payload })`. Both branches share invoice generation, coupon validation, inventory decrement, email send.

- [ ] **Step 2: Add `createGuestOrder` export**

```js
exports.createGuestOrder = async (req, res) => {
  try {
    const { error, value } = guestOrderSchema.validate(req.body);
    if (error) return respond.badRequest(res, error.details[0].message);
    const order = await _createOrder({
      user: null,
      guestEmail: value.guestEmail,
      payload: value,
    });
    // send confirmation email
    sendTemplatedEmail('order-confirmation', value.guestEmail, { order })
      .catch(e => console.error('Email send failed:', e));
    respond.created(res, order);
  } catch (e) {
    respond.serverError(res, e.message);
  }
};
```

- [ ] **Step 3: Add route**

In `backend/routes/v1/store.js`:

```js
const orderRateLimit = rateLimit({ windowMs: 15*60*1000, max: 5 });
router.post('/orders/guest', orderRateLimit, validate(guestOrderSchema), orderController.createGuestOrder);
```

- [ ] **Step 4: Test**

```bash
curl -X POST http://localhost:7001/api/v1/store/orders/guest \
  -H 'Content-Type: application/json' \
  -d '{"guestEmail":"test@example.com","shippingAddress":{"fullName":"Test","phone":"0123","address":"X","city":"HCM"},"items":[{"productId":"<real id>","quantity":1,"price":100000}],"totals":{"subtotal":100000,"shipping":30000,"total":130000},"paymentMethod":"cod"}'
```

Expected: 201 with order doc. Check Mongo: doc has `user: null`, `guestEmail: 'test@example.com'`.

- [ ] **Step 5: Commit**

```bash
git add backend/controller/v1/order.controller.js backend/routes/v1/store.js
git commit -m "feat(checkout): POST /orders/guest endpoint for unauthenticated checkout

Rate-limited to 5/15min per IP. Accepts COD or bank-transfer only;
card payments stay behind login. Sends order confirmation email
to the guest email."
```

### Task 13.4: Frontend "Continue as guest" flow

**Files:**
- Modify: `frontend/src/components/checkout/checkout-login.jsx`
- Modify: `frontend/src/hooks/use-checkout-submit.js`
- Modify: `frontend/src/redux/features/order/orderApi.js`

- [ ] **Step 1: Add createGuestOrder RTK Query mutation**

In `orderApi.js`:

```js
createGuestOrder: builder.mutation({
  query: (body) => ({ url: '/store/orders/guest', method: 'POST', body }),
  invalidatesTags: ['UserOrders'],
}),
```

Export `useCreateGuestOrderMutation`.

- [ ] **Step 2: Add toggle to checkout-login.jsx**

```jsx
const [guestMode, setGuestMode] = useState(false);
const [guestEmail, setGuestEmail] = useState('');

// Render:
{!guestMode && (<>
  <KeycloakLoginButton onClick={() => keycloak.login({ ui_locales: router.locale })} />
  <button onClick={() => setGuestMode(true)}>{t('checkout.continueAsGuest')}</button>
</>)}
{guestMode && (
  <form onSubmit={handleGuestSubmit}>
    <input type="email" required value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder={t('checkout.guestEmailPlaceholder')} />
    <button type="submit">{t('checkout.continueAsGuestConfirm')}</button>
    <button type="button" onClick={() => setGuestMode(false)}>{t('common.back')}</button>
  </form>
)}
```

- [ ] **Step 3: Branch in use-checkout-submit.js**

```js
import { useCreateGuestOrderMutation } from '@/redux/features/order/orderApi';
const [createGuestOrder] = useCreateGuestOrderMutation();

// In submit handler:
const userInfo = Cookies.get('userInfo');
if (!userInfo) {
  if (!guestEmail) return toast.error(t('checkout.emailRequired'));
  // Restrict payment method
  if (!['cod','bank-transfer'].includes(paymentMethod)) {
    return toast.error(t('checkout.guestPaymentRestriction'));
  }
  const order = await createGuestOrder({ guestEmail, shippingAddress, items, totals, paymentMethod, couponCode }).unwrap();
  // success: show "Create account?" toast
  toast.info(<>
    {t('checkout.guestSuccess')}
    <button onClick={() => router.push(`/register?email=${guestEmail}`)}>{t('checkout.createAccount')}</button>
  </>);
  router.push(`/order/${order._id}`);
  return;
}
// else: existing authed flow
```

- [ ] **Step 4: i18n keys**

Add `checkout.continueAsGuest`, `guestEmailPlaceholder`, `continueAsGuestConfirm`, `emailRequired`, `guestPaymentRestriction`, `guestSuccess`, `createAccount` to en/vi.

- [ ] **Step 5: Browser test**

Clear cookies. Add cart. Click Proceed to Checkout. Click "Continue as guest". Enter email. Pick COD. Place order. Confirm order page renders + email sent (check backend logs).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat(checkout): continue-as-guest flow for COD orders

Adds a 'Continue as guest' branch on the Keycloak gate. Guest enters
email + shipping, places COD or bank-transfer order. On success,
offers to create an account with the same email."
```

### Task 13.5: E2 verification + Keycloak docs

**Files:**
- Audit: all `keycloak.login(`, `keycloak.register(` callsites
- Create (if needed): `docs/deployment/keycloak.md`

- [ ] **Step 1: Audit locale wiring**

```bash
grep -rn "keycloak\.\(login\|register\)" frontend/src/
```

Expected: each call passes `{ ui_locales: router.locale }`. If any doesn't, fix.

- [ ] **Step 2: Test in browser**

Set site to English (URL `/en/...`). Click login → Keycloak. If it still shows Vietnamese, the frontend param is being ignored. In that case:

- [ ] **Step 3: Document Keycloak realm change**

Create `docs/deployment/keycloak.md`:

```markdown
# Keycloak Realm Locale Configuration

To make the Keycloak login page respect the site's selected language, the realm must be configured:

1. Open Keycloak admin → Realm Settings → Localization
2. Enable "Internationalization Enabled"
3. Add supported locales: `en`, `vi`
4. Set "Default Locale" to `en`
5. Save

Without this, the `ui_locales` URL param sent by the frontend is ignored.
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/ docs/deployment/keycloak.md
git commit -m "docs(auth): document Keycloak realm i18n requirement for E2 fix

Frontend already passes ui_locales=<locale>; the fix is a Keycloak
realm setting. Documented for the next deploy."
```

### Task 13.6: Phase 13 verification + push

- [ ] **Step 1: Manual flow E test**

1. Logged-out user adds items → checkout → "Continue as guest"
2. Enters email + shipping → picks COD → places order
3. Order confirmation page renders
4. Backend log shows email send attempt
5. Card payment option is disabled / hidden in guest mode

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

# Phase 14 — Branding + Blog Content (Flow H, G)

**Bugs fixed:** H1 (phone numbers — verify), H2 (Clicon → Shofy), H3 (resolved by H1), G1 (blog hero images), G2 (future blog dates).

### Task 14.1: Audit hardcoded phone numbers

- [ ] **Step 1: grep for US fallback numbers**

```bash
grep -rEn '\+1-?202-?555|\(629\)|\(202\)' frontend/src/ crm/crm-ui/src/ backend/
```

Expected: 0 hits. If any remain, replace with `+84 28 7106 1234`.

- [ ] **Step 2: Hoist constant**

Create `frontend/src/constants/contact.js`:

```js
export const SHOFY_PHONE = '+84 28 7106 1234';
export const SHOFY_EMAIL = 'support@tychicus.id.vn';
export const SHOFY_ADDRESS = 'Ho Chi Minh City, Vietnam';
export const FREE_SHIPPING_THRESHOLD_VND = 5000000;
```

Refactor the 5 components currently duplicating the phone fallback to import from this module.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/constants/contact.js frontend/src/
git commit -m "refactor(contact): hoist Shofy contact constants to single source"
```

### Task 14.2: Replace user-facing "Clicon" references

- [ ] **Step 1: grep**

```bash
grep -rEn '\bClicon\b' frontend/src/ crm/crm-ui/src/ | grep -vE 'clicon-[a-z-]+\.(jsx|scss|tsx)$' | grep -vE 'components/clicon/'
```

This filters out file paths and CSS class names like `clicon-cart-area`. Remaining hits are user-facing text.

- [ ] **Step 2: Replace each hit with "Shofy"**

For each remaining hit, replace the literal text. Examples:
- `customer-support-area.jsx`: "Sell on Clicon" → "Sell on Shofy"
- `compare-area.jsx`: already covered by Phase 12
- Any header/footer or about page string

- [ ] **Step 3: CRM placeholder email**

```bash
sed -i.bak 's/info@shofy\.com/support@tychicus.id.vn/g' crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx
rm crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx.bak
```

- [ ] **Step 4: Verify**

```bash
grep -rEn '\bClicon\b' frontend/src/ crm/crm-ui/src/ | grep -vE 'clicon-[a-z-]+\.(jsx|scss|tsx)|components/clicon/'
```

Expected: 0 user-facing hits.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/ crm/crm-ui/src/
git commit -m "fix(branding): replace user-facing 'Clicon' template residue with 'Shofy'

Component CSS class names (clicon-cart-area, etc.) are left alone
— refactoring class names is out of scope for this sprint."
```

### Task 14.3: Write `migration/17-fix-blog-and-branding.js`

**Files:**
- Create: `migration/17-fix-blog-and-branding.js`

- [ ] **Step 1: Scaffold**

```bash
cp migration/14-fix-tychicus-content.js migration/17-fix-blog-and-branding.js
```

Edit to:
1. Backup `blogposts`, `sitesettings`, `pages`, `banners` to `backups/<ts>/`
2. Maintain a category→image map:
   ```js
   const HERO_IMAGES = {
     'home-decor': 'https://res.cloudinary.com/dfddeabbs/image/upload/v1/shofy/blog/home-decor.jpg',
     'fashion': '...',
     'skincare': '...',
     'electronics': '...',
   };
   ```
3. For each BlogPost: if `featuredImage` references a known mismatched URL (e.g. iPhone img on a Home Decor post), replace with the category-appropriate URL.
4. Walk SiteSetting docs for any `contact.*` field still containing "Clicon" or US phone — overwrite.
5. Walk Page/Banner content for "Clicon" — overwrite to "Shofy".

- [ ] **Step 2: Dry-run**

```bash
DRY_RUN=1 node migration/17-fix-blog-and-branding.js
```

Confirm proposals look right.

- [ ] **Step 3: Commit script**

```bash
git add migration/17-fix-blog-and-branding.js
git commit -m "feat(migration): 17-fix-blog-and-branding

Replaces mismatched blog hero images (e.g. iPhone on home-decor post)
and any remaining Clicon-branded CMS content. Includes pre-flight
backup + DRY_RUN."
```

### Task 14.4: Re-date future blog posts

- [ ] **Step 1: Decide policy with user**

Ask: are future-dated blog posts (Mar 22, 24 2026) intentional staging content? If yes, document in CLAUDE.md. If no, include date-shift logic in migration/17 to clamp `publishedAt` to `today - 30 days` for any future date.

- [ ] **Step 2: Commit policy doc or migration update**

```bash
git add ...
git commit -m "..."
```

### Task 14.5: Phase 14 verification + push

- [ ] **Step 1: Manual flow H/G test**

1. Footer phone → +84 28 7106 1234 (single source)
2. Customer support page → no "Sell on Clicon", no US phone
3. After Phase 16 migration: blog post "Style Your Home" → home-decor image, NOT iPhone

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

# Phase 15 — Hero Carousel + Announcement (Flow I)

**Bugs fixed:** I1 (Black Friday banner contradicts hero), I2 (mixed EN/VI in same slide), I3 (hardcoded $299), I4 (empty space on Fashion Forward slide).

### Task 15.1: Extend Banner schema with per-locale fields

**Files:**
- Modify: `backend/model/Banner.js`

- [ ] **Step 1: Add additive per-locale subschema**

```js
const localizedString = new mongoose.Schema({
  en: String,
  vi: String,
}, { _id: false });

const bannerSchema = new mongoose.Schema({
  ...existing fields...
  title: mongoose.Schema.Types.Mixed,  // string OR { en, vi }
  subtitle: mongoose.Schema.Types.Mixed,
  cta: {
    label: mongoose.Schema.Types.Mixed,
    link: String,
  },
  ...
});
```

Keep `title`/`subtitle` as Mixed so existing flat strings and new `{en,vi}` shapes both validate.

- [ ] **Step 2: Restart backend, smoke**

Confirm no schema validation errors.

- [ ] **Step 3: Commit**

```bash
git add backend/model/Banner.js
git commit -m "feat(banner): per-locale title/subtitle/cta (additive — flat strings still valid)"
```

### Task 15.2: Update hero rendering to resolve per-locale

**Files:**
- Modify: `frontend/src/components/clicon/hero/clicon-hero-area.jsx`

- [ ] **Step 1: Add resolver helper**

```js
const resolveLocalized = (val, locale) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[locale] || val.en || val.vi || '';
};
```

- [ ] **Step 2: Replace all hero-slide string reads**

```jsx
// before: <h2>{banner.title}</h2>
<h2>{resolveLocalized(banner.title, router.locale)}</h2>
```

Same for subtitle and CTA label.

- [ ] **Step 3: Drop hardcoded $299**

In `FALLBACK_SLIDES`, replace `"STARTING AT ONLY $299"` with a translation key:

```js
{
  titleKey: 'hero.homeDecor.title',
  subtitleKey: 'hero.homeDecor.subtitle',
  ctaKey: 'hero.homeDecor.cta',
  price: 7500000,  // in VND
}
```

In render:

```jsx
<p>{t('hero.startingAt', { amount: formatPrice(slide.price) })}</p>
```

i18n key: `"hero.startingAt": "Starting at {{amount}}"`.

- [ ] **Step 4: Fix Fashion Forward empty space**

Inspect the slide in browser DevTools. If the `.cl-hero-slide` has 70% empty whitespace, either (a) populate a CSS background image OR (b) restructure the flex layout. Easiest: add `min-height: 0` + `align-items: center` to the inner container so it doesn't stretch. Or: add an image fallback in `FALLBACK_SLIDES`.

- [ ] **Step 5: Verify in browser**

Switch site to EN → hero copy all English. Switch to VI → all Vietnamese. Switch to USD → price shows `$X.XX`. Switch to VND → `X.XXX ₫`. Fashion Forward slide no longer mostly empty.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/clicon/hero/ frontend/src/locales/
git commit -m "fix(hero): resolve per-locale copy, use formatPrice for hero prices

Hero slides now read banner.title.en or banner.title.vi based on
router.locale. Hardcoded \$299 replaced with formatPrice(7500000).
Fashion Forward slide layout rebalanced to remove empty space."
```

### Task 15.3: Write `migration/18-clean-hero-and-announcements.js`

**Files:**
- Create: `migration/18-clean-hero-and-announcements.js`

- [ ] **Step 1: Scaffold**

```bash
cp migration/14-fix-tychicus-content.js migration/18-clean-hero-and-announcements.js
```

Edit to:
1. Backup `banners`, `announcements`, `pages` (any CMS that holds hero/announcement)
2. Delete or deactivate `Announcement` docs where:
   - `key === 'black-friday-banner'`, OR
   - `validUntil < new Date()`
3. For each Banner where `title` is a flat string with mixed-locale content (e.g. "Spring Sale — Khuyến mãi"), split into `{ en: 'Spring Sale', vi: 'Khuyến mãi' }` based on simple heuristic — flag for manual review if ambiguous.
4. Walk Banner content for hardcoded "$299" or other USD markers; replace with `{{price}}` placeholder that the frontend will resolve via `formatPrice`.

- [ ] **Step 2: Dry-run, review, commit**

```bash
DRY_RUN=1 node migration/18-clean-hero-and-announcements.js
git add migration/18-clean-hero-and-announcements.js
git commit -m "feat(migration): 18-clean-hero-and-announcements

Deletes out-of-season announcements and converts existing flat-string
banner titles into per-locale {en,vi} shapes. Banners with ambiguous
language flagged for manual review."
```

### Task 15.4: Phase 15 verification + push

- [ ] **Step 1: Manual flow I test (after Phase 16 migration)**

1. No Black Friday announcement visible
2. Hero slides EN/VI clean — no mixed language
3. Hero price in selected currency
4. No hero slide is mostly empty

- [ ] **Step 2: Push**

```bash
git push origin main
```

---

# Phase 16 — Production Data Migrations + Smoke Test

### Task 16.1: Pre-flight backup

- [ ] **Step 1: Snapshot prod collections**

```bash
cd /Users/mac/Downloads/ecommerce_website-main
TS=$(date -u +%Y-%m-%dT%H-%M-%S)
mkdir -p backups/$TS-pre-phase-16
cd backend
node -e "
const m=require('mongoose');
require('dotenv').config();
const fs=require('fs');
const TS='$TS';
(async()=>{
  await m.connect(process.env.MONGO_URI);
  for (const col of ['products','blogposts','banners','announcements','sitesettings','pages','orders']) {
    const docs = await m.connection.db.collection(col).find({}).toArray();
    fs.writeFileSync(\`../backups/\${TS}-pre-phase-16/\${col}.json\`, JSON.stringify(docs, null, 2));
    console.log(col, docs.length);
  }
  await m.disconnect();
})();
"
```

Expected: counts printed per collection, JSON files in `backups/<ts>-pre-phase-16/`.

### Task 16.2: Run migration 15

- [ ] **Step 1: Live run**

```bash
cd backend
node ../migration/15-fix-product-brand-and-thumbs.js 2>&1 | tee /tmp/m15-live.log
```

Inspect `backups/<ts>/brand-mismatches.csv` after. Verify summary.

- [ ] **Step 2: Verify**

```bash
node -e "
const m=require('mongoose'); require('dotenv').config();
const Product = require('./model/Products');
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const ibb = await Product.countDocuments({ 'imageURLs.img':/ibb\.co/ });
  console.log('Products with ibb.co thumbs:', ibb);
  await m.disconnect();
})();
"
```

Expected: 0.

### Task 16.3: Run migration 16

- [ ] **Step 1: Live run with interactive confirm**

```bash
node ../migration/16-normalize-product-prices.js 2>&1 | tee /tmp/m16-live.log
```

Review the proposed price changes. Type `y` to apply.

- [ ] **Step 2: Verify**

```bash
node -e "
const m=require('mongoose'); require('dotenv').config();
const Product = require('./model/Products');
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const tiny = await Product.countDocuments({ price: { \$lt: 10000 } });
  const noBase = await Product.countDocuments({ baseCurrency: { \$exists: false } });
  console.log('Products with price < 10000:', tiny);
  console.log('Products without baseCurrency:', noBase);
  await m.disconnect();
})();
"
```

Expected: both 0.

### Task 16.4: Run migrations 17 and 18

- [ ] **Step 1: Live run 17 (blog + branding)**

```bash
node ../migration/17-fix-blog-and-branding.js 2>&1 | tee /tmp/m17-live.log
```

- [ ] **Step 2: Live run 18 (hero + announcements)**

```bash
node ../migration/18-clean-hero-and-announcements.js 2>&1 | tee /tmp/m18-live.log
```

- [ ] **Step 3: Verify announcements cleaned**

```bash
node -e "
const m=require('mongoose'); require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const stale = await m.connection.db.collection('announcements').countDocuments({ key: 'black-friday-banner' });
  console.log('Black Friday docs remaining:', stale);
  await m.disconnect();
})();
"
```

Expected: 0.

### Task 16.5: Verify $text index on products

- [ ] **Step 1: Check index**

```bash
node -e "
const m=require('mongoose'); require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  const idx = await m.connection.db.collection('products').indexes();
  const text = idx.find(i => i.weights);
  console.log(text ? text.name : 'NO TEXT INDEX');
  await m.disconnect();
})();
"
```

- [ ] **Step 2: Create if missing**

```bash
node -e "
const m=require('mongoose'); require('dotenv').config();
(async()=>{
  await m.connect(process.env.MONGO_URI);
  await m.connection.db.collection('products').createIndex(
    { title: 'text', description: 'text', tags: 'text' },
    { weights: { title: 10, tags: 5, description: 1 }, name: 'products_text' }
  );
  console.log('Created');
  await m.disconnect();
})();
"
```

### Task 16.6: Full-flow smoke test on tychicus.id.vn

- [ ] **Step 1: Manual walkthrough**

Open the live site and walk through every acceptance criterion from Phases 8–15:

- [ ] A1–A4: search returns matches, filter strict, sort ascending
- [ ] B1, B3, B4: product detail brand correct (or hidden), thumbs load, qty accepts typed input
- [ ] D1–D4: cart math exact, remove confirms, coupon input works
- [ ] D5–D7, F1–F2: prices normalized, shipping from settings, banner threshold from settings, currency switch consistent
- [ ] C2: compare page shows image + correct seller + multi-slot
- [ ] E1, E2: guest checkout completes COD order, Keycloak respects locale (or documented)
- [ ] H1–H3: phone consistent +84, no Clicon user-facing
- [ ] G1: blog hero images match content
- [ ] I1–I4: no Black Friday, hero respects locale + currency, no empty slide

- [ ] **Step 2: Document follow-ups**

Any acceptance failure → file an issue in `docs/superpowers/notes/2026-05-21-sprint-2-followups.md`. Don't reopen the sprint; queue for next.

- [ ] **Step 3: Final commit**

```bash
git add docs/superpowers/notes/
git commit -m "docs: Sprint 2 smoke test results + follow-ups

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Sprint 2 Completion Criteria

- [ ] All 9 phases committed and pushed to `main`
- [ ] 4 prod data migrations (15, 16, 17, 18) executed with backups
- [ ] $text index on products confirmed
- [ ] All Flow A–J acceptance criteria pass in production smoke test
- [ ] Follow-ups documented for any deferred items

---

## Risk Reminders

- **Migration 16** (price normalization) is the riskiest — multiplies prod prices by 25000. Always backup first, dry-run first, review CSV, type `y` only after spot-checking.
- **Banner schema** in Phase 15 is **additive** — old flat strings still work. Migration 18 splits them into per-locale shape but keeps backward-compat readers in the frontend resolver.
- **Guest checkout** changes `Order.user` from required → optional via custom validator. Verify CRM order list, analytics, and email service all handle `user: null` gracefully (spot-check after Phase 13).
