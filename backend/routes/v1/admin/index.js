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
const analyticsCtrl = require('../../../controller/v1/analytics.controller');
const emailTemplateCtrl = require('../../../controller/v1/email-template.controller');
const activityLogCtrl = require('../../../controller/v1/activityLog.controller');
const { logActivity } = require('../../../middleware/activityLog');
const respond = require('../../../utils/respond');

// Vendor controller is optional — guard against missing file during early dev
let vendorCtrl;
try {
  vendorCtrl = require('../../../controller/v1/admin.vendor.controller');
} catch (_) {
  vendorCtrl = null;
}

const upload = multer();
const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

router.get('/products/stats',  ctrl.getProductStats);
router.get('/products/:id',    ctrl.getProductById);
router.get('/products',        ctrl.getAllProducts);
router.post('/products',       authorization('admin', 'manager'), logActivity('create', 'product'), ctrl.createProduct);
router.patch('/products/:id',  authorization('admin', 'manager'), logActivity('update', 'product'), ctrl.updateProduct);
router.delete('/products/:id', authorization('admin', 'manager'), logActivity('delete', 'product'), ctrl.deleteProduct);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

router.get('/categories/stats', ctrl.getCategoryStats);
router.get('/categories/tree',  ctrl.getCategoryTree);
router.get('/categories/:id',   ctrl.getCategoryById);
router.get('/categories',       ctrl.getAllCategories);
router.post('/categories',      authorization('admin', 'manager'), logActivity('create', 'category'), ctrl.createCategory);
router.patch('/categories/:id', authorization('admin', 'manager'), logActivity('update', 'category'), ctrl.updateCategory);
router.delete('/categories/:id', authorization('admin', 'manager'), logActivity('delete', 'category'), ctrl.deleteCategory);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

router.get('/orders/stats',          ctrl.getOrderStats);
router.get('/orders/:id',            ctrl.getOrderById);
router.get('/orders',                ctrl.getAllOrders);
router.post('/orders',               authorization('admin', 'manager'), logActivity('create', 'order'), ctrl.createOrder);
router.patch('/orders/:id/status',   logActivity('status-change', 'order'), ctrl.updateOrderStatus);
router.patch('/orders/:id',          authorization('admin', 'manager'), logActivity('update', 'order'), ctrl.updateOrder);
router.delete('/orders/:id',         authorization('admin', 'manager'), logActivity('delete', 'order'), ctrl.deleteOrder);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

router.get('/users/stats',          ctrl.getUserStats);
router.get('/users/:id/orders',     ctrl.getUserOrders);
router.get('/users/:id',            ctrl.getUserById);
router.get('/users',                ctrl.getAllUsers);
router.post('/users',               authorization('admin', 'manager'), logActivity('create', 'user'), ctrl.createUser);
router.patch('/users/:id/status',   authorization('admin', 'manager'), logActivity('status-change', 'user'), ctrl.updateUserStatus);
router.patch('/users/:id',          authorization('admin', 'manager'), logActivity('update', 'user'), ctrl.updateUser);
router.delete('/users/:id',         authorization('admin', 'manager'), logActivity('delete', 'user'), ctrl.deleteUser);

// ---------------------------------------------------------------------------
// Staff — admin/manager only (Keycloak-integrated)
// ---------------------------------------------------------------------------

router.post('/staff',             authorization('admin', 'manager'), ctrl.addStaff);
router.get('/staff',              authorization('admin', 'manager'), ctrl.getAllStaff);
router.get('/staff/:id',          authorization('admin', 'manager'), ctrl.getStaffById);
router.patch('/staff/:id',        authorization('admin', 'manager'), ctrl.updateStaff);
router.patch('/staff/:id/status', authorization('admin', 'manager'), ctrl.updatedStatus);
router.delete('/staff/:id',       authorization('admin', 'manager'), ctrl.deleteStaff);

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
// Analytics — Phase 4 (new endpoints replace legacy proxies below)
//
// NOTE: The legacy routes (/analytics/dashboard-amount, /analytics/top-categories)
// have been removed here because the new analytics controller covers the same
// data with richer responses.  The legacy controller functions remain intact in
// user.order.controller.js and are still served via the legacy /api/user-order/*
// routes for backward compatibility.
// ---------------------------------------------------------------------------

