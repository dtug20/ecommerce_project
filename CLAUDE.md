# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shofy is a full-stack e-commerce application with three services:
- **Frontend** (`frontend/`) — Next.js 13 storefront on port 3000
- **Backend** (`backend/`) — Express.js REST API on port 7001
- **CRM** (`crm/`) — Express.js admin panel with EJS on port 8080

**Database architecture (Phase 1 complete):** Migrating from dual-database (`shofy` + `shofy_ecommerce`) with sync service to a single unified database. The sync service has been removed from the CRM. Migration scripts are in `migration/`. The backend connects to whatever `MONGO_URI` is set in its `.env`.

## Phase 1 Status (Complete)

**What changed:**
- **8 new backend models** created: SiteSetting, Page, Menu, Banner, BlogPost, Wishlist, EmailTemplate, ActivityLog
- **7 existing models updated** with new fields (all backward-compatible with defaults)
- **API v1 routes** at `/api/v1/{auth,store,user,vendor,admin}/*` with standardized response envelope
- **Legacy aliases** at `/api/*` preserved with `Deprecation: true` headers (sunset: 2026-08-01)
- **Sync service removed** from CRM (route, dashboard UI, mutations)
- **CRM proxy paths updated** to `/api/v1/admin/*`
- **verifyToken** now includes `vendor` in ROLE_PRIORITY
- **Health endpoint** at `GET /health` (outside rate limiter)
- **Migration scripts** in `migration/` (00-12, run manually during deployment)
- **Utilities** added: `utils/respond.js` (standardized responses), `utils/pagination.js`

**What did NOT change:**
- Existing API endpoints — all continue to work via legacy aliases
- CRM model files — still present (transition period)

## Phase 2 Status (Complete)

**What changed:**

### Backend — CMS Controllers
- **`controller/v1/cms.controller.js`** — 32 functions: Pages (7), Menus (5), Banners (6), Blog (7), Settings (2), Coupons (5). All use `respond.*` and emit Socket.io events.
- **`controller/v1/store-cms.controller.js`** — 7 public read endpoints: getPageBySlug, getMenuByLocation, getActiveBanners, listPublishedBlogPosts, getFeaturedBlogPosts, getBlogPostBySlug, getPublicSettings.
- **Server-side product filtering** in `store.controller.js` — `getAllProducts` accepts 14 query params (category, brand, minPrice, maxPrice, color, size, productType, status, search, tag, featured, vendor + pagination). `searchProducts` uses `$text` index.
- **Admin routes** — CMS stubs replaced with real routes for all 6 resource groups.
- **Store routes** — CMS endpoints live + `/products/search` + `/categories/tree`.

### CRM — 13 New Feature Pages
- **Sidebar** — hierarchical menu with CMS and Settings sub-menus, Coupons entry
- **CMS Pages**: PagesListPage (table), PageEditorPage (three-panel: block palette + block list + settings)
- **CMS Menus**: MenusPage (list), MenuEditorPage (two-panel: tree + settings form)
- **CMS Blog**: BlogListPage (table), BlogEditorPage (split: editor + sticky sidebar)
- **CMS Banners**: BannersPage (table + wide modal with 4 sections)
- **Settings**: ThemeSettingsPage, GeneralSettingsPage, PaymentSettingsPage, ShippingSettingsPage, EmailTemplatesPage (placeholder)
- **Coupons**: CouponsPage (CRUD table with create/edit modal)
- **CRM proxy routes** added: `/api/cms/*` and `/api/coupons/*` in `crm/server.js`

### Frontend — Dynamic CMS Integration
- **RTK Query** — `cmsApi.js` with 10 endpoints for CMS data
- **BlockRenderer** — maps blockType to lazy components, renders blocks in order
- **7 block components**: HeroSlider, FeaturedProducts, CategoryShowcase, BannerGrid, TextBlock, ProductCarousel, Newsletter
- **Homepage** — SSR via `getServerSideProps`, renders CMS blocks when available, falls back to hardcoded layout
- **Navigation** — `DynamicMenu` component tries CMS menu first, falls back to categories
- **Footer** — uses settings API for contact info and social links with fallback
- **Blog** — SSR blog listing + `blog/[slug].jsx` detail page
- **Shop** — server-side filtering via URL query params (replaced client-side filtering)
- **Theme** — CSS variables (`--tp-theme-primary`, etc.) applied from settings
- **Socket.io** — CMS event listeners for page/menu/banner/blog/settings cache invalidation
- **AnnouncementBar** — dismissible banner from CMS with localStorage persistence

