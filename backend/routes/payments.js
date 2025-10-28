const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const hoodpay = require('../utils/hoodpay');

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

        // map provider status to our canonical status values
        let canonicalStatus = 'unknown';
        if (['paid', 'succeeded', 'completed', 'captured', 'authorized'].includes(rawStatus)) canonicalStatus = 'paid';
        else if (['failed', 'declined', 'canceled', 'cancelled', 'voided'].includes(rawStatus)) canonicalStatus = 'failed';
        else if (t.includes('refund') || rawStatus === 'refunded') canonicalStatus = 'refunded';

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
          status: canonicalStatus,
          raw_event: JSON.stringify(event),
          amount: amount !== null ? String(amount) : null,
          updated_at: new Date().toISOString()
        };

        try {
          // Upsert payment record using transaction_id as unique key
          const upserted = await supabase.upsert('payments', paymentRow, { on_conflict: 'transaction_id', returning: '*' });
          const saved = Array.isArray(upserted) && upserted[0] ? upserted[0] : null;

          // If payment is linked to an order, update order status accordingly
          if (saved && saved.order_id) {
            let newOrderStatus = null;
            if (canonicalStatus === 'paid') newOrderStatus = 'paid';
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
    return res.json({ hosted });
  } catch (err) {
    console.error('HoodPay hosted payment error:', err && err.message ? err.message : err);
    return res.status(502).json({ error: 'Payment provider error' });
  }
});

module.exports = router;
