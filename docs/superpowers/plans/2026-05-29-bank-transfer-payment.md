# Bank Transfer Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bank Transfer a working checkout option — CRM admin can configure receiving bank account details, and customers see them (plus VietQR + resolved transfer reference) at checkout and on the order confirmation page.

**Architecture:** Extend `SiteSetting.payment` with a `bankTransfer` subdocument; fix a key-mismatch bug (`bank_transfer` ↔ `bank-transfer`) across CRM/backend/frontend by standardising on `bank-transfer`; add the bank details form to the CRM Payment Settings page; render the bank details + QR + resolved transfer content on the storefront checkout and order confirmation pages.

**Tech Stack:** Express.js + Mongoose 8 (backend), Joi (validation), React 19 + AntD 6 + TanStack Query (CRM), Next.js 13 + RTK Query + i18next + Bootstrap/Clicon SCSS (storefront), Jest + supertest (tests).

**Spec:** [docs/superpowers/specs/2026-05-29-bank-transfer-payment-design.md](../specs/2026-05-29-bank-transfer-payment-design.md)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `backend/model/SiteSetting.js` | Edit | Add `bankTransferSchema`, attach as `payment.bankTransfer` |
| `backend/validations/cms.validation.js` | Edit | Replace permissive `updateSettings` with a nested validator that enforces required bank fields when `bank-transfer` is enabled |
| `backend/routes/v1/admin/index.js` | Edit | Mount `validate.body(cmsValidation.updateSettings)` on `PATCH /settings` |
| `backend/services/paymentService.js` | Edit (light) | Already reads `settings.payment.bankTransfer` — verify `transferContentTemplate` is included in the return |
| `backend/controller/order.controller.js` | Edit | After `order.save()`, resolve `{orderId}` → `savedOrder.invoice` in `paymentResult.bankDetails.transferContent` |
| `backend/tests/settings.validation.test.js` | New | Jest test for the cross-field Joi rule |
| `migration/13-normalize-bank-transfer-key.js` | New | One-shot Mongo update: `'bank_transfer'` → `'bank-transfer'` |
| `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx` | Edit | Fix gateway key + add Bank Transfer Details card with image upload |
| `frontend/src/components/checkout/checkout-payment-methods.jsx` | Edit | Render new fields (branch, QR, transfer content template) |
| `frontend/src/pages/order/[id].jsx` | Edit | Bank Transfer Instructions section: bank info + resolved `transferContent` + Copy button + QR |
| `frontend/src/locales/en/common.json` | Edit | 5 new keys under `checkout` + 1 under `orderDetail` |
| `frontend/src/locales/vi/common.json` | Edit | Same keys translated |
| `frontend/public/assets/scss/layout/ecommerce/_clicon-checkout.scss` | Edit | 3 new selectors: `.cl-checkout__bank-qr`, `.cl-checkout__bank-content code`, `.cl-checkout__hint` |

Total: 11 edits, 2 new files.

---

## Task 1: Backend — Extend `SiteSetting.payment` with `bankTransfer` subdocument

**Files:**
- Modify: `backend/model/SiteSetting.js` (look for `paymentSchema` — around line 90-100; line numbers may drift; search for `enabledGateways`)

- [ ] **Step 1: Read the current `paymentSchema` definition**

Look for the section that defines `paymentSchema`:

```js
const paymentSchema = new mongoose.Schema(
  {
    enabledGateways: {
      type: [String],
      default: ["stripe", "cod"],
    },
  },
  { _id: false }
);
```

- [ ] **Step 2: Add `bankTransferSchema` and attach to `paymentSchema`**

Replace the block above with:

```js
const bankTransferSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountName: { type: String, default: '' },
    branch: { type: String, default: '' },
    qrImageUrl: { type: String, default: '' },
    transferContentTemplate: { type: String, default: '' },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    enabledGateways: {
      type: [String],
      default: ["stripe", "cod"],
    },
    bankTransfer: {
      type: bankTransferSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);
```

- [ ] **Step 3: Sanity-check the model loads (no syntax errors)**

Run from `backend/`:
```bash
node -e "require('./model/SiteSetting'); console.log('OK')"
```
Expected: `OK` printed; no thrown error.

- [ ] **Step 4: Commit**

