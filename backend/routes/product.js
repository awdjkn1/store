const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, validateProductInput } = require('../controllers/productController');
const { Pool } = require('pg');
const pool = new Pool({
	host: process.env.PG_HOST || 'localhost',
	port: process.env.PG_PORT || 5432,
	database: process.env.PG_DATABASE || 'lego_store',
	user: process.env.PG_USER || 'postgres',
	password: process.env.PG_PASSWORD,
});

// POST /api/products - create new product with validation
router.post('/', validateProductInput, async (req, res) => {
	try {
		const { name, description, price_shipping_included, lego_pieces } = req.body;
		// Safe file path handling: never trust user input for file paths
		// Only allow image uploads via controlled endpoints (not direct path input)
		const result = await pool.query(
			`INSERT INTO lego_products (id, name, description, price_shipping_included, lego_pieces, created_at, updated_at)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
			[name, description || '', price_shipping_included, lego_pieces]
		);
		res.status(201).json({ product: result.rows[0] });
	} catch (err) {
		console.error('Error creating product:', err);
		res.status(500).json({ error: 'Failed to create product' });
	}
});

// GET /api/products
router.get('/', getAllProducts);
// GET /api/products/:id
router.get('/:id', getProductById);

module.exports = router;
