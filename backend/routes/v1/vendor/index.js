'use strict';

/**
 * Vendor routes — v1
 *
 * All endpoints require a valid JWT with role 'vendor'. Authentication and
 * vendor-role authorization are applied at the v1 index level before these
 * routes are reached.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../../../controller/v1/vendor.controller');

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

router.get('/profile',   ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

router.get('/products',        ctrl.getProducts);
router.get('/products/:id',    ctrl.getProductById);
router.post('/products',       ctrl.createProduct);
router.patch('/products/:id',  ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

router.get('/orders',                                  ctrl.getOrders);
router.get('/orders/:id',                              ctrl.getOrderById);
router.patch('/orders/:orderId/items/:itemId/status',  ctrl.updateItemStatus);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

// Static analytics routes before any parameterised route
router.get('/analytics/summary',      ctrl.getSummary);
router.get('/analytics/revenue',      ctrl.getRevenue);
router.get('/analytics/top-products', ctrl.getTopProducts);

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

// /payouts/request must precede /payouts/:id to avoid matching 'request' as id
router.post('/payouts/request', ctrl.requestPayout);
router.get('/payouts/:id',      ctrl.getPayoutById);
router.get('/payouts',          ctrl.getPayouts);

module.exports = router;
