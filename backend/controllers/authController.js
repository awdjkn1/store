const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabaseRest');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES = '7d';

exports.register = async (req, res) => {
  console.log('Register request body:', req.body && { username: req.body.username, email: req.body.email });
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    // Check if user exists
    const existing = await supabase.select('users', { select: 'id', or: `(email.eq.${email},username.eq.${username})` });
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email or username already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    await supabase.insert('users', { username, email, password: hash, role: role || 'user', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const rows = await supabase.select('users', { select: 'id,username,email,role', email: `eq.${email}` });
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
    const rows = await supabase.select('users', { select: 'id,username,email,password,role', email: `eq.${email}` });
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
