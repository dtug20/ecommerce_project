const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
require('dotenv').config();

const app = express();

// ─── Reverse proxy awareness ───────────────────────────────────
// nginx terminates TLS and forwards `/admin/*` → CRM at `/*` (strips prefix).
// 1. trust proxy → req.protocol reflects X-Forwarded-Proto (https)
// 2. originalUrl re-prepend → keycloak-connect's *login* flow builds the
//    redirect_uri from req.originalUrl, so the URI we send to Keycloak
//    matches the registered https://host/admin/* pattern.
// 3. url re-prepend ONLY for the auth_callback request → keycloak-connect's
//    *post-auth* handler builds the clean post-login URL from req.path
//    (derived from req.url). Without this, the user lands at `/` after login
//    instead of `/admin/`. We must NOT modify req.url for other requests
//    because Express route matching reads req.url.
app.set('trust proxy', true);
const CRM_PUBLIC_PREFIX = process.env.CRM_PUBLIC_PREFIX || '';
if (CRM_PUBLIC_PREFIX) {
  app.use((req, _res, next) => {
    if (!req.originalUrl.startsWith(CRM_PUBLIC_PREFIX)) {
      req.originalUrl = CRM_PUBLIC_PREFIX + req.originalUrl;
    }
    if (req.url.indexOf('auth_callback=1') !== -1 && !req.url.startsWith(CRM_PUBLIC_PREFIX)) {
      req.url = CRM_PUBLIC_PREFIX + req.url;
    }
    next();
  });
}

// ─── Session + Keycloak Setup ───────────────────────────────────

const memoryStore = new session.MemoryStore();

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'shofy-crm-session-secret',
    resave: false,
    saveUninitialized: false,
    store: memoryStore,
    cookie: { maxAge: 1000 * 60 * 60 * 10 }, // 10 hours
  })
);

const keycloak = new Keycloak({ store: memoryStore }, {
  realm: process.env.KEYCLOAK_REALM || 'shofy',
  'auth-server-url': process.env.KEYCLOAK_BASE_URL || 'http://localhost:8180',
  resource: process.env.KEYCLOAK_CRM_CLIENT_ID || 'shofy-crm',
  'ssl-required': 'none',
  'confidential-port': 0,
  credentials: {
    secret: process.env.KEYCLOAK_CRM_SECRET || '',
  },
});

// Disable keycloak-connect's built-in logout handler — it builds the
// post_logout_redirect_uri without the /admin prefix, so after Keycloak signs
// the user out they land on the frontend root. We register a custom /logout
// route below that points back to the CRM entry, where the next request
// triggers a fresh Keycloak login.
app.use(keycloak.middleware({ logout: '/_kc_logout_disabled', admin: '/' }));

