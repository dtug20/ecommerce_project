const Product = require('../models/Product');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');

class ProductController {
  
  // GET /api/products - Get all products with pagination and filters
  async getAllProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        featured,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      let query = {};
      
      // Apply filters
      if (category) query.category = category;
      if (status) query.status = status;
      if (featured !== undefined) query.featured = featured === 'true';
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const skip = (page - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const products = await Product.find(query)
        .populate('category', 'name parent productType')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving products',
        error: error.message
      });
    }
  }

  // GET /api/products/:id - Get single product
  async getProductById(req, res) {
    try {
      const product = await Product.findById(req.params.id)
        .populate('category', 'name parent productType');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.json({
        success: true,
        data: product
      });

    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving product',
        error: error.message
      });
    }
  }

  // POST /api/products - Create new product
  async createProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      // Create slug from title
      const slug = req.body.title.toLowerCase()
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '-');

      const productData = {
        ...req.body,
        slug
      };

      const product = new Product(productData);
      await product.save();

      // Add product to category
      if (product.category) {
        await Category.findByIdAndUpdate(
          product.category,
          { $push: { products: product._id } }
        );
      }

      const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name parent productType');

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: populatedProduct
      });

    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  }

  // PUT /api/products/:id - Update product
  async updateProduct(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const productId = req.params.id;
      const oldProduct = await Product.findById(productId);
      
      if (!oldProduct) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Update slug if title changed
      if (req.body.title && req.body.title !== oldProduct.title) {
        req.body.slug = req.body.title.toLowerCase()
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .replace(/\s+/g, '-');
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        req.body,
        { new: true, runValidators: true }
      ).populate('category', 'name parent productType');

      // Update category if changed
      if (req.body.category && req.body.category !== oldProduct.category.toString()) {
        // Remove from old category
        await Category.findByIdAndUpdate(
          oldProduct.category,
          { $pull: { products: productId } }
        );
        // Add to new category
        await Category.findByIdAndUpdate(
          req.body.category,
          { $push: { products: productId } }
        );
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  }

  // DELETE /api/products/:id - Delete product
  async deleteProduct(req, res) {
    try {
      const productId = req.params.id;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Remove product from category
      if (product.category) {
        await Category.findByIdAndUpdate(
          product.category,
          { $pull: { products: productId } }
        );
      }

      await Product.findByIdAndDelete(productId);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });

    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting product',
        error: error.message
      });
    }
  }

  // GET /api/products/stats - Get product statistics
  async getProductStats(req, res) {
    try {
      const totalProducts = await Product.countDocuments();
      const activeProducts = await Product.countDocuments({ status: 'Show' });
      const featuredProducts = await Product.countDocuments({ featured: true });
      const outOfStock = await Product.countDocuments({ quantity: 0 });
      const lowStock = await Product.countDocuments({ quantity: { $gt: 0, $lte: 10 } });

      const categoryStats = await Product.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          totalProducts,
          activeProducts,
          featuredProducts,
          outOfStock,
          lowStock,
          categoryStats
        }
      });

    } catch (error) {
      console.error('Get product stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving product statistics',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();