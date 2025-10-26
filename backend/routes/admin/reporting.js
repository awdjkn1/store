const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD ? String(process.env.PG_PASSWORD) : undefined,
});
const { requireAdmin } = require('../../middlewares/authMiddleware');

// Log admin action (utility)
async function logAdminAction(adminId, action, details) {
  await pool.query('INSERT INTO admin_audit_log (admin_id, action, details, timestamp) VALUES ($1, $2, $3, NOW())', [adminId, action, details]);
}

// Get audit logs
router.get('/audit', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_audit_log ORDER BY timestamp DESC LIMIT 100');
    res.json({ logs: result.rows });
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