### Block Types Status
Fully implemented (6): hero-slider, featured-products, category-showcase, banner-grid, text-block, product-carousel
Stub forms in editor (8): promo-section, testimonials, newsletter, custom-html, brand-showcase, countdown-deal, image-gallery, video-section

### CMS Content Flow
Admin creates/edits content in CRM → CRM proxies to Backend API → Backend saves to MongoDB → Socket.io emits event → Frontend RTK Query cache invalidated → Storefront re-renders with new content.

## Phase 3 Status (Complete)

**What changed:**

### Backend — E-commerce Core

- **Wishlist CRUD** (`controller/v1/wishlist.controller.js`) — 5 endpoints: get, add ($addToSet + upsert), remove ($pull), clear, move-to-cart. All emit `wishlist:updated` Socket.io event.
- **Address Book** (in `controller/v1/user.controller.js`) — 5 endpoints: list, add (with isDefault logic), update, delete (default protection), set-default. Addresses are embedded subdocuments on User model.
- **Review Moderation** (`controller/v1/review.controller.js`) — 8 functions: admin list (paginated, filterable by status/rating/search/productId), get, product reviews, approve, reject (with reason), reply, delete (cascades to Product/User arrays). Store endpoint returns approved-only reviews with rating breakdown (avgRating + count per star). User review submission sets `status: 'pending'` and `isVerifiedPurchase` based on delivered order check.
- **Enhanced Products** — Admin create/update accepts `variants[]`, `seo{}`, `weight`, `dimensions`, `barcode`. Auto-generates slug. Validates variant SKU uniqueness. Product detail includes `reviewStats`.
- **Coupon Validation** — `POST /api/v1/store/coupons/validate` runs 10 checks (status, date range, min amount, productType, usageLimit, perUserLimit, applicableProducts, applicableCategories, excludedProducts). `GET /api/v1/store/coupons` filters by displayRules. Order creation validates coupon at save time, increments `usageCount`, pushes to `usedBy[]`.
- **Order Tracking** — `statusHistory[]` added to Order model. Status updates accept `trackingNumber`, `carrier`, `trackingUrl`, `estimatedDelivery`. Auto-generates tracking URLs from carrier templates (DHL, FedEx, GHTK, GHN, ViettelPost). Auto-sets `shippedAt`/`deliveredAt` on status transitions.

### CRM — Enhanced Pages

- **Review Moderation** (`ReviewsPage.tsx`) — Stats cards (Pending/Approved/Rejected/Avg Rating), filterable table, row actions (approve/reject with reason/reply/delete/view), bulk approve/reject. CRM proxy via `reviewController.js` + `review.routes.js`.
- **Enhanced Product Form** — Variants tab (table with SKU, color picker, size, price, stock, add/edit/delete). SEO tab (meta title/description with char counters, keywords tags, OG image). Main form additions: weight, dimensions, barcode.
- **Enhanced Category Page** — Tree view toggle with Ant Design Tree. Create/edit modal: slug, icon, parent category select.
- **Enhanced Order Detail** — Shipping tracking section (carrier select, tracking number, URL, estimated delivery, save/track buttons). Order timeline with Ant Design Steps showing status history.
- **Enhanced Coupon Management** — Display rules toggles (showOnBanner, showOnCheckout, showOnProductPage). Targeting: applicable products/categories, excluded products multi-select. Usage tracking view.
- **Sidebar** — Reviews entry added between Users and Coupons.

### Frontend — Shopping Experience

