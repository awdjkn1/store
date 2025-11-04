const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
const { requireAdmin } = require('../../middlewares/authMiddleware');
const webhookCache = require('../../utils/webhookCache');

// Log admin action (utility)
async function logAdminAction(adminId, action, details) {
  try {
    await supabase.insert('admin_audit_log', { admin_id: adminId, action, details, timestamp: new Date().toISOString() });
  } catch (e) {
    console.warn('Failed to log admin action:', e.message || e);
  }
}

// Get audit logs
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const rows = await supabase.select('admin_audit_log', { select: '*', order: 'timestamp.desc', limit: '100' });
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Basic reporting
router.get('/sales-summary', requireAdmin, async (req, res) => {
  // ...sales summary logic...
  res.json({ summary: {} });
});

// Admin debug: return last verified webhook event (ephemeral, in-memory)
router.get('/webhook-last', requireAdmin, async (req, res) => {
  try {
    const data = webhookCache.getLastVerified();
    if (!data || !data.event) return res.json({ ok: false, message: 'No webhook events recorded' });
    return res.json({ ok: true, lastVerifiedAt: data.timestamp, event: data.event });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e && e.message ? e.message : String(e) });
  }
});

module.exports = router;
