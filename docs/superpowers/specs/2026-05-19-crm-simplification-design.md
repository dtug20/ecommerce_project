# CRM Simplification — Design Spec

**Date:** 2026-05-19
**Author:** anhtuan2004 (with Claude)
**Status:** Approved, ready for implementation

## 1. Goal

The current Shofy CRM has 28 pages across 9 feature groups, several of which add operational complexity without delivering value for this shop's actual workflow. This spec removes unused features and simplifies the surface area to ~13 pages without breaking the running storefront.

## 2. Business Context

- **Business model:** multi-vendor marketplace (Vendors module stays).
- **Content needs:** banner + blog only — no page builder, no menu builder.
- **Settings actually used:** General, Payment, Shipping.
- **Misc pages kept:** Activity Log, AI Chatbot analytics.
- **Approach:** "Cách B" — fully delete the UI **and** backend of unused features (models stay in DB for safe rollback).

## 3. Scope Summary

| Module | Before | After | Action |
|---|---|---|---|
| Dashboard | ✓ | ✓ | keep |
| Products | ✓ | ✓ | keep |
| Categories | ✓ | ✓ | keep |
| Orders | ✓ | ✓ | keep |
| Users | ✓ | ✓ | keep |
| Vendors | ✓ | ✓ | keep |
| Coupons | ✓ | ✓ | keep |
| CMS > Blog | ✓ | ✓ | keep |
| CMS > Banners | ✓ | ✓ | keep |
| **CMS > Pages (block editor)** | ✓ | ✗ | **delete** |
| **CMS > Menus (tree editor)** | ✓ | ✗ | **delete** |
| Settings > General | ✓ | ✓ | keep |
| Settings > Payment | ✓ | ✓ | keep |
| Settings > Shipping | ✓ | ✓ | keep |
| **Settings > Theme** | ✓ | ✗ | **delete** (hardcode CSS) |
| **Settings > Email Templates** | ✓ | ✗ | **delete** (hardcode templates) |
| Activity Log | ✓ | ✓ | keep |
| AI Chatbot analytics | ✓ | ✓ | keep |
| **Reviews moderation** | ✓ | ✗ | **delete** (auto-approve) |

**Net change:** 28 pages → 13 pages.

## 4. CRM UI Changes (`crm/crm-ui/`)

### 4.1 Files to delete
- `src/features/cms/pages/` — entire folder (PagesListPage, PageEditorPage)
- `src/features/cms/menus/` — entire folder (MenusPage, MenuEditorPage)
- `src/features/settings/ThemeSettingsPage.tsx`
- `src/features/settings/EmailTemplatesPage.tsx`
- `src/features/reviews/` — entire folder (ReviewsPage)

### 4.2 Files to edit
- `src/App.tsx` — remove route definitions for the 7 deleted pages
- `src/components/commons/MainLayout.tsx` — remove sidebar entries for: CMS > Pages, CMS > Menus, Settings > Theme, Settings > Email Templates, Reviews

### 4.3 New sidebar structure
```
Dashboard
Products
Categories
Orders
Users
Vendors
Coupons
CMS ↓
  Blog
  Banners
Settings ↓
  General
  Payment
  Shipping
Activity Log
AI Chatbot
```

## 5. CRM Server Proxy Changes (`crm/server.js` + `crm/routes/`)

### 5.1 Remove proxy route groups from `crm/server.js`
- `/api/cms/pages`
- `/api/cms/menus`
- `/api/email-templates`
- `/api/reviews` (admin moderation paths only — keep nothing since the CRM does not need review endpoints anymore)

### 5.2 Edit route files
- `crm/routes/cms.routes.js` — strip pages + menus handlers, keep blog + banners + settings (general/payment/shipping fields only)
- `crm/routes/review.routes.js` — DELETE the file

### 5.3 Files unchanged
- `crm/routes/vendor.routes.js`, `crm/routes/activity-log.routes.js`, `crm/routes/chatbot.routes.js`, `crm/routes/coupon.routes.js` — no change.

## 6. Backend Changes (`backend/`)

### 6.1 Controllers to cut
| File | Action |
|---|---|
| `controller/v1/cms.controller.js` | Remove the 7 Page functions and the 5 Menu functions. Keep blog, banners, settings, coupons. |
| `controller/v1/store-cms.controller.js` | Remove `getPageBySlug` and `getMenuByLocation`. Keep banners/blog/settings public reads. |
| `controller/v1/email-template.controller.js` | DELETE entire file. |
| `controller/v1/review.controller.js` | Remove admin moderation functions (approve / reject / reply / admin list). Keep user-side submit + product reviews list. Change new-review default `status: 'pending'` → `'approved'`. |

### 6.2 Routes to edit
- `routes/v1/admin.js` — remove `/pages`, `/menus`, `/email-templates`, and review moderation routes
- `routes/v1/store.js` — remove `/pages/:slug` and `/menus/:location`

