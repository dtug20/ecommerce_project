# CRM Quality Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three quality improvements to the Shofy CRM: currency formatting sourced from `SiteSetting`, polished `ImageUpload` component with URL-paste + size/MIME pre-checks, and a read-only product audit script that writes a CSV.

**Architecture:** Pure client-side hook for currency (React Query + Intl), single-file enhancement to the shared `ImageUpload` (Ant Design Tabs + `beforeUpload` validation), and a standalone Mongoose script that streams the products collection and outputs a CSV. One small backend change extends the public-settings endpoint to expose the `payment` subdoc.

**Tech Stack:** React 19, TypeScript, Ant Design 6, React Query 5, Vite, axios (CRM UI). Express, Mongoose (backend script). No new dependencies. No test runner added (CRM has none today).

**Spec:** [docs/superpowers/specs/2026-05-20-crm-quality-improvements-design.md](../specs/2026-05-20-crm-quality-improvements-design.md)

**Corrections to spec during exploration:**
- Public settings route is `/api/v1/store/settings`, **not** `/settings/public` (spec had wrong path).
- `getPublicSettings` currently **excludes** the `payment` subdoc by projection; this plan extends it to include `payment`. The `payment` subdoc holds no secrets — only `{ enabledGateways, currency, currencySymbol }` — so exposing it is safe.

---

## Task 1: Expose `payment` subdoc in `getPublicSettings`

**Files:**
- Modify: `backend/controller/v1/store-cms.controller.js:156-194`

- [ ] **Step 1: Edit projection to include `payment`**

In `backend/controller/v1/store-cms.controller.js`, change the projection passed to `SiteSetting.findOne` from:

```js
{
  siteName: 1,
  siteDescription: 1,
  logo: 1,
  favicon: 1,
  ogImage: 1,
  theme: 1,
  contact: 1,
  seo: 1,
}
```

to:

```js
{
  siteName: 1,
  siteDescription: 1,
  logo: 1,
  favicon: 1,
  ogImage: 1,
  theme: 1,
  contact: 1,
  seo: 1,
  payment: 1,
}
```

Update the JSDoc comment immediately above the function. Replace this line:

```js
 * Excludes: payment internals, maintenance config, shipping internals, i18n internals.
```

with:

```js
 * Includes: payment.{enabledGateways, currency, currencySymbol} (no secrets).
 * Excludes: maintenance config, shipping internals, i18n internals.
```

Update the safe-defaults fallback object (the `if (!settings)` branch) to include `payment`:

```js
return respond.success(
  res,
  {
    siteName: 'Shofy',
    siteDescription: '',
    logo: null,
    favicon: null,
    ogImage: null,
    theme: {},
    contact: {},
    seo: {},
    payment: { enabledGateways: ['stripe', 'cod'], currency: 'USD', currencySymbol: '$' },
  },
  'Settings retrieved successfully'
);
```

- [ ] **Step 2: Verify endpoint manually**

Start the backend (`cd backend && npm run dev`) and curl the endpoint:

```bash
curl -s http://localhost:7001/api/v1/store/settings | python3 -m json.tool | grep -A4 payment
```

Expected: a `"payment"` object with `currency`, `currencySymbol`, `enabledGateways`. No `apiKey`, no `secret`, no `clientId`. (The schema has none of those — this is a defense-in-depth assertion against a future schema change.)

- [ ] **Step 3: Commit**

```bash
git add backend/controller/v1/store-cms.controller.js
git commit -m "feat(backend): expose payment subdoc in public site settings"
```

---

## Task 2: Create `useSiteSettings` hook

**Files:**
- Create: `crm/crm-ui/src/hooks/useSiteSettings.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface PublicPaymentSettings {
  enabledGateways?: string[];
  currency?: string;
  currencySymbol?: string;
}

export interface PublicSettings {
  siteName?: string;
  siteDescription?: string;
  logo?: string | null;
  favicon?: string | null;
  ogImage?: string | null;
  theme?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  payment?: PublicPaymentSettings;
}

export function useSiteSettings() {
  return useQuery<PublicSettings>({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await api.get('/api/v1/store/settings');
      return (res.data?.data ?? {}) as PublicSettings;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
```

