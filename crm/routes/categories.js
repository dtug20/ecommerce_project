const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { body } = require('express-validator');

// Validation rules for creating category
const categoryCreateValidation = [
  body('parent').notEmpty().withMessage('Category parent name is required'),
  body('productType').notEmpty().withMessage('Product type is required')
];

// Validation rules for updating category (optional fields)
const categoryUpdateValidation = [
  body('parent').optional().notEmpty().withMessage('Category parent name cannot be empty'),
  body('productType').optional().notEmpty().withMessage('Product type cannot be empty')
];

// GET /api/categories - Get all categories
router.get('/', categoryController.getAllCategories);

// GET /api/categories/stats - Get category statistics (before :id route)
router.get('/stats', categoryController.getCategoryStats);

// GET /api/categories/tree - Get category tree (before :id route)
router.get('/tree', categoryController.getCategoryTree);

// GET /api/categories/:id - Get single category
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - Create new category
router.post('/', categoryCreateValidation, categoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryUpdateValidation, categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;