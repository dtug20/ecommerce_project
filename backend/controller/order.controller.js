const { secret } = require("../config/secret");
// const stripe = require("stripe")(secret.stripe_key); // STRIPE DISABLED
const Order = require("../model/Order");
const { emitOrderCreated, emitOrderUpdated } = require("../utils/socketEmitter");

// create-payment-intent - DISABLED (Stripe removed)
exports.paymentIntent = async (req, res, next) => {
  try {
    // Stripe payment intent creation disabled - only COD available
    return res.status(200).json({
      status: "success",
      message: "Stripe disabled - only Cash on Delivery available",
      clientSecret: null
    });
  } catch (error) {
    next(error)
  }
};
// addOrder — whitelist fields and enforce authenticated user
exports.addOrder = async (req, res, next) => {
  try {
    const { cart, name, address, email, contact, city, country, zipCode,
            subTotal, shippingCost, discount, totalAmount, shippingOption,
            cardInfo, paymentIntent, paymentMethod, orderNote } = req.body;

    // Validate required fields
    if (!cart || !name || !totalAmount || !paymentMethod) {
      return res.status(400).json({
        status: "fail",
        error: "Missing required order fields",
      });
    }

    // Stripe verification disabled - only COD payment supported
    if (paymentMethod !== "COD") {
      return res.status(400).json({
        status: "fail",
        error: "Only Cash on Delivery payment method is supported",
      });
    }

    const orderItems = await Order.create({
      user: req.user._id, // enforce authenticated user, not client-supplied
      cart, name, address, email, contact, city, country, zipCode,
      subTotal, shippingCost, discount, totalAmount, shippingOption,
      cardInfo, paymentIntent, paymentMethod, orderNote,
      status: "pending", // always start as pending
    });

    // Emit real-time update
    emitOrderCreated(orderItems);

    res.status(200).json({
      success: true,
      message: "Order added successfully",
      order: orderItems,
    });
  }
  catch (error) {
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

exports.updateOrderStatus = async (req, res, next) => {
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
