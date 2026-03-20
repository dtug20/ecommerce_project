'use strict';

/**
 * User routes — v1  (all routes require authentication via verifyToken applied
 * at the v1 index level)
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../../../controller/v1/user.controller');
const wishlistCtrl = require('../../../controller/v1/wishlist.controller');

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
// Wishlist
// ---------------------------------------------------------------------------

router.get('/wishlist',                               wishlistCtrl.getWishlist);
router.post('/wishlist',                              wishlistCtrl.addToWishlist);
router.delete('/wishlist',                            wishlistCtrl.clearWishlist);
router.delete('/wishlist/:productId',                 wishlistCtrl.removeFromWishlist);
router.post('/wishlist/:productId/move-to-cart',      wishlistCtrl.moveToCart);

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

router.get('/addresses',               ctrl.getAddresses);
router.post('/addresses',              ctrl.addAddress);
router.put('/addresses/:id',           ctrl.updateAddress);
router.patch('/addresses/:id/default', ctrl.setDefaultAddress);
router.delete('/addresses/:id',        ctrl.deleteAddress);

// ---------------------------------------------------------------------------
// Vendor application
// ---------------------------------------------------------------------------

router.post('/vendor/apply', ctrl.applyForVendor);

module.exports = router;
