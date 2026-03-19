'use strict';

/**
 * Store routes — v1  (public, no authentication required)
 *
 * Mounts product, category, brand, coupon sub-groups and CMS stubs.
 * Specific routes (e.g. /products/offer) must be declared BEFORE the
 * parameterised route (/products/:id) to avoid Express matching them as IDs.
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../../../controller/v1/store.controller');
const respond = require('../../../utils/respond');

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// Static / query-based product routes — must precede /:id
router.get('/products/offer',        ctrl.getOfferProducts);
router.get('/products/top-rated',    ctrl.getTopRatedProducts);
router.get('/products/popular/:type', ctrl.getPopularProductByType);
router.get('/products/type/:type',   ctrl.getProductsByType);

// Parameterised product routes
router.get('/products/:id/related',  ctrl.getRelatedProducts);
router.get('/products/:id',          ctrl.getProduct);
router.get('/products',              ctrl.getAllProducts);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

// Static category routes before /:id
router.get('/categories/show/:type', ctrl.getCategoriesByType);
router.get('/categories/show',       ctrl.getShowCategories);
router.get('/categories/:id',        ctrl.getSingleCategory);
router.get('/categories',            ctrl.getAllCategories);

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

// Static brand routes before /:id
router.get('/brands/active', ctrl.getActiveBrands);
router.get('/brands/:id',    ctrl.getSingleBrand);
router.get('/brands',        ctrl.getAllBrands);

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

router.get('/coupons/:id', ctrl.getCouponById);
router.get('/coupons',     ctrl.getAllCoupons);

// ---------------------------------------------------------------------------
// Reviews — stub (Phase 3)
// ---------------------------------------------------------------------------

router.get('/reviews', NOT_IMPLEMENTED);

// ---------------------------------------------------------------------------
// CMS stubs — Phase 2
// ---------------------------------------------------------------------------

router.get('/pages/:slug',      NOT_IMPLEMENTED);
router.get('/menus/:location',  NOT_IMPLEMENTED);
router.get('/banners',          NOT_IMPLEMENTED);
router.get('/blog',             NOT_IMPLEMENTED);
router.get('/blog/:slug',       NOT_IMPLEMENTED);
router.get('/settings/public',  NOT_IMPLEMENTED);

module.exports = router;