```bash
git add backend/model/SiteSetting.js
git commit -m "feat(settings): add bankTransfer subdocument to payment schema"
```

---

## Task 2: Backend — Add Joi cross-field validator for `payment.bankTransfer`

**Files:**
- Modify: `backend/validations/cms.validation.js` (replace the permissive `updateSettings` with a nested validator)
- Test: `backend/tests/settings.validation.test.js` (new)

- [ ] **Step 1: Write the failing Jest test**

Create `backend/tests/settings.validation.test.js`:

```js
const { updateSettings } = require('../validations/cms.validation');

describe('updateSettings Joi validation', () => {
  test('accepts payload with bank-transfer disabled and no bankTransfer block', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['cod', 'vnpay'] },
    });
    expect(error).toBeUndefined();
  });

  test('accepts bank-transfer with all required bank fields filled', () => {
    const { error } = updateSettings.validate({
      payment: {
        enabledGateways: ['cod', 'bank-transfer'],
        bankTransfer: {
          bankName: 'Vietcombank',
          accountNumber: '0123456789',
          accountName: 'SHOFY CO LTD',
        },
      },
    });
    expect(error).toBeUndefined();
  });

  test('rejects bank-transfer when bankName is missing', () => {
    const { error } = updateSettings.validate({
      payment: {
        enabledGateways: ['bank-transfer'],
        bankTransfer: {
          bankName: '',
          accountNumber: '0123456789',
          accountName: 'SHOFY',
        },
      },
    });
    expect(error).toBeDefined();
    expect(error.message).toMatch(/bank/i);
  });

  test('rejects bank-transfer when bankTransfer block is missing entirely', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['bank-transfer'] },
    });
    expect(error).toBeDefined();
  });

  test('rejects unknown gateway value', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['paypal'] },
    });
    expect(error).toBeDefined();
  });

  test('still allows unknown top-level keys (back-compat)', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['cod'] },
      theme: { primary: '#ff0000' },
      contact: { email: 'a@b.c' },
    });
    expect(error).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test — should fail (old validator passes everything)**

Run from `backend/`:
```bash
npx jest tests/settings.validation.test.js -t 'rejects bank-transfer when bankName is missing'
```
Expected: FAIL — old validator (`Joi.object().unknown(true)`) accepts the payload.

- [ ] **Step 3: Update `backend/validations/cms.validation.js`**

Find the `updateSettings` block (around line 110-125):

```js
// Settings  (flexible — allow any key/value pairs)
// ...
const updateSettings = Joi.object().unknown(true);
```

Replace with:

```js
// Settings — nested validation for payment block, permissive for everything else
const bankTransfer = Joi.object({
  bankName: Joi.string().allow('').max(100),
  accountNumber: Joi.string().allow('').max(50),
  accountName: Joi.string().allow('').max(100),
  branch: Joi.string().allow('').max(100),
  qrImageUrl: Joi.string().uri().allow(''),
  transferContentTemplate: Joi.string().allow('').max(200),
}).unknown(false);

const payment = Joi.object({
  enabledGateways: Joi.array().items(
    Joi.string().valid('cod', 'bank-transfer', 'vnpay', 'momo', 'stripe')
  ),
  bankTransfer,
})
  .custom((value, helpers) => {
    if (value.enabledGateways?.includes('bank-transfer')) {
      const bt = value.bankTransfer || {};
      if (!bt.bankName || !bt.accountNumber || !bt.accountName) {
        return helpers.error('any.invalid', {
          message: 'Bank Transfer enabled but missing required bank details (bankName, accountNumber, accountName)',
        });
      }
    }
    return value;
  }, 'bank-transfer cross-field check')
  .unknown(true);

const updateSettings = Joi.object({
  payment,
}).unknown(true);
```

- [ ] **Step 4: Re-run the test — should pass now**

```bash
npx jest tests/settings.validation.test.js
```
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/validations/cms.validation.js backend/tests/settings.validation.test.js
git commit -m "feat(settings): add Joi cross-field validation for bank transfer required fields"
```

---

## Task 3: Backend — Wire `validate.body(updateSettings)` on `PATCH /admin/settings`

**Files:**
- Modify: `backend/routes/v1/admin/index.js:550`

- [ ] **Step 1: Read the current route definition**

