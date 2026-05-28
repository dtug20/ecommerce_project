# Bank Transfer Payment — Setup & Display Design

**Date:** 2026-05-29
**Status:** Approved
**Scope:** Backend, CRM, Storefront

## Problem

1. CRM Payment Settings shows "Bank Transfer" as an enableable gateway, but on the storefront checkout page the option does not appear (only COD and VNPay are rendered).
2. CRM has no form to capture the receiving bank account details (bank name, account number, account holder, etc.) that customers need to make the transfer.

## Root Cause

- **Key mismatch:** CRM stores the gateway key as `'bank_transfer'` (underscore). Backend (`paymentService.js`) and frontend (`checkout-payment-methods.jsx`) both expect `'bank-transfer'` (hyphen). Storefront `PAYMENT_ICONS['bank_transfer']` is `undefined` → the option is filtered out.
- **Missing schema + form:** `SiteSetting.paymentSchema` only defines `enabledGateways`. `paymentService.processBankTransfer` reads `settings.payment.bankTransfer`, which is always `undefined` → falls back to placeholder text `"Contact admin for bank details"`. CRM `PaymentSettingsPage.tsx` has no UI for bank account fields and its save mutation only sends `enabledGateways`.

## Goals

- Customers can select Bank Transfer at checkout and see the shop's bank details + VietQR.
- Admin can configure bank account details in CRM Settings → Payment.
- Order confirmation page shows the transfer reference with the actual order invoice number filled in.

## Non-Goals

- Multi-account configuration (single account only).
- Automatic transfer reconciliation (no bank webhook integration).
- Dynamic per-order VietQR generation (admin uploads a static QR).
- Snapshotting transfer content onto the Order document (computed on demand from invoice + current template).

## Architecture

### Backend — Data model

Extend `paymentSchema` in [backend/model/SiteSetting.js](../../../backend/model/SiteSetting.js):

```js
const bankTransferSchema = new mongoose.Schema(
  {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountName: { type: String, default: '' },
    branch: { type: String, default: '' },
    qrImageUrl: { type: String, default: '' },
    transferContentTemplate: { type: String, default: '' }, // e.g. "SHOFY-{orderId}"
  },
  { _id: false }
);
const paymentSchema = new mongoose.Schema(
  {
    enabledGateways: { type: [String], default: ['cod'] },
    bankTransfer: { type: bankTransferSchema, default: () => ({}) },
  },
  { _id: false }
);
```

### Backend — Validation

In [backend/validations/settings.validation.js](../../../backend/validations/settings.validation.js) add:

```js
const bankTransferSchema = Joi.object({
  bankName: Joi.string().allow('').max(100),
  accountNumber: Joi.string().allow('').max(50),
  accountName: Joi.string().allow('').max(100),
  branch: Joi.string().allow('').max(100),
  qrImageUrl: Joi.string().uri().allow(''),
  transferContentTemplate: Joi.string().allow('').max(200),
});

const paymentUpdateSchema = Joi.object({
  enabledGateways: Joi.array().items(
    Joi.string().valid('cod', 'bank-transfer', 'vnpay', 'momo', 'stripe')
  ),
  bankTransfer: bankTransferSchema,
}).custom((value, helpers) => {
  if (value.enabledGateways?.includes('bank-transfer')) {
    const bt = value.bankTransfer || {};
    if (!bt.bankName || !bt.accountNumber || !bt.accountName) {
      return helpers.error('any.invalid', {
        message: 'Bank Transfer enabled but missing required bank details',
      });
    }
  }
  return value;
});
```

The `enabledGateways` validator only accepts `'bank-transfer'` (hyphen). The old underscore form is rejected — this forces CRM consumers to use the canonical key.

### Backend — Payment service

In [backend/services/paymentService.js:64-90](../../../backend/services/paymentService.js):

`processBankTransfer` already reads `settings.payment.bankTransfer`. After the schema change it will receive real data. The `{orderId}` placeholder is **not** resolved here (the order does not have an invoice number yet at this point in the flow).

```js
static async processBankTransfer(order) {
  let bankDetails = { bankName: 'Contact admin for bank details' };
  try {
    const settings = await SiteSetting.findOne().lean();
    if (settings?.payment?.bankTransfer) {
      bankDetails = { ...settings.payment.bankTransfer };
    }
  } catch (err) {
    console.warn('[PaymentService] Could not load bank details from SiteSetting:', err.message);
  }
  return {
    success: true,
    paymentGateway: 'bank-transfer',
    paymentStatus: 'unpaid',
    transactionId: null,
    bankDetails,
  };
}
```

