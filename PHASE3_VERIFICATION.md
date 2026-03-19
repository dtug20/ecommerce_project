# Phase 3 — Verification Checklist

> Generated: 2026-03-20

## Module Loading Tests

- [x] `backend/controller/v1/wishlist.controller.js` loads (5 exports)
- [x] `backend/controller/v1/review.controller.js` loads (8 exports)
- [x] `backend/controller/v1/user.controller.js` loads (11 exports)
- [x] `backend/controller/v1/store.controller.js` loads (18 exports)
- [x] `backend/controller/admin.product.controller.js` loads (6 exports)
- [x] `backend/controller/admin.order.controller.js` loads (7 exports)
- [x] `backend/controller/order.controller.js` loads (5 exports)
- [x] `backend/model/Order.js` loads with `statusHistory` field
- [x] `backend/routes/v1/user/index.js` loads with wishlist + address routes
- [x] `backend/routes/v1/store/index.js` loads with review + coupon validate routes
- [x] `backend/routes/v1/admin/index.js` loads with review moderation routes
- [x] `backend/routes/v1/index.js` loads correctly
- [x] `crm/controllers/reviewController.js` loads
- [x] `crm/routes/review.routes.js` loads
- [x] CRM UI TypeScript compiles with zero errors (`tsc --noEmit`)
- [x] CRM UI Vite production build succeeds (1.20s, all pages bundled)
- [x] Frontend ESLint passes (warnings only — no errors)

## Backend Changes

### Wishlist Endpoints (`wishlist.controller.js` — 5 functions)

- [x] `GET /api/v1/user/wishlist` — returns wishlist with populated product details
- [x] `POST /api/v1/user/wishlist` — adds product via `$addToSet`, upserts wishlist doc
- [x] `DELETE /api/v1/user/wishlist/:productId` — removes product via `$pull`
- [x] `DELETE /api/v1/user/wishlist` — clears entire wishlist
- [x] `POST /api/v1/user/wishlist/:productId/move-to-cart` — removes from wishlist, returns product data
- [x] All write operations emit `wishlist:updated` Socket.io event

### Address Book Endpoints (in `user.controller.js` — 5 functions)

- [x] `GET /api/v1/user/addresses` — returns user's addresses array
- [x] `POST /api/v1/user/addresses` — adds address, handles isDefault logic
- [x] `PATCH /api/v1/user/addresses/:id` — updates address fields
- [x] `DELETE /api/v1/user/addresses/:id` — removes address with default protection
- [x] `PATCH /api/v1/user/addresses/:id/default` — sets address as default, clears others

### Review Moderation Endpoints (`review.controller.js` — 8 functions)

- [x] `GET /api/v1/admin/reviews` — paginated list with filters (status, rating, search, productId)
- [x] `GET /api/v1/admin/reviews/:id` — single review with populated user/product
- [x] `GET /api/v1/admin/products/:productId/reviews` — reviews for specific product
- [x] `PATCH /api/v1/admin/reviews/:id/approve` — sets status to approved, emits event
- [x] `PATCH /api/v1/admin/reviews/:id/reject` — sets status to rejected, emits event
- [x] `POST /api/v1/admin/reviews/:id/reply` — adds admin reply, emits event
- [x] `DELETE /api/v1/admin/reviews/:id` — deletes review, cascades to Product/User arrays
- [x] `GET /api/v1/store/products/:productId/reviews` — approved only with rating breakdown

### Enhanced User Review Submission

- [x] `POST /api/v1/user/reviews` — creates review with `status: 'pending'`
- [x] Sets `isVerifiedPurchase: true` if user has delivered order with product
- [x] Prevents duplicate reviews per user per product

### Enhanced Product Endpoints

- [x] Product create/update accepts `variants`, `seo`, `weight`, `dimensions`, `barcode`
- [x] Auto-generates slug from title
- [x] Validates variant SKUs are unique within product
- [x] `GET /api/v1/store/products/:id` includes `reviewStats` (avgRating, totalReviews)
- [x] `GET /api/v1/admin/products/:id` includes `reviewStats`

### Coupon Validation

- [x] `POST /api/v1/store/coupons/validate` — validates with all 10 checks
- [x] `GET /api/v1/store/coupons` — filters by displayRules (showOnCheckout, showOnProductPage)
- [x] Order creation validates coupon, increments `usageCount`, pushes to `usedBy[]`

### Order Tracking

- [x] `statusHistory` array added to Order model
- [x] Order status update accepts tracking fields (trackingNumber, carrier, trackingUrl, estimatedDelivery)
- [x] Auto-generates trackingUrl from carrier templates (DHL, FedEx, GHTK, GHN, ViettelPost)
- [x] Auto-sets `shippedAt`/`deliveredAt` on status transitions
- [x] Pushes to `statusHistory[]` on every status change

## CRM Changes

### Review Moderation Page