Find around line 549-550:
```js
router.get('/settings',     cmsCtrl.getSettings);
router.patch('/settings',   authorization('admin', 'manager'), logActivity('update', 'setting'), cmsCtrl.updateSettings);
```

- [ ] **Step 2: Check if `validate` middleware and `cmsValidation` are already imported**

Run from `backend/`:
```bash
grep -n "require.*validate\|cmsValidation\|cms.validation" routes/v1/admin/index.js | head -10
```
Most CMS write routes already use it. If not imported, add:
```js
const validate = require('../../../middleware/validate');
const cmsValidation = require('../../../validations/cms.validation');
```

- [ ] **Step 3: Insert `validate.body` into the route chain**

Replace the `router.patch('/settings', ...)` line with:
```js
router.patch(
  '/settings',
  authorization('admin', 'manager'),
  validate.body(cmsValidation.updateSettings),
  logActivity('update', 'setting'),
  cmsCtrl.updateSettings
);
```

- [ ] **Step 4: Sanity-check the server boots**

```bash
node -e "require('./routes/v1/admin'); console.log('OK')"
```
Expected: `OK`.

- [ ] **Step 5: Commit**

```bash
git add backend/routes/v1/admin/index.js
git commit -m "feat(settings): apply Joi validation middleware on PATCH /admin/settings"
```

---

## Task 4: Backend — `addOrder` resolves `{orderId}` placeholder after save

**Files:**
- Modify: `backend/controller/order.controller.js` (function `exports.addOrder`)

- [ ] **Step 1: Locate the order save block**

Read `backend/controller/order.controller.js`, find `exports.addOrder`. There will be an `await order.save()` (or similar) call followed by the response. Note the variable name (likely `savedOrder` or `order`).

- [ ] **Step 2: Insert template resolution between save and response**

