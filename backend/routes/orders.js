const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const supabase = require('../utils/supabaseRest');
const fetch = global.fetch || require('node-fetch');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

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

    // Compute total and create single order row
    try {
      const totalPrice = cartItems.reduce((acc, it) => {
        const qty = Number(it.quantity) || 1;
        let price = it.price_shipping_included || it.price || 0;
        if (!price) {
          // best-effort lookup
          // synchronous fallback left as-is; this should be infrequent
          price = 0;
        }
        return acc + (Number(price) * qty);
      }, 0);

      // The rest of your code continues here...
      try {
        const invoiceNumber = `inv-${orderId}`;
        const contentHex = encryptToByteaHex(invoicePayload);
        await supabase.insert('invoices', {
          invoice_number: invoiceNumber,
          order_id: orderId,
          user_id: order.user_id || null,
          amount: invoicePayload.amount,
          currency: invoicePayload.currency,
          payment_provider: invoicePayload.payment.provider,
          payment_transaction_id: invoicePayload.payment.transaction_id,
          status: 'stored',
          content: contentHex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        // ignore
      }
      const orderItems = [];
      for (const it of cartItems) {
        let price = it.price_shipping_included || it.price || 0;
        if (!price && it.product_id) {
          try {
            const prodRows = await supabase.select('lego_products', { select: 'price_shipping_included', id: `eq.${it.product_id}` });
            price = (prodRows && prodRows[0] && prodRows[0].price_shipping_included) || 0;
          } catch (e) { /* ignore */ }
        }
        const qty = Number(it.quantity) || 1;
        orderItems.push({ order_id: orderId, product_id: it.product_id || null, product_id_old_text: it.product_id_old_text || null, quantity: qty, price_each: Number(price), subtotal: (Number(price) * qty) });
      }

      let insertedItems = [];
      if (orderItems.length > 0) {
        try {
          await supabase.insert('order_items', orderItems);
          insertedItems = orderItems;
        } catch (e) {
          console.error('Failed to insert order_items:', e && e.message);
        }
      }

      // Optionally record a payment record if provided and payments table exists
      if (payment && payment.transactionId) {
          try {
        // normalize payment status to DB allowed values and persist provider_status
        let payStatus = (payment.status || 'pending').toString().toLowerCase();
        const ps = payStatus;
        if (['paid', 'succeeded', 'completed', 'captured', 'authorized', 'confirmed', 'success'].includes(payStatus)) payStatus = 'confirmed';
        else if (['awaiting','pending'].includes(payStatus)) payStatus = 'pending';
        else if (['expired'].includes(payStatus)) payStatus = 'failed';
        else if (['failed', 'declined', 'canceled', 'cancelled', 'voided'].includes(payStatus)) payStatus = 'failed';
        else if (payStatus === 'refunded' || payStatus.includes('refund')) payStatus = 'refunded';
        else payStatus = 'pending';

            // Upsert payment (no returning) and rely on DB uniqueness on transaction_id
                await supabase.upsert('payments', { order_id: orderId, provider: payment.provider || 'unknown', transaction_id: payment.transactionId, status: payStatus, amount: payment.amount || null, created_at: new Date().toISOString() }, { on_conflict: 'transaction_id' });
          } catch (e) {
            console.warn('payments upsert failed (optional):', e.message || e);
          }
      }

      // Fetch user info for invoice generation/storage
      let userRows = [];
      try {
        userRows = await supabase.select('users', { select: 'id,username,email', id: `eq.${userId}` });
      } catch (e) {
        console.warn('Failed to fetch user for invoice:', e && e.message);
      }
      const userInfo = (userRows && userRows[0]) || { email: null, username: null };

      // Build invoice payload (single invoice for the order)
      try {
        const invoicePayload = {
          order_id: orderId,
          user_id: userId,
          amount: createdOrder.total_price || null,
          currency: createdOrder.currency || 'USD',
          payment: {
            provider: (payment && payment.provider) || null,
            transaction_id: (payment && payment.transactionId) || null,
            status: (payment && payment.status) || null,
            amount: (payment && payment.amount) || null
          },
          shipping: { address: createdOrder.shipping_address || shippingAddress || null },
          confirmation: { order_id: orderId, status: createdOrder.status || 'pending', placed_at: createdOrder.created_at || new Date().toISOString() },
          products: (insertedItems || orderItems).map(it => ({ product_id: it.product_id || null, name: null, quantity: it.quantity, total_price: it.subtotal }))
        };

        // upsert invoice: if invoice exists for order_id, patch it; otherwise insert
        try {
          const existing = await supabase.select('invoices', { order_id: `eq.${orderId}` });
          const contentHex = encryptToByteaHex(invoicePayload);
          if (existing && existing.length > 0) {
            await supabase.patch('invoices', { payment_provider: invoicePayload.payment.provider, payment_transaction_id: invoicePayload.payment.transaction_id, content: contentHex, updated_at: new Date().toISOString() }, { id: `eq.${existing[0].id}` });
          } else {
            const invoiceNumber = `inv-${orderId}`;
            await supabase.insert('invoices', { invoice_number: invoiceNumber, order_id: orderId, user_id: userId, amount: invoicePayload.amount, currency: invoicePayload.currency, payment_provider: invoicePayload.payment.provider, payment_transaction_id: invoicePayload.payment.transaction_id, status: 'stored', content: contentHex, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          }
        } catch (e) {
          console.warn('Could not insert/patch invoice row:', e && e.message);
        }

        // Attach invoice payload to response order
        createdOrder.invoice = invoicePayload;
      } catch (e) {
        console.warn('Failed to build/store invoice metadata for order', orderId, e && e.message);
      }

      // Clear user's cart_items (non-atomic)
      try { await supabase.delete('cart_items', { user_id: `eq.${userId}` }); } catch (e) { /* ignore */ }

      res.json({ success: true, order: createdOrder, order_items: insertedItems });
    } catch (e) {
      console.error('Order creation error (normalized):', e && e.message);
      res.status(500).json({ error: 'Server error creating order' });
    }
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

// Get current user's orders (include user info). Admins receive all orders.
router.get('/orders/mine', verifyJWT, async (req, res) => {
  const userId = req.user && req.user.id;
  const isAdmin = req.user && req.user.role === 'admin';
  try {
    let rows;
    if (isAdmin) {
      // return all orders with user info
      rows = await supabase.select('orders', { select: '*,users(id,username,email)', order: 'created_at.desc' });
    } else {
      rows = await supabase.select('orders', { select: '*,users(id,username,email)', user_id: `eq.${userId}`, order: 'created_at.desc' });
    }
    // Attach invoice metadata (if any) by batching a query to invoices table
    let enriched = rows || [];
    try {
      const orderIds = (enriched || []).map(x => x.id).filter(Boolean);
      if (orderIds.length > 0) {
        // fetch invoices for these orders (first invoice per order)
        const invRows = await supabase.select('invoices', { select: '*', order_id: `in.(${orderIds.join(',')})` });
        const invByOrder = {};
        (invRows || []).forEach(inv => {
          if (inv && inv.order_id) invByOrder[inv.order_id] = inv;
        });
        enriched = (enriched || []).map(r => {
          try {
            const inv = invByOrder[r.id];
              if (inv) {
                let content = null;
                try {
                  if (inv.content && typeof inv.content === 'string' && inv.content.startsWith('\\x')) {
                    // Try to decrypt bytea hex content (stored encrypted) first
                    try {
                      const decrypted = decryptFromByteaHex(inv.content);
                      content = decrypted ? JSON.parse(decrypted) : null;
                    } catch (de) {
                      // Fallback: try to decode as plaintext hex JSON
                      try {
                        const jsonStr = Buffer.from(inv.content.slice(2), 'hex').toString();
                        content = JSON.parse(jsonStr);
                      } catch (e) { content = inv.content || null; }
                    }
                  } else {
                    // content might be a JSON string or object
                    if (inv.content && typeof inv.content === 'string') content = JSON.parse(inv.content);
                    else content = inv.content || null;
                  }
                } catch (e) { content = inv.content || null; }
              r.invoice = {
                id: inv.id,
                invoice_number: inv.invoice_number,
                invoice_url: inv.path || (inv.filename ? `/uploads/invoices/${inv.filename}` : undefined),
                mime_type: inv.mime_type,
                size_bytes: inv.size_bytes,
                amount: inv.amount,
                currency: inv.currency,
                payment_provider: inv.payment_provider,
                payment_transaction_id: inv.payment_transaction_id,
                status: inv.status,
                created_at: inv.created_at,
                content
              };
            } else {
              // fallback to checking disk for a PDF named invoice-<orderId>.pdf
              try {
                const pdfPath = path.join(__dirname, '..', 'public', 'uploads', 'invoices', `invoice-${r.id}.pdf`);
                if (fs.existsSync(pdfPath)) {
                  r.invoice = { invoice_url: `/uploads/invoices/invoice-${r.id}.pdf` };
                }
              } catch (e) {}
            }
          } catch (e) {}
          return r;
        });
      }
    } catch (e) {
      // if invoices query fails, fall back to previous behavior of file existence check
      enriched = (enriched || []).map(r => {
        try {
          if (r && r.id) {
            const pdfPath = path.join(__dirname, '..', 'public', 'uploads', 'invoices', `invoice-${r.id}.pdf`);
            if (fs.existsSync(pdfPath)) {
              r.invoice_url = `/uploads/invoices/invoice-${r.id}.pdf`;
            }
          }
        } catch (e) {}
        return r;
      });
    }

    res.json({ orders: enriched });
  } catch (e) {
    console.error('Failed to fetch orders/mine:', e && e.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Helper: generate a simple HTML invoice
function generateInvoiceHtml(order, user) {
  const now = new Date().toISOString();
  const invoiceId = order.id || `inv-${Math.random().toString(36).slice(2,9)}`;
  const itemsHtml = `<tr><td>${order.product_id || ''}</td><td>${order.quantity}</td><td>$${order.total_price || '0.00'}</td></tr>`;
  return `<!doctype html>
  <html>
    <head><meta charset="utf-8"><title>Invoice ${invoiceId}</title></head>
    <body>
      <h1>Invoice: ${invoiceId}</h1>
      <div>To: ${user.username || 'Customer'} &lt;${user.email || ''}&gt;</div>
      <div>Date: ${now}</div>
      <h2>Confirmation</h2>
      <div>Order ID: ${order.id || invoiceId}</div>
      <div>Status: ${order.status || 'N/A'}</div>
      <div>Placed: ${order.created_at || now}</div>

      <h2>Shipping</h2>
      <div>${order.shipping_address || '-'}</div>

      <h2>Payment</h2>
      <div>Provider: ${order.payment_provider || 'N/A'}</div>
      <div>Transaction: ${order.payment_transaction_id || 'N/A'}</div>
      <div>Payment status: ${order.payment_status || 'N/A'}</div>

      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-top:1rem;">
        <thead><tr><th>Product ID</th><th>Quantity</th><th>Total</th></tr></thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="margin-top:1rem">Subtotal / Total: $${order.total_price || (order.payment_amount || '0.00')}</div>
    </body>
  </html>`;
}

// Generate a PDF invoice for an order and save it into invoicesDir. Returns the saved filepath.
function generateInvoicePdf(order, user, invoicesDir) {
  return new Promise(async (resolve, reject) => {
    try {
      const invoiceId = order.id || `inv-${Math.random().toString(36).slice(2,9)}`;
      const filename = `invoice-${invoiceId}.pdf`;
      const filepath = path.join(invoicesDir, filename);

  // Try to resolve product details for nicer invoice lines
  let productName = order.product_name || order.product_id || '';
  let productPrice = null;
      try {
        if (order.product_id) {
              const prodRows = await supabase.select('lego_products', { select: 'id,name,price_shipping_included', id: `eq.${order.product_id}` });
          if (prodRows && prodRows[0]) {
            productName = prodRows[0].name || productName;
                productPrice = prodRows[0].price_shipping_included || productPrice;
          }
        }
      } catch (e) {
        // ignore
      }

      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      doc.fontSize(20).text(`Invoice: ${invoiceId}`, { align: 'left' });
      doc.moveDown();
      doc.fontSize(12).text(`To: ${user.username || 'Customer'} <${user.email || ''}>`);
      doc.text(`Date: ${new Date().toLocaleString()}`);
      doc.moveDown();

    doc.fontSize(14).text('Order Details');
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Product: ${productName}`);
    doc.text(`Product ID: ${order.product_id || '-'}`);
    const unitPrice = productPrice || (order.payment_amount ? (Number(order.payment_amount) / Math.max(1, Number(order.quantity || 1))).toFixed(2) : (order.total_price && order.quantity ? (Number(order.total_price) / Number(order.quantity)).toFixed(2) : '0.00'));
    doc.text(`Unit Price: $${Number(unitPrice).toFixed(2)}`);
    doc.text(`Quantity: ${order.quantity}`);
    doc.text(`Total: $${order.total_price || (order.payment_amount || '0.00')}`);

    doc.moveDown();
    doc.fontSize(14).text('Payment Details');
    doc.fontSize(12);
    doc.text(`Provider: ${order.payment_provider || 'N/A'}`);
    doc.text(`Transaction ID: ${order.payment_transaction_id || 'N/A'}`);
    doc.text(`Payment Status: ${order.payment_status || 'N/A'}`);
    doc.text(`Amount: $${order.payment_amount || order.total_price || '0.00'}`);

    doc.moveDown();
    doc.fontSize(14).text('Shipping');
    doc.fontSize(12);
    doc.text(order.shipping_address || '-');

    doc.moveDown();
    doc.fontSize(14).text('Confirmation');
    doc.fontSize(12);
    doc.text(`Order ID: ${order.id || invoiceId}`);
    doc.text(`Status: ${order.status || 'N/A'}`);
    doc.text(`Placed: ${order.created_at || new Date().toISOString()}`);

      doc.end();

      stream.on('finish', () => resolve(filepath));
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// (Emailing removed) Invoice PDFs are stored in public/uploads/invoices and served via the invoice endpoint.

// Endpoint: download invoice for an order (must be owner or admin)
router.get('/orders/:id/invoice', verifyJWT, async (req, res) => {
  const userId = req.user && req.user.id;
  const orderId = req.params.id;
  try {
    const rows = await supabase.select('orders', { id: `eq.${orderId}` });
    const order = (rows && rows[0]) || null;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Check ownership
    if (order.user_id !== userId && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // Try to fetch user
    let userRows = await supabase.select('users', { select: 'id,username,email', id: `eq.${order.user_id}` });
    const userInfo = (userRows && userRows[0]) || { email: null, username: null };

    // Try to fetch stored invoice record for this order
    try {
      const invRows = await supabase.select('invoices', { order_id: `eq.${orderId}` });
      const inv = (invRows && invRows[0]) || null;
      if (inv) {
        // return stored invoice metadata/content as JSON
        let content = null;
        try {
          if (inv.content && typeof inv.content === 'string' && inv.content.startsWith('\\x')) {
            try {
              const decrypted = decryptFromByteaHex(inv.content);
              content = decrypted ? JSON.parse(decrypted) : null;
            } catch (de) {
              try { content = JSON.parse(Buffer.from(inv.content.slice(2), 'hex').toString()); } catch (e) { content = inv.content || null; }
            }
          } else {
            try { content = inv.content ? JSON.parse(inv.content) : null; } catch (e) { content = inv.content || null; }
          }
        } catch (e) { content = inv.content || null; }
        return res.json({ invoice: { ...inv, content } });
      }
    } catch (e) {
      // fall through to generate invoice content on the fly
      console.warn('Failed to query invoices table:', e && e.message);
    }

    // No stored invoice found — generate invoice content on the fly (no PDF)
    try {
      const invoicePayload = {
        order_id: order.id || orderId,
        user: userInfo,
        amount: order.total_price || order.payment_amount || null,
        currency: order.currency || 'USD',
        payment: {
          provider: order.payment_provider || null,
          transaction_id: order.payment_transaction_id || null,
          status: order.payment_status || null,
          amount: order.payment_amount || null
        },
        shipping: { address: order.shipping_address || null },
        confirmation: { order_id: order.id || orderId, status: order.status || null, placed_at: order.created_at || new Date().toISOString() },
        products: [{ product_id: order.product_id || null, name: order.product_name || null, quantity: order.quantity || 1, total_price: order.total_price || null }]
      };

      // Attempt to persist the invoice row (best-effort)
      try {
        const invoiceNumber = `inv-${orderId}`;
        const contentHex = `\\x${Buffer.from(JSON.stringify(invoicePayload)).toString('hex')}`;
        await supabase.insert('invoices', {
          invoice_number: invoiceNumber,
          order_id: orderId,
          user_id: order.user_id || null,
          amount: invoicePayload.amount,
          currency: invoicePayload.currency,
          payment_provider: invoicePayload.payment.provider,
          payment_transaction_id: invoicePayload.payment.transaction_id,
          status: 'stored',
          content: contentHex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        // ignore
      }

      return res.json({ invoice: invoicePayload });
    } catch (e) {
      console.error('Invoice generation error:', e && e.message);
      return res.status(500).json({ error: 'Failed to generate invoice' });
    }
  } catch (e) {
    console.error('Invoice download error:', e && e.message);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

module.exports = router;
