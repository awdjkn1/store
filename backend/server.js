
const fs = require('fs');
const app = require('./app');
const http = require('http');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Create a write stream for logs
const logStream = fs.createWriteStream('./backend/server.log', { flags: 'a' });
const origConsoleLog = console.log;
const origConsoleError = console.error;
console.log = function (...args) {
  origConsoleLog(...args);
  logStream.write('[LOG] ' + args.map(String).join(' ') + '\n');
};
console.error = function (...args) {
  origConsoleError(...args);
  logStream.write('[ERROR] ' + args.map(String).join(' ') + '\n');
};

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
