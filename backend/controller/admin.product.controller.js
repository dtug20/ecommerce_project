const Product = require('../model/Products');
const Category = require('../model/Category');
const Brand = require('../model/Brand');
const Reviews = require('../model/Review');

/**
 * Generate a URL-safe slug from a title string.
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

// GET /api/admin/products
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, category, status, featured,
      search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (category) filter['category.name'] = category;
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, totalItems] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('category.id', 'parent productType'),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/products/stats
exports.getProductStats = async (req, res, next) => {
  try {
    const [totalProducts, activeProducts, featuredProducts, outOfStock, lowStock, categoryStats] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ status: 'in-stock' }),
        Product.countDocuments({ featured: true }),
        Product.countDocuments({ status: 'out-of-stock' }),
        Product.countDocuments({ quantity: { $gt: 0, $lte: 10 } }),
        Product.aggregate([
          { $group: { _id: '$productType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

    res.json({
      success: true,
      data: { totalProducts, activeProducts, featuredProducts, outOfStock, lowStock, categoryStats },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category.id', 'parent productType')
      .populate('brand.id', 'name logo')
      .populate({ path: 'reviews', populate: { path: 'userId', select: 'name email imageURL' } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Include review stats (approved reviews only)
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

    res.json({ success: true, data: product, reviewStats: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate that variant SKUs are unique within a product body.
 * Returns a string error message, or null if valid.
 * @param {Array} variants
 * @returns {string|null}
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

// POST /api/admin/products
exports.createProduct = async (req, res, next) => {
  try {
    const body = req.body;

    // Auto-generate slug from title if not provided
    if (body.title && !body.slug) {
      body.slug = toSlug(body.title);
    }

    // Validate variant SKUs uniqueness
    if (body.variants) {
      const skuError = validateVariantSkus(body.variants);
      if (skuError) {
        return res.status(400).json({ success: false, message: skuError });
      }
    }

    const product = await Product.create(body);

    // Push to category.products
    if (product.category?.id) {
      await Category.findByIdAndUpdate(product.category.id, {
        $push: { products: product._id },
      });
    }
    // Push to brand.products
    if (product.brand?.id) {
      await Brand.findByIdAndUpdate(product.brand.id, {
        $push: { products: product._id },
      });
    }

    // Emit socket event
    if (global.io) global.io.emit('product:created', product);

    res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const body = req.body;

    // Auto-generate slug from title if title changed but no explicit slug provided
    if (body.title && !body.slug) {
      body.slug = toSlug(body.title);
    }

    // Validate variant SKUs uniqueness
    if (body.variants) {
      const skuError = validateVariantSkus(body.variants);
      if (skuError) {
        return res.status(400).json({ success: false, message: skuError });
      }
    }

    const oldProduct = await Product.findById(req.params.id);
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Handle category change
    const oldCatId = oldProduct.category?.id?.toString();
    const newCatId = body.category?.id;
    if (newCatId && oldCatId && newCatId !== oldCatId) {
      await Category.findByIdAndUpdate(oldCatId, { $pull: { products: oldProduct._id } });
      await Category.findByIdAndUpdate(newCatId, { $push: { products: oldProduct._id } });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });

    if (global.io) global.io.emit('product:updated', product);

    res.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove from category and brand
    if (product.category?.id) {
      await Category.findByIdAndUpdate(product.category.id, { $pull: { products: product._id } });
    }
    if (product.brand?.id) {
      await Brand.findByIdAndUpdate(product.brand.id, { $pull: { products: product._id } });
    }

    await Product.findByIdAndDelete(req.params.id);

    if (global.io) global.io.emit('product:deleted', { _id: req.params.id });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