- [ ] **Step 2: TypeCheck**

CRM has no `typecheck` script (see `package.json`). Use:

```bash
cd crm/crm-ui && npx tsc -b --noEmit
```

Expected: PASS, no new errors.

- [ ] **Step 3: Commit**

```bash
git add crm/crm-ui/src/hooks/useSiteSettings.ts
git commit -m "feat(crm): add useSiteSettings hook"
```

---

## Task 3: Rewrite `useFormatters` to consume `useSiteSettings`

**Files:**
- Modify: `crm/crm-ui/src/hooks/useFormatters.ts` (full replace)

- [ ] **Step 1: Replace file contents**

```ts
import { useSiteSettings } from './useSiteSettings';

const CURRENCY_TO_LOCALE: Record<string, string> = {
  USD: 'en-US',
  VND: 'vi-VN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
};

const ZERO_DECIMAL_CURRENCIES = new Set(['VND', 'JPY', 'KRW']);

export interface Formatters {
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function useFormatters(): Formatters {
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
      }).format(Number.isFinite(amount) ? amount : 0),
    formatDate: (dateString: string) =>
      new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  };
}
```

Note: the existing file exports `formatCurrency` and `formatDate` as **standalone** functions. This rewrite drops them. All call sites must be migrated in Task 4 — TypeScript will catch any miss.

- [ ] **Step 2: TypeCheck**

```bash
cd crm/crm-ui && npx tsc -b --noEmit
```

Expected: errors at every existing call site of standalone `formatCurrency`/`formatDate`. These are intentional — they enumerate the migration work in Task 4. **Do not commit yet.**

---

## Task 4: Migrate all `formatCurrency` / `formatDate` call sites

**Files (all modify):**
- `crm/crm-ui/src/features/dashboard/index.tsx`
- `crm/crm-ui/src/features/products/index.tsx`
- `crm/crm-ui/src/features/orders/index.tsx`
- `crm/crm-ui/src/features/users/index.tsx`
- `crm/crm-ui/src/features/vendors/VendorsPage.tsx`
- `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx`
- Any additional file the typecheck flags

- [ ] **Step 1: Enumerate call sites**

```bash
cd /Users/mac/Downloads/ecommerce_website-main && \
  grep -rn "from '@/hooks/useFormatters'" crm/crm-ui/src --include='*.tsx' --include='*.ts'
```

Expected: ~6 files. If any file imports `formatCurrency` or `formatDate` directly (rather than via the hook), it must be migrated.

- [ ] **Step 2: Migration pattern (apply per file)**

For each file:

1. Replace the import. Change:

   ```ts
   import { formatCurrency, formatDate } from '@/hooks/useFormatters';
   ```

   to:

   ```ts
   import { useFormatters } from '@/hooks/useFormatters';
   ```

2. Inside the **component function** (after other hook calls, before the first return), add:

   ```ts
   const { formatCurrency, formatDate } = useFormatters();
   ```

3. If the file uses formatters inside a `useMemo`/`useCallback` dependency list, add `formatCurrency` / `formatDate` to the deps (or destructure them just before, which keeps the dep list stable since the hook returns a new object each render — wrap callers in `useMemo` if perf matters, but skip for now).

4. If the file uses formatters inside Recharts `<Tooltip formatter={…}>` or AntD `<Table columns>` defined **outside** the component, the columns must move inside the component or use `useMemo`. Example pattern:

   ```tsx
   const columns = useMemo<ColumnsType<Order>>(() => [
     {
       title: 'Total',
       dataIndex: 'total',
       render: (v: number) => formatCurrency(v),
     },
   ], [formatCurrency]);
   ```

- [ ] **Step 3: Migrate each file individually**

Per file, follow the pattern in Step 2, then run:

```bash
cd crm/crm-ui && npx tsc -b --noEmit
```

