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

const { validate } = require('../../../middleware/validate');
const { trackOrder: trackOrderSchema } = require('../../../validations/order.validation');

const NOT_IMPLEMENTED = (req, res) =>
  respond.error(res, 'NOT_IMPLEMENTED', 'This endpoint is not yet implemented', 501);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/products/search:
 *   get:
 *     summary: Full-text product search
 *     tags: [Store Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/products/search',        ctrl.searchProducts);

/**
 * @swagger
 * /api/v1/store/products/offer:
 *   get:
 *     summary: Get products with active offers
 *     tags: [Store Products]
 *     responses:
 *       200:
 *         description: Offer products
 */
router.get('/products/offer',         ctrl.getOfferProducts);
router.get('/products/top-rated',     ctrl.getTopRatedProducts);
router.get('/products/popular/:type', ctrl.getPopularProductByType);
router.get('/products/type/:type',    ctrl.getProductsByType);

/**
 * @swagger
 * /api/v1/store/products/{productId}/reviews:
 *   get:
 *     summary: Get approved reviews for a product
 *     tags: [Store Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Approved reviews with rating breakdown
 */
router.get('/products/:productId/reviews', reviewCtrl.getApprovedProductReviews);
router.get('/products/:id/related',        ctrl.getRelatedProducts);

/**
 * @swagger
 * /api/v1/store/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Store Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Not found
 */
router.get('/products/:id',                ctrl.getProduct);

/**
 * @swagger
 * /api/v1/store/products:
 *   get:
 *     summary: List products with server-side filtering
 *     tags: [Store Products]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get('/products',                    ctrl.getAllProducts);

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/categories/tree:
 *   get:
 *     summary: Get hierarchical category tree
 *     tags: [Store Categories]
 *     responses:
 *       200:
 *         description: Category tree
 */
router.get('/categories/tree', async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'Show' })
      .select('parent children productType _id')
      .sort({ parent: 1 });

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

/**
 * @swagger
 * /api/v1/store/categories:
 *   get:
 *     summary: List all visible categories
 *     tags: [Store Categories]
 *     responses:
 *       200:
 *         description: Category list
 */
router.get('/categories/show/:type', ctrl.getCategoriesByType);
router.get('/categories/show',       ctrl.getShowCategories);
router.get('/categories/:id',        ctrl.getSingleCategory);
router.get('/categories',            ctrl.getAllCategories);

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/brands/active:
 *   get:
 *     summary: List active brands
 *     tags: [Store Products]
 *     responses:
 *       200:
 *         description: Active brand list
 */
router.get('/brands/active', ctrl.getActiveBrands);
router.get('/brands/:id',    ctrl.getSingleBrand);
router.get('/brands',        ctrl.getAllBrands);

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/coupons/validate:
 *   post:
 *     summary: Validate a coupon code at checkout
 *     tags: [Store Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [couponCode]
 *             properties:
 *               couponCode:
 *                 type: string
 *               orderTotal:
 *                 type: number
 *               productType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Coupon is invalid or expired
 */
router.post('/coupons/validate', ctrl.validateCoupon);
router.get('/coupons/:id',       ctrl.getCouponById);
router.get('/coupons',           ctrl.getAllCoupons);

// ---------------------------------------------------------------------------
// Vendors — Phase 4 (public storefront)
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/vendors:
 *   get:
 *     summary: List public vendor profiles
 *     tags: [Store Products]
 *     responses:
 *       200:
 *         description: Vendor list
 */
router.get('/vendors',        ctrl.listVendors);

/**
 * @swagger
 * /api/v1/store/vendors/{slug}:
 *   get:
 *     summary: Get vendor by slug
 *     tags: [Store Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor profile
 *       404:
 *         description: Not found
 */
router.get('/vendors/:slug',  ctrl.getVendorBySlug);

// ---------------------------------------------------------------------------
// Order Tracking (public)
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/orders/track:
 *   post:
 *     summary: Track an order by ID and billing email (public, no auth)
 *     tags: [Store Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, email]
 *             properties:
 *               orderId:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Order tracking info
 *       404:
 *         description: No matching order found
 */
router.post('/orders/track', validate(trackOrderSchema), ctrl.trackOrder);

// ---------------------------------------------------------------------------
// CMS — Phase 2
// ---------------------------------------------------------------------------

/**
 * @swagger
 * /api/v1/store/pages/{slug}:
 *   get:
 *     summary: Get published CMS page by slug
 *     tags: [Store CMS]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CMS page with blocks
 *       404:
 *         description: Not found
 */
router.get('/pages/:slug',      storeCmsCtrl.getPageBySlug);

/**
 * @swagger
 * /api/v1/store/menus/{location}:
 *   get:
 *     summary: Get active menu by location
 *     tags: [Store CMS]
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu with items
 */
router.get('/menus/:location',  storeCmsCtrl.getMenuByLocation);

/**
 * @swagger
 * /api/v1/store/banners:
 *   get:
 *     summary: Get active banners
 *     tags: [Store CMS]
 *     responses:
 *       200:
 *         description: Active banner list
 */
router.get('/banners',          storeCmsCtrl.getActiveBanners);

/**
 * @swagger
 * /api/v1/store/blog:
 *   get:
 *     summary: List published blog posts
 *     tags: [Store Blog]
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
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post list
 */
router.get('/blog/featured',    storeCmsCtrl.getFeaturedBlogPosts);

/**
 * @swagger
 * /api/v1/store/blog/{slug}:
 *   get:
 *     summary: Get published blog post by slug
 *     tags: [Store Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Blog post
 *       404:
 *         description: Not found
 */
router.get('/blog/:slug',       storeCmsCtrl.getBlogPostBySlug);
router.get('/blog',             storeCmsCtrl.listPublishedBlogPosts);

/**
 * @swagger
 * /api/v1/store/settings:
 *   get:
 *     summary: Get public site settings (theme, contact, social)
 *     tags: [Store CMS]
 *     responses:
 *       200:
 *         description: Public settings object
 */
router.get('/settings',         storeCmsCtrl.getPublicSettings);

module.exports = router;
