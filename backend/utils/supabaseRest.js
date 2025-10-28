const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL) {
  console.warn('SUPABASE_URL is not set. supabaseRest wrapper will not work until environment is configured.');
}

const baseURL = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1` : '';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    ...(SUPABASE_SERVICE_ROLE_KEY ? { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY } : {}),
  },
  timeout: 30_000,
});

function buildQuery(params = {}) {
  // params is an object of key -> value or special keys like select, on_conflict, limit, order
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    qs.append(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request(method, path, { params = {}, data = null, headers = {} } = {}) {
  if (!baseURL) throw new Error('SUPABASE_URL not configured');
  try {
    const q = buildQuery(params);
    const url = `${path.replace(/^\//, '')}${q}`;
    const resp = await client.request({ method, url, data, headers });
    return resp.data;
  } catch (err) {
    // Normalize error
    if (err.response) {
      const e = new Error(`Supabase REST error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      e.status = err.response.status;
      e.response = err.response;
      throw e;
    }
    throw err;
  }
}

const supabaseRest = {
  // select rows: opts can include select, limit, order, etc. Example: select('lego_products', { select: '*' })
  select: async (table, opts = {}) => {
    return await request('get', `/${table}`, { params: opts });
  },

  insert: async (table, rows, opts = {}) => {
    // opts: returning (e.g., 'minimal' or '*')
    return await request('post', `/${table}`, { params: opts, data: Array.isArray(rows) ? rows : [rows] });
  },

  upsert: async (table, rows, opts = {}) => {
    // opts: on_conflict, returning
    return await request('post', `/${table}`, { params: opts, data: Array.isArray(rows) ? rows : [rows] });
  },

  patch: async (table, data, opts = {}) => {
    // opts should include filters via query params
    return await request('patch', `/${table}`, { params: opts, data });
  },

  delete: async (table, opts = {}) => {
    return await request('delete', `/${table}`, { params: opts });
  },

  rpc: async (fnName, payload = {}) => {
    return await request('post', `/rpc/${fnName}`, { data: payload });
  },
};

module.exports = supabaseRest;
