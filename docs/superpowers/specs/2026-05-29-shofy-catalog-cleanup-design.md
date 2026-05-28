# Shofy Catalog Cleanup & Enrichment — Design Spec

**Date:** 2026-05-29
**Author:** brainstormed with Claude (multi-agent design + adversarial review)
**Status:** Draft for user review
**Scope:** Fix, reclassify, and enrich the live Shofy product/category catalog
(`mongodb://187.124.3.207:27017/shofy`) from a verified-correct source dataset.

---

## 1. Context & Current-State Analysis

The live DB holds **53 products / 16 categories / 11 brands**. A read-only audit found:

| # | Problem | Evidence | Severity |
|---|---|---|---|
| 1 | **Wrong/duplicate images** | All 53 `img` point at `res.cloudinary.com/dfddeabbs`; **16 products share one identical image** (`nkqwzy38ifecfug7zqlr.png` — exactly the `nImageURLs:1` set). Headphone image shown on "Ao Dai", dresses, scarf. | 🔴 Critical |
| 2 | **Wrong brands** | `Logitech` on 17 products incl. clothing/beauty/jewelry/home/sports; 15 rows have factually wrong brands. | 🟠 High |
| 3 | **Orphan productTypes** | 3 `home` + 2 `sports` products exist, but **no category** has those productTypes; the 5 products sit under the electronics "Headphones" category. | 🟠 High |
| 4 | **Messy taxonomy** | 16 categories with overlapping/junk names (Discover Skincare, Beauty of Skin, Awesome Lip Care, Facial Care…); 26 inconsistent `children` values; 3 jewelry categories have no image. | 🟠 High |
| 5 | **Stale aggregates** | `category.products[]` / `nProducts` out of sync (Headphones nProducts=3 vs 11 real; Clothing 5 vs 7). | 🟡 Medium |
| 6 | **Mixed locale** | English demo products (iPhone 14, Gaming Headphone) mixed with romanized-VN products (Ao Dai…). Store should be Vietnamese. | 🟡 Medium |

**Verified infrastructure (all working):**
- `MONGO_URI` in `backend/.env` → write access to the live DB.
- Cloudinary `dfddeabbs` — `api.ping()` OK, 500 req/hr → **image upload works**, same account as existing images.
- `GEMINI_API_KEY` + `GEMINI_CHAT_MODEL` present → Vietnamese localization at scale.
- Deps: `axios` + `cloudinary` SDK only (no headless browser → JS-heavy sites like Shopee/Tiki are out of scope/ToS).
- Source dataset: **DummyJSON** — 194 real products, 24 categories, real images on `cdn.dummyjson.com`, rich metadata. Free license, no ToS/scraping issue.

---

## 2. Goals & Non-Goals

**Goals**
1. Fix all 53 existing products in place: correct images, brands, taxonomy, localization.
2. Reclassify the catalog into a clean, consistent 6-vertical taxonomy with **zero orphans**.
3. Add ~67 new products from DummyJSON to reach **~120 total**, balanced across verticals.
4. Every image is a **unique, correct** Cloudinary URL on `dfddeabbs`.
5. All product titles + descriptions in **Vietnamese**; prices in **VND**.
6. Safe, **idempotent**, reversible migration with backup + dry-run + verification.

**Non-Goals**
- No new product features, schema changes, or API endpoints.
- No scraping of commercial VN sites.
- No changes to orders/users/reviews/CMS.
- No frontend redesign — only the one small menu edit in §10.

---

## 3. Frozen Decisions (locked with user)

| Decision | Value |
|---|---|
| Existing 53 | Fix in place + reclassify (not wipe, not append-only) |
| Source | DummyJSON (real data + images) → re-upload images to Cloudinary `dfddeabbs` |
| Write path | Node/mongoose migration scripts via `MONGO_URI`; **backup first**; `--dry-run` default |
| Target size | ~120 products (53 fixed + ~67 new), balanced 18–22 per vertical |
| Image strategy (53 old) | **Hybrid (C)**: VN-special items get hand-picked images + keep VN names; rest auto by category |
| FX rate | USD × **25,000**, round to nearest 1,000 VND |
| Discount | from DummyJSON `discountPercentage` (stored as %) |
| Localization | Vietnamese title + description via Gemini; **category names in Vietnamese** (`parent` = VN string) |
| Category model | **2-level**: `productType` → `Category.parent` (granular sub-department, many) → `children[]` leaves. **NOT** collapsed to 6 mega-categories. |
| Old extra categories | **Soft-delete** (`status:"Hide"`) after re-pointing products; never hard-delete |
| Frontend | Small edit to `header-category.jsx`: `defaultTypes` → 6 verticals + Vietnamese type labels |

