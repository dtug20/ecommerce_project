const request = require('supertest');
const app = require('../index');

describe('Store CMS Endpoints', () => {
  test('GET /api/v1/store/settings returns public settings', async () => {
    const res = await request(app).get('/api/v1/store/settings');
    // May return 200 with data or 200 with defaults if no settings seeded
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/v1/store/categories returns categories', async () => {
    const res = await request(app).get('/api/v1/store/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/v1/store/brands/active returns brands', async () => {
    const res = await request(app).get('/api/v1/store/brands/active');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/v1/store/vendors returns vendor list', async () => {
    const res = await request(app).get('/api/v1/store/vendors');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('Protected Endpoints (no auth)', () => {
  test('GET /api/v1/user/profile returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/user/profile');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/admin/products returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/admin/products');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/vendor/products returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/vendor/products');
    expect(res.status).toBe(401);
  });
});
