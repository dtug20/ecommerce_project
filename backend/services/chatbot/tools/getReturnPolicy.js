const SiteSetting = require('../../../model/SiteSetting');

module.exports = (register) => register({
  name: 'getReturnPolicy',
  description: 'Return the return/refund policy from site settings.',
  parameters: { type: 'object', properties: {} },
  requiresAuth: false,
  handler: async () => {
    const s = await SiteSetting.findOne({}).lean();
    if (!s) return { policy: null };
    return { policy: s.returnPolicy || null, windowDays: s.returnWindowDays || 30 };
  }
});
