const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const { Pool } = require('pg');
const { requireAdmin } = require('../../middlewares/authMiddleware');

const router = express.Router();
// Mount auth and other sub-routes. The products sub-router is mounted AFTER
// the Supabase-backed upload route below so the central upload handler
// takes precedence for POST /products/:id/images.
router.use('/auth', require('./auth'));
router.use('/orders', require('./orders'));
router.use('/users', require('./users'));
router.use('/reporting', require('./reporting'));

// Postgres pool (same config as other controllers)
const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
});

// We'll upload directly to Supabase Storage using the service_role key
// so switch to memory storage (we stream buffers to Supabase).
const upload = multer({
  storage: multer.memoryStorage(),
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

// Helper: resolve storage upload endpoint similar to migration script
function resolveStorageUrl(host, bucket) {
  const storageEnv = process.env.SUPABASE_STORAGE_URL || process.env.STORAGE_BASE_URL || '';
  if (storageEnv) {
    const s = storageEnv.replace(/\/+$/, '');
    if (s.includes('/storage/v1')) return s + `/object/${bucket}/`;
    return s + `/storage/v1/object/${bucket}/`;
  }
  return `https://${host}/storage/v1/object/${bucket}/`;
}

const axios = require('axios');
const FormData = require('form-data');

router.get('/test', requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted', admin: req.admin });
});

// Optionally register the Supabase-backed upload route. If Supabase credentials
// are not configured, do NOT register the route so the legacy local-disk handler
// in `admin/products.js` can handle uploads instead.
const SUPABASE_HOST = process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SUPABASE_HOST && SUPABASE_KEY) {
  // POST /api/admin/products/:id/images
  // Accepts multiple files with field name 'images'
  router.post('/products/:id/images', requireAdmin, upload.array('images', 5), async (req, res) => {
    try {
      const productId = req.params.id;
      const files = req.files || [];

      if (!files.length) {
        return res.status(400).json({ error: 'No images uploaded' });
      }

      const host = SUPABASE_HOST;
      const svcKey = SUPABASE_KEY;
      const bucket = process.env.BUCKET || 'product-images';

    // Ensure bucket exists (admin call)
    const bucketsUrl = `https://${host}/storage/v1/bucket`;
    try {
      const createResp = await axios.post(bucketsUrl, { name: bucket, public: true }, { headers: { apikey: svcKey, Authorization: `Bearer ${svcKey}`, 'Content-Type': 'application/json' }, timeout: 30000 });
      if (createResp.status === 201 || createResp.status === 200) {
        console.log('Created bucket', bucket);
      }
    } catch (e) {
      if (e.response && e.response.status === 409) {
        console.log('Bucket already exists:', bucket);
      } else {
        console.warn('Bucket create may have failed or already exists:', e && e.message ? e.message : e);
      }
    }

    const storageUrl = resolveStorageUrl(host, bucket);
    const restUrl = `https://${host}/rest/v1/product_images`;

    const uploadedUrls = [];

    for (const f of files) {
      try {
        const originalBuffer = f.buffer;
        const origExt = (f.originalname && path.extname(f.originalname)) || '.jpg';
        const baseName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const fileName = `${baseName}${origExt}`;
        const destPath = `${productId}/${fileName}`;

        // create thumbnail buffer (280x280 cover)
        let thumbBuffer = null;
        try {
          thumbBuffer = await sharp(originalBuffer).resize(280, 280, { fit: 'cover' }).toBuffer();
        } catch (err) {
          console.warn('Thumbnail creation failed, continuing with original only', err && err.message);
        }

        // Upload original
        const form = new FormData();
        form.append('file', originalBuffer, { filename: fileName, contentType: f.mimetype });
        const params = { cacheControl: '3600', upsert: 'true', name: destPath };
        const uploadResp = await axios.post(storageUrl, form, { headers: { ...form.getHeaders(), apikey: svcKey, Authorization: `Bearer ${svcKey}` }, params, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
        if (!uploadResp || (uploadResp.status < 200 || uploadResp.status >= 300)) {
          console.warn('Upload failed for', f.originalname, uploadResp && uploadResp.status);
          continue;
        }

        const publicUrl = `https://${host}/storage/v1/object/public/${bucket}/${destPath}`;

        // Upload thumbnail if present
        let thumbPublicUrl = null;
        if (thumbBuffer) {
          const thumbName = `${baseName}-thumb${origExt}`;
          const thumbPath = `${productId}/${thumbName}`;
          const formT = new FormData();
          formT.append('file', thumbBuffer, { filename: thumbName, contentType: f.mimetype });
          const paramsT = { cacheControl: '3600', upsert: 'true', name: thumbPath };
          try {
            const respT = await axios.post(storageUrl, formT, { headers: { ...formT.getHeaders(), apikey: svcKey, Authorization: `Bearer ${svcKey}` }, params: paramsT, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
            if (respT && respT.status >= 200 && respT.status < 300) {
              thumbPublicUrl = `https://${host}/storage/v1/object/public/${bucket}/${thumbPath}`;
            }
          } catch (err) {
            console.warn('Thumbnail upload failed', err && err.message);
          }
        }

        // Insert into product_images table
        try {
          await pool.query('INSERT INTO product_images(product_id, image_url) VALUES($1, $2)', [productId, publicUrl]);
        } catch (err) {
          console.error('Failed to insert into product_images', err && err.message);
        }

        // Build URL used for product pictures (prefer thumbnail if available)
        const pictureUrl = thumbPublicUrl || publicUrl;
        uploadedUrls.push(pictureUrl);
      } catch (err) {
        console.error('Error handling file upload', err && err.message);
      }
    }

  // Update product row pictures..pictures_4 (preserve existing fields if present?)
    if (uploadedUrls.length) {
      const values = [null, null, null, null, null];
      for (let i = 0; i < Math.min(uploadedUrls.length, 5); i++) values[i] = uploadedUrls[i];
      const query = `UPDATE lego_products SET pictures=$1, pictures_1=$2, pictures_2=$3, pictures_3=$4, pictures_4=$5 WHERE id=$6 RETURNING *`;
      const params = [...values, productId];
      const result = await pool.query(query, params);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.json({ product: result.rows[0], images: uploadedUrls });
    }
      return res.status(500).json({ error: 'No images were uploaded' });
    } catch (err) {
      console.error('Error uploading images to Supabase:', err);
      return res.status(500).json({ error: 'Failed to upload images' });
    }
  });
} else {
  console.warn('[admin/index] Supabase upload route not registered: SUPABASE_HOST or SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to legacy local uploads.');
}

// Mount products sub-router at the end so its routes do not shadow the
// Supabase-backed upload endpoint defined above. This ensures POST
// /api/admin/products/:id/images goes to the central upload handler.
router.use('/products', require('./products'));

module.exports = router;
