const User = require('../model/User');
const Order = require('../model/Order');
const bcrypt = require('bcryptjs');
const keycloakService = require('../services/keycloak.service');

// GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, role, status,
      search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, totalItems] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
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

// GET /api/admin/users/stats
exports.getUserStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, roleStats, statusStats, monthlyRegistrations, topCustomers] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        User.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 12 },
        ]),
        Order.aggregate([
          { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
          { $sort: { totalSpent: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $project: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              totalSpent: 1,
              orderCount: 1,
            },
          },
        ]),
      ]);

    res.json({
      success: true,
      data: { totalUsers, activeUsers, roleStats, statusStats, monthlyRegistrations, topCustomers },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id/orders
exports.getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, totalItems] = await Promise.all([
      Order.find({ user: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments({ user: req.params.id }),
    ]);

    res.json({
      success: true,
      data: orders,
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

// POST /api/admin/users
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Create user in Keycloak first so they can actually log in
    const keycloakUserId = await keycloakService.createUser({
      username: email,
      email,
      firstName: name,
      enabled: true,
      emailVerified: true,
    });

    // Assign realm role in Keycloak (default to "user")
    const keycloakRole = role || 'user';
    try {
      await keycloakService.assignRealmRole(keycloakUserId, keycloakRole);
    } catch (roleErr) {
      console.error(`[Admin] Failed to assign Keycloak role '${keycloakRole}':`, roleErr.message);
      // Continue — user is created, role can be fixed later
    }

    // Set temporary password in Keycloak (user must change on first login)
    if (password) {
      await keycloakService.resetUserPassword(keycloakUserId, password, true);
    }

    // Create MongoDB record with keycloakId link
    const mongoBody = { ...req.body, keycloakId: keycloakUserId };
    delete mongoBody.password; // Password is managed by Keycloak, not MongoDB

    const user = await User.create(mongoBody);
    const userData = user.toObject();
    delete userData.password;

    if (global.io) global.io.emit('user:created', userData);

    res.status(201).json({ success: true, data: userData, message: 'User created successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const body = { ...req.body };

    // Check email uniqueness if changing
    if (body.email) {
      const existing = await User.findOne({ email: body.email.toLowerCase(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    // Hash password if provided
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
      .select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (global.io) global.io.emit('user:updated', user);

    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Sync enabled/disabled state to Keycloak
    if (user.keycloakId) {
      try {
        await keycloakService.setUserEnabled(user.keycloakId, status === 'active');
      } catch (kcErr) {
        console.error(`[Admin] Failed to sync status to Keycloak:`, kcErr.message);
      }
    }

    if (global.io) global.io.emit('user:updated', user);

    res.json({ success: true, data: user, message: `User status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const pendingOrders = await Order.countDocuments({
      user: req.params.id,
      status: { $in: ['pending', 'processing'] },
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user with ${pendingOrders} pending/processing orders`,
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Also delete from Keycloak
    if (user.keycloakId) {
      try {
        await keycloakService.deleteUser(user.keycloakId);
      } catch (kcErr) {
        console.error(`[Admin] Failed to delete user from Keycloak:`, kcErr.message);
      }
    }

    if (global.io) global.io.emit('user:deleted', { _id: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
