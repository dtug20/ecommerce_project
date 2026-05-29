'use strict';
const { Products, Category, connect, disconnect, parseFlags } = require('./lib/db');

async function resyncAggregates({ commit = true } = {}) {
  const cats = await Category.find({});
  let updated = 0;
  for (const c of cats) {
    const ids = await Products.find({ 'category.id': c._id }).distinct('_id');
    if (commit) { c.products = ids; await c.save(); }
    updated += 1;
  }
  if (commit) {
    await Products.updateMany({ quantity: { $lte: 0 } }, { $set: { status: 'out-of-stock' } });
    await Products.updateMany({ quantity: { $gt: 0 }, status: 'out-of-stock' }, { $set: { status: 'in-stock' } });
  }
  return { categories: updated };
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await resyncAggregates({ commit: flags.commit });
    console.log(flags.commit ? 'Resynced:' : '[dry-run] resync:', r);
    await disconnect();
  })().catch((e) => { console.error('resync FAILED:', e.message); process.exit(1); });
}

module.exports = { resyncAggregates };
