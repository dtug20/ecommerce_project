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