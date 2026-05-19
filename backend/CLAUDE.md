# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in the **backend/** sub-project of Shofy.

## Project Overview

Shofy Backend is the storefront-facing REST API. Express.js + Mongoose + Socket.io, runs on port `7001`. Talks to MongoDB (`shofy` database, single-DB after Phase 1). Serves both the Next.js storefront (port 3000) and the CRM admin panel (port 8080).

## Development Commands

Package manager is **npm** (Node 18+, see `.nvmrc`).

```bash
npm install                 # Install dependencies
npm run dev                 # nodemon, port 7001 (watches index.js)
npm start                   # production
npm run seed                # node seed.js — DESTRUCTIVELY clears ALL collections then bulk inserts
node scripts/backfill-embeddings.js   # one-shot chatbot embedding backfill
node seeds/email-templates.seed.js    # seed 9 default email templates
```

Tests: Jest (`npm test`) — 3 specs in `tests/` (health, store products, store CMS). There is no full backend test suite — add specs next to changed routes.

API docs: Swagger UI at `GET /api-docs`, raw spec at `GET /api-docs.json`.

## Architecture

### Tech Stack

- **Framework**: Express.js 4 (CommonJS, `require`/`module.exports`)
- **DB**: MongoDB via Mongoose (single `shofy` database)
- **Realtime**: Socket.io 4 — `global.io` set in `index.js`, emitted via `utils/socketEmitter.js`
- **Auth**: JWT (custom) + Keycloak OIDC (storefront SSO). `verifyToken` middleware attaches `req.user`
- **Validation**: Joi schemas in `validations/` + `middleware/validate.js`
- **Email**: nodemailer (optional install). Templates in DB, rendered via `utils/emailRenderer.js`
- **AI**: `@google/generative-ai` (Gemini 2.0 Flash + text-embedding-004) for chatbot + RAG
- **Payments**: Stripe (legacy), VNPay/MoMo/Stripe via `services/paymentService.js`
- **Uploads**: Multer → Cloudinary stream upload, max 4 MB, PNG/JPG/JPEG/WEBP

### Project Structure

```
backend/
├── index.js                # Express + Socket.io entry; mounts /api/v1/* + legacy /api/*
├── config/
│   └── swagger.js          # OpenAPI 3.0 spec (~40 endpoints)
├── routes/
│   └── v1/                 # auth, store, user, vendor, admin, payment
├── controller/
│   └── v1/                 # cms, store-cms, wishlist, review, vendor, admin.vendor,
│                           # analytics, email-template, activityLog, chat
├── model/                  # Mongoose schemas (User, Product, Order, Coupon, Page,
│                           # Menu, Banner, BlogPost, ChatSession, ChatFeedback, …)
├── middleware/
│   ├── verifyToken.js      # JWT auth (ROLE_PRIORITY includes 'vendor')
│   ├── authorization.js    # role gating
│   ├── validate.js         # Joi body/query validation
│   ├── activityLog.js      # intercepts res.json, writes ActivityLog on success
│   ├── uploader.js         # multer disk storage
│   └── global-error-handler.js
├── services/
│   ├── paymentService.js   # COD, bank-transfer, vnpay, momo, stripe dispatch
│   └── chatbot/            # llmProvider, systemPrompt, sessionStore, guardrails,
│                           # agentLoop, tools/, embeddings, ragSearch, embedQueue
├── utils/
│   ├── respond.js          # standardized response envelope
│   ├── pagination.js
│   ├── token.js            # JWT generation (2d access, 10m verify)
│   ├── socketEmitter.js    # global.io wrapper
│   ├── cloudinary.js       # streamUpload, destroy
│   ├── emailService.js     # sendTemplatedEmail (fire-and-forget)
│   ├── emailRenderer.js    # {{variable}} merge tags
│   └── cloudinaryUrl.js    # on-the-fly transform helper
├── validations/            # 22 Joi schemas (products, orders, users, reviews,
│                           # coupons, vendors, pages, menus, banners, blog, settings)
├── seeds/                  # email-templates.seed.js
├── scripts/                # backfill-embeddings.js
└── tests/                  # Jest specs (health, store-products, store-cms)
```

