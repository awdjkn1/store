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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
