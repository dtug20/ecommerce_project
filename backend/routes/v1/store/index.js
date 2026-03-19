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
const storeCmsCtrl = require('../../../controller/v1/store-cms.controller');
const reviewCtrl = require('../../../controller/v1/review.controller');
const Category = require('../../../model/Category');
const respond = require('../../../utils/respond');

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// Static / query-based product routes — must precede /:id
router.get('/products/search',        ctrl.searchProducts);
router.get('/products/offer',         ctrl.getOfferProducts);
router.get('/products/top-rated',     ctrl.getTopRatedProducts);
router.get('/products/popular/:type', ctrl.getPopularProductByType);
router.get('/products/type/:type',    ctrl.getProductsByType);

// Parameterised product routes — /products/:id/reviews and /products/:id/related
// must be declared before /products/:id to prevent the id segment matching
router.get('/products/:productId/reviews', reviewCtrl.getApprovedProductReviews);
router.get('/products/:id/related',        ctrl.getRelatedProducts);
router.get('/products/:id',                ctrl.getProduct);
router.get('/products',                    ctrl.getAllProducts);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

// Static category routes before /:id
router.get('/categories/tree', async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'Show' })
      .select('parent children productType _id')
      .sort({ parent: 1 });

    // Build hierarchical tree grouped by parent
    const tree = categories.map((cat) => ({
      id: cat._id,
      name: cat.parent,
      productType: cat.productType,
      children: (cat.children || []).map((child) => ({
        name: child,
      })),
    }));

    return respond.success(res, tree, 'Category tree retrieved successfully');
  } catch (err) {
    next(err);
  }
});
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

// /coupons/validate must precede /coupons/:id to avoid matching 'validate' as id
router.post('/coupons/validate', ctrl.validateCoupon);
router.get('/coupons/:id',       ctrl.getCouponById);
router.get('/coupons',           ctrl.getAllCoupons);

// ---------------------------------------------------------------------------
// CMS — Phase 2
// ---------------------------------------------------------------------------

router.get('/pages/:slug',      storeCmsCtrl.getPageBySlug);
router.get('/menus/:location',  storeCmsCtrl.getMenuByLocation);
router.get('/banners',          storeCmsCtrl.getActiveBanners);

// Blog: /blog/featured must be before /blog/:slug
router.get('/blog/featured',    storeCmsCtrl.getFeaturedBlogPosts);
router.get('/blog/:slug',       storeCmsCtrl.getBlogPostBySlug);
router.get('/blog',             storeCmsCtrl.listPublishedBlogPosts);

// Public settings — replaces /settings/public stub
router.get('/settings',         storeCmsCtrl.getPublicSettings);

module.exports = router;
