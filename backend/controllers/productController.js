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
    // attach avg rating if available
    rating: ratingsByProduct[p.id] ? ratingsByProduct[p.id].avg_rating : (p.rating || 0),
    reviewCount: ratingsByProduct[p.id] ? ratingsByProduct[p.id].review_count : (p.reviewCount || 0)
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

    // First, check if there are any reviews and compute average rating per product
    const reviewRows = await supabase.select('reviews', { select: 'product_id,rating' });
    let productIdsToFetch = [];

    if (reviewRows && reviewRows.length > 0) {
      // aggregate average rating locally
      const ratingsByProduct = {};
      reviewRows.forEach(r => {
        if (!r.product_id) return;
        if (!ratingsByProduct[r.product_id]) ratingsByProduct[r.product_id] = { sum: 0, count: 0 };
        ratingsByProduct[r.product_id].sum += Number(r.rating) || 0;
        ratingsByProduct[r.product_id].count += 1;
      });

      const avgRatings = Object.entries(ratingsByProduct).map(([product_id, v]) => ({ product_id, avg: v.sum / v.count }));
      // sort by avg desc
      avgRatings.sort((a, b) => b.avg - a.avg);
      productIdsToFetch = avgRatings.slice(0, limit).map(r => r.product_id);
    }

    let products = [];
    if (productIdsToFetch.length > 0) {
      // fetch products by ids (preserve order later)
      const rows = await supabase.select('lego_products', { select: '*', id: `in.(${productIdsToFetch.join(',')})` });
      // Map by id for ordering
      const rowsById = (rows || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
      products = productIdsToFetch.map(id => rowsById[id]).filter(Boolean);
    } else {
      // No reviews found, fallback to latest products
      products = await supabase.select('lego_products', { select: '*', order: 'updated_at.desc', limit });
    }

    // Fetch images for selected products
    const productIds = products.map(p => p.id);
    let imagesByProduct = {};
    if (productIds.length > 0) {
      const imgResult = await supabase.select('product_images', { select: 'product_id,image_url', product_id: `in.(${productIds.join(',')})` });
      (imgResult || []).forEach(row => {
        if (!imagesByProduct[row.product_id]) imagesByProduct[row.product_id] = [];
        imagesByProduct[row.product_id].push(row.image_url);
      });
    }

    const productsWithImages = products.map(p => ({
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
    res.json({ product });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

module.exports = { getAllProducts, getProductById, validateProductInput, getFeaturedProducts };
