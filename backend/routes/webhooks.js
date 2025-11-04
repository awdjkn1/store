const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const hoodpay = require('../utils/hoodpay');
const supabase = require('../utils/supabaseRest');
const webhookCache = require('../utils/webhookCache');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');

// Accept raw body for signature verification
router.post(
  '/hoodpay',
  express.raw({ type: 'application/json' }), // 1. Use the raw body parser
  async (req, res) => { // make handler async so we can await DB calls
    try {
      const secretString = process.env.HOODPAY_WEBHOOK_SECRET;

      // 2. Get all 3 required Svix headers
      const svix_id = req.headers['svix-id'];
      const svix_timestamp = req.headers['svix-timestamp'];
      const svix_signature = req.headers['svix-signature'];

      if (!secretString || !svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).send('Error: Missing required Svix headers or secret.');
      }

      // 3. --- Robust Svix-style signature verification ---
      // Expect HOODPAY_WEBHOOK_SECRET like: 'whsec_<BASE64>'
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

        // Attempt to update the corresponding order in our DB. HoodPay should
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
