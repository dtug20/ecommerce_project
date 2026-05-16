const BlogPost = require('../../../model/BlogPost');

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
    const q = {
      status: 'published',
      $or: [
        { title: { $regex: args.question, $options: 'i' } },
        { content: { $regex: args.question, $options: 'i' } },
        { tags: { $regex: args.question, $options: 'i' } }
      ]
    };
    const posts = await BlogPost.find(q)
      .limit(5)
      .select('title slug excerpt')
      .lean();
    return {
      count: posts.length,
      results: posts.map((p) => ({ id: String(p._id), title: p.title, slug: p.slug, excerpt: p.excerpt }))
    };
  }
});