After `const savedOrder = await order.save();` (or the equivalent — adjust the variable name if it's `result`/`order`), add:

```js
// Resolve {orderId} placeholder in bank transfer content using actual invoice
if (
  paymentMethod === 'bank-transfer' &&
  paymentResult.bankDetails?.transferContentTemplate
) {
  paymentResult.bankDetails.transferContent =
    paymentResult.bankDetails.transferContentTemplate.replace(
      '{orderId}',
      String(savedOrder.invoice)
    );
}
```

Then in the response payload, make sure the response includes `bankDetails: paymentResult.bankDetails` (the existing code already returns `bankDetails` — verify by reading the response object construction).

- [ ] **Step 3: Smoke-test by running the backend in dev**

```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project/backend && npm run dev
```
In another terminal, hit the endpoint to verify a bank-transfer order returns `bankDetails.transferContent` with the invoice substituted. (Manual — defer to Task 10.)

- [ ] **Step 4: Commit**

```bash
git add backend/controller/order.controller.js
git commit -m "feat(order): resolve {orderId} placeholder in bank transfer reference after save"
```

---

## Task 5: Backend — Verify `paymentService.processBankTransfer` returns the template

**Files:**
- Modify (light): `backend/services/paymentService.js`

- [ ] **Step 1: Read `processBankTransfer`**

The existing function already spreads `settings.payment.bankTransfer` into `bankDetails`. After Task 1's schema change, this automatically includes the new fields. **No code change needed** unless the current implementation overwrites some fields. Read carefully and confirm.

Existing code (verify it matches):
```js
static async processBankTransfer(order) {
  let bankDetails = { bankName: 'Contact admin for bank details' };
  try {
    const settings = await SiteSetting.findOne().lean();
    if (settings?.payment?.bankTransfer) {
      bankDetails = settings.payment.bankTransfer;
    }
  } catch (err) {
    console.warn('[PaymentService] Could not load bank details from SiteSetting:', err.message);
  }
  return { success: true, paymentGateway: 'bank-transfer', paymentStatus: 'unpaid', transactionId: null, bankDetails };
}
```

If `bankDetails = settings.payment.bankTransfer;` is doing a direct assignment (Mongoose lean object), the new fields flow through automatically. If you find any field filtering, remove it.

- [ ] **Step 2: Apply a defensive spread to avoid mongoose object references**

Change the assignment to a shallow copy so downstream mutations in `order.controller` (adding `transferContent`) don't accidentally mutate the cached settings:

```js
if (settings?.payment?.bankTransfer) {
  bankDetails = { ...settings.payment.bankTransfer };
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/services/paymentService.js
git commit -m "fix(payment): shallow-copy bank details so order controller can mutate safely"
```

---

## Task 6: Migration — Normalize `bank_transfer` → `bank-transfer` in existing settings

**Files:**
- Create: `migration/13-normalize-bank-transfer-key.js`

- [ ] **Step 1: Write the migration script**

Create `migration/13-normalize-bank-transfer-key.js`:

```js
/**
 * Migration 13: normalize 'bank_transfer' → 'bank-transfer' in
 * SiteSetting.payment.enabledGateways.
 *
 * Reason: backend (paymentService) and frontend (checkout) use the
 * hyphenated form; the CRM previously stored the underscore form,
 * so the gateway never matched.
 *
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   cd backend && node ../migration/13-normalize-bank-transfer-key.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const SiteSetting = require('../backend/model/SiteSetting');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[migration 13] connected to', mongoose.connection.name);

  const result = await SiteSetting.updateMany(
    { 'payment.enabledGateways': 'bank_transfer' },
    { $set: { 'payment.enabledGateways.$': 'bank-transfer' } }
  );

  console.log('[migration 13] matched:', result.matchedCount, 'modified:', result.modifiedCount);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[migration 13] failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run against the dev database**

```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project && node migration/13-normalize-bank-transfer-key.js
```
Expected output: `[migration 13] matched: N modified: M` where N is the number of settings docs with `bank_transfer` (likely 1 from the screenshot evidence).

- [ ] **Step 3: Re-run to verify idempotency**

Run the same command again. Expected: `matched: 0 modified: 0`.

- [ ] **Step 4: Commit**

```bash
git add migration/13-normalize-bank-transfer-key.js
git commit -m "chore(migration): normalize bank_transfer key to bank-transfer in site settings"
```

---

## Task 7: CRM — Fix gateway key + add Bank Transfer Details card

**Files:**
- Modify: `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx`

- [ ] **Step 1: Fix the gateway value in the `GATEWAYS` constant**

Find:
```ts
{
  value: 'bank_transfer',
  label: 'Bank Transfer',
  icon: <BankOutlined />,
  description: 'Direct bank transfer',
},
```

Change `value: 'bank_transfer'` to `value: 'bank-transfer'`.

- [ ] **Step 2: Add imports for the new form widgets**

At the top of the file, ensure these imports are present (extend the existing import statements):
```ts
import { Input, Form, Card, Space, Typography } from 'antd';
import ImageUpload from '@/components/commons/ImageUpload';
```

`Form`, `Card`, `Space`, `Typography` are likely already imported — verify and skip duplicates.

- [ ] **Step 3: Extend `useEffect` to populate the bank transfer block**

Find the existing populate block:
```ts
useEffect(() => {
  if (data?.data) {
    const s = data.data;
    form.setFieldsValue({
      enabledGateways: s.payment?.enabledGateways ?? ['stripe', 'cod'],
    });
  }
}, [data, form]);
```

Replace with:
```ts
useEffect(() => {
  if (data?.data) {
    const s = data.data;
    form.setFieldsValue({
      enabledGateways: s.payment?.enabledGateways ?? ['stripe', 'cod'],
      bankTransfer: s.payment?.bankTransfer ?? {
        bankName: '',
        accountNumber: '',
        accountName: '',
        branch: '',
        qrImageUrl: '',
        transferContentTemplate: '',
      },
    });
  }
}, [data, form]);
```

- [ ] **Step 4: Extend `saveMutation` payload**

Find:
```ts
const saveMutation = useMutation({
  mutationFn: async () => {
    const values = await form.validateFields();
    return settingsApi.update({
      payment: {
        enabledGateways: values.enabledGateways ?? [],
      },
    });
  },
  ...
});
```

Replace the `mutationFn` body with:
```ts
mutationFn: async () => {
  const values = await form.validateFields();
  return settingsApi.update({
    payment: {
      enabledGateways: values.enabledGateways ?? [],
      bankTransfer: values.bankTransfer ?? {},
    },
  });
},
```

- [ ] **Step 5: Add the Bank Transfer Details card to the JSX**

Find the JSX return — there will be a `<Card title="Payment Gateways">` block. Immediately after the closing `</Card>` of that block (and before the page-level closing tags), insert:

```tsx
<Form.Item
  noStyle
  shouldUpdate={(prev, curr) =>
    prev.enabledGateways !== curr.enabledGateways
  }
>
  {({ getFieldValue }) => {
    const gateways: string[] = getFieldValue('enabledGateways') ?? [];
    if (!gateways.includes('bank-transfer')) return null;
    return (
      <Card
        title="Bank Transfer Details"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="Bank Name"
          name={['bankTransfer', 'bankName']}
          rules={[{ required: true, message: 'Bank name is required' }]}
        >
          <Input placeholder="e.g. Vietcombank" />
        </Form.Item>

        <Form.Item
          label="Account Number"
          name={['bankTransfer', 'accountNumber']}
          rules={[{ required: true, message: 'Account number is required' }]}
        >
          <Input placeholder="e.g. 0123456789" />
        </Form.Item>

        <Form.Item
          label="Account Holder"
          name={['bankTransfer', 'accountName']}
          rules={[{ required: true, message: 'Account holder is required' }]}
        >
          <Input placeholder="e.g. SHOFY CO., LTD" />
        </Form.Item>

        <Form.Item
          label="Branch (optional)"
          name={['bankTransfer', 'branch']}
        >
          <Input placeholder="e.g. Hanoi Branch" />
        </Form.Item>

        <Form.Item
          label="QR Code (optional)"
          name={['bankTransfer', 'qrImageUrl']}
          getValueFromEvent={(e) => (typeof e === 'string' ? e : e?.target?.value)}
        >
          <ImageUpload />
        </Form.Item>

        <Form.Item
          label="Transfer Content Template (optional)"
          name={['bankTransfer', 'transferContentTemplate']}
          extra="Use {orderId} as a placeholder. e.g. SHOFY-{orderId}"
        >
          <Input placeholder="SHOFY-{orderId}" />
        </Form.Item>
      </Card>
    );
  }}
</Form.Item>
```

> Note on `ImageUpload`: it takes a `value` (string URL) and emits the uploaded URL via `onChange`. If `getValueFromEvent` is unnecessary because the component already emits the string directly, drop that line. If TypeScript complains, fall back to `<Input placeholder="https://res.cloudinary.com/..." />` as a v1 simplification — but try `ImageUpload` first.

- [ ] **Step 6: Run TypeScript check + build**

```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project/crm/crm-ui && npx tsc --noEmit
```
Expected: no errors. If there are errors about `ImageUpload` props, inspect `crm/crm-ui/src/components/commons/ImageUpload.tsx` (it was located in the investigation step) and adjust prop names.

- [ ] **Step 7: Manual CRM smoke test**

Run the CRM in dev:
```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project/crm && npm run dev
```
Open `http://localhost:8081/settings/payment`. Verify:
1. Bank Transfer checkbox toggles the Bank Transfer Details card.
2. Saving with bank-transfer ticked but empty fields → AntD shows inline `required` errors.
3. Saving with all fields filled → toast `Payment settings saved`.
4. Reload → fields stay populated.

- [ ] **Step 8: Commit**

```bash
git add crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx
git commit -m "feat(crm): bank transfer details form + fix gateway key to bank-transfer"
```

---

## Task 8: Frontend — Add i18n keys for bank transfer fields

**Files:**
- Modify: `frontend/src/locales/en/common.json`
- Modify: `frontend/src/locales/vi/common.json`

- [ ] **Step 1: Add keys to `en/common.json`**

In the `checkout` namespace, add:
```json
"branchLabel": "Branch:",
"scanQrLabel": "Scan this QR to transfer:",
"transferContentLabel": "Transfer content:",
"transferContentHint": "Order ID will be filled in after you place the order",
"copyToClipboard": "Copy",
"copySuccess": "Copied to clipboard"
```

In the `orderDetail` namespace (create the namespace if absent), add:
```json
"bankInstructionsTitle": "Bank Transfer Instructions",
"bankInstructionsNote": "Please make the transfer using the details below. Your order will be processed once payment is received."
```

- [ ] **Step 2: Add the same keys to `vi/common.json` with Vietnamese values**

```json
// under checkout
"branchLabel": "Chi nhánh:",
"scanQrLabel": "Quét mã QR để chuyển khoản:",
"transferContentLabel": "Nội dung chuyển khoản:",
"transferContentHint": "Mã đơn sẽ hiển thị sau khi đặt hàng",
"copyToClipboard": "Sao chép",
"copySuccess": "Đã sao chép"

// under orderDetail
"bankInstructionsTitle": "Hướng dẫn chuyển khoản",
"bankInstructionsNote": "Vui lòng chuyển khoản theo thông tin bên dưới. Đơn hàng sẽ được xử lý sau khi chúng tôi nhận được thanh toán."
```

- [ ] **Step 3: Verify both files are valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('/Users/mac/Documents/ecommerce/ecommerce_project/frontend/src/locales/en/common.json','utf8')); console.log('en OK')"
node -e "JSON.parse(require('fs').readFileSync('/Users/mac/Documents/ecommerce/ecommerce_project/frontend/src/locales/vi/common.json','utf8')); console.log('vi OK')"
```
Expected: `en OK` and `vi OK`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/locales/en/common.json frontend/src/locales/vi/common.json
git commit -m "feat(i18n): add bank transfer field labels in en/vi"
```

