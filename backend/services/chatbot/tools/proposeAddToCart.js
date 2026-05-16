const Product = require('../../../model/Products');

module.exports = (register) => register({
  name: 'proposeAddToCart',
  description: 'Propose adding a product to the user\'s cart. This does NOT mutate the cart — it returns a confirmation card the user can click. Use this when the user expresses intent like "add it" or "yes, put it in my cart".',
  parameters: {
    type: 'object',
    properties: {
      productId: { type: 'string' },
      qty: { type: 'number', description: 'Quantity (default 1)' },
      variant: {
        type: 'object',
        properties: {
          color: { type: 'string' },
          size: { type: 'string' }
        }
      }
    },
    required: ['productId']
  },
  requiresAuth: false,
  handler: async (args) => {
    const qty = args.qty && args.qty > 0 ? args.qty : 1;
    const p = await Product.findById(args.productId).select('title price slug imageURLs quantity status').lean();
    if (!p) return { error: 'not_found' };
    if (p.status === 'out-of-stock' || p.quantity < qty) return { error: 'insufficient_stock', available: p.quantity };
    return {
      suggestedAction: {
        type: 'add_to_cart',
        payload: {
          productId: String(p._id),
          title: p.title,
          slug: p.slug,
          price: p.price,
          qty,
          variant: args.variant || null,
          image: p.imageURLs && p.imageURLs[0] && p.imageURLs[0].img
        },
        label: `Add ${qty} × ${p.title} to cart`
      }
    };
  }
});
