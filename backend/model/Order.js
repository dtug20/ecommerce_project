const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cart: [{}],
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingOption: {
      type: String,
      required: false,
    },
    cardInfo: {
      type: Object,
      required: false,
    },
    paymentIntent: {
      type: Object,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    orderNote: {
      type: String,
      required: false,
    },
    invoice: {
      type: Number,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "cancel"],
      lowercase: true,
    },

    // Extended order fields
    orderNumber: { type: String, unique: true, sparse: true },
    tax: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "partially-refunded"],
      default: "unpaid",
    },
    paymentGateway: {
      type: String,
      enum: ["stripe", "paypal", "cod", "bank-transfer"],
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    refundAmount: { type: Number, default: 0 },
    trackingNumber: { type: String },
    carrier: { type: String },
    trackingUrl: { type: String },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    estimatedDelivery: { type: Date },
    splitOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    parentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        note: { type: String },
      },
    ],
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        title: { type: String, required: true },
        sku: { type: String },
        image: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        color: { type: String },
        size: { type: String },
        subtotal: { type: Number, required: true },
        vendorCommission: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// define pre-save middleware to generate the invoice number
orderSchema.pre('save', async function (next) {
  const order = this;
  if (!order.invoice) { // check if the order already has an invoice number
    try {
      // find the highest invoice number in the orders collection
      const highestInvoice = await mongoose
        .model('Order')
        .find({})
        .sort({ invoice: 'desc' })
        .limit(1)
        .select({ invoice: 1 });
      // if there are no orders in the collection, start at 1000
      const startingInvoice = highestInvoice.length === 0 ? 1000 : highestInvoice[0].invoice + 1;
      // set the invoice number for the new order
      order.invoice = startingInvoice;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ paymentMethod: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "items.vendor": 1 }, { sparse: true });
orderSchema.index({ trackingNumber: 1 }, { sparse: true });
orderSchema.index({ parentOrder: 1 }, { sparse: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
module.exports = Order;
