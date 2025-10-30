const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseRest');
const jwt = require('jsonwebtoken');
// Do not provide an insecure default for JWT_SECRET. If it's not set we treat requests as anonymous
// and skip token verification. In production, routes depending on JWTs should ensure the secret is present.
const JWT_SECRET = process.env.JWT_SECRET || null;

// GET /api/reviews?product_id=<id>
router.get('/', async (req, res) => {
  try {
    const productId = req.query.product_id || req.query.productId || req.query.product;
    const filters = {};
    if (productId) filters.product_id = `eq.${productId}`;
    // Include user info (username) if available via FK relationship
    const select = '*,users(username)';
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
    const { product_id, rating, comment } = req.body;
    if (!product_id) return res.status(400).json({ error: 'product_id is required' });
    if (!rating || isNaN(Number(rating))) return res.status(400).json({ error: 'rating is required' });

    // Optional: check Authorization header or cookie for JWT and set user_id when present
    let userId = null;
    try {
      const authHeader = req.headers.authorization;
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
      else if (req.cookies && req.cookies.token) token = req.cookies.token;
      if (token) {
        if (!JWT_SECRET) {
          // No secret configured — cannot verify tokens. Treat as anonymous but warn in dev.
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
      rating: Number(rating),
      comment: comment || null,
      created_at: new Date().toISOString()
    };
    if (userId) payload.user_id = userId;

    await supabase.insert('reviews', payload);
    // return the latest reviews for the product including username
    const rows = await supabase.select('reviews', { select: '*,users(username)', product_id: `eq.${product_id}`, order: 'created_at.desc' });
    res.status(201).json({ reviews: rows || [] });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;
