'use strict';

/**
 * Store controller — v1
 *
 * Thin wrappers around existing service / controller functions.
 * All responses are normalised through the respond utility.
 * Business logic lives in the original services — do not duplicate it here.
 */

const respond = require('../../utils/respond');
const productServices = require('../../services/product.service');
const Product = require('../../model/Products');
const categoryServices = require('../../services/category.service');
const brandService = require('../../services/brand.service');
const Brand = require('../../model/Brand');
const Coupon = require('../../model/Coupon');

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/products
 * Returns all products (non-paginated, mirrors legacy /api/product/all).
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const data = await productServices.getAllProductsService();
    return respond.success(res, data, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'reviews',
      populate: { path: 'userId', select: 'name email imageURL' },
    });
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    return respond.success(res, product, 'Product retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/type/:type
 * Accepts the same query params as the legacy endpoint (new, featured, topSellers).
 */
exports.getProductsByType = async (req, res, next) => {
  try {
    const data = await productServices.getProductTypeService(req);
    return respond.success(res, data, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/offer
 * Query param: type
 */
exports.getOfferProducts = async (req, res, next) => {
  try {
    const data = await productServices.getOfferTimerProductService(req.query.type);
    return respond.success(res, data, 'Offer products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/popular/:type
 */
exports.getPopularProductByType = async (req, res, next) => {
  try {
    const data = await productServices.getPopularProductServiceByType(req.params.type);
    return respond.success(res, data, 'Popular products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/top-rated
 */
exports.getTopRatedProducts = async (req, res, next) => {
  try {
    const data = await productServices.getTopRatedProductService();
    return respond.success(res, data, 'Top-rated products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/:id/related
 */
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const data = await productServices.getRelatedProductService(req.params.id);
    return respond.success(res, data, 'Related products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const data = await categoryServices.getAllCategoryServices();
    return respond.success(res, data, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/categories/show
 */
exports.getShowCategories = async (req, res, next) => {
  try {
    const data = await categoryServices.getShowCategoryServices();
    return respond.success(res, data, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/categories/show/:type
 */
exports.getCategoriesByType = async (req, res, next) => {
  try {
    const data = await categoryServices.getCategoryTypeService(req.params.type);
    return respond.success(res, data, 'Categories retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/categories/:id
 */
exports.getSingleCategory = async (req, res, next) => {
  try {
    const data = await categoryServices.getSingleCategoryService(req.params.id);
    if (!data) {
      return respond.notFound(res, 'CATEGORY_NOT_FOUND', 'Category not found');
    }
    return respond.success(res, data, 'Category retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/brands
 */
exports.getAllBrands = async (req, res, next) => {
  try {
    const data = await Brand.find({}, { name: 1, email: 1, logo: 1, website: 1, location: 1 });
    return respond.success(res, data, 'Brands retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/brands/active
 */
exports.getActiveBrands = async (req, res, next) => {
  try {
    const data = await brandService.getBrandsService();
    return respond.success(res, data, 'Active brands retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/brands/:id
 */
exports.getSingleBrand = async (req, res, next) => {
  try {
    const data = await brandService.getSingleBrandService(req.params.id);
    if (!data) {
      return respond.notFound(res, 'BRAND_NOT_FOUND', 'Brand not found');
    }
    return respond.success(res, data, 'Brand retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/coupons
 */
exports.getAllCoupons = async (req, res, next) => {
  try {
    const data = await Coupon.find({}).sort({ _id: -1 });
    return respond.success(res, data, 'Coupons retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/coupons/:id
 */
exports.getCouponById = async (req, res, next) => {
  try {
    const data = await Coupon.findById(req.params.id);
    if (!data) {
      return respond.notFound(res, 'COUPON_NOT_FOUND', 'Coupon not found');
    }
    return respond.success(res, data, 'Coupon retrieved successfully');
  } catch (err) {
    next(err);
  }
};
