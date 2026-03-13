const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { body } = require('express-validator');

// Validation rules for creating order
const orderCreateValidation = [
  body('user').isMongoId().withMessage('Valid user ID is required'),
  body('cart').isArray({ min: 1 }).withMessage('At least one product is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('contact').notEmpty().withMessage('Contact is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required'),
  body('subTotal').isFloat({ min: 0 }).withMessage('Subtotal must be positive'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be positive'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
];

// Validation rules for updating order (optional fields)
const orderUpdateValidation = [
  body('user').optional().isMongoId().withMessage('Valid user ID is required'),
  body('cart').optional().isArray({ min: 1 }).withMessage('At least one product is required'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('address').optional().notEmpty().withMessage('Address cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('contact').optional().notEmpty().withMessage('Contact cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('country').optional().notEmpty().withMessage('Country cannot be empty'),
  body('zipCode').optional().notEmpty().withMessage('Zip code cannot be empty'),
  body('subTotal').optional().isFloat({ min: 0 }).withMessage('Subtotal must be positive'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('Total amount must be positive')
];

// GET /api/orders - Get all orders
router.get('/', orderController.getAllOrders);

// GET /api/orders/stats - Get order statistics (before :id route)
router.get('/stats', orderController.getOrderStats);

// GET /api/orders/:id - Get single order
router.get('/:id', orderController.getOrderById);

// POST /api/orders - Create new order
router.post('/', orderCreateValidation, orderController.createOrder);

// PUT /api/orders/:id - Update order
router.put('/:id', orderUpdateValidation, orderController.updateOrder);

// PUT /api/orders/:id/status - Update order status only
router.put('/:id/status', 
  body('status').isIn(['pending', 'processing', 'delivered', 'cancel'])
    .withMessage('Invalid order status'),
  orderController.updateOrderStatus
);

// DELETE /api/orders/:id - Delete/Cancel order
router.delete('/:id', orderController.deleteOrder);

module.exports = router;