const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const hoodpay = require('../utils/hoodpay');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');

// Accept raw body for signature verification
router.post('/hoodpay', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.HOODPAY_WEBHOOK_SECRET;

    // Svix headers
    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    if (!secret || !svix_id || !svix_timestamp || !svix_signature) {
      // Minimal diagnostics without leaking secrets
      try {
        console.error('Webhook Error: Missing required Svix headers or secret.');
        console.error('Diagnostic: HOODPAY_WEBHOOK_SECRET present?', !!secret);
        console.error('Diagnostic: incoming header keys:', Object.keys(req.headers || {}).join(', '));
      } catch (e) {}
      return res.status(400).send('Error: Missing required Svix headers or secret.');
    }

    // Get raw body string
    const rawBody = req.body.toString();

    // Create string to sign
    const signedContent = `${svix_id}.${svix_timestamp}.${rawBody}`;

    // Calculate HMAC-SHA256 and base64 encode
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(signedContent).digest('base64');

    // Signature header format: 'v1,<signature>' — take the part after the comma
    const signatureFromHeader = (String(svix_signature).split(',')[1] || '').trim();

    // Log comparison for diagnostics (safe: no secret printed)
    console.log(`Received Svix signature: ${svix_signature}`);
    console.log(`Calculated Svix signature (base64): ${calculatedSignature}`);

    if (calculatedSignature !== signatureFromHeader) {
      console.error('HoodPay webhook signature verification failed! Signature did not match.');
      return res.status(400).send('Invalid signature');
    }

    // Signature valid — parse event
    let event = null;
    try { event = JSON.parse(rawBody); } catch (e) { console.error('Webhook JSON parse failed', e && e.message); }

    if (event) {
      console.log(`Webhook received and verified: ${event.type}`);
      if (event.type === 'payment:completed') {
        console.log(`Payment Succeeded: ${event.data && (event.data.id || event.data.payment_id)}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook route error', err && err.message ? err.message : err);
    return res.status(500).send('server error');
  }
});

module.exports = router;
