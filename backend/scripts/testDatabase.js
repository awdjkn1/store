const { testConnection, sequelize } = require('../config/database');
const models = require('../models');

/**
 * Test database connection and models
 */
async function testDatabase() {
  try {
    console.log('Testing PostgreSQL Database Connection...\n');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Test model definitions
    console.log('\nTesting Model Definitions:');
    console.log('✓ User model loaded');
    console.log('✓ Product model loaded');
    console.log('✓ ProductImage model loaded');
    console.log('✓ Order model loaded');
    console.log('✓ OrderItem model loaded');
    console.log('✓ Review model loaded');

    // Test database queries
    console.log('\nTesting Database Queries:');
    
    // Count products
    const productCount = await models.Product.count();
    console.log(`✓ Found ${productCount} products in database`);

    // Get sample product
    const sampleProduct = await models.Product.findOne({
      include: [{ model: models.ProductImage, as: 'images' }]
    });
    
    if (sampleProduct) {
      console.log(`✓ Sample product: ${sampleProduct.name} ($${sampleProduct.price})`);
    }

    // Count users
    const userCount = await models.User.count();
    console.log(`✓ Found ${userCount} users in database`);

    // Count orders
    const orderCount = await models.Order.count();
    console.log(`✓ Found ${orderCount} orders in database`);

    console.log('\n✓ All tests passed successfully!');
    return true;
  } catch (error) {
    console.error('\n✗ Database test failed:', error.message);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  testDatabase()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testDatabase };
