# Multi-Currency Per-User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace site-wide currency setting with per-user currency preference + real exchange-rate conversion (VND base, live API).

**Architecture:** MongoDB stores all prices in VND. Backend cron fetches rates from exchangerate.host hourly into a single `ExchangeRate` document. Storefront + CRM read rates via public REST endpoint, convert at the render layer. User preference: storefront authed → `User.preferences`; anonymous → cookie; CRM admin → localStorage. Orders snapshot `displayCurrency` + `exchangeRate` at creation time.

**Tech Stack:**
- Backend: Express 4 + Mongoose + Jest/supertest + node-cron + axios
- Storefront: Next.js 13 (Pages Router) + Redux Toolkit + RTK Query + Playwright
- CRM: Vite + React 19 + TypeScript + Ant Design 6 + Zustand + React Query

**Reference spec:** [docs/superpowers/specs/2026-05-20-multi-currency-per-user-design.md](../specs/2026-05-20-multi-currency-per-user-design.md)

**Rollout note:** This plan implements code for Phases 1–5. Deploy phase-by-phase per the spec's Migration Plan; do NOT ship Phase 4 before Phase 2 data migration completes.

---

## File Touch Map

**Backend — new:**
- `backend/model/ExchangeRate.js`
- `backend/services/exchangeRateService.js`
- `backend/controller/v1/exchangeRate.controller.js`
- `backend/controller/v1/userPreferences.controller.js`
- `backend/controller/v1/currencyAudit.controller.js`
- `backend/tests/exchange-rates.test.js`
- `backend/tests/user-preferences.test.js`
- `backend/tests/currency-audit.test.js`

**Backend — modify:**
- `backend/model/User.js`, `backend/model/Order.js`, `backend/model/Products.js`
- `backend/index.js`
- `backend/routes/v1/store.js`, `backend/routes/v1/user.js`, `backend/routes/v1/admin.js`
- `backend/controller/v1/order.controller.js`, `backend/controller/v1/store-cms.controller.js`
- `backend/scripts/audit-products.js`

**CRM — new:**
- `crm/crm-ui/src/stores/useCurrencyStore.ts`
- `crm/crm-ui/src/hooks/useExchangeRates.ts`
- `crm/crm-ui/src/components/commons/CurrencySwitcher.tsx`
- `crm/crm-ui/src/features/products/CurrencyAuditPage.tsx`
- `crm/crm-ui/src/services/currencyAudit.ts`

**CRM — modify:**
- `crm/crm-ui/src/hooks/useFormatters.ts`, `crm/crm-ui/src/hooks/useSiteSettings.ts`
- `crm/crm-ui/src/components/commons/MainLayout.tsx`
- `crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx`, `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx`
- `crm/crm-ui/src/features/products/index.tsx`
- `crm/crm-ui/src/App.tsx` (or routes file)

**Storefront — new:**
- `frontend/src/redux/features/exchangeRateApi.js`
- `frontend/src/redux/features/userPreferencesApi.js`
- `frontend/src/components/common/CurrencySwitcher.jsx`

**Storefront — modify:**
- `frontend/src/redux/features/currencySlice.js`
- `frontend/src/hooks/use-currency.js`
- `frontend/src/redux/store.js`
- `frontend/src/layout/wrapper.jsx`
- `frontend/src/layout/headers/header-top-right.jsx`
- `frontend/src/hooks/useCheckoutSubmit.js`

---

# Phase 1 — Backend Foundation

## Task 1.1: ExchangeRate model

**Files:**
- Create: `backend/model/ExchangeRate.js`

- [ ] **Step 1: Create model file**

```js
// backend/model/ExchangeRate.js
const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema(
  {
    base: { type: String, default: 'VND', immutable: true },
    rates: {
      USD: { type: Number, required: true },
      EUR: { type: Number, required: true },
      GBP: { type: Number, required: true },
      JPY: { type: Number, required: true },
    },
    source: { type: String, default: 'exchangerate.host' },
    stale: { type: Boolean, default: false },
    fetchedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model('ExchangeRate', exchangeRateSchema);
```

- [ ] **Step 2: Commit**

```bash
git add backend/model/ExchangeRate.js
git commit -m "feat(backend): add ExchangeRate model"
```

---

## Task 1.2: Exchange rate service (cron + fetch)

**Files:**
- Create: `backend/services/exchangeRateService.js`

- [ ] **Step 1: Verify node-cron + axios available**

```bash
node -e "require('node-cron'); require('axios'); console.log('ok')"
```
Expected: `ok`. If missing: `cd backend && npm install node-cron axios`.

- [ ] **Step 2: Create service**

```js
// backend/services/exchangeRateService.js
const cron = require('node-cron');
const axios = require('axios');
const ExchangeRate = require('../model/ExchangeRate');

const API_URL = 'https://api.exchangerate.host/latest?base=VND&symbols=USD,EUR,GBP,JPY';
const TARGETS = ['USD', 'EUR', 'GBP', 'JPY'];

async function refreshRates() {
  try {
    const { data } = await axios.get(API_URL, { timeout: 10_000 });
    if (!data || !data.rates) throw new Error('Invalid API response');

    // API returns "1 VND = X target". We invert to "1 target = X VND".
    const rates = {};
    for (const code of TARGETS) {
      const r = data.rates[code];
      if (!r || r <= 0) throw new Error(`Missing rate for ${code}`);
      rates[code] = 1 / r;
    }

    await ExchangeRate.findOneAndUpdate(
      {},
      { base: 'VND', rates, source: 'exchangerate.host', stale: false, fetchedAt: new Date() },
      { upsert: true, new: true, runValidators: true },
    );
    console.log('[exchangeRate] refreshed:', rates);
  } catch (err) {
    console.error('[exchangeRate] refresh failed:', err.message);
    await ExchangeRate.updateOne({}, { $set: { stale: true } });
  }
}

function startCron() {
  cron.schedule('0 * * * *', refreshRates); // every hour, top of hour
  refreshRates(); // initial fetch on boot
}

module.exports = { startCron, refreshRates };
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/exchangeRateService.js
git commit -m "feat(backend): add exchange rate cron service"
```

---

## Task 1.3: Wire cron in backend/index.js

**Files:**
- Modify: `backend/index.js`

- [ ] **Step 1: Locate the post-`mongoose.connect` block**

```bash
grep -n "mongoose.connect\|MONGO_URI" backend/index.js | head -5
```
Note the line number where the connection happens.

- [ ] **Step 2: Add startCron call after successful connect**

Add this require near the top of `backend/index.js` with other requires:

```js
const { startCron: startExchangeRateCron } = require('./services/exchangeRateService');
```

Inside the existing `.then()` of `mongoose.connect(...)`, append:

```js
.then(() => {
  console.log('MongoDB connected');
  startExchangeRateCron();
})
```

(Merge with existing `.then` callback if one exists — don't introduce a duplicate.)

- [ ] **Step 3: Manual verify**

```bash
cd backend && npm run dev
```
Expected logs within 10s: `[exchangeRate] refreshed: { USD: ~25000, EUR: ~27000, GBP: ~32000, JPY: ~170 }`.

If exchangerate.host is unreachable in your network, expected log: `[exchangeRate] refresh failed: <reason>`. Move on — Phase 6 hardening covers fallback.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add backend/index.js
git commit -m "feat(backend): wire exchange rate cron on boot"
```

---

## Task 1.4: User model — preferences subdoc

**Files:**
- Modify: `backend/model/User.js`

- [ ] **Step 1: Locate the User schema**

```bash
grep -n "new mongoose.Schema\|preferences" backend/model/User.js | head -10
```

- [ ] **Step 2: Add preferences field**

Inside the schema fields object (before closing `}`):

```js
preferences: {
  currency: { type: String, enum: ['VND', 'USD', 'EUR', 'GBP', 'JPY'], default: 'VND' },
  language: { type: String, enum: ['vi', 'en'], default: 'vi' },
},
```

- [ ] **Step 3: Commit**

```bash
git add backend/model/User.js
git commit -m "feat(backend): add User.preferences (currency, language)"
```

---

## Task 1.5: Order model — display currency snapshot

**Files:**
- Modify: `backend/model/Order.js`

- [ ] **Step 1: Add fields to Order schema**

Inside the schema fields object:

```js
displayCurrency: { type: String, default: 'VND' },
exchangeRate: { type: Number, default: 1 },
```

- [ ] **Step 2: Commit**

```bash
git add backend/model/Order.js
git commit -m "feat(backend): add displayCurrency + exchangeRate snapshot to Order"
```

---

## Task 1.6: Product model — currencyReviewedAt

**Files:**
- Modify: `backend/model/Products.js`

- [ ] **Step 1: Add field**

```js
currencyReviewedAt: { type: Date, default: null },
```

- [ ] **Step 2: Commit**

```bash
git add backend/model/Products.js
git commit -m "feat(backend): add Product.currencyReviewedAt audit field"
```

---

## Task 1.7: Public exchange rates endpoint (TDD)

**Files:**
- Create: `backend/tests/exchange-rates.test.js`
- Create: `backend/controller/v1/exchangeRate.controller.js`
- Modify: `backend/routes/v1/store.js`

- [ ] **Step 1: Write failing test**

```js
// backend/tests/exchange-rates.test.js
const request = require('supertest');
const app = require('../index');

