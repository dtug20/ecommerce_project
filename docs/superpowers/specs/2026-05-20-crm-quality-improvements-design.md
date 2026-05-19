# CRM Quality Improvements — Design Spec

**Date**: 2026-05-20
**Author**: Anh Tuan (with Claude Code)
**Status**: Approved — ready for implementation plan
**Scope**: Spec B of a 2-spec split. Spec A (CRM i18n EN/VI) is queued for next.

## Summary

Three independent quality improvements to the Shofy CRM, bundled as one spec because they share a small surface area (≤7 files) and can ship in a single PR. Total effort estimate: ~1.5–2h implement + 30 min manual test.

1. **Currency sync from SiteSetting** — replace hardcoded `en-US` / USD in `useFormatters` with a React Query hook that reads `SiteSetting.payment.{currency, currencySymbol}` and derives the locale.
2. **Product image upload polish** — extend the shared `ImageUpload` component with a URL-paste tab, pre-upload file-size warning + hard limit, and strict MIME type check.
3. **Product data audit script** — standalone Node script (`backend/scripts/audit-products.js`) that scans the product collection for bad data (missing images, invalid URLs, non-positive prices, broken refs, etc.) and writes a CSV report.

Out of scope: image-dimension warning, auto-fix mode in the audit script, image-content reachability beyond `<img onError>`, Jest/Playwright tests for the new code.

## Motivation

- CRM today renders every price as `$1,234.56` regardless of the store's configured currency. Vietnamese admins seeing VND orders displayed as USD is misleading and was flagged during recent walk-through.
- Image upload silently fails when a file is too big or wrong type — the user only learns at the backend response (413/415). A correctly-configured product image is also the most common cause of broken cards on the storefront.
- No tool exists today to find products with bad data without a manual mongosh hunt. Admins occasionally ship products with `price=0` or empty `img` and only discover them when customers complain.

## Architecture

```
┌─────────────────── CRM UI ──────────────────────┐
│                                                  │
│  ┌─ useSiteSettings ─┐    ┌─ ImageUpload ──────┐│
│  │ React Query hook  │    │ - Tabs: Upload/URL ││
│  │ GET /api/v1/store │    │ - File pre-check   ││
│  │ /settings/public  │    │   (MIME + size)    ││
│  │ staleTime: 5 min  │    │ - URL paste preview││
│  └────────┬──────────┘    └────────────────────┘│
│           │                                       │
│  ┌────────▼──────────┐                            │
│  │  useFormatters    │   reads currency, locale  │
│  │  formatCurrency() │   from useSiteSettings    │
│  │  formatDate()     │                            │
│  └───────────────────┘                            │
└──────────────────────────────────────────────────┘
                       │
                       ▼ HTTP
┌────────────── Backend (existing) ───────────────┐
│  GET /api/v1/store/settings/public              │
│  → SiteSetting subset (public-safe)             │
└──────────────────────────────────────────────────┘

┌──────────── audit-products.js (new) ────────────┐
│  mongoose.connect(MONGO_URI)                    │
│  Product.find().populate('category brand')      │
│    .cursor()                                    │
│   → run CHECKS[] against each doc               │
│   → push 1 row per (product, issue)             │
│  → fs.writeFileSync audit-products-<ts>.csv     │
└──────────────────────────────────────────────────┘
```

The three features have no runtime coupling — they share only the spec because they ship together.

## Feature 1 — Currency sync from SiteSetting

### Data source

`SiteSetting.payment.currency` (default `"USD"`) and `SiteSetting.payment.currencySymbol` (default `"$"`). The locale is derived from the currency code via a small lookup map; we do not store locale separately to keep the settings UI simple.

### Components

**New** — `crm/crm-ui/src/hooks/useSiteSettings.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface PublicSettings {
  payment?: { currency?: string; currencySymbol?: string };
  // … other fields the public endpoint exposes (theme, contact, etc.) — typed loosely here
  [key: string]: unknown;
}

export function useSiteSettings() {
  return useQuery<PublicSettings>({
    queryKey: ['site-settings'],
    queryFn: () => api.get('/api/v1/store/settings/public').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
```

**Rewritten** — `crm/crm-ui/src/hooks/useFormatters.ts`

```ts
import { useSiteSettings } from './useSiteSettings';

const CURRENCY_TO_LOCALE: Record<string, string> = {
  USD: 'en-US', VND: 'vi-VN', EUR: 'de-DE',
  GBP: 'en-GB', JPY: 'ja-JP',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['VND', 'JPY', 'KRW']);

export function useFormatters() {
  const { data } = useSiteSettings();
  const currency = data?.payment?.currency ?? 'USD';
  const locale = CURRENCY_TO_LOCALE[currency] ?? 'en-US';
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);

  return {
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: zeroDecimal ? 0 : 2,
      }).format(amount),
    formatDate: (s: string) =>
      new Date(s).toLocaleDateString(locale, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
  };
}
```

### Migration

