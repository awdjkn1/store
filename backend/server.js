require('dotenv').config({ path: __dirname + '/.env' });

// Small, non-sensitive environment sanity checks. Do NOT log secret values.
try {
  const pwd = process.env.PG_PASSWORD;
  console.log('[env] PG_PASSWORD defined:', typeof pwd !== 'undefined' && pwd ? true : false);
} catch (e) {
  console.error('[env] Failed to inspect PG_PASSWORD presence', e && e.message);
}

// Helper to exit while giving a short window for logs to flush so remote hosts capture them
function exitWithDelay(code = 1, delayMs = 300) {
  try {
    // write a marker to stderr/stdout to make failure visible
    process.stderr.write(`Exiting with code ${code}\n`);
  } catch (e) {}
  setTimeout(() => process.exit(code), delayMs);
}

// Catch unhandled errors so they appear in logs before the process exits
process.on('uncaughtException', (err) => {
  try { console.error('[uncaughtException]', err && err.stack ? err.stack : String(err)); } catch (e) {}
  exitWithDelay(1);
});
process.on('unhandledRejection', (reason) => {
  try { console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : String(reason)); } catch (e) {}
  exitWithDelay(1);
});

// Production-only required env var check: fail fast if critical secrets are missing.
function checkRequiredProductionEnvs() {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  // ENCRYPTION_KEY is preferred, but JWT_SECRET_ENCRYPTION may be provided as a recognized fallback.
  if (!process.env.ENCRYPTION_KEY && !process.env.JWT_SECRET_ENCRYPTION) missing.push('ENCRYPTION_KEY or JWT_SECRET_ENCRYPTION');
  if (missing.length) {
    // Print a clear, non-secret summary to help remote deploy logs (do not print values)
    console.error('[env-check] Missing required env vars for production:', missing.join(', '));
    console.error('[env-check] Production env summary (presence only):', {
      NODE_ENV: process.env.NODE_ENV || 'unset',
      JWT_SECRET_defined: !!process.env.JWT_SECRET,
      ENCRYPTION_KEY_defined: !!process.env.ENCRYPTION_KEY,
      JWT_SECRET_ENCRYPTION_defined: !!process.env.JWT_SECRET_ENCRYPTION,
      PG_PASSWORD_defined: !!process.env.PG_PASSWORD,
      DATABASE_URL_defined: !!process.env.DATABASE_URL
    });
    console.error('[env-check] Set the missing env vars in your production secret manager and restart the service.');
    // Exit to avoid running with insecure defaults; delay briefly so remote logs can capture the messages
    exitWithDelay(1);
  }
}

checkRequiredProductionEnvs();

const fs = require('fs');
const app = require('./app');
const http = require('http');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server, path: '/admin/live' });

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    // Authenticate admin if needed
    // For demo, accept all connections
  });
  // Example: send a test message every 10s
  const interval = setInterval(() => {
    ws.send(JSON.stringify({ type: 'update', data: 'Product or order changed!' }));
  }, 10000);
  ws.on('close', () => clearInterval(interval));
});

// Broadcast function for product/order changes
function broadcastUpdate(type, data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, data }));
    }
  });
}

// Example: call broadcastUpdate('product', {...}) or broadcastUpdate('order', {...}) in CRUD endpoints

// Initialize Socket.io
initSocket(server);

// Create a write stream for logs and provide a small redaction helper
const logStream = fs.createWriteStream('./backend/server.log', { flags: 'a' });
const origConsoleLog = console.log;
const origConsoleError = console.error;

function redactValue(key, value) {
  if (value === null || value === undefined) return value;
  const lower = String(key || '').toLowerCase();
  // keys that commonly contain sensitive values
  const sensitiveKeys = ['password', 'pass', 'pwd', 'secret', 'api', 'apikey', 'api_key', 'token', 'authorization', 'card', 'cvv', 'number'];
  if (sensitiveKeys.some(s => lower.includes(s))) return '[REDACTED]';
  return value;
}

function sanitizeArg(arg) {
  try {
    if (typeof arg === 'string') {
      // redact inline-looking secrets
      if (/api[_-]?key|secret|token|bearer/i.test(arg)) return '[REDACTED]';
      return arg;
    }
    if (typeof arg === 'object') {
      if (Array.isArray(arg)) return arg.map(sanitizeArg);
      const out = {};
      for (const [k, v] of Object.entries(arg)) {
        out[k] = redactValue(k, v) === '[REDACTED]' ? '[REDACTED]' : sanitizeArg(v);
      }
      return out;
    }
    return arg;
  } catch (e) {
    return '[UNSANITIZABLE]';
  }
}

console.log = function (...args) {
  origConsoleLog(...args);
  try {
    const sanitized = args.map(sanitizeArg).map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    logStream.write('[LOG] ' + sanitized + '\n');
  } catch (e) {
    logStream.write('[LOG] [SANITIZE_ERROR]\n');
  }
};

console.error = function (...args) {
  origConsoleError(...args);
  try {
    const sanitized = args.map(sanitizeArg).map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    logStream.write('[ERROR] ' + sanitized + '\n');
  } catch (e) {
    logStream.write('[ERROR] [SANITIZE_ERROR]\n');
  }
};

// Bind to 0.0.0.0 explicitly so preview/proxy environments can reach the server
  // Log all incoming POST requests to /api/admin/auth/login for debugging
  // (duplicate require removed)
app.post('/api/admin/auth/login', (req, res, next) => {
  console.log('[server] Incoming POST /api/admin/auth/login', {
    body: req.body,
    headers: req.headers,
    ip: req.ip
  });
  next();
});
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and bound to 0.0.0.0`);
});

// Ensure an admin user exists with the credentials requested by the project owner.
// This is only executed at server startup and will not overwrite an existing admin user.
// Optionally seed an admin user if explicitly configured via environment.
// In production this should be disabled. Provide ADMIN_AUTOSEED=true and
// ADMIN_AUTOSEED_USERNAME / ADMIN_AUTOSEED_EMAIL and ADMIN_AUTOSEED_PASSWORD
// in a secure environment (CI/secret manager) if you need automatic seeding.
(async function seedAdminUser() {
  try {
    if (String(process.env.ADMIN_AUTOSEED).toLowerCase() !== 'true') {
      // Auto-seed disabled by default
      return;
    }

    const supabase = require('./utils/supabaseRest');
    const bcrypt = require('bcryptjs');

    const adminUsername = process.env.ADMIN_AUTOSEED_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_AUTOSEED_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_AUTOSEED_PASSWORD;

    if (!adminPassword) {
      console.warn('[seedAdminUser] ADMIN_AUTOSEED_PASSWORD not set; skipping auto-seed for safety');
      return;
    }

    const existing = await supabase.select('users', { select: 'id,username,email,role', username: `eq.${adminUsername}` });
    if (existing && existing.length > 0) {
      console.log('Admin user already exists, skipping seed.');
      return;
    }

    const hash = await bcrypt.hash(adminPassword, 10);
    await supabase.insert('users', { username: adminUsername, email: adminEmail, password: hash, role: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    console.log(`Seeded admin user ${adminUsername} (password not logged)`);
  } catch (e) {
    console.warn('Failed to seed admin user:', e && e.message);
  }
})();
