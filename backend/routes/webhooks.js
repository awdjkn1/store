const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const hoodpay = require('../utils/hoodpay');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');

// Accept raw body for signature verification
router.post(
  '/hoodpay',
  express.raw({ type: 'application/json' }), // 1. Use the raw body parser
  (req, res) => {
    try {
      const secretString = process.env.HOODPAY_WEBHOOK_SECRET;

      // 2. Get all 3 required Svix headers
      const svix_id = req.headers['svix-id'];
      const svix_timestamp = req.headers['svix-timestamp'];
      const svix_signature = req.headers['svix-signature'];

      if (!secretString || !svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).send('Error: Missing required Svix headers or secret.');
      }

      // 3. --- THIS IS THE FIX ---
      // The secret (e.g., "whsec_...") must be
      // stripped of its prefix and Base64-decoded.
      
      const key = secretString.split('_')[1];
      if (!key) {
        throw new Error("Invalid secret format. Expected 'whsec_...'");
      }
      
      // Decode the key from Base64 into a raw Buffer
      const secretKeyBuffer = Buffer.from(key, 'base64');
      // --- END FIX ---

      // 4. Create the string to be signed
      const rawBody = req.body.toString();
      const signedContent = `${svix_id}.${svix_timestamp}.${rawBody}`;

      // 5. Calculate the signature *using the decoded key buffer*
      const hmac = crypto.createHmac('sha256', secretKeyBuffer);
      const calculatedSignature = hmac.update(signedContent).digest('base64');

      // 6. Get the signature from the header
      const signatureFromHeader = svix_signature.split(',')[1];

      // 7. Compare
      if (calculatedSignature !== signatureFromHeader) {
        console.error('HoodPay webhook signature verification failed! Signature did not match.');
        console.log(`Received: ${signatureFromHeader}`);
        console.log(`Calculated: ${calculatedSignature}`);
        return res.status(400).send('Invalid signature');
      }

      // --- SIGNATURE IS VALID! ---
      const event = JSON.parse(rawBody.toString()); 
      console.log(`Webhook received and verified: ${event.type}`);

      if (event.type === 'payment:completed') {
        console.log(`Payment Succeeded: ${event.data.id}`);
        // TODO: Mark order as "PAID" in your database
      }
      
      res.status(200).send({ received: true });

    } catch (err) {
      console.error("Webhook processing error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
