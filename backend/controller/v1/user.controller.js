'use strict';

/**
 * User controller — v1
 *
 * Thin wrappers around existing controllers.  All responses go through the
 * respond utility; business logic is NOT duplicated here.
 */

const mongoose = require('mongoose');
const respond = require('../../utils/respond');
const userController = require('../../controller/user.controller');
const userOrderController = require('../../controller/user.order.controller');
const orderController = require('../../controller/order.controller');
const User = require('../../model/User');
const Order = require('../../model/Order');
const Reviews = require('../../model/Review');
const Products = require('../../model/Products');

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/user/profile
 * Delegates to existing getProfile — it already builds the correct response,
 * but we proxy through next() so the global error handler still applies.
 */
exports.getProfile = (req, res, next) => {
  return userController.getProfile(req, res, next);
};

/**
 * PUT /api/v1/user/profile
 */
exports.updateProfile = (req, res, next) => {
  return userController.updateUser(req, res, next);
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/user/orders
 */
exports.getUserOrders = (req, res, next) => {
  return userOrderController.getOrderByUser(req, res, next);
};

/**
 * GET /api/v1/user/orders/:id
 */
exports.getOrderById = (req, res, next) => {
  return userOrderController.getOrderById(req, res, next);
};

/**
 * POST /api/v1/user/orders
 */
exports.createOrder = (req, res, next) => {
  return orderController.addOrder(req, res, next);
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/user/reviews
 * Enhanced version: sets status pending, checks verified purchase, prevents duplicates.
 */
exports.addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment, images } = req.body;
    const userId = req.user._id;

    if (!productId || !rating) {
      return respond.error(res, 'MISSING_FIELDS', 'productId and rating are required', 400);
    }

    // Prevent duplicate reviews
    const existing = await Reviews.findOne({ userId, productId });
    if (existing) {
      return respond.error(
        res,
        'REVIEW_ALREADY_EXISTS',
        'You have already left a review for this product',
        400
      );
    }

    // Check for a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      user: new mongoose.Types.ObjectId(userId),
      status: 'delivered',
      $or: [
        { 'cart._id': productId },
        { 'cart.productId': productId },
        { 'items.product': new mongoose.Types.ObjectId(productId) },
      ],
    });

    const isVerifiedPurchase = Boolean(deliveredOrder);

    const review = await Reviews.create({
      userId,
      productId,
      rating,
      comment: comment || '',
      images: images || [],
      status: 'pending',
      isVerifiedPurchase,
    });

    // Push review ref to product and user
    await Promise.all([
      Products.findByIdAndUpdate(productId, { $push: { reviews: review._id } }),
      User.findByIdAndUpdate(userId, { $push: { reviews: review._id } }),
    ]);

    if (global.io) {
      global.io.emit('review:created', { review });
    }

    return respond.created(res, review, 'Review submitted and awaiting moderation');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/user/addresses
 */
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'User not found');
    }
    return respond.success(res, user.addresses || [], 'Addresses retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/user/addresses
 * Body: { label, fullName, phone, address, city, state, country, zipCode, isDefault }
 */
exports.addAddress = async (req, res, next) => {
  try {
    const { label, fullName, phone, address, city, state, country, zipCode, isDefault } = req.body;

    if (!fullName || !phone || !address || !city || !country || !zipCode) {
      return respond.error(
        res,
        'MISSING_FIELDS',
        'fullName, phone, address, city, country, and zipCode are required',
        400
      );
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'User not found');
    }

    // If new address is default, unset all others
    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    user.addresses.push({ label, fullName, phone, address, city, state, country, zipCode, isDefault: Boolean(isDefault) });
    await user.save();

    return respond.created(res, user.addresses, 'Address added successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/user/addresses/:id
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, fullName, phone, address, city, state, country, zipCode, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'User not found');
    }

    const addrIndex = user.addresses.findIndex((a) => a._id.toString() === id);
    if (addrIndex === -1) {
      return respond.notFound(res, 'ADDRESS_NOT_FOUND', 'Address not found');
    }

    // If updating to default, clear all other defaults first
    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    const addr = user.addresses[addrIndex];
    if (label !== undefined) addr.label = label;
    if (fullName !== undefined) addr.fullName = fullName;
    if (phone !== undefined) addr.phone = phone;
    if (address !== undefined) addr.address = address;
    if (city !== undefined) addr.city = city;
    if (state !== undefined) addr.state = state;
    if (country !== undefined) addr.country = country;
    if (zipCode !== undefined) addr.zipCode = zipCode;
    if (isDefault !== undefined) addr.isDefault = Boolean(isDefault);

    await user.save();

    return respond.success(res, user.addresses, 'Address updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/user/addresses/:id
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'User not found');
    }

    const addr = user.addresses.find((a) => a._id.toString() === id);
    if (!addr) {
      return respond.notFound(res, 'ADDRESS_NOT_FOUND', 'Address not found');
    }

    // Prevent deleting the only default address when other addresses exist
    if (addr.isDefault && user.addresses.length > 1) {
      return respond.error(
        res,
        'CANNOT_DELETE_DEFAULT',
        'Cannot delete the default address. Set another address as default first.',
        400
      );
    }

    user.addresses = user.addresses.filter((a) => a._id.toString() !== id);
    await user.save();

    return respond.success(res, user.addresses, 'Address deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/user/addresses/:id/default
 * Set the given address as the default, clearing all others.
 */
exports.setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return respond.notFound(res, 'USER_NOT_FOUND', 'User not found');
    }

    const addr = user.addresses.find((a) => a._id.toString() === id);
    if (!addr) {
      return respond.notFound(res, 'ADDRESS_NOT_FOUND', 'Address not found');
    }

    user.addresses.forEach((a) => {
      a.isDefault = a._id.toString() === id;
    });

    await user.save();

    return respond.success(res, user.addresses, 'Default address updated');
  } catch (err) {
    next(err);
  }
};
