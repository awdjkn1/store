const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin login. Credentials are configurable via env vars to avoid hardcoding secrets.
// Set either:
// - ADMIN_USERNAME and ADMIN_PASSWORD (plain string, dev only)
// OR
// - ADMIN_USERNAME and ADMIN_PASSWORD_HASH (bcrypt hash of password)
// JWT_SECRET must be set to sign admin tokens.

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || null;

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    let authenticated = false;

    // If a bcrypt hash is provided via ADMIN_PASSWORD_HASH, prefer that check
    if (ADMIN_PASSWORD_HASH) {
      if (username === ADMIN_USERNAME) {
        authenticated = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      }
    } else {
      // Fallback to plain compare for local/dev convenience
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) authenticated = true;
    }

    if (!authenticated) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: 1, username: ADMIN_USERNAME, role: 'admin' }, process.env.JWT_SECRET || 'changeme', { expiresIn: '1d' });
    res.json({ token, admin: { id: 1, username: ADMIN_USERNAME, role: 'admin' } });
  } catch (err) {
    console.error('Admin login error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
