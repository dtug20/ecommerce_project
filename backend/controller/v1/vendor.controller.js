'use strict';

/**
 * Vendor controller — v1
 *
 * Handles all vendor self-service endpoints. Authentication and vendor-role
 * authorization are applied at the route level (v1 index) before these
 * handlers are invoked.
 */

const mongoose = require('mongoose');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');
const User = require('../../model/User');
const Product = require('../../model/Products');
const Category = require('../../model/Category');
const Brand = require('../../model/Brand');
const Order = require('../../model/Order');
const Payout = require('../../model/Payout');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a URL-safe slug from a string.
 * @param {string} title
 * @returns {string}
 */
const toSlug = (title) =>
  title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Validate that variant SKUs are unique within a product.
 * @param {Array} variants
 * @returns {string|null} Error message or null if valid.
 */
const validateVariantSkus = (variants) => {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const skus = variants.map((v) => v.sku).filter(Boolean);
  const uniqueSkus = new Set(skus);
  if (uniqueSkus.size !== skus.length) {
    return 'Variant SKUs must be unique within the product';
  }
  return null;
};

/**
 * Build a date range $match filter based on a period query param.
 * @param {string} period  '7d' | '30d' | '90d' | '1y'
 * @returns {object|null}
 */
const buildPeriodFilter = (period) => {
  const now = new Date();
  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  const days = periodMap[period];
  if (!days) return null;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { $gte: start };
};

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/vendor/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name email phone imageURL vendorProfile createdAt'
    );
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'Vendor not found');
    }
    return respond.success(res, user, 'Vendor profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/vendor/profile
 * Allowed fields: storeName, storeSlug, storeDescription, storeLogo, storeBanner.
 * commissionRate is managed by admins only.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { storeName, storeSlug, storeDescription, storeLogo, storeBanner } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'Vendor not found');
    }

    if (!user.vendorProfile) {
      user.vendorProfile = {};
    }

    if (storeName !== undefined) user.vendorProfile.storeName = storeName;
    if (storeDescription !== undefined) user.vendorProfile.storeDescription = storeDescription;
    if (storeLogo !== undefined) user.vendorProfile.storeLogo = storeLogo;
    if (storeBanner !== undefined) user.vendorProfile.storeBanner = storeBanner;

    // Auto-generate slug from storeName if storeSlug not explicitly provided
    if (storeSlug !== undefined) {
      user.vendorProfile.storeSlug = toSlug(storeSlug);
    } else if (storeName !== undefined) {
      user.vendorProfile.storeSlug = toSlug(storeName);
    }

    await user.save();

    return respond.success(res, user, 'Vendor profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/vendor/products
 * Paginated list of the vendor's own products.
 * Query filters: status, category (by category.name), search (title regex)
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const q = req.query;
    const vendorId = new mongoose.Types.ObjectId(req.user._id);

    const filter = { vendor: vendorId };

    if (q.status) filter.status = q.status;
    if (q.category) filter['category.name'] = { $regex: q.category, $options: 'i' };
    if (q.search) filter.title = { $regex: q.search, $options: 'i' };

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-reviews'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vendor/products/:id
 * Returns a single product. Enforces vendor ownership.
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    if (product.vendor?.toString() !== req.user._id.toString()) {
      return respond.forbidden(res, 'FORBIDDEN', 'You do not own this product');
    }
    return respond.success(res, product, 'Product retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/vendor/products
 * Create a product belonging to this vendor.
 */
exports.createProduct = async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Force vendor assignment — cannot be overridden
    body.vendor = req.user._id;

    // Auto-generate slug from title
    if (body.title && !body.slug) {
      body.slug = toSlug(body.title);
    }

    // Validate variant SKU uniqueness
    if (body.variants) {
      const skuError = validateVariantSkus(body.variants);
      if (skuError) {
        return respond.error(res, 'INVALID_VARIANTS', skuError, 400);
      }
    }

    const product = await Product.create(body);

    // Push product ref to category and brand arrays
    if (product.category?.id) {
      await Category.findByIdAndUpdate(product.category.id, {
        $push: { products: product._id },
      });
    }
    if (product.brand?.id) {
      await Brand.findByIdAndUpdate(product.brand.id, {
        $push: { products: product._id },
      });
    }

    if (global.io) global.io.emit('product:created', { product });

    return respond.created(res, product, 'Product created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/vendor/products/:id
 * Update a product. Enforces ownership. Vendor field cannot be changed.
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    if (product.vendor?.toString() !== req.user._id.toString()) {
      return respond.forbidden(res, 'FORBIDDEN', 'You do not own this product');
    }

    const body = { ...req.body };

    // Prevent vendor field from being changed
    delete body.vendor;

    // Auto-generate slug from title if title changed
    if (body.title && !body.slug) {
      body.slug = toSlug(body.title);
    }

    // Validate variant SKU uniqueness
    if (body.variants) {
      const skuError = validateVariantSkus(body.variants);
      if (skuError) {
        return respond.error(res, 'INVALID_VARIANTS', skuError, 400);
      }
    }

    // Handle category change — sync category.products arrays
    const oldCatId = product.category?.id?.toString();
    const newCatId = body.category?.id;
    if (newCatId && oldCatId && newCatId.toString() !== oldCatId) {
      await Promise.all([
        Category.findByIdAndUpdate(oldCatId, { $pull: { products: product._id } }),
        Category.findByIdAndUpdate(newCatId, { $push: { products: product._id } }),
      ]);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (global.io) global.io.emit('product:updated', { product: updated });

    return respond.success(res, updated, 'Product updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/vendor/products/:id
 * Soft-delete: sets status to 'discontinued'. Blocks if pending orders exist.
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    if (product.vendor?.toString() !== req.user._id.toString()) {
      return respond.forbidden(res, 'FORBIDDEN', 'You do not own this product');
    }

    // Check for active orders containing this product
    const activeOrder = await Order.findOne({
      'items.product': product._id,
      status: { $in: ['pending', 'processing', 'shipped'] },
    }).lean();

    if (activeOrder) {
      return respond.error(
        res,
        'PRODUCT_HAS_ACTIVE_ORDERS',
        'Cannot delete a product with pending, processing, or shipped orders',
        409
      );
    }

    // Soft delete — mark as discontinued
    product.status = 'discontinued';
    await product.save();

    if (global.io) global.io.emit('product:updated', { product });

    return respond.success(res, { _id: product._id, status: product.status }, 'Product discontinued successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/vendor/orders
 * Returns orders that include at least one item belonging to this vendor.
 * Falls back to checking legacy cart items' product ownership when items[] is empty.
 * Filters: status, startDate, endDate
 */
exports.getOrders = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const q = req.query;
    const vendorId = new mongoose.Types.ObjectId(req.user._id);

    const matchFilter = { 'items.vendor': vendorId };

    if (q.status) matchFilter.status = q.status;
    if (q.startDate || q.endDate) {
      matchFilter.createdAt = {};
      if (q.startDate) matchFilter.createdAt.$gte = new Date(q.startDate);
      if (q.endDate) matchFilter.createdAt.$lte = new Date(q.endDate);
    }

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Order.countDocuments(matchFilter),
      Order.find(matchFilter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('name address email contact city country status paymentMethod totalAmount createdAt items statusHistory trackingNumber carrier')
        .lean(),
    ]);

    // Filter each order's items to only show this vendor's items
    const filtered = data.map((order) => ({
      ...order,
      items: order.items.filter(
        (item) => item.vendor && item.vendor.toString() === vendorId.toString()
      ),
    }));

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, filtered, pagination, 'Orders retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vendor/orders/:id
 * Returns a single order with items filtered to only show this vendor's items.
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const vendorId = req.user._id.toString();

    const order = await Order.findOne({
      _id: req.params.id,
      'items.vendor': new mongoose.Types.ObjectId(vendorId),
    }).lean();

    if (!order) {
      return respond.notFound(res, 'ORDER_NOT_FOUND', 'Order not found');
    }

    // Redact other vendors' items
    order.items = order.items.filter(
      (item) => item.vendor && item.vendor.toString() === vendorId
    );

    return respond.success(res, order, 'Order retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/vendor/orders/:orderId/items/:itemId/status
 * Update the fulfillmentStatus of a specific order item owned by this vendor.
 * Body: { fulfillmentStatus: 'pending'|'packed'|'shipped'|'delivered' }
 */
exports.updateItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { fulfillmentStatus } = req.body;
    const vendorId = req.user._id.toString();

    const allowedStatuses = ['pending', 'packed', 'shipped', 'delivered'];
    if (!fulfillmentStatus || !allowedStatuses.includes(fulfillmentStatus)) {
      return respond.error(
        res,
        'INVALID_STATUS',
        `fulfillmentStatus must be one of: ${allowedStatuses.join(', ')}`,
        400
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return respond.notFound(res, 'ORDER_NOT_FOUND', 'Order not found');
    }

    const item = order.items.id(itemId);
    if (!item) {
      return respond.notFound(res, 'ITEM_NOT_FOUND', 'Order item not found');
    }

    if (!item.vendor || item.vendor.toString() !== vendorId) {
      return respond.forbidden(res, 'FORBIDDEN', 'You do not own this order item');
    }

    item.fulfillmentStatus = fulfillmentStatus;
    await order.save();

    if (global.io) {
      global.io.emit('order:item:updated', {
        orderId,
        itemId,
        fulfillmentStatus,
        vendorId,
      });
    }

    return respond.success(res, { orderId, itemId, fulfillmentStatus }, 'Item status updated successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/vendor/analytics/summary
 * Aggregated summary for the vendor's store.
 * Query: ?period=7d|30d|90d|1y
 */
exports.getSummary = async (req, res, next) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user._id);
    const { period } = req.query;

    const dateFilter = buildPeriodFilter(period);
    const createdAtFilter = dateFilter ? { createdAt: dateFilter } : {};

    // Aggregate revenue from delivered orders with this vendor's items
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          'items.vendor': vendorId,
          ...createdAtFilter,
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.subtotal' },
          orderIds: { $addToSet: '$_id' },
        },
      },
    ]);

    // Count distinct orders (any status) containing this vendor's items
    const orderCountAgg = await Order.aggregate([
      {
        $match: {
          'items.vendor': vendorId,
          ...createdAtFilter,
        },
      },
      { $count: 'count' },
    ]);

    // Count pending items
    const pendingItemsAgg = await Order.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'processing'] },
          'items.vendor': vendorId,
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.vendor': vendorId,
          'items.fulfillmentStatus': { $in: ['pending', 'packed'] },
        },
      },
      { $count: 'count' },
    ]);

    // Top product by sellCount
    const topProductAgg = await Product.findOne({ vendor: vendorId })
      .sort({ sellCount: -1 })
      .select('title sellCount img price');

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const orderCount = orderCountAgg[0]?.count || 0;
    const pendingItems = pendingItemsAgg[0]?.count || 0;

    return respond.success(
      res,
      {
        totalRevenue,
        orderCount,
        pendingItems,
        topProduct: topProductAgg || null,
        period: period || 'all-time',
      },
      'Vendor analytics summary retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vendor/analytics/revenue
 * Revenue grouped by day/week/month.
 * Query: ?startDate=&endDate=&groupBy=day|week|month
 */
exports.getRevenue = async (req, res, next) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user._id);
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchFilter = {
      status: 'delivered',
      'items.vendor': vendorId,
    };

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const dateFormatMap = {
      day: '%Y-%m-%d',
      week: '%Y-%U',
      month: '%Y-%m',
    };

    const dateFormat = dateFormatMap[groupBy] || '%Y-%m-%d';

    const revenueData = await Order.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$items.subtotal' },
          orderCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          orderCount: { $size: '$orderCount' },
        },
      },
      { $sort: { period: 1 } },
    ]);

    return respond.success(res, revenueData, 'Revenue data retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vendor/analytics/top-products
 * Top 10 vendor products by revenue or sellCount.
 * Query: ?sortBy=revenue|sellCount
 */
exports.getTopProducts = async (req, res, next) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.user._id);
    const { sortBy = 'revenue' } = req.query;

    if (sortBy === 'sellCount') {
      // Use Product.sellCount directly
      const products = await Product.find({ vendor: vendorId })
        .sort({ sellCount: -1 })
        .limit(10)
        .select('title img price sellCount status');

      return respond.success(res, products, 'Top products retrieved successfully');
    }

    // Sort by revenue — aggregate from delivered order items
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          'items.vendor': vendorId,
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: '$items.subtotal' },
          quantitySold: { $sum: '$items.quantity' },
          title: { $first: '$items.title' },
          image: { $first: '$items.image' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          productId: '$_id',
          _id: 0,
          title: 1,
          image: 1,
          revenue: 1,
          quantitySold: 1,
        },
      },
    ]);

    return respond.success(res, topProducts, 'Top products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/vendor/payouts
 * Paginated list of the vendor's payout history.
 * Filter: ?status=pending|processing|paid|rejected
 */
exports.getPayouts = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const vendorId = new mongoose.Types.ObjectId(req.user._id);

    const filter = { vendor: vendorId };
    if (req.query.status) filter.status = req.query.status;

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Payout.countDocuments(filter),
      Payout.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Payouts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/vendor/payouts/:id
 * Single payout. Enforces ownership.
 */
exports.getPayoutById = async (req, res, next) => {
  try {
    const payout = await Payout.findById(req.params.id).populate('processedBy', 'name email');
    if (!payout) {
      return respond.notFound(res, 'PAYOUT_NOT_FOUND', 'Payout not found');
    }
    if (payout.vendor.toString() !== req.user._id.toString()) {
      return respond.forbidden(res, 'FORBIDDEN', 'You do not own this payout record');
    }
    return respond.success(res, payout, 'Payout retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/vendor/payouts/request
 * Request a payout. Validates requested amount against available balance.
 * Body: { amount, bankDetails }
 */
exports.requestPayout = async (req, res, next) => {
  try {
    const { amount, bankDetails } = req.body;
    const vendorId = new mongoose.Types.ObjectId(req.user._id);

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return respond.error(res, 'INVALID_AMOUNT', 'amount must be a positive number', 400);
    }

    // Total revenue from delivered orders
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'delivered', 'items.vendor': vendorId } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendorId } },
      { $group: { _id: null, total: { $sum: '$items.subtotal' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Total already paid or in-flight payouts
    const paidPayoutsAgg = await Payout.aggregate([
      {
        $match: {
          vendor: vendorId,
          status: { $in: ['pending', 'processing', 'paid'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalPaidOut = paidPayoutsAgg[0]?.total || 0;

    const availableBalance = totalRevenue - totalPaidOut;

    if (amount > availableBalance) {
      return respond.error(
        res,
        'INSUFFICIENT_BALANCE',
        `Requested amount exceeds available balance of ${availableBalance.toFixed(2)}`,
        400,
        { availableBalance }
      );
    }

    // Retrieve vendor's bank info as a snapshot
    const user = await User.findById(vendorId).select('vendorProfile.bankInfo');
    const bankDetailsSnapshot = bankDetails || user?.vendorProfile?.bankInfo || null;

    const payout = await Payout.create({
      vendor: vendorId,
      amount,
      bankDetails: bankDetailsSnapshot,
      status: 'pending',
      requestedAt: new Date(),
    });

    if (global.io) {
      global.io.emit('payout:requested', { payout });
    }

    return respond.created(res, payout, 'Payout request submitted successfully');
  } catch (err) {
    next(err);
  }
};
