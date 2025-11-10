const axios = require('axios');
const crypto = require('crypto');

const CARD2CRYPTO_API_BASE = process.env.CARD2CRYPTO_API_URL || 'https://api.card2crypto.org';
const BUSINESS_ID = process.env.CARD2CRYPTO_BUSINESS_ID || process.env.BUSINESS_ID;
const API_KEY = process.env.CARD2CRYPTO_API_KEY || process.env.PAYMENT_API_KEY || null;
const CALLBACK_SECRET = process.env.CARD2CRYPTO_CALLBACK_SECRET || null;

const client = axios.create({ baseURL: CARD2CRYPTO_API_BASE, timeout: 30000, headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}) } });

async function createPaymentToken(cardData) {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  const payload = { business_id: BUSINESS_ID, card: cardData };
  const resp = await client.post(`/tokens`, payload);
  return resp.data;
}

async function createCharge({ token, amount, currency = 'USD', metadata = {} }) {
  const payload = { business_id: BUSINESS_ID, token, amount, currency, metadata };
  const resp = await client.post(`/charges`, payload);
  return resp.data;
}

async function createRefund({ chargeId, amount }) {
  if (!chargeId) throw new Error('chargeId required for refund');
  const payload = { business_id: BUSINESS_ID, charge_id: chargeId, amount };
  const resp = await client.post(`/refunds`, payload);
  return resp.data;
}

async function createHostedPayment({ amount, currency = 'USD', return_url, cancel_url, metadata = {}, paymentMethods = null, customerEmail = null, customerIp = null, customerUserAgent = null }) {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  const payload = { business_id: BUSINESS_ID, amount, currency, return_url, cancel_url, metadata, payment_method_types: paymentMethods };
  if (customerEmail) payload.customerEmail = customerEmail;
  if (customerIp) payload.customerIp = customerIp;
  if (customerUserAgent) payload.customerUserAgent = customerUserAgent;
  const resp = await client.post(`/businesses/${BUSINESS_ID}/payments`, payload);
  try { module.exports._lastRawResponse = resp.data; } catch (e) { /* ignore */ }
  return resp.data;
}

async function getPayment(paymentId) {
  if (!paymentId) throw new Error('paymentId required');
  try {
    const resp = await client.get(`/payments/${paymentId}`);
    return resp.data;
  } catch (e) {
    try {
      const resp2 = await client.get(`/businesses/${BUSINESS_ID}/payments/${paymentId}`);
      return resp2.data;
    } catch (ee) {
      throw e;
    }
  }
}

async function listBusinessCryptocurrencies() {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  try {
    const resp = await client.get(`/businesses/${BUSINESS_ID}/cryptocurrencies`);
    return resp.data;
  } catch (e) {
    try {
      const resp2 = await client.get(`/businesses/${BUSINESS_ID}/payment-methods`);
      const data = Array.isArray(resp2.data) ? resp2.data.filter(p => (p.type || '').toString().toLowerCase().includes('crypto')) : resp2.data;
      return data;
    } catch (ee) {
      return [];
    }
  }
}

async function activateCrypto(symbol) {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  const s = String(symbol).toUpperCase();
  try {
    const resp = await client.post(`/businesses/${BUSINESS_ID}/cryptocurrencies`, { currency: s, enabled: true });
    return resp.data;
  } catch (e) {
    try { const resp2 = await client.post(`/businesses/${BUSINESS_ID}/payment-methods`, { type: 'crypto', currency: s, enabled: true }); return resp2.data; } catch (ee) { throw e; }
  }
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!CALLBACK_SECRET) return false;
  if (!signatureHeader) return false;
  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
  const computedHex = crypto.createHmac('sha256', CALLBACK_SECRET).update(bodyBuf).digest('hex');
  let sig = (signatureHeader || '').trim();
  if (!sig) return false;
  if (/^[0-9a-fA-F]+$/.test(sig)) { try { const sigBuf = Buffer.from(sig, 'hex'); const compBuf = Buffer.from(computedHex, 'hex'); if (sigBuf.length !== compBuf.length) return false; return crypto.timingSafeEqual(compBuf, sigBuf); } catch (e) { return false; } }
  try { const sigBuf = Buffer.from(sig, 'base64'); const compBuf = Buffer.from(computedHex, 'hex'); if (sigBuf.length !== compBuf.length) return false; return crypto.timingSafeEqual(compBuf, compBuf); } catch (e) { return computedHex === sig; }
}

module.exports = {
  createPaymentToken,
  createCharge,
  createHostedPayment,
  listBusinessCryptocurrencies,
  activateCrypto,
  getPayment,
  createRefund,
  verifyWebhookSignature
};
