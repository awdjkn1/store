const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const hoodpay = require('../utils/hoodpay');
const supabase = require('../utils/supabaseRest');

// POST /api/checkout
// Body: { items: [{ product_id, quantity }], shippingAddress, payment: { token, provider, currency } }
router.post('/', verifyJWT, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { items = [], shippingAddress = null, payment = {} } = req.body;
  // Validate request payload with clear messages
  const validation = [];
  if (!Array.isArray(items) || items.length === 0) {
    validation.push('items must be a non-empty array');
  } else {
    items.forEach((it, idx) => {
      if (!it || !(it.product_id || it.id)) validation.push(`items[${idx}].product_id is required`);
      const qty = Number(it.quantity || 0);
      if (!Number.isFinite(qty) || qty < 1) validation.push(`items[${idx}].quantity must be an integer >= 1`);
    });
  }

  if (!payment || typeof payment !== 'object') {
    validation.push('payment object is required and must include payment.paymentId (server-side tokenization disabled)');
  }

  if (validation.length) return res.status(400).json({ error: 'invalid_request', details: validation });

  try {
    // Normalize items
    const normalized = items.map(it => ({ product_id: it.product_id || it.id, quantity: Number(it.quantity || 1) }));

    // Fetch product prices to compute totals and validate stock
    const productIds = normalized.map(i => i.product_id).filter(Boolean);
    const products = await supabase.select('lego_products', { select: 'id,price_shipping_included,stock_count', id: `in.(${productIds.join(',')})` });

    let totalAmount = 0;
    const orderRows = [];
    for (const it of normalized) {
      const prod = (products || []).find(p => p.id === it.product_id);
      const price = (prod && (prod.price_shipping_included || prod.price)) || 0;
      const qty = Number(it.quantity) || 1;
      totalAmount += Number(price) * qty;
      orderRows.push({ user_id: userId, product_id: it.product_id, quantity: qty, status: 'pending', total_price: (Number(price) * qty).toFixed(2), shipping_address: shippingAddress || null });
    }

    // Only client-created paymentId flow is supported. Server-side tokenization disabled.
    let charge = null;
    let transactionId = null;
    let paymentStatus = null;

    if (payment && (payment.paymentId || payment.payment_id || payment.paymentId === 0)) {
      // Client created payment - verify with provider before creating order
      const paymentId = payment.paymentId || payment.payment_id;
      const paymentData = await hoodpay.getPayment(paymentId);
      if (!paymentData) return res.status(400).json({ error: 'Payment not found' });

      const status = (paymentData.status || paymentData.status_code || '').toString().toLowerCase();
      const okStatuses = ['paid', 'succeeded', 'completed', 'success', 'authorized', 'captured'];
      if (!okStatuses.includes(status)) {
        return res.status(400).json({ error: `Payment not in a final successful state: ${status}` });
      }

      // Basic amount check: provider may return amount in minor units (cents)
      let providerAmount = null;
      if (paymentData.amount !== undefined && paymentData.amount !== null) {
        providerAmount = Number(paymentData.amount);
        // if amount seems large compared to totalAmount assume minor units
        if (providerAmount > (totalAmount * 10)) {
          providerAmount = providerAmount / 100;
        }
      }
      if (providerAmount !== null && Math.abs(providerAmount - totalAmount) > 0.5) {
        return res.status(400).json({ error: 'Payment amount does not match order total', details: { providerAmount, expected: totalAmount } });
      }

      transactionId = paymentData.id || paymentData.payment_id || (paymentData.data && paymentData.data.id) || paymentId;
      paymentStatus = paymentData.status || 'paid';
      charge = paymentData;
    } else {
      return res.status(400).json({ error: 'paymentId required. Server-side tokenization has been disabled.' });
    }

    // Record orders using PostgREST (non-transactional). If your DB supports an RPC that performs atomic insert+clear, prefer that.
    let createdOrders = [];
    try {
      const inserted = await supabase.insert('orders', orderRows, { returning: '*' });
      createdOrders = inserted || orderRows;

      // Insert payment record
      try {
        await supabase.insert('payments', { order_id: null, provider: payment.provider || 'hoodpay', transaction_id: transactionId || null, status: paymentStatus || 'paid', amount: totalAmount.toFixed(2), created_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Failed to insert payment record (non-fatal):', e && e.message);
      }

      // Optionally clear cart_items for this user
      try { await supabase.delete('cart_items', { user_id: `eq.${userId}` }); } catch (e) { /* ignore */ }

      return res.json({ success: true, orders: createdOrders, charge });
    } catch (dbErr) {
      // DB write failed after charge: attempt to refund if we have a transaction id
      console.error('DB insert failed after successful charge/payment, attempting refund', dbErr && dbErr.message);
      try {
        if (transactionId) {
          await hoodpay.createRefund({ chargeId: transactionId, amount: totalAmount.toFixed(2) });
        }
      } catch (refundErr) {
        console.error('Refund attempt failed', refundErr && refundErr.message);
      }
      return res.status(500).json({ error: 'Failed to record order after charging. Refund attempted.' });
    }
  } catch (err) {
    console.error('Checkout error:', err && (err.message || err));
    return res.status(500).json({ error: 'Checkout failed' });
  }
});

module.exports = router;
