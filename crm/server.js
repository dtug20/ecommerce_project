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
app.use(morgan('combined'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Extract user info for all views ───────────────────────────

app.use((req, res, next) => {
  res.locals.user = null;
  if (req.kauth && req.kauth.grant) {
    const token = req.kauth.grant.access_token.content;
    const roles = token.realm_access?.roles || [];
    // Pick the highest CRM role
    const role = roles.includes('admin')
      ? 'Admin'
      : roles.includes('manager')
        ? 'Manager'
        : roles.includes('staff')
          ? 'Staff'
          : 'User';
    res.locals.user = {
      name: token.name || token.preferred_username || token.email,
      email: token.email,
      role,
      roles,
    };
  }
  next();
});

// ─── Database connection ───────────────────────────────────────

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shofy');
    console.log('CRM Connected to MongoDB (shofy database)');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
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

// ─── API Routes (protected by Keycloak) ────────────────────────

app.use('/api/products', keycloak.protect(), require('./routes/products'));
app.use('/api/categories', keycloak.protect(), require('./routes/categories'));
app.use('/api/orders', keycloak.protect(), require('./routes/orders'));
app.use('/api/users', keycloak.protect(), require('./routes/users'));
app.use('/api/sync', keycloak.protect(), require('./routes/sync.routes'));

// ─── Page Routes (protected, admin/manager/staff only) ────────

app.get('/', crmProtect, (req, res) => {
  res.render('dashboard', { title: 'Shofy CRM Dashboard' });
});

app.get('/products', crmProtect, (req, res) => {
  res.render('products', { title: 'Product Management' });
});

app.get('/categories', crmProtect, (req, res) => {
  res.render('categories', { title: 'Category Management' });
});

app.get('/orders', crmProtect, (req, res) => {
  res.render('orders', { title: 'Order Management' });
});

app.get('/users', crmProtect, (req, res) => {
  res.render('users', { title: 'User Management' });
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

// 404 handler
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
