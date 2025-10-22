const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts
} = require('../controllers/productsController');

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

// Protected routes (require authentication)
// Note: Add authentication middleware when needed
// router.post('/', verifyJWT, verifyAdmin, createProduct);
// router.put('/:id', verifyJWT, verifyAdmin, updateProduct);
// router.delete('/:id', verifyJWT, verifyAdmin, deleteProduct);

module.exports = router;
