# Multi-Currency, Per-User Preference — Design

**Date:** 2026-05-20
**Author:** Claude (brainstormed with @tychicus04)
**Status:** Draft → Pending user review
**Related:** Supersedes site-wide `SiteSetting.payment.currency` model added in Spec B (2026-05-20 CRM quality improvements). Defers CRM i18n (separate spec).

---

## Problem

Shofy storefront and CRM display product prices, but the system is broken across multiple layers:

1. **Data/code mismatch.** Storefront code in [frontend/src/hooks/use-currency.js:7](../../../frontend/src/hooks/use-currency.js#L7) asserts "All product prices in the database are stored in USD." Reality: seed data in [backend/seeds/mock-data.seed.js](../../../backend/seeds/mock-data.seed.js) uses VND amounts (e.g., `price: 1290000` for an Áo Dài). If a customer picks VND on the storefront, the current code multiplies VND prices by 25,450 → displays absurd numbers (~32 billion ₫).
2. **Mixed data.** Some products are confirmed to have USD-magnitude prices (warned by user). The audit script does not currently detect this.
3. **Site-wide currency default doesn't match user mental model.** Spec B added `SiteSetting.payment.currency` and a Currency field in CRM Payment Settings. The user pointed out this is wrong: currency should be a per-user preference, not a site-wide default. A user from Vietnam sees ₫; a user from Germany sees €; same product, same DB row.
4. **No real exchange rate.** "Currency" in current system is just display format — no conversion math (USD → VND uses rate 1 in CRM `useFormatters`). User wants actual exchange-rate conversion.
5. **Orders don't snapshot rate.** If rate changes after order placement, historical orders display wrong amounts.

## Goals

- Canonical price storage in **VND** (base currency). All other currencies derived via live exchange rate.
- Per-user currency preference, no site-wide default.
- Live exchange rates fetched from public API, cached server-side, served via REST.
- Per-order snapshot of `displayCurrency` + `exchangeRate` for accurate historical record.
- CRM admin gets a view-only currency switcher in the header.
- Storefront customer (authenticated or anonymous) chooses their currency; persists across sessions.
- Migrate existing mixed USD/VND product data to coherent VND base via admin-reviewed audit flow.

## Non-Goals

- CRM internationalization (EN/VI labels in CRM UI). Tracked separately.
- Currency-per-product (each product carrying its own base currency). Rejected in Q1 brainstorm.
- Manual exchange-rate management in CRM. Rejected in Q2 (live API chosen).
- Refund-rate policy reconciliation (refund at rate-of-order vs rate-of-refund). Out of scope; flag for Phase 6.

## Architecture Overview

```
exchangerate.host (free public API, no API key)
      ↓  cron every 1h (backend)
   ExchangeRate collection (single document, MongoDB)
      ↓  GET /api/v1/store/exchange-rates  (public; 1h client cache)
   ┌──────────────────────┬──────────────────────┐
   Storefront (Next.js)   CRM (Vite + React 19)
   RTK Query 1h cache     React Query 1h cache
        ↓                       ↓
   currencySlice (Redux)   useCurrencyStore (Zustand)
        ↓                       ↓
   useCurrency().formatPrice   useFormatters().formatCurrency
        ↓                       ↓
   priceVND / rate[target]     priceVND / rate[target]
```

Preference sources (read priority high → low):

| Surface | Source | Persistence |
|---|---|---|
| Storefront authed user | `User.preferences.currency` | DB + `display_currency` cookie (mirror) |
| Storefront anonymous | `display_currency` cookie | Cookie (1 year) + localStorage backup |
| CRM admin | `useCurrencyStore` (Zustand persist) | localStorage `crm_display_currency` |

Supported currencies (v1): **VND** (base), **USD**, **EUR**, **GBP**, **JPY**.

## Data Model

### New: `ExchangeRate` collection ([backend/model/ExchangeRate.js](../../../backend/model/ExchangeRate.js))

Single document (idempotent upsert; no history).

```js
{
  base: { type: String, default: 'VND', immutable: true },
  rates: {
    USD: { type: Number, required: true },  // 1 USD = X VND  (e.g., 25450)
    EUR: { type: Number, required: true },  // 1 EUR = X VND
    GBP: { type: Number, required: true },
    JPY: { type: Number, required: true },
    // VND implicit = 1, not stored
  },
  source: { type: String, default: 'exchangerate.host' },
  stale: { type: Boolean, default: false },     // true if last fetch failed
  fetchedAt: Date,
  updatedAt: Date,
}
```

**Conversion math:**
- VND → other: `priceTarget = priceVND / rate[target]` (e.g., 1,290,000 / 25,450 = $50.69)
- Other → VND: `priceVND = priceOther * rate[other]`

### Updated: `User` model

Add:
```js
preferences: {
  currency: { type: String, enum: ['VND','USD','EUR','GBP','JPY'], default: 'VND' },
  language: { type: String, enum: ['vi','en'], default: 'vi' },  // placeholder; CRM i18n is separate spec
}
```

### Updated: `Order` model

Add (per order, snapshotted at creation):
```js
displayCurrency: { type: String, default: 'VND' },
exchangeRate:    { type: Number, default: 1 },     // rate[displayCurrency] at order time
// cart[].price stays in VND base — NO denormalized displayPrice field
```

### Updated: `Product` model

Add 1 field for audit tracking:
```js
currencyReviewedAt: { type: Date, default: null }
```

No change to `price` (stays Number, VND base).

### Deprecated: `SiteSetting` fields

These remain in schema for backward-compat through Phase 4, then removed in Phase 5:
- `payment.currency`
- `payment.currencySymbol`
- `i18n.defaultLanguage`
- `i18n.supportedLanguages`

Keep: `payment.enabledGateways`, `payment.codEnabled`, gateway provider configs.

## API

### Backend endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/store/exchange-rates` | public | Returns `{base, rates, stale, updatedAt}`. Cache-Control: `public, max-age=3600`. |
| `GET` | `/api/v1/user/preferences` | user token | Returns `{currency, language}` from `User.preferences`. |
| `PATCH` | `/api/v1/user/preferences` | user token | Updates `User.preferences`. Body: `{currency?, language?}`. |
| `GET` | `/api/v1/admin/products/currency-audit` | admin | Returns products where `price < 5000 AND currencyReviewedAt = null`. Paginated. |
| `POST` | `/api/v1/admin/products/:id/normalize-currency` | admin | Body: `{fromCurrency:'USD'\|'VND'}`. If `USD`, `price *= rates.USD`. Always sets `currencyReviewedAt = Date.now()`. |
| `POST` | `/api/v1/admin/products/bulk-normalize-currency` | admin | Body: `{ids:[ObjectId], fromCurrency}`. Batch version. |

### Response envelope

Standard project envelope (`utils/respond.js`):
```js
{ success: true, data: {...}, message: 'Settings updated successfully' }
```

### Cron service

[backend/services/exchangeRateService.js](../../../backend/services/exchangeRateService.js):

- Endpoint: `https://api.exchangerate.host/latest?base=VND&symbols=USD,EUR,GBP,JPY`
- Schedule: `cron.schedule('0 * * * *', refreshRates)` (top of each hour)
- Boot: also `refreshRates()` immediately when wired from `backend/index.js` after `mongoose.connect`
- Inversion: API returns rates as "1 VND = X target" — we invert to "1 target = X VND" → `rates[code] = 1 / data.rates[code]`
- Failure handling: set `stale: true` on existing document; keep last-known rates. Log error.

## Storefront Integration

### Slice rewrite — `frontend/src/redux/features/currencySlice.js`

Remove hardcoded `EXCHANGE_RATES`. Keep static `CURRENCY_CONFIG` (locale, decimals, symbol metadata) inline. State: only `{ currency }`.

### New RTK Query slice — `frontend/src/redux/features/exchangeRateApi.js`

```js
getExchangeRates: builder.query({
  query: () => '/api/v1/store/exchange-rates',
  transformResponse: (r) => r.data,
  keepUnusedDataFor: 3600,
})
```

### Hook rewrite — `frontend/src/hooks/use-currency.js`

```js
const useCurrency = () => {
  const currency = useSelector(selectCurrency);
  const config = CURRENCY_CONFIG[currency];
  const { data: ratesData } = useGetExchangeRatesQuery();
  const rate = currency === 'VND' ? 1 : (ratesData?.rates?.[currency] ?? null);

  const formatPrice = (amountVnd) => {
    const num = Number(amountVnd);
    if (!Number.isFinite(num)) return '';
    if (currency === 'VND' || !rate) {
      return new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' }).format(num);
    }
    const converted = num / rate;
    return new Intl.NumberFormat(config.locale, {
      style:'currency', currency: config.code,
      minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals,
    }).format(converted);
  };

  return { formatPrice, currency, config, rate, isStale: ratesData?.stale };
};
```

### Preference sync — `frontend/src/layout/wrapper.jsx`

```js
// Mount-time: hydrate from cookie
useEffect(() => { dispatch(hydrateCurrencyFromCookie()); }, []);

// After auth: prefer DB preference
const { data: prefs } = useGetUserPreferencesQuery(undefined, { skip: !accessToken });
useEffect(() => {
  if (prefs?.currency) dispatch(setCurrency(prefs.currency));
}, [prefs]);
```

`setCurrency(code)` writes Redux + cookie `display_currency` (1y expiry). If authed, also `PATCH /user/preferences`.

### Currency switcher UI

Mount in header top bar (e.g., `frontend/src/layout/headers/header-top-right.jsx` or equivalent). Dropdown of 5 currencies.

### Cart contract

`cart_products[].price` **stays in VND base**, regardless of display currency. Display layer converts only at `formatPrice` call sites. Checkout submission sends VND values; backend validates against product DB.

**Pre-Phase-4 cart compatibility:** existing `cart_products` in users' localStorage already contain raw DB `product.price` values (the current code reads `product.price` from the product API and stores it as-is — it only multiplies in the display layer). After Phase 4 deploys, those existing cart entries continue to be interpreted as VND base correctly. **No cart-clearing migration required.** UX nuance: a logged-in customer who saw `$50.69` before Phase 4 will see `1,290,000 ₫` after Phase 4 (assuming default VND view). They can switch back to USD via the new switcher; price re-displays as `$50.69`.

### Checkout submission

[frontend/src/hooks/useCheckoutSubmit.js](../../../frontend/src/hooks/useCheckoutSubmit.js):

```js
const orderPayload = {
  cart: cartItems,                  // VND prices unchanged
  totalAmount,                      // VND
  displayCurrency: currentCurrency, // user's view at checkout
  // exchangeRate snapshotted server-side; client does NOT send rate
  ...billing,
};
```

### SSR consideration

Initial server render uses VND base (default). Client hydrates → re-renders with user's currency. Brief first-paint flicker accepted as v1 trade-off (no per-currency SSR cache fragmentation).

## CRM Integration

### Zustand store — `crm/crm-ui/src/stores/useCurrencyStore.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCurrencyStore = create<State>()(
  persist((set) => ({
    currency: 'VND',
    setCurrency: (c) => set({ currency: c }),
  }), { name: 'crm_display_currency' }),
);
```

### React Query hook — `crm/crm-ui/src/hooks/useExchangeRates.ts`

```ts
useQuery({
  queryKey: ['exchange-rates'],
  queryFn: () => api.get('/api/v1/store/exchange-rates').then(r => r.data.data),
  staleTime: 60 * 60 * 1000,
  gcTime: 2 * 60 * 60 * 1000,
});
```

### `useFormatters.ts` rewrite

Drop `useSiteSettings` dependency. Use `useCurrencyStore` + `useExchangeRates`. Math identical to storefront: `amountVnd / rate`.

### Header switcher

Mount in [crm/crm-ui/src/components/commons/MainLayout.tsx](../../../crm/crm-ui/src/components/commons/MainLayout.tsx) (which contains both `<Sider>` and the top `<Header>` — see line 25 `const { Sider, Content, Header } = Layout;`). Place switcher in the top `<Header>` next to the user avatar/menu. Dropdown with VND / USD / EUR / GBP / JPY. Show warning icon if `ratesData?.stale === true`.

### Product form labels

Update [crm/crm-ui/src/features/products/index.tsx:1016](../../../crm/crm-ui/src/features/products/index.tsx#L1016):
- `Price (USD)` → `Price (VND, base currency)`
- Add tooltip explaining the base-currency contract

### Order detail enhancement

Show customer-paid amount below VND base total:
```tsx
{order.displayCurrency !== 'VND' && (
  <Text type="secondary">
    Customer paid: {formatInCurrency(order.totalAmount / order.exchangeRate, order.displayCurrency)}
  </Text>
)}
```

### Currency Audit page

New route `/admin/products/currency-audit`. Add as a new **top-level sidebar entry** in `MainLayout.tsx` `menuItems` array (Products is currently a top-level entry, not a submenu). Recommended position: right after `Products`, labeled "Currency Audit" with `DollarOutlined` icon.

Table columns: image, title, current `price`, `suggestedVndPrice = price * rates.USD` preview, last reviewed, actions.

Row actions:
- **Convert from USD** → `POST /admin/products/:id/normalize-currency {fromCurrency:'USD'}` (multiplies price by current USD rate)
- **Mark as VND (correct)** → `POST /admin/products/:id/normalize-currency {fromCurrency:'VND'}` (sets `currencyReviewedAt` only)
- Bulk select + bulk convert
- Filter: show reviewed / unreviewed

### Cleanup of Spec B currency UI

Remove these (added in last commit, no longer correct):
- Currency + Currency Symbol fields in [crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx](../../../crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx)
- Currency + Currency Symbol fields in [crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx](../../../crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx)
- `CURRENCY_SYMBOLS` / `CURRENCY_OPTIONS` consts in both files

## Migration Plan

Six phases, ship independently for clean rollback points.

### Phase 0 — Audit script preparation (code change, no deploy yet)

- Extend `backend/scripts/audit-products.js`: add `SUSPECTED_USD` check (`price < 5000`) and `suggestedVndPrice = price * rates.USD` column to CSV output
- This change ships **with** Phase 1's deploy bundle (since the script needs the `ExchangeRate` collection populated to compute `suggestedVndPrice`)
- After Phase 1 deploys and cron has populated rates, run the script: `node backend/scripts/audit-products.js > audit.csv`
- Admin reviews CSV manually before Phase 2's interactive flow

### Phase 1 — Backend foundation

Deploy together (all backward-compatible — no consumer changes yet):
- `ExchangeRate` model + cron service
- `User.preferences`, `Order.{displayCurrency,exchangeRate}`, `Product.currencyReviewedAt` schema additions
- All 6 new endpoints (`/store/exchange-rates`, `/user/preferences`, `/admin/products/currency-audit`, `/admin/products/:id/normalize-currency`, `/admin/products/bulk-normalize-currency`, plus PATCH variants)

**Verify post-deploy:**
- `curl /api/v1/store/exchange-rates` returns populated `rates`
- `db.exchangerates.findOne()` exists with sane `rates.USD` (~25000-26000)
- Existing storefront + CRM continue working unchanged

**Rollback:** Stop cron; new endpoints unused. Schema additions are non-breaking.

### Phase 2 — Data migration (CRM Currency Audit page only)

Deploy only the new Currency Audit page (no other CRM changes yet).

- Admin opens `/admin/products/currency-audit`
- Reviews flagged products (~5-15 expected based on 54 total products)
- Converts USD-suspect ones; marks confirmed-VND ones reviewed
- After review: 100% of product prices in coherent VND base

**Verify:** Audit list empty (or only admin-skipped items remain). Spot-check 5 products on storefront — prices still sensible (e.g., Áo Dài ≈ 1.29M ₫).

**Rollback:** Manual fix per product if convert was wrong. Audit `currencyReviewedAt` timestamp lets you identify recent changes.

### Phase 3 — CRM swap (admin-only blast radius)

Deploy together:
- `useCurrencyStore` (Zustand)
- `useFormatters.ts` rewrite (drops `useSiteSettings.payment.currency`)
- CRM header currency switcher
- Removal of Currency fields from `GeneralSettingsPage.tsx` + `PaymentSettingsPage.tsx`
- Product form label update (`Price (USD)` → `Price (VND, base currency)`)
- Order detail "customer paid" footer

**Verify (manual browser test):**
- CRM Products list shows VND by default with correct magnitudes (1,290,000 ₫)
- Toggle header to USD → same product shows `$50.69` (math: 1,290,000 / 25,450)
- Toggle EUR → converts correctly
- Force `db.exchangerates.update({}, {$set:{stale:true}})` → warning icon appears

**Rollback:** CRM frontend bundle rollback. Backend untouched.

### Phase 4 — Storefront swap (customer-facing)

Deploy together:
- `exchangeRateApi.js` RTK Query slice
- `currencySlice.js` rewrite (no hardcoded rates)
- `use-currency.js` hook rewrite (reverse math)
- Currency switcher in header top bar
- User preferences sync (`getUserPreferences`, `patchUserPreferences` RTK queries)
- `use-checkout-submit.js` includes `displayCurrency` in payload
- Order success page renders from `order.displayCurrency` + `order.exchangeRate`

**Verify (Playwright E2E):**
- Anonymous user picks USD → product cards show `$X.XX` → reload → persists (cookie)
- Authed user picks EUR → logout/login → still EUR (User.preferences)
- Checkout with USD → DB order has `displayCurrency:'USD'`, `exchangeRate:25450`, `cart[].price:1290000`
- Stale rate → still renders with last-known, no crash

**Rollback:** Frontend bundle rollback. Cookies harmless if old slice loads.

### Phase 5 — Cleanup (1-2 weeks after Phase 4 burn-in)

- Remove `SiteSetting.payment.currency`, `payment.currencySymbol`, `i18n.defaultLanguage`, `i18n.supportedLanguages` field reads in backend (`store-cms.controller.js getPublicSettings`) and CRM
- Remove deprecated query keys (`['site-settings','public']`)
- Drop fields from `SiteSetting` schema via migration (`$unset`)
- Update Swagger spec at `/api-docs.json`

### Phase 6 — Hardening (deferred, separate work)

- Fallback API (frankfurter.app) when exchangerate.host fails >24h
- Admin email alert when rates are stale > 24h
- Refund-rate policy (use snapshot rate vs current rate — needs business decision)
- Cart-vs-checkout rate change UX (currently uses checkout-time rate; verify acceptable)

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| exchangerate.host outage at Phase 1 boot | Low | High (no rates) | Cron retry; first deploy seeds a manual rate doc as fallback |
| Heuristic misses USD product with `price ≥ 5000` | Low | Medium | CRM audit page allows admin to manually mark any product as USD |
| Authed user device A changes currency; device B sees DB value override local cookie | Expected | Low (intentional UX) | DB is source of truth for authed users |
| Rate stale during order placement | Low | Medium | `stale` flag visible to admin; Phase 6 adds alerting |
| Round-trip precision loss (USD 50.69 → VND → display) | None | N/A | Base is always DB VND; conversion only at render layer — no round-trip |
| Cart rate vs checkout rate change | Low | Low | Always use checkout-time rate (current behavior); acceptable for v1 |

## Decisions Log

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Base canonical currency | VND | Matches existing data; Shofy is VN-based e-commerce; avoids precision loss on data migration |
| 2 | Exchange rate source | Live API (exchangerate.host) | Free, no API key, fresh rates; backend-mediated for single source of truth |
| 2.5 | USD-priced product detection | Heuristic + admin review | Threshold `price < 5000` flags candidates; admin confirms via CRM Audit page |
| 3 | Preference storage | Storefront DB+cookie; CRM localStorage | DB for authed continuity; cookie for SSR; localStorage for CRM per-browser view |
| 4 | Order currency snapshot | Base + display + rate | Matches Stripe `amount` + `presentment_currency` pattern; correct for tax reports + customer receipts + refunds |
| 5 | Language scope | Defer to separate spec | Storefront already has next-i18next; CRM i18n is a bigger initiative |

## Open Questions

None — all forks resolved during brainstorming.

## File Touch List (preliminary)

Backend:
- New: `backend/model/ExchangeRate.js`
- New: `backend/services/exchangeRateService.js`
- New: `backend/controller/v1/exchangeRate.controller.js` (or merged into existing controller)
- Modified: `backend/model/User.js`, `backend/model/Order.js`, `backend/model/Products.js`
- Modified: `backend/index.js` (wire cron)
- Modified: `backend/routes/v1/store.js`, `backend/routes/v1/user.js`, `backend/routes/v1/admin.js`
- Modified: `backend/controller/v1/store-cms.controller.js` (drop deprecated currency reads in `getPublicSettings`)
- Modified: `backend/controller/v1/order.controller.js` (snapshot exchange rate)
- Modified: `backend/controller/v1/user.controller.js` (preferences endpoints)
- Modified: `backend/controller/v1/admin.product.controller.js` (audit endpoints)
- Modified: `backend/scripts/audit-products.js` (USD heuristic)

Storefront:
- New: `frontend/src/redux/features/exchangeRateApi.js`
- New: `frontend/src/redux/features/userPreferencesApi.js`
- New: `frontend/src/components/common/CurrencySwitcher.jsx`
- Modified: `frontend/src/redux/features/currencySlice.js` (rewrite)
- Modified: `frontend/src/hooks/use-currency.js` (rewrite, reverse math)
- Modified: `frontend/src/layout/wrapper.jsx` (mount switcher; preference sync)
- Modified: `frontend/src/layout/headers/header-top-right.jsx` (or equivalent)
- Modified: `frontend/src/hooks/useCheckoutSubmit.js` (include displayCurrency)
- Modified: `frontend/src/redux/store.js` (register exchangeRateApi reducer)

CRM:
- New: `crm/crm-ui/src/stores/useCurrencyStore.ts`
- New: `crm/crm-ui/src/hooks/useExchangeRates.ts`
- New: `crm/crm-ui/src/components/commons/CurrencySwitcher.tsx`
- New: `crm/crm-ui/src/features/products/CurrencyAuditPage.tsx`
- Modified: `crm/crm-ui/src/hooks/useFormatters.ts` (rewrite)
- Modified: `crm/crm-ui/src/components/commons/MainLayout.tsx` (mount switcher in top Header; add sidebar menu entry)
- Modified: `crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx` (remove Currency fields)
- Modified: `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx` (remove Currency fields)
- Modified: `crm/crm-ui/src/features/products/index.tsx` (label update; order detail enhancement)
- Modified: `crm/crm-ui/src/routes/index.tsx` (Currency Audit route)
- Sidebar entry for Currency Audit is added in the same `MainLayout.tsx` `menuItems` array (no separate sidebar file)
