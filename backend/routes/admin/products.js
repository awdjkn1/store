const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
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

// Upload image for a product
router.post('/:id/images', requireAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  console.log('[UPLOAD] Received request to upload image for Product ID:', id);

  if (!req.file) {
    console.error('[UPLOAD] No image file received');
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Fetch product name from database
    const productRows = await supabase.select('lego_products', { select: 'name', id: `eq.${id}` });
    if (!productRows || productRows.length === 0) {
      console.error('[UPLOAD] Product not found for ID:', id);
      return res.status(404).json({ error: 'Product not found' });
    }

    const productName = productRows[0].name;
  const sanitizedProductName = productName;
    console.log('[UPLOAD] Using product name as folder:', sanitizedProductName);

    // Create product folder if not exists
  const productFolder = path.join(__dirname, '../../../public/uploads/products', sanitizedProductName);
    if (!fs.existsSync(productFolder)) {
      fs.mkdirSync(productFolder, { recursive: true });
      console.log(`[UPLOAD] Created folder: ${productFolder}`);
    }

    // Generate unique filename
    const ext = path.extname(req.file.originalname) || '.png';
    const fname = uuidv4() + ext;
    const destPath = path.join(productFolder, fname);
    console.log('[UPLOAD] Saving image to:', destPath);

    try {
      fs.renameSync(req.file.path, destPath);
      console.log('[UPLOAD] File moved successfully to:', destPath);
    } catch (moveErr) {
      console.error('[UPLOAD] Error moving file:', moveErr);
      return res.status(500).json({ error: 'Failed to move image file', details: moveErr.message });
    }

    const imageUrl = `/uploads/products/${sanitizedProductName}/${fname}`;
    console.log('[UPLOAD] Image URL to be saved in DB:', imageUrl);

    try {
      // Do not include created_at/updated_at for product_images
      await supabase.insert('product_images', { product_id: id, image_url: imageUrl });
      console.log('[UPLOAD] Image URL saved to database successfully');
    } catch (dbErr) {
      console.error('[UPLOAD] DB insert error:', dbErr);
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      return res.status(500).json({ error: 'Failed to save image to database', details: dbErr.message });
    }

    res.status(201).json({ image: imageUrl });
  } catch (err) {
    console.error('[UPLOAD] Unexpected error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to save image', details: err.message });
  }
});

// List images for a product
router.get('/:id/images', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await supabase.select('product_images', { select: 'image_url', product_id: `eq.${id}` });
    res.json({ images: (rows || []).map(r => r.image_url) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete image for a product
router.delete('/:id/images/:imageId', requireAdmin, async (req, res) => {
  const { id, imageId } = req.params;
  try {
    const rows = await supabase.select('product_images', { select: '*', product_id: `eq.${id}`, image_url: `eq.${imageId}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Image not found' });
    await supabase.delete('product_images', { product_id: `eq.${id}`, image_url: `eq.${imageId}` });
    // Remove file from disk
    const filePath = path.join(__dirname, '../../public', rows[0].image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});


// Helper middleware: only run multer when request is multipart
const maybeUpload = (req, res, next) => {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.startsWith('multipart/form-data')) {
    return upload.array('images')(req, res, next);
  }
  return next();
};

// Create product (supports JSON or multipart/form-data with images[])
router.post('/', requireAdmin, maybeUpload, async (req, res) => {
  const { name, description, price_shipping_included, lego_pieces } = req.body;
  // Debug: log incoming body and file summary to help diagnose 500 errors during creation
  try {
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

    // If files were uploaded (via multer) attach them to product_images
    if (req.files && req.files.length) {
      try {
        // Create folder by product name
        const productName = name;
        const sanitizedProductName = productName;
        const productFolder = path.join(__dirname, '../../../public/uploads/products', sanitizedProductName);
        if (!fs.existsSync(productFolder)) fs.mkdirSync(productFolder, { recursive: true });

        for (const f of req.files) {
          const ext = path.extname(f.originalname) || '.png';
          const fname = uuidv4() + ext;
          const destPath = path.join(productFolder, fname);
          try {
            fs.renameSync(f.path, destPath);
          } catch (moveErr) {
            console.error('[UPLOAD] Error moving file:', moveErr);
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
            continue; // skip this file
          }
          const imageUrl = `/uploads/products/${sanitizedProductName}/${fname}`;
          try {
            await supabase.insert('product_images', { product_id: id, image_url: imageUrl });
          } catch (dbErr) {
            console.error('[UPLOAD] DB insert error for combined upload:', dbErr);
            if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
          }
        }
      } catch (fileErr) {
        console.error('[UPLOAD] Error processing uploaded files:', fileErr);
      }
    }

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

// Delete product
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    await supabase.delete('lego_products', { id: `eq.${id}` });
    res.json({ message: 'Product deleted', product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
