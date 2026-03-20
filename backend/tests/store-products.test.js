const request = require('supertest');
const app = require('../index');

describe('GET /api/v1/store/products', () => {
  test('returns paginated response structure', async () => {
    const res = await request(app).get('/api/v1/store/products?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });

  test('normalizes negative page to 1', async () => {
    const res = await request(app).get('/api/v1/store/products?page=-1');
    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
  });

  test('caps limit to max 100', async () => {
    const res = await request(app).get('/api/v1/store/products?limit=999');
    expect(res.status).toBe(200);
    expect(res.body.pagination.limit).toBeLessThanOrEqual(100);
  });

  test('accepts productType filter', async () => {
    const res = await request(app).get('/api/v1/store/products?productType=electronics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('accepts price range filters', async () => {
    const res = await request(app).get('/api/v1/store/products?minPrice=10&maxPrice=500');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/store/products/search', () => {
  test('requires search term', async () => {
    const res = await request(app).get('/api/v1/store/products/search');
    expect(res.status).toBe(400);
  });

  test('returns results for search query', async () => {
    const res = await request(app).get('/api/v1/store/products/search?q=test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
