const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// admin auth does not require direct DB access here

// Admin login with JWT and bcrypt
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    // Single hardcoded admin user
    if (username !== 'admin' || password !== 'admin1234') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // You can hash and compare if you want, but for demo, plain check is enough
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, admin: { id: 1, username: 'admin', role: 'admin' } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
