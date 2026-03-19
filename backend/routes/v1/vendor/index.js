'use strict';

/**
 * Vendor routes — v1  (Phase 4)
 *
 * All endpoints are stubs. Authentication + vendor-role check are applied at
 * the v1 index level before these routes are reached.
 */

const express = require('express');
const router = express.Router();
const respond = require('../../../utils/respond');

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Vendor products
// ---------------------------------------------------------------------------

router.get('/products',       NOT_IMPLEMENTED);
router.post('/products',      NOT_IMPLEMENTED);
router.patch('/products/:id', NOT_IMPLEMENTED);
router.delete('/products/:id', NOT_IMPLEMENTED);

// ---------------------------------------------------------------------------
// Vendor orders
// ---------------------------------------------------------------------------

router.get('/orders',               NOT_IMPLEMENTED);
router.get('/orders/:id',           NOT_IMPLEMENTED);
router.patch('/orders/:id/status',  NOT_IMPLEMENTED);

// ---------------------------------------------------------------------------
// Vendor dashboard & payouts
// ---------------------------------------------------------------------------

router.get('/dashboard', NOT_IMPLEMENTED);
router.get('/payouts',   NOT_IMPLEMENTED);

module.exports = router;
