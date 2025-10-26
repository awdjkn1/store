// Public route: Get images for a product by ID
router.get('/public/:id/images', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT image_url FROM product_images WHERE product_id = $1', [id]);
    res.json({ images: result.rows.map(r => r.image_url) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD ? String(process.env.PG_PASSWORD) : undefined,
});
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
    const productResult = await pool.query('SELECT name FROM lego_products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      console.error('[UPLOAD] Product not found for ID:', id);
      return res.status(404).json({ error: 'Product not found' });
    }

    const productName = productResult.rows[0].name;
    const sanitizedProductName = productName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    console.log('[UPLOAD] Using product name as folder:', sanitizedProductName);

    // Create product folder if not exists
    const productFolder = path.join(__dirname, '../../public/uploads/products', sanitizedProductName);
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
      await pool.query('INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)', [id, imageUrl]);
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
    const result = await pool.query('SELECT image_url FROM product_images WHERE product_id = $1', [id]);
    res.json({ images: result.rows.map(r => r.image_url) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete image for a product
router.delete('/:id/images/:imageId', requireAdmin, async (req, res) => {
  const { id, imageId } = req.params;
  try {
    const result = await pool.query('DELETE FROM product_images WHERE product_id = $1 AND image_url = $2 RETURNING *', [id, imageId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found' });
    // Remove file from disk
    const filePath = path.join(__dirname, '../../public', result.rows[0].image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});


// Create product
router.post('/', requireAdmin, async (req, res) => {
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
    const result = await pool.query(
      `INSERT INTO lego_products (id, name, description, price_shipping_included, lego_pieces, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [name, description || '', price_shipping_included, lego_pieces]
    );
    res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Read all products
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lego_products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
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
    const result = await pool.query(
      `UPDATE lego_products SET name=$1, description=$2, price_shipping_included=$3, lego_pieces=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name, description || '', price_shipping_included, lego_pieces, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM lego_products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
