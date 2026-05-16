const Order = require('../../../model/Order');

module.exports = (register) => register({
  name: 'getMyOrders',
  description: 'List recent orders for the currently signed-in user.',
  parameters: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max orders (default 5, max 20)' }
    }
  },
  requiresAuth: true,
  handler: async (args, ctx) => {
    const limit = Math.min(args.limit || 5, 20);
    const orders = await Order.find({ user: ctx.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('invoice status totalAmount paymentMethod createdAt deliveredAt trackingNumber carrier')
      .lean();
    return {
      orders: orders.map((o) => ({
        id: String(o._id),
        invoice: o.invoice,
        status: o.status,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        placedAt: o.createdAt,
        deliveredAt: o.deliveredAt,
        trackingNumber: o.trackingNumber,
        carrier: o.carrier
      }))
    };
  }
});
