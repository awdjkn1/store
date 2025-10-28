const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const supabase = require('../utils/supabaseRest');

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
      const cartRows = await supabase.select('cart_items', { select: 'product_id,quantity', user_id: `eq.${userId}` });
      // Fetch product prices for those product_ids
      const productIds = cartRows.map(r => r.product_id).filter(Boolean);
      let products = [];
      if (productIds.length > 0) {
        products = await supabase.select('lego_products', { select: 'id,price_shipping_included', id: `in.(${productIds.join(',')})` });
      }
      cartItems = cartRows.map(r => ({ product_id: r.product_id, quantity: r.quantity, price_shipping_included: (products.find(p => p.id === r.product_id) || {}).price_shipping_included }));
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'No items to create order for' });
    }

    // NOTE: The original code performed this in a DB transaction. PostgREST calls below are not atomic.
    // For proper atomic behavior create a DB-side RPC that encapsulates creating orders and clearing cart_items,
    // then call it via supabase.rpc('create_orders_from_cart', payload).
    const createdOrders = [];
    for (const it of cartItems) {
      const quantity = Number(it.quantity) || 1;
      // Fetch latest price for product if not present
      let price = it.price_shipping_included || it.price || 0;
      if (!price) {
        const prodRows = await supabase.select('lego_products', { select: 'price_shipping_included', id: `eq.${it.product_id}` });
        price = (prodRows && prodRows[0] && prodRows[0].price_shipping_included) || 0;
      }
      const total_price = (Number(price) * quantity).toFixed(2);

      const orderPayload = { user_id: userId, product_id: it.product_id, quantity, status: 'pending', total_price, shipping_address: shippingAddress || null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const inserted = await supabase.insert('orders', orderPayload);
      // inserted may be empty depending on PostgREST preferences; return inserted rows by selecting
      createdOrders.push(orderPayload);
    }

    // Clear user's cart_items (non-atomic)
    await supabase.delete('cart_items', { user_id: `eq.${userId}` });

    // Optionally record a payment record if provided and payments table exists
    if (payment && payment.transactionId) {
      try {
        await supabase.insert('payments', { order_id: null, provider: payment.provider || 'unknown', transaction_id: payment.transactionId, status: payment.status || 'pending', amount: payment.amount || null, created_at: new Date().toISOString() });
      } catch (e) {
        console.warn('payments insert failed (optional):', e.message || e);
      }
    }

    res.json({ success: true, orders: createdOrders });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

module.exports = router;
