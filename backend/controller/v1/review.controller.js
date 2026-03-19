'use strict';

/**
 * Review controller — v1 (admin moderation + store-facing approved reviews)
 *
 * Admin endpoints handle moderation (approve, reject, reply, delete).
 * Store endpoint returns paginated approved reviews with a rating breakdown.
 */

const mongoose = require('mongoose');
const Reviews = require('../../model/Review');
const Products = require('../../model/Products');
const User = require('../../model/User');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

// ---------------------------------------------------------------------------
// Admin — list reviews
// GET /api/v1/admin/reviews
// Query: status, rating, search (comment text), productId, page, limit, sortBy, sortOrder
// ---------------------------------------------------------------------------

exports.listReviews = async (req, res, next) => {
  try {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.rating) {
      filter.rating = parseInt(req.query.rating, 10);
    }
    if (req.query.search) {
      filter.comment = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.productId && mongoose.Types.ObjectId.isValid(req.query.productId)) {
      filter.productId = new mongoose.Types.ObjectId(req.query.productId);
    }

    const [totalItems, data] = await Promise.all([
      Reviews.countDocuments(filter),
      Reviews.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email imageURL')
        .populate('productId', 'title img slug'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Reviews retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Admin — get single review
// GET /api/v1/admin/reviews/:id
// ---------------------------------------------------------------------------

exports.getReview = async (req, res, next) => {
  try {
    const review = await Reviews.findById(req.params.id)
      .populate('userId', 'name email imageURL')
      .populate('productId', 'title img slug');

    if (!review) {
      return respond.notFound(res, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    return respond.success(res, review, 'Review retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Admin — get reviews for a specific product (all statuses)
// GET /api/v1/admin/products/:productId/reviews
// ---------------------------------------------------------------------------

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return respond.error(res, 'INVALID_PRODUCT_ID', 'Invalid product ID', 400);
    }

    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = { productId: new mongoose.Types.ObjectId(productId) };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [totalItems, data] = await Promise.all([
      Reviews.countDocuments(filter),
      Reviews.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email imageURL'),
    ]);

    const pagination = buildPagination(page, limit, totalItems);
    return respond.paginated(res, data, pagination, 'Product reviews retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Admin — approve review
// PATCH /api/v1/admin/reviews/:id/approve
// ---------------------------------------------------------------------------

exports.approveReview = async (req, res, next) => {
  try {
    const review = await Reviews.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'approved' } },
      { new: true }
    )
      .populate('userId', 'name email imageURL')
      .populate('productId', 'title img slug');

    if (!review) {
      return respond.notFound(res, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    if (global.io) {
      global.io.emit('review:updated', { review });
    }

    return respond.success(res, review, 'Review approved successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Admin — reject review
// PATCH /api/v1/admin/reviews/:id/reject
// Body: { reason }
// ---------------------------------------------------------------------------

exports.rejectReview = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const review = await Reviews.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected' } },
      { new: true }
    )
      .populate('userId', 'name email imageURL')
      .populate('productId', 'title img slug');

    if (!review) {
      return respond.notFound(res, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    if (global.io) {
      global.io.emit('review:updated', { review, reason });
    }

    return respond.success(res, review, 'Review rejected successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Admin — reply to a review
// POST /api/v1/admin/reviews/:id/reply
// Body: { text }
// ---------------------------------------------------------------------------

exports.replyToReview = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return respond.error(res, 'MISSING_REPLY_TEXT', 'Reply text is required', 400);
    }

    const review = await Reviews.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          adminReply: {
            text: text.trim(),
            repliedAt: new Date(),
            repliedBy: req.user._id,
          },
        },
      },
      { new: true }
    )
      .populate('userId', 'name email imageURL')
      .populate('productId', 'title img slug');

    if (!review) {
      return respond.notFound(res, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    if (global.io) {
      global.io.emit('review:updated', { review });
    }

    return respond.success(res, review, 'Reply added to review');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Admin — delete review
// DELETE /api/v1/admin/reviews/:id
// Also removes the ref from Product.reviews[] and User.reviews[]
// ---------------------------------------------------------------------------

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Reviews.findById(req.params.id);
    if (!review) {
      return respond.notFound(res, 'REVIEW_NOT_FOUND', 'Review not found');
    }

    const reviewId = review._id;
    const { productId, userId } = review;

    await Promise.all([
      Reviews.findByIdAndDelete(reviewId),
      Products.findByIdAndUpdate(productId, { $pull: { reviews: reviewId } }),
      User.findByIdAndUpdate(userId, { $pull: { reviews: reviewId } }),
    ]);

    if (global.io) {
      global.io.emit('review:deleted', { reviewId });
    }

    return respond.success(res, { _id: reviewId }, 'Review deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Store — approved product reviews with rating breakdown
// GET /api/v1/store/products/:productId/reviews
// ---------------------------------------------------------------------------

exports.getApprovedProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return respond.error(res, 'INVALID_PRODUCT_ID', 'Invalid product ID', 400);
    }

    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req.query);
    const filter = {
      productId: new mongoose.Types.ObjectId(productId),
      status: 'approved',
    };

    // Rating breakdown (counts per rating 1–5)
    const [totalItems, data, ratingBreakdown] = await Promise.all([
      Reviews.countDocuments(filter),
      Reviews.find(filter)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name imageURL')
        .select('-__v'),
      Reviews.aggregate([
        {
          $match: {
            productId: new mongoose.Types.ObjectId(productId),
            status: 'approved',
          },
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
      ]),
    ]);

    // Normalise breakdown to { 1: n, 2: n, 3: n, 4: n, 5: n }
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingBreakdown.forEach((r) => {
      breakdown[r._id] = r.count;
    });

    const avgRating =
      totalItems > 0
        ? (
            Object.entries(breakdown).reduce(
              (sum, [stars, count]) => sum + parseInt(stars, 10) * count,
              0
            ) / totalItems
          ).toFixed(1)
        : '0.0';

    const pagination = buildPagination(page, limit, totalItems);

    // Attach breakdown + avgRating to each paginated response via a custom envelope
    return res.status(200).json({
      success: true,
      message: 'Product reviews retrieved successfully',
      data,
      pagination,
      meta: {
        avgRating: parseFloat(avgRating),
        totalReviews: totalItems,
        ratingBreakdown: breakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};
