const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { body } = require('express-validator');

// Validation rules for creating product
const productCreateValidation = [
  body('title').notEmpty().withMessage('Product title is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('category').isMongoId().withMessage('Valid category ID is required')
];

// Validation rules for updating product (optional fields)
const productUpdateValidation = [
  body('title').optional({ checkFalsy: true }).notEmpty().withMessage('Product title cannot be empty'),
  body('description').optional({ checkFalsy: true }).notEmpty().withMessage('Product description cannot be empty'),
  body('price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('category').optional({ checkFalsy: true }).isMongoId().withMessage('Valid category ID is required')
];

// GET /api/products - Get all products
router.get('/', productController.getAllProducts);

// GET /api/products/stats - Get product statistics (before :id route)
router.get('/stats', productController.getProductStats);

// GET /api/products/:id - Get single product
router.get('/:id', productController.getProductById);

// POST /api/products - Create new product
router.post('/', productCreateValidation, productController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', productUpdateValidation, productController.updateProduct);

// DELETE /api/products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;