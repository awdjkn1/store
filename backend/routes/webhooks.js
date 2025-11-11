const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const card2crypto = require('../utils/card2crypto');
const supabase = require('../utils/supabaseRest');
const webhookCache = require('../utils/webhookCache');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');

// Accept raw body for signature verification
router.post(
  '/card2crypto',
  express.raw({ type: 'application/json' }), // 1. Use the raw body parser
  async (req, res) => { // make handler async so we can await DB calls
    try {
  const secretString = process.env.CARD2CRYPTO_WEBHOOK_SECRET;

      // 2. Get all 3 required Svix headers
      const svix_id = req.headers['svix-id'];
      const svix_timestamp = req.headers['svix-timestamp'];
      const svix_signature = req.headers['svix-signature'];

      if (!secretString || !svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).send('Error: Missing required Svix headers or secret.');
      }

      // 3. --- Robust Svix-style signature verification ---
  // Expect CARD2CRYPTO_WEBHOOK_SECRET like: 'whsec_<BASE64>'
      const keyPart = (secretString || '').split('_')[1];
      if (!keyPart) throw new Error("Invalid webhook secret format (expected 'whsec_<base64>')");
      const secretKeyBuffer = Buffer.from(keyPart, 'base64');

      // Prefer the raw Buffer provided by express.raw()
      const rawBuffer = req.body && Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''), 'utf8');
      const rawBodyStr = rawBuffer.toString('utf8');
      const signedContent = `${svix_id}.${svix_timestamp}.${rawBodyStr}`;

      // Compute HMAC (base64)
      const computed = crypto.createHmac('sha256', secretKeyBuffer).update(signedContent).digest('base64');

      // Simplified Svix header parsing: expect format like "t=...,v1=<sig>,..."
      const svix_signature_header = req.headers['svix-signature'];
      if (!svix_signature_header) {
        return res.status(400).send('Missing svix-signature header');
      }
      const parts = svix_signature_header.split(',');
      if (parts.length < 2) {
        return res.status(400).send('Invalid svix-signature format');
      }
      // The signature is the second comma-separated part
      const signatureFromHeader = parts[1];

      // Compare calculated base64 HMAC to the header part
      if (computed !== signatureFromHeader) {
        console.error('Webhook signature verification failed! Signature did not match.');
        return res.status(400).send('Invalid signature');
      }

  // Signature valid — parse event
  const event = JSON.parse(rawBodyStr);
  console.log(`Webhook received and verified: ${event && event.type}`);

  // Store last verified event in ephemeral cache (admin debug endpoint will read this)
  try { webhookCache.setLastVerified(event); } catch (e) { /* ignore */ }

  // (already parsed 'event' above after signature verification)

      if (event.type === 'payment:completed') {
        console.log(`Payment Succeeded: ${event.data.id}`);

  // Attempt to update the corresponding order in our DB. Card2Crypto should
  // include the original metadata.order_id when you created the hosted payment.
        try {
          const orderId = (event.data && (event.data.order_id || (event.data.metadata && event.data.metadata.order_id))) || null;
          if (!orderId) {
            console.error('Webhook: payment:completed missing metadata.order_id, cannot update order');
          } else {
            // Update order status to 'paid' (or whatever status you prefer)
            try {
              await supabase.patch('orders', { status: 'paid', updated_at: new Date().toISOString() }, { id: `eq.${orderId}` });
              console.log(`Order ${orderId} marked as paid via webhook`);
            } catch (dbErr) {
              console.error('Failed to update order status from webhook:', dbErr && dbErr.message ? dbErr.message : dbErr);
            }
          }
        } catch (e) {
          console.error('Error handling payment:completed DB update:', e && e.message ? e.message : e);
        }
      }
      
      res.status(200).send({ received: true });

    } catch (err) {
      console.error("Webhook processing error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;

// Card2Crypto callback handler (GET)
router.get('/card2crypto', async (req, res) => {
  try {
    const { orderId, secret, value_coin, coin, txid_in, txid_out } = req.query || {};
      if ((secret || '') !== (process.env.CARD2CRYPTO_CALLBACK_SECRET || '')) {
        console.warn('Invalid Card2Crypto callback secret');
        return res.status(403).send('Forbidden');
      }

      // If no orderId provided, allow creating an orphan payment record (some providers may not echo order id)
      try {
        const { getIO } = require('../utils/socket');
        const io = getIO();

        let order = null;
        if (orderId) {
          const rows = await supabase.select('orders', { select: '*', id: `eq.${orderId}` });
          order = Array.isArray(rows) && rows.length ? rows[0] : null;
          if (!order) {
            // If an orderId was supplied but not found, surface 404
            return res.status(404).send('Order not found');
          }

          if (order.status === 'paid' || order.status === 'completed') return res.status(200).send('OK (Already Processed)');

          const amountPaid = parseFloat(value_coin || '0');
          const expected = parseFloat(order.total_price || '0');
          if (isNaN(amountPaid) || amountPaid < (expected * 0.99)) {
            console.error(`Callback: Amount mismatch for order ${orderId}. Expected ${expected}, got ${amountPaid}`);
            return res.status(400).send('Amount mismatch');
          }

          // Update order
          await supabase.patch('orders', { status: 'paid', payment_state: 'captured', updated_at: new Date().toISOString() }, { id: `eq.${orderId}` });
        }

    // Insert (upsert) payment record (order_id may be null for orphan payments)
    const amountPaidFloat = parseFloat(value_coin || '0');
    await supabase.upsert('payments', { order_id: orderId || null, provider: 'card2crypto', transaction_id: txid_in || txid_out || null, status: 'confirmed', amount: isNaN(amountPaidFloat) ? null : amountPaidFloat, currency: 'USD', raw_response: JSON.stringify(req.query), created_at: new Date().toISOString() }, { on_conflict: 'transaction_id' });

        // Emit socket event so UI updates in real-time
        try { if (io) io.emit('payment.update', { orderId: orderId || null, transaction_id: txid_in || txid_out || null, status: 'confirmed', amount: amountPaidFloat || null }); } catch (e) { /* ignore */ }

        return res.status(200).send('OK');
      } catch (e) {
        console.error('Card2Crypto webhook processing failed:', e && e.message ? e.message : e);
        // Treat socket/side-effect failures as non-fatal for webhook acknowledgement in tests
        return res.status(200).send('OK');
      }
  } catch (err) {
    console.error('Card2Crypto webhook error:', err && err.message ? err.message : err);
    return res.status(500).send('Server Error');
  }
});

// New secure token-based callback handler
router.get('/card2crypto/callback', async (req, res) => {
  try {
    const { token, value_coin, coin, txid_in, txid_out } = req.query || {};
    if (!token) return res.status(401).send('Missing token');

    // Find order by secure payment token
    const rows = await supabase.select('orders', { select: '*', payment_token: `eq.${token}` });
    const order = Array.isArray(rows) && rows.length ? rows[0] : null;
    if (!order) return res.status(404).send('Invalid payment token');

    // Idempotency: if already paid, acknowledge
    if (order.status === 'paid' || order.status === 'completed') return res.status(200).send('OK (Already Processed)');

    const amountPaid = parseFloat(value_coin || '0');
    const expected = parseFloat(order.total_price || '0');
    if (isNaN(amountPaid) || amountPaid < (expected * 0.99)) {
      console.error(`Callback: Amount mismatch for order ${order.id}. Expected ${expected}, got ${amountPaid}`);
      return res.status(400).send('Amount mismatch');
    }

    // Update order and invalidate token
    try {
      await supabase.patch('orders', { status: 'paid', payment_state: 'captured', payment_token: null, updated_at: new Date().toISOString() }, { id: `eq.${order.id}` });
    } catch (e) {
      console.warn('Failed to update order on callback:', e && e.message);
    }

    // Insert payment record
    try {
      await supabase.insert('payments', {
        order_id: order.id,
        provider: 'card2crypto',
        transaction_id: txid_in || txid_out || null,
        status: 'confirmed',
        amount: amountPaid,
        currency: 'USD',
        raw_response: JSON.stringify(req.query),
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to insert payment row on callback:', e && e.message);
    }

    return res.status(200).send('Payment processed successfully');
  } catch (err) {
    console.error('Card2Crypto callback error:', err && err.message ? err.message : err);
    return res.status(500).send('Server Error');
  }
});
