const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { Pool } = require('pg');
const { authMiddleware, adminMiddleware } = require('../../middlewares/authMiddleware');

const router = express.Router();

// Postgres pool (same config as other controllers)
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'your_password',
});

// Ensure upload base exists
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'public', 'uploads', 'products');
fs.mkdirSync(UPLOAD_BASE, { recursive: true });

// Multer storage to save files under public/uploads/products/:productId/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = req.params.id;
    const dest = path.join(UPLOAD_BASE, String(productId));
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // sanitize extension and create unique filename
    const ext = path.extname(file.originalname).split('?')[0] || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB per file
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

router.get('/test', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Admin access granted', user: req.user });
});

// POST /api/admin/products/:id/images
// Accepts multiple files with field name 'images'
router.post('/products/:id/images', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const productId = req.params.id;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Process files: generate thumbnails and build URLs relative to server root
    const urls = [];
    for (const f of files) {
      const origPath = f.path; // local disk path
      const dir = path.dirname(origPath);
      const ext = path.extname(f.filename) || '.jpg';
      const base = path.basename(f.filename, ext);

      // Create a thumbnail (280x280, cover)
      const thumbName = `${base}-thumb${ext}`;
      const thumbPath = path.join(dir, thumbName);

      try {
        await sharp(origPath)
          .resize(280, 280, { fit: 'cover' })
          .toFile(thumbPath);
      } catch (err) {
        console.error('Sharp processing failed for', origPath, err);
        // If thumbnail creation fails, continue and use original
      }

      // Use thumbnail URL if exists, otherwise original
      const thumbExists = fs.existsSync(thumbPath);
      const url = thumbExists
        ? `/uploads/products/${productId}/${thumbName}`
        : `/uploads/products/${productId}/${f.filename}`;

      urls.push(url);
    }

    // Prepare fields pictures..pictures_4 (use up to 5 thumbs)
    const values = [null, null, null, null, null];
    for (let i = 0; i < Math.min(urls.length, 5); i++) values[i] = urls[i];

    // Update the product row with the new image URLs (overwrite existing)
    const query = `UPDATE lego_products SET pictures=$1, pictures_1=$2, pictures_2=$3, pictures_3=$4, pictures_4=$5 WHERE id=$6 RETURNING *`;
    const params = [...values, productId];
    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product: result.rows[0], images: urls });
  } catch (err) {
    console.error('Error uploading images:', err);
    return res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = router;
