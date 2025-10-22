const { initDatabase } = require('./initDatabase');
const { seedProducts } = require('./seedProducts');
const { sequelize } = require('../config/database');

/**
 * Complete database setup script
 * 1. Initializes database tables
 * 2. Seeds initial data from Excel spreadsheet
 */
async function setupDatabase() {
  try {
    console.log('='.repeat(60));
    console.log('PostgreSQL Database Setup for LEGO E-Commerce Store');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Initialize database
    console.log('STEP 1: Database Initialization');
    console.log('-'.repeat(60));
    const initSuccess = await initDatabase();
    if (!initSuccess) {
      throw new Error('Database initialization failed');
    }

    console.log();
    console.log('STEP 2: Seed Products Data');
    console.log('-'.repeat(60));
    await seedProducts();

    console.log();
    console.log('='.repeat(60));
    console.log('✓ Database setup completed successfully!');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Update your .env file with PostgreSQL credentials');
    console.log('2. Start your backend server');
    console.log('3. Test the API endpoints');
    console.log();

  } catch (error) {
    console.error('\n✗ Database setup failed:', error.message);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
