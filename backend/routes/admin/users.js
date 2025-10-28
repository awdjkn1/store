const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
const { requireAdmin } = require('../../middlewares/authMiddleware');


// List all users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await supabase.select('users', { select: 'id,username,email,role,created_at', order: 'created_at.desc' });
    res.json({ users: rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Assign role to user (optional)
router.put('/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowed = ['user', 'admin'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    await supabase.patch('users', { role, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
    const rows = await supabase.select('users', { select: 'id,username,email,role', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get user activity logs
router.get('/:id/activity', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await supabase.select('user_activity', { select: '*', user_id: `eq.${id}`, order: 'timestamp.desc' });
    res.json({ activity: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
