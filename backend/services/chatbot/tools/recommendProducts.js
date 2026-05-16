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
    const rag = require('../ragSearch');
    const limit = Math.min(args.limit || 5, 10);
    const items = await rag.searchProductsByVector(args.intent, { limit });
    return {
      count: items.length,
      items: items.map((p) => ({
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        price: p.price,
        stock: p.quantity,
        image: p.imageURLs && p.imageURLs[0] && p.imageURLs[0].img,
        score: p.score
      }))
    };
  }
});
