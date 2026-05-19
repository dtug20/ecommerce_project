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
const { validate } = require('../../../middleware/validate');
const v = require('../../../validations');
const ctrl = require('../../../controller/v1/admin.controller');
const cmsCtrl = require('../../../controller/v1/cms.controller');
const analyticsCtrl = require('../../../controller/v1/analytics.controller');
const activityLogCtrl = require('../../../controller/v1/activityLog.controller');
const chatbotAdminCtrl = require('../../../controller/v1/chatbot-admin.controller');
const { logActivity } = require('../../../middleware/activityLog');
const respond = require('../../../utils/respond');

// Vendor controller is optional — guard against missing file during early dev
let vendorCtrl;
try {
  vendorCtrl = require('../../../controller/v1/admin.vendor.controller');
} catch (_) {
  vendorCtrl = null;
}

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      const err = new Error(`Unsupported file type "${file.mimetype}". Allowed: JPEG, PNG, WebP.`);
      err.code = 'UNSUPPORTED_MEDIA_TYPE';
      err.status = 415;
      return cb(err, false);
    }
    cb(null, true);
  },
});

const handleUploadErrors = (err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return respond.error(res, 'FILE_TOO_LARGE', `File exceeds maximum size of ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB`, 413);
    }
    return respond.error(res, 'UPLOAD_ERROR', err.message, 400);
  }
  if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
    return respond.error(res, 'UNSUPPORTED_MEDIA_TYPE', err.message, 415);
  }
  return next(err);
};

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Shipper Firewall
// Prevent shippers from accessing anything other than the /orders routes
// ---------------------------------------------------------------------------
router.use((req, res, next) => {
  if (req.user?.role === 'shipper' && !req.path.startsWith('/orders')) {
    return respond.error(res, 'FORBIDDEN', 'Shippers are only authorized to access orders', 403);
  }
  next();
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/admin/products/stats:
 *   get:
 *     summary: Get product statistics
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product stats
 *       401:
 *         description: Unauthorized
 */
router.get('/products/stats',  ctrl.getProductStats);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Admin Products]
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
 *         description: Product object
 *       404:
 *         description: Not found
 */
router.get('/products/:id',    ctrl.getProductById);

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: List all products (admin)
 *     tags: [Admin Products]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get('/products',        ctrl.getAllProducts);

/**
 * @swagger
 * /api/v1/admin/products:
 *   post:
 *     summary: Create product
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, quantity, productType]
 *             properties:
 *               title:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               productType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created
 *       422:
 *         description: Validation error
 */
router.post('/products',       authorization('admin', 'manager'), validate(v.createProduct), logActivity('create', 'product'), ctrl.createProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   patch:
 *     summary: Update product
 *     tags: [Admin Products]
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
 *         description: Product updated
 *       422:
 *         description: Validation error
 */
router.patch('/products/:id',  authorization('admin', 'manager'), validate(v.updateProduct), logActivity('update', 'product'), ctrl.updateProduct);

/**
 * @swagger
 * /api/v1/admin/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Admin Products]
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
 *         description: Product deleted
 */
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

/**
 * @swagger
 * /api/v1/admin/orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order stats
 */
router.get('/orders/stats',          ctrl.getOrderStats);
router.get('/orders/:id',            ctrl.getOrderById);

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: List all orders
 *     tags: [Admin Orders]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated order list
 */
router.get('/orders',                ctrl.getAllOrders);
router.post('/orders',               authorization('admin', 'manager'), logActivity('create', 'order'), ctrl.createOrder);
router.patch('/orders/:id/take',     authorization('shipper', 'admin'), logActivity('status-change', 'order'), ctrl.takeOrder);

/**
 * @swagger
 * /api/v1/admin/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *               carrier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
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
router.post('/users',               authorization('admin', 'manager'), validate(v.createUser), logActivity('create', 'user'), ctrl.createUser);
router.patch('/users/:id/status',   authorization('admin', 'manager'), validate(v.updateUserStatus), logActivity('status-change', 'user'), ctrl.updateUserStatus);
router.patch('/users/:id',          authorization('admin', 'manager'), validate(v.updateUser), logActivity('update', 'user'), ctrl.updateUser);
router.delete('/users/:id',         authorization('admin', 'manager'), logActivity('delete', 'user'), ctrl.deleteUser);

// ---------------------------------------------------------------------------
// Staff — admin/manager only (Keycloak-integrated)
// ---------------------------------------------------------------------------

router.post('/staff',             authorization('admin', 'manager'), validate(v.addStaff), ctrl.addStaff);
router.get('/staff',              authorization('admin', 'manager'), ctrl.getAllStaff);
router.get('/staff/:id',          authorization('admin', 'manager'), ctrl.getStaffById);
router.patch('/staff/:id',        authorization('admin', 'manager'), ctrl.updateStaff);
router.patch('/staff/:id/status', authorization('admin', 'manager'), ctrl.updatedStatus);
router.delete('/staff/:id',       authorization('admin', 'manager'), ctrl.deleteStaff);

// ---------------------------------------------------------------------------
// Media / Cloudinary
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/admin/media/upload:
 *   post:
 *     summary: Upload single image
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded
 */
router.post(
  '/media/upload',
  authorization('admin', 'manager'),
  (req, res, next) => upload.single('image')(req, res, (err) => handleUploadErrors(err, req, res, next)),
  ctrl.uploadImage
);
router.post(
  '/media/upload-multiple',
  authorization('admin', 'manager'),
  (req, res, next) => upload.array('images', 5)(req, res, (err) => handleUploadErrors(err, req, res, next)),
  ctrl.uploadMultipleImages
);
router.delete('/media', authorization('admin', 'manager'), ctrl.deleteImage);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/admin/analytics/dashboard:
 *   get:
 *     summary: Admin dashboard analytics
 *     tags: [Admin Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
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
// Banners — CMS Phase 2
// Note: /banners/priority must be declared before /banners/:id
// ---------------------------------------------------------------------------

router.patch('/banners/priority',    authorization('admin', 'manager'), cmsCtrl.updateBannerPriority);
router.get('/banners',               cmsCtrl.listBanners);
router.get('/banners/:id',           cmsCtrl.getBanner);
router.post('/banners',              authorization('admin', 'manager'), validate(v.createBanner), logActivity('create', 'banner'), cmsCtrl.createBanner);
router.patch('/banners/:id',         authorization('admin', 'manager'), validate(v.updateBanner), logActivity('update', 'banner'), cmsCtrl.updateBanner);
router.delete('/banners/:id',        authorization('admin', 'manager'), logActivity('delete', 'banner'), cmsCtrl.deleteBanner);

// ---------------------------------------------------------------------------
// Blog — CMS Phase 2
// Note: specific sub-routes must be declared before /blog/:id
// ---------------------------------------------------------------------------

router.patch('/blog/:id/publish',    authorization('admin', 'manager'), logActivity('update', 'blog'), cmsCtrl.publishBlogPost);
router.patch('/blog/:id/unpublish',  authorization('admin', 'manager'), logActivity('update', 'blog'), cmsCtrl.unpublishBlogPost);
router.get('/blog',                  cmsCtrl.listBlogPosts);
router.get('/blog/:id',              cmsCtrl.getBlogPost);
router.post('/blog',                 authorization('admin', 'manager'), validate(v.createBlogPost), logActivity('create', 'blog'), cmsCtrl.createBlogPost);
router.patch('/blog/:id',            authorization('admin', 'manager'), validate(v.updateBlogPost), logActivity('update', 'blog'), cmsCtrl.updateBlogPost);
router.delete('/blog/:id',           authorization('admin', 'manager'), logActivity('delete', 'blog'), cmsCtrl.deleteBlogPost);

// ---------------------------------------------------------------------------
// Settings — CMS Phase 2
// ---------------------------------------------------------------------------

router.get('/settings',     cmsCtrl.getSettings);
router.patch('/settings',   authorization('admin', 'manager'), logActivity('update', 'setting'), cmsCtrl.updateSettings);

// ---------------------------------------------------------------------------
// Activity Log — Phase 4
// ---------------------------------------------------------------------------

router.get('/activity-log/export', authorization('admin'), activityLogCtrl.exportLogs);
router.get('/activity-log',        authorization('admin', 'manager'), activityLogCtrl.listLogs);

// ---------------------------------------------------------------------------
// Vendors — Phase 4
// Note: /vendors/stats must be declared before /vendors/:id
// ---------------------------------------------------------------------------

if (vendorCtrl) {
  /**
   * @swagger
   * /api/v1/admin/vendors:
   *   get:
   *     summary: List all vendors
   *     tags: [Admin Vendors]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Vendor list
   */
  router.get('/vendors/stats',                          vendorCtrl.getVendorStats);
  router.get('/vendors',                                vendorCtrl.listVendors);
  router.get('/vendors/:id',                            vendorCtrl.getVendorById);
  router.get('/vendors/:id/products',                   vendorCtrl.getVendorProducts);
  router.get('/vendors/:id/orders',                     vendorCtrl.getVendorOrders);
  router.get('/vendors/:id/payouts',                    vendorCtrl.getVendorPayouts);

  /**
   * @swagger
   * /api/v1/admin/vendors/{id}/approve:
   *   patch:
   *     summary: Approve vendor application
   *     tags: [Admin Vendors]
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
   *         description: Vendor approved
   */
  router.patch('/vendors/:id/approve',                  authorization('admin', 'manager'), logActivity('status-change', 'vendor'), vendorCtrl.approveVendor);
  router.patch('/vendors/:id/reject',                   authorization('admin', 'manager'), logActivity('status-change', 'vendor'), vendorCtrl.rejectVendor);
  router.patch('/vendors/:id/suspend',                  authorization('admin', 'manager'), logActivity('status-change', 'vendor'), vendorCtrl.suspendVendor);
  router.patch('/vendors/:id/commission',               authorization('admin', 'manager'), logActivity('update', 'vendor'), vendorCtrl.updateCommission);
  router.post('/vendors/:id/payouts/:payoutId/process', authorization('admin', 'manager'), vendorCtrl.processPayout);
}

// ---------------------------------------------------------------------------
// Coupons — CMS Phase 2
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/admin/coupons:
 *   get:
 *     summary: List all coupons
 *     tags: [Admin CMS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon list
 *   post:
 *     summary: Create coupon
 *     tags: [Admin CMS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Coupon created
 *       422:
 *         description: Validation error
 */
router.get('/coupons',          cmsCtrl.listCoupons);
router.get('/coupons/:id',      cmsCtrl.getCoupon);
router.post('/coupons',         authorization('admin', 'manager'), validate(v.createCoupon), logActivity('create', 'coupon'), cmsCtrl.createCoupon);
router.patch('/coupons/:id',    authorization('admin', 'manager'), validate(v.updateCoupon), logActivity('update', 'coupon'), cmsCtrl.updateCoupon);
router.delete('/coupons/:id',   authorization('admin', 'manager'), logActivity('delete', 'coupon'), cmsCtrl.deleteCoupon);

// ---------------------------------------------------------------------------
// Chatbot — Phase 4
// Read-only endpoints for the CRM analytics page.
// ---------------------------------------------------------------------------
router.get('/chat/sessions',    authorization('admin', 'manager'), chatbotAdminCtrl.listSessions);
router.get('/chat/analytics',   authorization('admin', 'manager'), chatbotAdminCtrl.getAnalytics);

module.exports = router;
