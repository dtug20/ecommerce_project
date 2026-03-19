'use strict';

/**
 * API v1 — main router
 *
 * Route group layout:
 *   /api/v1/auth/*    — OAuth/Keycloak auth helpers (Phase 2)
 *   /api/v1/store/*   — Public storefront endpoints
 *   /api/v1/user/*    — Authenticated user actions (verifyToken applied here)
 *   /api/v1/vendor/*  — Vendor-specific actions (verifyToken + vendor role)
 *   /api/v1/admin/*   — Admin panel actions (verifyToken + admin|manager|staff role)
 */

const express = require('express');
const router = express.Router();
const verifyToken   = require('../../middleware/verifyToken');
const authorization = require('../../middleware/authorization');

const authRoutes   = require('./auth.routes');
const storeRoutes  = require('./store/index');
const userRoutes   = require('./user/index');
const vendorRoutes = require('./vendor/index');
const adminRoutes  = require('./admin/index');

// Public
router.use('/auth',   authRoutes);
router.use('/store',  storeRoutes);

// Authenticated — user owns their data
router.use('/user',   verifyToken, userRoutes);

// Authenticated — vendor role required
router.use('/vendor', verifyToken, authorization('vendor'), vendorRoutes);

// Authenticated — at least staff role required
// (finer-grained admin/manager checks are enforced inside adminRoutes)
router.use('/admin',  verifyToken, authorization('admin', 'manager', 'staff'), adminRoutes);

module.exports = router;
