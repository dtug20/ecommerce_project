'use strict';
const { startMem, stopMem, mongoose } = require('./_mem');
const { Products, Category } = require('../../scripts/lib/db');
const { importCategories } = require('../../scripts/import-categories');
const { importBrands } = require('../../scripts/import-brands');
const { fixExisting } = require('../../scripts/fix-existing');

beforeAll(async () => {
  await startMem();
  await importCategories({ commit: true });
  await importBrands({ djBrandNames: ['Sony', 'Legendary Whitetails', 'INIKA'], commit: true });
  const oid = () => new mongoose.Types.ObjectId();
  await Products.create({ title: 'Ao Dai Truyen Thong Lua new', img: 'https://res.cloudinary.com/dfddeabbs/shared.png', unit: '1pc', parent: 'Clothing', children: "Women's", price: 1290000, quantity: 24, status: 'in-stock', productType: 'fashion', description: 'd', brand: { name: 'Logitech', id: oid() }, category: { name: 'Clothing', id: oid() } });
  await Products.create({ title: 'Gaming Headphone', img: 'https://res.cloudinary.com/dfddeabbs/shared.png', unit: '1pc', parent: 'Headphones', children: 'Kids Headphones', price: 500000, quantity: 5, status: 'in-stock', productType: 'electronics', description: 'd', brand: { name: 'Logitech', id: oid() }, category: { name: 'Headphones', id: oid() } });
});
afterAll(async () => { await stopMem(); });

it('corrects taxonomy, brand, and gives unique images; keeps VN-special name', async () => {
  const translateFn = async (items) => new Map(items.map((i) => [i.sku || i.title, { title_vi: i.title + ' (VI)', description_vi: 'mo ta' }]));
  const processImagesFn = async (srcs, prefix) => [`https://res.cloudinary.com/dfddeabbs/${prefix}-0.webp`];
  const res = await fixExisting({ commit: true, translateFn, processImagesFn });
  expect(res.fixed).toBe(2);

  const aoDai = await Products.findOne({ title: /Ao Dai/ });
  expect(aoDai.parent).toBe('Thời trang nữ');
  expect(aoDai.brand.name).not.toBe('Logitech');
  expect(aoDai.title).toMatch(/^Ao Dai/);              // VN-special: NOT translated
  expect(aoDai.img).toMatch(/dfddeabbs\/fix-/);        // unique re-image

  const head = await Products.findOne({ title: /VI\)$|Gaming/ });
  expect(head.parent).toBe('Tai nghe');
  const taiNghe = await Category.findOne({ parent: 'Tai nghe' });
  expect(String(head.category.id)).toBe(String(taiNghe._id)); // resolved ref
  expect(head.productType).toBe('electronics');
});