Move on when typecheck count drops. **Do not batch all files into a single edit** — work file-by-file so you can locate any per-file quirk.

- [ ] **Step 4: Verify zero remaining standalone imports**

```bash
grep -rn "import.*formatCurrency\|import.*formatDate" crm/crm-ui/src --include='*.tsx' --include='*.ts'
```

Expected: every line is `import { useFormatters }` (or related). No line should pull `formatCurrency` or `formatDate` as a named export.

- [ ] **Step 5: TypeCheck + build**

```bash
cd crm/crm-ui && npx tsc -b --noEmit && npm run build
```

Expected: both PASS.

- [ ] **Step 6: Smoke test in dev**

```bash
cd crm/crm-ui && npm run dev
```

Open the CRM in a browser (Keycloak login). For each currency value:

1. Open General Settings → Payment → set currency to `VND`, save. Reload CRM.
2. Verify Dashboard revenue card, Orders total column, Products price column, Vendors revenue/payout columns all show `1.234.567 ₫` style (Vietnamese grouping, dong symbol, no decimals).
3. Set currency to `EUR`, reload — formats use `1.234,56 €`.
4. Revert to `USD`, reload — back to `$1,234.56`.

If any column still shows USD when currency is set to VND, the migration missed that file — find it via grep and patch.

- [ ] **Step 7: Commit**

```bash
git add crm/crm-ui/src/hooks/useFormatters.ts crm/crm-ui/src/features
git commit -m "feat(crm): currency + date formatting via SiteSetting"
```

---

## Task 5: Enhance `ImageUpload` — file size + MIME pre-checks

**Files:**
- Modify: `crm/crm-ui/src/components/commons/ImageUpload.tsx`

This task adds client-side validation to the existing Upload mode only. The URL-paste tab is Task 6.

- [ ] **Step 1: Add constants and validation helper at the top of the file (after imports)**

```ts
const MAX_BYTES = 5 * 1024 * 1024;        // hard limit (matches backend multer)
const WARN_BYTES = 3 * 1024 * 1024;       // soft warning threshold
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(1) + 'MB';

function validateImageFile(file: File): { ok: boolean; warn?: string } {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false };
  }
  if (file.size > WARN_BYTES) {
    return { ok: true, warn: `Large file (${formatMB(file.size)}) — upload may be slow` };
  }
  return { ok: true };
}
```

- [ ] **Step 2: Wire validation into `beforeUpload`**

Currently both `<Upload>` instances in the file use:

```tsx
beforeUpload={(file) => {
  handleUpload(file);
  return false;
}}
```

Replace with (in **both** places — when `value` is set and when not):

```tsx
beforeUpload={(file) => {
  if (!ALLOWED_MIME.includes(file.type)) {
    toast.error(`Unsupported type: ${file.type || 'unknown'}. Use JPG/PNG/WebP.`);
    return false;
  }
  if (file.size > MAX_BYTES) {
    toast.error(`File too large (${formatMB(file.size)}). Max 5MB.`);
    return false;
  }
  if (file.size > WARN_BYTES) {
    toast(`Large file (${formatMB(file.size)}) — upload may be slow`, { icon: '⚠️' });
  }
  handleUpload(file);
  return false;
}}
```

(Returning `false` keeps the current behaviour where AntD never auto-uploads — `handleUpload` does the real work. We do not use `Upload.LIST_IGNORE` here because the component uses `showUploadList={false}`, so the list-ignore distinction is moot.)

- [ ] **Step 3: Update `accept` attribute**

Change `accept="image/*"` to `accept="image/jpeg,image/png,image/webp"` in both `<Upload>` instances. This makes the OS file picker hide non-matching files.

- [ ] **Step 4: Update placeholder text to reflect constraints**

Replace the placeholder element:

```tsx
<div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13 }}>{placeholder}</div>
```

with:

```tsx
<div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13, textAlign: 'center' }}>
  {placeholder}
  <div style={{ fontSize: 11, marginTop: 4 }}>JPG / PNG / WebP, max 5MB</div>
</div>
```

