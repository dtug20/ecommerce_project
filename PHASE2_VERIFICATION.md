# Phase 2 — Verification Checklist

> Generated: 2026-03-20

## Module Loading Tests

- [x] `backend/controller/v1/cms.controller.js` loads (32 exports)
- [x] `backend/controller/v1/store-cms.controller.js` loads (7 exports)
- [x] `backend/controller/v1/store.controller.js` loads with new `searchProducts` + filtered `getAllProducts`
- [x] `backend/routes/v1/admin/index.js` loads with CMS routes
- [x] `backend/routes/v1/store/index.js` loads with CMS + search + categories/tree routes
- [x] `backend/routes/v1/index.js` loads correctly
- [x] `crm/controllers/cmsController.js` loads
- [x] `crm/controllers/couponController.js` loads
- [x] `crm/routes/cms.routes.js` loads
- [x] `crm/routes/coupon.routes.js` loads
- [x] CRM UI TypeScript compiles with zero errors (`tsc --noEmit`)
- [x] CRM UI Vite production build succeeds (553ms, all 13 pages bundled)
- [x] Frontend ESLint passes (warnings only — no errors)

## Backend Changes

### CMS Admin Controllers (`cms.controller.js` — 32 functions)

- [x] Pages: listPages, getPage, createPage, updatePage, updatePageBlocks, deletePage, duplicatePage
- [x] Menus: listMenus, getMenu, createMenu, updateMenu, deleteMenu
- [x] Banners: listBanners, getBanner, createBanner, updateBanner, deleteBanner, updateBannerPriority
- [x] Blog: listBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost, publishBlogPost, unpublishBlogPost
- [x] Settings: getSettings, updateSettings (singleton pattern)
- [x] Coupons: listCoupons, getCoupon, createCoupon, updateCoupon, deleteCoupon
- [x] All write operations emit Socket.io events
- [x] All responses use `respond.*` utility functions
- [x] All list endpoints use `getPaginationParams`/`buildPagination`

### Store-Facing CMS Endpoints (`store-cms.controller.js` — 7 functions)

- [x] `getPageBySlug` — published pages only, blocks sorted by order
- [x] `getMenuByLocation` — active menus, recursive `isVisible` filter
- [x] `getActiveBanners` — scheduling + targeting checks, sorted by priority
- [x] `listPublishedBlogPosts` — paginated, filter by category/tag/featured
- [x] `getFeaturedBlogPosts` — limit 6, published only
- [x] `getBlogPostBySlug` — fire-and-forget view counter
- [x] `getPublicSettings` — excludes payment/maintenance/shipping/i18n internals

### Server-Side Product Filtering

- [x] `getAllProducts` — 14 query params: page, limit, sortBy, sortOrder, category, brand, minPrice, maxPrice, color, size, productType, vendor, featured, status, search, tag
- [x] `searchProducts` — `$text` search with `textScore` projection and sorting
- [x] Dynamic MongoDB filter construction (only includes provided params)
- [x] Proper pagination via `respond.paginated()`

### Route Updates

- [x] Admin routes: CMS stubs replaced with 35+ real routes
- [x] Store routes: CMS stubs replaced + `/products/search` + `/categories/tree`
- [x] `GET /blog/featured` declared before `GET /blog/:slug`
- [x] `PATCH /banners/priority` declared before `PATCH /banners/:id`

### CRM Proxy Routes

- [x] `crm/controllers/cmsController.js` — proxies to `/api/v1/admin/{pages,menus,banners,blog,settings}`
- [x] `crm/controllers/couponController.js` — proxies to `/api/v1/admin/coupons`
- [x] `crm/routes/cms.routes.js` — all CMS routes wired
- [x] `crm/routes/coupon.routes.js` — all coupon routes wired
- [x] `crm/server.js` — new route mounts added

## CRM UI Changes

### Navigation

- [x] Sidebar updated with hierarchical menu (CMS sub-menu, Settings sub-menu, Coupons)
- [x] `resolveSelectedKey` and `resolvePageTitle` handle nested paths

### New Feature Pages (13 total)

