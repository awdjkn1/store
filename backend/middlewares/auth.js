const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// If a cookie-backed token is about to expire within this many seconds, refresh it.
const REFRESH_THRESHOLD_SECONDS = Number(process.env.JWT_REFRESH_THRESHOLD_SECONDS || 24 * 60 * 60); // 24h

exports.verifyJWT = (req, res, next) => {
  // Accept either Authorization: Bearer <token> or HttpOnly cookie named 'token'
  const authHeader = req.headers.authorization;
  let token = null;
  let tokenSource = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
    tokenSource = 'header';
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    tokenSource = 'cookie';
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // If token came from cookie, refresh it transparently when it's close to expiry.
    try {
      if (tokenSource === 'cookie' && decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - now;
        if (ttl > 0 && ttl < REFRESH_THRESHOLD_SECONDS) {
          // Re-issue a new token with same payload (excluding iat/exp) and set cookie
          const payload = Object.assign({}, decoded);
          // remove standard JWT claims if present
          delete payload.iat;
          delete payload.exp;
          delete payload.nbf;
          const freshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            maxAge: (() => {
              // parse expires like '7d' into milliseconds when possible; fallback to 7 days
              if (typeof JWT_EXPIRES === 'string' && JWT_EXPIRES.endsWith('d')) {
                const days = Number(JWT_EXPIRES.slice(0, -1)) || 7;
                return days * 24 * 60 * 60 * 1000;
              }
              return 7 * 24 * 60 * 60 * 1000;
            })()
          };
          res.cookie('token', freshToken, cookieOptions);
        }
      }
    } catch (refreshErr) {
      // Non-fatal: if refresh logic fails, proceed with original decoded user
      console.warn('JWT refresh attempt failed', refreshErr && refreshErr.message);
    }

    return next();
  } catch (err) {
    // Distinguish expired tokens from other invalid tokens to help client behavior
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'TokenExpired', error: 'token expired' });
    }
    return res.status(401).json({ message: 'Invalid token', error: err && err.message });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
