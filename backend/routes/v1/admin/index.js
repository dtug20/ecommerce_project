'use strict';

/**
 * Admin routes — v1
 *
 * Authentication + role check (admin | manager | staff) is applied at the v1
 * index level before any of these routes are reached.
 *
 * Some actions require a stricter admin/manager-only check; those apply an
 * additional authorization() call inline.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const authorization = require('../../../middleware/authorization');
const ctrl = require('../../../controller/v1/admin.controller');
const cmsCtrl = require('../../../controller/v1/cms.controller');
const reviewCtrl = require('../../../controller/v1/review.controller');
const respond = require('../../../utils/respond');

const upload = multer();
const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

router.get('/products/stats',  ctrl.getProductStats);
router.get('/products/:id',    ctrl.getProductById);
router.get('/products',        ctrl.getAllProducts);
router.post('/products',       authorization('admin', 'manager'), ctrl.createProduct);
router.patch('/products/:id',  authorization('admin', 'manager'), ctrl.updateProduct);
router.delete('/products/:id', authorization('admin', 'manager'), ctrl.deleteProduct);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

router.get('/categories/stats', ctrl.getCategoryStats);
router.get('/categories/tree',  ctrl.getCategoryTree);
router.get('/categories/:id',   ctrl.getCategoryById);
router.get('/categories',       ctrl.getAllCategories);
router.post('/categories',      authorization('admin', 'manager'), ctrl.createCategory);
router.patch('/categories/:id', authorization('admin', 'manager'), ctrl.updateCategory);
router.delete('/categories/:id', authorization('admin', 'manager'), ctrl.deleteCategory);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

router.get('/orders/stats',          ctrl.getOrderStats);
router.get('/orders/:id',            ctrl.getOrderById);
router.get('/orders',                ctrl.getAllOrders);
router.post('/orders',               authorization('admin', 'manager'), ctrl.createOrder);
router.patch('/orders/:id/status',   ctrl.updateOrderStatus);
router.patch('/orders/:id',          authorization('admin', 'manager'), ctrl.updateOrder);
router.delete('/orders/:id',         authorization('admin', 'manager'), ctrl.deleteOrder);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

router.get('/users/stats',          ctrl.getUserStats);
router.get('/users/:id/orders',     ctrl.getUserOrders);
router.get('/users/:id',            ctrl.getUserById);
router.get('/users',                ctrl.getAllUsers);
router.post('/users',               authorization('admin', 'manager'), ctrl.createUser);
router.patch('/users/:id/status',   authorization('admin', 'manager'), ctrl.updateUserStatus);
router.patch('/users/:id',          authorization('admin', 'manager'), ctrl.updateUser);
router.delete('/users/:id',         authorization('admin', 'manager'), ctrl.deleteUser);

// ---------------------------------------------------------------------------
// Staff — admin/manager only (Keycloak-integrated)
// ---------------------------------------------------------------------------

router.post('/staff',           authorization('admin', 'manager'), ctrl.addStaff);
router.get('/staff',            authorization('admin', 'manager'), ctrl.getAllStaff);
router.get('/staff/:id',        authorization('admin', 'manager'), ctrl.getStaffById);
router.patch('/staff/:id',      authorization('admin', 'manager'), ctrl.updateStaff);
router.patch('/staff/:id/status', authorization('admin', 'manager'), ctrl.updatedStatus);
router.delete('/staff/:id',     authorization('admin', 'manager'), ctrl.deleteStaff);

// ---------------------------------------------------------------------------
// Media / Cloudinary
// ---------------------------------------------------------------------------

router.post(
  '/media/upload',
  authorization('admin', 'manager'),
  upload.single('image'),
  ctrl.uploadImage
);
router.post(
  '/media/upload-multiple',
  authorization('admin', 'manager'),
  upload.array('images', 5),
  ctrl.uploadMultipleImages
);
router.delete('/media', authorization('admin', 'manager'), ctrl.deleteImage);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

router.get('/analytics/dashboard-amount',    ctrl.getDashboardAmount);
router.get('/analytics/sales-report',        ctrl.getSalesReport);
router.get('/analytics/top-categories',      ctrl.getMostSellingCategory);
router.get('/analytics/recent-orders',       ctrl.getDashboardRecentOrder);

// ---------------------------------------------------------------------------
// Pages — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/pages',                  cmsCtrl.listPages);
router.get('/pages/:id',              cmsCtrl.getPage);
router.post('/pages',                 authorization('admin', 'manager'), cmsCtrl.createPage);
router.post('/pages/:id/duplicate',   authorization('admin', 'manager'), cmsCtrl.duplicatePage);
router.patch('/pages/:id/blocks',     authorization('admin', 'manager'), cmsCtrl.updatePageBlocks);
router.patch('/pages/:id',            authorization('admin', 'manager'), cmsCtrl.updatePage);
router.delete('/pages/:id',           authorization('admin', 'manager'), cmsCtrl.deletePage);

// ---------------------------------------------------------------------------
// Menus — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/menus',         cmsCtrl.listMenus);
router.get('/menus/:id',     cmsCtrl.getMenu);
router.post('/menus',        authorization('admin', 'manager'), cmsCtrl.createMenu);
router.patch('/menus/:id',   authorization('admin', 'manager'), cmsCtrl.updateMenu);
router.delete('/menus/:id',  authorization('admin', 'manager'), cmsCtrl.deleteMenu);

// ---------------------------------------------------------------------------
// Banners — CMS Phase 2
// Note: /banners/priority must be declared before /banners/:id
// ---------------------------------------------------------------------------

router.patch('/banners/priority',    authorization('admin', 'manager'), cmsCtrl.updateBannerPriority);
router.get('/banners',               cmsCtrl.listBanners);
router.get('/banners/:id',           cmsCtrl.getBanner);
router.post('/banners',              authorization('admin', 'manager'), cmsCtrl.createBanner);
router.patch('/banners/:id',         authorization('admin', 'manager'), cmsCtrl.updateBanner);
router.delete('/banners/:id',        authorization('admin', 'manager'), cmsCtrl.deleteBanner);

// ---------------------------------------------------------------------------
// Blog — CMS Phase 2
// Note: specific sub-routes must be declared before /blog/:id
// ---------------------------------------------------------------------------

router.patch('/blog/:id/publish',    authorization('admin', 'manager'), cmsCtrl.publishBlogPost);
router.patch('/blog/:id/unpublish',  authorization('admin', 'manager'), cmsCtrl.unpublishBlogPost);
router.get('/blog',                  cmsCtrl.listBlogPosts);
router.get('/blog/:id',              cmsCtrl.getBlogPost);
router.post('/blog',                 authorization('admin', 'manager'), cmsCtrl.createBlogPost);
router.patch('/blog/:id',            authorization('admin', 'manager'), cmsCtrl.updateBlogPost);
router.delete('/blog/:id',           authorization('admin', 'manager'), cmsCtrl.deleteBlogPost);

// ---------------------------------------------------------------------------
// Settings — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/settings',     cmsCtrl.getSettings);
router.patch('/settings',   authorization('admin', 'manager'), cmsCtrl.updateSettings);

// ---------------------------------------------------------------------------
// Reviews — Phase 3
// Note: /reviews/:id sub-routes must be declared before /reviews/:id
// ---------------------------------------------------------------------------

router.get('/reviews',                                          reviewCtrl.listReviews);
router.get('/reviews/:id',                                      reviewCtrl.getReview);
router.get('/products/:productId/reviews',                      reviewCtrl.getProductReviews);
router.patch('/reviews/:id/approve',   authorization('admin', 'manager'), reviewCtrl.approveReview);
router.patch('/reviews/:id/reject',    authorization('admin', 'manager'), reviewCtrl.rejectReview);
router.post('/reviews/:id/reply',      authorization('admin', 'manager'), reviewCtrl.replyToReview);
router.delete('/reviews/:id',          authorization('admin', 'manager'), reviewCtrl.deleteReview);

// ---------------------------------------------------------------------------
// Email templates — Phase 3 stub
// ---------------------------------------------------------------------------

router.get('/email-templates',       NOT_IMPLEMENTED);
router.patch('/email-templates/:id', NOT_IMPLEMENTED);

// ---------------------------------------------------------------------------
// Coupons — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/coupons',          cmsCtrl.listCoupons);
router.get('/coupons/:id',      cmsCtrl.getCoupon);
router.post('/coupons',         authorization('admin', 'manager'), cmsCtrl.createCoupon);
router.patch('/coupons/:id',    authorization('admin', 'manager'), cmsCtrl.updateCoupon);
router.delete('/coupons/:id',   authorization('admin', 'manager'), cmsCtrl.deleteCoupon);

module.exports = router;
