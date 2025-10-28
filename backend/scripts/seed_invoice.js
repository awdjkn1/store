const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const supabase = require('../utils/supabaseRest');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    const orders = await supabase.select('orders', { select: 'id,product_id,quantity,total_price,user_id,created_at', order: 'created_at.desc', limit: 1 });
    const order = (orders && orders[0]) || null;
    if (!order) {
      console.log('No orders found in DB to attach invoice to. Create an order first or modify this script.');
      return;
    }
    const invoicePayload = {
      order_id: order.id,
      user_id: order.user_id || null,
      amount: order.total_price || null,
      currency: 'USD',
      payment: { provider: 'fakepay', transaction_id: `txn-${Date.now()}`, status: 'paid', amount: order.total_price },
      shipping: { address: '221B Baker Street, London, UK' },
      confirmation: { order_id: order.id, status: 'paid', placed_at: order.created_at || new Date().toISOString() },
      products: [{ product_id: order.product_id || null, name: 'Seeded product', quantity: order.quantity || 1, total_price: order.total_price }]
    };

    const invoiceNumber = `inv-${order.id}`;
    const insert = await supabase.insert('invoices', {
      invoice_number: invoiceNumber,
      order_id: order.id,
      user_id: order.user_id || null,
      filename: '',
      path: '',
      mime_type: null,
      size_bytes: null,
      amount: invoicePayload.amount,
      currency: invoicePayload.currency,
      payment_provider: invoicePayload.payment.provider,
      payment_transaction_id: invoicePayload.payment.transaction_id,
      status: 'created',
      content: JSON.stringify(invoicePayload),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    console.log('Inserted invoice for order', order.id, insert);
  } catch (e) {
    console.error('Failed to seed invoice:', e && e.message, e && e.response && e.response.data);
  }
}

run();