- **Server-Side Wishlist** — RTK Query endpoints (get/add/remove/clear). `useWishlist` hook: auth-aware (calls API when authenticated, always updates localStorage). 7 product item components updated. Wishlist page shows server data when logged in, localStorage for anonymous.
- **Product Variant Selector** — `ProductVariantSelector.jsx`: color swatches + size buttons from `variants[]`. Selection updates displayed price, stock, and images. Cart payload includes `selectedVariant`. Falls back to legacy `imageURLs` when no variants.
- **Address Book** — RTK Query endpoints (CRUD + set default). `AddressBook.jsx` tab in profile with Bootstrap cards. `CheckoutSavedAddresses.jsx` in checkout: radio list of saved addresses, auto-fills form, pre-selects default.
- **Review Enhancements** — `getProductReviews` endpoint loads approved reviews with pagination. `ReviewRatingBreakdown.jsx` (progress bars). `ReviewItem.jsx` shows verified purchase badge + admin reply. Review form: auth check, moderation notice, pending confirmation.
- **Order Tracking** — `OrderStatusTimeline.jsx` (vertical stepper: Placed→Processing→Shipped→Delivered). `OrderTrackingCard.jsx` (carrier, copyable tracking number, Track Package link). Integrated in order detail page.
- **Coupon Display Rules** — `CheckoutCouponSuggestions.jsx` shows available coupons in checkout. `validateCoupon` mutation for server-side validation. `use-checkout-submit.js` updated with server-side validation + client-side fallback.

### Wishlist Sync Strategy
Anonymous users: localStorage only (existing behavior preserved). Authenticated users: all add/remove operations call API AND update localStorage. `useWishlist` hook handles the branching. Cart remains localStorage-only (server-side cart sync deferred to Phase 4).

### Review Moderation Flow
User submits review → status set to `pending` → admin sees in CRM Review Moderation page → approves/rejects → only `approved` reviews shown on storefront. Admin can reply to reviews (shown below comment on storefront). `isVerifiedPurchase` badge shown for users who purchased the product.

## Commands

### Setup
```bash
npm run setup          # Run setup.sh: installs deps for backend + frontend, copies .env files
npm run install:all    # Install deps for root, backend, and frontend
```

### Development
```bash
npm run dev            # Start backend + frontend concurrently
npm run dev:backend    # Backend only (nodemon, port 7001)
npm run dev:frontend   # Frontend only (Next.js, port 3000)
cd crm && npm run dev  # CRM admin panel (nodemon, port 8080)
```

### Build & Production
```bash
npm run build          # Build both backend and frontend
npm run start          # Start both in production mode
```

### Data
```bash
npm run seed           # Run backend/seed.js — clears ALL collections then bulk inserts seed data
cd crm && npm run seed # Seed CRM data (8 products, 5 categories, 4 users, 2 orders)
```

### Other
```bash
npm run kill-ports     # Kill processes on ports 3000 and 7000
npm run clean-start    # Kill ports then start dev
cd frontend && npm run lint  # ESLint (Next.js config)
```

## Backend (`backend/`) — Express.js REST API

### Structure: Routes → Controllers → Services → Models

**Entry point:** `index.js` — Express + Socket.io + CORS + Morgan. Mounts all routes under `/api/*`.

### API Routes

| Prefix | Resource | Key Operations |
|--------|----------|---------------|
| `/api/user` | Users | signup, login, email verify, password reset, Google OAuth, profile update |
| `/api/admin` | Admins | register, login, staff CRUD, password management |
| `/api/product` | Products | CRUD, bulk insert, by-type (with `new`/`featured`/`topSellers` query params), offers, popular, top-rated, related, stock-out |
| `/api/category` | Categories | CRUD, bulk insert, by productType, by status ("Show"/"Hide") |
| `/api/brand` | Brands | CRUD, bulk insert, active brands |
| `/api/order` | Orders | create Stripe PaymentIntent, save order, list all, update status |
| `/api/user-order` | User Orders | dashboard analytics (daily/monthly totals, sales report, top categories), user's orders paginated. **Protected by `verifyToken` middleware.** |
| `/api/coupon` | Coupons | CRUD with dayjs date formatting |
| `/api/review` | Reviews | add (validates purchase history first), delete all for product |
| `/api/cloudinary` | Images | upload single/multiple (max 5) via multer, delete by public_id |

### Models (Mongoose)

