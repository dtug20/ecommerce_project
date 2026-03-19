# Phase 1 — Codebase Audit

> Generated: 2026-03-20
> Purpose: Document every model, endpoint, sync mapping, and schema divergence before Phase 1 implementation.

---

## 1. Backend Models (`backend/model/`)

### User.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `keycloakId` | String | No | — | unique, sparse, indexed |
| `name` | String | Yes | — | 3-100 chars |
| `email` | String | Yes | — | unique, lowercase, validated |
| `password` | String | No | — | Legacy; unused with Keycloak |
| `role` | String | No | `"user"` | enum: `user`, `admin` |
| `contactNumber` | String | No | — | validated mobile phone |
| `shippingAddress` | String | No | — | |
| `imageURL` | String | No | — | validated URL |
| `phone` | String | No | — | |
| `address` | String | No | — | |
| `bio` | String | No | — | |
| `status` | String | No | `"active"` | enum: `active`, `inactive`, `blocked` |
| `reviews` | ObjectId[] | No | — | ref: Reviews |
| `timestamps` | — | Auto | — | createdAt, updatedAt |

### Admin.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `keycloakId` | String | No | — | unique, sparse, indexed |
| `name` | String | Yes | — | |
| `image` | String | No | — | |
| `address` | String | No | — | |
| `country` | String | No | — | |
| `city` | String | No | — | |
| `email` | String | Yes | — | unique, lowercase |
| `phone` | String | No | — | |
| `status` | String | No | `"Active"` | enum: `Active`, `Inactive` |
| `role` | String | Yes | `"Admin"` | enum: `Admin`, `Super Admin`, `Manager`, `CEO` |
| `joiningDate` | Date | No | — | |
| `timestamps` | — | Auto | — | |

### Products.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | String | No | — | |
| `sku` | String | No | — | |
| `img` | String | Yes | — | validated URL |
| `title` | String | Yes | — | 3-200 chars |
| `slug` | String | No | — | |
| `unit` | String | Yes | — | |
| `imageURLs` | Array | No | — | `[{color:{name,clrCode}, img, sizes[]}]` |
| `parent` | String | Yes | — | Category parent name |
| `children` | String | Yes | — | Category children name |
| `price` | Number | Yes | — | min: 0 |
| `discount` | Number | No | — | min: 0 |
| `quantity` | Number | Yes | — | min: 0 |
| `brand` | Object | — | — | `{name, id: ObjectId ref Brand}` |
| `category` | Object | — | — | `{name, id: ObjectId ref Category}` |
| `status` | String | No | `"in-stock"` | enum: `in-stock`, `out-of-stock`, `discontinued` |
| `reviews` | ObjectId[] | No | — | ref: Reviews |
| `productType` | String | Yes | — | lowercase |
| `description` | String | Yes | — | |
| `videoId` | String | No | — | YouTube video ID |
| `additionalInformation` | Array | No | — | |
| `tags` | String[] | No | — | |
| `sizes` | String[] | No | — | |
| `offerDate` | Object | No | — | `{startDate, endDate}` |
| `featured` | Boolean | No | `false` | |
| `sellCount` | Number | No | `0` | min: 0 |
| `timestamps` | — | Auto | — | |

### Category.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `img` | String | No | — | |
| `parent` | String | Yes | — | unique, trimmed |
| `children` | String[] | No | — | |
| `productType` | String | Yes | — | lowercase |
| `description` | String | No | — | |
| `products` | ObjectId[] | No | — | ref: Products |
| `status` | String | No | `"Show"` | enum: `Show`, `Hide` |
| `featured` | Boolean | No | `false` | |
| `timestamps` | — | Auto | — | |