- [ ] **Step 5: TypeCheck**

```bash
cd crm/crm-ui && npx tsc -b --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crm/crm-ui/src/components/commons/ImageUpload.tsx
git commit -m "feat(crm): pre-upload MIME + size validation in ImageUpload"
```

---

## Task 6: Enhance `ImageUpload` — URL paste tab

**Files:**
- Modify: `crm/crm-ui/src/components/commons/ImageUpload.tsx`

- [ ] **Step 1: Update imports**

Add `Tabs`, `Input` to the existing AntD import:

```ts
import { Upload, Button, Space, Spin, Tabs, Input } from 'antd';
import { UploadOutlined, DeleteOutlined, PictureOutlined, LinkOutlined } from '@ant-design/icons';
```

- [ ] **Step 2: Add `UrlPasteTab` sub-component**

Define **inside the same file**, above the main component:

```tsx
function UrlPasteTab({
  width,
  height,
  onConfirm,
}: {
  width: number | string;
  height: number | string;
  onConfirm: (url: string) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const isValidFormat = (() => {
    if (!urlInput) return false;
    try {
      new URL(urlInput);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <div>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="https://example.com/image.jpg"
          value={urlInput}
          onChange={(e) => {
            setUrlInput(e.target.value);
            setPreviewError(false);
          }}
          prefix={<LinkOutlined />}
        />
        <Button
          type="primary"
          disabled={!isValidFormat}
          onClick={() => {
            if (!isValidFormat) {
              toast.error('Invalid URL format');
              return;
            }
            onConfirm(urlInput);
          }}
        >
          Use
        </Button>
      </Space.Compact>

      {isValidFormat && (
        <div
          style={{
            marginTop: 12,
            width,
            height,
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            position: 'relative',
          }}
        >
          {previewError ? (
            <div style={{ color: '#ff4d4f', fontSize: 12, textAlign: 'center', padding: 12 }}>
              Image failed to load
              <br />
              <span style={{ color: '#8c8c8c' }}>The URL may be unreachable</span>
            </div>
          ) : (
            <img
              src={urlInput}
              alt="preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={() => setPreviewError(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Extract the existing Upload UI into a sub-component**

Locate the existing "empty state" `<Upload>` JSX (the dashed drop-zone shown when `!value`) and extract it into a function `UploadTab` taking the same props as the existing component (`placeholder`, `width`, `height`, `loading`, `handleUpload`). Keep the existing `beforeUpload` logic from Task 5 — do not lose the validation.

Skeleton:

```tsx
function UploadTab({
  placeholder,
  width,
  height,
  loading,
  handleUpload,
}: {
  placeholder: string;
  width: number | string;
  height: number | string;
  loading: boolean;
  handleUpload: (file: File) => void;
}) {
  return (
    <Upload
      showUploadList={false}
      beforeUpload={(file) => {
        if (!ALLOWED_MIME.includes(file.type)) {
          toast.error(`Unsupported type: ${file.type || 'unknown'}. Use JPG/PNG/WebP.`);
          return false;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`File too large (${formatMB(file.size)}). Max 5MB.`);
          return false;
        }
        if (file.size > WARN_BYTES) {
          toast(`Large file (${formatMB(file.size)}) — upload may be slow`, { icon: '⚠️' });
        }
        handleUpload(file);
        return false;
      }}
      accept="image/jpeg,image/png,image/webp"
    >
      <div
        style={{
          width,
          height,
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: '#fafafa',
          transition: 'border-color 0.2s',
        }}
      >
        {loading ? (
          <Spin />
        ) : (
          <>
            <PictureOutlined style={{ fontSize: 28, color: '#bfbfbf' }} />
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 13, textAlign: 'center' }}>
              {placeholder}
              <div style={{ fontSize: 11, marginTop: 4 }}>JPG / PNG / WebP, max 5MB</div>
            </div>
          </>
        )}
      </div>
    </Upload>
  );
}
```

- [ ] **Step 4: Render `Tabs` in the empty state**

In the main `ImageUpload` component, when `!value`, replace the existing `<Upload>` JSX with:

```tsx
return (
  <Tabs
    defaultActiveKey="upload"
    items={[
      {
        key: 'upload',
        label: (
          <span>
            <UploadOutlined /> Upload
          </span>
        ),
        children: (
          <UploadTab
            placeholder={placeholder}
            width={width}
            height={height}
            loading={loading}
            handleUpload={handleUpload}
          />
        ),
      },
      {
        key: 'url',
        label: (
          <span>
            <LinkOutlined /> Paste URL
          </span>
        ),
        children: (
          <UrlPasteTab
            width={width}
            height={height}
            onConfirm={(url) => onChange?.(url)}
          />
        ),
      },
    ]}
  />
);
```

The "value set" branch (preview + Replace + Remove buttons) does not need tabs — leave it as-is. Only ensure the Replace button's `<Upload>` still has the file-size/MIME validation from Task 5.

- [ ] **Step 5: TypeCheck**

```bash
cd crm/crm-ui && npx tsc -b --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add crm/crm-ui/src/components/commons/ImageUpload.tsx
git commit -m "feat(crm): add URL paste tab to ImageUpload"
```

---

## Task 7: Smoke test `ImageUpload`

- [ ] **Step 1: Dev server**

```bash
cd crm/crm-ui && npm run dev
```

- [ ] **Step 2: Browser checks (Products → New Product → image field)**

Run each:

1. Drag a **6 MB** JPEG → toast `File too large (6.0MB). Max 5MB.` No upload request fires (check Network tab).
2. Drag a **.pdf** file → toast `Unsupported type: application/pdf. Use JPG/PNG/WebP.`
3. Drag a **4 MB** PNG → toast `Large file (4.0MB) — upload may be slow`. Upload completes, preview appears.
4. Drag a **2 MB** WebP → no toast, silent upload, preview appears.
5. Switch to **Paste URL** tab. Paste `https://i.imgur.com/abc.png` (a known-good URL). Preview loads. Click `Use`. Form's `img` field receives the URL.
6. Clear, paste `not-a-url`. `Use` button is disabled (greyed out).
7. Clear, paste `https://this-host-definitely-does-not-exist.example/x.png`. After ~2-5s, preview area shows `Image failed to load`.
8. Open an existing product with `img` already set. Preview is shown with Replace + Remove buttons (no tabs — by design). Click Replace → MIME/size validation still runs.

