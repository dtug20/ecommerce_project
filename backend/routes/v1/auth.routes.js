'use strict';

/**
 * Auth routes — v1
 *
 * Authentication is handled by Keycloak.  These stub endpoints will be
 * wired to concrete implementations in Phase 2.
 */

const express = require('express');
const router = express.Router();
const respond = require('../../utils/respond');

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// GET  /api/v1/auth/callback — OAuth callback (Phase 2)
router.get('/callback', NOT_IMPLEMENTED);

// POST /api/v1/auth/refresh — Refresh access token (Phase 2)
router.post('/refresh', NOT_IMPLEMENTED);

// POST /api/v1/auth/logout — Logout / revoke token (Phase 2)
router.post('/logout', NOT_IMPLEMENTED);

// GET  /api/v1/auth/me — Return authenticated user info (Phase 2)
router.get('/me', NOT_IMPLEMENTED);

module.exports = router;
