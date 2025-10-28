const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
const { requireAdmin } = require('../../middlewares/authMiddleware');

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

module.exports = router;