### Why the 2-level model (evidence, not assumption)
`frontend/src/layout/headers/header-com/header-category.jsx` groups categories by
`productType` into `defaultTypes`, renders each `Category` by `item.parent`, and routes
`/shop?category=<parent>`. `backend/services/product.service.js#getProductTypeService`
filters products by `productType`. So the store needs **many granular categories grouped
under the 6 productTypes** — collapsing to 6 would break navigation. The frontend menu
currently hardcodes only `["fashion","electronics","beauty","jewelry","other"]` (no
home/sports) → §10 fixes that.

---

## 4. Canonical Category Taxonomy (FROZEN — single source of truth)

This is the **one** category model. It will live in code as `backend/scripts/lib/mappings.js`
and every importer references it. `parent` is the UNIQUE key **and** the Vietnamese display
label. `children[]` are Vietnamese leaf strings. `productType` ∈
{electronics, fashion, beauty, jewelry, home, sports} (lowercase). `status:"Show"`.

| productType | Category `parent` (VN) | Origin (existing→rename / NEW) | DummyJSON source cats | children[] |
|---|---|---|---|---|
| electronics | Tai nghe | "Headphones" → rename | (existing audio) | Bluetooth; Nhét tai; Chụp tai |
| electronics | Điện thoại | **NEW** | smartphones | Apple; Samsung; Android |
| electronics | Máy tính bảng | "Mobile Tablets" → rename | tablets | Apple; Samsung |
| electronics | Laptop | "pc" → rename | laptops | Apple; Dell; Asus; Lenovo |
| electronics | Đồng hồ thông minh | "Smart Watch" → rename | (existing) | Apple Watch; Thể thao |
| electronics | Phụ kiện điện tử | "Bluetooth" → rename (+absorb "CPU Heat Pipes") | mobile-accessories | Sạc & Cáp; Loa; Phụ kiện PC |
| fashion | Thời trang nữ | "Clothing" → rename | womens-dresses; tops | Đầm; Áo; Truyền thống |
| fashion | Thời trang nam | **NEW** | mens-shirts | Sơ mi; Áo thun |
| fashion | Giày dép | "Shoes" → rename | mens-shoes; womens-shoes | Nam; Nữ |
| fashion | Túi xách | "Bags" → rename | womens-bags | Túi đeo; Túi du lịch |
| fashion | Kính mát | **NEW** | sunglasses | Nam; Nữ |
| beauty | Chăm sóc da | "Discover Skincare" → rename (+absorb "Beauty of Skin") | skin-care | Serum; Kem dưỡng; Mặt nạ |
| beauty | Trang điểm | "Awesome Lip Care" → rename (+absorb "Facial Care") | beauty | Son; Phấn; Cọ trang điểm |
| beauty | Nước hoa | **NEW** | fragrances | Nữ; Nam |
| jewelry | Vòng tay | "Bracelets" → rename | womens-jewellery | Vàng; Bạc |
| jewelry | Hoa tai | "Earrings" → rename | womens-jewellery | Vàng; Bạc |
| jewelry | Dây chuyền | "Necklaces" → rename | womens-jewellery | Vàng; Bạc |
| jewelry | Nhẫn | **NEW** | womens-jewellery | Vàng; Bạc |
| jewelry | Đồng hồ | **NEW** (finding #6: watches ≠ necklace/bracelet) | mens-watches; womens-watches | Nam; Nữ |
| home | Trang trí nhà cửa | **NEW** | home-decoration | Đèn; Đồ trang trí |
| home | Nội thất | **NEW** | furniture | Phòng khách; Phòng ngủ |
| home | Đồ bếp | **NEW** | kitchen-accessories | Dụng cụ; Bộ ấm trà |
| sports | Dụng cụ thể thao | **NEW** | sports-accessories | Yoga; Gym; Phụ kiện |

**Soft-deleted (re-point products first, then `status:"Hide"`):** CPU Heat Pipes, Beauty of Skin, Facial Care (merged into the renames above). Existing `_id`s are preserved by matching on `parent` (the upsert key).

**Excluded DummyJSON categories** (no home in the 6-vertical store): `groceries` (27), `motorcycle` (5), `vehicle` (5) = 37 products dropped at preselection.

**Slug:** `slug = slugify(parent)` (lowercase, diacritics handled), unique. Category routing in the storefront slugifies `parent` identically, so products carrying the same VN `parent` resolve correctly.

---

## 5. Source → Schema Field Mapping (DummyJSON → Products)

| Product field | Source / rule |
|---|---|
| `title` | DummyJSON `title` → **Gemini VN translation** (≤200 chars) |
| `description` | DummyJSON `description` → **Gemini VN translation** |
| `productType` | from frozen map (DJ category → productType) — never free-typed |
| `parent` | from frozen map (Category VN parent) |
| `children` | single VN leaf string (Product.children is a **String**, not array). Chosen by rule: infer from DJ subtype/brand/gender (e.g. mens-shoes→"Nam", Apple smartphone→"Apple"); else default to the category's **first** `children[]` entry |
| `category` | `{ name: parent, id: <Category._id resolved by parent> }` (id REQUIRED) |
| `brand` | `{ name, id: <Brand._id> }` (id REQUIRED — see §7.4 fallback) |
| `price` | `round(dj.price * 25000 / 1000) * 1000` (VND) |
| `discount` | `dj.discountPercentage` (percentage) |
| `quantity` | `dj.stock` |
| `status` | `dj.stock === 0 ? "out-of-stock" : "in-stock"` (hyphenated enum) |
| `unit` | `"1pc"` (REQUIRED, synthesized) |
| `sku` | `dj.sku` (100% unique — secondary idempotency key) |
| `slug` | `slugify(localized title)` |
| `img` | first uploaded Cloudinary `secure_url` (see §7.3) |
| `imageURLs[]` | `[{ img: secure_url, color:{name:"Mặc định",clrCode:"#000000"}, sizes:<§7.3> }]` (cap 4) |
| `tags` | DummyJSON `tags` |
| `weight` / `dimensions` | DummyJSON `weight` / `dimensions` |
| `featured` | `dj.rating >= 4.5` |
| `sellCount` | `0` |
| `importId` | `"dummyjson:<dj.id>"` (primary idempotency key, new field) |

---

## 6. Reclassification of the 53 Existing Products

**Deterministic, rule-based** (encoded in `mappings.js`, applied by `import-products.js`):

1. **productType correction** — when the seed `productType` contradicts the title (the 14 mis-typed "Headphones/Kids Headphones" placeholder rows), the title wins.
2. **parent/children remap** — old `parent`/`children` → frozen VN taxonomy (§4).
3. **brand correction** — apply the brand-fix matrix (§7.4).
4. **VN-special vs auto** — VN-special items keep their localized name + a hand-picked image; the rest get a category-default image.
5. **category ref** — resolve `category.id` from the new `parent`.

### 6.1 Orphan fix (CRITICAL — finding #3, #4)
These 5 products currently point at the electronics "Headphones" category; re-point them:
- **home:** Bamboo Tea Set → `Đồ bếp`; Rattan Pendant Lamp → `Trang trí nhà cửa`; Linen Bedding Set Queen → `Nội thất`.
- **sports:** Yoga Mat Premium 6mm → `Dụng cụ thể thao`; Resistance Band Set → `Dụng cụ thể thao`.

### 6.2 VN-special set (FROZEN to 7 — finding #9)
Keep localized name, `isVietnamese:true`, hand-picked Cloudinary image, manual translation cache:
**Ao Dai Truyen Thong Lua, Linen Summer Dress, Silk Scarf Hand-painted, K-Beauty Cleansing Set, Bamboo Tea Set, Rattan Pendant Lamp, Linen Bedding Set Queen.**
⚠️ **Silk Scarf has no DummyJSON image source** → its image is staged manually in `image-manifest.json` before the image step runs.

---

## 7. Transformation Pipelines

### 7.1 Pricing / stock / status
`price = round(USD*25000/1000)*1000`; `discount = discountPercentage`; `quantity = stock`;
`status = stock===0 ? "out-of-stock":"in-stock"`. (3 importable products have stock 0.)

### 7.2 Localization (Gemini)
- `GEMINI_CHAT_MODEL` + `GEMINI_API_KEY`, `:generateContent`, `response_mime_type:"application/json"`, temp 0.3, via axios.
- Batch 10 products/request, concurrency 1–2, exponential backoff on 429/5xx.
- Returns JSON array of `{sku,title_vi,description_vi}`; **match back by sku, not index**; truncate title ≤200.
- **Cache** → `backend/scripts/data/translations.cache.json` keyed `sku → {title_vi,description_vi,src_hash,model}`; skip API when `src_hash`+`model` match → **idempotent**.
- **Fallback:** per-item failure → keep English (still schema-valid), log, do **not** cache (retries next run). Whole-batch failure → degrade to English + WARN.
- VN-special 7 items pre-seeded with `model:"manual"`, never overwritten by Gemini.

### 7.3 Image pipeline
- Source = `[thumbnail, ...images]` (dedup, **cap 4** — existing norm `nImageURLs ∈ {1,3,4}`).
- axios `arraybuffer` download (retry 3×, skip individual 404s) → Cloudinary upload via `backend/utils/cloudinary.js`.
- Folder `shofy/products`; deterministic `public_id`: new = `dj-{sku-lower}-{k}`, existing-fix = `fix-{existingId}-{k}` (k=0 is the main/`img`).
- **Idempotent:** check `image-manifest.json` + `overwrite:false` → skip re-upload, reuse `secure_url`.
- `img = uploaded[0].secure_url` (asserted to match `^https://res.cloudinary.com/dfddeabbs/`).
- `imageURLs[].sizes` per productType: `fashion`→`["S","M","L"]`, `fashion`+Giày dép→`["38","39","40","41","42"]`, everything else→`[]` (finding #7 — no placeholder).
- **Fixes the 16-shared-image bug:** every product ends with a unique `img`; zero use `nkqwzy38ifecfug7zqlr.png`.

### 7.4 Brand strategy (SINGLE matrix — finding #5)
- **Upsert** real brands from DummyJSON `brand` (case-insensitive on `name`, unique, `status:"active"`, `slug`). 4 already exist (Apple/Lenovo/Nike/Samsung).
- **House brands** for brand-less items (65 importable + home/sports/jewelry mismatches), upserted once: `Shofy Tech, Shofy Wear, Shofy Beauty, Shofy Jewels, Shofy Home, Shofy Sport`.
- **15 wrong-brand existing rows fixed:** clothing→Legendary Whitetails; beauty(K-Beauty/Hyaluronic/Vitamin C/Mielle)→INIKA; home(Tea Set/Lamp/Bedding)→**Shofy Home**; sports(Yoga/Resistance)→**Shofy Sport** (or Nike); jewelry(Pearl/Gold)→**Shofy Jewels**; electronics audio→Sony; bags(Tote/Traveling)→Legendary Whitetails.
- `brand.id` always resolved & asserted non-null before insert.

---

## 8. New-Product Allocation (→ ~120, balanced)

**Single source of truth:** a frozen id list `backend/scripts/data/selection.json` (derived from the
allocation plan in `/tmp/shofy-catalog/design/allocation.md` + `_alloc_rows.json`). The importer
reads it; category/productType for each id come from the frozen map in §4 (so e.g. watches route to
`Đồng hồ`, overriding any stale category in the source file — finding #2, #6).

| productType | existing | + new (target) | final |
|---|--:|--:|--:|
| electronics | 16 | +6 | 22 |
| fashion | 11 | +9 | 20 |
| beauty | 11 | +8 | 19 |
| jewelry | 10 | +10 | 20 |
| home | 3 | +17 | 20 |
| sports | 2 | +16 | 18 |
| **TOTAL** | **53** | **+66** | **119** |

(119; one extra id may be added to land on 120. Every vertical 18–22.) No duplicate source ids;
`importId` guards against re-import duplicates.

---

## 9. Migration & Safety

**Write order:** `backup → brands → categories → re-point products → products(import/fix) → resync aggregates → verify`. Each phase re-runnable; orchestrator stops on first failure.

1. **Backup (mandatory pre-write gate):** EJSON dump of products+categories+brands to `backend/backups/<timestamp>/` + `manifest.json` (`{timestamp, mongoUriHash (SHA-256, never the URI), counts, gitCommit}`). Abort if any count is 0. (Timestamp obtained at runtime via the node process.)
2. **Idempotency keys:** products → `importId` then `slug`; categories → `parent`; brands → `name`. Add **unique-sparse index on `importId`** (existing 53 have none → coexist). All upserts use `$set` + `$setOnInsert`.
3. **`--dry-run` is the default**; writes require explicit `--commit`. Dry-run prints the per-collection plan, writes `dry-run-plan.json`, and runs all §10 checks against the projected post-state.
4. **Re-point before delete (finding #11):** upsert renamed/new categories → re-point every product to its new `category.id` → only then `status:"Hide"` the now-empty extras. No product ever references a hidden/deleted category mid-run.
5. **Rollback:** `rollback.js <timestamp>|--latest` — validates `mongoUriHash` matches current DB (refuses cross-DB restore), requires `--yes`, takes its own pre-rollback backup, then full replace per collection. Lighter undo: `deleteMany({importId:/^dummyjson:/})` removes only this import's inserts.

---

## 10. Verification Checks (`verify.js`, read-only, non-zero exit on fail)

1. Total counts = existing + inserted; products in ~115–160.
2. **Zero orphan productTypes:** `distinct("productType") ⊆ {electronics,fashion,beauty,jewelry,home,sports}`.
3. 100% `img` matches `^https://res.cloudinary.com/dfddeabbs/`; zero `cdn.dummyjson.com`.
4. **No image used by > 5 products** (the legacy 16× image must be fixed; any new violator fails).
5. Every `category.id` resolves to an existing category; `category.name` matches that category's `parent`.
6. Every `brand.id` resolves to a brand.
7. **After resync:** `nProducts` & `products[]` length == `countDocuments({"category.id":cat._id})` for **every** category (existing nProducts are known-stale and are *rebuilt*, not preserved — finding #3).
8. Enum sanity: product `in-stock/out-of-stock/discontinued`; category `Show/Hide`; brand `active/inactive`.
9. `importId`, `slug`, `sku` unique.
10. `price≥0`, `quantity≥0`, `discount∈[0,100]`.
11. **NEW (finding #4) — productType↔category match:** for every product, `product.productType` == the `productType` of the category referenced by `product.category.id` (join on category.id). Catches the 5 orphans and any mis-file.
12. Cross-check via the read-only MongoDB MCP server (human verification path); discrepancy vs `verify.js` is itself a failure.

---

## 11. Frontend Touch (small, explicit)

`frontend/src/layout/headers/header-com/header-category.jsx`:
- `defaultTypes` → `["fashion","electronics","beauty","jewelry","home","sports"]` (add home+sports, drop "other").
- Map each type to a Vietnamese label for the top-level menu (`fashion`→"Thời trang", `electronics`→"Đồ điện tử", `beauty`→"Làm đẹp", `jewelry`→"Trang sức", `home`→"Nhà cửa & Đời sống", `sports`→"Thể thao").

(Category sub-items already render `item.parent`, which is now Vietnamese — no further change. CRM lists all categories, unaffected.)

---

## 12. Deliverables — Script Files under `backend/scripts/`

- `lib/db.js` — connect via `MONGO_URI`, models, dry-run/commit gating, `safeWrite()`.
- `lib/log.js` — structured logging + per-run log in backup dir.
- `lib/mappings.js` — **frozen** category tree (§4), DJ→productType/parent/children map, price/status/slug/sku fns, brand-fix matrix + house brands, VN-special list. **Single source of truth all importers import.**
- `data/selection.json` — frozen 66-id new-product list (§8).
- `data/translations.cache.json`, `data/image-manifest.json` — idempotency caches (committed after first real run).
- `backup.js` · `import-brands.js` · `import-categories.js` · `import-products.js` (build/localize/image/upsert + orphan re-point) · `resync-aggregates.js` · `verify.js` · `rollback.js` · `migrate.js` (orchestrator).
- `package.json` aliases: `backup`, `migrate:dry`, `migrate`, `verify`, `rollback`.

---

## 13. Adversarial-Review Findings → Resolution

| # | Severity | Finding | Resolved by |
|---|---|---|---|
| 1 | critical | 4 incompatible category models | §4 frozen 2-level model in `mappings.js`, evidence from frontend |
| 2 | critical | 2 conflicting new-product selections | §8 single `selection.json`; category from frozen map |
| 3 | high | stale `nProducts` breaks verify #7 | §9/§10 — resync rebuilds, verify runs after resync |
| 4 | high | orphan home/sports undetected | §6.1 explicit re-point + §10 check #12 (productType==category) |
| 5 | high | 3 conflicting brand strategies | §7.4 single matrix + house brands |
| 6 | medium | watches filed as necklace/bracelet | §4 dedicated `Đồng hồ` category |
| 7 | medium | `sizes[]` placeholder, webp URL | §7.3 explicit sizes per type + Cloudinary URL assert |
| 8 | medium | parent(VN) vs Category.name display | §4 — `parent` is VN display+key; menu renders `parent` |
| 9 | medium | VN-special set inconsistent | §6.2 frozen to 7 + manual image/cache (incl. Silk Scarf) |
| 10 | low | "4 stock-0" inaccurate | §7.1 — 3 importable |
| 11 | low | conflicting _id reuse/delete | §9 step 4 — re-point before soft-delete (no hard delete) |

---

## 14. Open Risks

- **Semi-prod DB** (public IP, no auth, shared): backup gate is non-negotiable; run `migrate:dry` and review before `--commit`.
- **Gemini quota/latency:** fallback to English keeps the run valid; re-run fills translations.
- **Cloudinary 500 req/hr:** ~120 products × ≤4 images ≈ ≤480 uploads — within one hour's limit but close; manifest skip + resumability handle partial runs.
- **DummyJSON availability:** source fetched once into local files; re-runs use cached files/selection.
