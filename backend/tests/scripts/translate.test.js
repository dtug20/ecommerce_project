'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { translateProducts } = require('../../scripts/lib/translate');

const items = [
  { sku: 'A1', title: 'Red Dress', description: 'A red dress' },
  { sku: 'B2', title: 'Blue Hat', description: 'A blue hat' },
];

it('translates via injected callGemini, matches by sku, and caches (idempotent)', async () => {
  const cachePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tr-')), 'cache.json');
  let calls = 0;
  const callGemini = async (batch) => { calls += 1; return batch.map((b) => ({ sku: b.sku, title_vi: b.title + ' VI', description_vi: b.description + ' VI' })); };
  const r1 = await translateProducts(items, { cachePath, callGemini, batchSize: 10 });
  expect(r1.get('A1').title_vi).toBe('Red Dress VI');
  const r2 = await translateProducts(items, { cachePath, callGemini, batchSize: 10 }); // cache hit
  expect(calls).toBe(1);                       // not called again
  expect(r2.get('B2').description_vi).toBe('A blue hat VI');
});

it('falls back to English on batch failure without caching the fallback', async () => {
  const cachePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tr-')), 'cache.json');
  const callGemini = async () => { throw new Error('429'); };
  const r = await translateProducts(items, { cachePath, callGemini, batchSize: 10 });
  expect(r.get('A1').title_vi).toBe('Red Dress');     // English fallback
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  expect(cache.A1).toBeUndefined();                   // fallback NOT cached
});