Every existing call site that imports `formatCurrency` or `formatDate` as standalone functions must switch to the hook form. Files affected (≈15 call sites — search:`grep -rn "formatCurrency\|formatDate" crm/crm-ui/src --include="*.tsx"`):

- `features/dashboard/index.tsx`
- `features/products/index.tsx`
- `features/orders/index.tsx`
- `features/users/index.tsx`
- `features/vendors/VendorsPage.tsx`
- `features/settings/PaymentSettingsPage.tsx`
- Any recharts `<Tooltip formatter={…}>` (must read from hook in the same component before being passed in)

Behaviour during the first 30 s after app boot, while the query is in-flight: `data` is `undefined`, falls back to `'USD'` / `'en-US'`. Acceptable because the prior behaviour was hardcoded USD anyway. Once the query resolves, React Query triggers a re-render and all formatters refresh.

### Backend dependency

Confirm that `GET /api/v1/store/settings/public` (handled by `backend/controller/v1/store-cms.controller.js::getPublicSettings`) already returns the `payment` subdocument. If it filters `payment` out for security, extend it to return only `{ currency, currencySymbol, enabledGateways }` — never raw gateway secrets.

### Out of scope

Per-order historical currency snapshots. Admins seeing legacy orders will see them in the *current* store currency, which is the same behaviour as the storefront.

## Feature 2 — Product image upload polish

### Goals

- Block clearly-invalid uploads on the client to avoid the round-trip-then-413/415 UX.
- Give admins an explicit way to use an external image URL (e.g., already-hosted on a vendor CDN) without uploading through Cloudinary.
- Keep the existing controlled-component contract (`value` / `onChange`) so consumers are not touched.

### Component contract (unchanged)

```ts
interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  folder?: string;            // existing
  placeholder?: string;
  width?: number | string;
  height?: number | string;
}
```

### UI

Two-tab Ant Design `Tabs`:

- **Upload** — existing dashed drop-zone, accepts JPG/PNG/WebP, max 5 MB.
- **Paste URL** — `Input` for the URL with a live `<img>` thumbnail beside it. Confirm button calls `onChange(url)`.

