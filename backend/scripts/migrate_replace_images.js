const supabase = require('../utils/supabaseRest');
require('dotenv').config();

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

  // Update any columns that contain via.placeholder.com to local placeholder
  await supabase.patch('lego_products', { pictures: '/placeholder.svg', pictures_1: '/placeholder.svg', pictures_2: '/placeholder.svg', pictures_3: '/placeholder.svg', pictures_4: '/placeholder.svg' }, { or: `(pictures.like.*via.placeholder.com*,pictures_1.like.*via.placeholder.com*,pictures_2.like.*via.placeholder.com*,pictures_3.like.*via.placeholder.com*,pictures_4.like.*via.placeholder.com*)` });
  console.log('Placeholder URL replacement attempted via PostgREST');

    // Optionally, ensure any NULL picture fields are set to placeholder
    const nullQuery = `UPDATE lego_products SET
      pictures = COALESCE(pictures, '/placeholder.svg'),
      pictures_1 = COALESCE(pictures_1, '/placeholder.svg'),
      pictures_2 = COALESCE(pictures_2, '/placeholder.svg'),
      pictures_3 = COALESCE(pictures_3, '/placeholder.svg'),
      pictures_4 = COALESCE(pictures_4, '/placeholder.svg')
    WHERE pictures IS NULL OR pictures_1 IS NULL OR pictures_2 IS NULL OR pictures_3 IS NULL OR pictures_4 IS NULL;`;

  await supabase.patch('lego_products', { pictures: '/placeholder.svg', pictures_1: '/placeholder.svg', pictures_2: '/placeholder.svg', pictures_3: '/placeholder.svg', pictures_4: '/placeholder.svg' }, { or: `(pictures.is.null,pictures_1.is.null,pictures_2.is.null,pictures_3.is.null,pictures_4.is.null)` });
  console.log('Null-fill attempted via PostgREST');

  console.log('Migration complete (non-transactional; check rows in DB)');
  } catch (err) {
    console.error('Migration failed', err);
    await pool.end();
    process.exit(1);
  }
}

run();
