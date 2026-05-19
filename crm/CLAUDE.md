# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in the **crm/** sub-project of Shofy.

## Project Overview

Shofy CRM is the admin panel. Two layers in one folder:

1. **`crm/`** — Express server on port `8080` that proxies `/api/*` calls to the backend (`:7001`) and serves the SPA build
2. **`crm/crm-ui/`** — Vite + React 19 + TypeScript + Ant Design 6 SPA (Mediasoft-Admin pattern)

The sync service that copied data from `shofy_ecommerce` → `shofy` was removed in Phase 1 — the CRM now proxies directly to the unified backend.

## Development Commands

Package manager is **npm** (Node 18+).

```bash
# From crm/
npm install                  # server deps
npm run dev                  # nodemon server.js (port 8080)
npm run seed                 # seed.js (legacy CRM DB data — mostly obsolete post-Phase 1)

# From crm/crm-ui/
npm install                  # SPA deps
npm run dev                  # vite dev (port varies, usually 5173)
npm run build                # tsc + vite build → ../public/build/
npm run lint                 # ESLint
npm run typecheck            # tsc --noEmit
```

For production builds the Express server serves the Vite-built static files from `crm/public/build/`. The Docker image runs both stages.

## Architecture

### Server layer (`crm/`)

Plain Express. Acts as:

- **Proxy** — `/api/*` → backend `:7001` with admin Bearer token forwarding. Routes defined in `crm/server.js` + `crm/routes/`
- **Static host** — serves `public/build/` (Vite output)
- **Health** — `GET /health`

Proxy paths follow `/api/v1/admin/*` on the backend side. Phase 2 added these proxy groups: `/api/cms/*`, `/api/coupons/*`. Phase 3 added `/api/reviews/*`. Phase 4 added `/api/vendors`, `/api/analytics`, `/api/email-templates`, `/api/activity-log`.

**No auth middleware** on the Express server itself — auth happens on the backend via the forwarded token.

### UI layer (`crm/crm-ui/`)

React 19 SPA, Vite build.

#### Tech Stack

- **UI**: Ant Design 6 (primary)
- **Routing**: React Router 6, lazy-loaded routes wrapped in an Error Boundary
- **State**: React Query (server) + Zustand (client)
- **API**: Axios + custom client that auto-attaches the admin token
- **Auth**: Keycloak OIDC via `oidc-client-ts` + `react-oidc-context` — DO NOT modify the flow
- **i18n**: i18next (Vietnamese as primary CRM language)
- **Charts**: Ant Design Charts (revenue, top products, customer growth)

#### Project Structure

```
crm/crm-ui/src/
├── main.tsx
├── App.tsx
├── routes/                 # Single index.tsx with all route definitions
├── pages/
│   ├── ProductsPage.tsx           # Enhanced product form: Variants tab + SEO tab
│   ├── OrdersPage.tsx + OrderDetailPage.tsx   # Tracking + timeline
│   ├── UsersPage.tsx
│   ├── ReviewsPage.tsx            # Moderation queue
│   ├── VendorsPage.tsx            # Vendor approval + commission + payouts
│   ├── CouponsPage.tsx
│   ├── ActivityLogPage.tsx        # Filterable + CSV export
│   ├── ChatbotPage.tsx            # KPI cards + recent sessions
│   ├── cms/
│   │   ├── PagesListPage.tsx + PageEditorPage.tsx       # 3-panel block editor
│   │   ├── MenusPage.tsx + MenuEditorPage.tsx           # 2-panel tree + form
│   │   ├── BlogListPage.tsx + BlogEditorPage.tsx        # Split editor + sidebar
│   │   └── BannersPage.tsx
│   └── settings/
│       ├── ThemeSettingsPage.tsx
│       ├── GeneralSettingsPage.tsx        # Includes AI Chatbot enable + welcome msg
│       ├── PaymentSettingsPage.tsx
│       ├── ShippingSettingsPage.tsx
│       └── EmailTemplatesPage.tsx         # Editor + variable insertion + preview
├── components/
│   ├── layout/                    # Sidebar, Header, ErrorBoundary
│   └── common/                    # Empty states, JSON viewer, etc.
├── services/                      # Axios instance + entity API modules
├── stores/                        # Zustand stores
├── hooks/                         # useApi wrappers around React Query
└── locales/vi.json                # i18next translations
```