- **User** — name, email, password (bcrypt pre-save hook), role ("user"/"admin"), status ("active"/"inactive"/"blocked"), confirmationToken for email verify, passwordResetToken
- **Admin** — separate model from User. Roles: "Admin"/"Super Admin"/"Manager"/"CEO". Default password hashed on creation.
- **Products** — title, price, discount, quantity, `imageURLs` array (color variants with sizes), parent/children category strings, brand object ref, category object ref, reviews array, `productType`, `offerDate` (start/end), `featured`, `sellCount`, tags, sizes
- **Order** — user ref, cart array, shipping info, payment info (Stripe `paymentIntent`), `paymentMethod` ("COD"/"Card"), `invoice` (auto-incremented from 1000 via pre-save hook), status ("pending"/"processing"/"delivered"/"cancel")
- **Category** — `parent` (main name, unique), `children` array, `productType`, products array ref, status ("Show"/"Hide")
- **Brand** — name (unique), logo, products array ref, status ("active"/"inactive")
- **Review** — userId ref, productId ref, rating (1-5), comment
- **Coupon** — couponCode, discountPercentage, minimumAmount, productType, startTime/endTime, status

### Authentication Flow

1. **Signup:** Creates user → generates confirmationToken → sends verification email → user status "inactive"
2. **Email Verify:** `GET /api/user/confirmEmail/:token` → validates token expiry → sets status "active" → returns JWT
3. **Login:** Validates credentials → checks status is "active" → returns JWT (2-day expiry, payload: `{_id, name, email, role}`)
4. **Password Reset:** Generates 10-minute tokenForVerify → sends email → user submits new password with token
5. **Google OAuth:** `POST /api/user/register/:token` — decodes JWT-encoded Google user data → creates or finds user → returns JWT
6. **Token generation:** `utils/token.js` — `generateToken` (2d) and `tokenForVerify` (10m), both use jsonwebtoken

### Middleware

- **verifyToken** — extracts Bearer token, verifies with `TOKEN_SECRET`, attaches `req.user`
- **authorization(...roles)** — checks `req.user.role` against allowed roles
- **uploder (multer)** — disk storage to `public/images/`, accepts PNG/JPG/JPEG/WEBP, 4MB limit
- **global-error-handler** — handles ValidationError, CastError, ApiError with consistent JSON response

### Socket.io Real-Time Events

Configured in `index.js`, CORS allows localhost:3000, 3001, 8080. `global.io` used by `utils/socketEmitter.js`.

Events emitted by controllers on CRUD operations:
- `product:created`, `product:updated`, `product:deleted`, `products:refresh`
- `category:created`, `category:updated`, `category:deleted`, `categories:refresh`
- `order:created`, `order:updated`, `order:deleted`, `orders:refresh`
- `user:created`, `user:updated`, `user:deleted`, `users:refresh`

### Stripe Integration

1. Frontend calls `POST /api/order/create-payment-intent` with total amount
2. Backend creates Stripe PaymentIntent (amount * 100 for cents, USD, card only)
3. Returns `clientSecret` for Stripe Elements on frontend
4. After payment confirmation, frontend calls `POST /api/order/saveOrder` with order + paymentIntent object

### Cloudinary Upload Flow

- Config in `utils/cloudinary.js` using `CLOUDINARY_NAME/API_KEY/API_SECRET`
- Upload: receives buffer from multer → streams to Cloudinary with `UPLOAD_PRESET` → returns `{ url, id }`
- Delete: `DELETE /api/cloudinary/img-delete?folder_name=X&id=Y`

### Seed Data (`seed.js`)

**WARNING: Clears ALL collections first.** Seeds: brands, categories, products, coupons, orders, users, reviews, admins. Default admin password: "123456".

## Frontend (`frontend/`) — Next.js 13 (Pages Router)

### Key Config

- **Next.js Pages Router** (not App Router) — all pages in `src/pages/`
- **Path aliases:** `@/*` → `./src/*`, `@assets/*` → `./public/assets/*` (jsconfig.json)
- **Image domains:** `i.ibb.co`, `lh3.googleusercontent.com`, `res.cloudinary.com`
- **API base URL:** `process.env.NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:7001`)

### State Management — Redux Toolkit + RTK Query

