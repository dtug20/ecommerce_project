# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in the **frontend/** sub-project of Shofy.

## Project Overview

Shofy Storefront is the customer-facing web app. Next.js 13 **Pages Router** (not App Router) on port `3000`. Renders SSR/ISR pages backed by the Express API at `:7001`, with a CMS-driven homepage and Redux Toolkit + RTK Query for state.

## Development Commands

Package manager is **npm** (Node 18+).

```bash
npm install              # Install dependencies
npm run dev              # next dev, port 3000
npm run build            # next build (Next.js standalone output)
npm start                # next start (production)
npm run lint             # next lint (ESLint config from Next)
npm run test:e2e         # Playwright E2E (4 specs in tests/)
```

UI verification: see playwright.config.js. Always test in a real browser before claiming a UI task complete.

## Architecture

### Tech Stack

- **Framework**: Next.js 13 (Pages Router, `src/pages/`)
- **State**: Redux Toolkit + RTK Query (`src/redux/`)
- **Auth**: JWT in `userInfo` cookie (legacy) + Keycloak OIDC (current). NEVER touch the Keycloak flow without approval
- **UI**: Bootstrap 5 + custom SCSS (`public/assets/scss/`). Some pages migrated to Clicon design system (see `Clicon.md` + memory `project_clicon_redesign`)
- **i18n**: i18next via `next-i18next` (EN/VI). All user-facing text MUST use `t('namespace.key')`
- **Realtime**: socket.io-client in `src/lib/socketClient.js` — invalidates RTK Query tags on backend events
- **Payments**: Stripe Elements (`@stripe/react-stripe-js`), plus COD / bank-transfer / VNPay / MoMo selector
- **AI**: Chatbot widget mounted via `next/dynamic({ ssr: false })` in `src/layout/wrapper.jsx`

### Project Structure

```
frontend/
├── next.config.js          # output: 'standalone', image domains, avif/webp
├── playwright.config.js
├── jsconfig.json           # @/* → ./src/*, @assets/* → ./public/assets/*
├── public/
│   ├── assets/scss/        # Bootstrap layer + utils/components/layout
│   └── locales/{en,vi}/    # i18next translation namespaces
└── src/
    ├── pages/              # Next.js routes (SSR/ISR/CSR mixed)
    │   ├── index.jsx       # Home — getServerSideProps loads CMS blocks
    │   ├── shop.jsx        # Server-side filtering via URL query
    │   ├── product-details/[id].jsx  # ISR revalidate: 60
    │   ├── blog/[slug].jsx           # ISR revalidate: 3600
    │   ├── vendor/[slug].jsx
    │   ├── sitemap.xml.js  # dynamic XML (cached 1h)
    │   └── api/revalidate.js         # on-demand ISR revalidation
    ├── components/
    │   ├── chatbot/        # ChatWidget, ChatBubble, ChatMessage, ChatInput
    │   ├── cms/            # BlockRenderer + 7 block components
    │   ├── checkout/       # CheckoutSavedAddresses, CheckoutCouponSuggestions,
    │   │                   # CheckoutPaymentMethods
    │   ├── my-account/     # AddressBook, VendorApplication, OrderTimeline
    │   ├── product-details/ProductVariantSelector.jsx
    │   ├── review/         # ReviewRatingBreakdown, ReviewItem
    │   └── seo/            # SEO component + JsonLd injectors
    ├── redux/
    │   ├── store.js
    │   ├── api/apiSlice.js # RTK Query base — Bearer from userInfo cookie
    │   └── features/
    │       ├── auth/authApi.js + authSlice.js
    │       ├── cartSlice.js              # localStorage: cart_products
    │       ├── wishlist-slice.js         # localStorage: wishlist_items
    │       ├── compareSlice.js           # localStorage: compare_items
    │       ├── coupon/                   # localStorage: couponInfo
    │       ├── order/                    # localStorage: shipping_info
    │       ├── cms/cmsApi.js             # 10 endpoints for pages/menus/banners/blog
    │       ├── chat/chatApi.js
    │       ├── productApi.js, categoryApi.js, brandApi.js,
    │       ├── reviewApi.js, vendorApi.js, addressApi.js, wishlistApi.js
    ├── hooks/              # useAuthCheck, useCartInfo, useCheckoutSubmit,
    │                       # useSearchFormSubmit, useSticky, useWishlist,
    │                       # useChatSession
    ├── lib/socketClient.js # singleton Socket.io connection
    ├── layout/             # wrapper.jsx, headers/, footers/
    ├── locales/{en,vi}/common.json   # legacy single-file translations
    ├── utils/
    │   ├── cloudinaryUrl.js     # on-the-fly Cloudinary transforms
    │   └── currency formatter   # USE THIS — never hardcode '$'
    └── styles/             # component-level SCSS
```

### Rendering Strategy

| Page | Mode | Notes |
|------|------|-------|
| `/` | SSR | `getServerSideProps` loads CMS blocks via `cmsApi` (fallback to hardcoded layout if API down) |
| `/product-details/[id]` | ISR | `revalidate: 60`, `fallback: 'blocking'` |
| `/blog/[slug]` | ISR | `revalidate: 3600`, `fallback: 'blocking'` |
| `/shop` | SSR | URL query params drive server-side filtering |
| `/vendor/[slug]` | SSR | Vendor public profile + product grid |
| Cart / Checkout / Profile | CSR | Protected — redirect to `/login` if `userInfo` cookie missing |
| `/sitemap.xml` | Edge-cached | All products + published blog posts |

### CMS Block Renderer

`src/components/cms/BlockRenderer.jsx` maps `blockType` → lazy component:

