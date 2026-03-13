const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');

// Validation rules for user
const userValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin', 'staff']).withMessage('Invalid role')
];

const userUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin', 'staff']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status')
];

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/stats - Get user statistics (before :id route)
router.get('/stats', userController.getUserStats);

// GET /api/users/:id - Get single user
router.get('/:id', userController.getUserById);

// GET /api/users/:id/orders - Get user's orders
router.get('/:id/orders', userController.getUserOrders);

// POST /api/users - Create new user
router.post('/', userValidation, userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', userUpdateValidation, userController.updateUser);

// PUT /api/users/:id/status - Update user status only
router.put('/:id/status', 
  body('status').isIn(['active', 'inactive', 'blocked']).withMessage('Invalid status'),
  userController.updateUserStatus
);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;