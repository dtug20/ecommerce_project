const { secret } = require("../config/secret");
const Order = require("../model/Order");
const { emitOrderCreated, emitOrderUpdated } = require("../utils/socketEmitter");

// addOrder
exports.addOrder = async (req, res, next) => {
  try {
    const orderItems = await Order.create(req.body);

    // Emit real-time update
    emitOrderCreated(orderItems);

    res.status(200).json({
      success: true,
      message: "Order added successfully",
      order: orderItems,
    });
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};
// get Orders
exports.getOrders = async (req, res, next) => {
  try {
    const orderItems = await Order.find({}).populate('user');
    res.status(200).json({
      success: true,
      data: orderItems,
    });
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};
// get Orders
exports.getSingleOrder = async (req, res, next) => {
  try {
    const orderItem = await Order.findById(req.params.id).populate('user');
    res.status(200).json(orderItem);
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};

exports.updateOrderStatus = async (req, res) => {
  const newStatus = req.body.status;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status: newStatus } },
      { new: true }
    ).populate('user');
    
    // Emit real-time update
    emitOrderUpdated(updatedOrder);
    
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updatedOrder
    });
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};
