const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
  database: process.env.PG_DATABASE || 'lego_store',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'Lego@store1234',
});

(async () => {
  try {
    const res = await pool.query("SELECT id, name, pictures, pictures_1 FROM lego_products WHERE pictures IS NOT NULL ORDER BY name LIMIT 50;");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(2);
  } finally {
    await pool.end();
  }
})();