---

## Task 9: Frontend — Enhance `checkout-payment-methods.jsx` with new fields

**Files:**
- Modify: `frontend/src/components/checkout/checkout-payment-methods.jsx` (lines 149-169)

- [ ] **Step 1: Read the current bank info block**

It currently renders `bankName`, `accountNumber`, `accountName` and a `bankNote`. We need to add `branch`, `qrImageUrl`, and `transferContentTemplate` (raw, with hint).

- [ ] **Step 2: Replace the bank info `<div>` block**

Replace:
```jsx
{selectedMethod === 'bank-transfer' && (
  <div className="cl-checkout__bank-info">
    <h6>{t('checkout.bankTransferDetails')}</h6>
    {bankDetails?.bankName ? (
      <>
        <p><strong>{t('checkout.bankLabel')}</strong> {bankDetails.bankName}</p>
        {bankDetails.accountNumber && (
          <p><strong>{t('checkout.accountLabel')}</strong> {bankDetails.accountNumber}</p>
        )}
        {bankDetails.accountName && (
          <p><strong>{t('checkout.nameLabel')}</strong> {bankDetails.accountName}</p>
        )}
      </>
    ) : (
      <p>{t('checkout.bankContactUs')}</p>
    )}
    <p className="cl-checkout__bank-note">
      {t('checkout.bankNote')}
    </p>
  </div>
)}
```

