const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL_RAW = process.env.SUPABASE_URL || process.env.SUPABASE_HOST_DOMAIN || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

let SUPABASE_URL = SUPABASE_URL_RAW;
if (SUPABASE_URL && !SUPABASE_URL.startsWith('http')) {
  SUPABASE_URL = `https://${SUPABASE_URL}`;
}
SUPABASE_URL = SUPABASE_URL.replace(/\/$/, '');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[supabaseClient] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Storage operations will fail until configured.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

module.exports = supabase;
