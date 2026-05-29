const fs = require('fs'); const os = require('os'); const path = require('path');
const { startMem, stopMem } = require('./_mem');
const { Brand, Category, Products } = require('../../scripts/lib/db');
const { runBackup } = require('../../scripts/backup');
const { rollback } = require('../../scripts/rollback');

let dir, ts;
beforeAll(async () => {
  await startMem();
  await Brand.create({ name: 'Apple', status: 'active' });
  await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show' });
  await Products.create({ title: 'Keep me', img: 'https://res.cloudinary.com/dfddeabbs/x.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 1, quantity: 1, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Apple', id: new (require('mongoose').Types.ObjectId)() }, category: { name: 'Tai nghe', id: new (require('mongoose').Types.ObjectId)() } });
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-'));
  const res = await runBackup({ dir }); ts = res.timestamp;
});
afterAll(async () => { await stopMem(); });

it('refuses without --yes and restores the pre-mutation state with --yes', async () => {
  await expect(rollback({ dir, timestamp: ts, yes: false })).rejects.toThrow(/--yes/);
  await Products.deleteMany({});                 // simulate a bad migration
  expect(await Products.countDocuments()).toBe(0);
  const r = await rollback({ dir, timestamp: ts, yes: true });
  expect(r.restored.products).toBe(1);
  expect(await Products.countDocuments()).toBe(1);
});
