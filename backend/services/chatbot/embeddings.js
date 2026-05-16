const llm = require('./llmProvider');

function productToText(p) {
  return [
    p.title || '',
    p.productType ? `Type: ${p.productType}.` : '',
    p.parent ? `Category: ${p.parent}.` : '',
    p.brand && p.brand.name ? `Brand: ${p.brand.name}.` : '',
    p.tags && p.tags.length ? `Tags: ${p.tags.join(', ')}.` : '',
    p.description ? p.description.slice(0, 1500) : ''
  ].filter(Boolean).join(' ');
}

function blogPostToText(b) {
  return [
    b.title || '',
    b.excerpt || '',
    b.tags && b.tags.length ? `Tags: ${b.tags.join(', ')}.` : '',
    b.content ? b.content.replace(/<[^>]*>/g, ' ').slice(0, 1500) : ''
  ].filter(Boolean).join(' ');
}

async function embedProduct(p) { return llm.embed(productToText(p)); }
async function embedBlogPost(b) { return llm.embed(blogPostToText(b)); }
async function embedQuery(q) { return llm.embed(q); }

module.exports = { embedProduct, embedBlogPost, embedQuery, productToText, blogPostToText };