With:
```jsx
{selectedMethod === 'bank-transfer' && (
  <div className="cl-checkout__bank-info">
    <h6>{t('checkout.bankTransferDetails')}</h6>
    {bankDetails?.bankName ? (
      <>
        <p><strong>{t('checkout.bankLabel')}</strong> {bankDetails.bankName}</p>
        {bankDetails.accountNumber && (
          <p><strong>{t('checkout.accountLabel')}</strong> {bankDetails.accountNumber}</p>
        )}
        {bankDetails.accountName && (
          <p><strong>{t('checkout.nameLabel')}</strong> {bankDetails.accountName}</p>
        )}
        {bankDetails.branch && (
          <p><strong>{t('checkout.branchLabel')}</strong> {bankDetails.branch}</p>
        )}
        {bankDetails.qrImageUrl && (
          <div className="cl-checkout__bank-qr">
            <p><strong>{t('checkout.scanQrLabel')}</strong></p>
            <img src={bankDetails.qrImageUrl} alt="VietQR" width={180} height={180} />
          </div>
        )}
        {bankDetails.transferContentTemplate && (
          <p className="cl-checkout__bank-content">
            <strong>{t('checkout.transferContentLabel')}</strong>{' '}
            <code>{bankDetails.transferContentTemplate}</code>
            <span className="cl-checkout__hint"> — {t('checkout.transferContentHint')}</span>
          </p>
        )}
      </>
    ) : (
      <p>{t('checkout.bankContactUs')}</p>
    )}
    <p className="cl-checkout__bank-note">
      {t('checkout.bankNote')}
    </p>
  </div>
)}
```

- [ ] **Step 3: Verify the component still parses**

