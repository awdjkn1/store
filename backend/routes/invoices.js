const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const supabase = require('../utils/supabaseRest');
const invoiceService = require('../services/invoiceService');
const { decryptFromByteaHex } = require('../utils/cryptoUtils');

// List invoices (for current user or admin)
router.get('/', verifyJWT, async (req, res) => {
  try {
    const q = { select: 'id,invoice_number,order_id,user_id,amount,currency,status,created_at,updated_at' };
    if (req.user && req.user.role !== 'admin') q.user_id = `eq.${req.user.id}`;
    const rows = await supabase.select('invoices', q);
    res.json(rows || []);
  } catch (e) {
    console.error('Invoices list error', e && e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get invoice detail (decrypt content)
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const rows = await supabase.select('invoices', { select: '*', or: `(invoice_number.eq.${id},id.eq.${id})` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    const inv = rows[0];
    // authorization: allow if owner or admin
    if (req.user.role !== 'admin' && String(inv.user_id) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    let contentPlain = null;
    try { contentPlain = decryptFromByteaHex(inv.content); } catch (e) { contentPlain = null; }
    let payload = null;
    try { payload = contentPlain ? JSON.parse(contentPlain) : null; } catch (e) { payload = null; }
    res.json({ invoice: inv, payload });
  } catch (e) {
    console.error('Invoice get error', e && e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download / view invoice PDF
router.get('/:id/download', verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const rows = await supabase.select('invoices', { select: '*', or: `(invoice_number.eq.${id},id.eq.${id})` });
    if (!rows || rows.length === 0) return res.status(404).send('Not found');
    const inv = rows[0];
    if (req.user.role !== 'admin' && String(inv.user_id) !== String(req.user.id)) return res.status(403).send('Forbidden');

    const filePath = `/uploads/invoices/${inv.invoice_number}.pdf`;
    // serve file from public/uploads (app serves /uploads statically)
    res.redirect(filePath);
  } catch (e) {
    console.error('Invoice download error', e && e.message);
    res.status(500).send('Server error');
  }
});

// Approve invoice (admin)
router.post('/:id/approve', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const id = req.params.id;
    const rows = await supabase.select('invoices', { select: '*', or: `(invoice_number.eq.${id},id.eq.${id})` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const inv = rows[0];
    await supabase.update('invoices', { approved: true, approved_by: req.user.id, approved_at: new Date().toISOString() }, { id: `eq.${inv.id}` });
    await supabase.insert('admin_audit_log', { action: 'invoice_approved', actor_id: req.user.id, invoice_id: inv.id, created_at: new Date().toISOString() }).catch(() => {});
    res.json({ approved: true });
  } catch (e) {
    console.error('Invoice approve error', e && e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Deliver invoice (email or return link)
router.post('/:id/deliver', verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const { method, to } = req.body || {};
    const rows = await supabase.select('invoices', { select: '*', or: `(invoice_number.eq.${id},id.eq.${id})` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const inv = rows[0];
    if (req.user.role !== 'admin' && String(inv.user_id) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });

    const result = await invoiceService.deliverInvoice(inv.invoice_number, { method, to });
    res.json(result);
  } catch (e) {
    console.error('Invoice deliver error', e && e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual reminder endpoint
router.post('/:id/remind', verifyJWT, async (req, res) => {
  try {
    const id = req.params.id;
    const rows = await supabase.select('invoices', { select: '*', or: `(invoice_number.eq.${id},id.eq.${id})` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const inv = rows[0];
    if (req.user.role !== 'admin' && String(inv.user_id) !== String(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
    // send reminder via invoiceService.deliverInvoice with method email (if configured)
    const userRows = await supabase.select('users', { select: 'id,email', id: `eq.${inv.user_id}` });
    const to = userRows && userRows[0] ? userRows[0].email : null;
    if (!to) return res.status(400).json({ error: 'No recipient email' });
    const result = await invoiceService.deliverInvoice(inv.invoice_number, { method: 'email', to });
    // log reminder
    await supabase.insert('event_logs', { event_type: 'invoice_reminder', invoice_number: inv.invoice_number, payload: JSON.stringify({ result }), created_at: new Date().toISOString() }).catch(() => {});
    res.json(result);
  } catch (e) {
    console.error('Invoice remind error', e && e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
