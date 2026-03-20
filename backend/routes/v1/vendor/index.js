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
const { validate } = require('../../../middleware/validate');
const v = require('../../../validations');

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/vendor/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile',   ctrl.getProfile);

/**
 * @swagger
 * /api/v1/vendor/profile:
 *   patch:
 *     summary: Update vendor profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 *       422:
 *         description: Validation error
 */
router.patch('/profile', validate(v.updateVendorProfile), ctrl.updateProfile);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/vendor/products:
 *   get:
 *     summary: List vendor's products
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product list
 *   post:
 *     summary: Create vendor product
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Product created
 *       422:
 *         description: Validation error
 */
router.get('/products',        ctrl.getProducts);
router.get('/products/:id',    ctrl.getProductById);
router.post('/products',       validate(v.createProduct), ctrl.createProduct);
router.patch('/products/:id',  validate(v.updateProduct), ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/vendor/orders:
 *   get:
 *     summary: List vendor's orders
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order list
 */
router.get('/orders',                                  ctrl.getOrders);
router.get('/orders/:id',                              ctrl.getOrderById);
router.patch('/orders/:orderId/items/:itemId/status',  ctrl.updateItemStatus);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/vendor/analytics/summary:
 *   get:
 *     summary: Vendor analytics summary
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/analytics/summary',      ctrl.getSummary);
router.get('/analytics/revenue',      ctrl.getRevenue);
router.get('/analytics/top-products', ctrl.getTopProducts);

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/vendor/payouts/request:
 *   post:
 *     summary: Request a payout
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payout request submitted
 *       422:
 *         description: Validation error
 */
router.post('/payouts/request', validate(v.requestPayout), ctrl.requestPayout);
router.get('/payouts/:id',      ctrl.getPayoutById);
router.get('/payouts',          ctrl.getPayouts);

module.exports = router;
