const express = require('express');
const router = express.Router();
const { getShippingOptions } = require('../controllers/shippingController');

// GET /api/shipping
router.get('/', getShippingOptions);

module.exports = router;
