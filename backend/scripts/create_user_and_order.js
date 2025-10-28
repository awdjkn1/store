const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const supabase = require('../utils/supabaseRest');
const { v4: uuidv4 } = require('uuid');

async function run() {
  try {
    const userId = process.env.TEST_USER_ID || uuidv4();
    const username = process.env.TEST_USERNAME || 'seed_user';
    const email = process.env.TEST_EMAIL || `seed_${Date.now()}@example.com`;

    // Insert user if not exists
    try {
      const existing = await supabase.select('users', { id: `eq.${userId}` });
      if (!existing || existing.length === 0) {
        const ins = await supabase.insert('users', { id: userId, username, email, created_at: new Date().toISOString() });
        console.log('Inserted user:', ins);
      } else {
        console.log('User exists, skipping insert');
      }
    } catch (e) {
      console.warn('Users insert/select may have failed:', e && e.message);
    }

    // Now insert order
    const now = new Date().toISOString();
    const order = {
      user_id: userId,
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