### Backend — Order controller

In [backend/controller/order.controller.js](../../../backend/controller/order.controller.js) `addOrder`, after the order is saved and `invoice` is assigned by the pre-save hook, resolve the template:

```js
const savedOrder = await order.save();
if (
  paymentMethod === 'bank-transfer' &&
  paymentResult.bankDetails?.transferContentTemplate
) {
  paymentResult.bankDetails.transferContent =
    paymentResult.bankDetails.transferContentTemplate.replace(
      '{orderId}',
      savedOrder.invoice
    );
}
// response: { order: savedOrder, bankDetails: paymentResult.bankDetails }
```

### Backend — Migration

New file `migration/13-normalize-bank-transfer-key.js`:

```js
await SiteSetting.updateMany(
  { 'payment.enabledGateways': 'bank_transfer' },
  { $set: { 'payment.enabledGateways.$': 'bank-transfer' } }
);
```

Run manually once after deployment.

### CRM — PaymentSettingsPage

In [crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx](../../../crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx):

1. **Fix gateway key:** change `value: 'bank_transfer'` to `value: 'bank-transfer'` in the `GATEWAYS` constant.
2. **Add `Bank Transfer Details` card** below the Payment Gateways card. Render conditionally via `Form.Item shouldUpdate` watching `enabledGateways`; only show when `'bank-transfer'` is checked.
3. **Fields:** `bankName` (required), `accountNumber` (required), `accountName` (required), `branch` (optional), `qrImageUrl` (image upload via existing Cloudinary helper), `transferContentTemplate` (with help text "Use `{orderId}` as a placeholder for the order number").
4. **Extend `saveMutation`** to send `payment.bankTransfer` in the payload.
5. **Extend `useEffect`** to populate the form with `s.payment?.bankTransfer ?? {}`.

Form validation: AntD `Form.validateFields()` enforces required fields inline; the backend Joi cross-field rule is the second line of defence.

### Storefront — Checkout payment methods

In [frontend/src/components/checkout/checkout-payment-methods.jsx](../../../frontend/src/components/checkout/checkout-payment-methods.jsx) the `'bank-transfer'` option already has an icon and label. After the CRM key fix it will render automatically. Extend the bank info block (currently lines 149–169) to display the new fields:

```jsx
{selectedMethod === 'bank-transfer' && (
  <div className="cl-checkout__bank-info">
    <h6>{t('checkout.bankTransferDetails')}</h6>
    {bankDetails?.bankName ? (
      <>
        <p><strong>{t('checkout.bankLabel')}</strong> {bankDetails.bankName}</p>
        <p><strong>{t('checkout.accountLabel')}</strong> {bankDetails.accountNumber}</p>
        <p><strong>{t('checkout.nameLabel')}</strong> {bankDetails.accountName}</p>
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
            <span className="cl-checkout__hint">{t('checkout.transferContentHint')}</span>
          </p>
        )}
      </>
    ) : (
      <p>{t('checkout.bankContactUs')}</p>
    )}
    <p className="cl-checkout__bank-note">{t('checkout.bankNote')}</p>
  </div>
)}
```

At the checkout step there is no `orderId` yet, so the template is shown raw with a hint that the order number will be filled in after placing the order.

### Storefront — Order confirmation

On the order confirmation/detail page show the bank details with the resolved `transferContent`. Compute on the frontend if not stored on Order:

```jsx
const resolvedContent = bankDetails.transferContentTemplate?.replace(
  '{orderId}',
  order.invoice
);
```

Add a **Copy** button next to the resolved content for one-click copy when making the transfer.

### Storefront — i18n

Add to both `frontend/src/locales/en/common.json` and `vi/common.json` under the `checkout` namespace:

| Key | EN | VI |
|---|---|---|
| `branchLabel` | Branch: | Chi nhánh: |
| `scanQrLabel` | Scan this QR to transfer: | Quét mã QR để chuyển khoản: |
| `transferContentLabel` | Transfer content: | Nội dung chuyển khoản: |
| `transferContentHint` | Order ID will be filled in after you place the order | Mã đơn sẽ hiển thị sau khi đặt hàng |
| `copyToClipboard` | Copy | Sao chép |

### Storefront — SCSS

In `frontend/public/assets/scss/...` (Clicon checkout partial), add:

