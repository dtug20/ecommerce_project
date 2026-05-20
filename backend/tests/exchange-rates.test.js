const request = require('supertest');
const app = require('../index');
const closeMongo = require('./_helpers/closeMongo');

afterAll(closeMongo);

describe('GET /api/v1/store/exchange-rates', () => {
  test('returns rates document with VND base', async () => {
    const res = await request(app).get('/api/v1/store/exchange-rates');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.base).toBe('VND');
    expect(res.body.data.rates).toBeDefined();
  });

  test('response includes Cache-Control header', async () => {
    const res = await request(app).get('/api/v1/store/exchange-rates');
    expect(res.headers['cache-control']).toMatch(/max-age=3600/);
  });
});
