const fs = require('fs'); const os = require('os'); const path = require('path');
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products } = require('../../scripts/lib/db');
const { runMigration } = require('../../scripts/migrate');

const fakeCatalog = [
  { id: 901, sku: 'PHN-901', title: 'Test Phone', description: 'd', category: 'smartphones', price: 500, discountPercentage: 5, stock: 10, rating: 4.9, weight: 1, tags: [], brand: 'Apple', thumbnail: 'https://cdn.dummyjson.com/t.webp', images: ['https://cdn.dummyjson.com/a.webp'] },
];

beforeAll(async () => {
  await startMem();
  await Products.create({ title: 'Gaming Headphone', img: 'https://res.cloudinary.com/dfddeabbs/shared.png', unit: '1pc', parent: 'Headphones', children: 'Kids Headphones', price: 5, quantity: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Logitech', id: new mongoose.Types.ObjectId() }, category: { name: 'Headphones', id: new mongoose.Types.ObjectId() } });
});
afterAll(async () => { await stopMem(); });

it('runs the full pipeline with --commit and ends with a passing verify', async () => {
  const deps = {
    commit: true,
    backupDir: fs.mkdtempSync(path.join(os.tmpdir(), 'mg-')),
    selection: [{ id: 901 }],
    catalogById: new Map(fakeCatalog.map((p) => [p.id, p])),
    translateFn: async (items) => new Map(items.map((i) => [i.sku || i.title, { title_vi: i.title + ' VI', description_vi: 'mo ta' }])),
    processImagesFn: async (srcs, prefix) => [`https://res.cloudinary.com/dfddeabbs/${prefix}-0.webp`],
    djBrandNames: ['Apple'],
  };
  const r = await runMigration(deps);
  expect(r.verify.pass).toBe(true);
  expect(await Products.findOne({ importId: 'dummyjson:901' })).toBeTruthy();
  const head = await Products.findOne({ title: /Gaming/ });
  expect(head.parent).toBe('Tai nghe');           // existing fixed
  expect(head.img).toMatch(/dfddeabbs\/fix-/);     // re-imaged
});
