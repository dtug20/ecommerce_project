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

### grapuco — code intelligence

HTTP MCP. For any "where / what / why" question about this repo's code structure, **try grapuco first**, fall back to grep/Read only if it returns nothing useful.

| Question | Use |
|---|---|
| Where is symbol X defined / used? | `get_symbol_context` (NOT grep) |
| How is X structured / what depends on it? | `get_architecture`, `get_dependencies`, `get_data_flows` |
| What breaks if I change X? | `blast_radius`, `get_impact_analysis`, `check_dependencies` |
| Semantic code search ("find checkout flow") | `semantic_search` (NOT grep) |
| Literal string/regex search | `search_code` (faster than Bash grep, returns ranked) |
| ER diagram (Mongoose models) | `get_erd` |
| Rename a symbol safely across the repo | `rename_symbol` (NOT manual Edit) |
| Resume prior task context | `get_active_task_context` |

Run `mcp__grapuco__bootstrap` **once** per repo before first use; re-run if `check_staleness` reports stale. Confirm with user before bootstrap — it indexes the whole codebase.

Do NOT use grapuco for: reading file contents you're about to Edit, running commands, fetching URLs.

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

1. **grapuco** for code-structure questions about this repo
2. **context7** for external library docs
3. **mongodb** for database state
4. **context-mode** wrappers (`ctx_*`) for anything that would dump >20 lines
5. Native tools (Read/Bash/Grep) as fallback

### After enabling these MCPs

Restart Claude Code in this directory once so `mcp__grapuco__*`, `mcp__context7__*`, and `mcp__mongodb__*` appear in the tool list. Verify with: a quick `mcp__grapuco__list_repositories` call, then `bootstrap` if this repo isn't indexed yet.