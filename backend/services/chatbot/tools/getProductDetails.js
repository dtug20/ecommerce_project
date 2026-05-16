const Product = require('../../../model/Products');
const mongoose = require('mongoose');

module.exports = (register) => register({
  name: 'getProductDetails',
  description: 'Get full details for a single product by id or slug, including variants, stock, and a short review summary.',
  parameters: {
    type: 'object',
    properties: {
      productId: { type: 'string', description: 'Mongo ObjectId of the product' },
      slug: { type: 'string', description: 'URL slug of the product' }
    }
  },
  requiresAuth: false,
  handler: async (args) => {
    const q = {};
    if (args.productId && mongoose.isValidObjectId(args.productId)) q._id = args.productId;
    else if (args.slug) q.slug = args.slug;
    else return { product: null, error: 'missing_identifier' };

    const p = await Product.findOne(q)
      .select('title slug description price discount quantity status imageURLs sizes tags productType brand reviews variants weight dimensions')
      .populate('brand', 'name')
      .lean();
    if (!p) return { product: null, error: 'not_found' };

    return {
      product: {
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        discount: p.discount || 0,
        stock: p.quantity,
        status: p.status,
        productType: p.productType,
        brand: p.brand && p.brand.name,
        sizes: p.sizes || [],
        tags: p.tags || [],
        variantCount: (p.variants || []).length,
        reviewCount: (p.reviews || []).length,
        firstImage: p.imageURLs && p.imageURLs[0] && p.imageURLs[0].img
      }
    };
  }
});
