'use strict';
const path = require('path');
const { Products, Category, mongoose, connect, disconnect, parseFlags } = require('./lib/db');
const { importBrands } = require('./import-brands');
const { translateProducts } = require('./lib/translate');
const { processImages } = require('./lib/images');
const { buildProductDoc } = require('./lib/build-product');
const { mapDjToTaxonomy, HOUSE_BRANDS } = require('./lib/mappings');

async function importNew({ commit = true, selection, catalogById, translateFn, processImagesFn, manifestPath, translationsPath } = {}) {
  selection = selection || require('./data/selection.json');
  catalogById = catalogById || new Map(require('./data/dummyjson-catalog.json').map((p) => [p.id, p]));
  const cats = await Category.find({}).lean();
  const catIdByParent = new Map(cats.map((c) => [c.parent, c._id]));
  const brandIdByName = await importBrands.idByName();

  const djItems = selection.map((s) => catalogById.get(s.id)).filter(Boolean);
  const items = djItems.map((d) => ({ sku: d.sku, title: d.title, description: d.description }));
  const tr = translateFn ? await translateFn(items) : await translateProducts(items, { cachePath: translationsPath });
  const proc = processImagesFn || processImages;

  const out = { inserted: 0, updated: 0, skipped: 0 };
  for (const dj of djItems) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    const categoryId = tax && catIdByParent.get(tax.parent);
    if (!tax || !categoryId) { out.skipped += 1; continue; }

    let brandName = (dj.brand && String(dj.brand).trim()) || HOUSE_BRANDS[tax.productType];
    let brandId = brandIdByName.get(String(brandName).toLowerCase());
    if (!brandId) { brandName = HOUSE_BRANDS[tax.productType]; brandId = brandIdByName.get(brandName.toLowerCase()); }

    const imgs = await proc([dj.thumbnail, ...(dj.images || [])], `dj-${String(dj.sku || dj.id).toLowerCase()}`, { manifestPath });
    if (!imgs.length) { out.skipped += 1; continue; } // img is REQUIRED

    const doc = buildProductDoc(dj, { importId: `dummyjson:${dj.id}`, categoryId, brandName, brandId, translation: tr.get(dj.sku), images: imgs, taxonomy: tax });
    if (commit) {
      const res = await Products.updateOne({ importId: doc.importId }, { $set: doc, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      if (res.upsertedCount) out.inserted += 1; else out.updated += 1;
    } else out.inserted += 1;
  }
  return out;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await importNew({ commit: flags.commit, manifestPath: path.join(__dirname, 'data', 'image-manifest.json'), translationsPath: path.join(__dirname, 'data', 'translations.cache.json') });
    console.log(flags.commit ? 'Imported new:' : '[dry-run] would import:', r);
    await disconnect();
  })().catch((e) => { console.error('import-new FAILED:', e.message); process.exit(1); });
}

module.exports = { importNew };
