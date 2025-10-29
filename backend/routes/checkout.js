const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const hoodpay = require('../utils/hoodpay');
const supabase = require('../utils/supabaseRest');
const { randomUUID } = require('crypto');

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
  const products = await supabase.select('lego_products', { select: 'id,price_shipping_included', id: `in.(${productIds.join(',')})` });

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

    // Record a single order and its order_items (non-transactional via PostgREST).
    // If your DB supports an RPC that performs atomic insert+clear, prefer that.
    let createdOrder = null;
    try {
      // Create order-level row
      const orderPayload = {
        user_id: userId,
        status: 'pending',
        shipping_address: shippingAddress || null,
        total_price: Number(totalAmount).toFixed(2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

  // generate an id locally so we can insert related order_items without relying on `returning`
  const orderIdLocal = randomUUID();
  orderPayload.id = orderIdLocal;
  await supabase.insert('orders', orderPayload);
  createdOrder = Object.assign({}, orderPayload);
  const orderId = orderIdLocal;

      // Build order_items rows
      const orderItems = [];
      for (const it of normalized) {
        const prod = (products || []).find(p => p.id === it.product_id) || {};
        const price = (prod && (prod.price_shipping_included || prod.price)) || 0;
        const qty = Number(it.quantity) || 1;
        orderItems.push({
          order_id: orderId,
          product_id: it.product_id || null,
          product_id_old_text: it.product_id_old_text || null,
          quantity: qty,
          price_each: Number(price),
          subtotal: Number(price) * qty
        });
      }

      // Insert order_items
      let insertedItems = [];
      if (orderItems.length > 0) {
        try {
          await supabase.insert('order_items', orderItems);
          insertedItems = orderItems;
        } catch (e) {
          // if inserting items fails, attempt to clean up by refunding if we have a transaction
          console.error('Failed to insert order_items:', e && e.message);
          throw e;
        }
      }

      // Insert payment record linked to this order (if we have a transactionId)
      try {
        // Normalize status to schema allowed values: pending, confirmed, failed, refunded
        let canonicalStatus = 'pending';
        const s = (paymentStatus || '').toString().toLowerCase();
          if (['paid','succeeded','completed','captured','authorized','confirmed','success'].includes(s)) canonicalStatus = 'confirmed';
          else if (['awaiting','pending'].includes(s)) canonicalStatus = 'pending';
          else if (['expired'].includes(s)) canonicalStatus = 'failed';
          else if (['cancelled','canceled','failed','declined','voided'].includes(s)) canonicalStatus = 'failed';
          else if (s === 'refunded' || (s && s.includes('refund'))) canonicalStatus = 'refunded';

        if (transactionId) {
            try {
              // Upsert payment record (avoid returning=representation)
              await supabase.upsert('payments', { order_id: orderId, provider: payment.provider || 'hoodpay', transaction_id: transactionId || null, status: canonicalStatus, amount: Number(totalAmount).toFixed(2), created_at: new Date().toISOString() }, { on_conflict: 'transaction_id' });
            } catch (e) {
              console.warn('payments upsert failed (non-fatal):', e && e.message);
            }
        }
      } catch (e) {
        console.warn('Failed to insert payment record (non-fatal):', e && e.message);
      }

      // Optionally clear cart_items for this user
      try { await supabase.delete('cart_items', { user_id: `eq.${userId}` }); } catch (e) { /* ignore */ }

      return res.json({ success: true, order: createdOrder, order_items: insertedItems, charge });
    } catch (dbErr) {
      // DB write failed after charge: attempt to refund if we have a transaction id
      console.error('DB insert failed after successful charge/payment, attempting refund', dbErr && dbErr.message);
      try {
        if (transactionId) {
          await hoodpay.createRefund({ chargeId: transactionId, amount: Number(totalAmount).toFixed(2) });
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
