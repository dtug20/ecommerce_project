# Phase 4 — Verification Checklist

> Generated: 2026-03-20

## Module Loading Tests

- [x] `backend/model/Payout.js` loads (1 export)
- [x] `backend/controller/v1/vendor.controller.js` loads (16 exports)
- [x] `backend/controller/v1/admin.vendor.controller.js` loads (11 exports)
- [x] `backend/controller/v1/analytics.controller.js` loads (8 exports)
- [x] `backend/controller/v1/email-template.controller.js` loads (5 exports)
- [x] `backend/controller/v1/activityLog.controller.js` loads (2 exports)
- [x] `backend/middleware/activityLog.js` loads (1 export)
- [x] `backend/services/paymentService.js` loads (1 export)
- [x] `backend/utils/emailRenderer.js` loads (1 export)
- [x] `backend/utils/emailService.js` loads (2 exports) — graceful when nodemailer not installed
- [x] `backend/routes/v1/payment.js` loads (1 export)
- [x] `backend/seeds/email-templates.seed.js` loads (1 export)
- [x] `backend/controller/v1/user.controller.js` loads (12 exports — was 11)
- [x] `backend/controller/v1/store.controller.js` loads (20 exports — was 18)
- [x] `backend/controller/order.controller.js` loads (5 exports)
- [x] `backend/controller/admin.order.controller.js` loads (7 exports)
- [x] `backend/routes/v1/vendor/index.js` loads with all vendor routes
- [x] `backend/routes/v1/admin/index.js` loads with vendor + analytics + email + activity log routes
- [x] `backend/routes/v1/store/index.js` loads with vendor store routes
- [x] `backend/routes/v1/user/index.js` loads with vendor apply route
- [x] `backend/routes/v1/index.js` loads with payment routes
- [x] `backend/model/Order.js` loads with `fulfillmentStatus` field in items
- [x] `backend/model/User.js` loads with `rejectionReason` in vendorProfile
- [x] `crm/controllers/vendorController.js` loads
- [x] `crm/controllers/analyticsController.js` loads
- [x] `crm/controllers/emailTemplateController.js` loads
- [x] `crm/controllers/activityLogController.js` loads
- [x] `crm/routes/vendor.routes.js` loads
- [x] `crm/routes/analytics.routes.js` loads
- [x] `crm/routes/email-template.routes.js` loads
- [x] `crm/routes/activity-log.routes.js` loads
- [x] CRM UI TypeScript compiles with zero errors (`tsc --noEmit`)
- [x] CRM UI Vite production build succeeds (871ms, all pages bundled)
- [x] Frontend ESLint passes (warnings only — no errors)

## Backend — Vendor

- [ ] `POST /api/v1/user/vendor/apply` — creates vendorProfile with pending status
- [ ] `GET /api/v1/vendor/profile` — returns vendor store profile
- [ ] `PATCH /api/v1/vendor/profile` — updates store name, description, logo, banner
- [ ] `GET /api/v1/vendor/products` — returns only vendor's products
- [ ] `POST /api/v1/vendor/products` — creates product with vendor ref auto-set
- [ ] `PATCH /api/v1/vendor/products/:id` — updates own product (ownership enforced)
- [ ] `DELETE /api/v1/vendor/products/:id` — soft-deletes to discontinued (blocks if pending orders)
- [ ] `GET /api/v1/vendor/orders` — returns orders with vendor's items (other items redacted)
- [ ] `GET /api/v1/vendor/orders/:id` — single order with vendor's items only
- [ ] `PATCH /api/v1/vendor/orders/:orderId/items/:itemId/status` — updates item fulfillmentStatus
- [ ] `GET /api/v1/vendor/analytics/summary` — returns vendor KPIs with period filter
- [ ] `GET /api/v1/vendor/analytics/revenue` — grouped by day/week/month
- [ ] `GET /api/v1/vendor/analytics/top-products` — top 10 by revenue or sellCount
- [ ] `POST /api/v1/vendor/payouts/request` — creates payout (validates available balance)
- [ ] `GET /api/v1/vendor/payouts` — own payout history
- [ ] `GET /api/v1/store/vendors/:slug` — returns public vendor profile
- [ ] `GET /api/v1/store/vendors` — lists approved vendors
- [ ] `GET /api/v1/store/products` — populates vendor info for "Sold by" badge

## Backend — Admin Vendor Management

- [ ] `GET /api/v1/admin/vendors` — paginated vendor list with filters
- [ ] `GET /api/v1/admin/vendors/stats` — counts by verification status
- [ ] `GET /api/v1/admin/vendors/:id` — vendor profile with aggregate stats
- [ ] `GET /api/v1/admin/vendors/:id/products` — vendor's products
- [ ] `GET /api/v1/admin/vendors/:id/orders` — orders with vendor's items
- [ ] `GET /api/v1/admin/vendors/:id/payouts` — vendor's payout history
- [ ] `PATCH /api/v1/admin/vendors/:id/approve` — changes status + role to vendor
- [ ] `PATCH /api/v1/admin/vendors/:id/reject` — sets rejected with reason
- [ ] `PATCH /api/v1/admin/vendors/:id/suspend` — suspends vendor + blocks user
- [ ] `PATCH /api/v1/admin/vendors/:id/commission` — updates commission rate
- [ ] `POST /api/v1/admin/vendors/:id/payouts/:payoutId/process` — processes payout

