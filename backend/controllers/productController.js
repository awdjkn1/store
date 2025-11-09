// Input validation middleware for product creation
function validateProductInput(req, res, next) {
  const { name, price_shipping_included, lego_pieces } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (isNaN(price_shipping_included) || Number(price_shipping_included) < 0) {
    return res.status(400).json({ error: 'Price must be a non-negative number.' });
  }
  if (isNaN(lego_pieces) || Number(lego_pieces) < 0) {
    return res.status(400).json({ error: 'Piece count must be a non-negative integer.' });
  }
  next();
}

module.exports.validateProductInput = validateProductInput;
async function getAllProducts(req, res) {
  try {
  console.log('GET /api/products called');
  const supabase = require('../utils/supabaseRest');
  const products = await supabase.select('lego_products', { select: '*', order: 'id.asc' });
  // Fetch images for all products
  const productIds = products.map(p => p.id);
  let imagesByProduct = {};
  if (productIds.length > 0) {
    const imgResult = await supabase.select('product_images', { select: 'product_id,image_url', product_id: `in.(${productIds.join(',')})` });
    imgResult.forEach(row => {
      if (!imagesByProduct[row.product_id]) imagesByProduct[row.product_id] = [];
      imagesByProduct[row.product_id].push(row.image_url);
    });
  }
  // Fetch avg ratings from materialized view (if present)
  let ratingsByProduct = {};
  try {
    if (productIds.length > 0) {
      const ratingRows = await supabase.select('product_avg_ratings', { select: 'product_id,avg_rating,review_count', product_id: `in.(${productIds.join(',')})` });
      (ratingRows || []).forEach(r => {
        ratingsByProduct[r.product_id] = { avg_rating: Number(r.avg_rating), review_count: Number(r.review_count) };
      });
    }
  } catch (err) {
    // If the materialized view doesn't exist or fails, ignore and continue without ratings
    console.warn('Could not fetch product average ratings:', err.message || err);
  }
  // Attach deduplicated images array to each product
  const productsWithImages = products.map(p => ({
    ...p,
    images: Array.from(new Set(imagesByProduct[p.id] || [])),
    // unified ratings object for clearer API contract (prefer materialized view when available)
    ratings: ratingsByProduct[p.id]
      ? { average: Number(ratingsByProduct[p.id].avg_rating), count: Number(ratingsByProduct[p.id].review_count) }
      : { average: Number(p.ratings?.average ?? p.rating ?? 0), count: Number(p.ratings?.count ?? p.reviewCount ?? 0) }
  }));
  console.log(`Fetched ${productsWithImages.length} products from DB`);
  res.json({ products: productsWithImages });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function getFeaturedProducts(req, res) {
  try {
    const supabase = require('../utils/supabaseRest');
    // allow optional limit param (default 3)
    const limit = req.query.limit ? Number(req.query.limit) : 3;

    // Prefer the DB-side RPC which returns a true random set of products.
    // This is faster and avoids transferring the whole table to the app.
    let chosen = null;
    try {
      const rpcResult = await supabase.rpc('get_random_products', { product_limit: limit });
      // rpcResult should be an array of rows
      if (Array.isArray(rpcResult) && rpcResult.length > 0) {
        chosen = rpcResult.slice(0, limit);
        // mark that DB returned randomized rows
        try { req._dbReturnedRandom = true; } catch (e) { /* ignore */ }
      }
    } catch (rpcErr) {
      // If RPC call fails (function missing, permission issue, etc.), fall back to previous logic
      console.warn('get_random_products RPC failed, falling back to REST selection:', rpcErr && rpcErr.message ? rpcErr.message : rpcErr);
    }

    // Fallback: if RPC didn't return rows, attempt to get featured ones and shuffle in-memory
    if (!Array.isArray(chosen) || chosen.length === 0) {
      // Try to fetch only featured products first
      let rows = [];
      try {
        rows = await supabase.select('lego_products', { select: '*', featured: 'eq.true' });
      } catch (e) {
        console.warn('Failed to fetch featured products via REST, attempting to fetch all products as fallback:', e && e.message ? e.message : e);
        rows = await supabase.select('lego_products', { select: '*' });
      }

      // Shuffle and pick the requested limit (safe for small catalogs)
      const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      };
      chosen = Array.isArray(rows) ? shuffle(rows).slice(0, limit) : [];
    }

    // Fetch images for selected products
    const productIds = chosen.map(p => p.id);
    let imagesByProduct = {};
    if (productIds.length > 0) {
      const imgResult = await supabase.select('product_images', { select: 'product_id,image_url', product_id: `in.(${productIds.join(',')})` });
      (imgResult || []).forEach(row => {
        if (!imagesByProduct[row.product_id]) imagesByProduct[row.product_id] = [];
        imagesByProduct[row.product_id].push(row.image_url);
      });
    }

    const productsWithImages = chosen.map(p => ({
      ...p,
      images: Array.from(new Set(imagesByProduct[p.id] || []))
    }));

    res.json({ products: productsWithImages });
  } catch (err) {
    console.error('Error fetching featured products:', err);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
}

async function getProductById(req, res) {
  const { id } = req.params;
  try {
    const supabase = require('../utils/supabaseRest');
    const rows = await supabase.select('lego_products', { select: '*', id: `eq.${id}` });
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Fetch images for this product
    const imgRows = await supabase.select('product_images', { select: 'image_url', product_id: `eq.${id}` });
    const product = { ...rows[0], images: Array.from(new Set((imgRows || []).map(row => row.image_url))) };
      // Attach live rating and review count by querying reviews for this product
      try {
        const reviewRows = await supabase.select('reviews', { select: 'rating', product_id: `eq.${id}` });
        if (reviewRows && reviewRows.length > 0) {
          const sum = reviewRows.reduce((s, r) => s + (Number(r.rating) || 0), 0);
          const avg = Number((sum / reviewRows.length).toFixed(2));
          const count = reviewRows.length;
          product.ratings = { average: avg, count };
        } else {
          // default to any ratings attached to the product or zero
          product.ratings = { average: Number(product.ratings?.average ?? product.rating ?? 0), count: Number(product.ratings?.count ?? product.reviewCount ?? 0) };
        }
      } catch (e) {
        // on failure, set a safe default using any existing fields
        product.ratings = { average: Number(product.ratings?.average ?? product.rating ?? 0), count: Number(product.ratings?.count ?? product.reviewCount ?? 0) };
      }

      res.json({ product });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

module.exports = { getAllProducts, getProductById, validateProductInput, getFeaturedProducts };
