const fs = require('fs');
const path = require('path');
const { Product, ProductImage } = require('../models');

/**
 * Seed database with LEGO products from Excel spreadsheet
 * This reads the pre-processed data from a JSON file
 */
async function seedProducts() {
  try {
    console.log('Starting product seeding...\n');

    // Sample data based on the Excel spreadsheet
    // In production, you would parse the Excel file or use a JSON export
    const productsData = [
      {
        name: 'Porsche 911 RSR',
        description: 'Porsche 911 RSR replica model with a wealth of authentic features, including a rear wing with \'swan neck\' mounts, extended rear diffuser and aerodynamic side mirrors, plus black spoked rims and realistic head and tail lights. Also includes a detailed cockpit, working differential, independent suspension and a six-cylinder boxer engine with moving pistons positioned in front of the rear axle.',
        price: 50.00,
        legoPieces: 1580,
        category: 'Technic',
        featured: true,
        inStock: true,
        stockQuantity: 10
      },
      {
        name: 'Lego Batmobile Tumbler',
        description: 'Build and display one of cinema\'s most iconic vehicles with LEGO® DC Batman™ Batmobile™ Tumbler. This armoured crime-fighting machine is a collectible piece of Batman™ memorabilia that will provide great satisfaction long after the hands-on, creative construction work is over.',
        price: 150.00,
        legoPieces: 2049,
        category: 'DC Comics',
        featured: true,
        inStock: true,
        stockQuantity: 5
      },
      {
        name: 'LEGO Titanic',
        description: 'Embark on an immersive building project with the LEGO® Titanic. This large LEGO set is a true icon for adult LEGO fans and ship enthusiasts.',
        price: 100.00,
        legoPieces: 9090,
        category: 'Icons',
        featured: true,
        inStock: true,
        stockQuantity: 3
      },
      {
        name: 'LEGO Technic 42096 Porsche 911 RSR',
        description: 'LEGO Technic Porsche 911 RSR racing car replica features realistic details and functions.',
        price: 50.00,
        legoPieces: 1580,
        category: 'Technic',
        featured: false,
        inStock: true,
        stockQuantity: 8
      },
      {
        name: 'LEGO Peugeot 9X8 24H Le Mans Hybrid Supercar',
        description: 'LEGO Technic Peugeot 9X8 hybrid supercar with authentic details and features.',
        price: 50.00,
        legoPieces: 1775,
        category: 'Technic',
        featured: false,
        inStock: true,
        stockQuantity: 7
      },
      {
        name: 'Lego Marvel 76269 Avengers Tower',
        description: 'Build the iconic Avengers Tower with this massive Marvel set featuring multiple floors and details.',
        price: 75.00,
        legoPieces: 5201,
        category: 'Marvel',
        featured: true,
        inStock: true,
        stockQuantity: 4
      },
      {
        name: 'LEGO Technic Bugatti Chiron 42083',
        description: 'Experience building the stunning LEGO® Technic™ 42083 Bugatti Chiron. This exclusive model has been developed in partnership with Bugatti Automobiles S.A.S.',
        price: 70.00,
        legoPieces: 3599,
        category: 'Technic',
        featured: true,
        inStock: true,
        stockQuantity: 6
      },
      {
        name: 'Lego Star Wars 75313 AT-AT',
        description: 'Build the ultimate LEGO® Star Wars™ AT-AT walker with this highly detailed model from The Empire Strikes Back.',
        price: 200.00,
        legoPieces: 6785,
        category: 'Star Wars',
        featured: true,
        inStock: true,
        stockQuantity: 2
      },
      {
        name: 'LEGO Set 75059 Star Wars: Sandcrawler Ultimate Collector Series',
        description: 'The LEGO Star Wars Sandcrawler is a highly detailed Ultimate Collector Series set.',
        price: 100.00,
        legoPieces: 3296,
        category: 'Star Wars',
        featured: false,
        inStock: true,
        stockQuantity: 5
      },
      {
        name: 'LEGO 42143 Ferrari Daytona SP3',
        description: 'LEGO Technic Ferrari Daytona SP3 sports car with authentic details and design.',
        price: 75.00,
        legoPieces: 3778,
        category: 'Technic',
        featured: true,
        inStock: true,
        stockQuantity: 8
      }
    ];

    console.log(`Preparing to seed ${productsData.length} products...\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of productsData) {
      // Check if product already exists
      const existing = await Product.findOne({
        where: { name: productData.name }
      });

      if (existing) {
        console.log(`⊘ Skipped: ${productData.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create the product
      const product = await Product.create(productData);
      console.log(`✓ Created: ${product.name} ($${product.price})`);
      createdCount++;
    }

    console.log(`\n✓ Seeding completed!`);
    console.log(`  - Created: ${createdCount} products`);
    console.log(`  - Skipped: ${skippedCount} products (already existed)`);
    
    return { createdCount, skippedCount };
  } catch (error) {
    console.error('✗ Product seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedProducts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedProducts };
