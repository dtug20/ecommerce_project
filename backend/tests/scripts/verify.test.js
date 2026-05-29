const { startMem, stopMem, mongoose } = require('./_mem');
const { Products, Category, Brand } = require('../../scripts/lib/db');
const { runChecks } = require('../../scripts/verify');

let catId, brandId;
beforeAll(async () => {
  await startMem();
  const c = await Category.create({ parent: 'Tai nghe', productType: 'electronics', status: 'Show', products: [] });
  const b = await Brand.create({ name: 'Sony', status: 'active' });
  catId = c._id; brandId = b._id;
  await Products.create({ title: 'Good', img: 'https://res.cloudinary.com/dfddeabbs/g.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 1, quantity: 5, discount: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Sony', id: brandId }, category: { name: 'Tai nghe', id: catId } });
  await Category.findByIdAndUpdate(catId, { products: [ (await Products.findOne())._id ] });
});
afterAll(async () => { await stopMem(); });

it('passes on clean data', async () => {
  const r = await runChecks();
  expect(r.pass).toBe(true);
  expect(r.failures).toEqual([]);
});

it('flags a productType/category mismatch (check #11)', async () => {
  await Products.create({ title: 'Bad', img: 'https://res.cloudinary.com/dfddeabbs/b.webp', unit: '1pc', parent: 'Tai nghe', children: 'Bluetooth', price: 1, quantity: 5, discount: 5, status: 'in-stock', productType: 'beauty', description: 'd', brand: { name: 'Sony', id: brandId }, category: { name: 'Tai nghe', id: catId } });
  const r = await runChecks();
  expect(r.pass).toBe(false);
  expect(r.failures.join(' ')).toMatch(/productType!=category/);
});
