const User = require('../models/User');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

class UserController {
  
  // GET /api/users - Get all users with pagination and filters
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        status,
        emailVerified,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      let query = {};
      
      // Apply filters
      if (role) query.role = role;
      if (status) query.status = status;
      if (emailVerified !== undefined) query.emailVerified = emailVerified === 'true';
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const users = await User.find(query)
        .select('-password') // Exclude password from results
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving users',
        error: error.message
      });
    }
  }

  // GET /api/users/:id - Get single user
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id)
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user',
        error: error.message
      });
    }
  }

  // POST /api/users - Create new user
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const user = new User(req.body);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userResponse
      });

    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }

  // PUT /api/users/:id - Update user
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const userId = req.params.id;
      
      // If password is being updated, it will be hashed by the pre-save middleware
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        req.body,
        { new: true, runValidators: true }
      )
      .select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update user error:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  }

  // DELETE /api/users/:id - Delete user
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has pending orders
      const pendingOrders = await Order.countDocuments({
        userId: userId,
        orderStatus: { $in: ['pending', 'confirmed', 'processing', 'shipped'] }
      });

      if (pendingOrders > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete user with ${pendingOrders} pending order(s). Please complete or cancel orders first.`
        });
      }

      await User.findByIdAndDelete(userId);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  }

  // GET /api/users/stats - Get user statistics
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: 'active' });
      const verifiedUsers = await User.countDocuments({ emailVerified: true });
      const adminUsers = await User.countDocuments({ role: 'admin' });
      const staffUsers = await User.countDocuments({ role: 'staff' });

      const roleStats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusStats = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const monthlyRegistrations = await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        }
      ]);

      const topCustomers = await User.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'userId',
            as: 'userOrders'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            totalOrders: { $size: '$userOrders' },
            totalSpent: {
              $sum: '$userOrders.finalAmount'
            }
          }
        },
        {
          $match: { totalOrders: { $gt: 0 } }
        },
        {
          $sort: { totalSpent: -1 }
        },
        {
          $limit: 10
        }
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          verifiedUsers,
          adminUsers,
          staffUsers,
          roleStats,
          statusStats,
          monthlyRegistrations,
          topCustomers
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user statistics',
        error: error.message
      });
    }
  }

  // PUT /api/users/:id/status - Update user status only
  async updateUserStatus(req, res) {
    try {
      const { status } = req.body;
      const userId = req.params.id;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { status },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user status',
        error: error.message
      });
    }
  }

  // GET /api/users/:id/orders - Get user's orders
  async getUserOrders(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const userId = req.params.id;

      const skip = (page - 1) * parseInt(limit);

      const orders = await Order.find({ userId })
        .populate('products.productId', 'title img price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments({ userId });
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user orders',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();