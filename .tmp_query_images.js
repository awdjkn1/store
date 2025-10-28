const supabase = require('./backend/utils/supabaseRest');

(async () => {
  try {
    const rows = await supabase.select('lego_products', { select: 'id,name,pictures,pictures_1', 'pictures': 'not.is.null', order: 'name.asc', limit: '50' });
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(2);
  }
})();