If any check fails, fix inline (do not commit a regression).

- [ ] **Step 3: No commit needed — smoke test only**

---

## Task 8: Create `audit-products.js` script

**Files:**
- Create: `backend/scripts/audit-products.js`
- Modify: `.gitignore`

- [ ] **Step 1: Create the script**

Save as `backend/scripts/audit-products.js`:

```js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../model/Product');

const SLUG_RE = /^[a-z0-9-]+$/;

function isUrl(v) {
  if (typeof v !== 'string' || !v.trim()) return false;
  try {
    new URL(v.trim());
    return true;
  } catch {
    return false;
  }
}

function truncate(s, n) {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n) + '…' : str;
}

const CHECKS = [
  {
    code: 'MISSING_IMG',
    sev: 'high',
    test: (p) => !p.img || !String(p.img).trim(),
    detail: () => 'img field empty or whitespace-only',
  },
  {
    code: 'INVALID_IMG_URL',
    sev: 'high',
    test: (p) => p.img && String(p.img).trim() && !isUrl(p.img),
    detail: (p) => `Cannot parse URL: ${truncate(p.img, 60)}`,
  },
  {
    code: 'INVALID_PRICE',
    sev: 'high',
    test: (p) => !Number.isFinite(p.price) || p.price <= 0,
    detail: (p) => `price=${p.price}`,
  },
  {
    code: 'NEGATIVE_QTY',
    sev: 'high',
    test: (p) => typeof p.quantity === 'number' && p.quantity < 0,
    detail: (p) => `quantity=${p.quantity}`,
  },
  {
    code: 'MISSING_TITLE',
    sev: 'high',
    test: (p) => !p.title || !String(p.title).trim(),
    detail: () => 'title empty or whitespace-only',
  },
  {
    code: 'MISSING_CATEGORY',
    sev: 'medium',
    test: (p) => !p.category,
    detail: () => 'category ref missing or populate returned null',
  },
  {
    code: 'MISSING_BRAND',
    sev: 'medium',
    test: (p) => !p.brand,
    detail: () => 'brand ref missing or populate returned null',
  },
  {
    code: 'DISCOUNT_OUT_OF_RANGE',
    sev: 'medium',
    test: (p) => typeof p.discount === 'number' && (p.discount < 0 || p.discount > 100),
    detail: (p) => `discount=${p.discount}`,
  },
  {
    code: 'INVALID_SLUG',
    sev: 'low',
    test: (p) => !p.slug || !SLUG_RE.test(p.slug),
    detail: (p) => `slug=${truncate(p.slug, 40)}`,
  },
  {
    code: 'OFFER_DATE_INVALID',
    sev: 'low',
    test: (p) => {
      const s = p.offerDate?.start;
      const e = p.offerDate?.end;
      return s && e && new Date(s) > new Date(e);
    },
    detail: (p) =>
      `offerDate.start=${p.offerDate?.start} > end=${p.offerDate?.end}`,
  },
];

const CSV_HEADERS = [
  '_id',
  'title',
  'slug',
  'productType',
  'status',
  'issue_code',
  'issue_severity',
  'issue_detail',
  'updatedAt',
];

function escapeCsv(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function maskMongoUri(uri) {
  return String(uri || '').replace(/\/\/([^:]+):[^@]+@/, '//$1:***@');
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }
  console.log(`Connecting to: ${maskMongoUri(uri)}`);
  await mongoose.connect(uri);
  console.log('Connected. Scanning products…');

  const rows = [];
  let total = 0;
  const cursor = Product.find({}).populate('category', '_id').populate('brand', '_id').cursor();

  for await (const p of cursor) {
    total++;
    for (const c of CHECKS) {
      if (c.test(p)) {
        rows.push({
          _id: p._id.toString(),
          title: p.title || '',
          slug: p.slug || '',
          productType: p.productType || '',
          status: p.status || '',
          issue_code: c.code,
          issue_severity: c.sev,
          issue_detail: c.detail(p),
          updatedAt: p.updatedAt ? p.updatedAt.toISOString() : '',
        });
      }
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.resolve(__dirname, '..', '..', `audit-products-${ts}.csv`);

  const BOM = '﻿'; // Excel UTF-8 hint
  const csv =
    BOM +
    [
      CSV_HEADERS.join(','),
      ...rows.map((r) => CSV_HEADERS.map((h) => escapeCsv(r[h])).join(',')),
    ].join('\n');

  fs.writeFileSync(outPath, csv, 'utf8');

  const bySev = rows.reduce((acc, r) => {
    acc[r.issue_severity] = (acc[r.issue_severity] || 0) + 1;
    return acc;
  }, {});
  const productCount = new Set(rows.map((r) => r._id)).size;

  console.log('');
  console.log(`Scanned: ${total} products`);
  console.log(`Issues:  ${rows.length} (across ${productCount} products)`);
  console.log('By severity:', bySev);
  console.log(`CSV:     ${outPath}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `.gitignore` entry**

