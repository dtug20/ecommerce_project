'use strict';
const { startMem, stopMem } = require('./_mem');
const { Category } = require('../../scripts/lib/db');
const { importCategories } = require('../../scripts/import-categories');

let oldId;
beforeAll(async () => {
  await startMem();
  const oldHead = await Category.create({ parent: 'Headphones', productType: 'electronics', status: 'Show', children: ['Kids Headphones'] });
  oldId = String(oldHead._id);
  await Category.create({ parent: 'CPU Heat Pipes', productType: 'electronics', status: 'Show' }); // soft-delete target
});
afterAll(async () => { await stopMem(); });

it('renames in place (keeps _id), creates new, soft-deletes extras — idempotent', async () => {
  await importCategories({ commit: true });
  await importCategories({ commit: true }); // re-run safe

  const headphones = await Category.findOne({ parent: 'Headphones' });
  expect(headphones).toBeNull();                                   // renamed away

  const taiNghe = await Category.findOne({ parent: 'Tai nghe' });
  expect(String(taiNghe._id)).toBe(oldId);                         // SAME _id preserved
  expect(taiNghe.productType).toBe('electronics');
  expect(taiNghe.children).toEqual(expect.arrayContaining(['Bluetooth']));

  const dienThoai = await Category.findOne({ parent: 'Điện thoại' });
  expect(dienThoai).toBeTruthy();                                  // new created
  expect(dienThoai.slug).toBe('dien-thoai');

  const cpu = await Category.findOne({ parent: 'CPU Heat Pipes' });
  expect(cpu.status).toBe('Hide');                                 // soft-deleted

  const shows = await Category.find({ status: 'Show' });
  expect(shows.length).toBe(23);                                   // full frozen tree visible
});
