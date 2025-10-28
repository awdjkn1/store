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
  // Attach deduplicated images array to each product
  const productsWithImages = products.map(p => ({
    ...p,
    images: Array.from(new Set(imagesByProduct[p.id] || []))
  }));
  console.log(`Fetched ${productsWithImages.length} products from DB`);
  res.json({ products: productsWithImages });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
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

module.exports = { getAllProducts, getProductById, validateProductInput };