Append to `/Users/mac/Downloads/ecommerce_website-main/.gitignore`:

```
# Audit script output
audit-products-*.csv
```

- [ ] **Step 3: Verify `.gitignore` works**

```bash
cd /Users/mac/Downloads/ecommerce_website-main && touch audit-products-test.csv && git status --short audit-products-test.csv && rm audit-products-test.csv
```

Expected: the file does NOT show up in `git status --short` output. If it does, the gitignore line is wrong.

- [ ] **Step 4: Commit script + gitignore**

```bash
git add backend/scripts/audit-products.js .gitignore
git commit -m "feat(backend): add product data audit script"
```

---

## Task 9: Dry run audit script

- [ ] **Step 1: Run against the configured MongoDB**

```bash
cd backend && node scripts/audit-products.js
```

Expected output shape:

```
Connecting to: mongodb://...:***@.../shofy
Connected. Scanning products…

Scanned: <N> products
Issues:  <K> (across <M> products)
By severity: { high: …, medium: …, low: … }
CSV:     /Users/mac/Downloads/ecommerce_website-main/audit-products-2026-05-20T....csv
```

- [ ] **Step 2: Verify CSV**

Open the generated CSV in a spreadsheet app:

1. UTF-8 + BOM → Vietnamese product titles render correctly without an import wizard.
2. Header row matches `CSV_HEADERS` exactly.
3. Filter `issue_code = MISSING_IMG` (or whatever appears) — confirm the rows make sense.
4. Spot-check one row by querying the DB directly (`mongosh` or MongoDB MCP):