- Fully implemented (6): `hero-slider`, `featured-products`, `category-showcase`, `banner-grid`, `text-block`, `product-carousel`
- Stub forms in CRM editor (8): `promo-section`, `testimonials`, `newsletter`, `custom-html`, `brand-showcase`, `countdown-deal`, `image-gallery`, `video-section`

Add a new block: register the component in `BlockRenderer.jsx`, add the editor stub in the CRM (`crm/crm-ui/src/pages/cms/PageEditorPage.tsx`).

### State Management

- **Server state** → RTK Query (`src/redux/features/*Api.js`). Auto-injects `Authorization: Bearer <userInfo.accessToken>` via `prepareHeaders`
- **Client state** → feature slices
- **Persisted to localStorage** — cart, wishlist, compare, coupon, shipping info. Loaded in `wrapper.jsx` on mount
- **Cookies** — only `userInfo` (JWT bundle, 0.5-day expiry)

### Realtime Cache Invalidation

`socketClient.js` connects on app mount. Each Socket.io event maps to RTK Query `invalidateTags`. Reconnects with exponential backoff. Used heavily for CMS (`page:*`, `menu:*`, `banner:*`, `blog:*`, `settings:updated`) so editor changes appear without a refresh.

## Conventions

### Mandatory rules

- **i18n** — every visible string goes through `t('namespace.key')` and exists in **both** `locales/en/common.json` and `locales/vi/common.json` (or the `chat` namespace under `public/locales/`)
- **Currency** — never hardcode `$` or any symbol. Use the currency formatter so user-selected currency is honored
- **Components** — for any page in the Clicon design system (home, shop, product detail, track-order), use the Clicon atoms/composites instead of duplicating Bootstrap patterns inline. See memory `project_clicon_component_library`
- **No `any` in TypeScript** — but most files are `.jsx`; TypeScript is installed but not used widely
- **No inline styles** — use SCSS modules or component-level SCSS

### File patterns

- Pages: `src/pages/**/*.jsx`
- Path alias: `@/components/X` resolves to `src/components/X`
- Asset alias: `@assets/images/Y` resolves to `public/assets/images/Y`
- Image domains whitelist: `i.ibb.co`, `lh3.googleusercontent.com`, `res.cloudinary.com`

### Auth flow on the frontend

1. Login mutation's `onQueryStarted` writes the JSON `{ accessToken, user }` to the `userInfo` cookie (`Cookies.set`, expiry 0.5 days) and dispatches `userLoggedIn`
2. `useAuthCheck` (in `wrapper.jsx`) reads the cookie on mount and rehydrates Redux
3. Protected pages check `Cookies.get('userInfo')` at render — redirect to `/login` if missing
4. Logout dispatches `userLoggedOut` which removes the cookie + clears Redux

For Keycloak SSO: the redirect flow is initiated by clicking the Keycloak login button; backend `Auth_keycloak_login` mutation exchanges the code for tokens. **Do not modify this flow without explicit approval**.

### SEO

- `<SEO>` component injects `<Head>` meta + Open Graph + Twitter Card + canonical
- JSON-LD via `<JsonLd>` — Product, Article, BreadcrumbList, Organization schemas
- `robots.txt` blocks `/cart`, `/checkout`, `/profile`, `/order/`, `/api/`

## Environment Variables

`.env.local` (see `.env.example`):

- `NEXT_PUBLIC_API_BASE_URL` — default `http://localhost:7001`
- `NEXT_PUBLIC_KEYCLOAK_*` — SSO endpoints
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `REVALIDATE_SECRET` — used by `/api/revalidate` for on-demand ISR

## Adding a Feature

1. Add an RTK Query endpoint in `src/redux/features/<area>Api.js` with the appropriate `providesTags` / `invalidatesTags`
2. If state needs persistence, add a slice with manual localStorage sync (see `cartSlice.js`)
3. Create the UI component under `src/components/<area>/` — use Clicon atoms where applicable
4. Wire i18n keys in both `en` and `vi` translation files
5. Hook the page in `src/pages/`. For SEO-sensitive pages prefer ISR over CSR
6. Add a Playwright spec under `tests/`

# MCP routing rules (project-level)

This project has the following MCP servers active on top of global rules in `~/.claude/CLAUDE.md`:

## MongoDB MCP (`mcp__mongodb__*`)

Same database as backend (`mongodb://187.124.3.207:27017/shofy`). The frontend should **never** read MongoDB directly — go through the Express API. The MCP is only for debugging discrepancies between what the API returns vs. what's in DB. Same write safety rules: no `deleteMany` / `dropCollection` without explicit confirmation.

## Playwright MCP (`mcp__playwright__*`)

Primary tool for E2E and UI verification. Use this instead of shelling `npx playwright`. Especially valuable here because the global instruction requires testing UI in a real browser before declaring a UI task done.

> If the server fails to start, the `.mcp.json` references `@anthropic-ai/playwright-mcp` which doesn't exist — fix to `@playwright/mcp`.

## context7 — live library docs

Use `mcp__plugin_context7_context7__resolve-library-id` + `query-docs` whenever editing Next.js / React / RTK Query / Bootstrap / i18next code — your training data may be stale on recent APIs. Skip for general programming or library-agnostic logic.

## context-mode — context window protection

- **Bash** for `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install` only. Anything >20 lines of output → `ctx_batch_execute` / `ctx_execute`
- **Read** when you intend to `Edit`. For analysis use `ctx_execute_file(path, language, code)`
- **WebFetch / curl** blocked — use `ctx_fetch_and_index` then `ctx_search`
- Write artifacts to files; respond with path + 1-line summary