**Store** (`src/redux/store.js`): Combines RTK Query API reducer with feature slices.

**RTK Query API** (`src/redux/api/apiSlice.js`):
- Base URL from env, auto-injects Bearer token from `userInfo` cookie
- Tag types: Products, Coupon, Product, RelatedProducts, UserOrder, UserOrders, ProductType, OfferProducts, PopularProducts, TopRatedProducts

**API Endpoint Files** (in `src/redux/features/`):
- `auth/authApi.js` — registerUser, loginUser, getUser, confirmEmail, resetPassword, confirmForgotPassword, changePassword, updateProfile, signUpProvider
- `productApi.js` — getAllProducts, getProductType, getOfferProducts, getPopularProductByType, getTopRatedProducts, getProduct, getRelatedProducts
- `categoryApi.js` — addCategory, getShowCategory, getProductTypeCategory
- `brandApi.js` — getActiveBrands
- `reviewApi.js` — addReview
- `coupon/couponApi.js` — getOfferCoupons (10min cache)
- `order/orderApi.js` — createPaymentIntent, saveOrder, getUserOrders, getUserOrderById

**Feature Slices:**
- `auth/authSlice.js` — `{accessToken, user}`, actions: userLoggedIn, userLoggedOut (clears cookie)
- `cartSlice.js` — `cart_products[]` persisted to localStorage key `cart_products`. Actions: add_cart_product (with stock validation), quantityDecrement, remove_product, clearCart, openCartMini/closeCartMini
- `wishlist-slice.js` — `wishlist[]` persisted to localStorage key `wishlist_items`. Toggle add/remove.
- `compareSlice.js` — `compareItems[]` persisted to localStorage key `compare_items`. Toggle add/remove.
- `coupon/couponSlice.js` — persisted to localStorage key `couponInfo`
- `order/orderSlice.js` — `shipping_info` persisted to localStorage key `shipping_info`, plus `stripe_client_secret`
- `productModalSlice.js` — `{productItem, isModalOpen}` for quick view
- `shop-filter-slice.js` — `{filterSidebar}` for mobile filter panel

### Custom Hooks (`src/hooks/`)

- **useAuthCheck** — reads `userInfo` cookie on mount, dispatches `userLoggedIn` if valid, returns `authChecked` boolean
- **useCartInfo** — computes `{quantity, total}` from cart_products
- **useCheckoutSubmit** — complex hook handling: coupon validation, shipping cost calculation, Stripe payment intent creation, COD support, order saving, localStorage cleanup on success
- **useSearchFormSubmit** — search with productType filter, navigates to `/search`
- **useSticky** — returns `{sticky}` boolean when scroll > 80px

### App Initialization (`src/pages/_app.jsx`)

Provider wrapping order: Redux Provider → Stripe Elements → GoogleOAuthProvider. Imports Bootstrap JS.

**Wrapper** (`src/layout/wrapper.jsx`): Runs `useAuthCheck()`, loads cart/wishlist/compare from localStorage, shows loader until auth checked, renders ProductModal + ToastContainer + BackToTop.

### Auth on Frontend

- Token stored in cookie `userInfo` (JSON with `accessToken` and `user`), expires 0.5 days
- `apiSlice.js` `prepareHeaders` auto-adds `Authorization: Bearer ${token}` to all requests
- **Protected pages** (checkout, profile): check `Cookies.get('userInfo')`, redirect to `/login` if missing
- Login mutation's `onQueryStarted` saves cookie + dispatches `userLoggedIn`
- Logout dispatches `userLoggedOut` which removes the cookie

### Socket.io Client (`src/lib/socketClient.js`)

Connects to backend Socket.io, listens for product/category/order/user events. Callback registration system for RTK Query cache invalidation. Handles reconnection with exponential backoff.

### Styling

- Bootstrap 5 as base framework
- Custom SCSS in `public/assets/scss/` organized by: `utils/` (variables, colors, mixins, breakpoints), `components/`, `layout/` (header, footer, menu, ecommerce, blog, pages)
- Component-level styles in `src/styles/`

### Key Pages

