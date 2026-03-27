'use strict';

/**
 * Admin vendor controller — v1
 *
 * Provides admin endpoints for vendor management: listing, approving/rejecting,
 * suspension, commission management, and payout processing.
 */

const mongoose = require('mongoose');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');
const User = require('../../model/User');
const Product = require('../../model/Products');
const Order = require('../../model/Order');
const Payout = require('../../model/Payout');
const keycloakService = require('../../services/keycloak.service');

// ---------------------------------------------------------------------------
// Vendor listing and stats
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/vendors
 * List users who are vendors or have a pending vendorProfile application.
 * Filters: status (verificationStatus), search (storeName, user name, email)
 */
exports.listVendors = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const q = req.query;

    // Match vendors (role === 'vendor') OR users with any vendorProfile.verificationStatus
    const filter = {
      $or: [
        { role: 'vendor' },
        { 'vendorProfile.verificationStatus': { $exists: true } },
      ],
    };

    if (q.status) {
      filter['vendorProfile.verificationStatus'] = q.status;
      // Override $or when filtering by status specifically
      delete filter.$or;
    }

    if (q.search) {
      const searchRegex = { $regex: q.search, $options: 'i' };
      const searchFilter = {
        $or: [
          { 'vendorProfile.storeName': searchRegex },
          { name: searchRegex },
          { email: searchRegex },
        ],
      };
      // Merge search filter with existing filter
      filter.$and = [{ $or: filter.$or || [{ role: 'vendor' }, { 'vendorProfile.verificationStatus': { $exists: true } }] }, searchFilter];
      delete filter.$or;
    }

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('name email role status vendorProfile createdAt'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Vendors retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/vendors/stats
 * Summary counts: by verification status, total revenue share, pending payout total.
 */
exports.getVendorStats = async (req, res, next) => {
  try {
    const [statusCounts, pendingPayoutAgg, revenueAgg] = await Promise.all([
      // Count vendors by verification status
      User.aggregate([
        {
          $match: {
            $or: [
              { role: 'vendor' },
              { 'vendorProfile.verificationStatus': { $exists: true } },
            ],
          },
        },
        {
          $group: {
            _id: '$vendorProfile.verificationStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      // Total pending payouts
      Payout.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Total vendor revenue from delivered orders
      Order.aggregate([
        { $match: { status: 'delivered', 'items.0': { $exists: true } } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': { $exists: true } } },
        { $group: { _id: null, total: { $sum: '$items.subtotal' } } },
      ]),
    ]);

    const stats = {
      byStatus: {},
      pendingPayoutTotal: pendingPayoutAgg[0]?.total || 0,
      totalVendorRevenue: revenueAgg[0]?.total || 0,
    };

    for (const entry of statusCounts) {
      stats.byStatus[entry._id || 'unknown'] = entry.count;
    }

    return respond.success(res, stats, 'Vendor statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/vendors/:id
 * Single vendor with aggregate stats.
 */
exports.getVendorById = async (req, res, next) => {
  try {
    const vendorId = new mongoose.Types.ObjectId(req.params.id);

    const user = await User.findById(vendorId).select(
      'name email role status vendorProfile createdAt'
    );
    if (!user) {
      return respond.notFound(res, 'VENDOR_NOT_FOUND', 'Vendor not found');
    }

    // Aggregate stats: product count, order count, total revenue
    const [productCount, orderCount, revenueAgg] = await Promise.all([
      Product.countDocuments({ vendor: vendorId }),
      Order.countDocuments({ 'items.vendor': vendorId }),
      Order.aggregate([
        { $match: { status: 'delivered', 'items.vendor': vendorId } },
        { $unwind: '$items' },
        { $match: { 'items.vendor': vendorId } },
        { $group: { _id: null, total: { $sum: '$items.subtotal' } } },
      ]),
    ]);

    return respond.success(
      res,
      {
        vendor: user,
        stats: {
          productCount,
          orderCount,
          totalRevenue: revenueAgg[0]?.total || 0,
        },
      },
      'Vendor retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/vendors/:id/products
 * Products filtered by vendor. Paginated.
 */
exports.getVendorProducts = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const vendorId = new mongoose.Types.ObjectId(req.params.id);
    const q = req.query;

    const filter = { vendor: vendorId };
    if (q.status) filter.status = q.status;
    if (q.search) filter.title = { $regex: q.search, $options: 'i' };

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort(sortObj).skip(skip).limit(limit),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Vendor products retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/vendors/:id/orders
 * All orders containing vendor's items. Admin sees all items (no redaction).
 */
exports.getVendorOrders = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const vendorId = new mongoose.Types.ObjectId(req.params.id);
    const q = req.query;

    const filter = { 'items.vendor': vendorId };
    if (q.status) filter.status = q.status;

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Vendor orders retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/vendors/:id/payouts
 * Paginated payout history for a specific vendor.
 */
exports.getVendorPayouts = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const vendorId = new mongoose.Types.ObjectId(req.params.id);

    const filter = { vendor: vendorId };
    if (req.query.status) filter.status = req.query.status;

    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [totalItems, data] = await Promise.all([
      Payout.countDocuments(filter),
      Payout.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('processedBy', 'name email')
        .lean(),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Vendor payouts retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Vendor approval workflow
// ---------------------------------------------------------------------------

/**
 * PATCH /api/v1/admin/vendors/:id/approve
 * Approve a vendor application. Sets verificationStatus to 'approved' and
 * role to 'vendor'. Also assigns 'vendor' role in Keycloak.
 */
exports.approveVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return respond.notFound(res, 'VENDOR_NOT_FOUND', 'Vendor not found');
    }

    // Assign vendor role in Keycloak so token-based auth recognizes the role
    if (user.keycloakId) {
      try {
        await keycloakService.assignRealmRole(user.keycloakId, 'vendor');
      } catch (kcErr) {
        console.error(`[Vendor] Failed to assign Keycloak vendor role:`, kcErr.message);
        // Don't block approval — admin can fix Keycloak role manually
      }
    }

    user.role = 'vendor';
    if (!user.vendorProfile) user.vendorProfile = {};
    user.vendorProfile.verificationStatus = 'approved';
    // Clear any rejection reason from a previous rejection
    user.vendorProfile.rejectionReason = undefined;

    await user.save();

    if (global.io) {
      global.io.emit('vendor:approved', { vendorId: user._id, storeName: user.vendorProfile?.storeName });
    }

    return respond.success(res, { _id: user._id, verificationStatus: 'approved', role: user.role }, 'Vendor approved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/vendors/:id/reject
 * Reject a vendor application.
 * Body: { reason }
 */
exports.rejectVendor = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return respond.notFound(res, 'VENDOR_NOT_FOUND', 'Vendor not found');
    }

    if (!user.vendorProfile) user.vendorProfile = {};
    user.vendorProfile.verificationStatus = 'rejected';
    if (reason) user.vendorProfile.rejectionReason = reason;

    await user.save();

    if (global.io) {
      global.io.emit('vendor:rejected', {
        vendorId: user._id,
        storeName: user.vendorProfile?.storeName,
        reason: reason || null,
      });
    }

    return respond.success(
      res,
      { _id: user._id, verificationStatus: 'rejected', rejectionReason: reason || null },
      'Vendor application rejected'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/vendors/:id/suspend
 * Suspend a vendor. Sets verificationStatus to 'suspended' and user.status to 'blocked'.
 */
exports.suspendVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return respond.notFound(res, 'VENDOR_NOT_FOUND', 'Vendor not found');
    }

    if (!user.vendorProfile) user.vendorProfile = {};
    user.vendorProfile.verificationStatus = 'suspended';
    user.status = 'blocked';

    // Disable user in Keycloak
    if (user.keycloakId) {
      try {
        await keycloakService.setUserEnabled(user.keycloakId, false);
      } catch (kcErr) {
        console.error(`[Vendor] Failed to disable user in Keycloak:`, kcErr.message);
      }
    }

    await user.save();

    if (global.io) {
      global.io.emit('vendor:suspended', { vendorId: user._id, storeName: user.vendorProfile?.storeName });
    }

    return respond.success(
      res,
      { _id: user._id, verificationStatus: 'suspended', status: user.status },
      'Vendor suspended successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/vendors/:id/commission
 * Update a vendor's commission rate.
 * Body: { commissionRate }  (0–100)
 */
exports.updateCommission = async (req, res, next) => {
  try {
    const { commissionRate } = req.body;

    if (commissionRate === undefined || commissionRate === null) {
      return respond.error(res, 'MISSING_FIELDS', 'commissionRate is required', 400);
    }

    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return respond.error(res, 'INVALID_COMMISSION_RATE', 'commissionRate must be a number between 0 and 100', 400);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return respond.notFound(res, 'VENDOR_NOT_FOUND', 'Vendor not found');
    }

    if (!user.vendorProfile) user.vendorProfile = {};
    user.vendorProfile.commissionRate = rate;

    await user.save();

    return respond.success(
      res,
      { _id: user._id, commissionRate: rate },
      'Commission rate updated successfully'
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Payout processing
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/admin/vendors/:id/payouts/:payoutId/process
 * Mark a payout as paid.
 * Body: { transactionRef, note }
 */
exports.processPayout = async (req, res, next) => {
  try {
    const { id: vendorId, payoutId } = req.params;
    const { transactionRef, note } = req.body;

    const payout = await Payout.findOne({
      _id: payoutId,
      vendor: new mongoose.Types.ObjectId(vendorId),
    });

    if (!payout) {
      return respond.notFound(res, 'PAYOUT_NOT_FOUND', 'Payout not found for this vendor');
    }

    if (payout.status === 'paid') {
      return respond.error(res, 'ALREADY_PROCESSED', 'This payout has already been processed', 409);
    }

    payout.status = 'paid';
    payout.processedAt = new Date();
    payout.processedBy = req.user._id;
    if (transactionRef) payout.transactionRef = transactionRef;
    if (note) payout.note = note;

    await payout.save();

    if (global.io) {
      global.io.emit('payout:processed', {
        payoutId: payout._id,
        vendorId,
        amount: payout.amount,
        transactionRef: payout.transactionRef,
      });
    }

    return respond.success(res, payout, 'Payout processed successfully');
  } catch (err) {
    next(err);
  }
};
