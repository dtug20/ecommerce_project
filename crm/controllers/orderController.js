const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

class OrderController {
  
  // GET /api/orders - Get all orders with pagination and filters
  async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        paymentMethod,
        startDate,
        endDate,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      let query = {};
      
      // Apply filters
      if (status) query.orderStatus = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      if (search) {
        query.$or = [
          { invoice: !isNaN(search) ? parseInt(search) : -1 },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { trackingNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const orders = await Order.find(query)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments(query);
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
      console.error('Get orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving orders',
        error: error.message
      });
    }
  }

  // GET /api/orders/:id - Get single order
  async getOrderById(req, res) {
    try {
      const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone address');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });

    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving order',
        error: error.message
      });
    }
  }

  // POST /api/orders - Create new order
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const order = new Order(req.body);
      await order.save();

      // Add order to user's order list
      await User.findByIdAndUpdate(
        order.userId,
        { $push: { orders: order._id } }
      );

      // Update product sold count and reduce quantity
      for (const item of order.products) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              sold: item.quantity,
              sellCount: item.quantity,
              quantity: -item.quantity
            }
          }
        );
      }

      const populatedOrder = await Order.findById(order._id)
        .populate('userId', 'name email phone')
        .populate('products.productId', 'title img price');

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: populatedOrder
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating order',
        error: error.message
      });
    }
  }

  // PUT /api/orders/:id - Update order
  async updateOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const orderId = req.params.id;
      const oldOrder = await Order.findById(orderId);
      
      if (!oldOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // If order is being delivered, set delivery date
      if (req.body.orderStatus === 'delivered' && oldOrder.orderStatus !== 'delivered') {
        req.body.deliveryDate = new Date();
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        req.body,
        { new: true, runValidators: true }
      )
      .populate('userId', 'name email phone')
      .populate('products.productId', 'title img price');

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder
      });

    } catch (error) {
      console.error('Update order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating order',
        error: error.message
      });
    }
  }

  // DELETE /api/orders/:id - Delete order (Cancel order)
  async deleteOrder(req, res) {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check if order can be cancelled
      if (['shipped', 'delivered'].includes(order.orderStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel order that has been shipped or delivered'
        });
      }

      // Restore product quantities
      for (const item of order.products) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              sold: -item.quantity,
              sellCount: -item.quantity,
              quantity: item.quantity
            }
          }
        );
      }

      // Remove order from user's order list
      await User.findByIdAndUpdate(
        order.userId,
        { $pull: { orders: orderId } }
      );

      await Order.findByIdAndDelete(orderId);

      res.json({
        success: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      console.error('Delete order error:', error);
      res.status(500).json({
        success: false,
        message: 'Error cancelling order',
        error: error.message
      });
    }
  }

  // GET /api/orders/stats - Get order statistics
  async getOrderStats(req, res) {
    try {
      const totalOrders = await Order.countDocuments();
      const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
      const processingOrders = await Order.countDocuments({ orderStatus: 'processing' });
      const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
      const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
      const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });

      const paymentStats = await Order.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$finalAmount' }
          }
        }
      ]);

      const monthlyStats = await Order.aggregate([
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
            count: { $sum: 1 },
            totalRevenue: { $sum: '$finalAmount' },
            avgOrderValue: { $avg: '$finalAmount' }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        }
      ]);

      const topProducts = await Order.aggregate([
        { $unwind: '$products' },
        {
          $group: {
            _id: '$products.productId',
            totalQuantity: { $sum: '$products.quantity' },
            totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            productName: '$product.title',
            totalQuantity: 1,
            totalRevenue: 1
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          paymentStats,
          monthlyStats,
          topProducts
        }
      });

    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving order statistics',
        error: error.message
      });
    }
  }

  // PUT /api/orders/:id/status - Update order status only
  async updateOrderStatus(req, res) {
    try {
      const { status } = req.body;
      const orderId = req.params.id;

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { 
          orderStatus: status,
          ...(status === 'delivered' && { deliveryDate: new Date() })
        },
        { new: true }
      )
      .populate('userId', 'name email')
      .populate('products.productId', 'title');

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: updatedOrder
      });

    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating order status',
        error: error.message
      });
    }
  }
}

module.exports = new OrderController();