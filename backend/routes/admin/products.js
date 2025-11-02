const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
const axios = require('axios');
const { requireAdmin, requireRole } = require('../../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  dest: path.join(__dirname, '../../public/uploads/tmp'), // temp folder
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Public route: Get images for a product by ID
router.get('/public/:id/images', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await supabase.select('product_images', { select: 'image_url', product_id: `eq.${id}` });
    res.json({ images: (rows || []).map(r => r.image_url) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});



// Create product (supports JSON or multipart/form-data with images[])
router.post('/', requireAdmin, async (req, res) => {
  const { name, description, price_shipping_included, lego_pieces } = req.body;
  // Debug: log incoming body and file summary to help diagnose 500 errors during creation
  try {
    // Debug: log presence of auth header and cookie for admin create operations
    try { console.log('[admin/products] CREATE headers - auth:', !!req.headers.authorization, 'cookie.admin_token:', !!req.cookies && !!req.cookies.admin_token); } catch (e) { /* ignore */ }
    // Log only lightweight metadata to avoid huge output
    console.log('[admin/products] CREATE request body keys:', Object.keys(req.body || {}));
    if (req.files && req.files.length) {
      console.log('[admin/products] Received files:', req.files.map(f => ({ originalname: f.originalname, size: f.size, path: f.path })).slice(0, 10));
    } else {
      console.log('[admin/products] No files uploaded');
    }
  } catch (logErr) {
    console.error('[admin/products] Error while logging request metadata:', logErr);
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (isNaN(price_shipping_included) || Number(price_shipping_included) < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }
  if (isNaN(lego_pieces) || Number(lego_pieces) < 0) {
    return res.status(400).json({ error: 'Piece count must be a non-negative integer.' });
  }
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    try {
      // Ensure id_old_text is set (DB enforces NOT NULL on id_old_text in current schema)
      await supabase.insert('lego_products', { id, id_old_text: '', name, description: description || '', price_shipping_included, lego_pieces, created_at: now, updated_at: now });
    } catch (dbInsertErr) {
      console.error('[admin/products] Supabase insert error:', dbInsertErr && dbInsertErr.message ? dbInsertErr.message : dbInsertErr);
      // include response body if available (axios-style)
      if (dbInsertErr.response) console.error('[admin/products] Supabase insert response:', dbInsertErr.response.data || dbInsertErr.response);
      throw dbInsertErr; // rethrow to outer catch which will return 500
    }
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });

    // Image uploads are handled by the Supabase-only endpoint
    // POST /api/admin/products/:id/upload-image. This create route only
    // inserts product metadata into the lego_products table.

    res.status(201).json({ product: rows && rows[0] ? rows[0] : { id, name, description, price_shipping_included, lego_pieces } });
  } catch (err) {
    // Log full error for debugging
    console.error('[admin/products] Failed to create product:', err && err.stack ? err.stack : err);
    // If in development, include error details in response to help debug from the frontend quickly.
    if (process.env.NODE_ENV !== 'production') {
      const details = {};
      if (err && err.message) details.message = err.message;
      if (err && err.response) details.response = err.response.data || err.response;
      return res.status(500).json({ error: 'Failed to create product', details });
    }
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// Read all products
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await supabase.select('lego_products', { select: '*', order: 'created_at.desc' });
    if (!Array.isArray(rows)) {
      console.error('[admin/products] Supabase returned non-array:', rows);
      return res.status(500).json({ error: 'Supabase returned invalid data for products', details: rows });
    }
    res.json({ products: rows });
  } catch (err) {
    console.error('[admin/products] Error fetching products:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to fetch products', details: err && err.message ? err.message : err });
  }
});

// Auth-protected POST fetch for products (useful for admin POST-based fetches)
// Accepts optional body for future filters (page, limit, search) but currently returns all products.
router.post('/fetch', requireAdmin, async (req, res) => {
  try {
    // TODO: support pagination/filters from req.body in future
    const rows = await supabase.select('lego_products', { select: '*', order: 'created_at.desc' });
    if (!Array.isArray(rows)) {
      console.error('[admin/products.fetch] Supabase returned non-array:', rows);
      return res.status(500).json({ error: 'Supabase returned invalid data for products', details: rows });
    }
    return res.json({ products: rows });
  } catch (err) {
    console.error('[admin/products.fetch] Error fetching products:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to fetch products', details: err && err.message ? err.message : err });
  }
});

// Update product
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try { console.log('[admin/products] UPDATE headers - auth:', !!req.headers.authorization, 'cookie.admin_token:', !!req.cookies && !!req.cookies.admin_token); } catch (e) {}
  const { name, description, price_shipping_included, lego_pieces } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (isNaN(price_shipping_included) || Number(price_shipping_included) < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }
  if (isNaN(lego_pieces) || Number(lego_pieces) < 0) {
    return res.status(400).json({ error: 'Piece count must be a non-negative integer.' });
  }
  try {
    await supabase.patch('lego_products', { name, description: description || '', price_shipping_included, lego_pieces, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (also remove associated product_images rows and try to remove storage objects)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    // Fetch associated images
    let images = [];
    try {
      const imgs = await supabase.select('product_images', { select: '*', product_id: `eq.${id}` });
      images = Array.isArray(imgs) ? imgs : [];
    } catch (e) {
      console.warn('[admin/products] Failed to load product_images for delete:', e && e.message ? e.message : e);
    }

    // Attempt to delete storage objects (best-effort)
    try {
      const SUPABASE_HOST = process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL;
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
      if (SUPABASE_HOST && SUPABASE_KEY && images.length) {
        for (const img of images) {
          try {
            const url = img.image_url || '';
            // Expect URL like: https://<host>/storage/v1/object/public/<bucket>/<path>
            const m = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
            if (m) {
              const bucket = m[1];
              const objectPath = decodeURIComponent(m[2]);
              const delUrl = `https://${SUPABASE_HOST.replace(/https?:\/\//, '')}/storage/v1/object/${bucket}/${objectPath}`;
              try {
                await axios.delete(delUrl, { headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } });
              } catch (err) {
                console.warn('[admin/products] Failed to delete storage object', delUrl, err && err.message ? err.message : err);
              }
            }
          } catch (err) {
            console.warn('[admin/products] Unexpected error while deleting storage object:', err && err.message ? err.message : err);
          }
        }
      }
    } catch (err) {
      console.warn('[admin/products] Error while attempting to delete storage objects:', err && err.message ? err.message : err);
    }

    // Delete product_images rows
    try {
      await supabase.delete('product_images', { product_id: `eq.${id}` });
    } catch (e) {
      console.warn('[admin/products] Failed to delete product_images rows:', e && e.message ? e.message : e);
    }

    // Delete product row
    try {
      await supabase.delete('lego_products', { id: `eq.${id}` });
    } catch (e) {
      console.error('[admin/products] Failed to delete lego_products row:', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'Failed to delete product' });
    }

    res.json({ message: 'Product deleted', product: rows[0] });
  } catch (err) {
    console.error('[admin/products] Delete error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
