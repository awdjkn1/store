const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
// axios and FormData are required above; avoid redeclaring them
const supabase = require('../../utils/supabaseRest');
const { requireAdmin } = require('../../middlewares/authMiddleware');

const router = express.Router();
// Mount auth and other sub-routes. The products sub-router is mounted AFTER
// the Supabase-backed upload route below so the central upload handler
// takes precedence for POST /products/:id/images.
router.use('/auth', require('./auth'));
router.use('/orders', require('./orders'));
router.use('/users', require('./users'));
router.use('/reporting', require('./reporting'));
router.use('/logs', require('./logs'));

// Postgres pool removed in favor of using supabaseRest for DB operations.

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

// Helper: slugify product names to create folder names
function slugify(text) {
  if (!text) return 'unknown-product';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')      // Trim - from start of text
    .replace(/-+$/, '');     // Trim - from end of text
}

// Helper: return supabase storage connection info
function getSupabaseStorage() {
  let host = process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL;
  if (!host) {
    throw new Error('SupABASE_URL or SUPABASE_HOST_DOMAIN is not configured on the server.');
  }
  // Ensure the host starts with https://
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `https://${host}`;
  }
  const SUPABASE_HOST = host.replace(/\/$/, ''); // Remove any trailing slash
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  const BUCKET_NAME = process.env.BUCKET || 'product-images';
  if (!SUPABASE_KEY) {
    throw new Error('Supabase Storage (SUPABASE_SERVICE_ROLE_KEY) is not configured.');
  }
  return { SUPABASE_HOST, SUPABASE_KEY, BUCKET_NAME };
}

// Helper: ensure a folder exists by uploading a small placeholder object
async function ensureFolderExists(folderName) {
  const { SUPABASE_HOST, SUPABASE_KEY, BUCKET_NAME } = getSupabaseStorage();
  const placeholderPath = `${folderName}/.placeholder`;
  const placeholderHostPath = `${SUPABASE_HOST.replace(/https?:\/\//, '')}/storage/v1/object/${BUCKET_NAME}/${placeholderPath}`;
  const placeholderUrl = `${SUPABASE_HOST}/storage/v1/object/${BUCKET_NAME}/${placeholderPath}`;

  // Build headers once for consistent logging
  const headers = { Authorization: `Bearer ${SUPABASE_KEY}`, apikey: SUPABASE_KEY };

  console.log('[admin/index] ensureFolderExists: folder=', folderName, 'placeholderHostPath=', placeholderHostPath, 'placeholderUrl=', placeholderUrl);

  try {
    // Try HEAD first to check existence
    const headResp = await axios.head(placeholderUrl, { headers });
    console.log('[admin/index] ensureFolderExists: HEAD response status=', headResp && headResp.status);
    return; // exists
  } catch (e) {
    // Verbose error logging for troubleshooting
    if (e && e.response) {
      console.warn('[admin/index] ensureFolderExists: HEAD failed with status=', e.response.status, 'data=', e.response.data);
    } else {
      console.warn('[admin/index] ensureFolderExists: HEAD failed (no response) -', e && e.message ? e.message : e);
    }

    // If 404 -> create placeholder. Otherwise attempt create and surface errors.
    try {
      const postResp = await axios.post(placeholderUrl, '', { headers: { ...headers, 'Content-Type': 'text/plain' } });
      console.log('[admin/index] ensureFolderExists: POST placeholder status=', postResp && postResp.status);
      return;
    } catch (postErr) {
      if (postErr && postErr.response) {
        console.error('[admin/index] ensureFolderExists: POST failed status=', postErr.response.status, 'data=', postErr.response.data);
      } else {
        console.error('[admin/index] ensureFolderExists: POST failed (no response) -', postErr && postErr.message ? postErr.message : postErr);
      }
      // rethrow so callers can respond accordingly
      throw postErr;
    }
  }
}

const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

router.get('/test', requireAdmin, (req, res) => {
  res.json({ message: 'Admin access granted', admin: req.admin });
});

// Health/test endpoint: attempt to HEAD/POST a placeholder for a given folder.
// Accepts JSON { folder: 'folder-name' } or query ?folder=name
router.post('/storage/test-folder', requireAdmin, async (req, res) => {
  const folder = (req.body && req.body.folder) || req.query.folder;
  if (!folder) return res.status(400).json({ error: 'Missing folder parameter' });

  try {
    await ensureFolderExists(folder);
    return res.json({ ok: true, folder });
  } catch (err) {
    // Provide as much error detail as reasonable without exposing secrets
    const details = err && err.response && err.response.data ? err.response.data : (err && err.message ? err.message : String(err));
    console.error('[admin/index] storage/test-folder failed for', folder, 'error=', details);
    return res.status(500).json({ ok: false, folder, error: 'Failed to ensure folder exists', details });
  }
});