- **Home** (`index.jsx`) — hero sliders, category showcase, product areas, offers, blog, CTA
- **Shop** (`shop.jsx`) — filtering by price/category/color/brand/status, pagination, ShopFilterOffCanvas for mobile
- **Product Details** (`product-details/[id].jsx`) — with variants for countdown, swatches, video
- **Cart** (`cart.jsx`) — items table, quantity controls, coupon input
- **Checkout** (`checkout.jsx`) — protected, billing form, Stripe card element, COD option
- **Profile** (`profile.jsx`) — protected, user info, order history
- **Auth pages** — login, register, forgot password, email verify, password reset

## CRM (`crm/`) — Express.js Admin Panel

### Architecture

Server-rendered with EJS templates. **No authentication middleware** — all routes are publicly accessible.

**Entry:** `server.js` on port 8080 (`CRM_PORT` env var). Uses Bootstrap 5 + Chart.js in views.

### Two-Database Architecture

- **CRM database:** `shofy_ecommerce` (default `mongodb://127.0.0.1:27017/shofy_ecommerce`)
- **Frontend database:** `shofy` (configured via `FRONTEND_MONGO_URI`)
- **One-way sync only:** CRM → Frontend. Changes in frontend don't sync back.
- Sync triggered automatically on CRUD operations, or manually via `/api/sync/*` endpoints

### API Routes

| Prefix | Operations |
|--------|-----------|
| `/api/products` | List (paginated, filterable), stats, CRUD. Auto-generates slug from title. |
| `/api/categories` | List, stats, tree structure, CRUD. Prevents deletion if has products. |
| `/api/orders` | List (complex filters: status, payment, date range), stats, CRUD. Cancellation restores product quantities. Prevents cancel if shipped/delivered. |
| `/api/users` | List (filter by role/status/emailVerified), stats, user orders, CRUD. Prevents deletion if pending orders. |
| `/api/sync` | sync-all, sync-products, sync-categories, sync-users, sync-status |

### Page Routes (render EJS views)

`GET /` (dashboard), `/products`, `/categories`, `/orders`, `/users`

### Sync Service (`services/syncService.js`)

Creates a separate mongoose connection to the frontend database. Maps CRM model fields to frontend schema (field names differ). Uses upsert strategy — synced items are updated or created, but frontend-only items aren't deleted.

### Client-Side JS (`public/js/`)

- `app.js` — utility functions (formatCurrency, formatDate, showAlert, apiRequest wrapper, deleteItem, status badges, pagination, form validation, search debounce). Exports global `CRMUtils` object.
- `dashboard.js` — loads stats from all endpoints, renders Chart.js charts (monthly sales, order status)
- `products.js`, `categories.js`, `orders.js`, `users.js` — page-specific CRUD with modals, filtering, pagination

### Seed Data (Default Credentials)

Admin: `admin@shofy.com` / `password123`, Staff: `staff@shofy.com` / `password123`

## Environment Variables

### Backend (`.env`)
`MONGO_URI`, `PORT`, `NODE_ENV`, `TOKEN_SECRET`, `JWT_SECRET_FOR_VERIFY`, `SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `HOST`, `EMAIL_PORT`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`, `STRIPE_KEY`, `STORE_URL`, `ADMIN_URL`

### Frontend (`.env.local`)
`NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:7001`)

### CRM (`.env`)
`MONGO_URI` (default `mongodb://127.0.0.1:27017/shofy_ecommerce`), `CRM_PORT` (default 8080), `FRONTEND_MONGO_URI` (default `mongodb://127.0.0.1:27017/shofy`)

## Key Conventions

- Backend + CRM use CommonJS (`require`/`module.exports`); frontend uses ES modules
- Frontend has TypeScript installed but all files are `.jsx`
- Backend has no test suite (test script is a no-op); CRM same
- Frontend lint: `next lint` with ESLint
- Backend seed.js **destructively clears all collections** before importing — never run in production
- Order invoice numbers auto-increment from 1000 via mongoose pre-save hooks
- Product creation auto-pushes product ID to brand.products and category.products arrays
- Review creation requires the user to have purchased the product (validated via Order aggregation)
- Cart, wishlist, compare, coupon info, and shipping info are all persisted to localStorage on the frontend
