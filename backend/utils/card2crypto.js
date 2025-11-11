const axios = require('axios');
const crypto = require('crypto');

const CARD2CRYPTO_API_BASE = process.env.CARD2CRYPTO_API_URL || 'https://api.card2crypto.org';
const BUSINESS_ID = process.env.CARD2CRYPTO_BUSINESS_ID || process.env.BUSINESS_ID;
const API_KEY = process.env.CARD2CRYPTO_API_KEY || process.env.PAYMENT_API_KEY || null;
const CALLBACK_SECRET = process.env.CARD2CRYPTO_CALLBACK_SECRET || null;

const client = axios.create({ baseURL: CARD2CRYPTO_API_BASE, timeout: 30000, headers: { 'Content-Type': 'application/json', ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}) } });

// Helper to mask sensitive values for logs
function maskValue(v) {
  if (!v) return v;
  const s = String(v);
  if (s.length <= 6) return '****' + s.slice(-2);
  return '****' + s.slice(-6);
}

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

// Wallet creation endpoint used by Card2Crypto docs: /control/wallet.php
async function createWalletAddress({ callback_url, usdc_wallet, affiliate_wallet = null }) {
  const params = { callback_url: callback_url || '', usdc_wallet: usdc_wallet || '' };
  if (affiliate_wallet) params.affiliate_wallet = affiliate_wallet;
  // record a minimal, masked last request for debugging
  try { module.exports._lastRequest = { endpoint: '/control/wallet.php', params: { callback_host: (callback_url || '').split('?')[0].replace(/https?:\/\//, '').split('/')[0] || null, usdc_wallet_masked: maskValue(usdc_wallet) }, ts: new Date().toISOString() }; } catch (e) {}
  // use raw axios get to the /control/wallet.php endpoint on the API base
  try {
    const resp = await client.get(`/control/wallet.php`, { params });
    try { module.exports._lastRawResponse = resp.data; } catch (e) {}
    return resp.data;
  } catch (e) {
    // log helpful debug information without printing secrets
    try {
      console.error('Card2Crypto.createWalletAddress error:', e && e.message ? e.message : e);
      if (e.response) {
        console.error('Card2Crypto.createWalletAddress response status:', e.response.status);
        try { console.error('Card2Crypto.createWalletAddress response body:', JSON.stringify(e.response.data)); } catch (j) { console.error('Card2Crypto.createWalletAddress response body (non-json)'); }
      }
    } catch (logErr) {
      console.error('Failed to log createWalletAddress error details', logErr && logErr.message);
    }
    throw e;
  }
}

// Convert endpoint: /control/convert.php?from=EUR&value=123
async function convertToUSD(fromCurrency, value) {
  if (!fromCurrency) throw new Error('fromCurrency required');
  const params = { from: (fromCurrency || '').toString().toUpperCase(), value };
  try {
    // record minimal masked debug info
    try { module.exports._lastRequest = { endpoint: '/control/convert.php', params, ts: new Date().toISOString() }; } catch (e) {}
    const resp = await client.get(`/control/convert.php`, { params });
    try { module.exports._lastRawResponse = resp.data; } catch (e) {}
    return resp.data;
  } catch (e) {
    console.error('Card2Crypto.convertToUSD error:', e && e.message ? e.message : e);
    if (e.response) {
      try { console.error('Card2Crypto.convertToUSD response body:', JSON.stringify(e.response.data)); } catch (j) { console.error('Card2Crypto.convertToUSD response body (non-json)'); }
    }
    throw e;
  }
}

// Build a hosted pay URL (pay.php/process-payment.php) — safe encoding and configurable base
function buildPayUrl({ address, amount, email = '', currency = 'USD', domain = process.env.CARD2CRYPTO_PAY_DOMAIN || 'pay.card2crypto.org' }) {
  const base = process.env.CARD2CRYPTO_PAY_URL ? String(process.env.CARD2CRYPTO_PAY_URL).replace(/\/+$/g, '') : `https://${domain}`;
  const params = new URLSearchParams({ address: address || '', amount: (amount || '').toString(), email: email || '', currency: (currency || 'USD').toString(), domain });
  return `${base}/pay.php?${params.toString()}`;
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
  const computed = crypto.createHmac('sha256', CALLBACK_SECRET).update(bodyBuf).digest(); // raw buffer
  let sig = (signatureHeader || '').trim();
  if (!sig) return false;
  // If hex
  if (/^[0-9a-fA-F]+$/.test(sig)) {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      if (sigBuf.length !== computed.length) return false;
      return crypto.timingSafeEqual(computed, sigBuf);
    } catch (e) {
      return false;
    }
  }
  // If base64
  try {
    const sigBuf = Buffer.from(sig, 'base64');
    if (sigBuf.length === computed.length) return crypto.timingSafeEqual(computed, sigBuf);
    // if lengths differ, compare hex string safely
    const computedHex = computed.toString('hex');
    try { return crypto.timingSafeEqual(Buffer.from(computedHex, 'utf8'), Buffer.from(String(sig), 'utf8')); } catch (e) { return computedHex === sig; }
  } catch (e) {
    // fallback to direct compare
    try { return crypto.timingSafeEqual(Buffer.from(computed.toString('hex')), Buffer.from(String(sig))); } catch (ee) { return computed.toString('hex') === String(sig); }
  }
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
  , createWalletAddress
  , convertToUSD
  , buildPayUrl
};
