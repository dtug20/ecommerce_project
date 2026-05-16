const Coupon = require('../../../model/Coupon');

module.exports = (register) => register({
  name: 'validateCoupon',
  description: 'Check if a coupon code is valid and what discount it would give. Read-only — does not apply the coupon.',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      cartTotal: { type: 'number' }
    },
    required: ['code']
  },
  requiresAuth: false,
  handler: async (args) => {
    const c = await Coupon.findOne({ couponCode: args.code.toUpperCase() }).lean();
    if (!c) return { valid: false, reason: 'not_found' };
    const now = new Date();
    if (c.status && c.status !== 'active') return { valid: false, reason: 'inactive' };
    if (c.startTime && new Date(c.startTime) > now) return { valid: false, reason: 'not_started' };
    if (c.endTime && new Date(c.endTime) < now) return { valid: false, reason: 'expired' };
    if (args.cartTotal != null && c.minimumAmount && args.cartTotal < c.minimumAmount) {
      return { valid: false, reason: 'below_minimum', minimumAmount: c.minimumAmount };
    }
    return {
      valid: true,
      code: c.couponCode,
      discountPercentage: c.discountPercentage,
      minimumAmount: c.minimumAmount,
      endsAt: c.endTime
    };
  }
});
