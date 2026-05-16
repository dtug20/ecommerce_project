module.exports = (register) => register({
  name: 'searchFAQ',
  description: 'Search published help articles and blog posts to answer policy or how-to questions.',
  parameters: {
    type: 'object',
    properties: {
      question: { type: 'string' }
    },
    required: ['question']
  },
  requiresAuth: false,
  handler: async (args) => {
    const rag = require('../ragSearch');
    const results = await rag.searchBlogsByVector(args.question, { limit: 5 });
    return {
      count: results.length,
      results: results.map((p) => ({ id: String(p._id), title: p.title, slug: p.slug, excerpt: p.excerpt, score: p.score }))
    };
  }
});