### Brand.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `logo` | String | No | — | validated URL |
| `name` | String | Yes | — | unique, max 100 |
| `description` | String | No | — | |
| `email` | String | No | — | validated |
| `website` | String | No | — | validated URL |
| `location` | String | No | — | |
| `status` | String | No | `"active"` | enum: `active`, `inactive` |
| `products` | ObjectId[] | No | — | ref: Products |
| `timestamps` | — | Auto | — | |

### Order.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `user` | ObjectId | Yes | — | ref: User |
| `cart` | Array | No | — | Line items |
| `name` | String | Yes | — | Shipping name |
| `address` | String | Yes | — | |
| `email` | String | Yes | — | |
| `contact` | String | Yes | — | Phone |
| `city` | String | Yes | — | |
| `country` | String | Yes | — | |
| `zipCode` | String | Yes | — | |
| `subTotal` | Number | Yes | — | |
| `shippingCost` | Number | Yes | — | |
| `discount` | Number | Yes | `0` | |
| `totalAmount` | Number | Yes | — | |
| `shippingOption` | String | No | — | |
| `cardInfo` | Object | No | — | Stripe card |
| `paymentIntent` | Object | No | — | Stripe intent |
| `paymentMethod` | String | Yes | — | `COD` / `Card` |
| `orderNote` | String | No | — | |
| `invoice` | Number | — | — | unique, auto-increment from 1000 (pre-save hook) |
| `status` | String | No | — | enum: `pending`, `processing`, `delivered`, `cancel` |
| `timestamps` | — | Auto | — | |

### Review.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | ObjectId | Yes | — | ref: User |
| `productId` | ObjectId | Yes | — | ref: Products |
| `rating` | Number | Yes | — | 1-5 |
| `comment` | String | No | — | |
| `timestamps` | — | Auto | — | |

### Coupon.js
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `title` | String | Yes | — | |
| `logo` | String | Yes | — | |
| `couponCode` | String | Yes | — | |
| `startTime` | Date | No | — | Defaults to now if not set |
| `endTime` | Date | Yes | — | |
| `discountPercentage` | Number | Yes | — | |
| `minimumAmount` | Number | Yes | — | |
| `productType` | String | Yes | — | |
| `status` | String | No | `"active"` | enum: `active`, `inactive` |
| `timestamps` | — | Auto | — | |

---

## 2. CRM Models (`crm/models/`)

### CRM Product.js
Structurally identical to backend `Products.js` with these differences:
- `unit` defaults to `"pcs"` (backend requires it, no default)
- `productType` defaults to `"general"` (backend requires it, no default)
- No `brand` or `category` required constraint

### CRM Category.js
Identical to backend `Category.js`.

### CRM User.js
| Divergence | Backend | CRM |
|-----------|---------|-----|
| `status` default | `"active"` | **`"inactive"`** |
| `role` enum | `user`, `admin` | `user`, `admin` (same) |
| Password hook | None | **bcrypt pre-save hook** |
| Methods | None | **`comparePassword()`, `generateConfirmationToken()`** |
| Extra fields | None | **`confirmationToken`, `confirmationTokenExpires`, `passwordChangedAt`, `passwordResetToken`, `passwordResetExpires`** |

### CRM Order.js
| Divergence | Backend | CRM |
|-----------|---------|-----|
| `status` enum | 4 values: `pending`, `processing`, `delivered`, `cancel` | Same 4 values |
| Extra field | — | **`orderStatus`** with 6 values: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled` |
| Extra field | — | **`deliveryDate`** (Date) |
| Extra field | — | **`tax`** (Number) |
| Extra field | — | **`paymentStatus`** (String) |

---

## 3. Sync Service Field Mappings (`crm/services/syncService.js`)

### Product → Frontend Product
```
CRM Field              → Frontend Field       Notes
_id.toString()         → id                   ObjectId as string
slug                   → sku                  ⚠️ Uses slug AS sku (not a real SKU)
img                    → img
title                  → title
slug                   → slug
description            → description
price                  → price
discount || 0          → discount
quantity               → quantity
category               → category             ObjectId
status                 → status
featured || false      → featured
colors || []           → colors               ⚠️ Root-level, ignores imageURLs
sizes || []            → sizes                ⚠️ Root-level, ignores imageURLs
tags || []             → tags
shipping || 0          → shipping
sellCount || 0         → sellCount
rating || {rating:0,count:0} → rating         ⚠️ Computed field

