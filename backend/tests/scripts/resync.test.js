'use strict';
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products, Category } = require('../../scripts/lib/db');
const { resyncAggregates } = require('../../scripts/resync-aggregates');

let catId;
beforeAll(async () => {
  await startMem();
  const c = await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show', products: [] });
  catId = c._id;
  const base = { img: 'https://res.cloudinary.com/dfddeabbs/x.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', productType: 'electronics', description: 'd', brand: { name: 'Sony', id: new mongoose.Types.ObjectId() } };
  await Products.create({ ...base, title: 'Headphone-1', price: 1, quantity: 5, status: 'in-stock', category: { name: 'Tai nghe', id: catId } });
  await Products.create({ ...base, title: 'Headphone-2', price: 1, quantity: 0, status: 'in-stock', category: { name: 'Tai nghe', id: catId } }); // wrong status
});
afterAll(async () => { await stopMem(); });

it('rebuilds products[] and fixes status from quantity', async () => {
  await resyncAggregates({ commit: true });
  const c = await Category.findById(catId);
  expect(c.products.length).toBe(2);
  const h2 = await Products.findOne({ title: 'Headphone-2' });
  expect(h2.status).toBe('out-of-stock');
});
