const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseRest');
const axios = require('axios');
const FormData = require('form-data');
const { requireAdmin } = require('../../middlewares/authMiddleware');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Use memory storage for uploads (we stream buffers to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  }
});

function resolveStorageUrl(host, bucket) {
  const storageEnv = process.env.SUPABASE_STORAGE_URL || process.env.STORAGE_BASE_URL || '';
  if (storageEnv) {
    const s = storageEnv.replace(/\/+$/, '');
    if (s.includes('/storage/v1')) return s + `/object/${bucket}/`;
    return s + `/storage/v1/object/${bucket}/`;
  }
  return `https://${host}/storage/v1/object/${bucket}/`;
}

// Conditional multer middleware: run multer only for multipart/form-data requests
function conditionalMulter(req, res, next) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.includes('multipart/form-data')) {
    return upload.array('images', 10)(req, res, next);
  }
  return next();
}

// Create product (supports JSON-only or single-step multipart with images)
// --- THIS IS THE CORRECTED "CREATE PRODUCT" ROUTE ---
// It now uses upload.array('images') to handle the form data
router.post('/', requireAdmin, upload.array('images'), async (req, res) => {
  // 1. Get text fields from req.body (thanks to multer)
  const { name, description, price_shipping_included, lego_pieces } = req.body;
  const files = req.files;

  // --- Validation ---
  if (!name || !price_shipping_included) {
    return res.status(400).json({ message: 'Name and price are required.' });
  }

  let newProduct = null;

  try {
    // --- Step A: Create the Product in Supabase DB (using your supabaseRest) ---
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Use your existing supabase.insert wrapper
    await supabase.insert('lego_products', { 
      id, 
      id_old_text: '', // Set default for NOT NULL constraint
      name, 
      description: description || '', 
      price_shipping_included: parseFloat(price_shipping_included), 
      lego_pieces: parseInt(lego_pieces, 10) || 0,
      created_at: now, 
      updated_at: now 
    });

    // Re-fetch the product to get the full object
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    newProduct = rows[0];

    // --- Step B: Upload Images to Supabase Storage (using axios) ---
    if (files && files.length > 0) {
      const SUPABASE_HOST = (process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL).replace(/\/$/, '');
      const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const BUCKET_NAME = process.env.BUCKET || 'product-images'; // Make sure this matches your bucket name

      if (!SUPABASE_HOST || !SUPABASE_KEY) {
        throw new Error('Supabase Storage is not configured on the server.');
      }
      
      const imageRecords = []; // To store the new DB records

      for (const file of files) {
        const fileName = `${uuidv4()}-${file.originalname}`;
        const uploadUrl = `${SUPABASE_HOST}/storage/v1/object/${BUCKET_NAME}/${fileName}`;

        // Upload the file buffer using axios, just like your DELETE route
        await axios.post(uploadUrl, file.buffer, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': file.mimetype,
            'apikey': SUPABASE_KEY // Your DELETE route includes this
          }
        });

        // Manually construct the public URL
        const publicUrl = `${SUPABASE_HOST}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
        
        imageRecords.push({
          product_id: newProduct.id,
          image_url: publicUrl,
        });
      }

      // 3. Save image URLs to the 'product_images' table
      if (imageRecords.length > 0) {
        await supabase.insert('product_images', imageRecords);
      }
    }

    // --- Step C: Return the Final Product ---
    res.status(201).json({ product: newProduct });

  } catch (err) {
    console.error('[admin/products] Failed to create product:', err.message, err.stack);
    // Log Supabase storage errors
    if (err.response && err.response.data) {
      console.error("Axios Error (Supabase Storage):", err.response.data);
    }
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
});

// --- STEP 2: Upload images for an existing product
router.post('/:id/upload-image', requireAdmin, upload.array('images', 10), async (req, res) => {
  const { id } = req.params;
  const files = req.files || [];

  if (!files.length) return res.status(400).json({ error: 'No images uploaded' });

  const SUPABASE_HOST = process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  const bucket = process.env.BUCKET || 'product-images';

  if (!SUPABASE_HOST || !SUPABASE_KEY) {
    console.error('[admin/products] Supabase storage credentials missing');
    return res.status(500).json({ error: 'Supabase storage not configured' });
  }

  const storageUrl = resolveStorageUrl(SUPABASE_HOST, bucket);
  const uploadedUrls = [];

  for (const f of files) {
    try {
      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const ext = f.originalname ? (f.originalname.match(/\.[0-9a-z]+$/i) || ['.jpg'])[0] : '.jpg';
      const fileName = `${baseName}${ext}`;
      const destPath = `${id}/${fileName}`;

      // Optionally create a thumbnail (best-effort)
      let thumbBuffer = null;
      try {
        thumbBuffer = await sharp(f.buffer).resize(280, 280, { fit: 'cover' }).toBuffer();
      } catch (e) {
        // If sharp is not available or fails, continue with original only
        thumbBuffer = null;
      }

      // Upload original
      const form = new FormData();
      form.append('file', f.buffer, { filename: fileName, contentType: f.mimetype });
      const params = { cacheControl: '3600', upsert: 'true', name: destPath };
      const uploadResp = await axios.post(storageUrl, form, { headers: { ...form.getHeaders(), apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, params, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
      if (!uploadResp || (uploadResp.status < 200 || uploadResp.status >= 300)) {
        console.warn('[admin/products] upload failed for', f.originalname, uploadResp && uploadResp.status);
        continue;
      }

      const publicUrl = `https://${SUPABASE_HOST.replace(/https?:\/\//, '')}/storage/v1/object/public/${bucket}/${destPath}`;

      // Upload thumbnail if present
      let thumbPublicUrl = null;
      if (thumbBuffer) {
        const thumbName = `${baseName}-thumb${ext}`;
        const thumbPath = `${id}/${thumbName}`;
        const formT = new FormData();
        formT.append('file', thumbBuffer, { filename: thumbName, contentType: f.mimetype });
        const paramsT = { cacheControl: '3600', upsert: 'true', name: thumbPath };
        try {
          const respT = await axios.post(storageUrl, formT, { headers: { ...formT.getHeaders(), apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, params: paramsT, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
          if (respT && respT.status >= 200 && respT.status < 300) {
            thumbPublicUrl = `https://${SUPABASE_HOST.replace(/https?:\/\//, '')}/storage/v1/object/public/${bucket}/${thumbPath}`;
          }
        } catch (err) {
          console.warn('[admin/products] Thumbnail upload failed', err && err.message ? err.message : err);
        }
      }

      // Persist image record
      try {
        await supabase.insert('product_images', { product_id: id, image_url: thumbPublicUrl || publicUrl, created_at: new Date().toISOString() });
      } catch (err) {
        console.error('[admin/products] Failed to insert product_images row:', err && err.message ? err.message : err);
      }

      uploadedUrls.push(thumbPublicUrl || publicUrl);
    } catch (err) {
      console.error('[admin/products] Error handling file upload:', err && err.message ? err.message : err);
    }
  }

  if (uploadedUrls.length) return res.status(201).json({ images: uploadedUrls });
  return res.status(500).json({ error: 'No images were uploaded' });
});

// Update product (data only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price_shipping_included, lego_pieces } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (isNaN(price_shipping_included) || Number(price_shipping_included) < 0) return res.status(400).json({ error: 'Price must be a non-negative number' });
  if (isNaN(lego_pieces) || Number(lego_pieces) < 0) return res.status(400).json({ error: 'Piece count must be a non-negative integer' });

  try {
    await supabase.patch('lego_products', { name, description: description || '', price_shipping_included, lego_pieces, updated_at: new Date().toISOString() }, { id: `eq.${id}` });
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product: rows[0] });
  } catch (err) {
    console.error('[admin/products] update error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (simplified)
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

    return res.json({ message: 'Product deleted', product: rows[0] });
  } catch (err) {
    console.error('[admin/products] Delete error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Read all admin products
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await supabase.select('lego_products', { select: '*', order: 'created_at.desc' });
    if (!Array.isArray(rows)) {
      console.error('[admin/products] Supabase returned non-array:', rows);
      return res.status(500).json({ error: 'Supabase returned invalid data for products', details: rows });
    }
    return res.json({ products: rows });
  } catch (err) {
    console.error('[admin/products] Error fetching products:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to fetch products', details: err && err.message ? err.message : err });
  }
});

// Public route: Get images for a product by ID
router.get('/public/:id/images', async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await supabase.select('product_images', { select: 'image_url', product_id: `eq.${id}` });
    return res.json({ images: (rows || []).map(r => r.image_url) });
  } catch (err) {
    console.error('[admin/products] public images error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Failed to fetch images' });
  }
});

module.exports = router;