NOT SYNCED: imageURLs, unit, parent, children, brand, reviews, productType, videoId, additionalInformation, offerDate
```

### Category → Frontend Category
```
CRM Field              → Frontend Field       Notes
_id                    → _id
name || parent         → name                 Falls back to parent
parent                 → parent
children || []         → children
productType            → productType
description            → description
status                 → status
featured || false      → featured
sortOrder || 0         → sortOrder
img                    → img

NOT SYNCED: products[]
```

### User → Frontend User
```
CRM Field              → Frontend Field       Notes
_id                    → _id
name                   → name
email                  → email
password (hashed)      → password             Excluded via .select('-password')
phone                  → phone
address                → address              Object with street/city/state/zip/country
role                   → role                 ⚠️ CRM only has user/admin; frontend allows staff
status                 → status
avatar                 → avatar
emailVerified          → emailVerified
lastLogin              → lastLogin
dateOfBirth            → dateOfBirth
gender                 → gender

NOT SYNCED: contactNumber, shippingAddress, imageURL, bio, reviews, auth tokens
```

### Orders — NOT SYNCED
No sync implementation exists for orders. CRM and backend order data can diverge silently.

---

## 4. Schema Divergences (Critical)

| # | Divergence | Impact | Severity |
|---|-----------|--------|----------|
| 1 | **User.status default**: backend=`"active"`, CRM=`"inactive"` | New users created in CRM start inactive; users created by backend start active | Critical |
| 2 | **Product.sku mapped from slug** | sku field contains slug value, not actual SKU | High |
| 3 | **Order: dual status fields** | CRM has both `status` (4 values) and `orderStatus` (6 values) | High |
| 4 | **Order: no sync at all** | Order changes in CRM never reach frontend DB | Critical |
| 5 | **imageURLs not synced** | Color variant images lost during sync | High |
| 6 | **Category.products[] not synced** | Frontend categories lose product refs | Medium |
| 7 | **User.role enum mismatch** | Frontend schema allows `staff`; CRM model only allows `user`/`admin` | Medium |
| 8 | **CRM User has auth methods** | bcrypt pre-save, comparePassword, generateConfirmationToken not in backend | Medium |

---

## 5. Backend API Endpoints (60+)

### User Routes (`/api/user`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/me` | verifyToken | getProfile |
| PUT | `/update-user` | verifyToken | updateUser |

### Product Routes (`/api/product`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/add` | admin/manager | addProduct |
| POST | `/add-all` | admin/manager | addAllProducts |
| GET | `/all` | public | getAllProducts |
| GET | `/offer` | public | getOfferTimerProducts |
| GET | `/top-rated` | public | getTopRatedProducts |
| GET | `/review-product` | public | reviewProducts |
| GET | `/popular/:type` | public | getPopularProductByType |
| GET | `/related-product/:id` | public | getRelatedProducts |
| GET | `/single-product/:id` | public | getSingleProduct |
| GET | `/stock-out` | public | stockOutProducts |
| PATCH | `/edit-product/:id` | admin/manager | updateProduct |
| GET | `/:type` | public | getProductsByType |
| DELETE | `/:id` | admin/manager | deleteProduct |

### Category Routes (`/api/category`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/get/:id` | public | getSingleCategory |
| POST | `/add` | admin/manager | addCategory |
| POST | `/add-all` | admin/manager | addAllCategory |
| GET | `/all` | public | getAllCategory |
| GET | `/show/:type` | public | getProductTypeCategory |
| GET | `/show` | public | getShowCategory |
| DELETE | `/delete/:id` | admin/manager | deleteCategory |
| PATCH | `/edit/:id` | admin/manager | updateCategory |