Build the frontend:
```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project/frontend && npm run lint -- --max-warnings=0
```
Expected: no errors from this file.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/checkout/checkout-payment-methods.jsx
git commit -m "feat(checkout): render branch + QR + transfer content template on bank transfer"
```

---

## Task 10: Frontend — Bank Transfer Instructions section on order confirmation page

**Files:**
- Modify: `frontend/src/pages/order/[id].jsx`

- [ ] **Step 1: Add the settings query import**

At the top of the file, add:
```jsx
import { useGetSettingsQuery } from "@/redux/features/cmsApi";
```

- [ ] **Step 2: Fetch settings inside the `SingleOrder` component**

Below the existing `useGetUserOrderByIdQuery` call, add:
```jsx
const { data: settingsData } = useGetSettingsQuery();
```

- [ ] **Step 3: Add a helper to copy text to clipboard**

Above the JSX return (after `paymentMethodKey` is computed), add:
```jsx
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    notifySuccess(t('checkout.copySuccess'));
  } catch {
    /* clipboard unavailable — silently ignore */
  }
};
```

- [ ] **Step 4: Insert the Bank Transfer Instructions block**

Inside the JSX, near where payment details are rendered (search for `trackOrder.paymentMethod`), add the following block right after the payment method line:

```jsx
{paymentMethodKey === 'methodBankTransfer' && (() => {
  const bt = settingsData?.data?.payment?.bankTransfer;
  if (!bt?.bankName) return null;
  const invoice = orderData?.order?.invoice ?? orderData?.invoice;
  const resolvedContent = bt.transferContentTemplate
    ? bt.transferContentTemplate.replace('{orderId}', String(invoice ?? ''))
    : '';
  return (
    <div className="cl-order__bank-instructions" style={{ marginTop: 24, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
      <h5>{t('orderDetail.bankInstructionsTitle')}</h5>
      <p style={{ marginBottom: 12 }}>{t('orderDetail.bankInstructionsNote')}</p>
      <p><strong>{t('checkout.bankLabel')}</strong> {bt.bankName}</p>
      <p>
        <strong>{t('checkout.accountLabel')}</strong> {bt.accountNumber}{' '}
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => copyText(bt.accountNumber)}>
          {t('checkout.copyToClipboard')}
        </button>
      </p>
      <p><strong>{t('checkout.nameLabel')}</strong> {bt.accountName}</p>
      {bt.branch && (
        <p><strong>{t('checkout.branchLabel')}</strong> {bt.branch}</p>
      )}
      {bt.qrImageUrl && (
        <div className="cl-checkout__bank-qr">
          <p><strong>{t('checkout.scanQrLabel')}</strong></p>
          <img src={bt.qrImageUrl} alt="VietQR" width={180} height={180} />
        </div>
      )}
      {resolvedContent && (
        <p>
          <strong>{t('checkout.transferContentLabel')}</strong>{' '}
          <code>{resolvedContent}</code>{' '}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => copyText(resolvedContent)}>
            {t('checkout.copyToClipboard')}
          </button>
        </p>
      )}
    </div>
  );
})()}
```

> Note on the `orderData` shape: the existing code uses `orderData?.order` in some places. Check the local `orderData` destructure near `paymentMethod` (line ~189) — use whichever shape is already used for `paymentMethod` in that file. The invoice field will be on the same object.

- [ ] **Step 5: Lint check**

```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project/frontend && npm run lint -- --max-warnings=0
```
Expected: no new errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/order/[id].jsx
git commit -m "feat(order): bank transfer instructions section with resolved content + copy button"
```

---

## Task 11: Frontend — SCSS for bank QR + content code styling

**Files:**
- Modify: `frontend/public/assets/scss/layout/ecommerce/_clicon-checkout.scss`

- [ ] **Step 1: Locate the existing `.cl-checkout__bank-info` block**

It should already exist (since `selectedMethod === 'bank-transfer'` was rendering a styled block before).

- [ ] **Step 2: Append the new selectors near the bank-info block**

Add at the bottom of the file (or next to `.cl-checkout__bank-info`):

