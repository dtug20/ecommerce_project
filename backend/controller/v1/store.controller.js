'use strict';

/**
 * Store controller — v1
 *
 * Thin wrappers around existing service / controller functions.
 * All responses are normalised through the respond utility.
 * Business logic lives in the original services — do not duplicate it here.
 */

const mongoose = require('mongoose');
const respond = require('../../utils/respond');
const productServices = require('../../services/product.service');
const Product = require('../../model/Products');
const categoryServices = require('../../services/category.service');
const brandService = require('../../services/brand.service');
const Brand = require('../../model/Brand');
const User = require('../../model/User');
const Coupon = require('../../model/Coupon');
const Reviews = require('../../model/Review');
const Order = require('../../model/Order');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/products
 * Server-side filtered, paginated product list.
 *
 * Supported query params:
 *   page, limit, sortBy, sortOrder,
 *   category, brand, minPrice, maxPrice,
 *   color, size, productType, vendor,
 *   featured, status, search, tag
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const q = req.query;
    const filter = {};

    // category — try ObjectId match first, fall back to case-insensitive parent name
    if (q.category) {
      if (mongoose.Types.ObjectId.isValid(q.category)) {
        filter['category.id'] = new mongoose.Types.ObjectId(q.category);
      } else {
        filter['parent'] = { $regex: q.category, $options: 'i' };
      }
    }

    // brand — try ObjectId match first, fall back to case-insensitive brand name
    if (q.brand) {
      if (mongoose.Types.ObjectId.isValid(q.brand)) {
        filter['brand.id'] = new mongoose.Types.ObjectId(q.brand);
      } else {
        filter['brand.name'] = { $regex: q.brand, $options: 'i' };
      }
    }

    // price range
    if (q.minPrice || q.maxPrice) {
      filter.price = {};
      if (q.minPrice) filter.price.$gte = parseFloat(q.minPrice);
      if (q.maxPrice) filter.price.$lte = parseFloat(q.maxPrice);
    }

    // color — match against imageURLs color name
    if (q.color) {
      filter['imageURLs.color.name'] = { $regex: q.color, $options: 'i' };
    }

    // size
    if (q.size) {
      filter.sizes = q.size;
    }

    // productType — case-insensitive
    if (q.productType) {
      filter.productType = { $regex: `^${q.productType}$`, $options: 'i' };
    }

    // vendor
    if (q.vendor && mongoose.Types.ObjectId.isValid(q.vendor)) {
      filter.vendor = new mongoose.Types.ObjectId(q.vendor);
    }

    // featured
    if (q.featured === 'true') {
      filter.featured = true;
    }

    // status
    if (q.status) {
      filter.status = q.status;
    }

    // text search
    if (q.search) {
      filter.$text = { $search: q.search };
    }

    // tag
    if (q.tag) {
      filter.tags = q.tag;
    }

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'reviews',
          populate: { path: 'userId', select: 'name' },
        })
        .populate('vendor', 'name vendorProfile.storeName vendorProfile.storeSlug'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/search
 * Full-text search with score-based ranking.
 * Query params: q (search term), page, limit
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const searchTerm = req.query.q || '';
    if (!searchTerm.trim()) {
      return respond.error(res, 'MISSING_QUERY', 'Search term (q) is required', 400);
    }

    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { $text: { $search: searchTerm } };

    const [totalItems, data] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Search results retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/products/:id
 * Returns full product detail including variants, seo, shipping fields,
 * plus review stats (avg rating and count from approved reviews only).
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'reviews',
        match: { status: 'approved' },
        populate: { path: 'userId', select: 'name imageURL' },
      })
      .populate('vendor', 'name vendorProfile.storeName vendorProfile.storeSlug');
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    // Review stats: avg rating + count (approved only)
    const reviewStats = await Reviews.aggregate([
      { $match: { productId: product._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const stats = reviewStats[0]
      ? {
          avgRating: parseFloat(reviewStats[0].avgRating.toFixed(1)),
          totalReviews: reviewStats[0].totalReviews,
        }
      : { avgRating: 0, totalReviews: 0 };

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
      reviewStats: stats,
    });
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
 * Supports ?showOnCheckout=true and ?showOnProductPage=true display rule filters.
 */
exports.getAllCoupons = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.showOnCheckout === 'true') {
      filter['displayRules.showOnCheckout'] = true;
    }
    if (req.query.showOnProductPage === 'true') {
      filter['displayRules.showOnProductPage'] = true;
    }
    if (req.query.showOnBanner === 'true') {
      filter['displayRules.showOnBanner'] = true;
    }

    // Only return active coupons to storefront
    filter.status = 'active';

    const data = await Coupon.find(filter).sort({ _id: -1 });
    return respond.success(res, data, 'Coupons retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/store/coupons/validate
 *
 * Body:
 *   couponCode   {string}   required
 *   orderAmount  {number}   required — subtotal of the cart
 *   productType  {string}   optional — product type of items in cart
 *   productIds   {string[]} optional — product IDs in cart
 *   categoryIds  {string[]} optional — category IDs of cart items
 *   userId       {string}   optional — authenticated user's ID for per-user limit check
 *
 * Returns:
 *   { valid: true, discountPercentage, discountAmount }  or
 *   { valid: false, reason: '<CODE>' }
 */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { couponCode, orderAmount, productType, productIds = [], categoryIds = [], userId } = req.body;

    if (!couponCode) {
      return respond.error(res, 'MISSING_COUPON_CODE', 'couponCode is required', 400);
    }
    if (orderAmount === undefined || orderAmount === null) {
      return respond.error(res, 'MISSING_ORDER_AMOUNT', 'orderAmount is required', 400);
    }

    // 1. Find coupon (case-insensitive)
    const coupon = await Coupon.findOne({
      couponCode: { $regex: `^${couponCode}$`, $options: 'i' },
    });

    if (!coupon) {
      return respond.success(res, { valid: false, reason: 'COUPON_NOT_FOUND' }, 'Coupon not found');
    }

    // 2. Status check
    if (coupon.status !== 'active') {
      return respond.success(res, { valid: false, reason: 'COUPON_INACTIVE' }, 'Coupon is inactive');
    }

    const now = new Date();

    // 3. Date range check
    if (coupon.startTime && now < coupon.startTime) {
      return respond.success(res, { valid: false, reason: 'COUPON_NOT_STARTED' }, 'Coupon has not started yet');
    }
    if (coupon.endTime && now > coupon.endTime) {
      return respond.success(res, { valid: false, reason: 'COUPON_EXPIRED' }, 'Coupon has expired');
    }

    // 4. Minimum amount check
    if (orderAmount < coupon.minimumAmount) {
      return respond.success(
        res,
        { valid: false, reason: 'MIN_AMOUNT_NOT_MET', minimumAmount: coupon.minimumAmount },
        'Minimum order amount not met'
      );
    }

    // 5. Product type check
    if (coupon.productType && productType) {
      if (coupon.productType.toLowerCase() !== productType.toLowerCase()) {
        return respond.success(
          res,
          { valid: false, reason: 'PRODUCT_TYPE_MISMATCH' },
          'Coupon not valid for this product type'
        );
      }
    }

    // 6. Usage limit check
    if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
      return respond.success(
        res,
        { valid: false, reason: 'USAGE_LIMIT_REACHED' },
        'Coupon usage limit has been reached'
      );
    }

    // 7. Per-user limit check
    if (userId && coupon.perUserLimit != null) {
      const userUsageCount = coupon.usedBy.filter(
        (u) => u.userId.toString() === userId.toString()
      ).length;

      if (userUsageCount >= coupon.perUserLimit) {
        return respond.success(
          res,
          { valid: false, reason: 'PER_USER_LIMIT_REACHED' },
          'You have already used this coupon the maximum number of times'
        );
      }
    }

    // 8. Applicable products check (if coupon restricts to specific products)
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      const applicableIds = coupon.applicableProducts.map((id) => id.toString());
      const hasMatch = productIds.some((pid) => applicableIds.includes(pid.toString()));
      if (!hasMatch) {
        return respond.success(
          res,
          { valid: false, reason: 'NO_APPLICABLE_PRODUCTS' },
          'Coupon is not valid for any products in your cart'
        );
      }
    }

    // 9. Applicable categories check
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const applicableCatIds = coupon.applicableCategories.map((id) => id.toString());
      const hasCatMatch = categoryIds.some((cid) => applicableCatIds.includes(cid.toString()));
      if (!hasCatMatch) {
        return respond.success(
          res,
          { valid: false, reason: 'NO_APPLICABLE_CATEGORIES' },
          'Coupon is not valid for any categories in your cart'
        );
      }
    }

    // 10. Excluded products check
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      const excludedIds = coupon.excludedProducts.map((id) => id.toString());
      const hasExcluded = productIds.some((pid) => excludedIds.includes(pid.toString()));
      if (hasExcluded) {
        return respond.success(
          res,
          { valid: false, reason: 'EXCLUDED_PRODUCT_IN_CART' },
          'Your cart contains a product excluded from this coupon'
        );
      }
    }

    // All checks passed — calculate discount
    const discountAmount = parseFloat(
      ((orderAmount * coupon.discountPercentage) / 100).toFixed(2)
    );

    return respond.success(
      res,
      {
        valid: true,
        discountPercentage: coupon.discountPercentage,
        discountAmount,
        couponCode: coupon.couponCode,
        title: coupon.title,
      },
      'Coupon is valid'
    );
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

