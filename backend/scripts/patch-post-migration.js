'use strict';
require('dotenv').config();
const path = require('path');
const { Products, Category, connect, disconnect, parseFlags } = require('./lib/db');
const { slugify } = require('./lib/mappings');
const { processImages } = require('./lib/images');

// Post-migration patches:
//   1. Resolve duplicate slugs by appending a 6-char _id suffix to all but the lowest-id duplicate.
//   2. Move 3 products misclassified by reclassifyExisting (English-rule on VN titles) to correct parents.
//   3. Retry image upload for products still pointing at the legacy shared image.
async function patch({ commit = false } = {}) {
  const result = { slug: 0, reclass: 0, reimaged: 0, retryFailed: 0 };
  const cats = await Category.find({}).lean();
  const catByParent = new Map(cats.map((c) => [c.parent, c]));

  // === 1) Duplicate slugs ===
  const dups = await Products.aggregate([
    { $group: { _id: '$slug', ids: { $push: '$_id' }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]);
  for (const d of dups) {
    if (!d._id) continue;
    const sorted = [...d.ids].map(String).sort();
    for (let i = 1; i < sorted.length; i += 1) {
      const idStr = sorted[i];
      const newSlug = `${d._id}-${idStr.slice(-6)}`;
      console.log(`slug: ${d._id} -> ${newSlug} on ${idStr}`);
      if (commit) await Products.updateOne({ _id: idStr }, { $set: { slug: newSlug } });
      result.slug += 1;
    }
  }

  // === 2) Misclassification fixes (manual mapping for VN titles) ===
  const moves = [
    { match: { title: /^Đồng Hồ Thông Minh Series/ }, toParent: 'Đồng hồ thông minh', toType: 'electronics', children: 'Apple Watch' },
    { match: { title: /^Loa Bluetooth Di Động/ }, toParent: 'Phụ kiện điện tử', toType: 'electronics', children: 'Loa' },
    { match: { title: /^Bông Tai Ngọc Trai/ }, toParent: 'Hoa tai', toType: 'jewelry', children: 'Vàng' },
  ];
  for (const m of moves) {
    const docs = await Products.find(m.match).lean();
    const target = catByParent.get(m.toParent);
    if (!target) { console.warn(`reclass: target category not found: ${m.toParent}`); continue; }
    for (const p of docs) {
      console.log(`reclass: ${p.title} -> ${m.toParent} (${m.toType})`);
      if (commit) {
        await Products.updateOne(
          { _id: p._id },
          { $set: { parent: m.toParent, productType: m.toType, children: m.children, category: { name: m.toParent, id: target._id } } },
        );
      }
      result.reclass += 1;
    }
  }

  // === 3) Retry image upload for products still on the legacy shared image ===
  const legacyImg = 'https://res.cloudinary.com/dfddeabbs/image/upload/v1774383778/shofy/products/nkqwzy38ifecfug7zqlr.png';
  const stuck = await Products.find({ img: legacyImg }).lean();
  const catalog = require('./data/dummyjson-catalog.json');
  const { mapDjToTaxonomy } = require('./lib/mappings');
  // Build parent -> rep images map (same logic as fix-existing.repImagesByParent).
  const reps = {};
  for (const dj of catalog) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    if (!tax || reps[tax.parent]) continue;
    reps[tax.parent] = [dj.thumbnail, ...(dj.images || [])].filter(Boolean).slice(0, 4);
  }
  const manifestPath = path.join(__dirname, 'data', 'image-manifest.json');
  for (const p of stuck) {
    const srcs = reps[p.parent] || [];
    if (!srcs.length) { console.warn(`image: no source images for parent ${p.parent} on ${p._id}`); continue; }
    try {
      const imgs = await processImages(srcs, `retry-${String(p._id)}`, { manifestPath });
      if (!imgs.length) { console.warn(`image: retry returned 0 for ${p._id}`); result.retryFailed += 1; continue; }
      console.log(`image: retried ${p._id} -> ${imgs.length} images`);
      if (commit) {
        const imageURLs = imgs.map((u) => ({ img: u, color: { name: 'Mặc định', clrCode: '#000000' }, sizes: p.sizes || [] }));
        await Products.updateOne({ _id: p._id }, { $set: { img: imgs[0], imageURLs } });
      }
      result.reimaged += 1;
    } catch (e) {
      console.error(`image: retry failed for ${p._id}: ${e.message}`);
      result.retryFailed += 1;
    }
  }

  return result;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    console.log(flags.commit ? '=== POST-MIGRATION PATCH (COMMIT) ===' : '=== POST-MIGRATION PATCH (dry-run) ===');
    const r = await patch({ commit: flags.commit });
    console.log('Result:', JSON.stringify(r, null, 1));
    await disconnect();
  })().catch((e) => { console.error('patch FAILED:', e.message); process.exit(1); });
}

module.exports = { patch };
