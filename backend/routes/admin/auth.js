const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Admin login. Credentials are configurable via env vars to avoid hardcoding secrets.
// Set either:
// - ADMIN_USERNAME and ADMIN_PASSWORD (plain string, dev only)
// OR
// - ADMIN_USERNAME and ADMIN_PASSWORD_HASH (bcrypt hash of password)
// JWT_SECRET must be set to sign admin tokens.

const supabase = require('../../utils/supabaseRest');
const { verifyJWT, requireRole } = require('../../middlewares/auth');

// Helper: sign JWT
function signAdminToken(payload) {
  const secret = process.env.JWT_SECRET || 'changeme';
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

// Normalize username for lookup
function normalizeUsername(u) {
  return String(u || '').trim();
}

router.post('/login', async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const password = req.body.password ? String(req.body.password) : '';

  if (!username || !password) {
    console.warn('[admin-auth] Missing username or password');
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // 1) Try DB-backed admin lookup
    const users = await supabase.select('users', { select: 'id,username,password,role', username: `eq.${username}` });
    const found = users && users.length ? users[0] : null;

    if (found) {
      if (found.role !== 'admin') {
        console.warn(`[admin-auth] User ${username} exists but role=${found.role}; rejecting`);
      } else if (found.password) {
        const match = await bcrypt.compare(password, found.password);
        if (match) {
          const token = signAdminToken({ id: found.id, username: found.username, role: found.role });
          console.log(`[admin-auth] Successful DB login for admin ${found.username} id=${found.id}`);
          return res.json({ token, admin: { id: found.id, username: found.username, role: found.role } });
        } else {
          console.warn(`[admin-auth] Password mismatch for DB admin ${username}`);
        }
      } else {
        console.warn(`[admin-auth] Admin user ${username} exists but has no password hash`);
      }
    }

    // 2) Fallback to env-configured admin (useful for dev / previews)
    const envUser = process.env.ADMIN_USERNAME ? normalizeUsername(process.env.ADMIN_USERNAME) : null;
    const envPass = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD) : null;
    const envPassHash = process.env.ADMIN_PASSWORD_HASH ? String(process.env.ADMIN_PASSWORD_HASH) : null;

    if (envUser && envUser === username) {
      // Plain password in env (dev convenience)
      if (envPass && password === envPass) {
        // Optionally ensure the admin exists in the DB for convenience (dev only)
        if (process.env.NODE_ENV !== 'production' && process.env.ADMIN_AUTOSEED !== 'false') {
          try {
            if (!found) {
              const hash = bcrypt.hashSync(envPass, 10);
              await supabase.insert('users', { username: envUser, password: hash, role: 'admin', created_at: new Date().toISOString() });
              console.log('[admin-auth] Dev admin user seeded into DB');
            }
          } catch (e) {
            console.warn('[admin-auth] Failed to seed dev admin user:', e && e.message ? e.message : e);
          }
        }

        const token = signAdminToken({ id: 'env-admin', username: envUser, role: 'admin' });
        console.log('[admin-auth] Successful login via ADMIN_PASSWORD env var');
        return res.json({ token, admin: { id: 'env-admin', username: envUser, role: 'admin' } });
      }

      // Or compare against env hash
      if (envPassHash) {
        const match = await bcrypt.compare(password, envPassHash);
        if (match) {
          const token = signAdminToken({ id: 'env-admin', username: envUser, role: 'admin' });
          console.log('[admin-auth] Successful login via ADMIN_PASSWORD_HASH env var');
          return res.json({ token, admin: { id: 'env-admin', username: envUser, role: 'admin' } });
        }
      }
    }

    // 3) No match -> unauthorized
    console.warn('[admin-auth] Invalid credentials for', username);
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('[admin-auth] Error during login:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Change password endpoint (admin only)
router.post('/change-password', verifyJWT, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const username = req.user && req.user.username;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' });
    }

    // If the token is the env-admin sentinel, upsert a DB admin row for the env username
    if (userId === 'env-admin') {
      const targetUsername = username || process.env.ADMIN_USERNAME;
      if (!targetUsername) return res.status(400).json({ error: 'No target admin username available' });
      const hash = bcrypt.hashSync(String(newPassword), 10);
      try {
        const existing = await supabase.select('users', { select: 'id,username', username: `eq.${targetUsername}` });
        if (existing && existing.length) {
          await supabase.patch('users', { password: hash, updated_at: new Date().toISOString() }, { id: `eq.${existing[0].id}` });
        } else {
          await supabase.insert('users', { username: targetUsername, password: hash, role: 'admin', created_at: new Date().toISOString() });
        }
        return res.json({ ok: true });
      } catch (e) {
        console.error('[admin-auth] Error upserting env-admin password:', e && e.message ? e.message : e);
        return res.status(500).json({ error: 'Failed to update admin password' });
      }
    }

    // Normal DB admin identified by UUID: verify currentPassword, then update
    const rows = await supabase.select('users', { select: 'id,username,password,role', id: `eq.${userId}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Admin user not found' });
    const me = rows[0];
    if (me.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    const match = me.password ? await bcrypt.compare(String(currentPassword), me.password) : false;
    if (!match) return res.status(401).json({ error: 'Current password incorrect' });

    const newHash = bcrypt.hashSync(String(newPassword), 10);
    await supabase.patch('users', { password: newHash, updated_at: new Date().toISOString() }, { id: `eq.${me.id}` });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[admin-auth] change-password error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
