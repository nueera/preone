/* eslint-disable @typescript-eslint/no-require-imports */

// Register tsx to handle TypeScript imports + path aliases
require('tsx/cjs');

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io — tsx/cjs registration allows importing .ts files
  const { getSocketServer } = require('./src/lib/socket');
  getSocketServer(server);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> PreOne ready on http://localhost:${PORT}`);
    console.log(`> Socket.io ready on /api/socketio`);
  });
});
