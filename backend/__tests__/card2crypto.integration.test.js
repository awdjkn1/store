// Mock native modules that are not available in this test environment
jest.mock('sharp', () => () => ({ resize: () => ({ toBuffer: async () => Buffer.from('') }) }));

const request = require('supertest');

// Simple in-memory mock DB to simulate Supabase REST behaviour for tests
const mockDB = {
  products: [{ id: 1, price_shipping_included: 10.0, stock_count: 5 }],
  orders: [],
  payments: []
};

// Mock uuid to keep ids stable
jest.mock('uuid', () => ({ v4: () => `uuid-${Math.random().toString(36).slice(2,8)}` }));

// Mock axios for Card2Crypto endpoints
jest.mock('axios', () => ({ create: () => ({ get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }), get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }));
const axios = require('axios');

// Mock auth middleware in tests
let mockVerifyJWT = (req, res, next) => { req.user = { id: 1 }; next(); };
jest.mock('../middlewares/auth', () => ({
  verifyJWT: (req, res, next) => mockVerifyJWT(req, res, next),
  requireRole: () => (req, res, next) => next()
}));

// Mock socket getIO to capture emits
const emitted = [];
jest.mock('../utils/socket', () => ({
  getIO: () => ({ emit: (event, payload) => emitted.push({ event, payload }) })
}));

// Mock supabaseRest with simple in-memory ops
jest.mock('../utils/supabaseRest', () => ({
  select: async (table, opts = {}) => {
    if (table === 'lego_products') return mockDB.products.filter(p => (opts.id ? opts.id.includes(String(p.id)) : true));
    if (table === 'orders') return mockDB.orders;
    if (table === 'payments') return mockDB.payments;
    return [];
  },
  insert: async (table, rows, opts = {}) => {
    const arr = Array.isArray(rows) ? rows : [rows];
    if (table === 'orders') {
        arr.forEach(r => { if (!r.id) r.id = `order-${mockDB.orders.length+1}`; r.created_at = new Date().toISOString(); r.updated_at = new Date().toISOString(); mockDB.orders.push(r); });
      return arr;
    }
    if (table === 'payments') {
      arr.forEach(r => { r.id = mockDB.payments.length + 1; r.created_at = new Date().toISOString(); r.updated_at = new Date().toISOString(); mockDB.payments.push(r); });
      return arr;
    }
    return arr;
  },
  upsert: async (table, rows, opts = {}) => {
    const r = Array.isArray(rows) ? rows[0] : rows;
    if (table === 'payments') {
      const existing = mockDB.payments.find(p => p.transaction_id && r.transaction_id && p.transaction_id === r.transaction_id);
      if (existing) { Object.assign(existing, r, { updated_at: new Date().toISOString() }); return [existing]; }
      r.id = mockDB.payments.length + 1; mockDB.payments.push(Object.assign({}, r)); return [r];
    }
    return [r];
  },
  patch: async (table, data, opts = {}) => {
    if (table === 'orders' && opts.id) {
      const id = String(opts.id).replace('eq.', '');
      const ord = mockDB.orders.find(o => String(o.id) === id || o.id === id);
      if (ord) Object.assign(ord, data, { updated_at: new Date().toISOString() });
      return ord ? [ord] : [];
    }
    return [];
  },
  delete: async () => []
}));

// Set Card2Crypto secret for callback verification
process.env.CARD2CRYPTO_CALLBACK_SECRET = 'test-secret-123';
process.env.CARD2CRYPTO_API_URL = 'https://api.card2crypto.test';
process.env.CARD2CRYPTO_PAY_URL = 'https://pay.card2crypto.test';

// Provide dummy supabase env vars so modules that create a supabase client don't fail during tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-test-key';

// Ensure Fetch API globals exist for Supabase client in the Node test environment
if (typeof global.Headers === 'undefined') global.Headers = class Headers { constructor() {} };
if (typeof global.Request === 'undefined') global.Request = class Request { constructor() {} };
if (typeof global.Response === 'undefined') global.Response = class Response { constructor() {} };
// Provide a minimal fetch implementation so modules that try to use fetch work in tests
if (typeof global.fetch === 'undefined') {
  global.fetch = async function () { return { ok: true, json: async () => ({}) }; };
}

// Require app after mocks
const app = require('../app');

describe('Card2Crypto integration flow (mocked)', () => {
  beforeEach(() => {
    mockDB.orders = [];
    mockDB.payments = [];
    emitted.length = 0;
    mockVerifyJWT = (req, res, next) => { req.user = { id: 1 }; next(); };
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('creates a card2crypto hosted URL and processes callback', async () => {
    // Mock convert.php (return same value) and wallet.php
    axios.get.mockImplementation((url, opts) => {
      if (url.includes('/control/convert.php')) return Promise.resolve({ data: { value_coin: 10 } });
      if (url.includes('/control/wallet.php')) return Promise.resolve({ data: { address_in: 'enc_addr_abc123' } });
      return Promise.resolve({ data: {} });
    });

    // 1) Create a Card2Crypto payment
    const createRes = await request(app).post('/api/payments/card2crypto/create').send({ amount: 10, currency: 'USD', email: 'buyer@test' }).set('Accept', 'application/json');
    expect(createRes.status).toBe(200);
    expect(createRes.body.url).toBeDefined();
    expect(createRes.body.orderId).toBeDefined();

    const orderId = createRes.body.orderId;

    // 2) Simulate callback from Card2Crypto
    const cbRes = await request(app).get('/api/webhooks/card2crypto').query({ orderId, secret: process.env.CARD2CRYPTO_CALLBACK_SECRET, value_coin: '10', txid_in: 'tx_in_1' });
    expect(cbRes.status).toBe(200);

    // Ensure payment row was inserted and order updated
    expect(mockDB.payments.length).toBeGreaterThanOrEqual(1);
    const p = mockDB.payments.find(x => x.order_id === orderId || x.transaction_id === 'tx_in_1');
    expect(p).toBeTruthy();

    const ord = mockDB.orders.find(o => String(o.id) === String(orderId));
    expect(ord).toBeTruthy();
    expect(ord.status).toBe('paid');
  });
});
