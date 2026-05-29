'use strict';
const fs = require('fs');
const path = require('path');
const { mapDjToTaxonomy } = require('../lib/mappings');

const TARGETS = { electronics: 6, fashion: 9, beauty: 8, jewelry: 10, home: 17, sports: 16 };

function buildSelection(catalog) {
  // group catalog by destination productType (deterministic: sort by DJ id)
  const byType = {};
  for (const dj of [...catalog].sort((a, b) => a.id - b.id)) {
    const tax = mapDjToTaxonomy(dj.category, dj);
    if (!tax) continue;
    (byType[tax.productType] = byType[tax.productType] || []).push(dj);
  }
  const selection = [];
  for (const [type, n] of Object.entries(TARGETS)) {
    const pool = byType[type] || [];
    if (pool.length < n) throw new Error(`Not enough source products for ${type}: have ${pool.length}, need ${n}`);
    for (const dj of pool.slice(0, n)) selection.push({ id: dj.id, sku: dj.sku, category: dj.category, productType: type });
  }
  return selection;
}

if (require.main === module) {
  const catalog = require('./dummyjson-catalog.json');
  const sel = buildSelection(catalog);
  fs.writeFileSync(path.join(__dirname, 'selection.json'), JSON.stringify(sel, null, 1));
  console.log(`Wrote selection.json: ${sel.length} products`);
}

module.exports = { buildSelection, TARGETS };
