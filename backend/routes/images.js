const express = require('express');
const router = express.Router();
const axios = require('axios');
const sharp = require('sharp');

// Simple thumbnail proxy: GET /api/images/thumbnail?url=<encoded_url>&w=400&h=280
// Security: only allow hosts specified in ALLOWED_IMAGE_HOSTS or SUPABASE_URL host
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || '';
const ALLOWED_IMAGE_HOSTS = (process.env.ALLOWED_IMAGE_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);

function isAllowedHost(u) {
  try {
    const parsed = new URL(u);
    const host = parsed.host;
    if (!host) return false;
    if (SUPABASE_URL && host && SUPABASE_URL.includes(host)) return true;
    if (ALLOWED_IMAGE_HOSTS.includes(host)) return true;
    // allow localhost for development
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return true;
    return false;
  } catch (e) {
    return false;
  }
}

router.get('/thumbnail', async (req, res) => {
  try {
    const { url, w = 400, h = 280, format = 'jpeg' } = req.query;
    if (!url) return res.status(400).send('url is required');
    const decoded = decodeURIComponent(String(url));
    if (!isAllowedHost(decoded)) return res.status(400).send('Image host not allowed');

    // Fetch the image
    const resp = await axios.get(decoded, { responseType: 'arraybuffer', timeout: 15000 });
    const input = Buffer.from(resp.data);

    // Resize using sharp
    const width = Number(w) || 400;
    const height = Number(h) || 280;
    const outBuffer = await sharp(input).resize(width, height, { fit: 'cover' }).toFormat(format === 'png' ? 'png' : 'jpeg', { quality: 80 }).toBuffer();

    res.set('Cache-Control', 'public, max-age=86400');
    res.type(format === 'png' ? 'image/png' : 'image/jpeg');
    res.send(outBuffer);
  } catch (err) {
    console.error('Error generating thumbnail:', err && err.message ? err.message : err);
    res.status(500).send('Failed to generate thumbnail');
  }
});

module.exports = router;
