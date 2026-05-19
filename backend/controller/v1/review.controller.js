'use strict';

/**
 * Review controller — v1 (store-facing approved reviews only)
 *
 * Admin moderation functions were removed in Phase 4b.
 * New reviews are auto-approved (status set in user.controller.js addReview).
 */

const mongoose = require('mongoose');
const Reviews = require('../../model/Review');
const respond = require('../../utils/respond');
const { getPaginationParams, buildPagination } = require('../../utils/pagination');

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
