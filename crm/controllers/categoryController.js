const Category = require('../models/Category');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

class CategoryController {
  
  // GET /api/categories - Get all categories
  async getAllCategories(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        productType,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      let query = {};
      
      // Apply filters
      if (status) query.status = status;
      if (productType) query.productType = productType;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { parent: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const categories = await Category.find(query)
        .populate('products', 'title price status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Category.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving categories',
        error: error.message
      });
    }
  }

  // GET /api/categories/:id - Get single category
  async getCategoryById(req, res) {
    try {
      const category = await Category.findById(req.params.id)
        .populate('products', 'title price status img createdAt');

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        data: category
      });

    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving category',
        error: error.message
      });
    }
  }

  // POST /api/categories - Create new category
  async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      // Create slug from parent name
      const slug = req.body.parent.toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '-');

      const categoryData = {
        ...req.body,
        name: req.body.parent, // Set name same as parent for consistency
        slug
      };

      const category = new Category(categoryData);
      await category.save();

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });

    } catch (error) {
      console.error('Create category error:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error creating category',
        error: error.message
      });
    }
  }

  // PUT /api/categories/:id - Update category
  async updateCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const categoryId = req.params.id;
      
      // Update slug if parent name changed
      if (req.body.parent) {
        req.body.slug = req.body.parent.toLowerCase()
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .replace(/\s+/g, '-');
        req.body.name = req.body.parent;
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        req.body,
        { new: true, runValidators: true }
      ).populate('products', 'title price status');

      if (!updatedCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });

    } catch (error) {
      console.error('Update category error:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error updating category',
        error: error.message
      });
    }
  }

  // DELETE /api/categories/:id - Delete category
  async deleteCategory(req, res) {
    try {
      const categoryId = req.params.id;
      
      // Check if category has products
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      if (category.products && category.products.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete category with existing products. Please move or delete products first.'
        });
      }

      await Category.findByIdAndDelete(categoryId);

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });

    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting category',
        error: error.message
      });
    }
  }

  // GET /api/categories/tree - Get categories in tree structure
  async getCategoryTree(req, res) {
    try {
      const categories = await Category.find({ status: 'Show' })
        .sort({ parent: 1, sortOrder: 1 });

      // Group categories by parent
      const categoryTree = {};
      categories.forEach(category => {
        if (!categoryTree[category.parent]) {
          categoryTree[category.parent] = [];
        }
        categoryTree[category.parent].push(category);
      });

      res.json({
        success: true,
        data: categoryTree
      });

    } catch (error) {
      console.error('Get category tree error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving category tree',
        error: error.message
      });
    }
  }

  // GET /api/categories/stats - Get category statistics
  async getCategoryStats(req, res) {
    try {
      const totalCategories = await Category.countDocuments();
      const activeCategories = await Category.countDocuments({ status: 'Show' });
      const featuredCategories = await Category.countDocuments({ featured: true });

      const productTypeStats = await Category.aggregate([
        {
          $group: {
            _id: '$productType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const categoriesWithProductCount = await Category.aggregate([
        {
          $project: {
            name: 1,
            parent: 1,
            productType: 1,
            status: 1,
            productCount: { $size: { $ifNull: ['$products', []] } }
          }
        },
        {
          $sort: { productCount: -1 }
        },
        {
          $limit: 10
        }
      ]);

      res.json({
        success: true,
        data: {
          totalCategories,
          activeCategories,
          featuredCategories,
          productTypeStats,
          topCategories: categoriesWithProductCount
        }
      });

    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving category statistics',
        error: error.message
      });
    }
  }
}

module.exports = new CategoryController();