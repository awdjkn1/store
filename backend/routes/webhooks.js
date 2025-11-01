const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const hoodpay = require('../utils/hoodpay');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');

// Accept raw body for signature verification
router.post('/hoodpay', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const secret = process.env.HOODPAY_WEBHOOK_SECRET;
    const signature = req.headers['hoodpay-signature'] || req.headers['x-hoodpay-signature'] || req.headers['signature'];

    if (!secret || !signature) {
      // Log helpful diagnostics for Render: show which headers arrived and whether the secret env var is present
      try {
        console.error('Webhook Error: Missing secret or signature.');
        console.error('Diagnostic: HOODPAY_WEBHOOK_SECRET present?', !!secret);
        console.error('Diagnostic: incoming header keys:', Object.keys(req.headers || {}).join(', '));
      } catch (e) { /* ignore logging errors */ }
      return res.status(400).send('Missing secret or signature');
    }

    // --- START DEBUG LOGGING ---
    // Log secret length and tail (for safety log only last 6 chars)
    try { console.log(`Verifying with secret (length ${secret.length}): "...${String(secret).slice(-6)}"`); } catch (e) {}

    // Extra diagnostics to help Render logs: content-type, raw length, and a short hex tail
    try {
      const ct = req.headers['content-type'] || req.headers['Content-Type'] || ''; 
      const rawLen = Buffer.isBuffer(req.body) ? req.body.length : (req.body ? String(req.body).length : 0);
      let hexTail = '';
      try {
        if (Buffer.isBuffer(req.body)) {
          const tail = req.body.slice(Math.max(0, rawLen - 32), rawLen);
          hexTail = tail.toString('hex');
        } else if (typeof req.body === 'string') {
          const s = req.body;
          hexTail = Buffer.from(s.substr(Math.max(0, s.length - 32))).toString('hex');
        }
      } catch (e) { hexTail = '' }
      console.log(`Webhook debug: content-type="${ct}", rawBodyLength=${rawLen}, rawBodyHexTail="${hexTail}"`);
    } catch (e) { /* ignore */ }

    // Calculate digest using raw body buffer
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(req.body).digest('hex');

    // Log received vs calculated signatures
    console.log(`Received Signature: ${signature}`);
    console.log(`Calculated Digest:  ${digest}`);
    // --- END DEBUG LOGGING ---

    if (digest !== signature) {
      console.error('HoodPay webhook signature verification failed! Signature did not match.');
      return res.status(400).send('Invalid signature');
    }

    // Signature verified — parse and handle event minimally for debug
    let event = null;
    try { event = JSON.parse(req.body.toString('utf8')); } catch (e) { console.error('Webhook JSON parse failed', e && e.message); }

    if (event) {
      console.log(`Webhook received and verified: ${event.type}`);
      if (event.type === 'payment:completed') {
        console.log(`Payment Succeeded: ${event.data && (event.data.id || event.data.payment_id)}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook debug route error', err && err.message ? err.message : err);
    return res.status(500).send('server error');
  }
});

module.exports = router;