- `.cl-checkout__bank-qr` — centred, `max-width: 200px`, margin top/bottom
- `.cl-checkout__bank-content code` — monospace font, muted background, small padding
- `.cl-checkout__hint` — italic, muted text colour, smaller font size

## Data Flow

```
1. Admin opens CRM /settings/payment, ticks Bank Transfer, fills fields, uploads QR, saves.
2. CRM PATCH /api/v1/admin/settings { payment: { enabledGateways, bankTransfer } }
3. Backend Joi-validates (cross-field rule), persists to SiteSetting, emits 'settings:updated' Socket.io event.
4. Storefront RTK Query invalidates the Settings tag and refetches.
5. Customer at /checkout sees "Bank Transfer" radio with icon + label.
6. Selecting it renders bank info (with raw template).
7. Place order → POST /api/v1/store/orders → PaymentService.processBankTransfer returns bankDetails.
8. order.save() assigns invoice; controller resolves {orderId} placeholder.
9. Response { order, bankDetails: { ..., transferContent: 'SHOFY-1042' } }.
10. Frontend redirects to /order/[id]; resolved transferContent shown with Copy button.
11. Order persisted with paymentStatus='unpaid', paymentGateway='bank-transfer'.
12. Admin reconciles manually (outside this spec) and updates paymentStatus to 'paid'.
```

## Components

| Unit | Responsibility | Interface |
|---|---|---|
| `bankTransferSchema` (Mongoose) | Persist bank account fields | Subdocument on `SiteSetting.payment` |
| `paymentUpdateSchema` (Joi) | Validate settings PATCH payload | Middleware on admin settings route |
| `processBankTransfer` (PaymentService) | Load bank details, return as part of payment result | `(order) → { success, bankDetails, ... }` |
| Order controller `addOrder` | Resolve `{orderId}` after invoice assignment | Mutates `paymentResult.bankDetails` before response |
| `BankTransferDetailsCard` (CRM) | Form UI for bank fields, image upload | Reads/writes form field `bankTransfer` |
| Bank info block (storefront checkout) | Render bank details + QR + raw template | Receives `bankDetails` prop |
| Order confirmation bank block | Render resolved `transferContent` + Copy button | Reads order invoice + bank details |
| `migration/13-normalize-bank-transfer-key.js` | One-shot key rename | Standalone Node script |

## Error Handling

- **CRM:** AntD inline validation when required fields are empty while bank-transfer is enabled.
- **Backend:** Joi cross-field rule returns 422 if bank-transfer is enabled without the three required fields.
- **PaymentService:** If `settings.payment.bankTransfer` is missing or read fails, falls back to existing placeholder behaviour — order still succeeds.
- **Storefront:** If `bankDetails.bankName` is empty, falls back to the existing "Contact us for bank details" message.
- **Migration:** Idempotent — re-running has no effect once normalised.

## Testing

- **Joi unit test:** PATCH `/settings` with `enabledGateways: ['bank-transfer']` and empty `accountNumber` → 422.
- **Migration dry-run:** on a DB copy with `enabledGateways: ['cod', 'bank_transfer']` → after run, value is `['cod', 'bank-transfer']`.
- **CRM manual:** tick Bank Transfer with empty fields → inline errors. Fill and save → toast success; reload → fields populated.
- **Storefront manual:** enable bank-transfer in CRM, open /checkout, expect Bank Transfer radio with icon; selecting it shows bank info, QR image, raw template.
- **End-to-end manual:** place an order with bank-transfer → confirmation page shows `SHOFY-{actual invoice}`.
- **Playwright spec** `frontend/tests/checkout-bank-transfer.spec.js`: navigate to checkout, choose bank-transfer, assert bank name text and QR `<img>` visible.

## Files Touched

| File | Type |
|---|---|
| `backend/model/SiteSetting.js` | Edit |
| `backend/validations/settings.validation.js` | Edit |
| `backend/services/paymentService.js` | Edit |
| `backend/controller/order.controller.js` | Edit |
| `migration/13-normalize-bank-transfer-key.js` | New |
| `crm/crm-ui/src/features/settings/PaymentSettingsPage.tsx` | Edit |
| `frontend/src/components/checkout/checkout-payment-methods.jsx` | Edit |
| `frontend/src/pages/order/[id].jsx` (or equivalent confirmation page) | Edit |
| `frontend/src/locales/en/common.json` | Edit |
| `frontend/src/locales/vi/common.json` | Edit |
| `frontend/public/assets/scss/.../_checkout.scss` | Edit |
| `frontend/tests/checkout-bank-transfer.spec.js` | New |
