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

// Strict schema enforcement: a whitelist of allowed columns per table.
// This is derived from the project's SQL schema (see src/api/database_schema.sql).
// When SUPABASE_STRICT_SCHEMA is 'true' (default) any unknown column in payloads
// will cause an error. Set to 'false' to only warn and filter unknown keys.
const STRICT_SCHEMA = process.env.SUPABASE_STRICT_SCHEMA !== 'false';

const TABLE_COLUMNS = {
  lego_products: new Set(['id', 'id_old_text', 'name', 'description', 'price_shipping_included', 'lego_pieces', 'created_at', 'updated_at']),
  product_images: new Set(['id', 'product_id', 'product_id_old_text', 'image_url', 'created_at', 'updated_at']),
  users: new Set(['id', 'username', 'email', 'password', 'role', 'created_at', 'updated_at', 'name', 'password_hash']),
  orders: new Set(['id', 'user_id', 'product_id_old_text', 'quantity', 'status', 'shipping_address', 'total_price', 'created_at', 'updated_at', 'product_id']),
  order_items: new Set(['id', 'order_id', 'product_id_old_text', 'quantity', 'price_each', 'subtotal', 'product_id']),
  cart_items: new Set(['id', 'cart_id', 'product_id_old_text', 'quantity', 'added_at', 'price_snapshot', 'product_id', 'user_id', 'created_at', 'updated_at']),
  invoices: new Set(['id', 'invoice_number', 'order_id', 'user_id', 'amount', 'currency', 'payment_provider', 'payment_transaction_id', 'status', 'content', 'created_at', 'updated_at']),
  payments: new Set(['id', 'order_id', 'provider', 'transaction_id', 'status', 'amount', 'created_at']),
  product_id_map: new Set(['old_id', 'new_id']),
  reviews: new Set(['id', 'user_id', 'product_id_old_text', 'rating', 'comment', 'created_at', 'product_id']),
  carts: new Set(['id', 'user_id', 'status', 'created_at', 'updated_at']),
  invoices: new Set(['id', 'invoice_number', 'order_id', 'user_id', 'amount', 'currency', 'payment_provider', 'payment_transaction_id', 'status', 'content', 'created_at', 'updated_at']),
};

// Columns that should not be set by clients (generated or computed by DB)
const READONLY_COLUMNS = {
  order_items: new Set(['subtotal']),
};

function validatePayloadKeys(table, rows, op = 'insert') {
  if (!rows) return rows;
  const tableCols = TABLE_COLUMNS[table];
  // If we don't know this table, be conservative: warn and allow through
  if (!tableCols) return rows;

  const items = Array.isArray(rows) ? rows : [rows];
  const cleaned = items.map(item => {
    const obj = {};
    const unknown = [];
    for (const k of Object.keys(item)) {
      if (tableCols.has(k)) obj[k] = item[k];
      else unknown.push(k);
    }
    if (unknown.length) {
      const msg = `[supabaseRest] ${op.toUpperCase()} to '${table}' contains unknown columns: ${unknown.join(', ')}`;
      if (STRICT_SCHEMA) {
        const e = new Error(msg);
        e.code = 'UNKNOWN_COLUMNS';
        throw e;
      } else {
        console.warn(msg, '— filtering unknown keys.');
      }
    }

    // Disallow writes to readonly/generated columns
    const ro = READONLY_COLUMNS[table];
    if (ro) {
      const setRO = [...ro].filter(c => Object.prototype.hasOwnProperty.call(item, c));
      if (setRO.length) {
        const msg = `[supabaseRest] Attempt to set read-only/generated columns on '${table}': ${setRO.join(', ')}`;
        if (STRICT_SCHEMA) {
          const e = new Error(msg);
          e.code = 'READONLY_COLUMNS';
          throw e;
        } else {
          console.warn(msg, '— removing those keys.');
          for (const k of setRO) delete obj[k];
        }
      }
    }

    return obj;
  });

  return Array.isArray(rows) ? cleaned : cleaned[0];
}

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
    // Debug: log the outgoing supabase REST URL for easier troubleshooting
    console.log('[supabaseRest] Request:', method.toUpperCase(), url);
    // Debug: log outgoing payload when present (keep it safe for unserializable objects)
    if (data !== null && data !== undefined) {
      try {
        console.log('[supabaseRest] Request DATA:', JSON.stringify(data));
      } catch (serr) {
        console.log('[supabaseRest] Request DATA: <unserializable payload>');
      }
    }
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
    const payload = validatePayloadKeys(table, rows, 'insert');
    return await request('post', `/${table}`, { params: opts, data: Array.isArray(payload) ? payload : [payload] });
  },

  upsert: async (table, rows, opts = {}) => {
    // opts: on_conflict, returning
    const payload = validatePayloadKeys(table, rows, 'upsert');
    return await request('post', `/${table}`, { params: opts, data: Array.isArray(payload) ? payload : [payload] });
  },

  patch: async (table, data, opts = {}) => {
    // opts should include filters via query params
    const payload = validatePayloadKeys(table, data, 'patch');
    return await request('patch', `/${table}`, { params: opts, data: payload });
  },

  delete: async (table, opts = {}) => {
    return await request('delete', `/${table}`, { params: opts });
  },

  rpc: async (fnName, payload = {}) => {
    return await request('post', `/rpc/${fnName}`, { data: payload });
  },
  // helper: check whether our TABLE_COLUMNS whitelist knows about a column for a table
  hasColumn: (table, col) => {
    const set = TABLE_COLUMNS[table];
    return !!(set && set.has(col));
  }
};

// runtime probe cache for actual DB-backed columns (avoid repeated failures)
const _columnExistenceCache = new Map();

// Asynchronously check whether the PostgREST schema exposes a column for a table.
// Returns a boolean and caches the result for future calls. This performs a
// lightweight GET with `select=<col>&limit=0` and treats a 400/4xx about unknown
// column as 'not present'. Use this when TABLE_COLUMNS may be out-of-sync with DB.
supabaseRest.checkColumnExists = async (table, col) => {
  const cacheKey = `${table}::${col}`;
  if (_columnExistenceCache.has(cacheKey)) return _columnExistenceCache.get(cacheKey);
  try {
    // Query zero rows selecting only the column; PostgREST will error if column missing
    await request('get', `/${table}`, { params: { select: col, limit: '0' } });
    _columnExistenceCache.set(cacheKey, true);
    return true;
  } catch (e) {
    // If PostgREST complains about unknown column, treat as not present; cache false
    _columnExistenceCache.set(cacheKey, false);
    return false;
  }
};

module.exports = supabaseRest;
