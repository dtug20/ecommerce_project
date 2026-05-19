# Google OAuth Client Setup for Shofy Keycloak

## Prerequisites
- Google account with billing-enabled project (free tier OK)
- Owner/Editor role on the project

## Steps

### 1. Create or select GCP project
1. Open https://console.cloud.google.com/
2. Project selector (top bar) → "New Project" → name: `shofy-prod` → Create

### 2. Configure OAuth consent screen
1. Left nav → APIs & Services → OAuth consent screen
2. User Type: **External** → Create
3. Fill app info:
   - App name: `Shofy`
   - User support email: `your-email@example.com`
   - App logo: upload Shofy logo (120x120 PNG)
   - Application home page: `https://tychicus.id.vn`
   - Privacy policy: `https://tychicus.id.vn/privacy`
   - Terms of service: `https://tychicus.id.vn/terms`
   - Authorized domains: `tychicus.id.vn`
   - Developer contact email: `your-email@example.com`
4. Scopes → Add: `openid`, `email`, `profile`
5. Test users (if app in Testing): add your test Gmail account
6. Save and continue → back to Dashboard

### 3. Create OAuth Client ID
1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Name: `shofy-keycloak-broker`
4. Authorized JavaScript origins:
   - `https://tychicus.id.vn`
5. Authorized redirect URIs:
   - `https://tychicus.id.vn/auth/realms/shofy/broker/google/endpoint`
6. Create → copy **Client ID** and **Client Secret**

### 4. Store secrets
- Store `Client ID` and `Client Secret` in:
  - GitHub Actions repo secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - VPS `.env` file (project root): same keys, `chmod 600 .env`

### 5. Publish app (when ready for prod)
- OAuth consent screen → Publishing status → **Publish App**
- Initial Google verification only required if requesting sensitive scopes; `openid email profile` is non-sensitive, no verification needed.

## Local development setup (optional)

For testing on `http://localhost:8180` (local Keycloak):
1. Create a separate OAuth Client ID with name `shofy-keycloak-broker-dev`
2. Authorized JavaScript origins: `http://localhost:3001`
3. Authorized redirect URIs: `http://localhost:8180/realms/shofy/broker/google/endpoint`
4. Use these dev credentials in your local `.env` (different from production secrets)
