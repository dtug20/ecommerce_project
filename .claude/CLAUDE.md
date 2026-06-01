# Shofy E-commerce Platform

## Architecture

- 3 separate repos: `shofy-api/`, `shofy-crm/`, `shofy-storefront/`
- Database: MongoDB (single instance)
  - Current: 2 databases (shofy, shofy_ecommerce) — migrating to 1
  - Target: single `shofy` database
- Storefront API: Express.js (port 7001)
- CRM API: Express.js (port 8081)
- Storefront: Next.js 13 (Pages Router, port 3001)
- CRM UI: Vite + React 19 + TypeScript + Ant Design 6 (port 3001)

## Tech Stack Constraints

- Keep MongoDB (no PostgreSQL migration)
- Keep Bootstrap 5 for storefront (modernize, don't replace)
- Keep Ant Design 6 for CRM
- Keep Keycloak for storefront auth
- Keep i18n (EN/VI) with i18next
- 3 separate repos (not monorepo)

## Coding Standards

- TypeScript for all new code
- Use Mongoose for all DB operations
- API follows RESTful conventions: /api/v1/admin/*, /api/v1/store/*, /api/v1/vendor/*
- React components use functional style + hooks only
- CRM uses React Query for server state, Zustand for client state
- Storefront uses Redux Toolkit + RTK Query

## Key Models (Current)

Brand, Category, Product, Coupon, Order, User, Review, Admin

## Key Models (New — to be added)

SiteSetting, Page, ContentBlock, Menu, MenuItem, Banner
Announcement, BlogPost, Vendor, VendorPayout, Wishlist
EmailTemplate, ActivityLog

## Forbidden Patterns

- No hard-coded content on storefront — everything from API/CMS
- No direct DB access from frontend — always through API
- No `any` type in TypeScript (use proper types)
- No inline styles in React components
- Never modify the Keycloak auth flow without explicit approval

## MCP Routing (project-level)

Three MCP servers are active on top of the global rules in `~/.claude/CLAUDE.md`:

### gitnexus — code intelligence (local)

Local stdio MCP (`npx -y gitnexus mcp`, declared in `.mcp.json`). Everything stays on this machine — no code is sent to a cloud service. The repo is indexed as **ecommerce_project**. For any "where / what / why" question about this repo's code structure, **try gitnexus first**, fall back to grep/Read only if it returns nothing useful.

| Question | Use |
|---|---|
| Full context on symbol X (callers/callees/flows) | `gitnexus_context({name})` (NOT grep) |
| What breaks if I change X? (blast radius) | `gitnexus_impact({target, direction})` |
| Semantic search ("find checkout flow") | `gitnexus_query({query})` (NOT grep) |
| Which symbols/flows does my git diff touch? | `gitnexus_detect_changes()` (run before committing) |
| Rename a symbol safely across the repo | `gitnexus_rename` (NOT manual find-and-replace) |
| Raw graph query | `gitnexus_cypher({query})` |
| Codebase overview / freshness, clusters, processes | resources `gitnexus://repo/ecommerce_project/{context,clusters,processes}` |

Re-run `npx gitnexus analyze` if a tool warns the index is stale. See `.claude/skills/gitnexus/*` for deeper workflows (exploring, impact-analysis, debugging, refactoring).

Do NOT use gitnexus for: reading file contents you're about to Edit, running commands, fetching URLs.

> grapuco (cloud MCP) was removed from this project on 2026-06-01 in favour of gitnexus (local). grapuco is still configured for the MediaSoft repos. gitnexus has no ERD generator — if you need a Mongoose ER diagram, use `gitnexus_cypher` to query model relationships or fall back to reading the model files.

### context7 — live library documentation

HTTP MCP. Use for Next.js 13, React 19, Ant Design 6, RTK Query, Mongoose, Express, Keycloak, i18next, Bootstrap 5, Vite, Stripe SDK, Cloudinary SDK, Playwright. Training data may be stale on these.

Flow: `resolve-library-id(name)` → `query-docs(id, topic)`.

Skip for: refactoring, debugging business logic, library-agnostic questions.

### mongodb — semi-prod data

Connects to `mongodb://187.124.3.207:27017/shofy` (public IP, no auth — **treat as semi-prod**). Declared in `.mcp.json` (read-only). Used for schema inspection, count queries, sample data, debugging discrepancies between API responses and DB state.

- Always `.limit(20)` on exploratory queries
- **NEVER** issue `deleteMany`, `dropCollection`, mass `updateMany` without explicit user confirmation in this turn
- Frontend should never read MongoDB directly — go through the Express API

### Priority when multiple MCPs could answer

1. **gitnexus** for code-structure questions about this repo
2. **context7** for external library docs
3. **mongodb** for database state
4. **context-mode** wrappers (`ctx_*`) for anything that would dump >20 lines
5. Native tools (Read/Bash/Grep) as fallback

### After enabling these MCPs

Restart Claude Code in this directory once so `mcp__gitnexus__*`, `mcp__context7__*`, and `mcp__mongodb__*` appear in the tool list (approve the project-scoped gitnexus server when prompted). Verify with a quick `gitnexus_context` or `gitnexus_query` call; re-run `npx gitnexus analyze` if the index reports stale.