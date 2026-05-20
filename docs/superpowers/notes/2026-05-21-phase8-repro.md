# Phase 8 — Flow A reproduction baseline (2026-05-21)

Sprint 2, Phase 8 fixes search / filter / sort on the storefront. Before
patching, this note records the baseline behaviour observed in the codebase
and the failure mode each bug produces. Direct UI repro will be re-verified
after each fix in browser; this baseline is the static-analysis trace that
identifies the root cause of each bug.

## A1 — Header search returns zero results

- **User action:** Type `headphone` in the header search → submit.
- **URL hit (current):** `/search?searchText=headphone` (Next.js page).
- **Backend request (current):** `GET /api/v1/store/products` (no search
  param) because `frontend/src/pages/search.jsx:17` calls
  `useGetAllProductsQuery()` with no args and then runs a client-side
  `Array.filter(p => p.title.toLowerCase().includes(searchText))` at lines
  52-55.
- **Why it fails:** The first page of `/api/v1/store/products` is paginated
  (default `limit=12`). A product titled `Headphones with Mic` may not be on
  page 1, or the case-fold substring may miss compound titles. Either way the
  client never asks the server to search — it filters whatever was returned
  on page 1.
- **Expected:** Call the dedicated `/api/v1/store/products/search?q=...`
  endpoint that runs the `$text` index over title / description / tags.
- **Fix path:** Replace the `useGetAllProductsQuery + filter` block in
  `search.jsx` with `useSearchProductsQuery({ q: query })` from
  `frontend/src/redux/features/cmsApi.js:51-60` (already exists).
- **Note on cmsApi:** `searchProducts.query` sets `searchParams.set('search', params.q)`,
  but the backend endpoint at `store.controller.js:148-171` reads
  `req.query.q`. The cmsApi param name needs to be `q`, not `search`, or
  matching results will be empty.

## A2 — Shop page "Search for anything..." has no effect

- **User action:** Type `wireless` in the shop-page search input.
- **Backend request (current):** `GET /api/v1/store/products?search=wireless`
  (the shop page does send a query param).
- **Why it fails:** Backend `getAllProducts` at `store.controller.js:112-114`
  adds `filter.$text = { $search: q.search }`. If the products collection
  has no compound `$text` index (or the index hasn't been built on this
  environment), the query returns 0 results — but the index may exist on
  prod and not on the dev MongoDB instance.
- **Expected:** Even when the `$text` index is missing, search should
  degrade to a case-insensitive regex match on `title`.
- **Fix path:** In `searchProducts` handler at `store.controller.js:148-171`,
  wrap the `$text` query in try/fallback: when 0 results come back, run a
  regex search on `title` with `i` flag (input escaped for regex specials).
  Same handler powers the shop-page search via cmsApi.
- **Index check task (8.3 step 1):** Will run `db.products.getIndexes()` from
  a Node script to confirm whether the `$text` index exists in this
  environment.

## A3 — Headphones category radio leaks unrelated products

- **User action:** Click "Headphones" category radio in `/shop` sidebar.
- **Backend request (current):** `GET /api/v1/store/products?category=headphones`.
- **Why it fails:** `store.controller.js:45-62` first slugifies the
  `Category.parent` field and tries an exact match. If matched, it builds
  `filter.$or = [{ 'category.id': matched._id }, { parent: matched.parent }]`.
  The second branch matches by `parent` STRING on the product. Many
  unrelated products carry generic parent strings ("Electronics", "Fashion",
  etc.) so the `$or` widens the result set well past the chosen category.
  Worse, if no slug matches, the fallback at line 60 runs a regex against
  `parent`, which leaks products whose parent name contains the query as a
  substring.
- **Expected:** A category radio click should return only products whose
  `category.id` equals the selected `Category._id`.
- **Fix path:** Replace the `$or` clause with a strict
  `filter['category.id'] = matched._id`. Drop the regex-on-parent fallback;
  if `matched` is null, set `filter._id = null` so the query returns empty
  rather than scanning all products.

## A4 — "Price: Low to High" returns descending prices

- **User action:** Change shop sort dropdown to "Price: Low to High".
- **Reproducibility from static analysis:** NOT REPRODUCIBLE. The mapping
  chain is internally consistent and produces ascending prices for "Low to
  High":
  - `frontend/src/components/shop/shop-top-right.jsx` lists options with
    values `'Default Sorting' | 'Low to High' | 'High to Low' | 'New Added'`.
  - `frontend/src/pages/shop.jsx:34-42` maps `query.sort === 'Low to High'`
    to `{ sortBy: 'price', sortOrder: 'asc' }`. Anything else (including
    'High to Low') resolves to `sortOrder: 'desc'`.
  - `backend/utils/pagination.js:28-29` returns `sortOrder: 'asc'` when the
    incoming query string is `'asc'`.
  - `backend/controller/v1/store.controller.js:121` builds
    `{ [sortBy]: sortOrder === 'asc' ? 1 : -1 }`. In Mongo, `1` = ascending
    → cheapest first. Correct.
- **Per spec:** "If A4 is NOT reproducible, mark it not-reproducible and
  skip Task 8.5." → **Skipping Task 8.5.**
- **Adjacent observation, NOT in scope this phase:** `shop-top-right.jsx`
  uses `defaultValue="Default Sorting"` instead of a controlled
  `value={selectValue}` read from URL state. After navigating to
  `/shop?sort=Low%20to%20High`, the dropdown still LABELS "Most Popular"
  even though the data is sorted correctly server-side. That's a UI label
  desync, not a sort-inversion bug. If the QA report's "sort wrong"
  observation was actually based on the dropdown label rather than the
  product order, the real fix is to control the `<select>` value from the
  URL. Recording for follow-up — this sprint's Phase 8 leaves the sort
  pipeline untouched per the not-reproducible decision.

## Index check (Task 8.3 step 1)

Ran:

```bash
node -e "const m=require('mongoose'); require('dotenv').config();
(async()=>{ await m.connect(process.env.MONGO_URI, {serverSelectionTimeoutMS: 5000});
const idx = await m.connection.db.collection('products').indexes();
console.log(idx.filter(i => i.weights).map(i => i.name)); await m.disconnect(); })();"
```

Result: `Server selection timed out after 5000 ms` — the prod MongoDB at
`mongodb://187.124.3.207:27017/shofy` is not reachable from this
environment. We cannot confirm the `$text` index existence directly from
here; that confirmation lives with Phase 16 prod-deploy step. Either way,
the regex fallback added in Task 8.3 step 2 is the safety net for any
environment (Atlas / non-Atlas / index-missing) where `$text` returns
zero matches.

## Next steps

1. Task 8.2 — switch `search.jsx` to `useSearchProductsQuery`, fix the
   `searchProducts` builder in cmsApi to send `q` (not `search`) so the URL
   matches the backend handler.
2. Task 8.3 — verify the `$text` index, then add a regex fallback in
   `searchProducts`.
3. Task 8.4 — tighten the category filter in `getAllProducts`.
4. Task 8.5 — trace the sort path; only patch if the bug is reproducible.
5. Task 8.6 — manual flow A verification.
