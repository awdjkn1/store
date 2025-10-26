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
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
});

async function getAllProducts(req, res) {
  try {
  console.log('GET /api/products called');
  const result = await pool.query('SELECT * FROM lego_products ORDER BY id');
  // Fetch images for all products
  const productIds = result.rows.map(p => p.id);
  let imagesByProduct = {};
  if (productIds.length > 0) {
    const imgResult = await pool.query('SELECT product_id, image_url FROM product_images WHERE product_id = ANY($1)', [productIds]);
    imgResult.rows.forEach(row => {
      if (!imagesByProduct[row.product_id]) imagesByProduct[row.product_id] = [];
      imagesByProduct[row.product_id].push(row.image_url);
    });
  }
  // Attach deduplicated images array to each product
  const productsWithImages = result.rows.map(p => ({
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
    const result = await pool.query('SELECT * FROM lego_products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    // Fetch images for this product
    const imgResult = await pool.query('SELECT image_url FROM product_images WHERE product_id = $1', [id]);
  const product = { ...result.rows[0], images: Array.from(new Set(imgResult.rows.map(row => row.image_url))) };
    res.json({ product });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

module.exports = { getAllProducts, getProductById, validateProductInput };
