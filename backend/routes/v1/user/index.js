'use strict';

/**
 * User routes — v1  (all routes require authentication via verifyToken applied
 * at the v1 index level)
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../../../controller/v1/user.controller');
const wishlistCtrl = require('../../../controller/v1/wishlist.controller');
const { validate } = require('../../../middleware/validate');
const v = require('../../../validations');

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     summary: Get authenticated user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', ctrl.getProfile);

/**
 * @swagger
 * /api/v1/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 *       422:
 *         description: Validation error
 */
router.put('/profile', validate(v.updateUser), ctrl.updateProfile);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/user/orders:
 *   get:
 *     summary: List user's orders
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order list
 */
router.get('/orders',     ctrl.getUserOrders);

/**
 * @swagger
 * /api/v1/user/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order object
 *       404:
 *         description: Not found
 */
router.get('/orders/:id', ctrl.getOrderById);

/**
 * @swagger
 * /api/v1/user/orders:
 *   post:
 *     summary: Create order
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cart, name, address, email, contact, city, country, zipCode, subTotal, totalAmount, shippingCost, paymentMethod]
 *             properties:
 *               cart:
 *                 type: array
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               email:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [COD, stripe, bank-transfer, vnpay, momo]
 *     responses:
 *       201:
 *         description: Order created
 *       422:
 *         description: Validation error
 */
router.post('/orders',    validate(v.createOrder), ctrl.createOrder);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/user/reviews:
 *   post:
 *     summary: Submit product review
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, rating]
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted for moderation
 *       422:
 *         description: Validation error
 */
router.post('/reviews', validate(v.createReview), ctrl.addReview);

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/user/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist items
 */
router.get('/wishlist',                               wishlistCtrl.getWishlist);
router.post('/wishlist',                              wishlistCtrl.addToWishlist);
router.delete('/wishlist',                            wishlistCtrl.clearWishlist);
router.delete('/wishlist/:productId',                 wishlistCtrl.removeFromWishlist);
router.post('/wishlist/:productId/move-to-cart',      wishlistCtrl.moveToCart);

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/user/addresses:
 *   get:
 *     summary: List saved addresses
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address list
 *   post:
 *     summary: Add new address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Address added
 */
router.get('/addresses',               ctrl.getAddresses);
router.post('/addresses',              ctrl.addAddress);
router.put('/addresses/:id',           ctrl.updateAddress);
router.patch('/addresses/:id/default', ctrl.setDefaultAddress);
router.delete('/addresses/:id',        ctrl.deleteAddress);

// ---------------------------------------------------------------------------
// Vendor application
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/user/vendor/apply:
 *   post:
 *     summary: Apply to become a vendor
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storeName]
 *             properties:
 *               storeName:
 *                 type: string
 *               storeDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted
 *       422:
 *         description: Validation error
 */
router.post('/vendor/apply', validate(v.vendorApplication), ctrl.applyForVendor);

module.exports = router;
