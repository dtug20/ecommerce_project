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
    return textSearchProductsFallback(queryText, { limit, filters });
  }
}

/**
 * Token-OR regex search across title / parent / children / description / tags.
 * Used when $vectorSearch is unavailable (non-Atlas MongoDB).
 * If still empty, returns the most popular in-stock products as a soft fallback
 * so recommendProducts never silently returns 0 results.
 */
async function textSearchProductsFallback(queryText, { limit = 10, filters = {} } = {}) {
  const tokens = (queryText || '')
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const q = { status: { $ne: 'out-of-stock' }, ...buildFilterMatch(filters) };
  if (tokens.length > 0) {
    q.$or = tokens.flatMap((t) => [
      { title: { $regex: t, $options: 'i' } },
      { parent: { $regex: t, $options: 'i' } },
      { children: { $regex: t, $options: 'i' } },
      { description: { $regex: t, $options: 'i' } },
      { tags: { $regex: t, $options: 'i' } }
    ]);
  }

  let results = await Product.find(q)
    .limit(limit)
    .select('title slug price quantity imageURLs sellCount productType')
    .lean();

  if (results.length === 0) {
    // Soft fallback: return popular in-stock products so the assistant has
    // something useful to suggest instead of saying "nothing found".
    results = await Product.find({ status: { $ne: 'out-of-stock' }, ...buildFilterMatch(filters) })
      .sort({ sellCount: -1, createdAt: -1 })
      .limit(limit)
      .select('title slug price quantity imageURLs sellCount productType')
      .lean();
  }

  return results;
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
