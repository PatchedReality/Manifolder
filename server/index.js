'use strict';

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RP1Proxy } from './rp1-proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();
const server = createServer(app);

// Serve static files from client directory
const clientPath = join(__dirname, '..', 'client');
app.use(express.static(clientPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket server on /ws path
const wss = new WebSocketServer({
  server,
  path: '/ws'
});

// Track active client connections
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[WS] Browser connected: ${clientId}`);

  // Create RP1Proxy instance for this client (doesn't auto-connect)
  const proxy = new RP1Proxy(ws);
  clients.set(ws, { id: clientId, proxy });

  // Handle messages from browser
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[WS] Browser message from ${clientId}:`, message.type);
      proxy.onBrowserMessage(message);
    } catch (err) {
      console.error(`[WS] Invalid message from ${clientId}:`, err.message);
      proxy.sendToBrowser({ type: 'error', message: 'Invalid JSON message' });
    }
  });

  // Handle browser disconnect
  ws.on('close', () => {
    console.log(`[WS] Browser disconnected: ${clientId}`);
    const client = clients.get(ws);
    if (client && client.proxy) {
      client.proxy.disconnect();
    }
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`[WS] Error for ${clientId}:`, err.message);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log(`Serving static files from: ${clientPath}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');

  // Close all client connections
  for (const [ws, client] of clients) {
    if (client.proxy) {
      client.proxy.disconnect();
    }
    ws.close();
  }

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
