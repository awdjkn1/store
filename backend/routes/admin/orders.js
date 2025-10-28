const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
const { requireAdmin } = require('../../middlewares/authMiddleware');


// List all orders, optionally filter by status
router.get('/', requireAdmin, async (req, res) => {
  const { status } = req.query;
  try {
    const opts = { select: '*', order: 'created_at.desc' };
    if (status) opts.status = `eq.${status}`;
    const rows = await supabase.select('orders', opts);
    res.json({ orders: rows });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (shipped, refunded, etc.)
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'shipped', 'refunded', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await supabase.patch('orders', { status, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
    const rows = await supabase.select('orders', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
