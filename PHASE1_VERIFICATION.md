# Phase 1 — Verification Checklist

> Generated: 2026-03-20

## Module Loading Tests

- [x] All 8 new models load without syntax errors (SiteSetting, Page, Menu, Banner, BlogPost, Wishlist, EmailTemplate, ActivityLog)
- [x] All 7 updated models load without syntax errors (User, Products, Category, Order, Coupon, Brand, Review, Admin)
- [x] `utils/respond.js` loads correctly
- [x] `utils/pagination.js` loads correctly
- [x] `routes/legacy-aliases.js` loads correctly
- [x] `routes/v1/index.js` and all sub-routers load correctly

## Backend Changes

- [x] `verifyToken.js` ROLE_PRIORITY includes `vendor`: `["admin", "manager", "staff", "vendor", "user"]`
- [x] `GET /health` returns `{ status: "ok", uptime, timestamp }` (placed before rate limiter)
- [x] `index.js` mounts v1 routes at `/api/v1`
- [x] `index.js` mounts legacy aliases at `/api` with deprecation headers
- [x] `socketEmitter.js` documents planned Phase 2+ events in comment block

## New Models Created

- [x] `backend/model/SiteSetting.js` — singleton with theme/contact/shipping/payment/seo/maintenance/i18n subdocs
- [x] `backend/model/Page.js` — ContentBlock subdoc array with 14 blockType enum values
- [x] `backend/model/Menu.js` — recursive MenuItem subdoc, 5 location enums
- [x] `backend/model/Banner.js` — content/scheduling/targeting/analytics subdocs
- [x] `backend/model/BlogPost.js` — i18n subdoc, text index, author ref
- [x] `backend/model/Wishlist.js` — unique user index, WishlistItem subdoc
- [x] `backend/model/EmailTemplate.js` — 9 type enums, variables array
- [x] `backend/model/ActivityLog.js` — TTL index (90 days), actor/resource subdocs

## Updated Models

- [x] User.js — added: addresses[], vendorProfile subdoc, dateOfBirth, gender, emailVerified, lastLogin, auth token fields, role enum includes "vendor"
- [x] Products.js — added: vendor ref, variants[], seo subdoc, weight, dimensions, shipping subdoc, barcode, text index
- [x] Category.js — added: name, slug, icon, parentCategory self-ref, ancestors[], level, sortOrder
- [x] Order.js — added: orderNumber, tax, paymentStatus, paymentGateway, transaction fields, tracking fields, items[], splitOrders[], parentOrder, expanded status enum
- [x] Coupon.js — added: usageLimit, usageCount, perUserLimit, usedBy[], applicableProducts/Categories, excludedProducts, displayRules
- [x] Brand.js — added: slug, featured, sortOrder
- [x] Review.js — added: images[], status (pending/approved/rejected), isVerifiedPurchase, helpful subdoc, adminReply subdoc

## API v1 Route Structure

- [x] `routes/v1/index.js` — mounts auth, store, user, vendor, admin groups
- [x] `routes/v1/auth.routes.js` — stub endpoints (501)
- [x] `routes/v1/store/index.js` — public endpoints (products, categories, brands, coupons + CMS stubs)
- [x] `routes/v1/user/index.js` — authenticated user endpoints (profile, orders, reviews + wishlist stubs)
- [x] `routes/v1/vendor/index.js` — vendor stubs (501)
- [x] `routes/v1/admin/index.js` — admin endpoints (products, categories, orders, users, staff, media, analytics + CMS stubs)
- [x] `routes/legacy-aliases.js` — maps all `/api/*` to existing routes with Deprecation headers

## CRM Changes

- [x] Sync route commented out in `crm/server.js`
- [x] Sync panel removed from CRM dashboard UI
- [x] Sync mutations, queries, imports removed from dashboard component
- [x] All 4 CRM controllers updated to proxy to `/api/v1/admin/*` (products, categories, orders, users)
- [x] CRM server still connects to MongoDB (for direct queries during transition)

## Migration Scripts

- [x] `migration/00-audit-diff.js` — schema diff audit
- [x] `migration/01-setup-unified.js` — create collections + indexes
- [x] `migration/02-migrate-admins.js` — copy admins
- [x] `migration/03-migrate-users.js` — merge users from both DBs
- [x] `migration/04-migrate-categories.js` — CRM authoritative
- [x] `migration/05-migrate-brands.js` — backend only
- [x] `migration/06-migrate-products.js` — CRM authoritative, merge reviews
- [x] `migration/07-migrate-orders.js` — both sources, status mapping
- [x] `migration/08-migrate-reviews.js` — backend only, add moderation fields
- [x] `migration/09-migrate-coupons.js` — backend only, add usage tracking
- [x] `migration/10-post-migration-fixes.js` — backfill computed fields
- [x] `migration/11-validate-migration.js` — validation checks
- [x] `migration/12-seed-defaults.js` — seed SiteSetting, Menu, home Page
- [x] `migration/README.md` — instructions

## Remaining Items for Runtime Testing

> These require a running MongoDB instance and will be tested during deployment:

- [ ] Backend starts without errors (`npm run dev:backend`)
- [ ] Existing endpoints still work (GET /api/product/all, GET /api/category/show)
- [ ] `GET /api/v1/store/products` returns new response envelope with pagination
- [ ] `GET /api/v1/admin/products` works with Keycloak auth
- [ ] `GET /health` returns uptime JSON
- [ ] Legacy aliases return Deprecation headers
- [ ] CRM starts without errors after sync removal
- [ ] CRM CRUD still works through updated v1 proxy paths
