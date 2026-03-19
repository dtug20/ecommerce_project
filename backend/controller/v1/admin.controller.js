'use strict';

/**
 * Admin controller — v1
 *
 * Proxies to the existing admin controllers.  No business logic lives here;
 * this layer exists solely to wire the /api/v1/admin/* routes without
 * duplicating code from the legacy controllers.
 */

const adminProductCtrl    = require('../../controller/admin.product.controller');
const adminCategoryCtrl   = require('../../controller/admin.category.controller');
const adminOrderCtrl      = require('../../controller/admin.order.controller');
const adminUserCtrl       = require('../../controller/admin.user.controller');
const adminStaffCtrl      = require('../../controller/admin.controller');
const cloudinaryCtrl      = require('../../controller/cloudinary.controller');
const userOrderCtrl       = require('../../controller/user.order.controller');

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

exports.getAllProducts   = (req, res, next) => adminProductCtrl.getAllProducts(req, res, next);
exports.getProductStats = (req, res, next) => adminProductCtrl.getProductStats(req, res, next);
exports.getProductById  = (req, res, next) => adminProductCtrl.getProductById(req, res, next);
exports.createProduct   = (req, res, next) => adminProductCtrl.createProduct(req, res, next);
exports.updateProduct   = (req, res, next) => adminProductCtrl.updateProduct(req, res, next);
exports.deleteProduct   = (req, res, next) => adminProductCtrl.deleteProduct(req, res, next);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

exports.getAllCategories   = (req, res, next) => adminCategoryCtrl.getAllCategories(req, res, next);
exports.getCategoryStats  = (req, res, next) => adminCategoryCtrl.getCategoryStats(req, res, next);
exports.getCategoryTree   = (req, res, next) => adminCategoryCtrl.getCategoryTree(req, res, next);
exports.getCategoryById   = (req, res, next) => adminCategoryCtrl.getCategoryById(req, res, next);
exports.createCategory    = (req, res, next) => adminCategoryCtrl.createCategory(req, res, next);
exports.updateCategory    = (req, res, next) => adminCategoryCtrl.updateCategory(req, res, next);
exports.deleteCategory    = (req, res, next) => adminCategoryCtrl.deleteCategory(req, res, next);

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

exports.getAllOrders       = (req, res, next) => adminOrderCtrl.getAllOrders(req, res, next);
exports.getOrderStats     = (req, res, next) => adminOrderCtrl.getOrderStats(req, res, next);
exports.getOrderById      = (req, res, next) => adminOrderCtrl.getOrderById(req, res, next);
exports.createOrder       = (req, res, next) => adminOrderCtrl.createOrder(req, res, next);
exports.updateOrder       = (req, res, next) => adminOrderCtrl.updateOrder(req, res, next);
exports.updateOrderStatus = (req, res, next) => adminOrderCtrl.updateOrderStatus(req, res, next);
exports.deleteOrder       = (req, res, next) => adminOrderCtrl.deleteOrder(req, res, next);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

exports.getAllUsers       = (req, res, next) => adminUserCtrl.getAllUsers(req, res, next);
exports.getUserStats     = (req, res, next) => adminUserCtrl.getUserStats(req, res, next);
exports.getUserById      = (req, res, next) => adminUserCtrl.getUserById(req, res, next);
exports.getUserOrders    = (req, res, next) => adminUserCtrl.getUserOrders(req, res, next);
exports.createUser       = (req, res, next) => adminUserCtrl.createUser(req, res, next);
exports.updateUser       = (req, res, next) => adminUserCtrl.updateUser(req, res, next);
exports.updateUserStatus = (req, res, next) => adminUserCtrl.updateUserStatus(req, res, next);
exports.deleteUser       = (req, res, next) => adminUserCtrl.deleteUser(req, res, next);

// ---------------------------------------------------------------------------
// Staff (admin.controller.js — Keycloak-integrated)
// ---------------------------------------------------------------------------

exports.addStaff     = (req, res, next) => adminStaffCtrl.addStaff(req, res, next);
exports.getAllStaff  = (req, res, next) => adminStaffCtrl.getAllStaff(req, res, next);
exports.getStaffById = (req, res, next) => adminStaffCtrl.getStaffById(req, res, next);
exports.updateStaff  = (req, res, next) => adminStaffCtrl.updateStaff(req, res, next);
exports.deleteStaff  = (req, res, next) => adminStaffCtrl.deleteStaff(req, res, next);
exports.updatedStatus = (req, res, next) => adminStaffCtrl.updatedStatus(req, res, next);

// ---------------------------------------------------------------------------
// Media / Cloudinary
// ---------------------------------------------------------------------------

exports.uploadImage         = (req, res, next) => cloudinaryCtrl.cloudinaryController.saveImageCloudinary(req, res, next);
exports.uploadMultipleImages = (req, res, next) => cloudinaryCtrl.cloudinaryController.addMultipleImageCloudinary(req, res, next);
exports.deleteImage         = (req, res, next) => cloudinaryCtrl.cloudinaryController.cloudinaryDeleteController(req, res, next);

// ---------------------------------------------------------------------------
// Analytics (from user.order.controller)
// ---------------------------------------------------------------------------

exports.getDashboardAmount     = (req, res, next) => userOrderCtrl.getDashboardAmount(req, res, next);
exports.getSalesReport         = (req, res, next) => userOrderCtrl.getSalesReport(req, res, next);
exports.getMostSellingCategory = (req, res, next) => userOrderCtrl.mostSellingCategory(req, res, next);
exports.getDashboardRecentOrder = (req, res, next) => userOrderCtrl.getDashboardRecentOrder(req, res, next);
