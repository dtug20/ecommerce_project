const Product = require('../../../model/Products');

module.exports = (register) => register({
  name: 'searchProducts',
  description: 'Search the Shofy catalog by keyword and optional filters. Use when the user has specific criteria (category, brand, price range, color).',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Free-text search query' },
      filters: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          brand: { type: 'string' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          color: { type: 'string' },
          size: { type: 'string' },
          productType: { type: 'string' }
        }
      },
      limit: { type: 'number', description: 'Max results (default 10, max 20)' }
    },
    required: ['query']
  },
  requiresAuth: false,
  handler: async (args) => {
    const limit = Math.min(args.limit || 10, 20);
    const filters = args.filters || {};
    const q = {};
    if (args.query && args.query.trim()) {
      q.$or = [
        { title: { $regex: args.query.trim(), $options: 'i' } },
        { description: { $regex: args.query.trim(), $options: 'i' } },
        { tags: { $regex: args.query.trim(), $options: 'i' } }
      ];
    }
    if (filters.productType) q.productType = filters.productType;
    if (filters.minPrice != null || filters.maxPrice != null) {
      q.price = {};
      if (filters.minPrice != null) q.price.$gte = filters.minPrice;
      if (filters.maxPrice != null) q.price.$lte = filters.maxPrice;
    }
    if (filters.color) q['imageURLs.color.name'] = { $regex: filters.color, $options: 'i' };
    if (filters.size) q.sizes = { $regex: filters.size, $options: 'i' };
    q.status = { $ne: 'out-of-stock' };

    const items = await Product.find(q)
      .limit(limit)
      .select('title slug price discount quantity status imageURLs productType brand sellCount')
      .lean();

    return {
      count: items.length,
      items: items.map((p) => ({
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        price: p.price,
        discount: p.discount || 0,
        stock: p.quantity,
        status: p.status,
        image: p.imageURLs && p.imageURLs[0] && p.imageURLs[0].img,
        productType: p.productType
      }))
    };
  }
});
