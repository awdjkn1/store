const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function run() {
  const report = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, '..', 'outputs');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
  const outFile = path.join(outDir, `fake_order_full_run_${ts}.txt`);

  const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
  const WEBHOOK_SECRET = process.env.CARD2CRYPTO_WEBHOOK_SECRET || '';

  report.push(`Fake order+payment run - ${new Date().toISOString()}`);
  report.push(`Server: ${SERVER}`);
  report.push(`Webhook secret present: ${!!WEBHOOK_SECRET}`);

  try {
    // Register
    const username = `full_flow_${ts.slice(-6)}`;
    const email = `${username}@example.com`;
    const password = 'TestPass!234';
    report.push('\n-- Registering user --');
    const reg = await axios.post(`${SERVER}/api/auth/register`, { username, email, password }, { validateStatus: s => s < 500 });
    report.push(`register status: ${reg.status}`);
    report.push(`register body: ${JSON.stringify(reg.data)}`);
    const cookie = reg.headers && reg.headers['set-cookie'] ? reg.headers['set-cookie'].join('; ') : null;
    report.push(`cookie: ${cookie}`);

    // Create order
    report.push('\n-- Creating order --');
    const items = [ { product_id: null, name: 'Mock Speedster Brick Set', quantity: 1, price_shipping_included: 29.99 }, { product_id: null, name: 'Mock Mini Figure Pack', quantity: 1, price_shipping_included: 10.00 } ];
    const total = items.reduce((s,i)=>s + (Number(i.price_shipping_included)||0)*Number(i.quantity||1), 0);
    const payment = { provider: 'FakePay', transactionId: `txn-${Date.now()}`, status: 'pending', amount: total };
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    const orderResp = await axios.post(`${SERVER}/api/orders`, { shippingAddress: '100 Test Lane, Testville, TX', payment, items }, { headers, validateStatus: s => s < 500, timeout: 60000 });
    report.push(`orders POST status: ${orderResp.status}`);
    report.push(`orders POST body: ${JSON.stringify(orderResp.data)}`);

    // Resolve order id (fallback to /api/orders/mine)
    let orderId = null;
    if (orderResp.data && orderResp.data.orders && orderResp.data.orders[0] && orderResp.data.orders[0].id) orderId = orderResp.data.orders[0].id;
    if (!orderId) {
      const mine = await axios.get(`${SERVER}/api/orders/mine`, { headers, validateStatus: s => s < 500 });
      report.push(`orders/mine status: ${mine.status}`);
      report.push(`orders/mine body: ${JSON.stringify(mine.data)}`);
      if (mine.data && Array.isArray(mine.data.orders) && mine.data.orders.length > 0) {
        orderId = mine.data.orders[0].id;
      }
    }
    report.push(`resolved order id: ${orderId}`);

    // Simulate payment webhook (mark as paid)
    report.push('\n-- Simulating payment webhook --');
    const providerId = `simtxn-${Date.now()}`;
    const event = { type: 'payment.succeeded', data: { id: providerId, status: 'succeeded', amount: total, order_id: orderId } };
    const raw = JSON.stringify(event);
    const sig = WEBHOOK_SECRET ? crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex') : '';
    const sigHeader = sig ? `v1=${sig}` : '';
  try {
  const whResp = await axios.post(`${SERVER}/api/payments/webhook`, raw, { headers: { 'Content-Type': 'application/json', 'card2crypto-signature': sigHeader }, validateStatus: s => s < 500 });
      report.push(`webhook status: ${whResp.status}`);
      report.push(`webhook body: ${JSON.stringify(whResp.data)}`);
    } catch (e) {
      report.push('webhook POST failed: ' + (e && e.message));
      if (e && e.response) report.push('webhook response: ' + JSON.stringify(e.response.data));
    }

    // Fetch invoice after webhook
    report.push('\n-- Fetching invoice --');
    if (orderId) {
      try {
        const invResp = await axios.get(`${SERVER}/api/orders/${orderId}/invoice`, { headers, validateStatus: s => s < 500 });
        report.push(`invoice status: ${invResp.status}`);
        report.push(`invoice body: ${JSON.stringify(invResp.data)}`);
      } catch (e) {
        report.push('invoice GET failed: ' + (e && e.message));
        if (e && e.response) report.push('invoice response: ' + JSON.stringify(e.response.data));
      }
    }

    // Final orders/mine
    try {
      const final = await axios.get(`${SERVER}/api/orders/mine`, { headers, validateStatus: s => s < 500 });
      report.push('\n-- Final /api/orders/mine --');
      report.push(`status: ${final.status}`);
      report.push(`body: ${JSON.stringify(final.data)}`);
    } catch (e) {
      report.push('final orders/mine failed: ' + (e && e.message));
    }

    fs.writeFileSync(outFile, report.join('\n') + '\n', 'utf8');
    console.log('Report written to', outFile);
  } catch (err) {
    console.error('Run failed:', err && err.message);
    try { fs.writeFileSync(outFile, `Run failed: ${err && err.message}\n\n${err && err.stack || ''}`, 'utf8'); } catch (e) {}
  }
}

run();
