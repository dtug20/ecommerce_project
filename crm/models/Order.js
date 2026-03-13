const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const orderSchema = mongoose.Schema({
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  cart: [{}],
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  contact: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  subTotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: true,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingOption: {
    type: String,
    required: false
  },
  cardInfo: {
    type: Object,
    required: false
  },
  paymentIntent: {
    type: Object,
    required: false
  },
  paymentMethod: {
    type: String,
    required: true
  },
  orderNote: {
    type: String,
    required: false
  },
  invoice: {
    type: Number,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'delivered', 'cancel'],
    lowercase: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    lowercase: true
  },
  deliveryDate: Date,
  tax: Number,
  paymentStatus: String
}, {
  timestamps: true,
  collection: 'orders'
});

// Generate invoice number before saving
orderSchema.pre('save', async function(next) {
  const order = this;
  if (!order.invoice) {
    try {
      const highestInvoice = await mongoose
        .model('Order')
        .find({})
        .sort({ invoice: -1 })
        .limit(1);
      
      if (highestInvoice.length > 0) {
        order.invoice = highestInvoice[0].invoice + 1;
      } else {
        order.invoice = 1000;
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      order.invoice = 1000;
    }
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;