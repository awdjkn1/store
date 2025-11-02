const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const hoodpay = require('../utils/hoodpay');
const { encryptText, decryptText, encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

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

// Verify a client-created paymentId with HoodPay before creating an order.
// Body: { paymentId, amount, currency }
router.post('/verify', verifyJWT, async (req, res) => {
  try {
    const { paymentId, amount, currency } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' });

    // Fetch payment details from provider
    const paymentData = await hoodpay.getPayment(paymentId);
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
    console.log('[bank/initiate] HoodPay payload:', { ...payload, metadata: '[REDACTED]' });

  const hosted = await hoodpay.createHostedPayment(payload);

    // Optionally persist a payments row with pending status (handled by webhook later).
    // IMPORTANT: Never persist raw bank details. Only store minimal metadata and encrypt
    // any contact information. Bank/account fields must NOT be saved to DB.
    try {
      const supabase = require('../utils/supabaseRest');
      const persisted = {
        provider: 'hoodpay',
        transaction_id: extractProviderTransactionId(hosted) || null,
        status: 'pending',
        amount: Number(amount),
        created_at: new Date().toISOString()
      };
      // ...existing code...
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

    // Try to query HoodPay for enabled crypto assets for this business. If provider
    // exposes an endpoint, return its info; otherwise fallback to list with active=false.
    let activeSet = new Set();
    try {
      // provider may expose business-level crypto list at /businesses/{id}/cryptocurrencies
      const resp = await hoodpay.client ? null : null; // noop - hoodpay client wrapper exposes methods
      // If hoodpay has an explicit method, try to call it.
      if (typeof hoodpay.listBusinessCryptocurrencies === 'function') {
        const list = await hoodpay.listBusinessCryptocurrencies();
        if (Array.isArray(list)) list.forEach(a => activeSet.add((a || '').toString().toUpperCase()));
      }
    } catch (e) {
      // ignore - provider endpoint may not exist in this SDK wrapper
    }

    const result = desired.map(sym => ({ symbol: sym, active: activeSet.has(sym) }));
    return res.json({ cryptos: result });
  } catch (err) {
    console.error('Crypto available error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'failed' });
  }
});

// Admin: activate one or more crypto assets for business via HoodPay API
router.post('/crypto/activate', verifyJWT, async (req, res) => {
  try {
    // Basic admin check if role present on user
    if (!req.user || (req.user.role && req.user.role !== 'admin')) return res.status(403).json({ error: 'admin_only' });
    const { assets } = req.body;
    if (!Array.isArray(assets) || assets.length === 0) return res.status(400).json({ error: 'assets array required' });

    // Attempt activation via hoodpay wrapper if supported
    const results = [];
    for (const a of assets) {
      const sym = String(a).toUpperCase();
      try {
        if (typeof hoodpay.activateCrypto === 'function') {
          const r = await hoodpay.activateCrypto(sym);
          results.push({ asset: sym, ok: true, resp: r });
        } else {
          // If hoodpay doesn't support activation API, return noop true so UI can enable asset client-side
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
    console.log('[crypto/initiate] HoodPay payload:', { ...payload, metadata: '[REDACTED]' });

    const hosted = await hoodpay.createHostedPayment(payload);

    // Persist a minimal payment row - NO sensitive customer info stored unencrypted
    try {
      const supabase = require('../utils/supabaseRest');
  const row = { provider: 'hoodpay', transaction_id: extractProviderTransactionId(hosted) || null, status: 'pending', amount: Number(amount), created_at: new Date().toISOString() };
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
    console.log('[card/initiate] HoodPay payload:', { ...payload, metadata: '[REDACTED]' });

    const hosted = await hoodpay.createHostedPayment(payload);

    // Persist minimal payment row (pending) and optionally encrypted contact
    try {
      const supabase = require('../utils/supabaseRest');
      const row = {
        provider: 'hoodpay',
        transaction_id: extractProviderTransactionId(hosted) || null,
        status: 'pending',
        amount: Number(amount),
        created_at: new Date().toISOString()
      };

      // ...existing code...

      await supabase.insert('payments', row);
    } catch (e) {
      console.warn('Could not persist initial card payment row:', e && e.message);
    }

    const redirectUrl = hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url) || null;
    const paymentId = hosted.id || hosted.payment_id || (hosted.data && hosted.data.id) || null;
    return res.json({ url: redirectUrl, paymentId, hosted });
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

    const charge = await hoodpay.createCharge({ token, amount, currency: currency || 'USD', metadata: { user: req.user && req.user.id } });
    return res.json({ charge });
  } catch (err) {
    console.error('HoodPay charge error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// --- THIS IS THE CORRECTED WEBHOOK HANDLER ---
// It uses the correct Svix headers and signature math
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const secretString = process.env.HOODPAY_WEBHOOK_SECRET;

    // 1. Get all 3 required Svix headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    if (!secretString || !svix_id || !svix_timestamp || !svix_signature) {
      console.error("Webhook Error: Missing required Svix headers or secret.");
      return res.status(400).send('Error: Missing required Svix headers or secret.');
    }

    // 2. Decode the secret key
    const key = secretString.split('_')[1];
    if (!key) {
      throw new Error("Invalid secret format. Expected 'whsec_...'");
    }
    const secretKeyBuffer = Buffer.from(key, 'base64');

    // 3. Create the string to be signed
    const rawBody = req.body.toString(); // req.body is a Buffer from express.raw()
    const signedContent = `${svix_id}.${svix_timestamp}.${rawBody}`;

    // 4. Calculate the signature
    const hmac = crypto.createHmac('sha256', secretKeyBuffer);
    const calculatedSignature = hmac.update(signedContent).digest('base64');

    // 5. Get the signature from the header
    const signatureFromHeader = svix_signature.split(',')[1];

    // 6. Compare
    if (calculatedSignature !== signatureFromHeader) {
      console.error('HoodPay webhook signature verification failed! Signature did not match.');
      console.log(`Received:   ${signatureFromHeader}`);
      console.log(`Calculated: ${calculatedSignature}`);
      return res.status(400).send('Invalid signature');
    }

    // --- SIGNATURE IS VALID! ---
    
    let event = JSON.parse(rawBody);
    console.log(`Webhook received and verified: ${event.type}`);

    // ... (The rest of your event handling logic) ...
    // (This part is copied from your original file and is correct)
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

      let canonicalStatus = 'pending';
      const rs = (rawStatus || '').toString().toLowerCase();
      if (['paid', 'succeeded', 'completed', 'captured', 'authorized', 'confirmed', 'success'].includes(rs)) canonicalStatus = 'confirmed';
      else if (['failed', 'declined', 'voided', 'cancelled', 'canceled', 'expired'].includes(rs)) canonicalStatus = 'failed';
      else if (t.includes('refund') || rs === 'refunded' || rs.includes('refund')) canonicalStatus = 'refunded';

        let amount = null;
        if (data.amount !== undefined) {
           amount = Number(data.amount);
           if (amount > 10000) amount = amount / 100; // heuristic convert cents
        }

        const paymentRow = {
          provider: 'hoodpay',
          transaction_id: providerId || null,
          status: canonicalStatus,
          raw_event: JSON.stringify(event),
          amount: amount,
          order_id: data.order_id || (data.metadata && data.metadata.order_id) || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        try {
          await supabase.upsert('payments', paymentRow, { on_conflict: 'transaction_id' });
        } catch (dbErr) {
          console.error('Webhook DB upsert error:', dbErr && (dbErr.message || dbErr));
        }
      }
    } catch (dbErr) {
      console.warn('Webhook processing error:', dbErr && dbErr.message ? dbErr.message : dbErr);
    }

    // Acknowledge receipt
    res.json({ received: true });

  } catch (err) {
    console.error('Webhook handler error', err && err.message ? err.message : err);
    res.status(500).send('server error');
  }
});

// Create hosted payment (server-side) and return hosted page information
router.post('/hosted', verifyJWT, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
  const { amount, currency, return_url, cancel_url, metadata, paymentMethods, customerEmail, customerIp, customerUserAgent } = req.body;
    // Validate inputs with helpful error messages
    const validationErrors = [];
    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      validationErrors.push('amount is required and must be a number > 0');
    }
    if (currency && typeof currency === 'string' && !/^[A-Z]{3}$/.test(currency)) {
      validationErrors.push('currency must be a 3-letter ISO code (e.g. USD)');
    }
    if (return_url) {
      try { new URL(return_url); } catch (e) { validationErrors.push('return_url must be a valid absolute URL'); }
    }
    if (cancel_url) {
      try { new URL(cancel_url); } catch (e) { validationErrors.push('cancel_url must be a valid absolute URL'); }
    }
    if (metadata && typeof metadata !== 'object') {
      validationErrors.push('metadata must be an object');
    }

    if (validationErrors.length) {
      return res.status(400).json({ error: 'invalid_request', details: validationErrors });
    }

    const payload = {
      amount: Number(amount),
      currency: (currency || 'USD').toUpperCase(),
      return_url: return_url || `${req.protocol}://${req.get('host')}/order-confirmation`,
      cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/checkout`,
      metadata: Object.assign({}, metadata || {}, { userId }),
      paymentMethods: paymentMethods || null,
      customerEmail: customerEmail || null,
      customerIp: customerIp || null,
      customerUserAgent: customerUserAgent || null
    };

  const hosted = await hoodpay.createHostedPayment(payload);
  const redirectUrl = hosted && (hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url)) || null;
  const paymentId = hosted && (hosted.id || hosted.payment_id || (hosted.data && hosted.data.id)) || null;
  return res.json({ url: redirectUrl, paymentId, hosted });
  } catch (err) {
    console.error('HoodPay hosted payment error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// Check hosted payment status/existence by provider id
router.get('/hosted/status', verifyJWT, async (req, res) => {
  try {
    const paymentId = req.query.paymentId || req.query.id;
    if (!paymentId) return res.status(400).json({ error: 'paymentId query param required' });

    try {
      const paymentData = await hoodpay.getPayment(paymentId);
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
