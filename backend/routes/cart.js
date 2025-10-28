const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middlewares/auth');
const supabase = require('../utils/supabaseRest');

// Helper: return cart items for a user joined with product data
async function getCartItemsForUser(userId) {
	// Use PostgREST to fetch cart_items, then products and images separately.
	const cartItems = await supabase.select('cart_items', { select: '*', user_id: `eq.${userId}`, order: 'created_at.desc' });
	const productIds = cartItems.map(ci => ci.product_id).filter(Boolean);
	let products = [];
	let images = [];
	if (productIds.length > 0) {
		products = await supabase.select('lego_products', { select: '*', id: `in.(${productIds.join(',')})` });
		images = await supabase.select('product_images', { select: 'product_id,image_url', product_id: `in.(${productIds.join(',')})` });
	}
	const firstImageByProduct = {};
	images.forEach(r => { if (!firstImageByProduct[r.product_id]) firstImageByProduct[r.product_id] = r.image_url; });

	return cartItems.map(ci => {
		const prod = products.find(p => p.id === ci.product_id) || {};
		return {
			id: ci.id,
			product_id: ci.product_id,
			name: prod.name,
			description: prod.description,
			price_shipping_included: prod.price_shipping_included,
			image: firstImageByProduct[ci.product_id] || null,
			quantity: ci.quantity,
		};
	});
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
		const existing = await supabase.select('cart_items', { select: '*', user_id: `eq.${userId}`, product_id: `eq.${product_id}`, limit: '1' });

		if (existing && existing.length > 0) {
			const newQty = existing[0].quantity + qty;
			await supabase.patch('cart_items', { quantity: newQty, updated_at: new Date().toISOString() }, { id: `eq.${existing[0].id}` });
		} else {
			await supabase.insert('cart_items', { user_id: userId, product_id, quantity: qty, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
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
	try {
		const userId = req.user.id;
		const items = Array.isArray(req.body.items) ? req.body.items : [];

		// NOTE: This loop is NOT executed inside a DB transaction when using PostgREST.
		// If atomicity is required, create a DB-side RPC function and call it via /rpc.
		for (const it of items) {
			const product_id = it.product_id;
			const qty = Number(it.quantity) || 1;
			if (!product_id) continue;

			const existing = await supabase.select('cart_items', { select: '*', user_id: `eq.${userId}`, product_id: `eq.${product_id}`, limit: '1' });
			if (existing && existing.length > 0) {
				const newQty = existing[0].quantity + qty;
				await supabase.patch('cart_items', { quantity: newQty, updated_at: new Date().toISOString() }, { id: `eq.${existing[0].id}` });
			} else {
				await supabase.insert('cart_items', { user_id: userId, product_id, quantity: qty, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
			}
		}

		const updated = await getCartItemsForUser(userId);
		res.status(200).json({ cart: updated });
	} catch (err) {
		console.error('Error merging cart items:', err);
		res.status(500).json({ error: 'Failed to merge cart items' });
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