// ---------------------------------------------------------------------------
// Vendors (public storefront)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/store/vendors
 * Paginated list of approved vendors with public store info.
 */
exports.listVendors = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);

    const filter = {
      role: 'vendor',
      'vendorProfile.verificationStatus': 'approved',
    };

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, vendors] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('name vendorProfile.storeName vendorProfile.storeSlug vendorProfile.storeLogo vendorProfile.storeDescription createdAt')
        .lean(),
    ]);

    // Attach product count for each vendor
    const vendorIds = vendors.map((v) => v._id);
    const productCounts = await Product.aggregate([
      { $match: { vendor: { $in: vendorIds } } },
      { $group: { _id: '$vendor', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const entry of productCounts) {
      countMap[entry._id.toString()] = entry.count;
    }

    const enriched = vendors.map((v) => ({
      ...v,
      productCount: countMap[v._id.toString()] || 0,
    }));

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, enriched, pagination, 'Vendors retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/store/vendors/:slug
 * Public vendor store page by storeSlug.
 */
exports.getVendorBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const vendor = await User.findOne({
      'vendorProfile.storeSlug': slug,
      'vendorProfile.verificationStatus': 'approved',
    })
      .select('name vendorProfile.storeName vendorProfile.storeSlug vendorProfile.storeLogo vendorProfile.storeBanner vendorProfile.storeDescription createdAt')
      .lean();

    if (!vendor) {
      return respond.notFound(res, 'VENDOR_NOT_FOUND', 'Vendor store not found');
    }

    // Aggregate product count and average rating from approved reviews
    const vendorId = new mongoose.Types.ObjectId(vendor._id);

    const [productCount, ratingAgg] = await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Product.aggregate([
        { $match: { vendor: vendorId } },
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'productId', as: 'reviews' } },
        { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },
        { $match: { $or: [{ 'reviews.status': 'approved' }, { reviews: null }] } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$reviews.rating' },
            totalReviews: {
              $sum: { $cond: [{ $ifNull: ['$reviews._id', false] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const avgRating = ratingAgg[0]?.avgRating
      ? parseFloat(ratingAgg[0].avgRating.toFixed(1))
      : 0;
    const totalReviews = ratingAgg[0]?.totalReviews || 0;

    return respond.success(
      res,
      {
        vendor: {
          ...vendor,
          memberSince: vendor.createdAt,
        },
        stats: {
          productCount,
          avgRating,
          totalReviews,
        },
      },
      'Vendor store retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Order Tracking (public)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/store/orders/track
 * Public endpoint — look up an order by ID + billing email.
 */
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId, email } = req.body;

    // Build query: try invoice (numeric), then ObjectId, then orderNumber
    const query = { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };

    const trimmed = orderId.trim();
    if (/^\d+$/.test(trimmed)) {
      query.invoice = Number(trimmed);
    } else if (mongoose.Types.ObjectId.isValid(trimmed)) {
      query._id = trimmed;
    } else {
      query.orderNumber = trimmed;
    }

    const safeFields = 'invoice orderNumber status statusHistory trackingNumber carrier trackingUrl estimatedDelivery createdAt shippedAt deliveredAt totalAmount paymentMethod name';

    const order = await Order.findOne(query).select(safeFields).lean();

    if (!order) {
      return respond.error(res, 'NOT_FOUND', 'No order found matching this ID and email.', 404);
    }

    // Get item count without loading full cart/items arrays
    const countResult = await Order.aggregate([
      { $match: { _id: order._id } },
      { $project: { count: { $max: [{ $size: { $ifNull: ['$items', []] } }, { $size: { $ifNull: ['$cart', []] } }] } } },
    ]);
    const itemCount = countResult[0]?.count || 0;

    return respond.success(res, { ...order, itemCount }, 'Order found');
  } catch (err) {
    next(err);
  }
};
