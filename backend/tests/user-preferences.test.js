'use strict';

const request = require('supertest');
const app = require('../index');

describe('User preferences endpoints', () => {
  test('GET /api/v1/user/preferences requires auth', async () => {
    const res = await request(app).get('/api/v1/user/preferences');
    expect(res.status).toBe(401);
  });

  test('PATCH /api/v1/user/preferences requires auth', async () => {
    const res = await request(app).patch('/api/v1/user/preferences').send({ currency: 'USD' });
    expect(res.status).toBe(401);
  });
});
