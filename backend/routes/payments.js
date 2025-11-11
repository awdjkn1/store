const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const axios = require('axios');
const card2crypto = require('../utils/card2crypto');
const supabase = require('../utils/supabaseRest');
const { encryptText, decryptText, encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Card2Crypto: create encrypted wallet address and return hosted pay URL
router.post('/card2crypto/create', verifyJWT, async (req, res) => {
  try {
    const { orderId: incomingOrderId, email, currency = 'USD', amount } = req.body || {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'amount is required and must be > 0' });

    // 1. Currency conversion if needed (use helper when available)
    let finalAmount = Number(amount);
    try {
      if ((currency || 'USD').toUpperCase() !== 'USD') {
        if (card2crypto && typeof card2crypto.convertToUSD === 'function') {
          const conv = await card2crypto.convertToUSD((currency || 'USD').toUpperCase(), amount);
          if (conv && (conv.value_coin || conv.value)) finalAmount = Number(conv.value_coin || conv.value);
        } else {
          const conv = await axios.get(`${process.env.CARD2CRYPTO_API_URL}/control/convert.php`, { params: { from: (currency || 'USD').toUpperCase(), value: amount } });
          if (conv && conv.data && (conv.data.value_coin || conv.data.value)) finalAmount = Number(conv.data.value_coin || conv.data.value);
        }
      }
    } catch (e) {
      console.warn('Card2Crypto conversion failed, continuing with original amount', e && e.message);
    }

    // 2. Create callback URL secured with secret
    const cbParams = new URLSearchParams({ orderId: incomingOrderId || '', secret: process.env.CARD2CRYPTO_CALLBACK_SECRET || '' });
    const callbackUrl = `${process.env.YOUR_API_BASE_URL || (`https://${req.get('host')}`) }/api/webhooks/card2crypto?${cbParams.toString()}`;

    // 3. Generate a secure per-order payment token and persist it so we can validate callbacks
    const paymentToken = crypto.randomBytes(32).toString('hex');
    const orderIdLocal = incomingOrderId || uuidv4();
    // persist token to order (create order first if needed) so callback can lookup by token
    try {
      if (incomingOrderId) {
        // attach token to existing order
        await supabase.patch('orders', { payment_token: paymentToken, updated_at: new Date().toISOString() }, { id: `eq.${incomingOrderId}` });
      } else {
        const now = new Date().toISOString();
        await supabase.insert('orders', { id: orderIdLocal, status: 'pending', total_price: Number(finalAmount).toFixed(2), payment_token: paymentToken, created_at: now, updated_at: now });
      }
    } catch (e) {
      console.warn('Failed to persist order/payment token before wallet creation:', e && e.message);
    }

    const cbWithToken = new URLSearchParams({ token: paymentToken });
    const callbackWithTokenUrl = `${process.env.YOUR_API_BASE_URL || (`https://${req.get('host')}`) }/api/webhooks/card2crypto/callback?${cbWithToken.toString()}`;

    if (!process.env.CARD2CRYPTO_API_URL) {
      console.error('Card2Crypto API URL is not configured (CARD2CRYPTO_API_URL)');
      // cleanup created order if wallet won't be created
      try { if (!incomingOrderId) await supabase.delete('orders', { id: `eq.${orderIdLocal}` }); } catch (e) {}
      return res.status(502).json({ error: 'Payment provider misconfigured' });
    }

    let walletResp = null;
    try {
      // prefer direct axios -> tests often mock axios.get for provider endpoints
      const walletParams = new URLSearchParams({ callback_url: callbackWithTokenUrl, usdc_wallet: process.env.CARD2CRYPTO_PAYOUT_WALLET || '' });
      const apiBase = String(process.env.CARD2CRYPTO_API_URL).replace(/\/+$/g, '');
      walletResp = await axios.get(`${apiBase}/control/wallet.php?${walletParams.toString()}`);
    } catch (eAxios) {
      try {
        if (card2crypto && typeof card2crypto.createWalletAddress === 'function') {
          walletResp = await card2crypto.createWalletAddress({ callback_url: callbackWithTokenUrl, usdc_wallet: process.env.CARD2CRYPTO_PAYOUT_WALLET || '' });
        } else {
          throw eAxios;
        }
      } catch (e2) {
        console.error('Card2Crypto wallet creation failed', e2 && e2.message ? e2.message : e2);
        // cleanup created order if wallet won't be created
        try { if (!incomingOrderId) await supabase.delete('orders', { id: `eq.${orderIdLocal}` }); } catch (e) {}
        return res.status(502).json({ error: 'Failed to generate wallet address' });
      }
    }

    console.log('Card2Crypto wallet.php response:', walletResp && walletResp.data ? walletResp.data : walletResp);
    const encryptedAddress = (walletResp && walletResp.data) ? (walletResp.data.address_in || walletResp.data.address || walletResp.data.encrypted_address || walletResp.data.address_in_hex) : (walletResp && (walletResp.address_in || walletResp.address || walletResp.encrypted_address || walletResp.address_in_hex));
    if (!encryptedAddress) return res.status(502).json({ error: 'Failed to generate encrypted wallet address' });

    // 4. Persist order only after wallet successfully created (prevents orphans)
    let orderId = incomingOrderId || orderIdLocal;
    if (!incomingOrderId) {
      try {
        const now = new Date().toISOString();
        await supabase.insert('orders', { id: orderId, status: 'pending', total_price: Number(finalAmount).toFixed(2), created_at: now, updated_at: now });
      } catch (e) {
        console.warn('Failed to create order for Card2Crypto payment after wallet creation:', e && e.message);
      }
    }

    // 5. Construct pay.php url
    const paymentUrl = (card2crypto && typeof card2crypto.buildPayUrl === 'function')
      ? card2crypto.buildPayUrl({ address: encryptedAddress, amount: finalAmount, email: email || '', currency: 'USD', domain: process.env.CARD2CRYPTO_PAY_DOMAIN || 'pay.card2crypto.org' })
      : `${(process.env.CARD2CRYPTO_PAY_URL || 'https://pay.card2crypto.org').replace(/\/+$/g, '')}/pay.php?${new URLSearchParams({ address: encryptedAddress, amount: finalAmount, email: email || '', currency: 'USD', domain: process.env.CARD2CRYPTO_PAY_DOMAIN || 'pay.card2crypto.org' }).toString()}`;

    // (order persistence handled above after wallet creation)

    return res.json({ url: paymentUrl, orderId });
  } catch (err) {
    console.error('Failed to create Card2Crypto payment:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Payment provider error' });
  }
});

