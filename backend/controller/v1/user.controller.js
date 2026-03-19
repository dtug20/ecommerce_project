'use strict';

/**
 * User controller — v1
 *
 * Thin wrappers around existing controllers.  All responses go through the
 * respond utility; business logic is NOT duplicated here.
 */

const respond = require('../../utils/respond');
const userController = require('../../controller/user.controller');
const userOrderController = require('../../controller/user.order.controller');
const orderController = require('../../controller/order.controller');
const reviewController = require('../../controller/review.controller');

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/user/profile
 * Delegates to existing getProfile — it already builds the correct response,
 * but we proxy through next() so the global error handler still applies.
 */
exports.getProfile = (req, res, next) => {
  return userController.getProfile(req, res, next);
};

/**
 * PUT /api/v1/user/profile
 */
exports.updateProfile = (req, res, next) => {
  return userController.updateUser(req, res, next);
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/user/orders
 */
exports.getUserOrders = (req, res, next) => {
  return userOrderController.getOrderByUser(req, res, next);
};

/**
 * GET /api/v1/user/orders/:id
 */
exports.getOrderById = (req, res, next) => {
  return userOrderController.getOrderById(req, res, next);
};

/**
 * POST /api/v1/user/orders
 */
exports.createOrder = (req, res, next) => {
  return orderController.addOrder(req, res, next);
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/user/reviews
 */
exports.addReview = (req, res, next) => {
  return reviewController.addReview(req, res, next);
};
