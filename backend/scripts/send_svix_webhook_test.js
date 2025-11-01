// send_svix_webhook_test.js
// Simple script to send a Svix-formatted webhook to your server for testing.
// Usage (PowerShell):
// $env:HOODPAY_WEBHOOK_SECRET='your_secret_here'
// node backend/scripts/send_svix_webhook_test.js https://your-render-url.com/api/webhooks/hoodpay

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const url = require('url');

const target = process.argv[2] || process.env.HOODPAY_WEBHOOK_URL || 'http://localhost:5000/api/webhooks/hoodpay';
const secret = process.env.HOODPAY_WEBHOOK_SECRET || 'test_secret';

const parsed = url.parse(target);
const client = parsed.protocol === 'https:' ? https : http;

const svix_id = crypto.randomBytes(8).toString('hex');
const svix_timestamp = Math.floor(Date.now() / 1000).toString();
const payload = JSON.stringify({ type: 'payment:completed', data: { id: 'tx_test_123', status: 'succeeded', amount: 12.34 } });
const signedContent = `${svix_id}.${svix_timestamp}.${payload}`;

// Default: treat secret as literal string
let signature = crypto.createHmac('sha256', secret).update(signedContent).digest('base64');
const header = `v1,${signature}`;

const options = {
  hostname: parsed.hostname,
  port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
  path: parsed.path,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': header
  }
};

const req = client.request(options, (res) => {
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
