'use strict';

/**
 * Analytics controller — v1
 *
 * All endpoints are admin-only. These sit alongside the legacy analytics
 * endpoints in admin.controller.js (which still proxy to user.order.controller.js
 * for backward compatibility with the existing CRM dashboard).
 */

const dayjs = require('dayjs');
const mongoose = require('mongoose');
const Order = require('../../model/Order');
const Product = require('../../model/Products');
const User = require('../../model/User');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/dashboard
// Single request returns all KPIs via $facet (parallel aggregations).
// ---------------------------------------------------------------------------

exports.getDashboard = async (req, res, next) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();
    const yesterdayStart = dayjs().subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate();
    const monthStart = dayjs().startOf('month').toDate();
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const CANCELLED = ['cancelled', 'cancel'];

    const [orderAgg, productCounts, userCount] = await Promise.all([
      Order.aggregate([
        {
          $facet: {
            today: [
              {
                $match: {
                  createdAt: { $gte: todayStart, $lte: todayEnd },
                  status: { $nin: CANCELLED },
                },
              },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ],
            yesterday: [
              {
                $match: {
                  createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
                  status: { $nin: CANCELLED },
                },
              },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ],
            thisMonth: [
              {
                $match: {
                  createdAt: { $gte: monthStart },
                  status: { $nin: CANCELLED },
                },
              },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ],
            lastMonth: [
              {
                $match: {
                  createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                  status: { $nin: CANCELLED },
                },
              },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ],
            total: [
              { $match: { status: { $nin: CANCELLED } } },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ],
            pending: [
              { $match: { status: 'pending' } },
              { $count: 'count' },
            ],
            todayOrderCount: [
              { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
              { $count: 'count' },
            ],
          },
        },
      ]).option({ maxTimeMS: 10000 }),

      Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ status: 'out-of-stock' }),
        Product.countDocuments({ quantity: { $gt: 0, $lte: 10 } }),
      ]),

      User.countDocuments(),
    ]);

    const agg = orderAgg[0];
    const todayRevenue = agg.today[0]?.revenue || 0;
    const yesterdayRevenue = agg.yesterday[0]?.revenue || 0;
    const monthRevenue = agg.thisMonth[0]?.revenue || 0;
    const lastMonthRevenue = agg.lastMonth[0]?.revenue || 0;
    const totalRevenue = agg.total[0]?.revenue || 0;
    const pendingOrders = agg.pending[0]?.count || 0;
    const todayOrders = agg.todayOrderCount[0]?.count || 0;

    const revenueChange =
      lastMonthRevenue > 0
        ? parseFloat(
            (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
          )
        : 0;

    return respond.success(
      res,
      {
        todayRevenue,
        yesterdayRevenue,
        monthRevenue,
        totalRevenue,
        todayOrders,
        pendingOrders,
        totalProducts: productCounts[0],
        outOfStockCount: productCounts[1],
        lowStockCount: productCounts[2],
        totalUsers: userCount,
        revenueChange,
      },
      'Dashboard analytics retrieved'
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/sales-report
// Query: ?startDate=&endDate=  (default: last 7 days)
// Returns: [{date, orderCount, revenue}]
// ---------------------------------------------------------------------------

exports.getSalesReport = async (req, res, next) => {
  try {
    const endDate = req.query.endDate ? dayjs(req.query.endDate).endOf('day') : dayjs().endOf('day');
    const startDate = req.query.startDate
      ? dayjs(req.query.startDate).startOf('day')
      : dayjs().subtract(6, 'day').startOf('day');

    const CANCELLED = ['cancelled', 'cancel'];

    const rows = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
          status: { $nin: CANCELLED },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', orderCount: 1, revenue: 1 } },
    ]).option({ maxTimeMS: 10000 });

    return respond.success(res, rows, 'Sales report retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/revenue
// Query: ?groupBy=day|week|month&startDate=&endDate=
// ---------------------------------------------------------------------------

exports.getRevenue = async (req, res, next) => {
  try {
    const groupBy = ['day', 'week', 'month'].includes(req.query.groupBy)
      ? req.query.groupBy
      : 'day';

    let startDate, endDate;

    if (groupBy === 'month') {
      endDate = req.query.endDate ? dayjs(req.query.endDate).endOf('month') : dayjs().endOf('month');
      startDate = req.query.startDate
        ? dayjs(req.query.startDate).startOf('month')
        : dayjs().subtract(11, 'month').startOf('month');
    } else if (groupBy === 'week') {
      endDate = req.query.endDate ? dayjs(req.query.endDate).endOf('day') : dayjs().endOf('day');
      startDate = req.query.startDate
        ? dayjs(req.query.startDate).startOf('day')
        : dayjs().subtract(11, 'week').startOf('isoWeek');
    } else {
      // day
      endDate = req.query.endDate ? dayjs(req.query.endDate).endOf('day') : dayjs().endOf('day');
      startDate = req.query.startDate
        ? dayjs(req.query.startDate).startOf('day')
        : dayjs().subtract(29, 'day').startOf('day');
    }

    const CANCELLED = ['cancelled', 'cancel'];

    // Build $dateToString format
    let dateFormat;
    let periodLabel;
    if (groupBy === 'day') {
      dateFormat = '%Y-%m-%d';
      periodLabel = 'date';
    } else if (groupBy === 'week') {
      dateFormat = '%G-W%V'; // ISO year + ISO week
      periodLabel = 'week';
    } else {
      dateFormat = '%Y-%m';
      periodLabel = 'month';
    }

    const rows = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
          status: { $nin: CANCELLED },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          [periodLabel]: '$_id',
          orderCount: 1,
          revenue: 1,
        },
      },
    ]).option({ maxTimeMS: 10000 });

    return respond.success(res, { groupBy, rows }, 'Revenue data retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/top-products
// Query: ?sortBy=revenue|sellCount&period=7d|30d|90d
// ---------------------------------------------------------------------------

exports.getTopProducts = async (req, res, next) => {
  try {
    const sortBy = req.query.sortBy === 'revenue' ? 'revenue' : 'sellCount';
    const periodMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = periodMap[req.query.period] || 30;
    const limit = 10;

    if (sortBy === 'sellCount') {
      // Query Products directly sorted by sellCount
      const products = await Product.find()
        .sort({ sellCount: -1 })
        .limit(limit)
        .select('title img sellCount price productType');

      const data = products.map((p) => ({
        productId: p._id,
        title: p.title,
        image: p.img,
        productType: p.productType,
        unitPrice: p.price,
        totalSold: p.sellCount,
        totalRevenue: p.sellCount * p.price,
      }));

      return respond.success(res, data, 'Top products retrieved');
    }

    // Revenue-based: aggregate from orders
    const sinceDate = dayjs().subtract(days, 'day').startOf('day').toDate();
    const CANCELLED = ['cancelled', 'cancel'];

    // First try structured items[], then fall back to legacy cart[]
    const [fromItems, fromCart] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate },
            status: { $nin: CANCELLED },
            'items.0': { $exists: true },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            title: { $first: '$items.title' },
            image: { $first: '$items.image' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            title: 1,
            image: 1,
            totalSold: 1,
            totalRevenue: 1,
          },
        },
      ]).option({ maxTimeMS: 10000 }),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sinceDate },
            status: { $nin: CANCELLED },
            'items.0': { $exists: false },
            'cart.0': { $exists: true },
          },
        },
        { $unwind: '$cart' },
        {
          $group: {
            _id: { $ifNull: ['$cart.productId', '$cart._id'] },
            title: { $first: '$cart.title' },
            image: { $first: '$cart.img' },
            totalSold: { $sum: { $ifNull: ['$cart.orderQuantity', '$cart.quantity'] } },
            totalRevenue: {
              $sum: {
                $multiply: [
                  '$cart.price',
                  { $ifNull: ['$cart.orderQuantity', '$cart.quantity'] },
                ],
              },
            },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            title: 1,
            image: 1,
            totalSold: 1,
            totalRevenue: 1,
          },
        },
      ]).option({ maxTimeMS: 10000 }),
    ]);

    // Merge both sources, deduplicate by productId (prefer structured items)
    const seen = new Set();
    const merged = [];

    for (const row of [...fromItems, ...fromCart]) {
      const key = row.productId ? row.productId.toString() : `no-id-${row.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(row);
      }
    }

    merged.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return respond.success(res, merged.slice(0, limit), 'Top products retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/top-categories
// Aggregates from orders (legacy cart[].productType)
// ---------------------------------------------------------------------------

exports.getTopCategories = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const CANCELLED = ['cancelled', 'cancel'];

    const rows = await Order.aggregate([
      { $match: { status: { $nin: CANCELLED } } },
      { $unwind: '$cart' },
      {
        $group: {
          _id: '$cart.productType',
          orderCount: { $sum: 1 },
          totalSold: { $sum: { $ifNull: ['$cart.orderQuantity', '$cart.quantity'] } },
          revenue: {
            $sum: {
              $multiply: [
                '$cart.price',
                { $ifNull: ['$cart.orderQuantity', '$cart.quantity'] },
              ],
            },
          },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          category: '$_id',
          orderCount: 1,
          totalSold: 1,
          revenue: 1,
        },
      },
    ]).option({ maxTimeMS: 10000 });

    return respond.success(res, rows, 'Top categories retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/customer-growth
// Query: ?groupBy=week|month&period=3m|6m|1y
// ---------------------------------------------------------------------------

exports.getCustomerGrowth = async (req, res, next) => {
  try {
    const groupBy = req.query.groupBy === 'week' ? 'week' : 'month';
    const periodMap = { '3m': 3, '6m': 6, '1y': 12 };
    const months = periodMap[req.query.period] || 6;

    const sinceDate = dayjs().subtract(months, 'month').startOf('month').toDate();

    let dateFormat, periodLabel;
    if (groupBy === 'week') {
      dateFormat = '%G-W%V';
      periodLabel = 'week';
    } else {
      dateFormat = '%Y-%m';
      periodLabel = 'month';
    }

    const rows = await User.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          [periodLabel]: '$_id',
          newUsers: 1,
        },
      },
    ]).option({ maxTimeMS: 10000 });

    return respond.success(res, { groupBy, rows }, 'Customer growth data retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/vendor-performance
// Paginated. Requires admin|manager role (enforced at route level).
// ---------------------------------------------------------------------------

exports.getVendorPerformance = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const CANCELLED = ['cancelled', 'cancel'];

    // Count distinct vendors who have products
    const totalItems = await Product.distinct('vendor', {
      vendor: { $exists: true, $ne: null },
    }).then((ids) => ids.length);

    // Per-vendor product counts
    const vendorProducts = await Product.aggregate([
      { $match: { vendor: { $exists: true, $ne: null } } },
      { $group: { _id: '$vendor', productCount: { $sum: 1 } } },
      { $sort: { productCount: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorUser',
        },
      },
      { $unwind: { path: '$vendorUser', preserveNullAndEmpty: true } },
      {
        $project: {
          _id: 0,
          vendorId: '$_id',
          storeName: '$vendorUser.vendorProfile.storeName',
          vendorName: '$vendorUser.name',
          vendorEmail: '$vendorUser.email',
          productCount: 1,
        },
      },
    ]).option({ maxTimeMS: 10000 });

    // Enrich with order revenue data (structured items[])
    const vendorIds = vendorProducts.map((v) => v.vendorId);

    const orderStats = await Order.aggregate([
      {
        $match: {
          status: { $nin: CANCELLED },
          'items.vendor': { $in: vendorIds },
        },
      },
      { $unwind: '$items' },
      {
        $match: { 'items.vendor': { $in: vendorIds } },
      },
      {
        $group: {
          _id: '$items.vendor',
          orderRevenue: { $sum: '$items.subtotal' },
          itemsSold: { $sum: '$items.quantity' },
          orderCount: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 1,
          orderRevenue: 1,
          itemsSold: 1,
          orderCount: { $size: '$orderCount' },
        },
      },
    ]).option({ maxTimeMS: 10000 });

    const statsMap = new Map(orderStats.map((s) => [s._id.toString(), s]));

    const data = vendorProducts.map((v) => {
      const stats = statsMap.get(v.vendorId ? v.vendorId.toString() : '') || {};
      return {
        ...v,
        orderCount: stats.orderCount || 0,
        itemsSold: stats.itemsSold || 0,
        revenue: stats.orderRevenue || 0,
      };
    });

    return respond.paginated(res, data, buildPagination(page, limit, totalItems), 'Vendor performance retrieved');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/admin/analytics/recent-orders
// Last 10 orders with lightweight projection.
// ---------------------------------------------------------------------------

exports.getRecentOrders = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('invoice status totalAmount paymentMethod name email createdAt user')
      .populate('user', 'name email');

    return respond.success(res, orders, 'Recent orders retrieved');
  } catch (err) {
    next(err);
  }
};
