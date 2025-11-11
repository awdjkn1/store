const request = require('supertest');

// Mock auth middleware to bypass JWT in tests
jest.mock('../middlewares/auth', () => ({
  verifyJWT: (req, res, next) => { req.user = { id: 'test-user' }; next(); },
  requireRole: (role) => (req, res, next) => next()
}));

// Mock supabaseRest to avoid external DB calls
jest.mock('../utils/supabaseRest', () => ({
  insert: jest.fn(async () => ({})),
  upsert: jest.fn(async () => ({})),
  select: jest.fn(async () => ([])),
  patch: jest.fn(async () => ({}))
}));

// Mock crypto utils used by webhook invoice handling
jest.mock('../utils/cryptoUtils', () => ({
  encryptToByteaHex: (obj) => '\\x' + Buffer.from(JSON.stringify(obj)).toString('hex'),
  decryptFromByteaHex: (hex) => JSON.stringify({}),
  encryptText: (t) => t,
  decryptText: (t) => t
}));

// Mock the provider wrapper (card2crypto)
jest.mock('../utils/card2crypto', () => ({
  createWalletAddress: jest.fn(async ({ callback_url, usdc_wallet }) => ({ data: { address_in: 'encaddr123' } })),
  buildPayUrl: jest.fn(({ address, amount, email, currency, domain }) => `https://${domain.replace(/\/+$/g, '')}/pay.php?address=${address}&amount=${amount}`),
  convertToUSD: jest.fn(async (from, value) => ({ value_coin: Number(value) })),
  createHostedPayment: jest.fn(async (payload) => ({ hosted_page_url: 'https://pay.card2crypto.org/hosted', id: 'hosted123' })),
  getPayment: jest.fn(async (id) => ({ id, status: 'paid', amount: 100 }))
}));

// Ensure axios.get returns a wallet when payments route prefers axios first
const axios = require('axios');
axios.get = jest.fn(async (url) => ({ data: { address_in: 'encaddr123' } }));

// Ensure environment vars expected by the code
process.env.CARD2CRYPTO_API_URL = process.env.CARD2CRYPTO_API_URL || 'https://api.card2crypto.example';
process.env.CARD2CRYPTO_PAY_URL = process.env.CARD2CRYPTO_PAY_URL || 'https://pay.card2crypto.org';
process.env.CARD2CRYPTO_CALLBACK_SECRET = process.env.CARD2CRYPTO_CALLBACK_SECRET || 'testsecret';
process.env.CARD2CRYPTO_PAYOUT_WALLET = process.env.CARD2CRYPTO_PAYOUT_WALLET || 'payout_wallet_123';
process.env.YOUR_API_BASE_URL = process.env.YOUR_API_BASE_URL || 'http://localhost';

const app = require('../app');

describe('Card2Crypto wallet -> pay -> callback flow', () => {
  test('creates wallet, returns pay url and handles callback', async () => {
    // 1) create hosted/card2crypto payment
    const createResp = await request(app)
      .post('/api/payments/card2crypto/create')
      .send({ amount: 100, currency: 'USD' })
      .set('Accept', 'application/json');

    expect(createResp.status).toBe(200);
    expect(createResp.body).toHaveProperty('url');
    expect(createResp.body.url).toMatch(/pay.card2crypto.org/);
    expect(createResp.body).toHaveProperty('orderId');
    const orderId = createResp.body.orderId;

    // 2) simulate Card2Crypto GET callback that notifies us of an incoming tx
    const cbResp = await request(app)
      .get('/api/webhooks/card2crypto')
      .query({ orderId, secret: process.env.CARD2CRYPTO_CALLBACK_SECRET, value_coin: '100', coin: 'USDC', txid_in: 'txin123', txid_out: 'txout123' });

    // Accept any 2xx/3xx as success for callback processing
    expect(cbResp.status).toBeLessThan(400);

    // 3) Optionally call verify endpoint to ensure payment can be queried (uses mocked getPayment)
    const verifyResp = await request(app)
      .post('/api/payments/verify')
      .send({ paymentId: 'hosted123', amount: 100 })
      .set('Accept', 'application/json');

    expect(verifyResp.status).toBe(200);
    expect(verifyResp.body).toHaveProperty('success', true);
  });
});