describe('GET /api/v1/store/exchange-rates', () => {
  test('returns rates document with VND base', async () => {
    const res = await request(app).get('/api/v1/store/exchange-rates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.base).toBe('VND');
    expect(res.body.data.rates).toBeDefined();
  });

  test('response includes Cache-Control header', async () => {
    const res = await request(app).get('/api/v1/store/exchange-rates');
    expect(res.headers['cache-control']).toMatch(/max-age=3600/);
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
cd backend && npx jest exchange-rates --runInBand
```
Expected: FAIL with 404 (route not registered yet).

- [ ] **Step 3: Create controller**

```js
// backend/controller/v1/exchangeRate.controller.js
const ExchangeRate = require('../../model/ExchangeRate');
const respond = require('../../utils/respond');

exports.getExchangeRates = async (req, res, next) => {
  try {
    let doc = await ExchangeRate.findOne({});
    if (!doc) {
      // Cron may not have fired yet on first boot — seed defaults
      doc = await ExchangeRate.create({
        base: 'VND',
        rates: { USD: 25450, EUR: 27600, GBP: 32100, JPY: 168 },
        source: 'seed',
        stale: true,
        fetchedAt: new Date(),
      });
    }
    res.set('Cache-Control', 'public, max-age=3600');
    return respond.success(res, {
      base: doc.base,
      rates: doc.rates,
      stale: doc.stale,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 4: Register route**

In `backend/routes/v1/store.js`, add the controller import and route:

```js
const exchangeRateCtrl = require('../../controller/v1/exchangeRate.controller');
// ... existing routes ...
router.get('/exchange-rates', exchangeRateCtrl.getExchangeRates);
```

- [ ] **Step 5: Run test, expect pass**

```bash
cd backend && npx jest exchange-rates --runInBand
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/tests/exchange-rates.test.js backend/controller/v1/exchangeRate.controller.js backend/routes/v1/store.js
git commit -m "feat(backend): GET /api/v1/store/exchange-rates endpoint"
```

---

## Task 1.8: User preferences endpoints (TDD)

**Files:**
- Create: `backend/tests/user-preferences.test.js`
- Create: `backend/controller/v1/userPreferences.controller.js`
- Modify: `backend/routes/v1/user.js`

- [ ] **Step 1: Write failing tests**

```js
// backend/tests/user-preferences.test.js
const request = require('supertest');
const app = require('../index');

describe('User preferences endpoints', () => {
  test('GET /api/v1/user/preferences requires auth', async () => {
    const res = await request(app).get('/api/v1/user/preferences');
    expect(res.status).toBe(401);
  });

  test('PATCH /api/v1/user/preferences requires auth', async () => {
    const res = await request(app).patch('/api/v1/user/preferences').send({ currency: 'USD' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test, expect failure (404)**

```bash
cd backend && npx jest user-preferences --runInBand
```

- [ ] **Step 3: Create controller**

```js
// backend/controller/v1/userPreferences.controller.js
const User = require('../../model/User');
const respond = require('../../utils/respond');
const { ApiError } = require('../../utils/ApiError');

const CURRENCY_ENUM = ['VND', 'USD', 'EUR', 'GBP', 'JPY'];
const LANGUAGE_ENUM = ['vi', 'en'];

exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('preferences').lean();
    return respond.success(res, user?.preferences ?? { currency: 'VND', language: 'vi' });
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { currency, language } = req.body;
    const update = {};
    if (currency !== undefined) {
      if (!CURRENCY_ENUM.includes(currency)) throw new ApiError(400, 'Invalid currency');
      update['preferences.currency'] = currency;
    }
    if (language !== undefined) {
      if (!LANGUAGE_ENUM.includes(language)) throw new ApiError(400, 'Invalid language');
      update['preferences.language'] = language;
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'No fields to update');

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true })
      .select('preferences')
      .lean();
    return respond.success(res, user.preferences, 'Preferences updated');
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 4: Register routes**

In `backend/routes/v1/user.js`, ensure `verifyToken` middleware is applied:

```js
const userPrefsCtrl = require('../../controller/v1/userPreferences.controller');
const verifyToken = require('../../middleware/verifyToken'); // adjust if path differs

router.get('/preferences', verifyToken, userPrefsCtrl.getPreferences);
router.patch('/preferences', verifyToken, userPrefsCtrl.updatePreferences);
```

(Confirm the exact path of `verifyToken` by checking existing routes in the same file.)

- [ ] **Step 5: Run test, expect pass**

```bash
cd backend && npx jest user-preferences --runInBand
```

- [ ] **Step 6: Commit**

```bash
git add backend/tests/user-preferences.test.js backend/controller/v1/userPreferences.controller.js backend/routes/v1/user.js
git commit -m "feat(backend): user preferences GET + PATCH endpoints"
```

---

## Task 1.9: Currency audit + normalize endpoints (TDD)

**Files:**
- Create: `backend/tests/currency-audit.test.js`
- Create: `backend/controller/v1/currencyAudit.controller.js`
- Modify: `backend/routes/v1/admin.js`

- [ ] **Step 1: Write failing tests**

```js
// backend/tests/currency-audit.test.js
const request = require('supertest');
const app = require('../index');

describe('Currency audit endpoints', () => {
  test('GET /api/v1/admin/products/currency-audit requires admin auth', async () => {
    const res = await request(app).get('/api/v1/admin/products/currency-audit');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/admin/products/:id/normalize-currency requires admin auth', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products/507f1f77bcf86cd799439011/normalize-currency')
      .send({ fromCurrency: 'USD' });
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/admin/products/bulk-normalize-currency requires admin auth', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products/bulk-normalize-currency')
      .send({ ids: [], fromCurrency: 'USD' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test, expect failure (404)**

```bash
cd backend && npx jest currency-audit --runInBand
```

- [ ] **Step 3: Create controller**

```js
// backend/controller/v1/currencyAudit.controller.js
const mongoose = require('mongoose');
const Products = require('../../model/Products');
const ExchangeRate = require('../../model/ExchangeRate');
const respond = require('../../utils/respond');
const { ApiError } = require('../../utils/ApiError');
const { getPaginationParams } = require('../../utils/pagination');

const SUSPECT_THRESHOLD = 5000;
const ALLOWED_FROM = ['USD', 'VND'];

exports.listAuditCandidates = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const showReviewed = req.query.showReviewed === 'true';

    const filter = { price: { $lt: SUSPECT_THRESHOLD, $gt: 0 } };
    if (!showReviewed) filter.currencyReviewedAt = null;

    const [totalItems, items, rateDoc] = await Promise.all([
      Products.countDocuments(filter),
      Products.find(filter)
        .select('title slug price discount img imageURLs currencyReviewedAt')
        .sort({ price: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExchangeRate.findOne({}).lean(),
    ]);

    const usdRate = rateDoc?.rates?.USD ?? 25450;
    const enriched = items.map((p) => ({
      ...p,
      suggestedVndPrice: Math.round(p.price * usdRate),
    }));

    return respond.success(res, {
      items: enriched,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
      currentRate: usdRate,
    });
  } catch (err) {
    next(err);
  }
};

exports.normalizeOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fromCurrency } = req.body;

    if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid product id');
    if (!ALLOWED_FROM.includes(fromCurrency)) throw new ApiError(400, 'Invalid fromCurrency');

    const product = await Products.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');

    if (fromCurrency === 'USD') {
      const rateDoc = await ExchangeRate.findOne({});
      const rate = rateDoc?.rates?.USD;
      if (!rate) throw new ApiError(500, 'Exchange rate unavailable');
      product.price = Math.round(product.price * rate);
    }
    product.currencyReviewedAt = new Date();
    await product.save();

    return respond.success(res, {
      _id: product._id,
      title: product.title,
      price: product.price,
      currencyReviewedAt: product.currencyReviewedAt,
    }, 'Product currency normalized');
  } catch (err) {
    next(err);
  }
};

exports.normalizeBulk = async (req, res, next) => {
  try {
    const { ids, fromCurrency } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) throw new ApiError(400, 'ids required');
    if (!ALLOWED_FROM.includes(fromCurrency)) throw new ApiError(400, 'Invalid fromCurrency');

    const rateDoc = await ExchangeRate.findOne({});
    const rate = rateDoc?.rates?.USD;
    if (fromCurrency === 'USD' && !rate) throw new ApiError(500, 'Exchange rate unavailable');

    let updated = 0;
    for (const id of ids) {
      if (!mongoose.isValidObjectId(id)) continue;
      const product = await Products.findById(id);
      if (!product) continue;
      if (fromCurrency === 'USD') {
        product.price = Math.round(product.price * rate);
      }
      product.currencyReviewedAt = new Date();
      await product.save();
      updated++;
    }

    return respond.success(res, { updated }, `${updated} product(s) normalized`);
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 4: Register routes**

In `backend/routes/v1/admin.js`, add:

```js
const currencyAuditCtrl = require('../../controller/v1/currencyAudit.controller');
const verifyToken = require('../../middleware/verifyToken'); // match the existing path used in this file
const authorization = require('../../middleware/authorization');

router.get('/products/currency-audit', verifyToken, authorization('Admin', 'Super Admin', 'Manager'), currencyAuditCtrl.listAuditCandidates);
router.post('/products/bulk-normalize-currency', verifyToken, authorization('Admin', 'Super Admin'), currencyAuditCtrl.normalizeBulk);
router.post('/products/:id/normalize-currency', verifyToken, authorization('Admin', 'Super Admin'), currencyAuditCtrl.normalizeOne);
```

**Order matters:** the `:id` route must be AFTER `currency-audit` and `bulk-normalize-currency` literals, otherwise Express matches them as ids.

- [ ] **Step 5: Run test, expect pass**

```bash
cd backend && npx jest currency-audit --runInBand
```

- [ ] **Step 6: Commit**

```bash
git add backend/tests/currency-audit.test.js backend/controller/v1/currencyAudit.controller.js backend/routes/v1/admin.js
git commit -m "feat(backend): currency audit + normalize endpoints"
```

---

## Task 1.10: Order controller — snapshot exchangeRate at creation

**Files:**
- Modify: `backend/controller/v1/order.controller.js`

- [ ] **Step 1: Locate the order creation handler**

```bash
grep -n "createOrder\|exports.create\|new Order" backend/controller/v1/order.controller.js | head -5
```

- [ ] **Step 2: Add snapshot logic before saving order**

Inside the createOrder handler, before `new Order(...)` (or before `.save()`):

```js
const ExchangeRate = require('../../model/ExchangeRate'); // add at top

// ... inside handler ...
const displayCurrency = req.body.displayCurrency || 'VND';
let exchangeRate = 1;
if (displayCurrency !== 'VND') {
  const rateDoc = await ExchangeRate.findOne({});
  exchangeRate = rateDoc?.rates?.[displayCurrency] ?? 1;
}

const order = new Order({
  ...req.body,           // existing fields
  displayCurrency,
  exchangeRate,
});
```

Adapt to the existing handler's style (it may use spread or explicit field mapping — preserve that pattern).

- [ ] **Step 3: Commit**

```bash
git add backend/controller/v1/order.controller.js
git commit -m "feat(backend): snapshot displayCurrency + exchangeRate on order creation"
```

---

## Task 1.11: Audit script — USD heuristic

**Files:**
- Modify: `backend/scripts/audit-products.js`

- [ ] **Step 1: Add SUSPECTED_USD check**

Locate the check loop that builds issues. Add a new check:

```js
const SUSPECT_USD_THRESHOLD = 5000;

// Inside the per-product loop, after existing checks:
if (product.price > 0 && product.price < SUSPECT_USD_THRESHOLD && !product.currencyReviewedAt) {
  issues.push({
    productId: product._id.toString(),
    title: product.title,
    severity: 'low',
    code: 'SUSPECTED_USD',
    message: `price ${product.price} is below ${SUSPECT_USD_THRESHOLD} — possibly USD instead of VND base`,
    suggestedVndPrice: '<requires ExchangeRate doc; see GET /api/v1/store/exchange-rates>',
  });
}
```

If `suggestedVndPrice` should be computed in-script, load the ExchangeRate doc once before the loop:

```js
const ExchangeRate = require('../model/ExchangeRate'); // add at top
const rateDoc = await ExchangeRate.findOne({});
const usdRate = rateDoc?.rates?.USD ?? null;

// then in the loop:
suggestedVndPrice: usdRate ? Math.round(product.price * usdRate) : null,
```

- [ ] **Step 2: Run script against dev DB to verify output**

```bash
cd backend && node scripts/audit-products.js
```
Expected: CSV/console output includes new `SUSPECTED_USD` rows when applicable.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/audit-products.js
git commit -m "feat(backend): add SUSPECTED_USD heuristic to product audit script"
```

---

## Task 1.12: Phase 1 — full backend test suite

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npx jest --runInBand
```
Expected: all tests pass, including new exchange-rates, user-preferences, currency-audit.

- [ ] **Step 2: Manual sanity-check endpoints**

In one terminal: `cd backend && npm run dev`

In another terminal (replace `<ADMIN_TOKEN>` if you have one; otherwise check the 401 responses):

```bash
curl http://localhost:7001/api/v1/store/exchange-rates | python3 -m json.tool
```
Expected: JSON with `data.base = 'VND'` and `data.rates.USD` populated.

```bash
curl http://localhost:7001/api/v1/user/preferences
```
Expected: 401 (no token).

```bash
curl http://localhost:7001/api/v1/admin/products/currency-audit
```
Expected: 401 (no token).

Stop the dev server.

- [ ] **Step 3: Phase 1 deploy checkpoint (do not deploy yet if rolling out phase-by-phase)**

No commit. This is the deployment gate per spec Phase 1.

---

# Phase 2 — CRM Currency Audit Page

## Task 2.1: useExchangeRates hook

**Files:**
- Create: `crm/crm-ui/src/hooks/useExchangeRates.ts`

- [ ] **Step 1: Create hook**

```ts
// crm/crm-ui/src/hooks/useExchangeRates.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface ExchangeRateData {
  base: 'VND';
  rates: { USD: number; EUR: number; GBP: number; JPY: number };
  stale: boolean;
  updatedAt: string;
}

export function useExchangeRates() {
  return useQuery<ExchangeRateData>({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const res = await api.get('/api/v1/store/exchange-rates');
      return res.data?.data as ExchangeRateData;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/hooks/useExchangeRates.ts
git commit -m "feat(crm): add useExchangeRates hook"
```

---

## Task 2.2: Currency audit API service module

**Files:**
- Create: `crm/crm-ui/src/services/currencyAudit.ts`

- [ ] **Step 1: Create service module**

```ts
// crm/crm-ui/src/services/currencyAudit.ts
import api from './api';

export interface AuditProduct {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discount?: number;
  img?: string;
  imageURLs?: Array<{ img: string }>;
  currencyReviewedAt: string | null;
  suggestedVndPrice: number;
}

export interface AuditResponse {
  items: AuditProduct[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
  currentRate: number;
}

export const currencyAuditApi = {
  list: async (params: { page?: number; limit?: number; showReviewed?: boolean }) => {
    const res = await api.get('/api/v1/admin/products/currency-audit', { params });
    return res.data.data as AuditResponse;
  },
  normalizeOne: async (id: string, fromCurrency: 'USD' | 'VND') => {
    const res = await api.post(`/api/v1/admin/products/${id}/normalize-currency`, { fromCurrency });
    return res.data.data;
  },
  normalizeBulk: async (ids: string[], fromCurrency: 'USD' | 'VND') => {
    const res = await api.post('/api/v1/admin/products/bulk-normalize-currency', { ids, fromCurrency });
    return res.data.data as { updated: number };
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add crm/crm-ui/src/services/currencyAudit.ts
git commit -m "feat(crm): add currencyAudit API service"
```

---

## Task 2.3: Currency Audit page

**Files:**
- Create: `crm/crm-ui/src/features/products/CurrencyAuditPage.tsx`

- [ ] **Step 1: Create page**

```tsx
// crm/crm-ui/src/features/products/CurrencyAuditPage.tsx
import { useState } from 'react';
import { Button, Card, Image, Popconfirm, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { TableProps } from 'antd';
import { DollarOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currencyAuditApi, type AuditProduct } from '@/services/currencyAudit';
import PageHeader from '@/components/commons/PageHeader';

const { Title, Text } = Typography;

export default function CurrencyAuditPage() {
  const [page, setPage] = useState(1);
  const [showReviewed, setShowReviewed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['currency-audit', { page, showReviewed }],
    queryFn: () => currencyAuditApi.list({ page, limit: 20, showReviewed }),
  });

  const normalizeOne = useMutation({
    mutationFn: ({ id, fromCurrency }: { id: string; fromCurrency: 'USD' | 'VND' }) =>
      currencyAuditApi.normalizeOne(id, fromCurrency),
    onSuccess: () => {
      message.success('Product reviewed');
      queryClient.invalidateQueries({ queryKey: ['currency-audit'] });
    },
    onError: () => message.error('Failed to update product'),
  });

  const normalizeBulk = useMutation({
    mutationFn: ({ ids, fromCurrency }: { ids: string[]; fromCurrency: 'USD' | 'VND' }) =>
      currencyAuditApi.normalizeBulk(ids, fromCurrency),
    onSuccess: (res) => {
      message.success(`${res.updated} products updated`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['currency-audit'] });
    },
    onError: () => message.error('Bulk update failed'),
  });

  const columns: TableProps<AuditProduct>['columns'] = [
    {
      title: 'Image',
      dataIndex: 'img',
      key: 'img',
      width: 80,
      render: (img, record) => (
        <Image
          src={img || record.imageURLs?.[0]?.img}
          alt={record.title}
          width={48}
          height={48}
          fallback="https://placehold.co/48"
          style={{ objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (t, r) => (
        <Space direction="vertical" size={2}>
          <Text strong>{t}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>/{r.slug}</Text>
        </Space>
      ),
    },
    {
      title: 'Current Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (p: number) => <Text strong style={{ color: '#fa8c16' }}>{p.toLocaleString('vi-VN')} ₫</Text>,
    },
    {
      title: 'If USD → VND',
      dataIndex: 'suggestedVndPrice',
      key: 'suggestedVndPrice',
      width: 160,
      align: 'right',
      render: (v: number) => <Text type="secondary">{v?.toLocaleString('vi-VN') ?? '—'} ₫</Text>,
    },
    {
      title: 'Reviewed',
      dataIndex: 'currencyReviewedAt',
      key: 'currencyReviewedAt',
      width: 130,
      render: (d: string | null) => d ? <Tag color="green" icon={<CheckCircleOutlined />}>Reviewed</Tag> : <Tag color="orange" icon={<WarningOutlined />}>Pending</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title={`Convert ${record.title} from USD?`}
            description={`Price will become ${record.suggestedVndPrice?.toLocaleString('vi-VN')} ₫`}
            onConfirm={() => normalizeOne.mutate({ id: record._id, fromCurrency: 'USD' })}
          >
            <Button size="small" type="primary" danger>Convert from USD</Button>
          </Popconfirm>
          <Button
            size="small"
            onClick={() => normalizeOne.mutate({ id: record._id, fromCurrency: 'VND' })}
          >
            Mark as VND
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Currency Audit" subTitle="Review products with suspicious USD-magnitude prices and normalize them to VND base." />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Space>
            <Switch checked={showReviewed} onChange={setShowReviewed} />
            <Text>Show reviewed products</Text>
          </Space>
          {selectedIds.length > 0 && (
            <Space>
              <Text>{selectedIds.length} selected</Text>
              <Popconfirm
                title={`Convert ${selectedIds.length} products from USD?`}
                onConfirm={() => normalizeBulk.mutate({ ids: selectedIds, fromCurrency: 'USD' })}
              >
                <Button type="primary" danger icon={<DollarOutlined />}>Bulk Convert from USD</Button>
              </Popconfirm>
              <Button onClick={() => normalizeBulk.mutate({ ids: selectedIds, fromCurrency: 'VND' })}>
                Bulk Mark as VND
              </Button>
            </Space>
          )}
          <Text type="secondary">Current USD→VND rate: {data?.currentRate?.toLocaleString('vi-VN') ?? '—'}</Text>
        </Space>
      </Card>

      <Table<AuditProduct>
        rowKey="_id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items ?? []}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.pagination.totalItems ?? 0,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/features/products/CurrencyAuditPage.tsx
git commit -m "feat(crm): add Currency Audit page"
```

---

## Task 2.4: Register Currency Audit route + sidebar entry

**Files:**
- Modify: `crm/crm-ui/src/components/commons/MainLayout.tsx`
- Modify: route registry (find the actual file via `grep -l 'createBrowserRouter\\|Routes\\|Route path' crm/crm-ui/src/ -r`)

- [ ] **Step 1: Locate the route registry**

```bash
grep -rn "createBrowserRouter\|<Route path" crm/crm-ui/src/ | head -10
```
Note which file owns route definitions (often `App.tsx` or `routes/index.tsx`).

- [ ] **Step 2: Add lazy import + route**

In the route registry file, add:

```ts
const CurrencyAuditPage = lazy(() => import('@/features/products/CurrencyAuditPage'));

// In the routes array / element list:
<Route path="/products/currency-audit" element={<CurrencyAuditPage />} />
```

(Adapt to existing pattern — if using `createBrowserRouter` with an array, add an object instead of JSX.)

- [ ] **Step 3: Add sidebar entry**

In `crm/crm-ui/src/components/commons/MainLayout.tsx`, locate the `menuItems` array (search `key: '/products'`). Add a new entry directly after Products:

```ts
import { DollarOutlined } from '@ant-design/icons';

// In menuItems array, after { key: '/products', ... }:
{ key: '/products/currency-audit', label: 'Currency Audit', path: '/products/currency-audit', icon: <DollarOutlined /> },
```

Match the existing entry shape (some have `icon`, some don't — keep consistency).

- [ ] **Step 4: Manual verify**

```bash
cd crm/crm-ui && npm run dev
```

Navigate to `/products/currency-audit`. Expected: page renders with empty table (or items if dev DB has suspect products). Toggle "Show reviewed" works.

- [ ] **Step 5: Commit**

```bash
git add crm/crm-ui/src/components/commons/MainLayout.tsx <route-file-you-modified>
git commit -m "feat(crm): register Currency Audit route + sidebar entry"
```

---

# Phase 3 — CRM Swap

## Task 3.1: useCurrencyStore (Zustand persist)

**Files:**
- Create: `crm/crm-ui/src/stores/useCurrencyStore.ts`

- [ ] **Step 1: Create store**

```ts
// crm/crm-ui/src/stores/useCurrencyStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'GBP' | 'JPY';

interface State {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}

export const useCurrencyStore = create<State>()(
  persist(
    (set) => ({
      currency: 'VND',
      setCurrency: (c) => set({ currency: c }),
    }),
    { name: 'crm_display_currency' },
  ),
);
```

- [ ] **Step 2: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/stores/useCurrencyStore.ts
git commit -m "feat(crm): add useCurrencyStore (Zustand + localStorage)"
```

---

## Task 3.2: Rewrite useFormatters

**Files:**
- Modify: `crm/crm-ui/src/hooks/useFormatters.ts`

- [ ] **Step 1: Replace content**

```ts
// crm/crm-ui/src/hooks/useFormatters.ts
import { useCurrencyStore, type CurrencyCode } from '@/stores/useCurrencyStore';
import { useExchangeRates } from './useExchangeRates';

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; decimals: number; symbol: string }> = {
  VND: { locale: 'vi-VN', decimals: 0, symbol: '₫' },
  USD: { locale: 'en-US', decimals: 2, symbol: '$' },
  EUR: { locale: 'de-DE', decimals: 2, symbol: '€' },
  GBP: { locale: 'en-GB', decimals: 2, symbol: '£' },
  JPY: { locale: 'ja-JP', decimals: 0, symbol: '¥' },
};

export interface Formatters {
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  currency: CurrencyCode;
  isStale: boolean;
}

export function useFormatters(): Formatters {
  const currency = useCurrencyStore((s) => s.currency);
  const { data: ratesData } = useExchangeRates();
  const config = CURRENCY_CONFIG[currency];
  const rate = currency === 'VND' ? 1 : (ratesData?.rates?.[currency] ?? null);

  return {
    formatCurrency: (amountVnd: number) => {
      const num = Number(amountVnd);
      if (!Number.isFinite(num)) return '';
      if (currency === 'VND' || !rate) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
      }
      const converted = num / rate;
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      }).format(converted);
    },
    formatDate: (s: string) =>
      new Date(s).toLocaleDateString(config.locale, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    currency,
    isStale: ratesData?.stale ?? false,
  };
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```
Expected: no errors. If `useSiteSettings` was the only consumer of `data?.payment?.currency` in this hook, the rewrite drops that dependency cleanly.

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/hooks/useFormatters.ts
git commit -m "refactor(crm): rewrite useFormatters to use Zustand store + exchange rates"
```

---

## Task 3.3: CurrencySwitcher component

**Files:**
- Create: `crm/crm-ui/src/components/commons/CurrencySwitcher.tsx`

- [ ] **Step 1: Create component**

```tsx
// crm/crm-ui/src/components/commons/CurrencySwitcher.tsx
import { Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, WarningOutlined } from '@ant-design/icons';
import { useCurrencyStore, type CurrencyCode } from '@/stores/useCurrencyStore';
import { useExchangeRates } from '@/hooks/useExchangeRates';

const OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'VND', label: 'VND — Vietnamese Dong', symbol: '₫' },
  { code: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { code: 'JPY', label: 'JPY — Japanese Yen', symbol: '¥' },
];

export default function CurrencySwitcher() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const { data: ratesData } = useExchangeRates();
  const current = OPTIONS.find((o) => o.code === currency)!;

  const items: MenuProps['items'] = OPTIONS.map((o) => ({
    key: o.code,
    label: `${o.code} ${o.symbol}  ${o.label}`,
    onClick: () => setCurrency(o.code),
  }));

  return (
    <Dropdown menu={{ items, selectedKeys: [currency] }}>
      <Button type="text" size="small">
        {currency} {current.symbol}
        {ratesData?.stale && (
          <Tooltip title="Exchange rate may be outdated">
            <WarningOutlined style={{ color: '#faad14', marginLeft: 4 }} />
          </Tooltip>
        )}
        <DownOutlined style={{ marginLeft: 6, fontSize: 10 }} />
      </Button>
    </Dropdown>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/components/commons/CurrencySwitcher.tsx
git commit -m "feat(crm): add CurrencySwitcher component"
```

---

## Task 3.4: Mount switcher in MainLayout Header

**Files:**
- Modify: `crm/crm-ui/src/components/commons/MainLayout.tsx`

- [ ] **Step 1: Locate the Header content (line 317 area has `items={[`)**

```bash
grep -n "Header\|items=\[" crm/crm-ui/src/components/commons/MainLayout.tsx | head -10
```

- [ ] **Step 2: Add CurrencySwitcher next to the user menu**

Import at top:
```ts
import CurrencySwitcher from './CurrencySwitcher';
```

Inside the `<Header>` element JSX (next to existing user/logout controls), add:
```tsx
<CurrencySwitcher />
```

Place it before the user avatar/menu so it sits to the left.

- [ ] **Step 3: Manual verify**

```bash
cd crm/crm-ui && npm run dev
```
Open CRM. Expected: switcher visible in top header. Click → dropdown with 5 options. Pick USD → all currency displays across the app (Dashboard, Products, Orders) switch to USD (e.g., 1,290,000 ₫ → $50.69). Reload page → still USD (localStorage persists).

- [ ] **Step 4: Commit**

```bash
git add crm/crm-ui/src/components/commons/MainLayout.tsx
git commit -m "feat(crm): mount CurrencySwitcher in MainLayout header"
```

---

## Task 3.5: Remove deprecated Currency fields from GeneralSettingsPage

**Files:**
- Modify: `crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx`

- [ ] **Step 1: Remove constants**

Delete these blocks added in the previous session's commit:

```ts
const CURRENCY_OPTIONS = [ /* ... */ ];
const CURRENCY_SYMBOLS: Record<string, string> = { /* ... */ };
```

- [ ] **Step 2: Remove initialValues for currency**

In the `useEffect` that calls `form.setFieldsValue`, delete:
```ts
currency: s.payment?.currency ?? 'USD',
currencySymbol: s.payment?.currencySymbol ?? '$',
```

- [ ] **Step 3: Remove payment block from save mutation**

Delete these lines:
```ts
const existingPayment = data?.data?.payment ?? {};
// ...
payment: {
  ...existingPayment,
  currency: values.currency,
  currencySymbol: values.currencySymbol,
},
```

- [ ] **Step 4: Remove the Form.Item rows for currency/currencySymbol**

Delete this block from the Localization Card:
```tsx
<Row gutter={16}>
  <Col xs={24} sm={12}>
    <Form.Item name="currency" ... > <Select options={CURRENCY_OPTIONS} ... /> </Form.Item>
  </Col>
  <Col xs={24} sm={12}>
    <Form.Item name="currencySymbol" ... > <Input ... /> </Form.Item>
  </Col>
</Row>
```

- [ ] **Step 5: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add crm/crm-ui/src/features/settings/GeneralSettingsPage.tsx
git commit -m "refactor(crm): remove deprecated Currency fields from GeneralSettings"
```

---

## Task 3.6: Remove Currency fields from PaymentSettingsPage

**Files:**
- Modify: `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx`

- [ ] **Step 1: Remove CURRENCY_OPTIONS const + Currency card**

Delete `CURRENCY_OPTIONS` const at the top. Delete the entire `{/* Currency */}` Card block (the section that contains `Form.Item name="currency"` and `Form.Item name="currencySymbol"`).

- [ ] **Step 2: Remove from form initial values + submit payload**

In the form initialization, drop:
```ts
currency: s.payment?.currency ?? 'USD',
currencySymbol: s.payment?.currencySymbol ?? '$',
```

In the save mutation payload, drop:
```ts
currency: values.currency,
currencySymbol: values.currencySymbol,
```

Keep `enabledGateways`, `codEnabled`, gateway provider configs.

- [ ] **Step 3: TypeScript check + commit**

```bash
cd crm/crm-ui && npx tsc --noEmit
git add crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx
git commit -m "refactor(crm): remove deprecated Currency fields from PaymentSettings"
```

---

## Task 3.7: Remove deprecated payment.currency from useSiteSettings type

**Files:**
- Modify: `crm/crm-ui/src/hooks/useSiteSettings.ts`

- [ ] **Step 1: Strip currency from PublicPaymentSettings interface**

```ts
export interface PublicPaymentSettings {
  enabledGateways?: string[];
  // currency + currencySymbol removed — superseded by Zustand store + /exchange-rates
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd crm/crm-ui && npx tsc --noEmit
```
Expected: no errors. If TS surfaces any leftover reader of `payment.currency`, remove it.

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/hooks/useSiteSettings.ts
git commit -m "refactor(crm): drop payment.currency from PublicPaymentSettings type"
```

---

## Task 3.8: Update product form Price label

**Files:**
- Modify: `crm/crm-ui/src/features/products/index.tsx`

- [ ] **Step 1: Find the Price form item (~line 1015)**

```bash
grep -n 'label="Price' crm/crm-ui/src/features/products/index.tsx
```

- [ ] **Step 2: Update label + tooltip**

Replace:
```tsx
<Form.Item
  name="price"
  label="Price (USD)"
  rules={[ ... ]}
>
```

With:
```tsx
<Form.Item
  name="price"
  label="Price (VND, base currency)"
  tooltip="All prices stored as VND. CRM/storefront will display in user's chosen currency via live exchange rate."
  rules={[ ... ]}
>
```

Adjust the `min` rule if it was `0.01` (USD friendly) — VND has no decimals:
```ts
rules={[
  { required: true, message: 'Price is required' },
  { type: 'number', min: 1, message: 'Price must be ≥ 1' },
]}
```

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/features/products/index.tsx
git commit -m "refactor(crm): clarify product Price label as VND base currency"
```

---

## Task 3.9: Order detail — customer-paid footer

**Files:**
- Modify: `crm/crm-ui/src/features/orders/index.tsx` (or the OrderDetailPage equivalent)

- [ ] **Step 1: Locate order total render**

```bash
grep -n "totalAmount\|Total\b" crm/crm-ui/src/features/orders/index.tsx | head -10
```

- [ ] **Step 2: Add customer-paid hint when displayCurrency !== 'VND'**

Below the existing total render:

```tsx
{order.displayCurrency && order.displayCurrency !== 'VND' && order.exchangeRate > 0 && (
  <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
    Customer paid: {
      new Intl.NumberFormat(
        order.displayCurrency === 'USD' ? 'en-US' :
        order.displayCurrency === 'EUR' ? 'de-DE' :
        order.displayCurrency === 'GBP' ? 'en-GB' :
        order.displayCurrency === 'JPY' ? 'ja-JP' : 'en-US',
        { style: 'currency', currency: order.displayCurrency }
      ).format(order.totalAmount / order.exchangeRate)
    }
    {' '}({order.displayCurrency} @ {order.exchangeRate.toLocaleString('vi-VN')} VND)
  </Typography.Text>
)}
```

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/features/orders/index.tsx
git commit -m "feat(crm): show customer-paid amount in order detail when not VND"
```

---

## Task 3.10: Phase 3 verification

- [ ] **Step 1: Manual smoke test**

Run CRM dev server. Verify:
- Switcher in header works (VND ↔ USD ↔ EUR ↔ GBP ↔ JPY)
- Products list shows VND with proper decimals, then USD with $X.XX after switch
- Orders list reflects switcher
- General/Payment Settings no longer show Currency fields
- Product form Price label says "Price (VND, base currency)"
- An old order with `displayCurrency='USD'` shows "Customer paid: $X.XX" below the VND total (if you have such test data — otherwise verified in Phase 4 E2E)

- [ ] **Step 2: Build check**

```bash
cd crm/crm-ui && npm run build
```
Expected: build succeeds with no TS or Vite errors.

- [ ] **Step 3: Phase 3 deploy checkpoint**

Per spec rollout: deploy Phase 1+2+3 in this order. No commit here.

---

# Phase 4 — Storefront Swap

## Task 4.1: exchangeRateApi (RTK Query)

**Files:**
- Create: `frontend/src/redux/features/exchangeRateApi.js`

- [ ] **Step 1: Create slice**

```js
// frontend/src/redux/features/exchangeRateApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const exchangeRateApi = createApi({
  reducerPath: 'exchangeRateApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001',
  }),
  endpoints: (builder) => ({
    getExchangeRates: builder.query({
      query: () => '/api/v1/store/exchange-rates',
      transformResponse: (response) => response.data,
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useGetExchangeRatesQuery } = exchangeRateApi;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/redux/features/exchangeRateApi.js
git commit -m "feat(frontend): add exchangeRateApi RTK Query slice"
```

---

## Task 4.2: userPreferencesApi (RTK Query)

**Files:**
- Create: `frontend/src/redux/features/userPreferencesApi.js`

- [ ] **Step 1: Create slice**

```js
// frontend/src/redux/features/userPreferencesApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';

export const userPreferencesApi = createApi({
  reducerPath: 'userPreferencesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7001',
    prepareHeaders: (headers) => {
      try {
        const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
        if (userInfo.accessToken) headers.set('Authorization', `Bearer ${userInfo.accessToken}`);
      } catch { /* no-op */ }
      return headers;
    },
  }),
  tagTypes: ['UserPreferences'],
  endpoints: (builder) => ({
    getUserPreferences: builder.query({
      query: () => '/api/v1/user/preferences',
      transformResponse: (r) => r.data,
      providesTags: ['UserPreferences'],
    }),
    patchUserPreferences: builder.mutation({
      query: (body) => ({
        url: '/api/v1/user/preferences',
        method: 'PATCH',
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: ['UserPreferences'],
    }),
  }),
});

export const { useGetUserPreferencesQuery, usePatchUserPreferencesMutation } = userPreferencesApi;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/redux/features/userPreferencesApi.js
git commit -m "feat(frontend): add userPreferencesApi RTK Query slice"
```

---

## Task 4.3: Register new APIs in store

**Files:**
- Modify: `frontend/src/redux/store.js`

- [ ] **Step 1: Add imports + reducer + middleware**

```js
import { exchangeRateApi } from './features/exchangeRateApi';
import { userPreferencesApi } from './features/userPreferencesApi';
```

In the reducer object:
```js
[exchangeRateApi.reducerPath]: exchangeRateApi.reducer,
[userPreferencesApi.reducerPath]: userPreferencesApi.reducer,
```

In the middleware concat chain:
```js
.concat(exchangeRateApi.middleware)
.concat(userPreferencesApi.middleware)
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/redux/store.js
git commit -m "chore(frontend): register exchangeRateApi + userPreferencesApi in store"
```

---

## Task 4.4: Rewrite currencySlice

**Files:**
- Modify: `frontend/src/redux/features/currencySlice.js`

- [ ] **Step 1: Replace content**

```js
// frontend/src/redux/features/currencySlice.js
import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

export const CURRENCY_CONFIG = {
  VND: { code: 'VND', symbol: '₫', locale: 'vi-VN', decimals: 0 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', decimals: 0 },
};

const COOKIE_NAME = 'display_currency';

const currencySlice = createSlice({
  name: 'currency',
  initialState: { currency: 'VND' },  // SSR-safe default
  reducers: {
    setCurrency: (state, action) => {
      const code = action.payload;
      if (CURRENCY_CONFIG[code]) {
        state.currency = code;
        if (typeof window !== 'undefined') {
          try { Cookies.set(COOKIE_NAME, code, { expires: 365 }); } catch { /* ignore */ }
        }
      }
    },
    hydrateCurrencyFromCookie: (state) => {
      if (typeof window !== 'undefined') {
        try {
          const saved = Cookies.get(COOKIE_NAME);
          if (saved && CURRENCY_CONFIG[saved]) state.currency = saved;
        } catch { /* ignore */ }
      }
    },
  },
});

export const { setCurrency, hydrateCurrencyFromCookie } = currencySlice.actions;

export const selectCurrency = (state) => state.currency.currency;
export const selectCurrencyConfig = (state) => CURRENCY_CONFIG[state.currency.currency];

export default currencySlice.reducer;
```

- [ ] **Step 2: Search for stale references to removed exports**

```bash
grep -rn "selectExchangeRate\|hydrateCurrency\b" frontend/src --include='*.js' --include='*.jsx'
```
For each match: update to use `useGetExchangeRatesQuery` instead. If `hydrateCurrency` is referenced, rename to `hydrateCurrencyFromCookie`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/redux/features/currencySlice.js
git commit -m "refactor(frontend): rewrite currencySlice (no hardcoded rates; cookie persist)"
```

---

## Task 4.5: Rewrite use-currency hook (reverse math)

**Files:**
- Modify: `frontend/src/hooks/use-currency.js`

- [ ] **Step 1: Replace content**

```js
// frontend/src/hooks/use-currency.js
import { useSelector } from 'react-redux';
import { selectCurrency, selectCurrencyConfig } from '@/redux/features/currencySlice';
import { useGetExchangeRatesQuery } from '@/redux/features/exchangeRateApi';

/**
 * formatPrice(amountVnd) — converts a VND-base amount to the user's selected
 * currency and formats it with Intl.NumberFormat. If rates are unavailable,
 * falls back to rendering the input as VND.
 */
const useCurrency = () => {
  const currency = useSelector(selectCurrency);
  const config = useSelector(selectCurrencyConfig);
  const { data: ratesData } = useGetExchangeRatesQuery();
  const rate = currency === 'VND' ? 1 : (ratesData?.rates?.[currency] ?? null);

  const formatPrice = (amountVnd) => {
    const num = Number(amountVnd);
    if (!Number.isFinite(num)) return '';

    if (currency === 'VND' || !rate) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }
    const converted = num / rate;
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(converted);
  };

  return {
    formatPrice,
    currency,
    config,
    rate,
    isStale: ratesData?.stale ?? false,
  };
};

export default useCurrency;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/use-currency.js
git commit -m "refactor(frontend): rewrite useCurrency to divide VND by target rate"
```

---

## Task 4.6: CurrencySwitcher storefront component

**Files:**
- Create: `frontend/src/components/common/CurrencySwitcher.jsx`

- [ ] **Step 1: Create component**

```jsx
// frontend/src/components/common/CurrencySwitcher.jsx
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { useTranslation } from 'next-i18next';
import { selectCurrency, setCurrency, CURRENCY_CONFIG } from '@/redux/features/currencySlice';
import { usePatchUserPreferencesMutation } from '@/redux/features/userPreferencesApi';

const ORDER = ['VND', 'USD', 'EUR', 'GBP', 'JPY'];

export default function CurrencySwitcher() {
  const { t } = useTranslation('common');
  const dispatch = useDispatch();
  const currency = useSelector(selectCurrency);
  const [patchPrefs] = usePatchUserPreferencesMutation();

  const handleChange = async (e) => {
    const code = e.target.value;
    dispatch(setCurrency(code));
    // Sync to DB if authed
    try {
      const userInfo = JSON.parse(Cookies.get('userInfo') || '{}');
      if (userInfo.accessToken) await patchPrefs({ currency: code }).unwrap();
    } catch { /* ignore */ }
  };

  return (
    <div className="currency-switcher">
      <label className="visually-hidden">{t('common.currency', 'Currency')}</label>
      <select value={currency} onChange={handleChange} className="form-select form-select-sm">
        {ORDER.map((code) => (
          <option key={code} value={code}>
            {code} {CURRENCY_CONFIG[code].symbol}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Add i18n key**

In `frontend/public/locales/en/common.json` and `frontend/public/locales/vi/common.json`, ensure `common.currency` exists:
- EN: `"currency": "Currency"`
- VI: `"currency": "Tiền tệ"`

(Skip if these keys already exist.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/common/CurrencySwitcher.jsx frontend/public/locales/en/common.json frontend/public/locales/vi/common.json
git commit -m "feat(frontend): add CurrencySwitcher component + i18n keys"
```

---

## Task 4.7: Mount switcher in header

**Files:**
- Modify: `frontend/src/layout/headers/header-top-right.jsx` (or the actual header-top file — verify via grep)

- [ ] **Step 1: Find the header-top file**

```bash
grep -rln "header-top\|HeaderTop\|LangSwitcher\|language-switcher" frontend/src/layout/headers/ | head -5
```

- [ ] **Step 2: Import + mount alongside language selector**

```jsx
import CurrencySwitcher from '@/components/common/CurrencySwitcher';

// In the JSX, next to the language switcher (or in the top utility bar):
<li className="header-top-info-currency">
  <CurrencySwitcher />
</li>
```

Match the existing list structure. If the header-top doesn't have a `<ul>`, drop directly into the same flex container as language.

- [ ] **Step 3: Manual verify**

```bash
cd frontend && npm run dev
```
Open the storefront. Expected: currency switcher next to language switcher. Pick USD → product cards reflect USD. Reload → still USD (cookie persists).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/layout/headers/header-top-right.jsx
git commit -m "feat(frontend): mount CurrencySwitcher in header top bar"
```

---

## Task 4.8: Preference sync in wrapper.jsx

**Files:**
- Modify: `frontend/src/layout/wrapper.jsx`

- [ ] **Step 1: Hydrate cookie + sync from DB after auth**

Add imports:
```jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hydrateCurrencyFromCookie, setCurrency } from '@/redux/features/currencySlice';
import { useGetUserPreferencesQuery } from '@/redux/features/userPreferencesApi';
```

Inside the wrapper component (after existing hooks):
```jsx
const dispatch = useDispatch();
const accessToken = useSelector((s) => s.auth?.accessToken);

useEffect(() => {
  dispatch(hydrateCurrencyFromCookie());
}, [dispatch]);

const { data: prefs } = useGetUserPreferencesQuery(undefined, { skip: !accessToken });
useEffect(() => {
  if (prefs?.currency) dispatch(setCurrency(prefs.currency));
}, [prefs, dispatch]);
```

(If `auth.accessToken` selector path differs in your slice, adapt.)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/layout/wrapper.jsx
git commit -m "feat(frontend): hydrate currency from cookie + sync from User.preferences"
```

---

## Task 4.9: Checkout — send displayCurrency

**Files:**
- Modify: `frontend/src/hooks/useCheckoutSubmit.js`

- [ ] **Step 1: Include displayCurrency in order payload**

Locate the order body construction. Add:
```js
import { useSelector } from 'react-redux';
import { selectCurrency } from '@/redux/features/currencySlice';

// inside the hook:
const displayCurrency = useSelector(selectCurrency);

// where the order object is built:
const orderData = {
  ...existingFields,
  displayCurrency,
  // do NOT send exchangeRate — backend snapshots from its own ExchangeRate doc
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useCheckoutSubmit.js
git commit -m "feat(frontend): include displayCurrency in checkout order payload"
```

---

## Task 4.10: Order success/detail — render in display currency

**Files:**
- Modify: order detail / order success pages (likely `frontend/src/pages/order/[id].jsx` or `frontend/src/components/order-area/*`)

- [ ] **Step 1: Locate order render**

```bash
grep -rln "order.totalAmount\|cart\[\\]\\.price\|order_summary" frontend/src/pages/order frontend/src/components 2>/dev/null | head -5
```

- [ ] **Step 2: Apply displayCurrency formatting**

For pages that render order amounts, use a helper that respects the order's snapshot:

```js
const formatOrderAmount = (vndAmount, order) => {
  const cur = order?.displayCurrency || 'VND';
  const rate = order?.exchangeRate || 1;
  if (cur === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vndAmount);
  }
  const converted = vndAmount / rate;
  const config = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP' };
  const decimals = ['VND','JPY'].includes(cur) ? 0 : 2;
  return new Intl.NumberFormat(config[cur] || 'en-US', {
    style: 'currency', currency: cur,
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(converted);
};
```

Replace existing `formatPrice` calls on order pages with `formatOrderAmount(amount, order)`.

- [ ] **Step 3: Commit**

```bash
git add <files-touched>
git commit -m "feat(frontend): render order amounts using snapshot displayCurrency + rate"
```

---

## Task 4.11: Playwright E2E — currency switcher

**Files:**
- Create: `frontend/tests/currency.spec.js` (or `.ts` if config uses TS)

- [ ] **Step 1: Write test**

```js
// frontend/tests/currency.spec.js
import { test, expect } from '@playwright/test';

test.describe('Currency switcher', () => {
  test('anonymous user can switch VND → USD; persists across reload', async ({ page }) => {
    await page.goto('/shop');

    // Initial render: VND symbol present
    await expect(page.locator('.product-item, [data-testid="product-card"]').first()).toContainText('₫');

    // Switch to USD
    const switcher = page.locator('.currency-switcher select');
    await switcher.selectOption('USD');

    // Wait for re-render
    await expect(page.locator('.product-item, [data-testid="product-card"]').first()).toContainText('$');

    // Reload → still USD
    await page.reload();
    await expect(page.locator('.product-item, [data-testid="product-card"]').first()).toContainText('$');
  });
});
```

If your selectors for product cards differ, adapt `.product-item` to the actual class.

- [ ] **Step 2: Run**

```bash
cd frontend && npm run test:e2e -- currency
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add frontend/tests/currency.spec.js
git commit -m "test(frontend): add E2E for currency switcher persistence"
```

---

## Task 4.12: Phase 4 verification

- [ ] **Step 1: Manual end-to-end smoke**

1. Anonymous: visit `/shop`, pick USD → prices in `$`, reload → still `$`.
2. Login → check User.preferences in DB via Mongo MCP: `db.users.findOne({email:'<your-email>'}, {preferences:1})` — should match.
3. Place a test order with USD selected.
4. Check `db.orders.findOne({}, {displayCurrency:1, exchangeRate:1, totalAmount:1})` — should have `displayCurrency: 'USD'` + non-trivial `exchangeRate`.
5. CRM: open the order in Order Detail → "Customer paid: $X.XX" footer present.

- [ ] **Step 2: Build check**

```bash
cd frontend && npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Phase 4 deploy checkpoint**

No commit. Deploy per spec rollout.

---

# Phase 5 — Cleanup

## Task 5.1: Remove deprecated SiteSetting reads in backend

**Files:**
- Modify: `backend/controller/v1/store-cms.controller.js`

- [ ] **Step 1: Update getPublicSettings**

Locate the `getPublicSettings` function (line ~157 per earlier scan). Remove `currency` and `currencySymbol` from the response shape; keep `payment.enabledGateways`:

```js
// before:
payment: { enabledGateways: ['stripe', 'cod'], currency: 'USD', currencySymbol: '$' }

// after:
payment: { enabledGateways: ['stripe', 'cod'] }
```

Also remove `i18n` from the projected fields and default response (it's no longer authoritative).

- [ ] **Step 2: Test still passes**

```bash
cd backend && npx jest store-cms --runInBand
```
Expected: PASS. If test asserts on `currency`/`currencySymbol`, update assertions.

- [ ] **Step 3: Commit**

```bash
git add backend/controller/v1/store-cms.controller.js backend/tests/store-cms.test.js
git commit -m "refactor(backend): drop deprecated currency/i18n fields from public settings"
```

---

## Task 5.2: Drop deprecated SiteSetting schema fields

**Files:**
- Create: `migration/13-unset-deprecated-currency-i18n.js`
- Modify: `backend/model/SiteSetting.js`

- [ ] **Step 1: Write migration**

```js
// migration/13-unset-deprecated-currency-i18n.js
const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await mongoose.connection.collection('sitesettings').updateMany(
    {},
    {
      $unset: {
        'payment.currency': '',
        'payment.currencySymbol': '',
        'i18n.defaultLanguage': '',
        'i18n.supportedLanguages': '',
      },
    },
  );
  console.log('Updated', result.modifiedCount, 'settings docs');
  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Remove fields from Mongoose schema**

In `backend/model/SiteSetting.js`, locate the `payment` subdoc and `i18n` subdoc. Remove:
- `payment.currency`, `payment.currencySymbol`
- `i18n.defaultLanguage`, `i18n.supportedLanguages`

If `i18n` becomes empty after removal, delete the whole `i18n` field.

- [ ] **Step 3: Run migration on dev DB**

```bash
node migration/13-unset-deprecated-currency-i18n.js
```
Expected log: `Updated N settings docs`.

- [ ] **Step 4: Commit**

```bash
git add migration/13-unset-deprecated-currency-i18n.js backend/model/SiteSetting.js
git commit -m "chore(backend): drop deprecated currency/i18n fields from SiteSetting schema"
```

---

## Task 5.3: Update Swagger docs

**Files:**
- Modify: `backend/config/swagger.js` (or wherever JSDoc tags live for the affected endpoints)

- [ ] **Step 1: Add OpenAPI annotations for new endpoints**

Find existing endpoint JSDoc comments. Add for the 6 new endpoints:
- `GET /api/v1/store/exchange-rates`
- `GET /api/v1/user/preferences`
- `PATCH /api/v1/user/preferences`
- `GET /api/v1/admin/products/currency-audit`
- `POST /api/v1/admin/products/:id/normalize-currency`
- `POST /api/v1/admin/products/bulk-normalize-currency`

Sample annotation block (in `exchangeRate.controller.js`):

```js
/**
 * @openapi
 * /api/v1/store/exchange-rates:
 *   get:
 *     tags: [Store]
 *     summary: Get current exchange rates (VND base)
 *     responses:
 *       200:
 *         description: Rates document
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     base: { type: string, example: VND }
 *                     rates: { type: object }
 *                     stale: { type: boolean }
 *                     updatedAt: { type: string, format: date-time }
 */
```

Repeat similar blocks for the others.

- [ ] **Step 2: Verify swagger UI loads**

```bash
cd backend && npm run dev
```
Open `http://localhost:7001/api-docs`. Verify new endpoints appear. Stop dev server.

- [ ] **Step 3: Commit**

```bash
git add backend/controller/v1/*.controller.js backend/config/swagger.js
git commit -m "docs(backend): document multi-currency endpoints in Swagger"
```

---

## Task 5.4: Phase 5 verification + final smoke

- [ ] **Step 1: Full backend test pass**

```bash
cd backend && npx jest --runInBand
```
Expected: all pass.

- [ ] **Step 2: Build all three apps**

```bash
cd backend && npm run build 2>/dev/null || echo "backend has no build script (OK)"
cd frontend && npm run build
cd crm/crm-ui && npm run build
```
Expected: frontend + CRM builds succeed.

- [ ] **Step 3: Final manual cross-stack check**

- CRM admin switcher works
- Storefront switcher persists
- Order detail in CRM shows correct customer-paid amount
- Currency Audit page lists suspect products
- Old SiteSetting currency fields no longer affect anything (e.g., changing them in Mongo directly does nothing visible)

- [ ] **Step 4: Done — no commit; plan complete**

---

# Out-of-Scope (Phase 6 deferred)

Listed in spec, NOT implemented here:
- Fallback exchange-rate API
- Admin email alert when rates stale > 24h
- Refund-rate policy reconciliation
- Cart-vs-checkout rate divergence handling

---

# Self-Review Checklist (for plan author)

- [x] Spec coverage: every spec section traceable to a task
  - Architecture/data flow → Tasks 1.1-1.3
  - Data model: ExchangeRate (1.1), User.preferences (1.4), Order snapshot (1.5, 1.10), Product audit field (1.6)
  - API endpoints: exchange-rates (1.7), user prefs (1.8), audit/normalize (1.9)
  - Cron service (1.2-1.3)
  - Audit script (1.11)
  - Storefront: slice (4.4), hook (4.5), switcher (4.6-4.7), sync (4.8), checkout (4.9), order render (4.10)
  - CRM: store (3.1), formatters (3.2), switcher (3.3-3.4), settings cleanup (3.5-3.7), product form (3.8), order detail (3.9), audit page (2.1-2.4)
  - Phase rollout: explicit phase headers + verification checkpoints
  - Risk mitigations: seed fallback ExchangeRate in controller (1.7) covers cold-boot risk
- [x] No placeholders, no "TBD"
- [x] All code blocks complete (no `...` mid-function except in patches that show inserts into existing code with clear anchors)
- [x] Method signatures match across tasks (`setCurrency`, `useExchangeRates`, `normalizeOne`, `normalizeBulk`)
- [x] Backend tests follow existing supertest pattern
- [x] Test commands include `--runInBand` (matches jest.config.js default for Mongo)
- [x] Each task ends with a commit step
