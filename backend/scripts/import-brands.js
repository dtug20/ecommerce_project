'use strict';
const { Brand, connect, disconnect, parseFlags } = require('./lib/db');
const { slugify, HOUSE_BRANDS } = require('./lib/mappings');

async function importBrands({ djBrandNames = [], commit = true } = {}) {
  const wanted = new Map(); // lc -> display
  for (const n of [...Object.values(HOUSE_BRANDS), ...djBrandNames]) {
    const name = (n || '').trim();
    if (!name) continue;
    if (!wanted.has(name.toLowerCase())) wanted.set(name.toLowerCase(), name);
  }
  let created = 0;
  for (const [lc, display] of wanted) {
    const existing = await Brand.findOne({ name: new RegExp(`^${display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (existing) continue;
    if (commit) await Brand.create({ name: display, status: 'active', slug: slugify(display) });
    created += 1;
  }
  return { created, total: wanted.size };
}

// Map lowercased brand name -> _id (string). Used by product importers.
importBrands.idByName = async function idByName() {
  const all = await Brand.find({}).lean();
  return new Map(all.map((b) => [b.name.toLowerCase(), String(b._id)]));
};

if (require.main === module) {
  (async () => {
    const flags = parseFlags();
    await connect();
    const cat = require('./data/dummyjson-catalog.json');
    const names = [...new Set(cat.map((p) => p.brand).filter(Boolean))];
    const r = await importBrands({ djBrandNames: names, commit: flags.commit });
    console.log(flags.commit ? 'Brands upserted:' : '[dry-run] would create:', r);
    await disconnect();
  })().catch((e) => { console.error('import-brands FAILED:', e.message); process.exit(1); });
}

module.exports = { importBrands };