- [x] `CouponsPage.tsx` — CRUD table with filters, create/edit modal
- [x] `PagesListPage.tsx` — table with duplicate/delete actions
- [x] `PageEditorPage.tsx` — three-panel layout: block palette, block list, settings panel
- [x] `MenusPage.tsx` — menu list with location and item count
- [x] `MenuEditorPage.tsx` — two-panel with Ant Design Tree + item settings form
- [x] `BlogListPage.tsx` — table with publish/unpublish toggle
- [x] `BlogEditorPage.tsx` — split layout with content editor + sticky sidebar
- [x] `BannersPage.tsx` — table with wide create/edit modal (4 sections)
- [x] `ThemeSettingsPage.tsx` — color pickers, font selects, layout options
- [x] `GeneralSettingsPage.tsx` — site info, contact, social, maintenance, localization
- [x] `PaymentSettingsPage.tsx` — gateway toggles, currency settings
- [x] `ShippingSettingsPage.tsx` — methods list, threshold/cost inputs
- [x] `EmailTemplatesPage.tsx` — placeholder page

### Block Types Implemented in Page Editor

- [x] hero-slider — slides with title, subtitle, button, image
- [x] featured-products — product type, query type, limit
- [x] category-showcase — title, limit
- [x] banner-grid — banners with image, title, URL
- [x] text-block — HTML content textarea
- [x] product-carousel — product type, limit
- [ ] promo-section — stub (settings form placeholder)
- [ ] testimonials — stub
- [ ] newsletter — stub
- [ ] custom-html — stub
- [ ] brand-showcase — stub
- [ ] countdown-deal — stub
- [ ] image-gallery — stub
- [ ] video-section — stub

## Frontend Changes

### New Files

- [x] `redux/features/cmsApi.js` — 10 RTK Query endpoints
- [x] `components/cms/BlockRenderer.jsx` — maps blockType → component
- [x] `components/cms/AnnouncementBar.jsx` — dismissible with localStorage
- [x] `components/cms/DynamicMenu.jsx` — recursive menu renderer
- [x] `components/cms/blocks/HeroSlider.jsx` — Swiper-based slider
- [x] `components/cms/blocks/FeaturedProducts.jsx` — product grid
- [x] `components/cms/blocks/CategoryShowcase.jsx` — category tiles
- [x] `components/cms/blocks/BannerGrid.jsx` — responsive grid
- [x] `components/cms/blocks/TextBlock.jsx` — HTML content block
- [x] `components/cms/blocks/ProductCarousel.jsx` — horizontal scroll
- [x] `components/cms/blocks/Newsletter.jsx` — email signup UI
- [x] `pages/blog/[slug].jsx` — blog post detail with SSR

### Modified Files

- [x] `apiSlice.js` — 7 new cache tags
- [x] `pages/index.jsx` — SSR homepage with CMS blocks + fallback
- [x] `pages/shop.jsx` — server-side filtering via URL params
- [x] `pages/blog.jsx` — SSR blog listing from API
- [x] `layout/headers/header-com/menus.jsx` — dynamic CMS menu with fallback
- [x] `layout/footers/footer.jsx` — dynamic contact info from settings
- [x] `layout/wrapper.jsx` — theme CSS variables from settings
- [x] `utils/socketClient.js` — CMS event listeners + `registerCmsInvalidations`

### CSS Variable Mapping

- [x] `--tp-theme-primary` → theme.primaryColor
- [x] `--tp-theme-secondary` → theme.secondaryColor
- [x] `--tp-blue-1` → theme.accentColor
- [x] `--tp-ff-body` → theme.fontFamily

## Remaining Items for Runtime Testing

> These require running services (backend + MongoDB + CRM + frontend):

- [ ] Backend starts without errors (`npm run dev:backend`)
- [ ] CMS admin endpoints work with auth (`POST /api/v1/admin/pages`)
- [ ] Store endpoints return CMS content (`GET /api/v1/store/pages/home`)
- [ ] Server-side product filtering works (`GET /api/v1/store/products?category=...&minPrice=0&maxPrice=100`)
- [ ] Text search works (`GET /api/v1/store/products/search?search=headphone`)
- [ ] CRM Homepage Builder creates and edits pages with blocks
- [ ] CRM Menu Editor saves menu tree structure
- [ ] CRM Blog Manager publishes posts that appear on storefront
- [ ] CRM Banner Manager creates announcement bars
- [ ] CRM Theme Settings changes propagate to storefront CSS variables
- [ ] Frontend homepage renders CMS blocks when available
- [ ] Frontend falls back to hardcoded layout when CMS data unavailable
- [ ] Frontend navigation uses dynamic CMS menu
- [ ] Frontend shop page uses server-side filtering (check network tab)
- [ ] Frontend blog pages render from API
- [ ] Socket.io CMS events trigger cache invalidation