// Optionally register the Supabase-backed upload route. If Supabase credentials
// are not configured, do NOT register the route so the legacy local-disk handler
// in `admin/products.js` can handle uploads instead.
// Normalize host/env values: SUPABASE_URL may contain a full URL (https://...),
// while some deploys set SUPABASE_HOST_DOMAIN to a bare host (e.g. ahjtxhsyy...).
// Derive a storage base URL we can use for bucket create and object uploads.
const rawHostEnv = process.env.SUPABASE_HOST_DOMAIN || process.env.SUPABASE_URL || '';
let SUPABASE_HOST = rawHostEnv || '';
try {
  if (SUPABASE_HOST && SUPABASE_HOST.startsWith('http')) {
    SUPABASE_HOST = new URL(SUPABASE_HOST).host; // extract hostname from full URL
  } else {
    SUPABASE_HOST = SUPABASE_HOST.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
} catch (e) {
  SUPABASE_HOST = SUPABASE_HOST.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
// Prefer an explicit storage URL if set, otherwise build from host/URL
const ORIGIN = (process.env.SUPABASE_URL || `https://${SUPABASE_HOST}`).replace(/\/$/, '');
const STORAGE_BASE = (process.env.SUPABASE_STORAGE_URL || process.env.STORAGE_BASE_URL || `${ORIGIN}/storage/v1`).replace(/\/$/, '');
// The system now uses Supabase-only for product image storage. Register
// a single upload endpoint that accepts multipart `images` files and
// uploads them to Supabase Storage, then inserts rows into product_images.
router.post('/products/:id/upload-image', requireAdmin, upload.array('images', 10), async (req, res) => {
  if (!SUPABASE_HOST || !SUPABASE_KEY) {
    console.error('[admin/index] Supabase credentials missing - cannot upload images');
    return res.status(500).json({ error: 'Supabase not configured on server. Contact administrator.' });
  }
  // Accept request
  try {
    const productId = req.params.id;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const host = SUPABASE_HOST;
    const svcKey = SUPABASE_KEY;
    const bucket = process.env.BUCKET || 'product-images';

  // Do NOT attempt to create the bucket here. Assume the bucket already exists
  // (it's public) and only upload objects to it. Use STORAGE_BASE/ORIGIN which
  // were normalized earlier to build correct endpoints.
  const storageUrl = `${STORAGE_BASE}/object/${bucket}/`;
  const restUrl = `${ORIGIN}/rest/v1/product_images`;

    const uploadedUrls = [];

    // Determine folder name from product name (folders are created per product name slug)
    let folderName = productId; // fallback to id
    try {
      const pRows = await supabase.select('lego_products', { select: 'name', id: `eq.${productId}` });
      if (Array.isArray(pRows) && pRows.length) folderName = slugify(pRows[0].name || productId);
    } catch (e) {
      console.warn('[admin/index] Could not resolve product name for folder; using productId as folder', e && e.message ? e.message : e);
    }

    // Ensure folder exists before uploading
    try {
      await ensureFolderExists(folderName);
    } catch (e) {
      console.error('[admin/index] Failed to ensure product folder exists:', e && e.message ? e.message : e);
      return res.status(500).json({ error: 'Failed to prepare product folder' });
    }

    for (const f of files) {
      try {
        const originalBuffer = f.buffer;
        const origExt = (f.originalname && path.extname(f.originalname)) || '.jpg';
        const baseName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
        const fileName = `${baseName}${origExt}`;
  const destPath = `${folderName}/${fileName}`;

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

  const publicUrl = `${ORIGIN}/storage/v1/object/public/${bucket}/${destPath}`;

        // Upload thumbnail if present
        let thumbPublicUrl = null;
        if (thumbBuffer) {
          const thumbName = `${baseName}-thumb${origExt}`;
          const thumbPath = `${folderName}/${thumbName}`;
          const formT = new FormData();
          formT.append('file', thumbBuffer, { filename: thumbName, contentType: f.mimetype });
          const paramsT = { cacheControl: '3600', upsert: 'true', name: thumbPath };
          try {
            const respT = await axios.post(storageUrl, formT, { headers: { ...formT.getHeaders(), apikey: svcKey, Authorization: `Bearer ${svcKey}` }, params: paramsT, maxContentLength: Infinity, maxBodyLength: Infinity, timeout: 120000 });
            if (respT && respT.status >= 200 && respT.status < 300) {
              thumbPublicUrl = `${ORIGIN}/storage/v1/object/public/${bucket}/${thumbPath}`;
            }
          } catch (err) {
            console.warn('Thumbnail upload failed', err && err.message);
          }
        }

        // Insert into product_images table via supabase REST wrapper
        try {
          await supabase.insert('product_images', { product_id: productId, image_url: publicUrl, created_at: new Date().toISOString() });
        } catch (err) {
          console.error('Failed to insert into product_images via supabaseRest', err && err.message ? err.message : err);
        }

        // Build URL used for product pictures (prefer thumbnail if available)
        const pictureUrl = thumbPublicUrl || publicUrl;
        uploadedUrls.push(pictureUrl);
      } catch (err) {
        console.error('Error handling file upload', err && err.message);
      }
    }

    // We do NOT touch legacy lego_products.pictures_* fields. product_images
    // is the canonical mapping between products and URLs.
    if (uploadedUrls.length) {
      return res.json({ images: uploadedUrls });
    }
    return res.status(500).json({ error: 'No images were uploaded' });
  } catch (err) {
    console.error('Error uploading images to Supabase:', err);
    return res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Mount products sub-router at the end so its routes do not shadow the
// Supabase-backed upload endpoint defined above. This ensures POST
// /api/admin/products/:id/images goes to the central upload handler.
router.use('/products', require('./products'));

module.exports = router;
