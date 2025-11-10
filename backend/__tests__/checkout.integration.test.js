const request = require('supertest');

// Mock 'uuid' before importing app so ESM-style uuid doesn't break Jest transform
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

// Mock axios (some installed axios versions ship as ESM and break Jest parsing of node_modules)
jest.mock('axios', () => {
  const mock = {
    create: () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
  return mock;
});

// Mock auth middleware to inject a test user
jest.mock('../middlewares/auth', () => ({
  verifyJWT: (req, res, next) => {
    req.user = { id: 1 };
    next();
  }
}));
// Also expose requireRole so admin routes that call requireRole('admin') won't crash
jest.mock('../middlewares/auth', () => ({
  verifyJWT: (req, res, next) => { req.user = { id: 1 }; next(); },
  requireRole: (role) => (req, res, next) => next()
}));

// Mock payment provider (card2crypto) to control getPayment behavior
const mockedGetPayment = jest.fn(async (paymentId) => ({ id: paymentId, status: 'paid', amount: 1000 }));
jest.mock('../utils/card2crypto', () => ({
  getPayment: (...args) => mockedGetPayment(...args),
  // Keep other helpers as placeholders if called
  createHostedPayment: async () => ({}),
  createPaymentToken: async () => ({}),
  createCharge: async () => ({}),
  createRefund: async () => ({}),
  verifyWebhookSignature: () => false
}));

// Mock supabase to avoid DB dependency
const insertedOrders = [];
jest.mock('../utils/supabaseRest', () => ({
  select: jest.fn(async (table, opts) => {
    // return a product matching requested ids
    return [{ id: 1, price_shipping_included: 10, stock_count: 5 }];
  }),
  insert: jest.fn(async (table, rows, opts) => {
    // emulate returning inserted rows
    if (Array.isArray(rows)) {
      insertedOrders.push(...rows);
    } else {
      insertedOrders.push(rows);
    }
    return rows;
  }),
  delete: jest.fn(async () => ({ }))
}));

// Require app after mocks are in place
const app = require('../app');

describe('POST /api/checkout', () => {
  it('creates orders only after payment verification', async () => {
    const payload = {
      items: [{ product_id: 1, quantity: 1 }],
      shippingAddress: { line1: '123 Test St' },
      payment: { paymentId: 'pay_123' }
    };

    const res = await request(app).post('/api/checkout').send(payload).set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  // API returns single order and order_items array
  expect(res.body.order).toBeTruthy();
  expect(Array.isArray(res.body.order_items)).toBe(true);
  expect(res.body.order_items.length).toBeGreaterThan(0);

  // Ensure provider.getPayment was called to verify the payment
  expect(mockedGetPayment).toHaveBeenCalledWith('pay_123');
  });
});
