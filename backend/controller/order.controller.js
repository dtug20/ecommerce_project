const dayjs = require('dayjs');
const { secret } = require("../config/secret");
const Order = require("../model/Order");
const Product = require("../model/Products");
const Coupon = require("../model/Coupon");
const { emitOrderCreated, emitOrderUpdated } = require("../utils/socketEmitter");
const PaymentService = require("../services/paymentService");
const { sendTemplatedEmail } = require("../utils/emailService");

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
    const {
      cart, name, address, email, contact, city, country, zipCode,
      subTotal, shippingCost, discount, totalAmount, shippingOption,
      cardInfo, paymentIntent, paymentMethod, orderNote,
    } = req.body;

    // Validate required fields
    if (!cart || !name || !totalAmount || !paymentMethod) {
      return res.status(400).json({
        status: "fail",
        error: "Missing required order fields",
      });
    }

    // Process payment via PaymentService
    const paymentResult = await PaymentService.processPayment(
      { totalAmount, cart, name, email },
      paymentMethod,
      req.body.paymentData || {}
    );

    // For unimplemented gateways (VNPay, MoMo, Stripe) that return success:false,
    // reject the order rather than create it with a failed payment status
    if (!paymentResult.success && !['COD', 'bank-transfer'].includes(paymentMethod)) {
      return res.status(400).json({
        status: "fail",
        error: paymentResult.error || "Payment processing failed",
      });
    }

    // Validate coupon (if provided) and record usage
    let resolvedDiscount = discount || 0;
    let appliedCoupon = null;

    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({
        couponCode: { $regex: `^${req.body.couponCode}$`, $options: 'i' },
        status: 'active',
      });

      if (coupon) {
        const now = new Date();
        const withinDates =
          (!coupon.startTime || now >= coupon.startTime) &&
          (!coupon.endTime || now <= coupon.endTime);
        const withinUsageLimit =
          coupon.usageLimit == null || coupon.usageCount < coupon.usageLimit;
        const userUsage = req.user
          ? coupon.usedBy.filter((u) => u.userId.toString() === req.user._id.toString()).length
          : 0;
        const withinPerUserLimit =
          coupon.perUserLimit == null || userUsage < coupon.perUserLimit;

        if (withinDates && withinUsageLimit && withinPerUserLimit) {
          await Coupon.findByIdAndUpdate(coupon._id, {
            $inc: { usageCount: 1 },
            $push: {
              usedBy: {
                userId: req.user._id,
                usedAt: now,
              },
            },
          });
          appliedCoupon = coupon.couponCode;
        }
      }
    }

    const orderItems = await Order.create({
      user: req.user._id,
      cart, name, address, email, contact, city, country, zipCode,
      subTotal, shippingCost, discount: resolvedDiscount, totalAmount, shippingOption,
      cardInfo, paymentIntent, paymentMethod, orderNote,
      status: "pending",
      paymentGateway: paymentResult.paymentGateway || paymentMethod.toLowerCase(),
      paymentStatus: paymentResult.paymentStatus || 'unpaid',
      transactionId: paymentResult.transactionId || null,
    });

    // Deduct stock for each cart item
    for (const item of cart) {
      const quantityToDeduct = item.orderQuantity || 1;
      
      if (item.selectedVariant && item.selectedVariant.sku) {
        await Product.updateOne(
          { _id: item._id, "variants.sku": item.selectedVariant.sku },
          { $inc: { "variants.$.stock": -quantityToDeduct } }
        );
      } else {
        await Product.updateOne(
          { _id: item._id },
          { $inc: { quantity: -quantityToDeduct } }
        );
      }
    }

    // Emit real-time update
    emitOrderCreated(orderItems);

    // Fire-and-forget order confirmation email
    sendTemplatedEmail('order-confirmation', email, {
      customerName: name,
      orderNumber: orderItems.orderNumber || `#${orderItems.invoice}`,
      orderTotal: `$${totalAmount}`,
      orderDate: dayjs().format('YYYY-MM-DD'),
      itemsHtml: (cart || [])
        .map(
          (item) =>
            `<li>${item.title} x${item.orderQuantity || item.quantity || 1} — $${item.price}</li>`
        )
        .join(''),
      shippingAddress: `${address}, ${city}, ${country} ${zipCode}`,
    }).catch((err) => console.error('[email] order-confirmation send error:', err.message));

    res.status(200).json({
      success: true,
      message: "Order added successfully",
      order: orderItems,
      ...(paymentResult.bankDetails && { bankDetails: paymentResult.bankDetails }),
      ...(appliedCoupon && { appliedCoupon }),
    });
  } catch (error) {
    next(error);
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
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// get single Order
exports.getSingleOrder = async (req, res, next) => {
  try {
    const orderItem = await Order.findById(req.params.id).populate('user');
    res.status(200).json(orderItem);
  } catch (error) {
    console.log(error);
    next(error);
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
      data: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
