const axios = require('axios');
const crypto = require('crypto');

const HOODPAY_API_BASE = process.env.HOODPAY_API_BASE || 'https://api.hoodpay.io/v1';
const BUSINESS_ID = process.env.HOODPAY_BUSINESS_ID;
const API_KEY = process.env.HOODPAY_API_KEY;
const WEBHOOK_SECRET = process.env.HOODPAY_WEBHOOK_SECRET;

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

async function createHostedPayment({ amount, currency = 'USD', return_url, cancel_url, metadata = {} }) {
  if (!BUSINESS_ID) throw new Error('BUSINESS_ID not configured');
  const payload = {
    business_id: BUSINESS_ID,
    amount,
    currency,
    return_url,
    cancel_url,
    metadata
  };
  // HoodPay docs show POST /businesses/{businessId}/payments to create payments
  const resp = await client.post(`/businesses/${BUSINESS_ID}/payments`, payload, { headers: { 'Content-Type': 'application/*+json' } });
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

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) return false;
  if (!signatureHeader) return false;

  // Expect a hex HMAC SHA256 signature
  // signatureHeader may be in form: t=timestamp,v1=signature
  // We'll support simple signature or comma-separated pairs.
  let sig = signatureHeader;
  // try to extract v1=...
  const m = /v1=(\w+)/.exec(signatureHeader);
  if (m) sig = m[1];

  const computed = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  // Use timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig));
}

module.exports = {
  createPaymentToken,
  createCharge,
  createHostedPayment,
  getPayment,
  verifyWebhookSignature
};

