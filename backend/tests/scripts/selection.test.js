'use strict';
const { buildSelection, TARGETS } = require('../../scripts/data/build-selection');
const catalog = require('../../scripts/data/dummyjson-catalog.json');

it('selects the target count per vertical, no dupes, no excluded categories', () => {
  const sel = buildSelection(catalog);
  const byType = {};
  sel.forEach((s) => { byType[s.productType] = (byType[s.productType] || 0) + 1; });
  expect(byType).toEqual(TARGETS);
  const ids = sel.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(sel.every((s) => !['groceries', 'motorcycle', 'vehicle'].includes(s.category))).toBe(true);
  expect(sel.length).toBe(66);
});
