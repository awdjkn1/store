const { verifyJWT } = require('../middlewares/auth');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { getAllProducts, getProductById, validateProductInput, getFeaturedProducts } = require('../controllers/productController');
const supabase = require('../utils/supabaseRest');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// List all images for a product by folder name (not DB)
// Return images for a product by product name, using Supabase product_images table.
router.get('/:productName/images/all', async (req, res) => {
	const productName = req.params.productName;
	try {
		const rows = await supabase.select('lego_products', { select: 'id', name: `eq.${productName}` });
		if (!rows || rows.length === 0) return res.status(404).json({ error: 'Product not found' });
		const productId = rows[0].id;
		const imgRows = await supabase.select('product_images', { select: 'image_url', product_id: `eq.${productId}` });
		const images = (imgRows || []).map(r => r.image_url);
		return res.json({ images });
	} catch (err) {
		console.error('Error fetching product images from DB:', err && err.message ? err.message : err);
		return res.status(500).json({ error: 'Failed to fetch product images' });
	}
});

// POST /api/products - create new product with validation
router.post('/', validateProductInput, async (req, res) => {
	try {
		const { name, description, price_shipping_included, lego_pieces } = req.body;
		// Safe file path handling: never trust user input for file paths
		// Only allow image uploads via controlled endpoints (not direct path input)
		const newId = uuidv4();
		const now = new Date().toISOString();
		const payload = {
			id: newId,
			name,
			description: description || '',
			price_shipping_included,
			lego_pieces,
			created_at: now,
			updated_at: now,
		};
		await supabase.insert('lego_products', payload);
		// Fetch the inserted row back
		const rows = await supabase.select('lego_products', { select: '*', id: `eq.${newId}` });
		res.status(201).json({ product: rows && rows[0] ? rows[0] : payload });
	} catch (err) {
		console.error('Error creating product:', err);
		res.status(500).json({ error: 'Failed to create product' });
	}
});

// GET /api/products
router.get('/', getAllProducts);
// GET /api/products/featured
router.get('/featured', getFeaturedProducts);
// GET /api/products/:id
router.get('/:id', getProductById);

module.exports = router;
