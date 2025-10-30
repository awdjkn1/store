const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const supabase = require('../utils/supabaseRest');
const invoiceService = require('../services/invoiceService');

async function run() {
  try {
    // find latest fake payment file
    const outDir = path.join(__dirname, '..', '..', 'outputs');
    const files = fs.readdirSync(outDir).filter(f => f.startsWith('fake_payment_flow_') && f.endsWith('.json'));
    if (!files.length) throw new Error('No fake payment flow files found in outputs/');
    files.sort();
    const latest = files[files.length - 1];
    const data = JSON.parse(fs.readFileSync(path.join(outDir, latest), 'utf8'));
    const flow = data.flows && data.flows[0];
    if (!flow) throw new Error('No flows in file');

    console.log('Using fake flow:', flow.transaction_id, flow.method, flow.amount);

    // find a user by email from flow steps, else pick any user, else create one
    const contactStep = (flow.steps || []).find(s => s.contact);
    const email = contactStep ? contactStep.contact : null;
    let user = null;
    if (email) {
      try {
        const rows = await supabase.select('users', { select: 'id,email,username', email: `eq.${email}` });
        if (rows && rows[0]) user = rows[0];
      } catch (e) {
        console.warn('User lookup by email failed', e && e.message);
      }
    }

    if (!user) {
      // try find any user
      const any = await supabase.select('users', { select: 'id,email,username', limit: 1 });
      if (any && any[0]) user = any[0];
    }

    if (!user) {
      // create a basic user
      const id = require('crypto').randomUUID();
      const username = `fake_user_${Date.now()}`;
      const userEmail = email || `fake_${Date.now()}@example.com`;
  await supabase.insert('users', { id, username, email: userEmail, created_at: new Date().toISOString() });
  // fetch created user
  const fetch = await supabase.select('users', { select: 'id,email,username', id: `eq.${id}` });
  user = fetch && fetch[0] ? fetch[0] : { id, username, email: userEmail };
      console.log('Created user', user.id);
    } else {
      console.log('Found user', user.id, user.email || user.username);
    }

    // insert order
    const now = new Date().toISOString();
    const order = {
      user_id: user.id,
      product_id: null,
      quantity: 1,
      status: flow.status || 'paid',
      total_price: String(flow.amount || 0),
      shipping_address: 'Simulated address',
      created_at: now,
      updated_at: now
    };
    let inserted;
    try {
  await supabase.insert('orders', order);
  // try to fetch the inserted order (closest match by user_id, created_at desc)
  const orders = await supabase.select('orders', { select: 'id,user_id,total_price,created_at', user_id: `eq.${user.id}`, order: 'created_at.desc', limit: 1 });
  inserted = orders;
    } catch (err) {
      console.error('Order insert error:', err && err.message, err && err.response && err.response.data);
      throw err;
    }
    const orderRow = inserted && inserted[0] ? inserted[0] : null;
    if (!orderRow) {
      console.error('Order insert returned unexpected result:', inserted);
      throw new Error('Order insert failed');
    }
    console.log('Inserted order', orderRow.id);

    // create invoice using invoiceService
    const paymentRecord = { provider: flow.provider || 'fakepay', transaction_id: flow.transaction_id, status: flow.status || 'paid', amount: flow.amount };
    const inv = await invoiceService.createInvoiceForOrder(orderRow, paymentRecord);
    console.log('Invoice created, pdf:', inv.pdfPath);

    // mark invoice paid / reconciliation
    const mark = await invoiceService.markInvoicePaid(inv.payload.invoice_number, paymentRecord);
    console.log('Invoice marked paid:', mark);

  } catch (e) {
    console.error('apply_fake_flow failed:', e && e.message, e && e.response && e.response.data);
    process.exitCode = 1;
  }
}

run();
