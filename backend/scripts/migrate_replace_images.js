const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'your_password',
});

async function run() {
  try {
    console.log('Starting migrate_replace_images...');

    // Replace external via.placeholder.com URLs with local placeholder
    const updateQuery = `UPDATE lego_products SET
      pictures = CASE WHEN pictures LIKE 'https://via.placeholder.com/%' OR pictures LIKE 'http://via.placeholder.com/%' THEN '/placeholder.svg' ELSE pictures END,
      pictures_1 = CASE WHEN pictures_1 LIKE 'https://via.placeholder.com/%' OR pictures_1 LIKE 'http://via.placeholder.com/%' THEN '/placeholder.svg' ELSE pictures_1 END,
      pictures_2 = CASE WHEN pictures_2 LIKE 'https://via.placeholder.com/%' OR pictures_2 LIKE 'http://via.placeholder.com/%' THEN '/placeholder.svg' ELSE pictures_2 END,
      pictures_3 = CASE WHEN pictures_3 LIKE 'https://via.placeholder.com/%' OR pictures_3 LIKE 'http://via.placeholder.com/%' THEN '/placeholder.svg' ELSE pictures_3 END,
      pictures_4 = CASE WHEN pictures_4 LIKE 'https://via.placeholder.com/%' OR pictures_4 LIKE 'http://via.placeholder.com/%' THEN '/placeholder.svg' ELSE pictures_4 END
    WHERE
      pictures LIKE 'https://via.placeholder.com/%' OR pictures LIKE 'http://via.placeholder.com/%'
      OR pictures_1 LIKE 'https://via.placeholder.com/%' OR pictures_1 LIKE 'http://via.placeholder.com/%'
      OR pictures_2 LIKE 'https://via.placeholder.com/%' OR pictures_2 LIKE 'http://via.placeholder.com/%'
      OR pictures_3 LIKE 'https://via.placeholder.com/%' OR pictures_3 LIKE 'http://via.placeholder.com/%'
      OR pictures_4 LIKE 'https://via.placeholder.com/%' OR pictures_4 LIKE 'http://via.placeholder.com/%';`;

    const res = await pool.query(updateQuery);
    console.log('Rows updated:', res.rowCount);

    // Optionally, ensure any NULL picture fields are set to placeholder
    const nullQuery = `UPDATE lego_products SET
      pictures = COALESCE(pictures, '/placeholder.svg'),
      pictures_1 = COALESCE(pictures_1, '/placeholder.svg'),
      pictures_2 = COALESCE(pictures_2, '/placeholder.svg'),
      pictures_3 = COALESCE(pictures_3, '/placeholder.svg'),
      pictures_4 = COALESCE(pictures_4, '/placeholder.svg')
    WHERE pictures IS NULL OR pictures_1 IS NULL OR pictures_2 IS NULL OR pictures_3 IS NULL OR pictures_4 IS NULL;`;

    const res2 = await pool.query(nullQuery);
    console.log('Null-fill rows affected:', res2.rowCount);

    await pool.end();
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed', err);
    await pool.end();
    process.exit(1);
  }
}

run();
