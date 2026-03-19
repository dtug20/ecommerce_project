'use strict';

/**
 * Wishlist controller — v1
 *
 * Manages the per-user wishlist document (one document per user, upserted
 * on first write).  All routes are protected by verifyToken applied at the
 * v1 index level.
 */

const respond = require('../../utils/respond');
const Wishlist = require('../../model/Wishlist');
const Products = require('../../model/Products');

// Projection applied when populating product refs
const PRODUCT_SELECT = 'title slug price discount status imageURLs img';

// ---------------------------------------------------------------------------
// GET /api/v1/user/wishlist
// ---------------------------------------------------------------------------

exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      'products.product',
      PRODUCT_SELECT
    );

    return respond.success(
      res,
      wishlist ? wishlist : { products: [] },
      'Wishlist retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/user/wishlist
// Body: { productId }
// ---------------------------------------------------------------------------

exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return respond.error(res, 'MISSING_PRODUCT_ID', 'productId is required', 400);
    }

    // Verify the product exists
    const product = await Products.findById(productId).select(PRODUCT_SELECT);
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { products: { product: productId, addedAt: new Date() } } },
      { upsert: true, new: true }
    ).populate('products.product', PRODUCT_SELECT);

    if (global.io) {
      global.io.emit('wishlist:updated', { userId: req.user._id });
    }

    return respond.success(res, wishlist, 'Product added to wishlist');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/user/wishlist/:productId
// ---------------------------------------------------------------------------

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate('products.product', PRODUCT_SELECT);

    if (!wishlist) {
      return respond.notFound(res, 'WISHLIST_NOT_FOUND', 'Wishlist not found');
    }

    if (global.io) {
      global.io.emit('wishlist:updated', { userId: req.user._id });
    }

    return respond.success(res, wishlist, 'Product removed from wishlist');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/user/wishlist
// Clear all items from wishlist
// ---------------------------------------------------------------------------

exports.clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $set: { products: [] } },
      { new: true }
    );

    if (!wishlist) {
      // Nothing to clear — return empty wishlist shape
      return respond.success(res, { products: [] }, 'Wishlist cleared');
    }

    if (global.io) {
      global.io.emit('wishlist:updated', { userId: req.user._id });
    }

    return respond.success(res, wishlist, 'Wishlist cleared');
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/user/wishlist/:productId/move-to-cart
// Removes the item from the wishlist and returns its product data so the
// frontend can add it to the cart (cart state lives in Redux on the client).
// ---------------------------------------------------------------------------

exports.moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Find the product before pulling so we can return it
    const product = await Products.findById(productId).select(PRODUCT_SELECT);
    if (!product) {
      return respond.notFound(res, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: { product: productId } } },
      { new: true }
    ).populate('products.product', PRODUCT_SELECT);

    if (global.io) {
      global.io.emit('wishlist:updated', { userId: req.user._id });
    }

    return respond.success(
      res,
      { product, wishlist: wishlist || { products: [] } },
      'Product moved to cart'
    );
  } catch (err) {
    next(err);
  }
};
