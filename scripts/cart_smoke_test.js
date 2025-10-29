const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function run() {
  const out = [];
  const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
  out.push(`Cart smoke test - ${new Date().toISOString()}`);
  out.push(`Server: ${SERVER}`);

  try {
    // Fetch products
    out.push('\n-- Fetching products --');
    const p = await axios.get(`${SERVER}/api/products`, { validateStatus: s => s < 500 });
    out.push(`products status: ${p.status}`);
    const products = (p.data && p.data.products) || p.data || [];
    // Log a small summary for the first 3 products to keep logs readable
    const summarize = p => ({ id: p.id, name: p.name, price_shipping_included: p.price_shipping_included });
    out.push(`first 3 products: ${JSON.stringify(products.slice(0,3).map(summarize))}`);
    const first = products && products[0] && products[0].id ? products[0] : null;

    // Register user
    out.push('\n-- Registering user --');
    const ts = new Date().toISOString().replace(/[:.]/g,'-').slice(-8);
    const username = `cart_smoke_${ts}`;
    const email = `${username}@example.com`;
    const password = 'TestPass!234';
    const reg = await axios.post(`${SERVER}/api/auth/register`, { username, email, password }, { validateStatus: s => s < 500 });
    out.push(`register status: ${reg.status}`);
    out.push(`register body: ${JSON.stringify(reg.data)}`);
    const cookie = reg.headers && reg.headers['set-cookie'] ? reg.headers['set-cookie'].join('; ') : null;

    if (!first) {
      out.push('No product found to test cart.');
      console.log(out.join('\n'));
      fs.writeFileSync('/tmp/cart_smoke.txt', out.join('\n'));
      return;
    }

    // Add to cart
    out.push('\n-- Adding product to cart --');
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    const add = await axios.post(`${SERVER}/api/cart`, { product_id: first.id, quantity: 1 }, { headers, validateStatus: s => s < 500 });
    out.push(`add status: ${add.status}`);
    out.push(`add body: ${JSON.stringify(add.data)}`);

    // Read cart
    out.push('\n-- Reading cart --');
    const cart = await axios.get(`${SERVER}/api/cart`, { headers, validateStatus: s => s < 500 });
    out.push(`cart status: ${cart.status}`);
    out.push(`cart body: ${JSON.stringify(cart.data)}`);

    // Clear cart
    out.push('\n-- Clearing cart --');
    const clear = await axios.delete(`${SERVER}/api/cart`, { headers, validateStatus: s => s < 500 });
    out.push(`clear status: ${clear.status}`);
    out.push(`clear body: ${JSON.stringify(clear.data)}`);

    // Verify cart is empty via GET /api/cart (assertion for smoke test)
    const after = await axios.get(`${SERVER}/api/cart`, { headers, validateStatus: s => s < 500 });
    out.push(`post-clear cart status: ${after.status}`);
    out.push(`post-clear cart body: ${JSON.stringify(after.data)}`);
    const cartArr = (after.data && after.data.cart) || [];
    if (!Array.isArray(cartArr) || cartArr.length !== 0) {
      out.push('ERROR: cart not empty after clear');
      fs.writeFileSync('/tmp/cart_smoke.txt', out.join('\n'));
      console.error('Cart smoke test failed: cart not empty after clear');
      process.exit(2);
    }

    fs.writeFileSync('/tmp/cart_smoke.txt', out.join('\n'));
    console.log('Wrote /tmp/cart_smoke.txt');
  } catch (e) {
    out.push('ERROR: ' + (e && e.message));
    if (e && e.response) out.push('response: ' + JSON.stringify(e.response.data));
    fs.writeFileSync('/tmp/cart_smoke.txt', out.join('\n'));
    console.error(e && e.message);
  }
}

run();