### API Routing

- **Active**: `/api/v1/{auth,store,user,vendor,admin}/*` — standardized envelope via `respond.*`
- **Legacy aliases** at `/api/*` were removed in Phase 5; only `/api/v1/*` is live
- **Webhooks**: `/api/v1/auth/payment/{vnpay,momo,stripe}/*` (public stubs)
- **Health**: `GET /health` — outside rate limiter, returns `{ ok: true, uptime, db }`

### Authentication

- **JWT** — `TOKEN_SECRET` signs access tokens (2-day), `JWT_SECRET_FOR_VERIFY` signs email/reset tokens (10-min). Payload: `{ _id, name, email, role }`
- **Keycloak** — storefront SSO via `/api/v1/auth/keycloak/*`. NEVER modify the Keycloak flow without explicit approval — re-running the configurator always reconfigures executions (see `keycloak/` scripts)
- **Roles** — `user`, `vendor`, `admin`, `Manager`, `Super Admin`, `CEO`. `ROLE_PRIORITY` in `verifyToken` controls hierarchy

### Socket.io Events

CORS allows localhost:3000, 3001, 8080. Emitted by controllers on every CRUD success:

| Domain | Events |
|--------|--------|
| Products | `product:created`, `product:updated`, `product:deleted`, `products:refresh` |
| Categories | `category:*`, `categories:refresh` |
| Orders | `order:*`, `orders:refresh` |
| Users | `user:*`, `users:refresh` |
| CMS | `page:*`, `menu:*`, `banner:*`, `blog:*`, `settings:updated` |
| Wishlist | `wishlist:updated` |
| Chat (streaming) | `chat:join`, `chat:token`, `chat:done`, `chat:error`, `chat:leave` |

Frontend RTK Query subscribes via `lib/socketClient.js` and invalidates tags on receipt.

### Response Envelope

All `/api/v1/*` responses go through `utils/respond.js`:

```js
respond.ok(res, data, message)          // 200
respond.created(res, data, message)     // 201
respond.badRequest(res, message, errors)
respond.unauthorized(res, message)
respond.forbidden(res, message)
respond.notFound(res, message)
respond.serverError(res, message)
```

Envelope: `{ success: boolean, message: string, data: any, errors?: any[], meta?: { pagination } }`. Do **not** mix in legacy `res.json({ status: 'success', … })` for v1 routes.

### Rate Limiting & Security

- `express-rate-limit` global limiter (skipped for `/health`)
- Auth-specific limiter: 10 / 15 min
- Upload-specific limiter: 30 / 15 min
- Payment-specific limiter on `/api/v1/auth/payment/*`
- Helmet (with `crossOriginEmbedderPolicy: false` for Cloudinary)
- CORS with explicit `methods` and `allowedHeaders`

### Chatbot (Phase 6)

- Gemini 2.0 Flash via `services/chatbot/llmProvider.js` — token-bucket rate limit, streaming
- 11 tools registered in `services/chatbot/tools/` — searchProducts, getProductDetails, getMyOrders, getOrderStatus, validateCoupon, getShippingPolicy, getReturnPolicy, searchFAQ, recommendProducts, proposeAddToCart, proposeApplyCoupon
- RAG via `$vectorSearch` on `Product.embedding` / `BlogPost.embedding` (Atlas vector index required — see `docs/superpowers/plans/atlas-vector-index.md`). Falls back to `$text` when not on Atlas
- `embedQueue.js` debounces re-embedding (30s) when products/blogs change
- Bot **proposes** side effects (`add_to_cart`, `apply_coupon`, `view_product`, `view_order`, `sign_in`); the user confirms via card click — bot never mutates state directly

