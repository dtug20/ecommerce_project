const SiteSetting = require('../../../model/SiteSetting');

module.exports = (register) => register({
  name: 'getShippingPolicy',
  description: 'Return the current shipping policy text and shipping rates from site settings.',
  parameters: { type: 'object', properties: {} },
  requiresAuth: false,
  handler: async () => {
    const s = await SiteSetting.findOne({}).lean();
    if (!s) return { policy: null };
    return {
      policy: s.shippingPolicy || s.shipping || null,
      rates: s.shippingRates || []
    };
  }
});
