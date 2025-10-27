const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyJWT } = require('../middlewares/auth');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD ? String(process.env.PG_PASSWORD) : undefined,
});

// Create orders from cart (or provided items). Requires authentication.
// Body: { shippingAddress: string, payment: { provider, transactionId, status }, items?: [{ product_id, quantity }] }
router.post('/orders', verifyJWT, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { shippingAddress, payment, items } = req.body;

  try {
    // If items not provided, read from cart_items for this user
    let cartItems = items;
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      const cartRes = await pool.query(
        `SELECT ci.id as cart_item_id, ci.product_id, ci.quantity, p.price_shipping_included
         FROM cart_items ci
         LEFT JOIN lego_products p ON p.id = ci.product_id
         WHERE ci.user_id = $1`,
        [userId]
      );
      cartItems = cartRes.rows.map(r => ({ product_id: r.product_id, quantity: r.quantity, price: r.price_shipping_included }));
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'No items to create order for' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const createdOrders = [];

      for (const it of cartItems) {
        const quantity = Number(it.quantity) || 1;
        // Fetch latest price for product
        const prodRes = await client.query('SELECT price_shipping_included FROM lego_products WHERE id = $1', [it.product_id]);
        const price = prodRes.rows[0] ? Number(prodRes.rows[0].price_shipping_included || 0) : (Number(it.price) || Number(it.price_shipping_included) || 0);
        const total_price = (price * quantity).toFixed(2);

        const insertRes = await client.query(
          `INSERT INTO orders (user_id, product_id, quantity, status, total_price, shipping_address, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
          [userId, it.product_id, quantity, 'pending', total_price, shippingAddress || null]
        );

        createdOrders.push(insertRes.rows[0]);
      }

      // Clear user's cart_items
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      await client.query('COMMIT');

      // Optionally record a payment record if provided and payments table exists
      if (payment && payment.transactionId) {
        try {
          await pool.query(
            `INSERT INTO payments (order_id, provider, transaction_id, status, amount, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [createdOrders[0].id || null, payment.provider || 'unknown', payment.transactionId, payment.status || 'pending', payment.amount || null]
          );
        } catch (e) {
          // non-fatal if payments table missing
          console.warn('payments insert failed (optional):', e.message || e);
        }
      }

      res.json({ success: true, orders: createdOrders });
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('Order creation transaction failed:', txErr);
      res.status(500).json({ error: 'Failed to create orders' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

module.exports = router;
