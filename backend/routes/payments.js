const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const hoodpay = require('../utils/hoodpay');
const { encryptText, decryptText, encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');
const { v4: uuidv4 } = require('uuid');

// 2FA removed: provider-hosted pages handle verification/3DS. No in-memory store.

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

// Helper: normalize provider hosted response to find a usable checkout URL and id
/**
 * Tries to find a checkout URL or a payment ID from a provider response.
 * This is hyper-defensive and checks many common object structures.
 * @param {object} resp The raw response from the payment provider (Hoodpay)
 * @returns {{checkoutUrl: string | null, paymentId: string | null, error: string | null}}
 */
function normalizeHostedResponse(resp) {
  // 1. Check for a top-level error from the provider
  if (resp && (resp.error || resp.message) && typeof (resp.error || resp.message) === 'string') {
    return { checkoutUrl: null, paymentId: null, error: resp.error || resp.message };
  }

  // 2. Define the base URL (fallbacks to env, then default)
  const HOODPAY_PUBLIC_BASE = process.env.HOODPAY_PUBLIC_BASE || 'https://api.hoodpay.io/v1';

  let url = null;
  let id = null;

  // 3. Search for a direct URL in common places
  if (typeof resp.checkoutUrl === 'string') url = resp.checkoutUrl;
  else if (typeof resp.url === 'string') url = resp.url;
  else if (resp.data && typeof resp.data.url === 'string') url = resp.data.url;
  else if (resp.links && typeof resp.links.checkout_url === 'string') url = resp.links.checkout_url;
  else if (resp.payment && typeof resp.payment.url === 'string') url = resp.payment.url;
  
  // 4. If we found a URL, we are done
  if (url) {
    return { checkoutUrl: url, paymentId: null, error: null };
  }

  // 5. If no URL, search for an ID to build one
  if (typeof resp.id === 'string') id = resp.id;
  else if (typeof resp.paymentId === 'string') id = resp.paymentId;
  else if (resp.data && typeof resp.data.id === 'string') id = resp.data.id;
  else if (resp.payment && typeof resp.payment.id === 'string') id = resp.payment.id;
  else if (resp.hosted && typeof resp.hosted.id === 'string') id = resp.hosted.id;

  // 6. If we found an ID, build the URL
  if (id) {
    return {
      checkoutUrl: `${HOODPAY_PUBLIC_BASE}/public/payments/hosted-page/${id}`,
      paymentId: id,
      error: null
    };
  }

  // 7. If we found nothing, return an error
  return { checkoutUrl: null, paymentId: null, error: "Could not normalize provider response structure." };
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

// 2FA endpoints removed — verification is handled by the payment provider's
// hosted checkout pages (3DS/verification flows). Frontend no longer uses
// /api/payments/2fa/*.

// Bank payment support removed — we no longer expose a /bank/initiate endpoint.
// Card and Crypto hosted payments remain supported via /card/initiate and
// /crypto/initiate.

// --- Crypto Support ---
// Return a list of supported crypto assets and whether they appear active for this business.
router.get('/crypto/available', async (req, res) => {
  try {
    // list of desired assets (initially inactive); easily extendable
    const desired = [
      'BTC','ETH','LTC','USDC','USDT','BNB','MATIC','CRO','SHIBA','APE','DAI','UNI','TRX'
    ];
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

    // Normalize provider response to find url/id (hyper-defensive)
    try {
      const { checkoutUrl, paymentId, error } = normalizeHostedResponse(hosted);
      if (error || !checkoutUrl) {
        // Provide a clear error for the frontend to display
        return res.status(400).json({ message: 'Failed to create payment session.', providerError: error || 'Unknown provider response structure.' });
      }
      return res.json({ checkoutUrl, paymentId });
    } catch (e) {
      console.warn('Failed to normalize hosted response:', e && e.message);
      return res.status(502).json({ message: 'Failed to create payment session.', providerError: 'Normalization failure' });
    }
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

    // Normalize provider response to find url/id (hyper-defensive)
    try {
      const { checkoutUrl, paymentId, error } = normalizeHostedResponse(hosted);
      if (error || !checkoutUrl) {
        return res.status(400).json({ message: 'Failed to create payment session.', providerError: error || 'Unknown provider response structure.' });
      }
      return res.json({ checkoutUrl, paymentId });
    } catch (e) {
      console.warn('Failed to normalize hosted response:', e && e.message);
      return res.status(502).json({ message: 'Failed to create payment session.', providerError: 'Normalization failure' });
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

    const charge = await hoodpay.createCharge({ token, amount, currency: currency || 'USD', metadata: { user: req.user && req.user.id } });
    return res.json({ charge });
  } catch (err) {
    console.error('HoodPay charge error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

// Webhook endpoint: HoodPay will POST events here. We verify signature using raw body.
router.post('/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const sigHeader = req.headers['hoodpay-signature'] || req.headers['x-hoodpay-signature'] || req.headers['stripe-signature'];

    // Prefer the exact raw bytes cached by the JSON parser (app.js sets req.rawBody)
    // falling back to Buffer req.body if present.
    let rawBuffer = null;
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) rawBuffer = req.rawBody;
    else if (req.body && Buffer.isBuffer(req.body)) rawBuffer = req.body;
    else if (req.body && typeof req.body === 'string') rawBuffer = Buffer.from(req.body, 'utf8');
    else if (req.body && typeof req.body === 'object') rawBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
    else rawBuffer = Buffer.from('', 'utf8');

    const ok = hoodpay.verifyWebhookSignature(rawBuffer, sigHeader);
    if (!ok) {
      console.warn('HoodPay webhook signature verification failed');
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
          provider: 'hoodpay',
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
router.post('/hosted', verifyJWT, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { amount, currency, return_url, cancel_url, metadata } = req.body;
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
      metadata: Object.assign({}, metadata || {}, { userId })
    };

    const hosted = await hoodpay.createHostedPayment(payload);

    // hosted may contain an id and possibly a hosted_page_url or public url
    let redirectUrl = hosted.hosted_page_url || hosted.hosted_url || hosted.url || hosted.redirect_url || (hosted.data && hosted.data.hosted_page_url);
    let providerId = hosted.id || hosted.payment_id || (hosted.data && hosted.data.id) || extractProviderTransactionId(hosted);

    if (!redirectUrl && providerId) {
      redirectUrl = `${process.env.HOODPAY_PUBLIC_BASE || 'https://api.hoodpay.io/v1'}/public/payments/hosted-page/${providerId}`;
    }

    if (redirectUrl) {
      return res.json({ checkoutUrl: redirectUrl, paymentId: providerId });
    }

    // Fallback: return a small hosted object (avoid echoing the full provider response)
    return res.json({ hosted: { id: providerId, raw: hosted && (hosted.data || hosted) ? hosted.data || hosted : hosted } });
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
