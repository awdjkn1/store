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

    // Calculate HMAC-SHA256 and base64 encode (using secret as provided)
    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(signedContent).digest('base64');

    // Also try trimming the secret (some env systems add newlines)
    const secretTrim = String(secret).trim();
    let calculatedSignatureTrimmed = null;
    try {
      if (secretTrim !== secret) {
        const hmacTrim = crypto.createHmac('sha256', secretTrim);
        calculatedSignatureTrimmed = hmacTrim.update(signedContent).digest('base64');
      }
    } catch (e) { calculatedSignatureTrimmed = null; }

    // Some providers supply the secret as base64; try decoding it as a fallback
    let calculatedSignatureUsingBase64Key = null;
    try {
      const keyBuf = Buffer.from(String(secretTrim), 'base64');
      if (keyBuf && keyBuf.length > 0) {
        try {
          const hmac2 = crypto.createHmac('sha256', keyBuf);
          calculatedSignatureUsingBase64Key = hmac2.update(signedContent).digest('base64');
        } catch (e) { calculatedSignatureUsingBase64Key = null; }
      }
    } catch (e) { /* ignore decode errors */ }

    // Also try hex-decoding the secret (some systems export keys as hex)
    let calculatedSignatureUsingHexKey = null;
    try {
      const keyHexBuf = Buffer.from(String(secretTrim), 'hex');
      if (keyHexBuf && keyHexBuf.length > 0) {
        try {
          const hmac3 = crypto.createHmac('sha256', keyHexBuf);
          calculatedSignatureUsingHexKey = hmac3.update(signedContent).digest('base64');
        } catch (e) { calculatedSignatureUsingHexKey = null; }
      }
    } catch (e) { /* ignore */ }

    // Signature header format: 'v1,<signature>' — take the part after the comma
    const signatureFromHeader = (String(svix_signature).split(',')[1] || '').trim();

    // Additional diagnostics: raw body hex tail and content-type
    try {
      const rawLen = Buffer.isBuffer(req.body) ? req.body.length : Buffer.byteLength(String(req.body || ''), 'utf8');
      const tail = Buffer.isBuffer(req.body) ? req.body.slice(Math.max(0, rawLen - 64), rawLen) : Buffer.from(String(req.body || ''), 'utf8').slice(Math.max(0, rawLen - 64), rawLen);
      console.log(`Webhook debug: rawBodyLength=${rawLen}, rawBodyHexTail=${tail.toString('hex')}`);
    } catch (e) { /* ignore */ }

    // Log comparison for diagnostics (safe: no secret printed)
    console.log(`svix-id: ${svix_id}, svix-timestamp: ${svix_timestamp}`);
    console.log(`signatureFromHeader: ${signatureFromHeader}`);
    console.log(`Received Svix signature header: ${svix_signature}`);
    console.log(`Calculated Svix signature (base64 - literal secret): ${calculatedSignature}`);
    if (calculatedSignatureTrimmed) console.log(`Calculated Svix signature (base64 - trimmed secret): ${calculatedSignatureTrimmed}`);
    if (calculatedSignatureUsingBase64Key) console.log(`Calculated Svix signature (base64 - base64-decoded key): ${calculatedSignatureUsingBase64Key}`);
    if (calculatedSignatureUsingHexKey) console.log(`Calculated Svix signature (base64 - hex-decoded key): ${calculatedSignatureUsingHexKey}`);

  // Compare: accept any matching result from tried key variants
  const match = [calculatedSignature, calculatedSignatureTrimmed, calculatedSignatureUsingBase64Key, calculatedSignatureUsingHexKey].some(s => s && s === signatureFromHeader);
    if (!match) {
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