- [x] `ReviewsPage.tsx` — CRUD table with stats cards (Pending, Approved, Rejected, Avg Rating)
- [x] Filters: status, rating, search (debounced), date range
- [x] Row actions: Approve, Reject (with reason modal), Reply (with textarea modal), Delete, View
- [x] Bulk actions: checkbox column, bulk approve/reject
- [x] CRM proxy: `reviewController.js` + `review.routes.js` + mount in `server.js`

### Enhanced Product Form

- [x] Variants tab: table with SKU, color (name + hex), size, price, stock; add/edit/delete
- [x] SEO tab: meta title (char counter), meta description (char counter), keywords (tags), OG image
- [x] Main form: weight, dimensions, barcode fields

### Enhanced Category Page

- [x] Tree view toggle in page header
- [x] Ant Design Tree component showing category hierarchy
- [x] Create/edit modal: slug, icon, parent category select

### Enhanced Order Detail

- [x] Shipping tracking section: carrier select, tracking number, URL, estimated delivery
- [x] Order timeline: Ant Design Steps showing status history
- [x] Save tracking button, Track Package external link

### Enhanced Coupon Management

- [x] Display Rules section: showOnBanner, showOnCheckout, showOnProductPage toggles
- [x] Targeting section: applicable products/categories, excluded products (multi-select)
- [x] Usage tracking view: usage stats, usedBy table

### Navigation

- [x] Reviews added to sidebar (between Users and Coupons)
- [x] Route registered in App.tsx

## Frontend Changes

### Server-Side Wishlist

- [x] RTK Query endpoints: getWishlist, addToWishlist, removeFromWishlist, clearWishlist
- [x] `Wishlist` tag type added to apiSlice
- [x] `set_wishlist` action added to wishlist slice
- [x] `useWishlist` hook: auth-aware, calls API when authenticated + always updates localStorage
- [x] `wishlist-area.jsx` — server wishlist when authenticated, localStorage fallback for anonymous
- [x] 7 product item components updated to use `useWishlist` hook

### Product Variant Selector

- [x] `ProductVariantSelector.jsx` — color swatches + size buttons from variants array
- [x] Variant selection updates displayed price, stock, and images
- [x] Cart payload includes `selectedVariant` info when variant selected
- [x] Falls back to legacy imageURLs color/size when no variants

### Address Book

- [x] RTK Query endpoints: getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress
- [x] `Addresses` tag type added to apiSlice
- [x] `AddressBook.jsx` — full CRUD with Bootstrap cards, edit modal, default badge
- [x] Address Book tab added to profile page
- [x] `CheckoutSavedAddresses.jsx` — radio list of saved addresses in checkout, auto-fills form
- [x] Default address pre-selected on checkout load

### Review Display Enhancements

- [x] `Reviews` tag type added to apiSlice
- [x] `getProductReviews` RTK Query endpoint
- [x] `ReviewRatingBreakdown.jsx` — progress bar rating breakdown (5★→1★)
- [x] `ReviewItem.jsx` — verified purchase badge, admin reply block
- [x] Review tab loads from server API with pagination
- [x] Review form: auth check, moderation notice, pending confirmation

### Order Tracking Display

- [x] `OrderStatusTimeline.jsx` — vertical stepper (Placed→Processing→Shipped→Delivered)
- [x] `OrderTrackingCard.jsx` — carrier, copyable tracking number, Track Package link
- [x] Order detail page integrates both components
- [x] Cart items show variant details (color/size)

### Coupon Display Rules

- [x] `CheckoutCouponSuggestions.jsx` — available coupons section in checkout
- [x] `getCheckoutCoupons` RTK Query endpoint (showOnCheckout=true)
- [x] `validateCoupon` mutation endpoint for server-side validation
- [x] `use-checkout-submit.js` — server-side coupon validation with client-side fallback

## Remaining Items for Runtime Testing

> These require running services (backend + MongoDB + CRM + frontend):

- [ ] Backend starts without errors (`npm run dev:backend`)
- [ ] Wishlist CRUD works end-to-end (add, remove, clear, move-to-cart)
- [ ] Wishlist syncs localStorage → server on login
- [ ] Address book CRUD works (add, edit, delete, set default)
- [ ] Checkout auto-fills from saved addresses
- [ ] Review submission creates pending review
- [ ] Admin review moderation works (approve, reject, reply, delete)
- [ ] Only approved reviews shown on storefront
- [ ] Rating breakdown displays correctly
- [ ] Product create/edit with variants and SEO fields
- [ ] Variant selector updates price/stock on product detail page
- [ ] Coupon validation endpoint runs all 10 checks
- [ ] Coupon suggestions appear on checkout page
- [ ] Order tracking fields save correctly
- [ ] Order status timeline renders with history
- [ ] Category tree view displays hierarchy
- [ ] CRM Review Moderation page loads with filters
- [ ] Socket.io events fire on review/wishlist changes
