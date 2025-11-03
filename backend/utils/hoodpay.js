const axios = require('axios');
const crypto = require('crypto');

const HOODPAY_API_BASE = process.env.HOODPAY_API_BASE || 'https://api.hoodpay.io/v1';
const BUSINESS_ID = process.env.HOODPAY_BUSINESS_ID;
const API_KEY = process.env.HOODPAY_API_KEY;
const WEBHOOK_SECRET = process.env.HOODPAY_WEBHOOK_SECRET;
const BITCOIN_XPUB = process.env.BITCOIN_XPUB || process.env.BTC_XPUB || null;
const LITECOIN_XPUB = process.env.LITECOIN_XPUB || process.env.LTC_XPUB || null;

if (!API_KEY) {
  console.warn('[hoodpay] HOODPAY_API_KEY is not set in env; hoodpay calls will fail until configured');
}

const client = axios.create({
  baseURL: HOODPAY_API_BASE,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// expose client for advanced wrappers
client._meta = { baseURL: HOODPAY_API_BASE };

async function createPaymentToken(cardData) {
  // cardData: { number, expiry, cvv, name }
  // Send to HoodPay token endpoint. Do NOT log card data.
  const payload = {
    business_id: BUSINESS_ID,
    card: {
      number: cardData.number,
      expiry: cardData.expiry,
      cvv: cardData.cvv,
      name: cardData.name
    }
  };

  const resp = await client.post('/tokens', payload);
  return resp.data; // expect { id: 'tok_...', ... }
}

async function createCharge({ token, amount, currency = 'USD', metadata = {} }) {
  const payload = {
    business_id: BUSINESS_ID,
    token,
    amount,
    currency,
    metadata
  };
  const resp = await client.post('/charges', payload);
  return resp.data;
}

async function createRefund({ chargeId, amount }) {
  // Attempt to refund a charge. API shape may vary between providers — keep this small and safe.
  if (!chargeId) throw new Error('chargeId required for refund');
  const payload = {
    business_id: BUSINESS_ID,
    charge_id: chargeId,
    amount
  };
  const resp = await client.post('/refunds', payload);
  return resp.data;
}

async function createHostedPayment({ amount, currency = 'USD', return_url, cancel_url, metadata = {}, paymentMethods = null, customerEmail = null, customerIp = null, customerUserAgent = null }) {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  // Do not force payment_method_types here; allow the provider dashboard to
  // control available payment methods. If a caller supplies paymentMethods,
  // the provider may read them from the payload via metadata or other fields.

  const payload = {
    business_id: BUSINESS_ID,
    amount,
    currency,
    return_url,
    cancel_url,
    metadata,
    payment_method_types: paymentMethods
  };
  // attach optional customer fields when provided
  if (customerEmail) payload.customerEmail = customerEmail;
  if (customerIp) payload.customerIp = customerIp;
  if (customerUserAgent) payload.customerUserAgent = customerUserAgent;
  
  // --- ADD THIS DEBUG LOGGING ---
  console.log(`[HOODPAY DEBUG] Checking for Xpub keys...`);
  console.log(`[HOODPAY DEBUG] BITCOIN_XPUB is set: ${!!BITCOIN_XPUB}`);
  console.log(`[HOODPAY DEBUG] LITECOIN_XPUB is set: ${!!LITECOIN_XPUB}`);
  // --- END DEBUG LOGGING ---
  // If extended public keys for payouts are configured, include them in the
  // hosted payment creation payload so provider can route payouts to your
  // configured xpubs. These values MUST come from environment variables
  // and should never be hardcoded in source.
  try {
    const payoutXpubs = {};
    if (BITCOIN_XPUB) payoutXpubs.bitcoin = BITCOIN_XPUB;
    if (LITECOIN_XPUB) payoutXpubs.litecoin = LITECOIN_XPUB;
    if (Object.keys(payoutXpubs).length) payload.payout_xpubs = payoutXpubs;
  } catch (e) {
    // no-op: don't fail payment creation if xpub handling isn't supported by provider
  }
  // HoodPay docs show POST /businesses/{businessId}/payments to create payments
  const resp = await client.post(`/businesses/${BUSINESS_ID}/payments`, payload, { headers: { 'Content-Type': 'application/json' } });
  // Log the raw provider response to aid debugging of hosted payment fields
  try {
    console.log('HOODPAY_RAW_RESPONSE:', JSON.stringify(resp.data, null, 2));
  } catch (e) {
    // ignore logging errors
  }

  // Keep the last raw response in-memory so a one-off debug endpoint can return it
  try {
    module.exports._lastRawResponse = resp.data;
  } catch (e) {
    // ignore
  }

  return resp.data;
}

async function getPayment(paymentId) {
  if (!paymentId) throw new Error('paymentId required');
  // Try common endpoints: /payments/:id and business-scoped endpoint
  try {
    const resp = await client.get(`/payments/${paymentId}`);
    return resp.data;
  } catch (e) {
    // try business-scoped endpoint
    try {
      const resp2 = await client.get(`/businesses/${BUSINESS_ID}/payments/${paymentId}`);
      return resp2.data;
    } catch (ee) {
      // rethrow original for transparency
      throw e;
    }
  }
}

// Try to list cryptocurrencies available/active for the business.
async function listBusinessCryptocurrencies() {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  // Common provider path (may vary): /businesses/{businessId}/cryptocurrencies
  try {
    const resp = await client.get(`/businesses/${BUSINESS_ID}/cryptocurrencies`);
    // expect resp.data to be array of objects with symbol/name/active
    return resp.data;
  } catch (e) {
    // try alternate path
    try {
      const resp2 = await client.get(`/businesses/${BUSINESS_ID}/payment-methods`);
      // resp2.data may contain many methods; filter crypto items
      const data = Array.isArray(resp2.data) ? resp2.data.filter(p => (p.type || '').toString().toLowerCase().includes('crypto')) : resp2.data;
      return data;
    } catch (ee) {
      // No provider endpoint available — return empty
      return [];
    }
  }
}

// Ask provider to activate a crypto asset for the business (best-effort)
async function activateCrypto(symbol) {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  const s = String(symbol).toUpperCase();
  // Common provider API: POST /businesses/{businessId}/cryptocurrencies to enable
  try {
    const payload = { currency: s, enabled: true };
    const resp = await client.post(`/businesses/${BUSINESS_ID}/cryptocurrencies`, payload);
    return resp.data;
  } catch (e) {
    // try putting to payment-methods
    try {
      const resp2 = await client.post(`/businesses/${BUSINESS_ID}/payment-methods`, { type: 'crypto', currency: s, enabled: true });
      return resp2.data;
    } catch (ee) {
      // rethrow last
      throw e;
    }
  }
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;

  // Expect a hex HMAC SHA256 signature
  // signatureHeader may be in form: t=timestamp,v1=signature
  // We'll support simple signature or comma-separated pairs.
  let sig = signatureHeader;
  // try to extract v1=... (capture up to comma)
  const m = /v1=([^,\s]+)/.exec(signatureHeader);
  if (m) sig = m[1];

  // Ensure rawBody is a Buffer
  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');

  const computedHex = crypto.createHmac('sha256', WEBHOOK_SECRET).update(bodyBuf).digest('hex');

  // Non-production debug help: log header and computed prefix (no secret)
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.debug('[hoodpay] webhook signature header:', signatureHeader);
      console.debug('[hoodpay] webhook computed sig (hex prefix):', computedHex.slice(0, 16));
    } catch (e) { /* ignore */ }
  }

  sig = (sig || '').trim();
  if (!sig) return false;

  // If signature looks like hex (0-9a-f), compare as hex bytes
  if (/^[0-9a-fA-F]+$/.test(sig)) {
    try {
      const sigBuf = Buffer.from(sig, 'hex');
      const compBuf = Buffer.from(computedHex, 'hex');
      if (sigBuf.length !== compBuf.length) return false;
      return crypto.timingSafeEqual(compBuf, sigBuf);
    } catch (e) {
      return false;
    }
  }

  // Try base64 decode if not hex
  try {
    const sigBuf = Buffer.from(sig, 'base64');
    const compBuf = Buffer.from(computedHex, 'hex');
    if (sigBuf.length !== compBuf.length) return false;
    return crypto.timingSafeEqual(compBuf, sigBuf);
  } catch (e) {
    // Fallback: compare hex string equality
    return computedHex === sig;
  }
}

module.exports = {
  createPaymentToken,
  createCharge,
  createHostedPayment,
  listBusinessCryptocurrencies,
  activateCrypto,
  getPayment,
  verifyWebhookSignature
};


