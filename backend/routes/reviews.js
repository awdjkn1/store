const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseRest');
const jwt = require('jsonwebtoken');
// socket helper to broadcast live updates to connected clients
const { getIO } = require('../utils/socket');
// Do not provide an insecure default for JWT_SECRET. If it's not set we treat requests as anonymous
// and skip token verification. In production, routes depending on JWTs should ensure the secret is present.
const JWT_SECRET = process.env.JWT_SECRET || null;

// GET /api/reviews?product_id=<id>
// Returns rating rows (no free-text comments).
router.get('/', async (req, res) => {
  try {
    const productId = req.query.product_id || req.query.productId || req.query.product;
    const filters = {};
    if (productId) filters.product_id = `eq.${productId}`;
    // Select only rating-related fields; include user info if available
    const select = 'product_id,rating,created_at,user_id,users(username)';
    const rows = await supabase.select('reviews', { select, order: 'created_at.desc', ...(Object.keys(filters).length ? filters : {}) });
    res.json({ reviews: rows || [] });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews - body: { product_id, rating, comment }
router.post('/', async (req, res) => {
  try {
    const { product_id, rating } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    if (!rating || isNaN(Number(rating))) return res.status(400).json({ error: 'rating is required and must be a number' });

    // Optional: check Authorization header or cookie for JWT and set user_id when present
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
      else if (req.cookies && req.cookies.token) token = req.cookies.token;
      if (token) {
        if (!JWT_SECRET) {
          if (process.env.NODE_ENV !== 'production') console.warn('[reviews] JWT_SECRET not set; skipping token verification (dev only)');
        } else {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) userId = decoded.id;
        }
      }
    } catch (e) {
      // ignore token errors - treat as anonymous
    }

    const payload = {
      product_id,
      rating: Math.max(1, Math.min(5, Number(rating))),
      created_at: new Date().toISOString()
    };
    if (userId) payload.user_id = userId;

    await supabase.insert('reviews', payload);
    // return the latest rating rows for the product (no textual comments)
    const rows = await supabase.select('reviews', { select: 'product_id,rating,created_at,user_id,users(username)', product_id: `eq.${product_id}`, order: 'created_at.desc' });
    res.status(201).json({ reviews: rows || [] });

    // Broadcast updated aggregate to connected clients (socket.io)
    try {
      const io = getIO();
      if (io) {
        const ratings = Array.isArray(rows) && rows.length ? rows.map(r => Number(r.rating) || 0) : [];
        const count = ratings.length;
        const avg = count ? Number((ratings.reduce((s, v) => s + v, 0) / count).toFixed(2)) : 0;
        io.emit('product:rating-updated', { productId: product_id, average: avg, count });
      }
    } catch (e) {
      // non-fatal
    }
  } catch (err) {
    console.error('Error creating review (rating):', err);
    res.status(500).json({ error: 'Failed to create rating' });
  }
});

module.exports = router;