### Brand Routes (`/api/brand`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/add` | admin/manager | addBrand |
| POST | `/add-all` | admin/manager | addAllBrand |
| GET | `/active` | public | getActiveBrands |
| GET | `/all` | public | getAllBrands |
| DELETE | `/delete/:id` | admin/manager | deleteBrand |
| GET | `/get/:id` | public | getSingleBrand |
| PATCH | `/edit/:id` | admin/manager | updateBrand |

### Order Routes (`/api/order`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/orders` | admin/manager/staff | getOrders |
| PATCH | `/update-status/:id` | admin/manager/staff | updateOrderStatus |
| GET | `/:id` | verifyToken | getSingleOrder |
| POST | `/create-payment-intent` | verifyToken | paymentIntent (DISABLED) |
| POST | `/saveOrder` | verifyToken | addOrder |

### Coupon Routes (`/api/coupon`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/add` | admin/manager | addCoupon |
| POST | `/all` | admin/manager | addAllCoupon |
| GET | `/` | public | getAllCoupons |
| GET | `/:id` | public | getCouponById |
| PATCH | `/:id` | admin/manager | updateCoupon |
| DELETE | `/:id` | admin/manager | deleteCoupon |

### Review Routes (`/api/review`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/add` | verifyToken | addReview |
| DELETE | `/delete/:id` | admin/manager | deleteReviews |

### User Order Routes (`/api/user-order`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/dashboard-amount` | admin/manager | getDashboardAmount |
| GET | `/sales-report` | admin/manager | getSalesReport |
| GET | `/most-selling-category` | admin/manager | mostSellingCategory |
| GET | `/dashboard-recent-order` | admin/manager | getDashboardRecentOrder |
| GET | `/` | verifyToken | getOrderByUser |
| GET | `/:id` | verifyToken | getOrderById |

### Admin Routes (`/api/admin`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/add` | admin/manager | addStaff |
| GET | `/all` | admin/manager | getAllStaff |
| GET | `/get/:id` | admin/manager | getStaffById |
| PATCH | `/update-stuff/:id` | admin/manager | updateStaff |
| PATCH | `/update-status/:id` | admin/manager | updatedStatus |
| DELETE | `/:id` | admin/manager | deleteStaff |

### Admin Product Routes (`/api/admin/products`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/` | admin/manager/staff | getAllProducts |
| GET | `/stats` | admin/manager/staff | getProductStats |
| GET | `/:id` | admin/manager/staff | getProductById |
| POST | `/` | admin/manager/staff | createProduct |
| PATCH | `/:id` | admin/manager/staff | updateProduct |
| DELETE | `/:id` | admin/manager/staff | deleteProduct |

### Admin Category Routes (`/api/admin/categories`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/` | admin/manager/staff | getAllCategories |
| GET | `/stats` | admin/manager/staff | getCategoryStats |
| GET | `/tree` | admin/manager/staff | getCategoryTree |
| GET | `/:id` | admin/manager/staff | getCategoryById |
| POST | `/` | admin/manager/staff | createCategory |
| PATCH | `/:id` | admin/manager/staff | updateCategory |
| DELETE | `/:id` | admin/manager/staff | deleteCategory |

### Admin Order Routes (`/api/admin/orders`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/` | admin/manager/staff | getAllOrders |
| GET | `/stats` | admin/manager/staff | getOrderStats |
| GET | `/:id` | admin/manager/staff | getOrderById |
| POST | `/` | admin/manager/staff | createOrder |
| PATCH | `/:id` | admin/manager/staff | updateOrder |
| PATCH | `/:id/status` | admin/manager/staff | updateOrderStatus |
| DELETE | `/:id` | admin/manager/staff | deleteOrder |

