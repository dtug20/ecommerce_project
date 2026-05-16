const Order = require('../../../model/Order');
const mongoose = require('mongoose');

module.exports = (register) => register({
  name: 'getOrderStatus',
  description: 'Get the status, items, and tracking info for one specific order owned by the signed-in user.',
  parameters: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'Order ObjectId or invoice number' }
    },
    required: ['orderId']
  },
  requiresAuth: true,
  handler: async (args, ctx) => {
    const q = mongoose.isValidObjectId(args.orderId)
      ? { _id: args.orderId }
      : { invoice: Number(args.orderId) };
    const o = await Order.findOne(q).lean();
    if (!o) return { error: 'not_found' };
    if (String(o.user) !== String(ctx.userId)) return { error: 'forbidden' };
    return {
      order: {
        id: String(o._id),
        invoice: o.invoice,
        status: o.status,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        placedAt: o.createdAt,
        deliveredAt: o.deliveredAt,
        trackingNumber: o.trackingNumber,
        carrier: o.carrier,
        trackingUrl: o.trackingUrl,
        items: (o.cart || o.items || []).map((it) => ({
          title: it.title || it.name,
          qty: it.orderQuantity || it.qty || 1,
          price: it.price
        })),
        statusHistory: o.statusHistory || []
      }
    };
  }
});