```js
db.products.findOne({ _id: ObjectId('<id-from-csv>') }, { title: 1, img: 1, price: 1, slug: 1 })
```

Confirm the document's state matches the reported issue.

- [ ] **Step 3: Delete the local CSV (optional)**

```bash
rm /Users/mac/Downloads/ecommerce_website-main/audit-products-*.csv
```

Or leave it — it is gitignored.

- [ ] **Step 4: No commit needed — verification only**

---

## Task 10: Final integration smoke + push

- [ ] **Step 1: Full TypeScript + build pass**

```bash
cd crm/crm-ui && npx tsc -b --noEmit && npm run build
```

Expected: both PASS, no warnings about unused exports.

- [ ] **Step 2: Backend lint (if any)**

```bash
cd backend && node -e "require('./scripts/audit-products.js')" 2>&1 | head -5
```

This requires-without-running ; should print nothing (the script's `main()` is invoked at the end, so it would actually try to connect — instead just confirm syntax with `node --check`):

```bash
cd backend && node --check scripts/audit-products.js && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Review git log**

```bash
git log --oneline origin/main..HEAD
```

Expected: 5 commits in order — `feat(backend): expose payment subdoc…`, `feat(crm): add useSiteSettings hook`, `feat(crm): currency + date formatting via SiteSetting`, `feat(crm): pre-upload MIME + size validation in ImageUpload`, `feat(crm): add URL paste tab to ImageUpload`, `feat(backend): add product data audit script`.

(If fewer commits, some task batched edits — that is OK; just confirm nothing was dropped.)

- [ ] **Step 4: Push**

```bash
git push origin main
```

CI/CD will build the three Docker images and deploy on the VPS.

- [ ] **Step 5: Production check**

Once deploy completes, log into the production CRM. Confirm:
- Dashboard revenue card shows currency matching `SiteSetting.payment.currency` (likely `USD` in prod unless changed).
- Open Products → Add Product → image field renders Tabs with Upload / Paste URL.

---

## Self-review

**Spec coverage:**
- ✅ Currency from SiteSetting → Tasks 1, 2, 3, 4
- ✅ ImageUpload polish (size, MIME, URL paste) → Tasks 5, 6, 7
- ✅ Audit script + CSV + gitignore → Tasks 8, 9
- ✅ Spec correction (route path, projection extension) → Task 1
- ✅ Final integration → Task 10

**Placeholder scan:** clean — every step has either exact code or exact commands with expected output.

**Type consistency:** `useFormatters` returns `Formatters { formatCurrency, formatDate }` — same names used throughout Task 4. `useSiteSettings` returns `PublicSettings` with optional `payment` — fallback handled in Task 3. `ImageUpload` props unchanged (Task 5, 6 only enhance internals).

**Risks called out in the plan:** typecheck breakage during Task 3 is **intentional** (it enumerates the migration in Task 4) and explicitly flagged with "Do not commit yet."