router.get('/analytics/dashboard',         analyticsCtrl.getDashboard);
router.get('/analytics/sales-report',      analyticsCtrl.getSalesReport);
router.get('/analytics/revenue',           analyticsCtrl.getRevenue);
router.get('/analytics/top-products',      analyticsCtrl.getTopProducts);
router.get('/analytics/top-categories',    analyticsCtrl.getTopCategories);
router.get('/analytics/customer-growth',   analyticsCtrl.getCustomerGrowth);
router.get('/analytics/vendor-performance', authorization('admin', 'manager'), analyticsCtrl.getVendorPerformance);
router.get('/analytics/recent-orders',     analyticsCtrl.getRecentOrders);

// Legacy dashboard-amount alias — keep for any existing CRM calls
router.get('/analytics/dashboard-amount',  ctrl.getDashboardAmount);

// ---------------------------------------------------------------------------
// Pages — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/pages',                  cmsCtrl.listPages);
router.get('/pages/:id',              cmsCtrl.getPage);
router.post('/pages',                 authorization('admin', 'manager'), logActivity('create', 'page'), cmsCtrl.createPage);
router.post('/pages/:id/duplicate',   authorization('admin', 'manager'), cmsCtrl.duplicatePage);
router.patch('/pages/:id/blocks',     authorization('admin', 'manager'), logActivity('update', 'page'), cmsCtrl.updatePageBlocks);
router.patch('/pages/:id',            authorization('admin', 'manager'), logActivity('update', 'page'), cmsCtrl.updatePage);
router.delete('/pages/:id',           authorization('admin', 'manager'), logActivity('delete', 'page'), cmsCtrl.deletePage);

// ---------------------------------------------------------------------------
// Menus — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/menus',         cmsCtrl.listMenus);
router.get('/menus/:id',     cmsCtrl.getMenu);
router.post('/menus',        authorization('admin', 'manager'), logActivity('create', 'menu'), cmsCtrl.createMenu);
router.patch('/menus/:id',   authorization('admin', 'manager'), logActivity('update', 'menu'), cmsCtrl.updateMenu);
router.delete('/menus/:id',  authorization('admin', 'manager'), logActivity('delete', 'menu'), cmsCtrl.deleteMenu);

// ---------------------------------------------------------------------------
// Banners — CMS Phase 2
// Note: /banners/priority must be declared before /banners/:id
// ---------------------------------------------------------------------------

router.patch('/banners/priority',    authorization('admin', 'manager'), cmsCtrl.updateBannerPriority);
router.get('/banners',               cmsCtrl.listBanners);
router.get('/banners/:id',           cmsCtrl.getBanner);
router.post('/banners',              authorization('admin', 'manager'), logActivity('create', 'banner'), cmsCtrl.createBanner);
router.patch('/banners/:id',         authorization('admin', 'manager'), logActivity('update', 'banner'), cmsCtrl.updateBanner);
router.delete('/banners/:id',        authorization('admin', 'manager'), logActivity('delete', 'banner'), cmsCtrl.deleteBanner);

// ---------------------------------------------------------------------------
// Blog — CMS Phase 2
// Note: specific sub-routes must be declared before /blog/:id
// ---------------------------------------------------------------------------

