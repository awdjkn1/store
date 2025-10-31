const express = require('express');
const router = express.Router();
const hoodpay = require('../utils/hoodpay');
const { encryptToByteaHex, decryptFromByteaHex } = require('../utils/cryptoUtils');

// Accept raw body for signature verification
router.post('/hoodpay', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const sigHeader = req.headers['hoodpay-signature'] || req.headers['x-hoodpay-signature'] || req.headers['stripe-signature'];

    let rawBuffer = null;
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) rawBuffer = req.rawBody;
    else if (req.body && Buffer.isBuffer(req.body)) rawBuffer = req.body;
    else if (req.body && typeof req.body === 'string') rawBuffer = Buffer.from(req.body, 'utf8');
    else if (req.body && typeof req.body === 'object') rawBuffer = Buffer.from(JSON.stringify(req.body), 'utf8');
    else rawBuffer = Buffer.from('', 'utf8');

    const ok = hoodpay.verifyWebhookSignature(rawBuffer, sigHeader);
    if (!ok) {
      console.warn('HoodPay webhook signature verification failed (webhooks route)');
      return res.status(400).send('invalid signature');
    }

    let event = null;
    try { event = JSON.parse(rawBuffer.toString('utf8')); } catch (e) { event = (req.body && typeof req.body === 'object') ? req.body : null; if (!event) console.warn('Webhook JSON parse failed', e && e.message); }

    try {
      const supabase = require('../utils/supabaseRest');
      const { getIO } = require('../utils/socket');
      const io = getIO();

      if (event) {
        const t = (event.type || '').toString();
        const data = event.data || {};
        const providerId = data.id || data.payment_id || data.paymentId || data.transaction_id || data.transactionId;
        const rawStatus = (data.status || data.state || (t.includes('succeeded') ? 'succeeded' : '') || '').toString().toLowerCase();

        let canonicalStatus = 'pending';
        const rs = (rawStatus || '').toString().toLowerCase();
        if (['paid', 'succeeded', 'completed', 'captured', 'authorized', 'confirmed', 'success'].includes(rs)) canonicalStatus = 'confirmed';
        else if (['awaiting', 'pending'].includes(rs)) canonicalStatus = 'pending';
        else if (['expired'].includes(rs)) canonicalStatus = 'failed';
        else if (['cancelled', 'canceled'].includes(rs)) canonicalStatus = 'failed';
        else if (['failed', 'declined', 'voided'].includes(rs)) canonicalStatus = 'failed';
        else if (t.includes('refund') || rs === 'refunded' || rs.includes('refund')) canonicalStatus = 'refunded';

        let amount = null;
        if (data.amount !== undefined && data.amount !== null) {
          amount = Number(data.amount);
          if (amount > 10000) amount = amount / 100;
        }

        const paymentRow = {
          provider: 'hoodpay',
          transaction_id: providerId || null,
          status: canonicalStatus,
          raw_event: JSON.stringify(event),
          amount: amount !== null ? Number(amount) : null,
          order_id: data.order_id || (data.metadata && data.metadata.order_id) || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          await supabase.upsert('payments', paymentRow, { on_conflict: 'transaction_id' });
          const savedRows = await supabase.select('payments', { select: '*', transaction_id: `eq.${paymentRow.transaction_id}`, limit: '1' });
          const saved = Array.isArray(savedRows) && savedRows[0] ? savedRows[0] : null;

          if (saved && saved.order_id) {
            let newOrderStatus = null;
            if (canonicalStatus === 'confirmed') newOrderStatus = 'paid';
            else if (canonicalStatus === 'failed') newOrderStatus = 'payment_failed';
            else if (canonicalStatus === 'refunded') newOrderStatus = 'refunded';

            if (newOrderStatus) {
              try { await supabase.patch('orders', { status: newOrderStatus, updated_at: new Date().toISOString() }, { id: `eq.${saved.order_id}` }); } catch (e) { console.warn('Failed to update order status from webhook:', e && e.message); }
            }
          }

          try {
            if (saved && saved.order_id) {
              const invRows = await supabase.select('invoices', { order_id: `eq.${saved.order_id}` });
              if (Array.isArray(invRows) && invRows.length > 0) {
                for (const inv of invRows) {
                  try {
                    let content = null;
                    if (inv.content && typeof inv.content === 'string' && inv.content.startsWith('\\x')) {
                      try { const dec = decryptFromByteaHex(inv.content); content = dec ? JSON.parse(dec) : null; } catch (de) { try { const jsonStr = Buffer.from(inv.content.slice(2), 'hex').toString(); content = JSON.parse(jsonStr); } catch (e) { content = null; } }
                    } else if (inv.content) {
                      content = typeof inv.content === 'string' ? JSON.parse(inv.content) : inv.content;
                    }
                    if (!content) content = {};
                    content.payment = content.payment || {};
                    content.payment.provider = content.payment.provider || saved.provider || paymentRow.provider;
                    content.payment.transaction_id = content.payment.transaction_id || saved.transaction_id || paymentRow.transaction_id;
                    content.payment.status = content.payment.status || paymentRow.status;
                    content.payment.amount = content.payment.amount || paymentRow.amount;

                    const contentHex = encryptToByteaHex(content);
                    await supabase.patch('invoices', { payment_provider: content.payment.provider, payment_transaction_id: content.payment.transaction_id, content: contentHex, updated_at: new Date().toISOString() }, { id: `eq.${inv.id}` });
                  } catch (e) { console.warn('Failed to update invoice content from webhook for invoice', inv && inv.id, e && e.message); }
                }
              }
            }
          } catch (e) { console.warn('Failed to sync invoices from webhook payment:', e && e.message); }

          const emitPayload = { event: event.type || 'payment.event', providerId, status: canonicalStatus, amount, payment: saved || null };
          try { if (io) io.emit('payment.update', emitPayload); } catch (e) { console.warn('Socket emit failed:', e && e.message); }
        } catch (dbErr) { console.error('Webhook DB upsert error:', dbErr && (dbErr.message || dbErr)); }
      }
    } catch (e) { console.warn('Webhook processing error (webhooks route):', e && e.message); }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook route error', err && err.message ? err.message : err);
    return res.status(500).send('server error');
  }
});

module.exports = router;
