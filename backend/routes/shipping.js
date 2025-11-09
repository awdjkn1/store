const express = require('express');
const router = express.Router();
const { getShippingOptions } = require('../controllers/shippingController');

// GET /api/shipping
router.get('/', getShippingOptions);

module.exports = router;
const express = require('express');
const router = express.Router();

// Simple shipping endpoint returning a free shipping option
// GET /api/shipping
router.get('/', (req, res) => {
  res.json({
    options: [
      { name: 'Standard Shipping', cost: 0, description: 'Free' }
    ]
  });
});

module.exports = router;