### Admin User Routes (`/api/admin/users`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| GET | `/` | admin/manager/staff | getAllUsers |
| GET | `/stats` | admin/manager/staff | getUserStats |
| GET | `/:id` | admin/manager/staff | getUserById |
| GET | `/:id/orders` | admin/manager/staff | getUserOrders |
| POST | `/` | admin/manager/staff | createUser |
| PATCH | `/:id` | admin/manager/staff | updateUser |
| PATCH | `/:id/status` | admin/manager/staff | updateUserStatus |
| DELETE | `/:id` | admin/manager/staff | deleteUser |

### Cloudinary Routes (`/api/cloudinary`)
| Method | Path | Auth | Controller |
|--------|------|------|-----------|
| POST | `/add-img` | admin/manager + multer | saveImageCloudinary |
| POST | `/add-multiple-img` | admin/manager + multer | addMultipleImageCloudinary |
| DELETE | `/img-delete` | admin/manager | cloudinaryDeleteController |

---

## 6. CRM API Proxy Routes

All CRM routes proxy to backend via `ApiProxy` with Keycloak Bearer token:

| CRM Path | → Backend Path | Method |
|----------|---------------|--------|
| `GET /api/products` | `GET /api/admin/products` | GET |
| `GET /api/products/stats` | `GET /api/admin/products/stats` | GET |
| `GET /api/products/:id` | `GET /api/admin/products/:id` | GET |
| `POST /api/products` | `POST /api/admin/products` | POST |
| `PUT /api/products/:id` | `PATCH /api/admin/products/:id` | PUT→PATCH |
| `DELETE /api/products/:id` | `DELETE /api/admin/products/:id` | DELETE |
| `GET /api/categories` | `GET /api/admin/categories` | GET |
| `GET /api/categories/stats` | `GET /api/admin/categories/stats` | GET |
| `GET /api/categories/tree` | `GET /api/admin/categories/tree` | GET |
| `GET /api/categories/:id` | `GET /api/admin/categories/:id` | GET |
| `POST /api/categories` | `POST /api/admin/categories` | POST |
| `PUT /api/categories/:id` | `PATCH /api/admin/categories/:id` | PUT→PATCH |
| `DELETE /api/categories/:id` | `DELETE /api/admin/categories/:id` | DELETE |
| `GET /api/orders` | `GET /api/admin/orders` | GET |
| `GET /api/orders/stats` | `GET /api/admin/orders/stats` | GET |
| `GET /api/orders/:id` | `GET /api/admin/orders/:id` | GET |
| `POST /api/orders` | `POST /api/admin/orders` | POST |
| `PUT /api/orders/:id` | `PATCH /api/admin/orders/:id` | PUT→PATCH |
| `PUT /api/orders/:id/status` | `PATCH /api/admin/orders/:id/status` | PUT→PATCH |
| `DELETE /api/orders/:id` | `DELETE /api/admin/orders/:id` | DELETE |
| `GET /api/users` | `GET /api/admin/users` | GET |
| `GET /api/users/stats` | `GET /api/admin/users/stats` | GET |
| `GET /api/users/:id` | `GET /api/admin/users/:id` | GET |
| `GET /api/users/:id/orders` | `GET /api/admin/users/:id/orders` | GET |
| `POST /api/users` | `POST /api/admin/users` | POST |
| `PUT /api/users/:id` | `PATCH /api/admin/users/:id` | PUT→PATCH |
| `PUT /api/users/:id/status` | `PATCH /api/admin/users/:id/status` | PUT→PATCH |
| `DELETE /api/users/:id` | `DELETE /api/admin/users/:id` | DELETE |

### Sync Routes (to be removed)
| Path | Method | Purpose |
|------|--------|---------|
| `POST /api/sync/sync-all` | POST | Sync everything |
| `POST /api/sync/sync-products` | POST | Products only |
| `POST /api/sync/sync-categories` | POST | Categories only |
| `POST /api/sync/sync-users` | POST | Users only |
| `GET /api/sync/sync-status` | GET | Compare CRM vs frontend counts |

