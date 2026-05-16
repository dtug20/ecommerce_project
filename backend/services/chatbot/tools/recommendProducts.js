const Product = require('../../../model/Products');

module.exports = (register) => register({
  name: 'recommendProducts',
  description: 'Recommend products based on a fuzzy intent like "gift for mom" or "something for camping". Use this when the user\'s request is open-ended.',
  parameters: {
    type: 'object',
    properties: {
      intent: { type: 'string', description: 'User intent in natural language' },
      limit: { type: 'number' }
    },
    required: ['intent']
  },
  requiresAuth: false,
  handler: async (args) => {
    const limit = Math.min(args.limit || 5, 10);
    const terms = (args.intent || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const q = terms.length
      ? { $or: terms.map((t) => ({
          $or: [{ title: { $regex: t, $options: 'i' } }, { tags: { $regex: t, $options: 'i' } }]
        })) }
      : {};
    q.status = { $ne: 'out-of-stock' };
    const items = await Product.find(q)
      .sort({ sellCount: -1, featured: -1 })
      .limit(limit)
      .select('title slug price quantity imageURLs sellCount')
      .lean();
    return {
      count: items.length,
      items: items.map((p) => ({
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        price: p.price,
        stock: p.quantity,
        image: p.imageURLs && p.imageURLs[0] && p.imageURLs[0].img
      }))
    };
  }
});