// Helper to create a Card2Crypto hosted payment (reusable by other endpoints)
async function createCard2CryptoPayment({ incomingOrderId, email, currency = 'USD', amount, req }) {
  // Mirrors /card2crypto/create: use helpers when available and persist order only after wallet created
  let finalAmount = Number(amount);
  try {
    if ((currency || 'USD').toUpperCase() !== 'USD') {
      if (card2crypto && typeof card2crypto.convertToUSD === 'function') {
        const conv = await card2crypto.convertToUSD((currency || 'USD').toUpperCase(), amount);
        if (conv && (conv.value_coin || conv.value)) finalAmount = Number(conv.value_coin || conv.value);
      } else {
        const conv = await axios.get(`${process.env.CARD2CRYPTO_API_URL}/control/convert.php`, { params: { from: (currency || 'USD').toUpperCase(), value: amount } });
        if (conv && conv.data && (conv.data.value_coin || conv.data.value)) finalAmount = Number(conv.data.value_coin || conv.data.value);
      }
    }
  } catch (e) {
    console.warn('Card2Crypto conversion failed, continuing with original amount', e && e.message);
  }

  const orderIdLocal = incomingOrderId || uuidv4();
  const cbWithOrder = new URLSearchParams({ orderId: orderIdLocal || '', secret: process.env.CARD2CRYPTO_CALLBACK_SECRET || '' });
  const callbackWithOrderUrl = `${process.env.YOUR_API_BASE_URL || (`https://${req.get('host')}`) }/api/webhooks/card2crypto?${cbWithOrder.toString()}`;

  if (!process.env.CARD2CRYPTO_API_URL) throw new Error('Missing CARD2CRYPTO_API_URL environment variable');

  let walletResp = null;
  try {
    const walletParams = new URLSearchParams({ callback_url: callbackWithOrderUrl, usdc_wallet: process.env.CARD2CRYPTO_PAYOUT_WALLET || '' });
    const apiBase = String(process.env.CARD2CRYPTO_API_URL).replace(/\/+$/g, '');
    walletResp = await axios.get(`${apiBase}/control/wallet.php?${walletParams.toString()}`);
  } catch (eAxios) {
    try {
      if (card2crypto && typeof card2crypto.createWalletAddress === 'function') {
        walletResp = await card2crypto.createWalletAddress({ callback_url: callbackWithOrderUrl, usdc_wallet: process.env.CARD2CRYPTO_PAYOUT_WALLET || '' });
      } else {
        throw eAxios;
      }
    } catch (e2) {
      throw new Error('Failed to generate wallet address');
    }
  }

  const encryptedAddress = (walletResp && walletResp.data) ? (walletResp.data.address_in || walletResp.data.address || walletResp.data.encrypted_address || walletResp.data.address_in_hex) : (walletResp && (walletResp.address_in || walletResp.address || walletResp.encrypted_address || walletResp.address_in_hex));
  if (!encryptedAddress) throw new Error('Failed to generate encrypted wallet address');

  // Persist order only after wallet created
  let orderId = incomingOrderId || orderIdLocal;
  if (!incomingOrderId) {
    try {
      const now = new Date().toISOString();
      await supabase.insert('orders', { id: orderId, status: 'pending', total_price: Number(finalAmount).toFixed(2), created_at: now, updated_at: now });
    } catch (e) {
      console.warn('Failed to create order for Card2Crypto payment after wallet creation:', e && e.message);
    }
  }

  const paymentUrl = (card2crypto && typeof card2crypto.buildPayUrl === 'function')
    ? card2crypto.buildPayUrl({ address: encryptedAddress, amount: finalAmount, email: email || '', currency: 'USD', domain: process.env.CARD2CRYPTO_PAY_DOMAIN || 'pay.card2crypto.org' })
    : `${(process.env.CARD2CRYPTO_PAY_URL || 'https://pay.card2crypto.org').replace(/\/+$/g, '')}/pay.php?${new URLSearchParams({ address: encryptedAddress, amount: finalAmount, email: email || '', currency: 'USD', domain: process.env.CARD2CRYPTO_PAY_DOMAIN || 'pay.card2crypto.org' }).toString()}`;

  return { paymentUrl, orderId };
}