```scss
.cl-checkout__bank-qr {
  margin: 16px 0;
  text-align: center;

  img {
    max-width: 200px;
    height: auto;
    border: 1px solid var(--clicon-border, #e5e7eb);
    border-radius: 8px;
    padding: 8px;
    background: #fff;
  }
}

.cl-checkout__bank-content {
  code {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.95em;
  }
}

.cl-checkout__hint {
  font-style: italic;
  color: var(--clicon-text-muted, #6b7280);
  font-size: 0.85em;
}
```

- [ ] **Step 3: Verify SCSS compiles (Next.js dev will fail on bad syntax)**

```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project/frontend && npm run build 2>&1 | tail -40
```
Expected: build finishes without SCSS errors. If full build is too slow, run `npm run dev` briefly and watch the console.

- [ ] **Step 4: Commit**

```bash
git add frontend/public/assets/scss/layout/ecommerce/_clicon-checkout.scss
git commit -m "feat(checkout): scss for bank QR, transfer content code, hint"
```

---

## Task 12: Manual end-to-end verification

**No file changes — verification only.**

- [ ] **Step 1: Start all three services**

In three terminals:
```bash
# Terminal A
cd /Users/mac/Documents/ecommerce/ecommerce_project/backend && npm run dev
# Terminal B
cd /Users/mac/Documents/ecommerce/ecommerce_project/crm && npm run dev
# Terminal C
cd /Users/mac/Documents/ecommerce/ecommerce_project/frontend && npm run dev
```

- [ ] **Step 2: Run migration 13 if not already run**

```bash
cd /Users/mac/Documents/ecommerce/ecommerce_project && node migration/13-normalize-bank-transfer-key.js
```

- [ ] **Step 3: Configure bank details in CRM**

- Open `http://localhost:8081/settings/payment`
- Tick **Bank Transfer**
- Fill: Bank Name `Vietcombank`, Account `0123456789`, Holder `SHOFY CO., LTD`, Branch `Hanoi`, upload a QR image, Transfer Content Template `SHOFY-{orderId}`
- Save → toast success
- Reload → all fields still populated

- [ ] **Step 4: Verify checkout shows bank transfer**

- Open `http://localhost:3001/checkout` with a product in cart
- Expect to see the Bank Transfer radio option (icon + label)
- Select it → bank info, branch, QR, and `SHOFY-{orderId}` template visible
- Hint text "Order ID will be filled in after you place the order" visible

- [ ] **Step 5: Place a bank transfer order**

- Fill billing form, choose Bank Transfer, click Place Order
- Verify redirect to `/order/<id>`
- Expect the **Bank Transfer Instructions** section to render with:
  - Same bank fields
  - QR image
  - `SHOFY-1042` (or whatever the actual invoice number is — placeholder substituted)
  - Two **Copy** buttons (one for account number, one for transfer content)
- Click Copy → toast "Copied to clipboard"

- [ ] **Step 6: Verify backend persisted the order correctly**

Use the MongoDB MCP (or `mongosh`):
```js
db.orders.findOne({}, { sort: { invoice: -1 } })
```
Expect: `paymentMethod: 'bank-transfer'`, `paymentGateway: 'bank-transfer'`, `paymentStatus: 'unpaid'`.

- [ ] **Step 7: Negative test — disable bank transfer in CRM, save with empty fields**

- In CRM PaymentSettings, un-tick Bank Transfer → save → expect success (no validation triggers)
- Re-tick Bank Transfer with all fields empty → expect inline form errors before submission

- [ ] **Step 8: No commit (verification only)**

---

## Spec Coverage Audit

| Spec section | Task |
|---|---|
| Schema `bankTransfer` | Task 1 |
| Joi cross-field validation | Task 2 |
| Wire validation middleware | Task 3 |
| `processBankTransfer` returns full details | Task 5 |
| `addOrder` resolves `{orderId}` | Task 4 |
| Migration 13 | Task 6 |
| CRM Payment Settings card + key fix | Task 7 |
| Storefront checkout UI updates | Task 9 |
| Order confirmation bank section | Task 10 |
| i18n EN/VI | Task 8 |
| SCSS | Task 11 |
| Manual verification | Task 12 |
| Playwright spec (out-of-scope per spec) | n/a — covered by Task 12 manual verification, formal Playwright deferred |

All spec sections covered. The optional Playwright spec is deferred to keep the plan tight; manual verification in Task 12 provides equivalent coverage for v1.
