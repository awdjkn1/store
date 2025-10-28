const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const supabase = require('../utils/supabaseRest');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    const now = new Date().toISOString();
    const order = {
      user_id: process.env.TEST_USER_ID || uuidv4(),
      product_id: process.env.TEST_PRODUCT_ID || null,
      quantity: 1,
      status: 'paid',
      total_price: '29.99',
      shipping_address: '221B Baker Street, London, UK',
      created_at: now,
      updated_at: now
    };
    const inserted = await supabase.insert('orders', order);
    console.log('Inserted order result:', inserted);
  } catch (e) {
    console.error('Order insert failed:', e && e.message, e && e.response && e.response.data);
  }
}

run();
