const { verifyJWT } = require('../middlewares/auth');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { getAllProducts, getProductById, validateProductInput, getFeaturedProducts } = require('../controllers/productController');
const supabase = require('../utils/supabaseRest');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// List all images for a product by folder name (not DB)
router.get('/:productName/images/all', async (req, res) => {
	const productName = req.params.productName;
	const folderPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'products', productName);
	fs.readdir(folderPath, (err, files) => {
		if (err) return res.status(404).json({ error: 'Product images not found' });
		const exts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
		const imageFiles = files.filter(f => exts.includes(path.extname(f).toLowerCase()));
		const urls = imageFiles.map(f => `/uploads/products/${encodeURIComponent(productName)}/${f}`);
		res.json({ images: urls });
	});
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
