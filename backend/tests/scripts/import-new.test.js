'use strict';
const { startMem, stopMem } = require('./_mem');
const { Products, Category } = require('../../scripts/lib/db');
const { importCategories } = require('../../scripts/import-categories');
const { importBrands } = require('../../scripts/import-brands');
const { importNew } = require('../../scripts/import-new');

const fakeCatalog = [
  { id: 901, sku: 'PHN-901', title: 'Test Phone', description: 'd', category: 'smartphones', price: 500, discountPercentage: 5, stock: 10, rating: 4.9, weight: 1, tags: [], brand: 'Apple', thumbnail: 'https://cdn.dummyjson.com/t.webp', images: ['https://cdn.dummyjson.com/a.webp'] },
  { id: 902, sku: 'WAT-902', title: 'Test Watch', description: 'd', category: 'mens-watches', price: 200, discountPercentage: 0, stock: 0, rating: 4.0, weight: 1, tags: [], brand: null, thumbnail: 'https://cdn.dummyjson.com/w.webp', images: [] },
];

beforeAll(async () => {
  await startMem();
  await importCategories({ commit: true });
  await importBrands({ djBrandNames: ['Apple'], commit: true });
});
afterAll(async () => { await stopMem(); });

it('imports selected products, resolves refs, routes watch to jewelry, idempotent', async () => {
  const selection = [{ id: 901 }, { id: 902 }];
  const catalogById = new Map(fakeCatalog.map((p) => [p.id, p]));
  const translateFn = async (items) => new Map(items.map((i) => [i.sku, { title_vi: i.title + ' VI', description_vi: 'mo ta' }]));
  const processImagesFn = async (srcs, prefix) => [`https://res.cloudinary.com/dfddeabbs/${prefix}-0.webp`];

  const r1 = await importNew({ commit: true, selection, catalogById, translateFn, processImagesFn });
  const r2 = await importNew({ commit: true, selection, catalogById, translateFn, processImagesFn }); // idempotent
  expect(r1.inserted).toBe(2);
  expect(r2.inserted).toBe(0);

  const phone = await Products.findOne({ importId: 'dummyjson:901' });
  expect(phone.productType).toBe('electronics');
  expect(phone.price).toBe(12500000);              // 500*25000 rounded
  const watch = await Products.findOne({ importId: 'dummyjson:902' });
  expect(watch.parent).toBe('Đồng hồ');            // routed to jewelry (finding #6)
  expect(watch.productType).toBe('jewelry');
  expect(watch.status).toBe('out-of-stock');       // stock 0
  expect(watch.brand.name).toBe('Shofy Jewels');   // null brand -> house brand
});
