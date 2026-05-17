const Product = require('../../../model/Products');

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/**
 * Resolve a product by ObjectId, slug, or title (in that order).
 * The LLM occasionally passes a human-readable title in the productId field
 * when it forgot to capture the real id from search/recommend results, so we
 * try those fallbacks instead of letting Product.findById throw a CastError.
 */
async function resolveProduct(idOrName) {
  if (!idOrName) return null;
  const select = 'title price slug imageURLs quantity status';
  if (OBJECT_ID_RE.test(idOrName)) {
    const byId = await Product.findById(idOrName).select(select).lean();
    if (byId) return byId;
  }
  const bySlug = await Product.findOne({ slug: idOrName }).select(select).lean();
  if (bySlug) return bySlug;
  const escaped = String(idOrName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Product.findOne({ title: { $regex: `^${escaped}$`, $options: 'i' } })
    .select(select)
    .lean();
}

module.exports = (register) => register({
  name: 'proposeAddToCart',
  description:
    'Propose adding a product to the user\'s cart. This does NOT mutate the cart — it returns a confirmation card the user can click. Use this when the user expresses intent like "add it" or "yes, put it in my cart". The productId argument MUST be the `id` (24-char ObjectId) returned by searchProducts / recommendProducts / getProductDetails — never the product title.',
  parameters: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description:
          'The 24-char hex id returned in search/recommend results (preferred). Slug and exact title are accepted as fallbacks.'
      },
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
    const p = await resolveProduct(args.productId);
    if (!p) {
      return {
        error: 'not_found',
        message: `Could not find a product matching "${args.productId}". Call searchProducts first to get a real id, then retry.`
      };
    }
    if (p.status === 'out-of-stock' || p.quantity < qty) {
      return { error: 'insufficient_stock', available: p.quantity };
    }
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
