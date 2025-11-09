const request = require('supertest');
const app = require('../app');

describe('GET /api/shipping', () => {
  it('returns free shipping option', async () => {
    const res = await request(app).get('/api/shipping');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('shipping');
    expect(Array.isArray(res.body.shipping)).toBe(true);
    const opt = res.body.shipping[0];
    expect(opt).toHaveProperty('name');
    expect(opt).toHaveProperty('cost');
    expect(opt.cost).toBe(0);
    expect(opt).toHaveProperty('description', 'Free');
  });
});
