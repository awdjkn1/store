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
      details: details ? JSON.stringify(details) : null
    };

    // Try to persist to 'admin_audit_log' table if Supabase configured
    // Omit created_at here to avoid schema mismatch; let DB set defaults when available.
    try {
      await supabase.insert('admin_audit_log', row);
      return res.json({ logged: true });
    } catch (e) {
      // If persistence fails, attempt the legacy table name as a fallback.
      console.warn('[admin/logs] failed to persist to admin_audit_log, attempting admin_logs:', e && e.message ? e.message : e);
      try {
        await supabase.insert('admin_logs', row);
        return res.json({ logged: true, persisted: 'admin_logs' });
      } catch (e2) {
        // If persistence fails, fallback to console logging
        console.warn('[admin/logs] failed to persist admin log to admin_logs, falling back to console:', e2 && e2.message ? e2.message : e2);
        console.log('[admin/logs] log:', Object.assign({}, row, { created_at: new Date().toISOString() }));
        return res.json({ logged: true, persisted: false });
      }
    }
  } catch (err) {
    console.error('admin logs endpoint error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
