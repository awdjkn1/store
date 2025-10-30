const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  // Accept token from Authorization header or httpOnly cookie set by server
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.admin_token;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.role) return res.status(403).json({ error: 'Invalid token' });
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.admin || req.admin.role !== role) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
  };
}

module.exports = { requireAdmin, requireRole };
