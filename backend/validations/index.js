'use strict';

/**
 * Validation schemas — central re-export
 *
 * Usage:
 *   const v = require('./validations');
 *   router.post('/products', validate(v.createProduct), ctrl.createProduct);
 */

const product = require('./product.validation');
const order   = require('./order.validation');
const user    = require('./user.validation');
const review  = require('./review.validation');
const coupon  = require('./coupon.validation');
const vendor  = require('./vendor.validation');
const cms     = require('./cms.validation');

module.exports = {
  // Product
  createProduct: product.createProduct,
  updateProduct: product.updateProduct,

  // Order
  createOrder: order.createOrder,

  // User
  updateUser:       user.updateUser,
  updateUserStatus: user.updateUserStatus,
  vendorApplication: user.vendorApplication,
  createUser:       user.createUser,
  addStaff:         user.addStaff,

  // Review
  createReview:  review.createReview,
  replyToReview: review.replyToReview,
  rejectReview:  review.rejectReview,

  // Coupon
  createCoupon: coupon.createCoupon,
  updateCoupon: coupon.updateCoupon,

  // Vendor
  updateVendorProfile: vendor.updateVendorProfile,
  requestPayout:       vendor.requestPayout,

  // CMS
  createPage:     cms.createPage,
  updatePage:     cms.updatePage,
  createMenu:     cms.createMenu,
  updateMenu:     cms.updateMenu,
  createBanner:   cms.createBanner,
  updateBanner:   cms.updateBanner,
  createBlogPost: cms.createBlogPost,
  updateBlogPost: cms.updateBlogPost,
  updateSettings: cms.updateSettings,
};
