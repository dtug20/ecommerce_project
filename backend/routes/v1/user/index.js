'use strict';

/**
 * User routes — v1  (all routes require authentication via verifyToken applied
 * at the v1 index level)
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../../../controller/v1/user.controller');
const respond = require('../../../utils/respond');

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

router.get('/orders',     ctrl.getUserOrders);
router.get('/orders/:id', ctrl.getOrderById);
router.post('/orders',    ctrl.createOrder);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

router.post('/reviews', ctrl.addReview);

// ---------------------------------------------------------------------------
// Wishlist — Phase 3 stubs
// ---------------------------------------------------------------------------

router.get('/wishlist',                NOT_IMPLEMENTED);
router.post('/wishlist',               NOT_IMPLEMENTED);
router.delete('/wishlist/:productId',  NOT_IMPLEMENTED);

// ---------------------------------------------------------------------------
// Addresses — Phase 3 stubs
// ---------------------------------------------------------------------------

router.get('/addresses',        NOT_IMPLEMENTED);
router.post('/addresses',       NOT_IMPLEMENTED);
router.put('/addresses/:id',    NOT_IMPLEMENTED);
router.delete('/addresses/:id', NOT_IMPLEMENTED);

module.exports = router;
