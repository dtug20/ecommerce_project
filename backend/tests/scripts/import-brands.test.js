'use strict';
const { startMem, stopMem } = require('./_mem');
const { Brand } = require('../../scripts/lib/db');
const { importBrands } = require('../../scripts/import-brands');

beforeAll(async () => { await startMem(); await Brand.create({ name: 'Apple', status: 'active' }); });
afterAll(async () => { await stopMem(); });

it('upserts real + house brands idempotently (no dupes, reuses existing)', async () => {
  const names = ['Apple', 'Essence', null, 'essence']; // null + dup-by-case
  const r1 = await importBrands({ djBrandNames: names });
  const r2 = await importBrands({ djBrandNames: names }); // second run = no-op
  const all = await Brand.find({});
  const lc = all.map((b) => b.name.toLowerCase());
  expect(new Set(lc).size).toBe(lc.length);          // unique
  expect(lc).toContain('apple');
  expect(lc).toContain('essence');
  expect(lc).toContain('shofy home');                // house brands present
  expect(r2.created).toBe(0);                         // idempotent
  const idByName = await importBrands.idByName();
  expect(idByName.get('apple')).toBeTruthy();
});