### 6.3 Email rewrite
- Create `backend/utils/emailTemplates/` directory holding hardcoded EN/VI templates (JS files exporting `{ subject, html }` functions). One file per transactional template.
- Templates: `orderConfirmation.js`, `orderShipped.js`, `orderDelivered.js`, `orderCancelled.js`, `welcome.js`, `passwordReset.js`, `vendorApplication.js`, `vendorApproved.js`, `lowStockAlert.js`.
- Update `backend/utils/emailService.js`:
  - Keep the same `sendTemplatedEmail(slug, recipient, data, language)` signature for call-site compatibility.
  - Internally replace DB lookup → require the file by slug → render with the existing merge function.

### 6.4 Models — NOT deleted
- `Page`, `Menu`, `EmailTemplate` Mongoose models stay on disk and the underlying collections stay in MongoDB. This is the rollback path: re-introducing the UI is a git revert plus uncommenting the controller exports.

### 6.5 One-time data migration
- Before flipping the review default, run a one-off script (or `mongosh` command) to bulk-approve any pending reviews so the moderation queue isn't silently abandoned:
  ```js
  db.reviews.updateMany({ status: 'pending' }, { $set: { status: 'approved' } });
  ```

## 7. Storefront Changes (`frontend/`)

### 7.1 Homepage rewrite
`src/pages/index.jsx` — drop the `BlockRenderer` data path. Use a fixed layout:
1. HeroSlider (data from active Banners with `location: 'hero'`)
2. CategoryShowcase (data from `/api/v1/store/categories`)
3. FeaturedProducts (data from `/api/v1/store/products?featured=true`)
4. Blog preview (data from `/api/v1/store/blog?limit=3`)
5. Newsletter (static)

The 6 existing block components (HeroSlider, FeaturedProducts, CategoryShowcase, BannerGrid, TextBlock, ProductCarousel) stay — only how they're assembled changes.

### 7.2 Navigation
`src/components/layout/headers/DynamicMenu.jsx` — remove the CMS menu fetch branch. Always render the category-derived menu (the existing fallback path).

### 7.3 Theme CSS
`public/assets/scss/utils/_variables.scss` — hardcode the brand colors that used to come from `SiteSetting.theme`. Drop the runtime CSS-variable application code (in `_app.jsx` or wherever it lives).

### 7.4 RTK Query cleanup
`src/redux/features/cms/cmsApi.js` — remove `getPageBySlug` and `getMenuByLocation` endpoints. Keep banners, blog, settings.

### 7.5 Files unaffected
- Review display (already filters `status: 'approved'`)
- AnnouncementBar (driven by general settings — kept)
- Footer (driven by general settings — kept)

## 8. Risk + Mitigation

| Risk | Mitigation |
|---|---|
| Homepage breaks after removing block renderer | Step 1 of execution = rewrite homepage with fixed layout and verify in browser before any deletion happens. |
| Email send breaks when DB lookup is replaced | Keep `sendTemplatedEmail()` signature identical. All call sites continue to work; only the implementation changes. Test by triggering one order confirmation in dev. |
| Pending reviews lost | Run bulk-approve script before code changes ship. |
| Need to re-enable a deleted feature later | Models + DB data preserved. `git revert` restores controllers + UI. |

## 9. Execution Order (each step = own commit)

1. **Storefront homepage rewrite** — fixed layout, verify renders in browser.
2. **Storefront RTK + theme cleanup** — remove unused endpoints, hardcode CSS variables.
3. **CRM UI cleanup** — delete page folders, prune `App.tsx` + `MainLayout.tsx`.
4. **CRM server proxy cleanup** — strip route groups from `crm/server.js` + edit `cms.routes.js`, delete `review.routes.js`.
5. **Backend controllers + routes cleanup** — cut CMS pages/menus, delete email-template controller, prune review controller, change review default to approved.
6. **Backend email migration** — create `utils/emailTemplates/`, switch `emailService.js` to file-based lookup.
7. **Data migration** — run bulk-approve on pending reviews.
8. **Verification pass** — start backend + CRM + storefront, walk through: create product, place order, view order, vendor approve, submit review (should auto-show), edit blog post, edit banner, send test order to verify email.

## 10. Out of Scope

- Coupon simplification (display rules, targeting) — kept as-is per user choice ("Cách B" not "Cách C").
- Order timeline / statusHistory simplification — kept.
- Product Variants tab / SEO tab — kept.
- Phase 6 chatbot — only the analytics page in CRM is kept; chatbot itself untouched.
- Removing models / dropping collections — explicitly deferred to keep rollback safe.

## 11. Success Criteria

- CRM sidebar shows 13 entries (down from 28 pages).
- All 7 deleted page files are absent; running CRM does not produce 404 routes or broken sidebar links.
- Storefront homepage renders with banners + categories + featured products + blog preview, no CMS block API calls in the network tab.
- Email send still works for order confirmation (templated from `utils/emailTemplates/`).
- New user review appears on the product page without admin approval.
- `git log` shows 7 (or 8) discrete commits matching the execution order, each independently revertable.
