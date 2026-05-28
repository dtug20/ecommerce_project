const fs = require('fs');
const os = require('os');
const path = require('path');
const { startMem, stopMem } = require('./_mem');
const { Brand, Category, Products } = require('../../scripts/lib/db');
const { runBackup } = require('../../scripts/backup');

let dir;
beforeAll(async () => {
  await startMem();
  await Brand.create({ name: 'Apple', status: 'active' });
  await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show' });
  await Products.create({ title: 'X headset', img: 'https://res.cloudinary.com/dfddeabbs/a.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 100000, quantity: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Apple', id: new (require('mongoose').Types.ObjectId)() }, category: { name: 'Tai nghe', id: new (require('mongoose').Types.ObjectId)() } });
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-'));
});
afterAll(async () => { await stopMem(); });

it('writes EJSON dumps + manifest and reports counts', async () => {
  const res = await runBackup({ dir });
  expect(res.counts).toMatchObject({ products: 1, categories: 1, brands: 1 });
  expect(fs.existsSync(path.join(res.outDir, 'products.json'))).toBe(true);
  const manifest = JSON.parse(fs.readFileSync(path.join(res.outDir, 'manifest.json'), 'utf8'));
  expect(manifest.counts.products).toBe(1);
  expect(manifest.mongoUriHash).toMatch(/^[a-f0-9]{64}$/);
  expect(manifest).not.toHaveProperty('mongoUri');
});

it('aborts when a collection is empty', async () => {
  await Products.deleteMany({});
  await expect(runBackup({ dir })).rejects.toThrow(/empty|0 docs/i);
});
