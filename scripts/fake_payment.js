const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Config
const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function run() {
  // Create a test user payload
  const user = {
    id: process.env.TEST_USER_ID || uuidv4(),
    username: process.env.TEST_USERNAME || 'testuser',
    email: process.env.TEST_EMAIL || 'testuser@example.com',
    role: process.env.TEST_USER_ROLE || 'user'
  };

  // Sign a token
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  // Prepare fake order payload
  const payload = {
    shippingAddress: '221B Baker Street, London, UK',
    payment: {
      provider: 'fakepay',
      transactionId: `txn-${Date.now()}`,
      status: 'paid',
      amount: 29.99
    },
    items: [
      // Use a likely-existing product id or a placeholder; adjust if necessary
      { product_id: process.env.TEST_PRODUCT_ID || null, quantity: 1, price_shipping_included: Number(process.env.TEST_PRODUCT_PRICE || 29.99) }
    ]
  };

  try {
    const res = await axios.post(`${SERVER}/api/orders`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 60_000
    });
    console.log('Order API response status:', res.status);
    console.log('Body:', JSON.stringify(res.data, null, 2));
    console.log('\nIf the backend generated an invoice, check: backend/public/uploads/invoices/');
  } catch (err) {
    if (err.response) {
      console.error('Error response:', err.response.status, err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(1);
  }
}

run();
