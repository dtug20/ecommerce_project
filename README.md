# Shofy E-Commerce Platform

Multi-vendor marketplace with CMS-driven storefront, built with Express.js, Next.js 13, React 19 + Ant Design 6, and MongoDB.

## Architecture

| Service | Stack | Port | Purpose |
|---------|-------|------|---------|
| **Backend API** | Express.js + MongoDB | 7001 | Unified REST API |
| **Storefront** | Next.js 13 (Pages Router) + Bootstrap 5 | 3000 | Customer-facing store |
| **CRM Admin** | Vite + React 19 + TypeScript + Ant Design 6 | 8080 | Admin panel |
| **Auth** | Keycloak 26 | 8180 | SSO, RBAC (RS256 JWT) |
| **Database** | MongoDB 7 | 27017 | Single database (`shofy`) |

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Keycloak 26+ (for authentication)

### Development

```bash
# Install all dependencies
npm run install:all

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp crm/.env.example crm/.env

# Start backend + frontend
npm run dev

# Start CRM (separate terminal)
cd crm && npm run dev
```

### Docker

```bash
docker compose up -d
```

## API Documentation

Interactive Swagger UI: `http://localhost:7001/api-docs`

### API Route Groups

| Prefix | Auth | Purpose |
|--------|------|---------|
| `/api/v1/store/*` | Public | Storefront endpoints |
| `/api/v1/auth/*` | Public | Authentication + payment webhooks |
| `/api/v1/user/*` | User token | User profile, orders, wishlist, addresses |
| `/api/v1/vendor/*` | Vendor token | Vendor self-service |
| `/api/v1/admin/*` | Staff+ token | Admin CRM operations |

## Project Structure

```
├── backend/           # Express.js REST API
│   ├── controller/    # Route handlers (v1/ for versioned API)
│   ├── model/         # Mongoose schemas (16 collections)
│   ├── routes/        # Express routers
│   ├── middleware/     # Auth, validation, activity log
│   ├── services/      # Payment service
│   ├── utils/         # Respond, pagination, email
│   ├── validations/   # Joi schemas
│   └── seeds/         # Email template seeds
├── frontend/          # Next.js 13 storefront
│   ├── src/pages/     # Pages (SSR, ISR)
│   ├── src/components/# React components
│   ├── src/redux/     # Redux Toolkit + RTK Query
│   ├── src/hooks/     # Custom hooks
│   └── tests/e2e/     # Playwright E2E tests
├── crm/               # Admin panel
│   ├── crm-ui/        # React 19 + TypeScript + Ant Design 6
│   ├── controllers/   # API proxy controllers
│   ├── routes/        # Proxy routes
│   └── server.js      # Express proxy server
├── migration/         # Database migration scripts
├── scripts/           # Utility scripts (backup)
└── docker-compose.yml # Full stack Docker setup
```

## Key Features

- **Multi-vendor marketplace** — vendor registration, approval, products, orders, payouts
- **CMS engine** — homepage builder, menu editor, blog, banners, theme settings
- **Full e-commerce** — products with variants, server-side filtering, wishlists, address book
- **Review moderation** — admin approval flow with verified purchase badges
- **Order tracking** — carrier integration, status timeline, email notifications
- **Analytics dashboard** — revenue trends, top products, customer growth, vendor performance
- **Email templates** — editable with merge tags, preview, test send
- **Activity logging** — automatic audit trail of admin actions
- **Payment gateways** — COD, bank transfer (VNPay/MoMo/Stripe stubs ready)

## Documentation

- [Deployment Guide](DEPLOYMENT.md) — Docker, manual deploy, SSL, backups
- [Admin Guide](ADMIN_GUIDE.md) — CRM user documentation
- [API Docs](http://localhost:7001/api-docs) — Swagger UI (when running)

## Testing

```bash
# Backend API tests
cd backend && npx jest

# Frontend E2E tests
cd frontend && npx playwright test

# CRM TypeScript check
cd crm/crm-ui && npx tsc --noEmit
```
