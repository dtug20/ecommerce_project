'use strict';
const { Category, connect, disconnect, parseFlags } = require('./lib/db');
const { CATEGORY_TREE, SOFT_DELETE_PARENTS, slugify } = require('./lib/mappings');

async function importCategories({ commit = true } = {}) {
  const result = { renamed: 0, created: 0, updated: 0, hidden: 0 };

  for (const node of CATEGORY_TREE) {
    const fields = {
      parent: node.parent,
      name: node.parent,
      productType: node.productType,
      children: node.children,
      slug: slugify(node.parent),
      status: 'Show',
      featured: !!node.featured,
      sortOrder: node.sortOrder,
      level: 0,
    };

    // 1) rename in place if an oldParent doc exists (preserve _id)
    let doc = node.oldParent ? await Category.findOne({ parent: node.oldParent }) : null;
    if (doc) {
      if (commit) { Object.assign(doc, fields); await doc.save(); }
      result.renamed += 1;
    } else {
      // 2) upsert by the new parent
      const existing = await Category.findOne({ parent: node.parent });
      if (existing) {
        if (commit) { Object.assign(existing, fields); await existing.save(); }
        result.updated += 1;
      } else {
        if (commit) await Category.create(fields);
        result.created += 1;
      }
    }
  }

  // 3) soft-delete merged-away + any leftover category not in the frozen tree
  const keep = new Set([
    ...CATEGORY_TREE.map((c) => c.parent),
    ...CATEGORY_TREE.map((c) => c.oldParent).filter(Boolean),
  ]);
  const toHide = await Category.find({ status: 'Show' });
  for (const c of toHide) {
    const inTree = CATEGORY_TREE.some((n) => n.parent === c.parent);
    if (!inTree && (SOFT_DELETE_PARENTS.includes(c.parent) || !keep.has(c.parent))) {
      if (commit) { c.status = 'Hide'; await c.save(); }
      result.hidden += 1;
    }
  }

  return result;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await importCategories({ commit: flags.commit });
    console.log(flags.commit ? 'Categories:' : '[dry-run] categories:', r);
    await disconnect();
  })().catch((e) => { console.error('import-categories FAILED:', e.message); process.exit(1); });
}

module.exports = { importCategories };
