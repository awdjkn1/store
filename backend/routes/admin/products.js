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

// Helper: slugify product names to create folder names
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')      // Trim - from start of text
    .replace(/-+$/, '');     // Trim - from end of text
}

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
router.post('/', requireAdmin, upload.array('images'), async (req, res) => {
  // 1. Get text fields (this works now thanks to multer)
  const { name, description, price_shipping_included, lego_pieces } = req.body;
  const files = req.files;

  // --- Validation ---
  if (!name || !price_shipping_included) {
    return res.status(400).json({ message: 'Name and price are required.' });
  }

  let newProduct = null;
  const uploadedObjects = []; // track uploaded object paths for rollback

  try {
    // --- Step A: Create the Product in Supabase DB ---
    const id = uuidv4();
    const now = new Date().toISOString();

    await supabase.insert('lego_products', {
      id,
      id_old_text: '',
      name,
      description: description || '',
      price_shipping_included: parseFloat(price_shipping_included),
      lego_pieces: parseInt(lego_pieces, 10) || 0,
      created_at: now,
      updated_at: now
    });

    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    newProduct = rows[0];

    // --- Step B: Create the Storage Folder if missing ---
    const SUPABASE_HOST = (process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL).replace(/\/$/, '');
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BUCKET_NAME = 'product-images';

    const folderName = slugify(name);
    const placeholderFilePath = `${folderName}/.placeholder`;
    const placeholderUrl = `${SUPABASE_HOST}/storage/v1/object/${BUCKET_NAME}/${placeholderFilePath}`;

    // Check if placeholder already exists to avoid unnecessary writes
    let placeholderExists = false;
    try {
      await axios.head(placeholderUrl, { headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } });
      placeholderExists = true;
    } catch (e) {
      // If 404, placeholder does not exist; any other error we will attempt to create
      if (e.response && e.response.status === 404) placeholderExists = false;
      else {
        // Non-404 errors: log and continue to attempt creation
        console.warn('[admin/products] Placeholder HEAD check warning:', e && e.message ? e.message : e);
      }
    }

    if (!placeholderExists) {
      // upload a tiny placeholder to create the folder prefix
      await axios.post(placeholderUrl, '', {
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'text/plain',
          'apikey': SUPABASE_KEY
        }
      });
      uploadedObjects.push(placeholderFilePath);
    }

    // --- Step C: Upload Images to the New Folder ---
    if (files && files.length > 0) {
      const imageRecords = [];
      for (const file of files) {
        const fileName = `${uuidv4()}-${file.originalname}`;
        const filePath = `${folderName}/${fileName}`; // Path inside the new folder
        const uploadUrl = `${SUPABASE_HOST}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

        await axios.post(uploadUrl, file.buffer, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': file.mimetype,
            'apikey': SUPABASE_KEY
          }
        });

        uploadedObjects.push(filePath);

        const publicUrl = `${SUPABASE_HOST}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
        imageRecords.push({ product_id: newProduct.id, image_url: publicUrl });
      }

      if (imageRecords.length > 0) {
        try {
          await supabase.insert('product_images', imageRecords);
        } catch (e) {
          // If DB insert fails, we should rollback uploadedObjects
          throw e;
        }
      }
    }

    // --- Step D: Return the Final Product ---
    return res.status(201).json({ product: newProduct });

  } catch (err) {
    console.error('[admin/products] Failed to create product (attempting rollback):', err && err.message ? err.message : err);
    // Attempt rollback of uploaded objects and DB product row
    try {
      const SUPABASE_HOST = (process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL).replace(/\/$/, '');
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const BUCKET_NAME = 'product-images';

      // Delete any uploaded objects
      for (const objPath of uploadedObjects) {
        try {
          const delUrl = `${SUPABASE_HOST}/storage/v1/object/${BUCKET_NAME}/${objPath}`;
          await axios.delete(delUrl, { headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } });
        } catch (e) {
          console.warn('[admin/products] Rollback: failed to delete storage object', objPath, e && e.message ? e.message : e);
        }
      }

      // Delete any product_images rows for this product (best-effort)
      if (newProduct && newProduct.id) {
        try { await supabase.delete('product_images', { product_id: `eq.${newProduct.id}` }); } catch (e) { /* ignore */ }
      }

      // Delete the created product row
      try { await supabase.delete('lego_products', { id: `eq.${newProduct ? newProduct.id : ''}` }); } catch (e) { /* ignore */ }
    } catch (rbErr) {
      console.error('[admin/products] Rollback failed:', rbErr && rbErr.message ? rbErr.message : rbErr);
    }

    // Surface the original error
    if (err && err.response && err.response.data) console.error('[admin/products] Axios error response:', err.response.data);
    return res.status(500).json({ error: 'Failed to create product', details: err && err.message ? err.message : err });
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
