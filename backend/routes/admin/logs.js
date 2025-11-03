const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middlewares/authMiddleware');

// Record admin dashboard interactions. Stored in Supabase 'admin_logs' table when available,
// otherwise logged to server console. This route is protected by requireAdmin.
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { action, details } = req.body || {};
    const supabase = require('../../utils/supabaseRest');
    const row = {
      admin_id: req.admin && req.admin.id ? req.admin.id : null,
      action: action || 'unknown',
      details: details ? JSON.stringify(details) : null,
      // Use 'timestamp' column name to match existing DB schema
      timestamp: new Date().toISOString()
    };
    try {
      // Persist to the canonical 'admin_audit_log' table (exists in DB dumps/scripts)
      await supabase.insert('admin_audit_log', row);
      return res.json({ logged: true, persisted: true });
    } catch (e) {
      // If persistence fails (missing table/permissions), fallback to console logging
      console.warn('[admin/logs] failed to persist admin log to admin_audit_log, falling back to console:', e && e.message ? e.message : e);
      console.log('[admin/logs] log (fallback):', row);
      return res.json({ logged: true, persisted: false });
    }
  } catch (err) {
    console.error('admin logs endpoint error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
