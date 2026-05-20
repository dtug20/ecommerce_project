'use strict';

const request = require('supertest');
const app = require('../index');

describe('Currency audit endpoints', () => {
  test('GET /api/v1/admin/products/currency-audit requires admin auth', async () => {
    const res = await request(app).get('/api/v1/admin/products/currency-audit');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/admin/products/:id/normalize-currency requires admin auth', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products/507f1f77bcf86cd799439011/normalize-currency')
      .send({ fromCurrency: 'USD' });
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/admin/products/bulk-normalize-currency requires admin auth', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products/bulk-normalize-currency')
      .send({ ids: [], fromCurrency: 'USD' });
    expect(res.status).toBe(401);
  });
});
