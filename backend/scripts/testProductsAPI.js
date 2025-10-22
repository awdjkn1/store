const app = require('../app');
const http = require('http');
const axios = require('axios');

const PORT = 5001; // Use different port for testing

/**
 * Test the products API endpoints
 */
async function testProductsAPI() {
  const server = http.createServer(app);
  
  try {
    // Start the server
    await new Promise((resolve) => {
      server.listen(PORT, () => {
        console.log(`Test server started on port ${PORT}`);
        resolve();
      });
    });

    const baseURL = `http://localhost:${PORT}/api/products`;

    console.log('\n=== Testing Products API ===\n');

    // Test 1: Get all products
    console.log('Test 1: GET /api/products (Get all products)');
    const res1 = await axios.get(baseURL);
    console.log(`✓ Status: ${res1.status}`);
    console.log(`✓ Found ${res1.data.data.length} products`);
    console.log(`✓ Total in database: ${res1.data.pagination.total}`);

    // Test 2: Get a specific product
    if (res1.data.data.length > 0) {
      const productId = res1.data.data[0].id;
      console.log(`\nTest 2: GET /api/products/${productId} (Get single product)`);
      const res2 = await axios.get(`${baseURL}/${productId}`);
      console.log(`✓ Status: ${res2.status}`);
      console.log(`✓ Product name: ${res2.data.data.name}`);
      console.log(`✓ Product price: $${res2.data.data.price}`);
    }

    // Test 3: Search products
    console.log('\nTest 3: GET /api/products/search?q=porsche (Search products)');
    const res3 = await axios.get(`${baseURL}/search?q=porsche`);
    console.log(`✓ Status: ${res3.status}`);
    console.log(`✓ Found ${res3.data.count} matching products`);
    if (res3.data.data.length > 0) {
      console.log(`✓ First result: ${res3.data.data[0].name}`);
    }

    // Test 4: Filter by category
    console.log('\nTest 4: GET /api/products?category=Technic (Filter by category)');
    const res4 = await axios.get(`${baseURL}?category=Technic`);
    console.log(`✓ Status: ${res4.status}`);
    console.log(`✓ Found ${res4.data.data.length} Technic products`);

    // Test 5: Get featured products
    console.log('\nTest 5: GET /api/products?featured=true (Get featured products)');
    const res5 = await axios.get(`${baseURL}?featured=true`);
    console.log(`✓ Status: ${res5.status}`);
    console.log(`✓ Found ${res5.data.data.length} featured products`);

    console.log('\n✓ All API tests passed successfully!\n');

  } catch (error) {
    console.error('\n✗ API test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    throw error;
  } finally {
    // Close the server
    server.close();
    console.log('Test server closed');
  }
}

// Run if called directly
if (require.main === module) {
  testProductsAPI()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testProductsAPI };
