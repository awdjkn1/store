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
    let host = process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL;
    if (!host) {
      throw new Error('SupABASE_URL or SUPABASE_HOST_DOMAIN is not configured on the server.');
    }
    // Ensure the host starts with https://
    if (!host.startsWith('http://') && !host.startsWith('https://')) {
      host = `https://${host}`;
    }
    const SUPABASE_HOST = host.replace(/\/$/, ''); // Remove any trailing slash
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
    // Load product, images and order_items so we can attempt an application-level transaction
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const product = rows[0];

    // Fetch associated images and order_items (snapshot for rollback)
    let images = [];
    let orderItems = [];
    try {
      const imgs = await supabase.select('product_images', { select: '*', product_id: `eq.${id}` });
      images = Array.isArray(imgs) ? imgs : [];
    } catch (e) {
      console.warn('[admin/products] Failed to load product_images for delete snapshot:', e && e.message ? e.message : e);
      images = [];
    }
    try {
      const items = await supabase.select('order_items', { select: '*', product_id: `eq.${id}` });
      orderItems = Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn('[admin/products] Failed to load order_items for delete snapshot:', e && e.message ? e.message : e);
      orderItems = [];
    }

    // Perform DB changes first (delete product_images, unlink order_items, delete product)
    try {
      await supabase.delete('product_images', { product_id: `eq.${id}` });
      await supabase.patch('order_items', { product_id: null }, { product_id: `eq.${id}` });
      await supabase.delete('lego_products', { id: `eq.${id}` });
    } catch (dbErr) {
      console.error('[admin/products] DB transactional delete failed:', dbErr && dbErr.message ? dbErr.message : dbErr);
      // Attempt to roll back any partial DB changes if possible
      try {
        // If product row is missing, try to re-insert it
        const reinsertPromises = [];
        if (product) {
          reinsertPromises.push(supabase.insert('lego_products', product));
        }
        if (Array.isArray(images) && images.length) {
          reinsertPromises.push(supabase.insert('product_images', images));
        }
        if (Array.isArray(orderItems) && orderItems.length) {
          // Restore product_id on order_items
          for (const oi of orderItems) {
            reinsertPromises.push(supabase.patch('order_items', { product_id: oi.product_id }, { id: `eq.${oi.id}` }));
          }
        }
        await Promise.all(reinsertPromises);
      } catch (rbErr) {
        console.error('[admin/products] DB rollback failed after transactional delete error:', rbErr && rbErr.message ? rbErr.message : rbErr);
      }
      return res.status(500).json({ error: 'Failed to delete product (DB)', details: dbErr && dbErr.message ? dbErr.message : dbErr });
    }

    // At this point DB deletions succeeded. Now try to remove storage objects.
    // If storage removal fails we'll attempt to restore the DB state (best-effort).
    let storageRemovalOk = true;
    try {
      if (images && images.length) {
        // Extract file paths from public URLs
        const filePaths = [];
        for (const img of images) {
          try {
            const urlStr = img.image_url || '';
            const parsed = new URL(urlStr);
            const m = parsed.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
            if (m && m[2]) {
              filePaths.push(decodeURIComponent(m[2]));
            }
          } catch (err) {
            // ignore parse errors
          }
        }

        if (filePaths.length > 0) {
          let supabaseClient = null;
          try { supabaseClient = require('../../utils/supabaseClient'); } catch (e) { supabaseClient = null; }

          if (supabaseClient && typeof supabaseClient.storage === 'object' && typeof supabaseClient.storage.from === 'function') {
            try {
              const { error: removeErr } = await supabaseClient.storage.from('product-images').remove(filePaths);
              if (removeErr) {
                console.warn('[admin/products] Supabase storage remove error:', removeErr.message || removeErr);
                storageRemovalOk = false;
              }
            } catch (e) {
              console.warn('[admin/products] Supabase client storage remove failed:', e && e.message ? e.message : e);
              storageRemovalOk = false;
            }
          } else {
            // Fallback: try REST delete via axios against configured SUPABASE_HOST
            const SUPABASE_HOST = (process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL || '').replace(/https?:\/\//, '').replace(/\/$/, '');
            const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
            if (SUPABASE_HOST && SUPABASE_KEY) {
              for (const p of filePaths) {
                const delUrl = `https://${SUPABASE_HOST}/storage/v1/object/product-images/${p}`;
                try {
                  await axios.delete(delUrl, { headers: { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY } });
                } catch (err) {
                  console.warn('[admin/products] Fallback delete failed for', delUrl, err && err.message ? err.message : err);
                  storageRemovalOk = false;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[admin/products] Error while attempting to delete storage objects:', err && err.message ? err.message : err);
      storageRemovalOk = false;
    }

    if (!storageRemovalOk) {
      // Storage removal failed: attempt to restore DB state from our snapshots
      try {
        const restorePromises = [];
        if (product) restorePromises.push(supabase.insert('lego_products', product));
        if (Array.isArray(images) && images.length) restorePromises.push(supabase.insert('product_images', images));
        if (Array.isArray(orderItems) && orderItems.length) {
          for (const oi of orderItems) {
            restorePromises.push(supabase.patch('order_items', { product_id: oi.product_id }, { id: `eq.${oi.id}` }));
          }
        }
        await Promise.all(restorePromises);
        console.error('[admin/products] Storage removal failed; DB state restored (best-effort).');
        return res.status(500).json({ error: 'Failed to delete storage objects; DB restored (best-effort)' });
      } catch (rbErr) {
        console.error('[admin/products] Failed to restore DB after storage removal failure:', rbErr && rbErr.message ? rbErr.message : rbErr);
        return res.status(500).json({ error: 'Failed to delete product and failed to rollback DB changes — manual intervention required' });
      }
    }

    // Success
    res.json({ message: 'Product deleted', product });
  } catch (err) {
    console.error('[admin/products] Delete error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
