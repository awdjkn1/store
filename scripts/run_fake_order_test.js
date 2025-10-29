const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function run() {
  const report = [];
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(__dirname, '..', 'outputs');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
  const outFile = path.join(outDir, `fake_order_report_${ts}.txt`);

  const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
  report.push(`Fake order test run (API) - ${new Date().toISOString()}`);
  report.push('--- Environment ---');
  report.push(`Server: ${SERVER}`);
  report.push(`JWT_SECRET present: ${!!process.env.JWT_SECRET}`);

  try {
    // 1) Register a new user via API
    const username = `api_test_${ts.slice(-6)}`;
    const email = `api_test_${ts.slice(-6)}@example.com`;
    const password = 'TestPass!234';
    report.push('\n--- Registering user via /api/auth/register ---');
    report.push(`username: ${username}`);
    report.push(`email: ${email}`);
    let regResp;
    let setCookie = null;
    try {
      regResp = await axios.post(`${SERVER}/api/auth/register`, { username, email, password }, { maxRedirects: 0, validateStatus: s => s < 500 });
      report.push(`register status: ${regResp.status}`);
      report.push(`register body: ${JSON.stringify(regResp.data)}`);
      setCookie = regResp.headers && regResp.headers['set-cookie'] ? regResp.headers['set-cookie'].join('; ') : null;
      report.push(`set-cookie: ${setCookie}`);
    } catch (err) {
      report.push('register request failed: ' + (err && err.message));
      if (err && err.response) {
        report.push('register response status: ' + err.response.status);
        report.push('register response body: ' + JSON.stringify(err.response.data));
      }
      throw err;
    }

    // 2) Use cookie (or generate token) to call POST /api/orders
    report.push('\n--- Creating order via POST /api/orders ---');
    const shippingAddress = '100 Test Lane, Testville, TX';
    const payment = { provider: 'FakePay', transactionId: `txn-${Date.now()}`, status: 'paid', amount: 39.99, card_last4: '4242' };
    const items = [
      { product_id: null, name: 'Mock Speedster Brick Set', quantity: 1, price_shipping_included: 29.99 },
      { product_id: null, name: 'Mock Mini Figure Pack', quantity: 1, price_shipping_included: 10.00 }
    ];

    const headers = {};
    if (setCookie) headers['Cookie'] = setCookie;

    let orderResp;
    try {
      orderResp = await axios.post(`${SERVER}/api/orders`, { shippingAddress, payment, items }, { headers, validateStatus: s => s < 500, timeout: 60000 });
      report.push(`orders endpoint status: ${orderResp.status}`);
      report.push(`orders response: ${JSON.stringify(orderResp.data)}`);
    } catch (err) {
      report.push('orders POST failed: ' + (err && err.message));
      if (err && err.response) {
        report.push('orders response status: ' + err.response.status);
        report.push('orders response body: ' + JSON.stringify(err.response.data));
      }
      throw err;
    }

    // Resolve order id from response; if missing, fetch /api/orders/mine and use the latest order id
    let orderId = null;
    if (orderResp.data && orderResp.data.orders && orderResp.data.orders[0] && orderResp.data.orders[0].id) {
      orderId = orderResp.data.orders[0].id;
    } else if (orderResp.data && orderResp.data.order && orderResp.data.order.id) {
      orderId = orderResp.data.order.id;
    }
    if (!orderId) {
      // fallback: query /api/orders/mine and take the most recent order
      try {
        const mineAfter = await axios.get(`${SERVER}/api/orders/mine`, { headers, validateStatus: s => s < 500 });
        report.push(`fallback /api/orders/mine status: ${mineAfter.status}`);
        if (mineAfter.data && Array.isArray(mineAfter.data.orders) && mineAfter.data.orders.length > 0) {
          // assume first is newest (server returns created_at.desc)
          orderId = mineAfter.data.orders[0].id || null;
          report.push('resolved order id from /api/orders/mine: ' + orderId);
        } else {
          report.push('fallback /api/orders/mine returned no orders');
        }
      } catch (e) {
        report.push('fallback /api/orders/mine failed: ' + (e && e.message));
        if (e && e.response) {
          report.push('fallback response status: ' + e.response.status);
          report.push('fallback response body: ' + JSON.stringify(e.response.data));
        }
      }
    } else {
      report.push(`resolved order id: ${orderId}`);
    }

    // 3) Fetch /api/orders/mine to see attached invoice
    report.push('\n--- Fetching /api/orders/mine ---');
    let mineResp;
    try {
      mineResp = await axios.get(`${SERVER}/api/orders/mine`, { headers, validateStatus: s => s < 500 });
      report.push(`mine status: ${mineResp.status}`);
      report.push(`mine body: ${JSON.stringify(mineResp.data)}`);
    } catch (err) {
      report.push('GET /api/orders/mine failed: ' + (err && err.message));
      if (err && err.response) {
        report.push('mine response status: ' + err.response.status);
        report.push('mine response body: ' + JSON.stringify(err.response.data));
      }
      throw err;
    }

    // 4) Fetch invoice JSON via API
    report.push('\n--- Fetching /api/orders/:id/invoice ---');
    if (orderId) {
      try {
        const invResp = await axios.get(`${SERVER}/api/orders/${orderId}/invoice`, { headers, validateStatus: s => s < 500 });
        report.push(`invoice status: ${invResp.status}`);
        report.push(`invoice body: ${JSON.stringify(invResp.data)}`);
      } catch (err) {
        report.push('GET invoice failed: ' + (err && err.message));
        if (err && err.response) {
          report.push('invoice response status: ' + err.response.status);
          report.push('invoice response body: ' + JSON.stringify(err.response.data));
        }
      }
    } else {
      report.push('No order id resolved, skipping invoice fetch');
    }

    // Basic security checks
    report.push('\n--- Security checks ---');
    report.push(`Set-cookie returned: ${!!setCookie}`);
    report.push(`Service role key present: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

    fs.writeFileSync(outFile, report.join('\n') + '\n', 'utf8');
    console.log('Report written to', outFile);
    console.log('--- Report preview ---');
    console.log(report.join('\n'));
  } catch (e) {
    console.error('API test run failed:', e && e.message);
    fs.writeFileSync(outFile, `Test run failed: ${e && e.message}\n\n${e && e.stack || ''}`, 'utf8');
    console.log('Partial report written to', outFile);
  }
}

run();
