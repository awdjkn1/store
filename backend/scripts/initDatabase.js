const { sequelize, testConnection } = require('../config/database');
const models = require('../models');

/**
 * Initialize the PostgreSQL database
 * Creates all tables and their relationships
 */
async function initDatabase() {
  try {
    console.log('Starting database initialization...\n');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Sync all models with database
    // force: false means it won't drop existing tables
    // alter: true means it will update existing tables to match models
    console.log('\nSynchronizing models with database...');
    await sequelize.sync({ alter: true });
    
    console.log('✓ All models have been synchronized successfully.\n');
    
    // Display created tables
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Created tables:');
    results.forEach(row => console.log(`  - ${row.table_name}`));
    
    console.log('\n✓ Database initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { initDatabase };
