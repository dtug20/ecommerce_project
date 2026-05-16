const Product = require('../../model/Products');
const BlogPost = require('../../model/BlogPost');
const embeddings = require('./embeddings');

async function searchProductsByVector(queryText, { limit = 10, filters = {} } = {}) {
  const vec = await embeddings.embedQuery(queryText);
  const pipeline = [
    {
      $vectorSearch: {
        index: 'products_vector_index',
        path: 'embedding',
        queryVector: vec,
        numCandidates: 100,
        limit: limit * 2
      }
    },
    { $match: { status: { $ne: 'out-of-stock' }, ...buildFilterMatch(filters) } },
    { $project: { title: 1, slug: 1, price: 1, quantity: 1, imageURLs: 1, sellCount: 1, productType: 1, score: { $meta: 'vectorSearchScore' } } },
    { $limit: limit }
  ];
  try {
    return await Product.aggregate(pipeline);
  } catch (e) {
    console.warn('[chatbot] vector search failed, falling back to text:', e.message);
    return Product.find({ $text: { $search: queryText }, status: { $ne: 'out-of-stock' } }).limit(limit).lean();
  }
}

async function searchBlogsByVector(queryText, { limit = 5 } = {}) {
  const vec = await embeddings.embedQuery(queryText);
  const pipeline = [
    {
      $vectorSearch: {
        index: 'blogposts_vector_index',
        path: 'embedding',
        queryVector: vec,
        numCandidates: 50,
        limit
      }
    },
    { $match: { status: 'published' } },
    { $project: { title: 1, slug: 1, excerpt: 1, score: { $meta: 'vectorSearchScore' } } }
  ];
  try {
    return await BlogPost.aggregate(pipeline);
  } catch (e) {
    console.warn('[chatbot] blog vector search failed:', e.message);
    return [];
  }
}

function buildFilterMatch(f) {
  const m = {};
  if (f.productType) m.productType = f.productType;
  if (f.minPrice != null || f.maxPrice != null) {
    m.price = {};
    if (f.minPrice != null) m.price.$gte = f.minPrice;
    if (f.maxPrice != null) m.price.$lte = f.maxPrice;
  }
  return m;
}

module.exports = { searchProductsByVector, searchBlogsByVector };
