const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseRest');
const { encryptText, hmacHex } = require('../utils/cryptoUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES = '7d';

exports.register = async (req, res) => {
  console.log('Register request body:', req.body && { username: req.body.username, email: req.body.email });
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    // Check if user exists. Prefer searching by email_hash if DB supports it for privacy.
    const emailHash = hmacHex(String(email).toLowerCase());
    let existing = null;
    try {
      const hasEmailHash = await supabase.checkColumnExists('users', 'email_hash');
      if (hasEmailHash && emailHash) {
        existing = await supabase.select('users', { select: 'id', or: `(email_hash.eq.${emailHash},username.eq.${username})` });
      } else {
        existing = await supabase.select('users', { select: 'id', or: `(email.eq.${email},username.eq.${username})` });
      }
    } catch (e) {
      // fallback
      existing = await supabase.select('users', { select: 'id', or: `(email.eq.${email},username.eq.${username})` });
    }
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email or username already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    // Prepare insert payload and include encrypted/email_hash if table supports it
    const payload = { username, email, password: hash, role: role || 'user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    try {
      const hasEmailEncrypted = await supabase.checkColumnExists('users', 'email_encrypted');
      const hasEmailHash = await supabase.checkColumnExists('users', 'email_hash');
      if (hasEmailEncrypted) payload.email_encrypted = encryptText(email);
      if (hasEmailHash && emailHash) payload.email_hash = emailHash;
    } catch (e) {
      // ignore - optional columns
    }

    await supabase.insert('users', payload);
    // Fetch the created user row (prefer lookup by hash if available)
    let rows;
    try {
      const hasEmailHash2 = await supabase.checkColumnExists('users', 'email_hash');
      if (hasEmailHash2 && emailHash) rows = await supabase.select('users', { select: 'id,username,email,role', email_hash: `eq.${emailHash}` });
      else rows = await supabase.select('users', { select: 'id,username,email,role', email: `eq.${email}` });
    } catch (e) {
      rows = await supabase.select('users', { select: 'id,username,email,role', email: `eq.${email}` });
    }
    const user = rows && rows[0] ? rows[0] : null;
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    // Set an HttpOnly cookie for the JWT so the client doesn't need to store it in localStorage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    res.cookie('token', token, cookieOptions);

    // Return user info (do not expose password/hash). Also include a small note flag that cookie is set.
    return res.status(201).json({ user, cookie: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Support privacy-preserving lookup by email_hash when available
    const emailHash = hmacHex(String(email).toLowerCase());
    let rows;
    try {
      const hasEmailHash = await supabase.checkColumnExists('users', 'email_hash');
      if (hasEmailHash && emailHash) rows = await supabase.select('users', { select: 'id,username,email,password,role', email_hash: `eq.${emailHash}` });
      else rows = await supabase.select('users', { select: 'id,username,email,password,role', email: `eq.${email}` });
    } catch (e) {
      rows = await supabase.select('users', { select: 'id,username,email,password,role', email: `eq.${email}` });
    }
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    res.cookie('token', token, cookieOptions);

    // Return minimal user profile; token is set in cookie so client JS cannot read it.
    res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role }, cookie: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