router.patch('/blog/:id/publish',    authorization('admin', 'manager'), logActivity('update', 'blog'), cmsCtrl.publishBlogPost);
router.patch('/blog/:id/unpublish',  authorization('admin', 'manager'), logActivity('update', 'blog'), cmsCtrl.unpublishBlogPost);
router.get('/blog',                  cmsCtrl.listBlogPosts);
router.get('/blog/:id',              cmsCtrl.getBlogPost);
router.post('/blog',                 authorization('admin', 'manager'), logActivity('create', 'blog'), cmsCtrl.createBlogPost);
router.patch('/blog/:id',            authorization('admin', 'manager'), logActivity('update', 'blog'), cmsCtrl.updateBlogPost);
router.delete('/blog/:id',           authorization('admin', 'manager'), logActivity('delete', 'blog'), cmsCtrl.deleteBlogPost);

// ---------------------------------------------------------------------------
// Settings — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/settings',     cmsCtrl.getSettings);
router.patch('/settings',   authorization('admin', 'manager'), logActivity('update', 'setting'), cmsCtrl.updateSettings);

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
// Email Templates — Phase 4
// Replaces the NOT_IMPLEMENTED stubs from Phase 3
// ---------------------------------------------------------------------------

router.get('/email-templates',              emailTemplateCtrl.listTemplates);
router.get('/email-templates/:id',          emailTemplateCtrl.getTemplate);
router.patch('/email-templates/:id',        authorization('admin', 'manager'), logActivity('update', 'email-template'), emailTemplateCtrl.updateTemplate);
router.post('/email-templates/:id/preview', authorization('admin', 'manager'), emailTemplateCtrl.previewTemplate);
router.post('/email-templates/:id/test',    authorization('admin', 'manager'), emailTemplateCtrl.testTemplate);

// ---------------------------------------------------------------------------
// Activity Log — Phase 4
// /export must be declared before /:id-style routes (no parameterised ID here)
// ---------------------------------------------------------------------------

router.get('/activity-log/export', authorization('admin'), activityLogCtrl.exportLogs);
router.get('/activity-log',        authorization('admin', 'manager'), activityLogCtrl.listLogs);

// ---------------------------------------------------------------------------
// Vendors — Phase 4
// Note: /vendors/stats must be declared before /vendors/:id
// ---------------------------------------------------------------------------

if (vendorCtrl) {
  router.get('/vendors/stats',                          vendorCtrl.getVendorStats);
  router.get('/vendors',                                vendorCtrl.listVendors);
  router.get('/vendors/:id',                            vendorCtrl.getVendorById);
  router.get('/vendors/:id/products',                   vendorCtrl.getVendorProducts);
  router.get('/vendors/:id/orders',                     vendorCtrl.getVendorOrders);
  router.get('/vendors/:id/payouts',                    vendorCtrl.getVendorPayouts);
  router.patch('/vendors/:id/approve',                  authorization('admin', 'manager'), logActivity('status-change', 'vendor'), vendorCtrl.approveVendor);
  router.patch('/vendors/:id/reject',                   authorization('admin', 'manager'), logActivity('status-change', 'vendor'), vendorCtrl.rejectVendor);
  router.patch('/vendors/:id/suspend',                  authorization('admin', 'manager'), logActivity('status-change', 'vendor'), vendorCtrl.suspendVendor);
  router.patch('/vendors/:id/commission',               authorization('admin', 'manager'), logActivity('update', 'vendor'), vendorCtrl.updateCommission);
  router.post('/vendors/:id/payouts/:payoutId/process', authorization('admin', 'manager'), vendorCtrl.processPayout);
}

// ---------------------------------------------------------------------------
// Coupons — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/coupons',          cmsCtrl.listCoupons);
router.get('/coupons/:id',      cmsCtrl.getCoupon);
router.post('/coupons',         authorization('admin', 'manager'), logActivity('create', 'coupon'), cmsCtrl.createCoupon);
router.patch('/coupons/:id',    authorization('admin', 'manager'), logActivity('update', 'coupon'), cmsCtrl.updateCoupon);
router.delete('/coupons/:id',   authorization('admin', 'manager'), logActivity('delete', 'coupon'), cmsCtrl.deleteCoupon);

module.exports = router;
