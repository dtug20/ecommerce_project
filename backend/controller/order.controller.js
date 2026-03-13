const { secret } = require("../config/secret");
const stripe = require("stripe")(secret.stripe_key);
const Order = require("../model/Order");
const { emitOrderCreated, emitOrderUpdated } = require("../utils/socketEmitter");

// create-payment-intent
exports.paymentIntent = async (req, res, next) => {
  try {
    const product = req.body;
    const price = Number(product.price);
    const amount = price * 100;
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      payment_method_types: ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
    next(error)
  }
};
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
