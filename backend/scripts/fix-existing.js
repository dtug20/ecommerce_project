'use strict';
const path = require('path');
const { Products, Category, connect, disconnect, parseFlags } = require('./lib/db');
const { importBrands } = require('./import-brands');
const { translateProducts } = require('./lib/translate');
const { processImages } = require('./lib/images');
const { mapDjToTaxonomy, reclassifyExisting, brandFixFor, isVnSpecial, sizesForType, HOUSE_BRANDS } = require('./lib/mappings');

// Build parent -> representative image URLs from the DummyJSON catalog.
function repImagesByParent(catalog) {
  const map = {};
  for (const dj of catalog) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    if (!tax || map[tax.parent]) continue;
    map[tax.parent] = [dj.thumbnail, ...(dj.images || [])].filter(Boolean).slice(0, 4);
  }
  return map;
}

async function fixExisting({ commit = true, translateFn, processImagesFn, manifestPath, translationsPath, catalog } = {}) {
  catalog = catalog || require('./data/dummyjson-catalog.json');
  const reps = repImagesByParent(catalog);
  const cats = await Category.find({}).lean();
  const catIdByParent = new Map(cats.map((c) => [c.parent, c._id]));
  const brandIdByName = await importBrands.idByName();
  const originals = await Products.find({ importId: { $exists: false } }).lean();

  const items = originals.map((p) => ({ sku: p.sku || String(p._id), title: p.title, description: p.description }));
  const tr = translateFn ? await translateFn(items) : await translateProducts(items, { cachePath: translationsPath });
  const proc = processImagesFn || processImages;

  const out = { fixed: 0, skipped: 0 };
  for (const p of originals) {
    const reclass = reclassifyExisting({ title: p.title, parent: p.parent, productType: p.productType, brandName: p.brand && p.brand.name });
    const categoryId = reclass && catIdByParent.get(reclass.parent);
    if (!reclass || !categoryId) { out.skipped += 1; continue; }

    let brandName = brandFixFor({ title: p.title, productType: reclass.productType, brandName: p.brand && p.brand.name })
      || (p.brand && p.brand.name) || HOUSE_BRANDS[reclass.productType];
    let brandId = brandIdByName.get(String(brandName).toLowerCase());
    if (!brandId) { brandName = HOUSE_BRANDS[reclass.productType]; brandId = brandIdByName.get(brandName.toLowerCase()); }

    const sizes = sizesForType(reclass.productType, reclass.parent);
    const imgs = await proc(reps[reclass.parent] || [], `fix-${String(p._id)}`, { manifestPath });
    const t = tr.get(p.sku || String(p._id)) || {};
    const vn = isVnSpecial(p.title);

    const update = {
      productType: reclass.productType,
      parent: reclass.parent,
      children: reclass.children,
      category: { name: reclass.parent, id: categoryId },
      brand: { name: brandName, id: brandId },
      title: vn ? p.title : (t.title_vi || p.title),
      description: t.description_vi || p.description,
      sizes,
    };
    if (imgs.length) {
      update.img = imgs[0];
      update.imageURLs = imgs.map((u) => ({ img: u, color: { name: 'Mặc định', clrCode: '#000000' }, sizes }));
    }
    if (commit) await Products.updateOne({ _id: p._id }, { $set: update });
    out.fixed += 1;
  }
  return out;
}

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const r = await fixExisting({ commit: flags.commit, manifestPath: path.join(__dirname, 'data', 'image-manifest.json'), translationsPath: path.join(__dirname, 'data', 'translations.cache.json') });
    console.log(flags.commit ? 'Fixed existing:' : '[dry-run] would fix:', r);
    await disconnect();
  })().catch((e) => { console.error('fix-existing FAILED:', e.message); process.exit(1); });
}

module.exports = { fixExisting, repImagesByParent };