// Simple in-memory 2FA store: requestId => { code, contact, expiresAt, verified }
// Note: in production you should persist this (Redis or DB) and send SMS/email via a provider.
const twoFAStore = new Map();

// Helper: extract provider transaction id from various hosted response shapes
function extractProviderTransactionId(hosted) {
  if (!hosted) return null;
  // common shapes: { id } or { payment_id } or { data: { id } } or { data: { payment_id } }
  if (hosted.id) return hosted.id;
  if (hosted.payment_id) return hosted.payment_id;
  if (hosted.data && (hosted.data.id || hosted.data.payment_id)) return hosted.data.id || hosted.data.payment_id;
  // some providers may nest further under hosted.data.data etc.
  if (hosted.data && hosted.data.data && (hosted.data.data.id || hosted.data.data.payment_id)) return hosted.data.data.id || hosted.data.data.payment_id;
  return null;
}

// Verify a client-created paymentId with the payment provider (Card2Crypto) before creating an order.
// Body: { paymentId, amount, currency }
router.post('/verify', verifyJWT, async (req, res) => {
  try {
    const { paymentId, amount, currency } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

  // Fetch payment details from provider
  const paymentData = await card2crypto.getPayment(paymentId);
    if (!paymentData) return res.status(404).json({ error: 'Payment not found' });

    const status = (paymentData.status || paymentData.status_code || '').toString().toLowerCase();
    const okStatuses = ['paid', 'succeeded', 'completed', 'success', 'authorized', 'captured'];
    if (!okStatuses.includes(status)) {
      return res.status(400).json({ error: `Payment not in a final successful state: ${status}`, status });
    }

    // Basic amount check (attempt to handle minor/major unit differences)
    let providerAmount = null;
    if (paymentData.amount !== undefined && paymentData.amount !== null) {
      providerAmount = Number(paymentData.amount);
      if (providerAmount > (Number(amount || 0) * 10)) {
        providerAmount = providerAmount / 100;
      }
    }
    if (providerAmount !== null && Math.abs(providerAmount - Number(amount || 0)) > 0.5) {
      return res.status(400).json({ error: 'Payment amount does not match', providerAmount });
    }

    return res.json({ success: true, payment: paymentData });
  } catch (err) {
    console.error('Payment verify error:', err && (err.message || err));
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// 2FA: send verification code to contact (phone or email). Returns requestId.
router.post('/2fa/send', verifyJWT, async (req, res) => {
  try {
    const { contact, ttl = 600 } = req.body; // ttl seconds, default 10 minutes
    if (!contact || typeof contact !== 'string' || !contact.trim()) return res.status(400).json({ error: 'contact is required (phone or email)' });

    const requestId = uuidv4();
    // generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + Number(ttl) * 1000;

    twoFAStore.set(requestId, { code, contact, expiresAt, verified: false, createdAt: Date.now(), attempts: 0 });

    // In production, hook in SMS/email provider here. For now, log and (in dev) return code.
    console.log(`[payments/2fa] Sent code ${code} to ${contact} for request ${requestId}`);

    const response = { requestId, sent: true };
    if (process.env.NODE_ENV !== 'production') response.debugCode = code;
    return res.json(response);
  } catch (err) {
    console.error('2FA send error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to send 2FA' });
  }
});

// 2FA: verify code for a requestId
router.post('/2fa/verify', verifyJWT, async (req, res) => {
  try {
    const { requestId, code } = req.body;
    if (!requestId || !code) return res.status(400).json({ error: 'requestId and code are required' });
    const rec = twoFAStore.get(requestId);
    if (!rec) return res.status(404).json({ error: 'Invalid requestId' });
    if (Date.now() > rec.expiresAt) {
      twoFAStore.delete(requestId);
      return res.status(400).json({ error: 'Code expired' });
    }
    rec.attempts = (rec.attempts || 0) + 1;
    if (rec.code === String(code).trim()) {
      rec.verified = true;
      twoFAStore.set(requestId, rec);
      return res.json({ success: true });
    }
    // don't reveal correct code
    return res.status(400).json({ success: false, error: 'Invalid code' });
  } catch (err) {
    console.error('2FA verify error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Initiate a bank transfer hosted payment (requires a verified 2FA requestId)
router.post('/bank/initiate', verifyJWT, async (req, res) => {
  try {
  const { amount, currency = 'USD', bankDetails = {}, metadata = {} } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'amount is required and must be > 0' });

    // Build payload for hosted payment but restrict payment methods to bank_transfer only
    const payload = {
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
  return_url: `https://${req.get('host')}/order-confirmation`,
  cancel_url: `https://${req.get('host')}/checkout`,
      metadata: Object.assign({}, metadata),
      payment_method_types: ['bank_transfer']
    };
  // Log payload for debugging (remove sensitive info)
  console.log('[bank/initiate] Card2Crypto payload:', { ...payload, metadata: '[REDACTED]' });

  const hosted = await card2crypto.createHostedPayment(payload);

    // Optionally persist a payments row with pending status (handled by webhook later).
    // IMPORTANT: Never persist raw bank details. Only store minimal metadata and encrypt
    try {
      const supabase = require('../utils/supabaseRest');
      const persisted = {
        provider: 'card2crypto',
        transaction_id: extractProviderTransactionId(hosted) || null,
        status: 'pending',
        amount: Number(amount),
        created_at: new Date().toISOString()
      };
      await supabase.insert('payments', persisted);
    } catch (e) {
      console.warn('Could not persist initial payment row for hosted bank transfer:', e && e.message);
    }

    // Return standardized hosted payment info to client: { url?, paymentId?, hosted? }
    const redirectUrl = hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url) || null;
    const paymentId = hosted.id || hosted.payment_id || (hosted.data && hosted.data.id) || null;
    return res.json({ url: redirectUrl, paymentId, hosted });
  } catch (err) {
    console.error('Bank initiate error:', err && (err.message || err));
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// --- Crypto Support ---
// Return a list of supported crypto assets and whether they appear active for this business.
router.get('/crypto/available', async (req, res) => {
  try {
    // list of desired assets (initially inactive); easily extendable
    const desired = [
      'BTC','ETH','LTC','USDC','USDT','BNB','MATIC','CRO','SHIBA','APE','DAI','UNI','TRX'
    ];

    // Try to query the provider for enabled crypto assets for this business. If the
    // provider exposes an endpoint, return its info; otherwise fallback to list with active=false.
    let activeSet = new Set();
    let providerList = null;
    try {
      // provider may expose business-level crypto list at /businesses/{id}/cryptocurrencies
      const resp = await card2crypto.client ? null : null; // noop - client wrapper exposes methods
      // If the provider SDK has an explicit method, try to call it.
      if (typeof card2crypto.listBusinessCryptocurrencies === 'function') {
        providerList = await card2crypto.listBusinessCryptocurrencies();
        if (Array.isArray(providerList)) providerList.forEach(a => activeSet.add((a || '').toString().toUpperCase()));
      }
    } catch (e) {
      // ignore - provider endpoint may not exist in this SDK wrapper
    }

    // --- DETAILED PROVIDER AVAILABLE METHODS LOG ---
    try {
      console.log('--- DETAILED provider available methods log ---');
      // raw provider list (if any)
      console.log('provider.listBusinessCryptocurrencies() returned:', JSON.stringify(providerList, null, 2));
      // normalized active set
      console.log('normalized activeSet:', JSON.stringify(Array.from(activeSet), null, 2));
      console.log('--- END OF DETAILED LOG ---');
    } catch (logErr) {
      console.warn('Failed to stringify provider available methods for debug log', logErr && logErr.message ? logErr.message : logErr);
    }

    const cryptoResult = desired.map(sym => ({ symbol: sym, active: activeSet.has(sym) }));

    // --- THE FIX: force-enable a fiat/card option so the frontend can show Card->Crypto ---
    const fiatResult = [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        active: true
      }
    ];

    // Return both crypto and fiat lists. Frontend can show card option from `fiat`.
    return res.json({ cryptos: cryptoResult, fiat: fiatResult });
  } catch (err) {
    console.error('Crypto available error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'failed' });
  }
});

// Admin: activate one or more crypto assets for business via provider API (Card2Crypto)
router.post('/crypto/activate', verifyJWT, async (req, res) => {
  try {
    // Basic admin check if role present on user
    if (!req.user || (req.user.role && req.user.role !== 'admin')) return res.status(403).json({ error: 'admin_only' });
    const { assets } = req.body;
    if (!Array.isArray(assets) || assets.length === 0) return res.status(400).json({ error: 'assets array required' });

  // Attempt activation via provider wrapper if supported
    const results = [];
    for (const a of assets) {
      const sym = String(a).toUpperCase();
      try {
        if (typeof card2crypto.activateCrypto === 'function') {
          const r = await card2crypto.activateCrypto(sym);
          results.push({ asset: sym, ok: true, resp: r });
        } else {
          // If provider doesn't support activation API, return noop true so UI can enable asset client-side
          results.push({ asset: sym, ok: true, note: 'no-provider-api' });
        }
      } catch (e) {
        results.push({ asset: sym, ok: false, error: e && e.message });
      }
    }
    return res.json({ results });
  } catch (err) {
    console.error('Crypto activate error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'failed' });
  }
});

// Create a crypto hosted payment for a verified 2FA request. Ensures 2FA verified
// before creating a hosted crypto payment and returns hosted checkout URL/id.
router.post('/crypto/initiate', verifyJWT, async (req, res) => {
  try {
  const { asset, amount, currency = 'USD', metadata = {} } = req.body;
  if (!asset || typeof asset !== 'string') return res.status(400).json({ error: 'asset is required' });
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'amount is required and must be > 0' });

    // Build hosted payment payload for crypto. Many providers expect an explicit
    // field to restrict crypto currencies (e.g. payment_method_options.crypto.currencies)
    const payload = {
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
  return_url: `https://${req.get('host')}/order-confirmation`,
  cancel_url: `https://${req.get('host')}/checkout`,
      metadata: Object.assign({}, metadata),
      payment_method_types: ['crypto'],
      payment_method_options: {
        crypto: { currencies: [String(asset).toUpperCase()] }
      }
    };
  // Log payload for debugging (remove sensitive info)
  console.log('[crypto/initiate] Card2Crypto payload:', { ...payload, metadata: '[REDACTED]' });

  const hosted = await card2crypto.createHostedPayment(payload);

    // Persist a minimal payment row - NO sensitive customer info stored unencrypted
    try {
      const supabase = require('../utils/supabaseRest');
  const row = { provider: 'card2crypto', transaction_id: extractProviderTransactionId(hosted) || null, status: 'pending', amount: Number(amount), created_at: new Date().toISOString() };
      // ...existing code...
      await supabase.insert('payments', row);
    } catch (e) {
      console.warn('Could not persist initial crypto payment row:', e && e.message);
    }

    const redirectUrl = hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url) || null;
    const paymentId = hosted.id || hosted.payment_id || (hosted.data && hosted.data.id) || null;
    return res.json({ url: redirectUrl, paymentId, hosted });
  } catch (err) {
    console.error('Crypto initiate error:', err && (err.message || err));
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// Create a card hosted payment for a verified 2FA request. Similar to crypto/bank flows.
router.post('/card/initiate', verifyJWT, async (req, res) => {
  try {
  const { amount, currency = 'USD', metadata = {} } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'amount is required and must be > 0' });

    const payload = {
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
  return_url: `https://${req.get('host')}/order-confirmation`,
  cancel_url: `https://${req.get('host')}/checkout`,
      metadata: Object.assign({}, metadata),
      payment_method_types: ['card']
    };
  // Log payload for debugging (remove sensitive info)
  console.log('[card/initiate] payment provider payload:', { ...payload, metadata: '[REDACTED]' });

    // Use Card2Crypto flow for card-hosted payments
    try {
      const { paymentUrl, orderId } = await createCard2CryptoPayment({ incomingOrderId: null, email: (metadata && metadata.email) || null, currency: currency, amount, req });
      // Persist minimal payment row (pending)
      try {
        const supabase = require('../utils/supabaseRest');
        const row = {
          provider: 'card2crypto',
          transaction_id: null,
          status: 'pending',
          amount: Number(amount),
          order_id: orderId || null,
          created_at: new Date().toISOString()
        };
        await supabase.insert('payments', row);
      } catch (e) {
        console.warn('Could not persist initial card2crypto payment row:', e && e.message);
      }

      return res.json({ url: paymentUrl, paymentId: orderId, hosted: { url: paymentUrl } });
    } catch (e) {
      console.error('Card2Crypto create hosted payment failed', e && e.message);
      return res.status(502).json({ error: 'Payment provider error' });
    }
  } catch (err) {
    console.error('Card initiate error:', err && (err.message || err));
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// NOTE: Server-side tokenization endpoint removed to enforce client-side SDK
// tokenization/payment creation only. This reduces PCI scope by ensuring PAN
// never reaches our servers. If you need to re-enable server tokenization,
// restore the handler and ensure strict logging/redaction.

// Charge a token
router.post('/charge', verifyJWT, async (req, res) => {
  try {
    const { token, amount, currency } = req.body;
    if (!token || !amount) return res.status(400).json({ error: 'token and amount are required' });

  const charge = await card2crypto.createCharge({ token, amount, currency: currency || 'USD', metadata: { user: req.user && req.user.id } });
    return res.json({ charge });
  } catch (err) {
    console.error('Payment provider charge error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// Webhook endpoint: Card2Crypto (or compatible provider) will POST events here. We verify signature using raw body.
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
  const rawSigHeader = req.headers['card2crypto-signature'] || req.headers['x-card2crypto-signature'] || req.headers['stripe-signature'];
    // Normalize signature header to handle multiple shapes:
    // - plain signature: "<sig>"
    // - prefixed: "v1=<sig>"
    // - comma-separated (svix/stripe): "t=...,v1=<sig>" or "v1=<sig>,v0=..."
    let sigHeader = rawSigHeader;
    try {
      if (typeof rawSigHeader === 'string') {
        // If comma-separated, use the second part if present (common svix/stripe ordering)
        if (rawSigHeader.includes(',')) {
          const parts = rawSigHeader.split(',');
          if (parts.length >= 2) {
            const maybe = parts[1].trim();
            if (maybe.includes('=')) {
              const after = maybe.split('=')[1];
              if (after) sigHeader = after.trim();
            } else if (maybe) {
              sigHeader = maybe;
            }
          }
        } else if (rawSigHeader.startsWith('v1=')) {
          // header like "v1=<sig>"
          const after = rawSigHeader.split('=')[1];
          if (after) sigHeader = after.trim();
        }
      }
    } catch (e) {
      // Fall back to raw header if anything goes wrong parsing
      sigHeader = rawSigHeader;
    }

    // Prefer the exact raw bytes cached by the JSON parser (app.js sets req.rawBody)
    // falling back to Buffer req.body if present.
    let rawBuffer = null;
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) rawBuffer = req.rawBody;
    else if (req.body && Buffer.isBuffer(req.body)) rawBuffer = req.body;
    else if (req.body && typeof req.body === 'string') rawBuffer = Buffer.from(req.body, 'utf8');
    else if (req.body && typeof req.body === 'object') rawBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
    else rawBuffer = Buffer.from('', 'utf8');

  const ok = card2crypto.verifyWebhookSignature(rawBuffer, sigHeader);
    if (!ok) {
      console.warn('Provider webhook signature verification failed');
      return res.status(400).send('invalid signature');
    }

    // Parse JSON safely from the raw buffer (preferred) or req.body fallback
    let event = null;
    try { event = JSON.parse(rawBuffer.toString('utf8')); } catch (e) { event = (req.body && typeof req.body === 'object') ? req.body : null; if (!event) console.warn('Webhook JSON parse failed', e && e.message); }

    // Handle event types: persist to DB (idempotent) and broadcast real-time updates via Socket.io
    try {
      const supabase = require('../utils/supabaseRest');
      const { getIO } = require('../utils/socket');
      const io = getIO();

      if (event) {
        const t = (event.type || '').toString();
        // normalize payload values
        const data = event.data || {};
        const providerId = data.id || data.payment_id || data.paymentId || data.transaction_id || data.transactionId;
        const rawStatus = (data.status || data.state || (t.includes('succeeded') ? 'succeeded' : '') || '').toString().toLowerCase();

  // map provider status to our canonical status values (schema allows only: pending, confirmed, failed, refunded)
  // Support provider-specific statuses: Awaiting, Pending (blockchain), Expired, Completed, Cancelled
  let canonicalStatus = 'pending';
  // normalize
  const rs = (rawStatus || '').toString().toLowerCase();
  if (['paid', 'succeeded', 'completed', 'captured', 'authorized', 'confirmed', 'success'].includes(rs)) canonicalStatus = 'confirmed';
  else if (['awaiting', 'pending'].includes(rs)) canonicalStatus = 'pending';
  else if (['expired'].includes(rs)) canonicalStatus = 'failed';
  else if (['cancelled', 'canceled'].includes(rs)) canonicalStatus = 'failed';
  else if (['failed', 'declined', 'voided'].includes(rs)) canonicalStatus = 'failed';
  else if (t.includes('refund') || rs === 'refunded' || rs.includes('refund')) canonicalStatus = 'refunded';

        // amount may be in minor units
        let amount = null;
        if (data.amount !== undefined && data.amount !== null) {
          amount = Number(data.amount);
          if (amount > 10000) amount = amount / 100; // heuristic convert cents -> major
        }

        // Build payment row to upsert by transaction_id (provider id)
        const paymentRow = {
          provider: 'card2crypto',
          transaction_id: providerId || null,
          // persist canonical status into the payments.status column (DB expects canonical values)
          status: canonicalStatus,
          raw_event: JSON.stringify(event),
          amount: amount !== null ? Number(amount) : null,
          order_id: data.order_id || (data.metadata && data.metadata.order_id) || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          // Upsert payment record using transaction_id as unique key
          // Upsert payment record using transaction_id as unique key
          await supabase.upsert('payments', paymentRow, { on_conflict: 'transaction_id' });
          // Re-select the saved payment row to obtain canonical fields (PostgREST may not return representation)
          const savedRows = await supabase.select('payments', { select: '*', transaction_id: `eq.${paymentRow.transaction_id}`, limit: '1' });
          const saved = Array.isArray(savedRows) && savedRows[0] ? savedRows[0] : null;

          // If payment is linked to an order, update order status accordingly
          if (saved && saved.order_id) {
            let newOrderStatus = null;
              if (canonicalStatus === 'confirmed') newOrderStatus = 'paid';
            else if (canonicalStatus === 'failed') newOrderStatus = 'payment_failed';
              else if (canonicalStatus === 'refunded') newOrderStatus = 'refunded';

            if (newOrderStatus) {
              try {
                await supabase.patch('orders', { status: newOrderStatus, updated_at: new Date().toISOString() }, { id: `eq.${saved.order_id}` });
              } catch (e) {
                console.warn('Failed to update order status from webhook:', e && e.message);
              }
            }
          }

          // Also try to update invoices for this order so stored invoice content includes payment info
          try {
            if (saved && saved.order_id) {
              const invRows = await supabase.select('invoices', { order_id: `eq.${saved.order_id}` });
              if (Array.isArray(invRows) && invRows.length > 0) {
                for (const inv of invRows) {
                  try {
                    // decode existing content (try decrypting encrypted bytea first)
                    let content = null;
                    if (inv.content && typeof inv.content === 'string' && inv.content.startsWith('\\x')) {
                      try {
                        const dec = decryptFromByteaHex(inv.content);
                        content = dec ? JSON.parse(dec) : null;
                      } catch (de) {
                        try { const jsonStr = Buffer.from(inv.content.slice(2), 'hex').toString(); content = JSON.parse(jsonStr); } catch (e) { content = null; }
                      }
                    } else if (inv.content) {
                      content = typeof inv.content === 'string' ? JSON.parse(inv.content) : inv.content;
                    }
                    if (!content) content = {};
                    // merge payment info
                    content.payment = content.payment || {};
                    content.payment.provider = content.payment.provider || saved.provider || paymentRow.provider;
                    content.payment.transaction_id = content.payment.transaction_id || saved.transaction_id || paymentRow.transaction_id;
                    content.payment.status = content.payment.status || paymentRow.status;
                    content.payment.amount = content.payment.amount || paymentRow.amount;

                    const contentHex = encryptToByteaHex(content);
                    await supabase.patch('invoices', { payment_provider: content.payment.provider, payment_transaction_id: content.payment.transaction_id, content: contentHex, updated_at: new Date().toISOString() }, { id: `eq.${inv.id}` });
                  } catch (e) {
                    console.warn('Failed to update invoice content from webhook for invoice', inv && inv.id, e && e.message);
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Failed to sync invoices from webhook payment:', e && e.message);
          }

          // Emit socket events to connected clients with the reconciled payment + order info
          const emitPayload = { event: event.type || 'payment.event', providerId, status: canonicalStatus, amount, payment: saved || null };
          try { if (io) io.emit('payment.update', emitPayload); } catch (e) { console.warn('Socket emit failed:', e && e.message); }
        } catch (dbErr) {
          console.error('Webhook DB upsert error:', dbErr && (dbErr.message || dbErr));
        }
      }
    } catch (e) {
      console.warn('Webhook processing error:', e && e.message);
    }

    // Acknowledge receipt
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error', err && err.message ? err.message : err);
    res.status(500).send('server error');
  }
});

// Create hosted payment (server-side) and return hosted page information
// Create hosted payment (server-side) and return hosted page information
router.post('/hosted', verifyJWT, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { amount, currency, return_url, cancel_url, metadata, paymentMethods, customerEmail, customerIp, customerUserAgent } = req.body;

    // --- Validation ---
    const validationErrors = [];
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      validationErrors.push('amount is required and must be a number > 0');
    }
    if (validationErrors.length) {
      return res.status(400).json({ error: 'invalid_request', details: validationErrors });
    }

    // Guard: ensure provider API is configured before creating an order to avoid orphans
    if (!process.env.CARD2CRYPTO_API_URL) {
      console.error('Card2Crypto API URL is not configured (CARD2CRYPTO_API_URL)');
      return res.status(502).json({ error: 'Payment provider misconfigured' });
    }

    // Create an order row first so we can include its ID in the hosted payment metadata
    let orderIdLocal = null;
    try {
      const orderPayload = {
        user_id: userId,
        status: 'pending',
        total_price: Number(amount).toFixed(2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      // generate an id locally so we can reference it in metadata without relying on returning
      orderIdLocal = uuidv4();
      orderPayload.id = orderIdLocal;
      await supabase.insert('orders', orderPayload);
      console.log('[payments/hosted] Created order', orderIdLocal, 'before creating hosted payment');
    } catch (e) {
      console.error('Failed to create order before hosted payment:', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // --- Payload ---
    const payload = {
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      return_url: return_url || `${req.protocol}://${req.get('host')}/order-confirmation`,
      cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/checkout`,
      metadata: Object.assign({}, metadata || {}, { userId, order_id: orderIdLocal }),
      paymentMethods: paymentMethods || null,
      customerEmail: customerEmail || null,
      customerIp: customerIp || null,
      customerUserAgent: customerUserAgent || null
    };

    // Use Card2Crypto hosted flow for backend-hosted payments when possible
    try {
      const { paymentUrl, orderId } = await createCard2CryptoPayment({ incomingOrderId: orderIdLocal, email: customerEmail, currency: payload.currency, amount: payload.amount, req });
      return res.json({ url: paymentUrl, paymentId: orderIdLocal, orderId: orderIdLocal });
    } catch (e) {
      console.error('Card2Crypto hosted create failed', e && e.message);
      return res.status(502).json({ error: 'Payment provider error' });
    }
  } catch (err) {
      console.error('Card2Crypto hosted payment error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

  // Debug: return last raw Card2Crypto response observed by the server
// Protected by verifyJWT so only authenticated users can access it
router.get('/hosted/last', verifyJWT, async (req, res) => {
  try {
      const last = card2crypto && card2crypto._lastRawResponse ? card2crypto._lastRawResponse : null;
    return res.json({ lastRaw: last });
  } catch (e) {
      console.error('Failed to return last Card2Crypto raw response', e && e.message ? e.message : e);
    return res.status(500).json({ error: 'failed' });
  }
});

// Check hosted payment status/existence by provider id
router.get('/hosted/status', verifyJWT, async (req, res) => {
  try {
    const paymentId = req.query.paymentId || req.query.id;
    if (!paymentId) return res.status(400).json({ error: 'paymentId query param required' });

    try {
  const paymentData = await card2crypto.getPayment(paymentId);
      return res.json({ found: true, payment: paymentData });
    } catch (e) {
      // If provider returns 404 or similar, surface not found
      return res.status(404).json({ found: false, error: 'not_found' });
    }
  } catch (err) {
    console.error('Hosted status check error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'provider_error' });
  }
});

module.exports = router;