app.get('/logout', (req, res) => {
  const realm = process.env.KEYCLOAK_REALM || 'shofy';
  const baseUrl = process.env.KEYCLOAK_BASE_URL || 'http://localhost:8180';
  const clientId = process.env.KEYCLOAK_CRM_CLIENT_ID || 'shofy-crm';
  const postLogoutUri = `${req.protocol}://${req.get('host')}${CRM_PUBLIC_PREFIX || ''}/`;
  const idTokenHint = req.kauth?.grant?.id_token?.token;
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutUri,
    client_id: clientId,
  });
  if (idTokenHint) params.set('id_token_hint', idTokenHint);
  const logoutUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/logout?${params.toString()}`;
  const done = () => res.redirect(logoutUrl);
  req.session ? req.session.destroy(done) : done();
});

// ─── Middleware ─────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(':method :url :status :response-time ms'));

// Serve static assets (JS/CSS/images) but NOT index.html
// index.html is served by the protected SPA routes below.
// Mount at both `/` and `/admin/` so the same build works:
//   - behind nginx (strips `/admin/` → requests arrive as `/assets/...`)
//   - direct local access (browser fetches `/admin/assets/...` from index.html)
const reactBuildPath = path.join(__dirname, 'crm-ui', 'dist');
app.use(express.static(reactBuildPath, { index: false }));
app.use('/admin', express.static(reactBuildPath, { index: false }));

// ─── Role-based protection ─────────────────────────────────────
// Only admin, manager, staff, shipper can access CRM

const CRM_ROLES = ['admin', 'manager', 'staff', 'shipper'];

const keycloakProtectMiddleware = keycloak.protect();

// crmProtect: authenticate first; if logged in but lacks a CRM role,
// redirect to /no-access (friendly React page) instead of returning
// keycloak-connect's default "Access denied" plaintext.
const crmProtect = (req, res, next) => {
  keycloakProtectMiddleware(req, res, () => {
    try {
      const token = req.kauth?.grant?.access_token?.content || {};
      const realmRoles = token.realm_access?.roles || [];
      const hasRole = realmRoles.some((r) => CRM_ROLES.includes(r));
      if (hasRole) return next();
      // Authenticated, but no CRM role → friendly page
      if (req.path === '/no-access') return next();
      return res.redirect('/no-access');
    } catch (err) {
      console.error('[crmProtect] role check failed:', err.message);
      return res.redirect('/no-access');
    }
  });
};

// ─── API Auth Middleware ─────────────────────────────────────
// Wraps keycloak.protect() but returns 401 JSON for API requests
// instead of redirecting to Keycloak login (which breaks XHR from React SPA)
const apiProtect = (req, res, next) => {
  const originalRedirect = res.redirect.bind(res);
  res.redirect = (url) => {
    if (req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ success: false, message: 'Unauthorized — please login' });
    }
    return originalRedirect(url);
  };
  keycloakProtectMiddleware(req, res, next);
};

// ─── API Proxy Middleware ─────────────────────────────────────
const attachProxy = require('./middleware/attachProxy');

// ─── API Routes (protected by Keycloak session, proxied to Backend) ──

app.use('/api/products', apiProtect, attachProxy, require('./routes/products'));
app.use('/api/categories', apiProtect, attachProxy, require('./routes/categories'));
app.use('/api/orders', apiProtect, attachProxy, require('./routes/orders'));
app.use('/api/users', apiProtect, attachProxy, require('./routes/users'));
// Phase 2 — CMS and Coupons
app.use('/api/cms', apiProtect, require('./routes/cms.routes'));
app.use('/api/coupons', apiProtect, require('./routes/coupon.routes'));

// Phase 4 — Vendors, Analytics, Activity Log
app.use('/api/vendors', apiProtect, require('./routes/vendor.routes'));
app.use('/api/analytics', apiProtect, require('./routes/analytics.routes'));
app.use('/api/activity-log', apiProtect, require('./routes/activity-log.routes'));
app.use('/api/chat', apiProtect, require('./routes/chatbot.routes'));
// Phase 7 — Exchange Rates (public store endpoint, proxied for consistency)
app.use('/api/exchange-rates', apiProtect, attachProxy, require('./routes/exchange-rates'));
app.use('/api/v1/admin/media', apiProtect, require('./routes/media'));

// ─── Self-identification endpoint ───
// Returns the current session's user info and roles for the React SPA
app.get('/api/me', apiProtect, (req, res) => {
  try {
    const token = req.kauth.grant.access_token.content;

    // Merge realm and client roles
    const realmRoles = token.realm_access?.roles || [];
    const resourceAccess = token.resource_access || {};
    const clientRoles = [];
    for (const [, client] of Object.entries(resourceAccess)) {
      if (client && Array.isArray(client.roles)) {
        clientRoles.push(...client.roles);
      }
    }
    const allRoles = [...new Set([...realmRoles, ...clientRoles])];

    res.json({
      name: token.preferred_username || token.name || 'Unknown',
      email: token.email || '',
      roles: allRoles,
    });
  } catch (err) {
    console.error('[/api/me] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to read session' });
  }
});

// ─── Page Routes (React SPA, protected by Keycloak) ─────────

// /no-access: requires login but NOT a CRM role.
// Shown to authenticated users whose token lacks admin/manager/staff/shipper.
app.get('/no-access', keycloakProtectMiddleware, (req, res) => {
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

// Wildcard catch-all: serve index.html for all non-API routes so React Router
// handles /vendors, /reviews, /coupons, /cms/*, /settings/*, /activity-log, etc.
app.get('*', crmProtect, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(reactBuildPath, 'index.html'));
});

// ─── Error handling ────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ─── Start ─────────────────────────────────────────────────────

const PORT = process.env.CRM_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Shofy CRM Server running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});

module.exports = app;
