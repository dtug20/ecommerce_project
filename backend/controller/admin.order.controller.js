const Order = require('../model/Order');
const Product = require('../model/Products');
const User = require('../model/User');

// GET /api/admin/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, paymentMethod,
      startDate, endDate, search, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      const invoiceNum = parseInt(search);
      if (!isNaN(invoiceNum)) {
        filter.invoice = invoiceNum;
      } else {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [data, totalItems] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email phone address'),
      Order.countDocuments(filter),
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

// GET /api/admin/orders/stats
exports.getOrderStats = async (req, res, next) => {
  try {
    const [statusCounts, monthlyStats, paymentStats] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
            total: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalOrders = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = statusCounts.reduce((sum, s) => sum + s.total, 0);

    res.json({
      success: true,
      data: { totalOrders, totalRevenue, statusCounts, monthlyStats, paymentStats },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone address');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/orders
exports.createOrder = async (req, res, next) => {
  try {
    const order = new Order(req.body);
    if (!order.status) order.status = 'pending';

    await order.save();

    // Update product quantities and sellCount
    if (order.cart && order.cart.length > 0) {
      for (const item of order.cart) {
        const productId = item.productId || item._id;
        const qty = item.orderQuantity || item.quantity || 1;
        if (productId) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { quantity: -qty, sellCount: qty },
          });
        }
      }
    }

    if (global.io) global.io.emit('order:created', order);

    res.status(201).json({ success: true, data: order, message: 'Order created successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/orders/:id
exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('user', 'name email phone address');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (global.io) global.io.emit('order:updated', order);

    res.json({ success: true, data: order, message: 'Order updated successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If cancelling, restore product quantities
    if (status === 'cancel' && order.status !== 'cancel') {
      if (order.cart && order.cart.length > 0) {
        for (const item of order.cart) {
          const productId = item.productId || item._id;
          const qty = item.orderQuantity || item.quantity || 1;
          if (productId) {
            await Product.findByIdAndUpdate(productId, {
              $inc: { quantity: qty, sellCount: -qty },
            });
          }
        }
      }
    }

    order.status = status;
    await order.save();

    if (global.io) global.io.emit('order:updated', order);

    res.json({ success: true, data: order, message: `Order status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/orders/:id
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a delivered order',
      });
    }

    // Restore product quantities if not already cancelled
    if (order.status !== 'cancel' && order.cart && order.cart.length > 0) {
      for (const item of order.cart) {
        const productId = item.productId || item._id;
        const qty = item.orderQuantity || item.quantity || 1;
        if (productId) {
          await Product.findByIdAndUpdate(productId, {
            $inc: { quantity: qty, sellCount: -qty },
          });
        }
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    if (global.io) global.io.emit('order:deleted', { _id: req.params.id });

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};
