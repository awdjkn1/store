const express = require('express');
const router = express.Router();
const { getAllProducts } = require('../controllers/productController');

// GET /api/products
router.get('/', getAllProducts);

module.exports = router;