---

## 7. Frontend RTK Query Endpoints

| Endpoint | URL | Method | Tags |
|----------|-----|--------|------|
| getUserProfile | `/api/user/me` | GET | — |
| updateProfile | `/api/user/update-user` | PUT | — |
| getAllProducts | `/api/product/all` | GET | Products |
| getProductType | `/api/product/:type` | GET | ProductType |
| getOfferProducts | `/api/product/offer` | GET | OfferProducts |
| getPopularProductByType | `/api/product/popular/:type` | GET | PopularProducts |
| getTopRatedProducts | `/api/product/top-rated` | GET | TopRatedProducts |
| getProduct | `/api/product/single-product/:id` | GET | Product |
| getRelatedProducts | `/api/product/related-product/:id` | GET | RelatedProducts |
| addCategory | `/api/category/add` | POST | — |
| getShowCategory | `/api/category/show` | GET | — |
| getProductTypeCategory | `/api/category/show/:type` | GET | — |
| getActiveBrands | `/api/brand/active` | GET | — |
| addReview | `/api/review/add` | POST | Products, Product |
| getOfferCoupons | `/api/coupon` | GET | Coupon (10min cache) |
| createPaymentIntent | `/api/order/create-payment-intent` | POST | — (DISABLED) |
| saveOrder | `/api/order/saveOrder` | POST | UserOrders |
| getUserOrders | `/api/user-order` | GET | UserOrders (10min cache) |
| getUserOrderById | `/api/user-order/:id` | GET | UserOrder (10min cache) |

---

## 8. Key Dependencies & Versions

| Package | Backend | CRM | Frontend |
|---------|---------|-----|----------|
| mongoose | ^7.0.1 | ^7.0.1 | — |
| express | ^4.18.2 | ^4.18.2 | — |
| socket.io | ^4.8.3 | — | — |
| keycloak-js | — | — | ^26.2.3 |
| keycloak-connect | — | ^26.1.1 | — |
| react | — | ^19.2.4 | ^18.2.0 |
| next | — | — | ^13.2.4 |
| @reduxjs/toolkit | — | — | ^1.9.3 |
| antd | — | ^6.3.3 | — |
| @tanstack/react-query | — | ^5.91.0 | — |

---

## 9. Middleware Flow

### verifyToken.js (9 steps)
1. Extract Bearer token from Authorization header
2. Decode token header to get `kid`
3. Fetch signing key from Keycloak JWKS (cached)
4. Verify RS256 signature against issuer
5. On TokenExpiredError → 401
6. On other error → 403
7. Map Keycloak claims: `keycloakId`, `email`, `name`, `roles`, `role` (by ROLE_PRIORITY: `admin > manager > staff > user`)
8. Find/create MongoDB User by keycloakId (fallback: email lookup)
9. Check user status: block if `blocked` or `inactive`

### authorization.js
- Takes spread of allowed roles
- Checks `req.user.roles` array for any overlap
- Returns 403 if no match

---

## 10. Socket.io Events (Current)

| Event | Payload | Emitted By |
|-------|---------|-----------|
| `product:created` | full product | product controller |
| `product:updated` | full product | product controller |
| `product:deleted` | productId | product controller |
| `products:refresh` | none | product controller |
| `category:created` | full category | category controller |
| `category:updated` | full category | category controller |
| `category:deleted` | categoryId | category controller |
| `categories:refresh` | none | category controller |
| `order:created` | full order | order controller |
| `order:updated` | full order | order controller |
| `order:deleted` | orderId | order controller |
| `orders:refresh` | none | order controller |
| `user:created` | safe user | user controller |
| `user:updated` | safe user | user controller |
| `user:deleted` | userId | user controller |
| `users:refresh` | none | user controller |
