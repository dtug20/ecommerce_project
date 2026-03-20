const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
require('dotenv').config();

const app = express();

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

app.use(keycloak.middleware({ logout: '/logout', admin: '/' }));

// ─── Middleware ─────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(':method :url :status :response-time ms'));

// Serve static assets (JS/CSS/images) but NOT index.html
// index.html is served by the protected SPA routes below
const reactBuildPath = path.join(__dirname, 'crm-ui', 'dist');
app.use(express.static(reactBuildPath, { index: false }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Database connection ───────────────────────────────────────

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shofy', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('CRM Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB connection failed:', error.message);
  }
};

// ─── Role-based protection ─────────────────────────────────────
// Only admin, manager, staff can access CRM

const crmProtect = keycloak.protect((token) => {
  return (
    token.hasRealmRole('admin') ||
    token.hasRealmRole('manager') ||
    token.hasRealmRole('staff')
  );
});

// ─── API Auth Middleware ─────────────────────────────────────
// Wraps keycloak.protect() but returns 401 JSON for API requests
// instead of redirecting to Keycloak login (which breaks XHR from React SPA)
const keycloakProtectMiddleware = keycloak.protect();
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
// Sync service removed in Phase 1 — single database, no sync needed
// app.use('/api/sync', apiProtect, require('./routes/sync.routes'));

// Phase 2 — CMS and Coupons
app.use('/api/cms', apiProtect, require('./routes/cms.routes'));
app.use('/api/coupons', apiProtect, require('./routes/coupon.routes'));

// Phase 3 — Reviews
app.use('/api/reviews', apiProtect, require('./routes/review.routes'));

// Phase 4 — Vendors, Analytics, Email Templates, Activity Log
app.use('/api/vendors', apiProtect, require('./routes/vendor.routes'));
app.use('/api/analytics', apiProtect, require('./routes/analytics.routes'));
app.use('/api/email-templates', apiProtect, require('./routes/email-template.routes'));
app.use('/api/activity-log', apiProtect, require('./routes/activity-log.routes'));

// ─── Page Routes (React SPA, protected by Keycloak) ─────────

const spaRoutes = ['/', '/products', '/categories', '/orders', '/users'];
spaRoutes.forEach((route) => {
  app.get(route, crmProtect, (req, res) => {
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  });
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

connectDB().then(() => {
  const PORT = process.env.CRM_PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Shofy CRM Server running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}`);
  });
});

module.exports = app;
