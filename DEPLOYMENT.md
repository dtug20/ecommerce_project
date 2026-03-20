# Deployment Guide

## Infrastructure Overview

| Component | Local Dev | VPS Production |
|-----------|-----------|----------------|
| **Backend** | localhost:4000 | Docker container :4000 |
| **Frontend** | localhost:3001 | Docker container :3001 |
| **CRM** | localhost:8081 | Docker container :8081 |
| **MongoDB** | VPS 187.124.3.207:27017 | Docker container :27017 |
| **Keycloak** | VPS 187.124.3.207:8180 | Docker container :8180 |
| **PostgreSQL** | VPS (for Keycloak) | Docker container :5432 |
| **Nginx** | — | aaPanel Nginx → Docker Nginx (:81/:8443) |

## VPS Architecture

```
  aaPanel Nginx (port 80/443)
         │
         ▼
  Docker Nginx (port 81/8443)
    ├── /           → frontend:3001
    ├── /api/       → backend:4000/api/
    ├── /socket.io/ → backend:4000/socket.io/
    ├── /crm/       → crm:8081 (path rewrite)
    └── /auth/      → keycloak:8180/
         │
    ┌────┴────┐
    ▼         ▼
  MongoDB   PostgreSQL
  :27017    :5432
```

**VPS:** 187.124.3.207, Ubuntu 22.04, aaPanel 8.0.0 (port 38347)

## Local Development Setup

Local dev runs Backend, Frontend, and CRM locally but connects to MongoDB and Keycloak on the VPS.

### 1. Install dependencies

```bash
npm run install:all
cd crm && npm install && cd crm-ui && npm install && cd ../..
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp crm/.env.example crm/.env
```

**Key local dev env vars:**

`backend/.env`:
```env
PORT=4000
MONGO_URI=mongodb://187.124.3.207:27017/shofy
KEYCLOAK_BASE_URL=https://187.124.3.207/auth
KEYCLOAK_AUTHORITY=https://187.124.3.207/auth/realms/shofy
KEYCLOAK_JWKS_URI=https://187.124.3.207/auth/realms/shofy/protocol/openid-connect/certs
NODE_TLS_REJECT_UNAUTHORIZED=0   # Required for self-signed cert
STORE_URL=http://localhost:3001
ADMIN_URL=http://localhost:8081
```

`frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_KEYCLOAK_URL=https://187.124.3.207/auth
NEXT_PUBLIC_KEYCLOAK_REALM=shofy
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=shofy-frontend
```

`crm/.env`:
```env
CRM_PORT=8081
BACKEND_API_URL=http://localhost:4000
KEYCLOAK_BASE_URL=https://187.124.3.207/auth
```

### 3. Start services

```bash
# Terminal 1: Backend
npm run dev:backend    # Port 4000

# Terminal 2: Frontend
npm run dev:frontend   # Port 3001

# Terminal 3: CRM
cd crm && npm run dev  # Port 8081
```

## VPS Docker Deployment

### 1. SSH to VPS

```bash
ssh root@187.124.3.207
cd /opt/shofy
```

### 2. Pull latest code and deploy

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Or via CI/CD (push to `main` triggers deploy workflow).

### 3. Seed data (first deploy only)

```bash
# Seed email templates
docker exec shofy-backend node seeds/email-templates.seed.js

# Seed default data (WARNING: clears ALL collections)
# docker exec shofy-backend node seed.js
```

### 4. Keycloak setup (first deploy only)

1. Access Keycloak: `https://187.124.3.207/auth`
2. Login: admin / (see VPS env)
3. Create realm `shofy`
4. Disable SSL requirement (required for self-signed cert):
   ```bash
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh config credentials \
     --server http://localhost:8180 --realm master --user admin --password <password>
   docker exec shofy-keycloak /opt/keycloak/bin/kcadm.sh update realms/shofy \
     -s sslRequired=NONE
   ```
5. Create clients:
   - `shofy-frontend` — OpenID Connect, public, standard flow
   - `shofy-backend` — confidential
   - `shofy-crm` — confidential
6. Create realm roles: `admin`, `manager`, `staff`, `vendor`, `user`
7. Create initial admin user and assign `admin` role

## Important Deployment Notes

### Port Conflicts
aaPanel Nginx occupies ports 80 and 443. Docker Nginx uses **81 and 8443**. Never set Docker Nginx to 443.

### NEXT_PUBLIC_* Variables
These are baked at build time, not runtime. When changing API URLs:
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Docker Image Source
If `image:` is set in docker-compose, Docker prefers registry over local build. For local builds, remove the `image:` line or use `docker compose up --force-recreate`.

### Keycloak SSL Reset
Dropping `pgdata` volume resets realm settings. After any `docker volume rm shofy_pgdata`, re-run the `kcadm.sh update realms/shofy -s sslRequired=NONE` command.

### API Base URL
`NEXT_PUBLIC_API_BASE_URL` should NOT include `/api` suffix. Set to `https://187.124.3.207` (production) or `http://localhost:4000` (local dev).

### Keycloak Authority Must Match Token Issuer
The `iss` claim in Keycloak tokens must exactly match `KEYCLOAK_AUTHORITY` in backend `.env`. Both backend and CRM must reference the same Keycloak URL.

## CI/CD Pipeline

**GitHub repo:** github.com/dtug20/ecommerce_project

### CI (`.github/workflows/ci.yml`)
- Backend: install + lint
- Frontend: install + lint + build
- CRM: install + TypeScript check + Vite build
- Builds and pushes Docker images to ghcr.io

### Deploy (`.github/workflows/deploy.yml`)
- SSH to VPS, pulls images from ghcr.io
- Runs `docker compose -f docker-compose.prod.yml up -d`

### GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `VPS_HOST` | 187.124.3.207 |
| `VPS_USER` | root |
| `VPS_SSH_KEY` | ed25519 key at `/root/.ssh/shofy_deploy` |
| `VPS_PORT` | 22 |
| `GHCR_TOKEN` | GitHub PAT (read/write packages) |
| `GHCR_USER` | dtug20 |

## Database Backup

### Manual backup
```bash
./scripts/backup.sh
```

### Automated daily backup (cron on VPS)
```bash
0 2 * * * /opt/shofy/scripts/backup.sh >> /var/log/shofy-backup.log 2>&1
```

### Restore
```bash
tar -xzf backup.tar.gz
mongorestore --uri="mongodb://localhost:27017" --db=shofy ./backup-dir/shofy
```

## Health Checks

- Backend: `GET http://localhost:4000/health`
- API docs: `GET http://localhost:4000/api-docs`
- Frontend: `GET http://localhost:3001/`
- CRM: `GET http://localhost:8081/` (redirects to Keycloak)

## Monitoring

```bash
docker logs shofy-backend -f
docker logs shofy-frontend -f
docker logs shofy-crm -f
docker exec -it shofy-mongodb mongosh
```