#### Sidebar layout

Hierarchical menu:

1. Dashboard (Enhanced analytics)
2. Products
3. Categories (tree view toggle)
4. Orders
5. Users
6. Vendors
7. Reviews
8. Coupons
9. CMS submenu — Pages / Menus / Banners / Blog
10. Settings submenu — Theme / General / Payment / Shipping / Email Templates
11. AI Chatbot (`/chatbot`)
12. Activity Log

### Data flow

```
Admin user in browser
      ↓ (React Query)
crm-ui/services/* (Axios with Bearer)
      ↓
crm/server.js proxy (/api/cms/*, /api/vendors, …)
      ↓
backend /api/v1/admin/* (verifyToken + authorization)
      ↓
MongoDB (shofy database) + Socket.io emit
      ↓ (socket events fan out)
crm-ui + frontend storefront refresh
```

## Conventions

- **TypeScript** for all UI code — no `any`, define types under `src/types/`
- **Functional components + hooks** only
- **Ant Design 6** is the design system — don't introduce Tailwind or MUI on top
- **React Query** for server state, **Zustand** for client state — don't mix Redux into this app
- **Lazy-load routes** to keep the bundle small; wrap with the project Error Boundary
- **Empty states** via Ant Design `<Empty>` on all tables (Products, Orders, Vendors, Reviews, Coupons, Activity Log)
- **Never modify the Keycloak auth flow** without explicit approval
- **Server (`crm/server.js`)** uses CommonJS (`require`); the SPA uses ES modules

## Environment Variables

### Server `.env`

- `CRM_PORT=8080`
- `BACKEND_URL=http://localhost:7001`
- `ADMIN_TOKEN` or Keycloak-issued token for proxying

### UI (`crm/crm-ui/.env`)

- `VITE_API_BASE_URL` — usually points at the server proxy (`/api` if same-origin) or directly at the backend in dev
- `VITE_KEYCLOAK_*` — SSO config

## Adding a Feature

1. **Backend** — add controller + Joi schema + route + Swagger annotations under `backend/`
2. **Proxy** — register the new path group in `crm/server.js` if it doesn't fit an existing group
3. **Service** — add the API module in `crm/crm-ui/src/services/`
4. **Hook** — wrap with React Query in `crm/crm-ui/src/hooks/`
5. **Page** — build the Ant Design page, ensure empty state + error boundary
6. **Sidebar** — register the route in the sidebar navigation
7. **i18n** — add Vietnamese strings to `locales/vi.json`

# MCP routing rules (project-level)

This project has the following MCP servers active on top of global rules in `~/.claude/CLAUDE.md`:

## MongoDB MCP (`mcp__mongodb__*`)

Connects to `mongodb://187.124.3.207:27017/shofy`. **Treat as semi-production**. CRM should normally write via the backend API — direct MongoDB writes from the CRM bypass validation, Socket.io events, and activity logging.

- Read queries: OK, always `.limit(20)`
- **Never** run `deleteMany`, `dropCollection`, mass `updateMany` without explicit user confirmation in this turn

## Playwright MCP (`mcp__playwright__*`)

For UI smoke tests on the CRM. Prefer over shelling `npx playwright`.

> If the server fails to start, the `.mcp.json` references `@anthropic-ai/playwright-mcp` which doesn't exist — fix to `@playwright/mcp`.

## context7 — live library docs

Use `mcp__plugin_context7_context7__resolve-library-id` + `query-docs` when editing Ant Design 6, React 19, React Query, Vite, or Zustand code. AntD 6 has API differences from v5 that training data may not reflect.

## context-mode — context window protection

- **Bash** for `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install` only. Anything >20 lines → `ctx_batch_execute` / `ctx_execute`
- **Read** when you intend to `Edit`. For analysis use `ctx_execute_file(path, language, code)`
- **WebFetch / curl** blocked — `ctx_fetch_and_index` + `ctx_search`
- Write artifacts to files; respond with path + 1-line summary
