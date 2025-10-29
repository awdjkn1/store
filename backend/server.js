require('dotenv').config({ path: __dirname + '/.env' });

// Debug: report PG_PASSWORD presence and type without printing the full secret
try {
  const pwd = process.env.PG_PASSWORD;
  console.log('[env] PG_PASSWORD defined:', typeof pwd !== 'undefined');
  console.log('[env] PG_PASSWORD type:', typeof pwd);
  console.log('[env] PG_PASSWORD length:', pwd ? String(pwd).length : 0);
} catch (e) {
  console.error('[env] Failed to inspect PG_PASSWORD', e && e.message);
}

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
(async function seedAdminUser() {
  // Only seed admin if ADMIN_AUTOSEED is not set to 'false' (default: true)
  if (String(process.env.ADMIN_AUTOSEED).toLowerCase() === 'false') {
    console.log('Admin auto-seed disabled by ADMIN_AUTOSEED env');
    return;
  }
  try {
    const supabase = require('./utils/supabaseRest');
    const bcrypt = require('bcryptjs');
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin1234';

    const existing = await supabase.select('users', { select: 'id,username,email,role', username: `eq.${adminUsername}` });
    if (existing && existing.length > 0) {
      console.log('Admin user already exists, skipping seed.');
      return;
    }

    const hash = await bcrypt.hash(adminPassword, 10);
    await supabase.insert('users', { username: adminUsername, email: adminEmail, password: hash, role: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    console.log('Seeded admin user with username="admin" and password="admin1234"');
  } catch (e) {
    console.warn('Failed to seed admin user:', e && e.message);
  }
})();
