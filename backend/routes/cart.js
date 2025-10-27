const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyJWT } = require('../middlewares/auth');

const pool = new Pool({
	host: process.env.PG_HOST || 'localhost',
	port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
	database: process.env.PG_DATABASE || 'lego_store',
	user: process.env.PG_USER || 'postgres',
	password: process.env.PG_PASSWORD ? String(process.env.PG_PASSWORD) : undefined,
});

// Helper: return cart items for a user joined with product data
async function getCartItemsForUser(userId) {
	const q = `
		SELECT ci.id as cart_item_id, ci.quantity,
				 p.id as product_id, p.name, p.description, p.price_shipping_included,
				 (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) as image
		FROM cart_items ci
		JOIN lego_products p ON p.id = ci.product_id
		WHERE ci.user_id = $1
		ORDER BY ci.created_at DESC
	`;
	const result = await pool.query(q, [userId]);
	 return result.rows.map(r => ({
	 id: r.cart_item_id,
	 product_id: r.product_id,
	 name: r.name,
	 description: r.description,
	 price_shipping_included: r.price_shipping_included,
	 image: r.image,
	 quantity: r.quantity,
	 }));
}

// GET /api/cart - list current user's cart items
router.get('/cart', verifyJWT, async (req, res) => {
	try {
		const userId = req.user.id;
		const items = await getCartItemsForUser(userId);
		res.json({ cart: items });
	} catch (err) {
		console.error('Error fetching cart items:', err);
		res.status(500).json({ error: 'Failed to fetch cart items' });
	}
});

// POST /api/cart - add a product to cart (or increment quantity)
router.post('/cart', verifyJWT, async (req, res) => {
	try {
		const userId = req.user.id;
		const { product_id, quantity } = req.body;
		const qty = Number(quantity) || 1;
		if (!product_id) return res.status(400).json({ error: 'product_id is required' });

		// Check existing item
		const existing = await pool.query(
			`SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 LIMIT 1`,
			[userId, product_id]
		);

		if (existing.rows.length > 0) {
			const newQty = existing.rows[0].quantity + qty;
			await pool.query(
				`UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`,
				[newQty, existing.rows[0].id]
			);
		} else {
			await pool.query(
				`INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
				 VALUES ($1, $2, $3, NOW(), NOW())`,
				[userId, product_id, qty]
			);
		}

		const items = await getCartItemsForUser(userId);
		res.status(201).json({ cart: items });
	} catch (err) {
		console.error('Error adding to cart:', err);
		res.status(500).json({ error: 'Failed to add to cart' });
	}
});

// POST /api/cart/merge - merge an array of items into the user's cart in one request
// body: { items: [{ product_id, quantity }] }
router.post('/cart/merge', verifyJWT, async (req, res) => {
	const client = await pool.connect();
	try {
		const userId = req.user.id;
		const items = Array.isArray(req.body.items) ? req.body.items : [];

		await client.query('BEGIN');

		for (const it of items) {
			const product_id = it.product_id;
			const qty = Number(it.quantity) || 1;
			if (!product_id) continue;

			const existing = await client.query(`SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2 LIMIT 1`, [userId, product_id]);
			if (existing.rows.length > 0) {
				const newQty = existing.rows[0].quantity + qty;
				await client.query(`UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`, [newQty, existing.rows[0].id]);
			} else {
				await client.query(`INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`, [userId, product_id, qty]);
			}
		}

		await client.query('COMMIT');
		const updated = await getCartItemsForUser(userId);
		res.status(200).json({ cart: updated });
	} catch (err) {
		await client.query('ROLLBACK').catch(() => {});
		console.error('Error merging cart items:', err);
		res.status(500).json({ error: 'Failed to merge cart items' });
	} finally {
		client.release();
	}
});

// PUT /api/cart/:id - update quantity for a cart item
router.put('/cart/:id', verifyJWT, async (req, res) => {
	try {
		const userId = req.user.id;
		const cartItemId = req.params.id;
		const { quantity } = req.body;
		const qty = Number(quantity);
		if (isNaN(qty)) return res.status(400).json({ error: 'quantity must be a number' });

		// Ensure the item belongs to the user
		const existing = await pool.query(`SELECT * FROM cart_items WHERE id = $1 AND user_id = $2`, [cartItemId, userId]);
		if (existing.rows.length === 0) return res.status(404).json({ error: 'Cart item not found' });

		if (qty <= 0) {
			await pool.query(`DELETE FROM cart_items WHERE id = $1`, [cartItemId]);
		} else {
			await pool.query(`UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2`, [qty, cartItemId]);
		}

		const items = await getCartItemsForUser(userId);
		res.json({ cart: items });
	} catch (err) {
		console.error('Error updating cart item:', err);
		res.status(500).json({ error: 'Failed to update cart item' });
	}
});

// DELETE /api/cart/:id - remove a single cart item
router.delete('/cart/:id', verifyJWT, async (req, res) => {
	try {
		const userId = req.user.id;
		const cartItemId = req.params.id;
		await pool.query(`DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, [cartItemId, userId]);
		const items = await getCartItemsForUser(userId);
		res.json({ cart: items });
	} catch (err) {
		console.error('Error deleting cart item:', err);
		res.status(500).json({ error: 'Failed to delete cart item' });
	}
});

// DELETE /api/cart - clear entire cart for user
router.delete('/cart', verifyJWT, async (req, res) => {
	try {
		const userId = req.user.id;
		await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
		res.json({ cart: [] });
	} catch (err) {
		console.error('Error clearing cart:', err);
		res.status(500).json({ error: 'Failed to clear cart' });
	}
});

module.exports = router;
