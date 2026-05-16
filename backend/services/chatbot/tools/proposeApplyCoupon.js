module.exports = (register) => register({
  name: 'proposeApplyCoupon',
  description: 'Propose applying a coupon code at checkout. Returns a confirmation card for the user to click. Validate the coupon with validateCoupon FIRST before proposing it.',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      discountPercentage: { type: 'number' }
    },
    required: ['code']
  },
  requiresAuth: false,
  handler: async (args) => ({
    suggestedAction: {
      type: 'apply_coupon',
      payload: { code: args.code.toUpperCase(), discountPercentage: args.discountPercentage || null },
      label: `Apply coupon ${args.code.toUpperCase()}`
    }
  })
});