## Common Development Patterns

### Adding a new endpoint

1. Define Joi schema in `validations/<resource>.validation.js`
2. Add controller in `controller/v1/<resource>.controller.js` using `respond.*`
3. Wire the route in `routes/v1/<area>.js` with `validate(schema)` + `verifyToken` + `authorization(...)` middleware as needed
4. Add JSDoc Swagger annotations above the route for `/api-docs`
5. Emit Socket.io events via `socketEmitter` on writes
6. Add a Jest spec under `tests/`

### Working with Mongoose

- All models live flat under `model/` (CommonJS export)
- Order invoice numbers auto-increment from 1000 via pre-save hook on `Order`
- User passwords hashed via bcrypt pre-save hook — never store plaintext
- Reviews require a delivered Order containing the product → `isVerifiedPurchase` true
- Products auto-push ID into `Brand.products` / `Category.products` arrays on create

### Activity logging

Apply `logActivity('action', 'resourceType')` middleware **after** the controller — it wraps `res.json` and writes an `ActivityLog` entry only on 2xx. Already wired on admin product/category/order/user/vendor/CMS write routes.

### Email sending

```js
const { sendTemplatedEmail } = require('./utils/emailService');
sendTemplatedEmail('order-confirmation', user.email, { order, user }, 'vi');
```

Fire-and-forget — never `await` (it would block the response). Graceful no-op if nodemailer is not installed.

## Environment Variables

`.env` (see `.env.example`):

- **DB**: `MONGO_URI`
- **Server**: `PORT=7001`, `NODE_ENV`, `STORE_URL`, `ADMIN_URL`
- **JWT**: `TOKEN_SECRET`, `JWT_SECRET_FOR_VERIFY`
- **Email**: `SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `HOST`, `EMAIL_PORT`
- **Cloudinary**: `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`
- **Stripe**: `STRIPE_KEY`
- **Chatbot**: `GEMINI_API_KEY` (required), `CHATBOT_MAX_ITERATIONS` (default 5), `CHATBOT_RATE_LIMIT_PER_MIN` (default 10)

## Conventions

- CommonJS only — no `import/export`
- Snake_case env vars, camelCase JS, PascalCase Mongoose models
- Never throw raw strings — use `ApiError` from `errors/` so `global-error-handler` formats them
- All `/api/v1/*` writes must be Joi-validated
- Fire-and-forget side effects (emails, activity logs, embed re-queue) must never block the response
- `seed.js` is destructive — never run in production

# MCP routing rules (project-level)

This project has the following MCP servers active on top of global rules in `~/.claude/CLAUDE.md`:

## MongoDB MCP (`mcp__mongodb__*`)

Connects to `mongodb://187.124.3.207:27017/shofy`. **Treat as semi-production** — no auth, public IP.

- Use for: schema inspection, sample data, count queries, validating assumptions
- Always `.limit(20)` on exploratory queries
- **NEVER** run `deleteMany`, `dropCollection`, mass `updateMany` without explicit user confirmation in this turn
- Prefer MongoDB MCP over shelling out to `mongosh`

## Playwright MCP (`mcp__playwright__*`)

For E2E + UI verification. Don't shell out to `npx playwright` when the MCP is available.

> If the server fails to start, the project `.mcp.json` references `@anthropic-ai/playwright-mcp` which isn't a real package — fix to `@playwright/mcp` (Microsoft) before relying on it.

## context-mode — context window protection

- **Bash** is for `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install` only. For anything that prints >20 lines, route through `ctx_batch_execute` or `ctx_execute`
- **Read** is correct when you intend to `Edit` the file. For exploration / analysis, use `ctx_execute_file(path, language, code)` so only the printed summary enters context
- **WebFetch / curl / wget** are blocked. Use `ctx_fetch_and_index(url, source)` then `ctx_search(queries)`
- Write artifacts to **files**, not inline responses — return only path + 1-line summary
