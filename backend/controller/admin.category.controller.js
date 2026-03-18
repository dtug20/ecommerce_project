const Category = require('../model/Category');

// GET /api/admin/categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, productType,
      search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (productType) filter.productType = productType.toLowerCase();
    if (search) filter.parent = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, totalItems] = await Promise.all([
      Category.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('products', 'title price status img createdAt'),
      Category.countDocuments(filter),
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

// GET /api/admin/categories/stats
exports.getCategoryStats = async (req, res, next) => {
  try {
    const [totalCategories, activeCategories, productTypeStats, topCategories] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ status: 'Show' }),
      Category.aggregate([
        { $group: { _id: '$productType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Category.aggregate([
        { $project: { parent: 1, productType: 1, productCount: { $size: '$products' } } },
        { $sort: { productCount: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      data: { totalCategories, activeCategories, productTypeStats, topCategories },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/categories/tree
exports.getCategoryTree = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ parent: 1 });
    const tree = {};
    categories.forEach((cat) => {
      const type = cat.productType || 'other';
      if (!tree[type]) tree[type] = [];
      tree[type].push(cat);
    });
    res.json({ success: true, data: tree });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/categories/:id
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('products', 'title price status img createdAt');
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/categories
exports.createCategory = async (req, res, next) => {
  try {
    const body = req.body;
    body.slug = (body.parent || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await Category.create(body);

    if (global.io) global.io.emit('category:created', category);

    res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/categories/:id
exports.updateCategory = async (req, res, next) => {
  try {
    const body = req.body;
    if (body.parent) {
      body.slug = body.parent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const category = await Category.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (global.io) global.io.emit('category:updated', category);

    res.json({ success: true, data: category, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/categories/:id
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (category.products && category.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${category.products.length} products. Remove products first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    if (global.io) global.io.emit('category:deleted', { _id: req.params.id });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
