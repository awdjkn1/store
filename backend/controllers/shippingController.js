const logger = console;

// GET /api/shipping
async function getShippingOptions(req, res) {
  // Simple, deterministic free shipping option for the storefront.
  // Keep response shape compatible with a potential multi-option response later.
  try {
    logger.log('[shipping] GET /api/shipping requested from', req.ip || (req.connection && req.connection.remoteAddress));
    const option = {
      name: 'Standard Shipping',
      cost: 0,
      description: 'Free'
    };
    res.json({ shipping: [option] });
  } catch (err) {
    logger.error('Error building shipping options:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to fetch shipping options' });
  }
}

module.exports = { getShippingOptions };
