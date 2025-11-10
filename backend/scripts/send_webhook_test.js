// Simple script to send a test webhook to the local backend with a valid HMAC-SHA256 signature.
// Usage: set CARD2CRYPTO_WEBHOOK_SECRET=yoursecret (on Windows PowerShell: $env:CARD2CRYPTO_WEBHOOK_SECRET='yoursecret')
// Then run: node backend/scripts/send_webhook_test.js

const http = require('http');
const crypto = require('crypto');

const secret = process.env.CARD2CRYPTO_WEBHOOK_SECRET || 'test_secret';
const payload = JSON.stringify({ type: 'payment:completed', data: { id: 'tx_test_123', status: 'succeeded', amount: 12.34 } });
const sig = crypto.createHmac('sha256', secret).update(Buffer.from(payload, 'utf8')).digest('hex');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/webhooks/card2crypto',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'card2crypto-signature': sig
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(payload);
req.end();
