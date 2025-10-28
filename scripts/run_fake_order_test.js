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
    const regResp = await axios.post(`${SERVER}/api/auth/register`, { username, email, password }, { maxRedirects: 0, validateStatus: s => s < 500 });
    report.push(`register status: ${regResp.status}`);
    report.push(`register body: ${JSON.stringify(regResp.data)}`);
    const setCookie = regResp.headers && regResp.headers['set-cookie'] ? regResp.headers['set-cookie'].join('; ') : null;
    report.push(`set-cookie: ${setCookie}`);

    // 2) Use cookie (or generate token) to call POST /api/orders
    report.push('\n--- Creating order via POST /api/orders ---');
    const shippingAddress = '100 Test Lane, Testville, TX';
    const payment = { provider: 'fakepay', transactionId: `txn-${Date.now()}`, status: 'paid', amount: 39.99 };
    const items = [{ product_id: null, quantity: 1, price_shipping_included: 39.99 }];

    const headers = {};
    if (setCookie) headers['Cookie'] = setCookie;

    const orderResp = await axios.post(`${SERVER}/api/orders`, { shippingAddress, payment, items }, { headers, validateStatus: s => s < 500, timeout: 60000 });
    report.push(`orders endpoint status: ${orderResp.status}`);
    report.push(`orders response: ${JSON.stringify(orderResp.data)}`);

    // Resolve order id from response
    let orderId = null;
    if (orderResp.data && orderResp.data.orders && orderResp.data.orders[0] && orderResp.data.orders[0].id) {
      orderId = orderResp.data.orders[0].id;
    } else if (orderResp.data && orderResp.data.order && orderResp.data.order.id) {
      orderId = orderResp.data.order.id;
    }
    report.push(`resolved order id: ${orderId}`);

    // 3) Fetch /api/orders/mine to see attached invoice
    report.push('\n--- Fetching /api/orders/mine ---');
    const mineResp = await axios.get(`${SERVER}/api/orders/mine`, { headers, validateStatus: s => s < 500 });
    report.push(`mine status: ${mineResp.status}`);
    report.push(`mine body: ${JSON.stringify(mineResp.data)}`);

    // 4) Fetch invoice JSON via API
    report.push('\n--- Fetching /api/orders/:id/invoice ---');
    if (orderId) {
      const invResp = await axios.get(`${SERVER}/api/orders/${orderId}/invoice`, { headers, validateStatus: s => s < 500 });
      report.push(`invoice status: ${invResp.status}`);
      report.push(`invoice body: ${JSON.stringify(invResp.data)}`);
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