## Backend — Analytics

- [ ] `GET /api/v1/admin/analytics/dashboard` — returns all KPIs with comparisons
- [ ] `GET /api/v1/admin/analytics/sales-report` — daily breakdown for date range
- [ ] `GET /api/v1/admin/analytics/revenue?groupBy=day` — returns daily revenue array
- [ ] `GET /api/v1/admin/analytics/top-products` — returns top 10 (revenue or sellCount)
- [ ] `GET /api/v1/admin/analytics/top-categories` — top categories by revenue
- [ ] `GET /api/v1/admin/analytics/customer-growth` — user growth by week/month
- [ ] `GET /api/v1/admin/analytics/vendor-performance` — per-vendor stats
- [ ] `GET /api/v1/admin/analytics/recent-orders` — last 10 orders

## Backend — Email Templates

- [ ] `GET /api/v1/admin/email-templates` — lists all 9 templates
- [ ] `GET /api/v1/admin/email-templates/:id` — single template
- [ ] `PATCH /api/v1/admin/email-templates/:id` — updates subject, body, variables
- [ ] `POST /api/v1/admin/email-templates/:id/preview` — renders with sample data
- [ ] `POST /api/v1/admin/email-templates/:id/test` — sends test email
- [ ] Order confirmation email sent on order creation (fire-and-forget)
- [ ] Order shipped/delivered/cancelled email sent on status change
- [ ] Email templates seed: `node backend/seeds/email-templates.seed.js`

## Backend — Activity Log

- [ ] `GET /api/v1/admin/activity-log` — returns paginated logs with filters
- [ ] `GET /api/v1/admin/activity-log/export` — streams CSV download
- [ ] Admin product create → activity log entry created automatically
- [ ] Admin order status change → activity log entry created
- [ ] Admin user status change → activity log entry created

## Backend — Payments

- [ ] `POST /api/v1/user/orders` with `paymentMethod: 'COD'` — works as before
- [ ] `POST /api/v1/user/orders` with `paymentMethod: 'bank-transfer'` — returns bank details
- [ ] VNPay/MoMo return graceful "not yet implemented" message
- [ ] `POST /api/v1/auth/payment/vnpay/ipn` — returns 200
- [ ] `POST /api/v1/auth/payment/momo/ipn` — returns 200
- [ ] `POST /api/v1/auth/payment/stripe/webhook` — returns 200

## CRM Changes

- [ ] Vendor Management page: list, view, approve, reject, suspend, commission edit, payouts
- [ ] Analytics Dashboard: 6 stats cards, revenue chart with period selector, top products, customer growth
- [ ] Email Template Editor: grouped list, editor modal, variable insertion, preview, test send
- [ ] Activity Log: filterable table, detail drawer, CSV export
- [ ] Sidebar: Vendors and Activity Log entries added
- [ ] Routes registered: /vendors and /activity-log
- [ ] CRM proxy routes: /api/vendors, /api/analytics, /api/email-templates, /api/activity-log

## Frontend Changes

- [ ] Vendor store page renders at `/vendor/[slug]` (SSR)
- [ ] "Sold by" badge appears on vendor products (detail + card)
- [ ] "Become a Vendor" form in profile works
- [ ] Pending/rejected vendor application states display correctly
- [ ] Payment method selector shows enabled gateways from settings
- [ ] Bank Transfer option shows bank details after order
- [ ] COD payment still works end-to-end
- [ ] Multi-vendor order items grouped by vendor
- [ ] Multi-vendor shipping notice displayed

## Remaining Items for Runtime Testing

> These require running services (backend + MongoDB + CRM + frontend):

- [ ] Backend starts without errors (`npm run dev:backend`)
- [ ] Vendor application flow: user applies → admin approves → user becomes vendor
- [ ] Vendor product CRUD works with ownership enforcement
- [ ] Vendor order view shows only vendor's items
- [ ] Vendor analytics aggregations return correct data
- [ ] Vendor payout request validates available balance
- [ ] Admin vendor management: list, approve, reject, suspend, commission
- [ ] Admin analytics dashboard: all KPIs, charts, and comparisons
- [ ] Email templates seeded: `node backend/seeds/email-templates.seed.js`
- [ ] Email template editor: edit, preview, test send
- [ ] Activity log records admin write operations
- [ ] Activity log CSV export works
- [ ] Payment method selector in checkout
- [ ] Bank transfer order shows bank details
- [ ] Vendor store page displays products
- [ ] Multi-vendor order grouping works
- [ ] Socket.io events fire on vendor operations
