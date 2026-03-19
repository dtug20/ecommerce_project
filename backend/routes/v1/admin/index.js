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
// CMS stubs — Phase 2
// ---------------------------------------------------------------------------

router.get('/pages',          NOT_IMPLEMENTED);
router.post('/pages',         NOT_IMPLEMENTED);
router.patch('/pages/:id',    NOT_IMPLEMENTED);
router.delete('/pages/:id',   NOT_IMPLEMENTED);

router.get('/menus/:location',  NOT_IMPLEMENTED);
router.put('/menus/:location',  NOT_IMPLEMENTED);

router.get('/banners',          NOT_IMPLEMENTED);
router.post('/banners',         NOT_IMPLEMENTED);
router.patch('/banners/:id',    NOT_IMPLEMENTED);
router.delete('/banners/:id',   NOT_IMPLEMENTED);

router.get('/blog',             NOT_IMPLEMENTED);
router.post('/blog',            NOT_IMPLEMENTED);
router.patch('/blog/:id',       NOT_IMPLEMENTED);
router.delete('/blog/:id',      NOT_IMPLEMENTED);

router.get('/settings/:namespace',   NOT_IMPLEMENTED);
router.patch('/settings/:namespace', NOT_IMPLEMENTED);

router.get('/email-templates',       NOT_IMPLEMENTED);
router.patch('/email-templates/:id', NOT_IMPLEMENTED);

// ---------------------------------------------------------------------------
// Health — Task 10 implementation placeholder
// ---------------------------------------------------------------------------

router.get('/health', NOT_IMPLEMENTED);

module.exports = router;
