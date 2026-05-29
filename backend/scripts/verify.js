'use strict';
const { Products, Category, Brand, connect, disconnect } = require('./lib/db');
const { PRODUCT_TYPES } = require('./lib/mappings');

async function runChecks() {
  const failures = [];
  const products = await Products.find({}).lean();
  const cats = await Category.find({}).lean();
  const brands = await Brand.find({}).lean();
  const catById = new Map(cats.map((c) => [String(c._id), c]));
  const brandIds = new Set(brands.map((b) => String(b._id)));
  const allowed = new Set(PRODUCT_TYPES);

  for (const p of products) {
    if (!allowed.has(p.productType)) failures.push(`orphan productType ${p.productType} on ${p._id}`);
    if (!/^https:\/\/res\.cloudinary\.com\/dfddeabbs\//.test(p.img || '')) failures.push(`bad img ${p._id}`);
    if (/cdn\.dummyjson\.com/.test(p.img || '')) failures.push(`dummyjson img leaked ${p._id}`);
    const c = p.category && catById.get(String(p.category.id));
    if (!c) failures.push(`unresolved category ${p._id}`);
    else {
      if (c.parent !== p.category.name) failures.push(`category name mismatch ${p._id}`);
      if (c.productType !== p.productType) failures.push(`productType!=category ${p._id} (${p.productType} vs ${c.productType})`);
    }
    if (!(p.brand && brandIds.has(String(p.brand.id)))) failures.push(`unresolved brand ${p._id}`);
    if (!['in-stock', 'out-of-stock', 'discontinued'].includes(p.status)) failures.push(`bad status ${p._id}`);
    if (p.price < 0) failures.push(`neg price ${p._id}`);
    if (p.quantity < 0) failures.push(`neg qty ${p._id}`);
    if (p.discount != null && (p.discount < 0 || p.discount > 100)) failures.push(`bad discount ${p._id}`);
  }
  const imgCount = {};
  products.forEach((p) => { imgCount[p.img] = (imgCount[p.img] || 0) + 1; });
  for (const [img, n] of Object.entries(imgCount)) if (n > 5) failures.push(`image shared by ${n}: ${img}`);
  for (const c of cats) {
    if (c.status === 'Hide') continue;
    const cnt = products.filter((p) => p.category && String(p.category.id) === String(c._id)).length;
    if ((c.products || []).length !== cnt) failures.push(`stale products[] on ${c.parent}: ${(c.products || []).length} vs ${cnt}`);
    if (!['Show', 'Hide'].includes(c.status)) failures.push(`bad cat status ${c.parent}`);
  }
  for (const key of ['importId', 'slug', 'sku']) {
    const vals = products.map((p) => p[key]).filter(Boolean);
    if (new Set(vals).size !== vals.length) failures.push(`duplicate ${key}`);
  }
  return { pass: failures.length === 0, failures, counts: { products: products.length, categories: cats.length, brands: brands.length } };
}

if (require.main === module) {
  (async () => {
    await connect();
    const r = await runChecks();
    console.log('Counts:', r.counts);
    if (r.pass) console.log('VERIFY PASS ✅');
    else { console.error('VERIFY FAIL ❌\n' + r.failures.map((f) => ' - ' + f).join('\n')); }
    await disconnect();
    process.exit(r.pass ? 0 : 1);
  })().catch((e) => { console.error('verify FAILED:', e.message); process.exit(1); });
}

module.exports = { runChecks };