When `value` is already set (i.e., consumer's form has a URL), the component shows the existing preview with `Replace` and `Remove` buttons. `Replace` opens the same tabs UI.

### Validation rules

In `beforeUpload`:

```ts
const MAX_BYTES = 5 * 1024 * 1024;       // hard limit, matches backend multer
const WARN_BYTES = 3 * 1024 * 1024;      // soft warning
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

if (!ALLOWED_MIME.includes(file.type)) {
  toast.error(`Unsupported type: ${file.type}. Use JPG/PNG/WebP.`);
  return Upload.LIST_IGNORE;
}
if (file.size > MAX_BYTES) {
  toast.error(`File too large (${formatMB(file.size)}). Max 5MB.`);
  return Upload.LIST_IGNORE;
}
if (file.size > WARN_BYTES) {
  toast(`Large file (${formatMB(file.size)}) — upload may be slow`, { icon: '⚠️' });
}
handleUpload(file);
return false;
```

For the URL tab:

```ts
const handleUrlConfirm = () => {
  try { new URL(urlInput); } catch {
    toast.error('Invalid URL format');
    return;
  }
  onChange?.(urlInput);
};

// Live preview uses <img onError={() => setUrlPreviewError(true)}>
// which catches dead URLs without a HEAD request.
```

### File scope

`crm/crm-ui/src/components/commons/ImageUpload.tsx` only. Estimated growth: 143 → ~250 lines. Existing consumers (banners editor, products form, blog editor, etc.) are not touched.

### Out of scope

- Image-dimension check (`<800×800` warning) — opted out during brainstorming.
- HEAD request to verify URL reachability — `<img onError>` is good enough for live preview.

## Feature 3 — Product data audit script

### Why standalone Node script

- Read-only, run on demand by a developer or admin with backend access.
- No UI plumbing (proxy route + CRM page + table + export) for what is essentially an ops tool.
- Mirrors the established `migration/0X-*.js` and `backend/scripts/backfill-embeddings.js` pattern.

### File

`backend/scripts/audit-products.js` — ~100 lines.

### Checks performed

| Code | Condition | Severity |
|------|-----------|----------|
| `MISSING_IMG` | `!img` (null, undefined, empty string, whitespace-only) | high |
| `INVALID_IMG_URL` | `img` set but `new URL(img)` throws | high |
| `INVALID_PRICE` | `!Number.isFinite(price) \|\| price <= 0` | high |
| `NEGATIVE_QTY` | `quantity < 0` | high |
| `MISSING_TITLE` | `title` empty/whitespace | high |
| `MISSING_CATEGORY` | `category` ref null OR populate returns `null` (deleted doc) | medium |
| `MISSING_BRAND` | `brand` ref null OR populate returns `null` | medium |
| `DISCOUNT_OUT_OF_RANGE` | `discount < 0 \|\| discount > 100` | medium |
| `INVALID_SLUG` | `slug` empty OR contains whitespace/special chars (regex `/[^a-z0-9-]/`) | low |
| `OFFER_DATE_INVALID` | `offerDate?.start && offerDate?.end && start > end` | low |

Severity is informational only — admin chooses what to fix.

### CSV output

Saved to repo root (sibling of `backend/`): `audit-products-<ISO-timestamp>.csv`.

Columns: `_id, title, slug, productType, status, issue_code, issue_severity, issue_detail, updatedAt`.

One row per **(product, issue)** pair. A product with three issues produces three rows — easier to filter in Excel/Numbers (`AutoFilter` on `issue_code`) than nested JSON.

Encoding: UTF-8 with BOM (`﻿` prefix) so Excel renders Vietnamese product titles correctly without manual import-wizard intervention.

### Run

```bash
cd backend
node scripts/audit-products.js
```

Connects to whatever `MONGO_URI` is set in `backend/.env`. Stdout prints scan count + summary by severity. Exit code 0 on success regardless of issue count (it's a report, not a CI gate).

### Cursor + streaming

Use `.cursor()` rather than `.find().lean()` to keep memory bounded — the collection is small today (~1k docs) but the script should scale.

### Out of scope

- `--fix` mode (auto-unpublish, auto-zero quantities) — too risky, defer.
- Scanning blog posts, banners, users — separate scripts if needed.
- Scheduled cron / GitHub Action.

## Testing strategy

Manual smoke testing only. No Jest/Playwright additions (CRM has no test infrastructure today; adding it is scope creep).

### Currency

1. In CRM, open General Settings → Payment → change currency to `VND` → reload CRM.
2. Verify Dashboard revenue card, Orders table total column, Products table price column, Vendors payout column all render as `1.234.567 ₫`.
3. Repeat with `EUR` (decimals + comma separator) and `USD` (revert to baseline).
4. Edge: kill backend connection briefly → formatters fall back to USD; restore connection, wait 5 min or invalidate `['site-settings']` → re-formats.

### ImageUpload

1. Drag a 6 MB JPEG → error toast, no upload request.
2. Drag a .pdf → error toast.
3. Drag a 4 MB PNG → warning toast, upload completes.
4. Drag a 2 MB WebP → silent upload.
5. Paste `https://i.imgur.com/realImg.png` → live preview appears, confirm saves.
6. Paste `not-a-url` → confirm shows error.
7. Paste `https://nonexistent.example/x.png` → preview shows inline error.
8. Open an existing product with image set → preview + Replace/Remove still work.

### Audit script

1. Run against a *dev* MongoDB instance first (not `187.124.3.207`).
2. Verify CSV opens in Excel without garbled Vietnamese (BOM works).
3. Spot-check a few rows by querying Mongo directly.
4. Test edge inputs: insert a fixture product with `img: '   '`, `price: -1`, `category: ObjectId(<deleted>)` → verify all three issues appear in the CSV.

## Files touched

| File | Action | Notes |
|------|--------|-------|
| `crm/crm-ui/src/hooks/useSiteSettings.ts` | **new** | ~30 lines |
| `crm/crm-ui/src/hooks/useFormatters.ts` | **rewrite** | from standalone fns → hook |
| `crm/crm-ui/src/components/commons/ImageUpload.tsx` | **enhance** | 143 → ~250 lines |
| `crm/crm-ui/src/features/dashboard/index.tsx` | **migrate** | replace `formatCurrency` calls |
| `crm/crm-ui/src/features/products/index.tsx` | **migrate** | replace `formatCurrency` / `formatDate` |
| `crm/crm-ui/src/features/orders/index.tsx` | **migrate** | same |
| `crm/crm-ui/src/features/users/index.tsx` | **migrate** | dates |
| `crm/crm-ui/src/features/vendors/VendorsPage.tsx` | **migrate** | revenue + payout columns |
| `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx` | **migrate** | currency display |
| `backend/scripts/audit-products.js` | **new** | ~100 lines |
| `backend/controller/v1/store-cms.controller.js::getPublicSettings` | **verify/extend** | confirm `payment.currency` exposed |
| `.gitignore` | append | `audit-products-*.csv` |

## Risks and mitigations

- **First-render flicker** while `useSiteSettings` is in flight — falls back to USD. Acceptable; matches prior behaviour for the first 30 s after a hard reload.
- **`getPublicSettings` may not expose `payment`** — if so, extend it server-side to return a whitelisted subset. Never expose gateway secret keys.
- **CSV file accidentally committed** — added to `.gitignore` glob to prevent.
- **Audit script run on production by mistake** — script is read-only, but the prompt-in-stdout convention from `migration/` (`process.env.MONGO_URI`) means it always picks up whatever the env points to. Mitigation: log the URI host (with creds stripped) before scanning.

## Decisions log

- Single source of truth = SiteSetting (rejected per-order snapshot for complexity).
- Currency-to-locale map is hardcoded in the hook, not stored in DB — small set, changes rarely.
- Image-dimension warning explicitly dropped — nice-to-have, defer.
- Audit script outputs CSV only — no JSON, no admin UI — keep it ops-grade.
- No Jest specs — CRM has no test infra; adding it is a separate decision.
