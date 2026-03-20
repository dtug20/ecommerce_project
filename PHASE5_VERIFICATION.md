# Phase 5 — Verification Checklist

> Generated: 2026-03-20

## Module Loading Tests

- [x] `backend/middleware/validate.js` loads (2 exports)
- [x] `backend/validations/index.js` loads (22 schemas)
- [x] `backend/config/swagger.js` loads
- [x] `backend/routes/v1/admin/index.js` loads with validation middleware
- [x] `backend/routes/v1/store/index.js` loads with Swagger JSDoc
- [x] `backend/routes/v1/user/index.js` loads with validation
- [x] `backend/routes/v1/vendor/index.js` loads with validation
- [x] `backend/routes/v1/index.js` loads (legacy aliases removed)
- [x] CRM UI TypeScript compiles with zero errors
- [x] CRM UI Vite production build succeeds (791ms)
- [x] Frontend ESLint passes (0 errors, warnings only)

## Backend — Validation (Task 2)

- [ ] POST /api/v1/admin/products with missing title → 422 with field-level errors
- [ ] POST /api/v1/user/orders with invalid email → 422
- [ ] POST /api/v1/user/reviews with rating > 5 → 422
- [ ] PATCH /api/v1/admin/products/:id with valid partial update → 200
- [ ] POST /api/v1/user/vendor/apply with missing storeName → 422
- [ ] POST /api/v1/admin/coupons with negative discount → 422

## Backend — Swagger (Task 3)

- [ ] GET /api-docs renders Swagger UI
- [ ] GET /api-docs.json returns OpenAPI spec
- [ ] Store endpoints documented with parameters
- [ ] Auth endpoints documented
- [ ] Vendor endpoints documented

## Backend — Legacy Routes Removed (Task 4)

- [ ] GET /api/product returns 404 (not proxied to legacy)
- [ ] GET /api/v1/store/products still works (v1 routes unaffected)
- [ ] No frontend/CRM code references non-v1 API paths

## Backend — Security (Task 5)

- [ ] Helmet headers present in responses (X-Content-Type-Options, etc.)
- [ ] CORS rejects requests from unlisted origins
- [ ] Auth rate limiter: 11th POST to /api/v1/auth/* within 15 min → 429
- [ ] Upload rate limiter: 31st POST to /api/v1/admin/media within 15 min → 429
- [ ] User passwords never appear in API responses

## Frontend — ISR (Task 6)

- [ ] Product detail page uses getStaticProps (check x-nextjs-cache header)
- [ ] Blog post page uses getStaticProps with revalidate: 3600
- [ ] POST /api/revalidate with valid secret triggers revalidation
- [ ] POST /api/revalidate with invalid secret → 401
- [ ] Uncached product pages serve via fallback: 'blocking' (no blank page)

## Frontend — JSON-LD (Task 7)

- [ ] Homepage source contains Organization JSON-LD
- [ ] Product detail source contains Product JSON-LD with price and availability
- [ ] Blog post source contains Article JSON-LD

## Frontend — Sitemap and Robots (Task 8)

- [ ] GET /sitemap.xml returns valid XML with products and blog posts
- [ ] GET /robots.txt blocks /cart, /checkout, /profile, /order/, /api/
- [ ] Sitemap includes /shop and /blog static pages

## Frontend — SEO (Tasks 9-11)

- [ ] Homepage has proper og:title, og:description, canonical URL
- [ ] Product page has og:image set to product image
- [ ] Cart page has noindex meta tag
- [ ] Checkout page has noindex meta tag
- [ ] Profile page has noindex meta tag
- [ ] next.config.js has image formats (avif, webp) and standalone output

## CRM — UI Polish (Task 12)

- [ ] Error boundary catches component errors (test by breaking a page)
- [ ] All tables show empty state when no data
- [ ] Tables have horizontal scroll on narrow viewports

## Infrastructure (Tasks 15-17)

- [ ] docker compose build succeeds for backend, crm, frontend
- [ ] backend/.env.example documents all variables
- [ ] frontend/.env.example documents all variables
- [ ] crm/.env.example documents all variables
- [ ] CI workflow includes CRM TypeScript check and build
- [ ] scripts/backup.sh is executable

## Testing (Tasks 13-14)

- [ ] Playwright config exists at frontend/playwright.config.js
- [ ] E2E test files exist in frontend/tests/e2e/
- [ ] Jest config exists at backend/jest.config.js
- [ ] API test files exist in backend/tests/
- [ ] `cd backend && npx jest --passWithNoTests` runs without config errors
- [ ] `cd frontend && npx playwright test --list` lists available tests

## Documentation (Tasks 18-19)

- [x] README.md has architecture overview and quick start
- [x] DEPLOYMENT.md has Docker, manual deploy, SSL, backup instructions
- [x] ADMIN_GUIDE.md covers all CRM features
- [x] scripts/backup.sh exists and is executable
- [ ] CLAUDE.md updated with Phase 5 status
