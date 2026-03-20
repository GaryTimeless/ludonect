import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';
import { ReconnectionManager } from './reconnectionManager.js';
import { setupSocketHandlers } from './socketHandlers.js';

// ── Client-side Error Logging Endpoint ─────────────────────────────────────
// Receives errors POSTed by the browser's global error handler (main.ts).
// This lets you debug issues on devices you can't physically access.
function handleLogError(req: IncomingMessage, res: ServerResponse) {
  // Simple CORS headers so the browser can POST from the frontend origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      const { type, message, stack, url, userAgent, timestamp, href } = JSON.parse(body);
      console.error('┌─────────────────────────────────────────────────────');
      console.error(`│ 🐛 [CLIENT ERROR] ${timestamp}`);
      console.error(`│ Type:    ${type}`);
      console.error(`│ Message: ${message}`);
      console.error(`│ URL:     ${href || url}`);
      console.error(`│ UA:      ${userAgent}`);
      if (stack) {
        console.error(`│ Stack:`);
        stack.split('\n').slice(0, 5).forEach((line: string) => console.error(`│   ${line}`));
      }
      console.error('└─────────────────────────────────────────────────────');
    } catch {
      console.error('[log-error] Failed to parse error body:', body.slice(0, 200));
    }
    res.writeHead(204);
    res.end();
  });
}
// ───────────────────────────────────────────────────────────────────────────

// Mit dem || Fallback wird sichergestellt, dass immer ein Port gebunden wird
const PORT = process.env.PORT || 3001;

// Erlaubte Origins für CORS - für Production und Development
const ALLOWED_ORIGINS = [
  'https://garytimeless.github.io',  // GitHub Pages URL
  'https://ludonect.de',              // Custom Domain
  'http://localhost:5173',            // Local Development (Vite)
  'http://localhost:3001',            // Local Development (Direct)
  'http://127.0.0.1:5173',            // Local Development Alt
];

// Create HTTP server with /api/log-error handler
const httpServer = createServer((req, res) => {
  if (req.url === '/api/log-error') {
    handleLogError(req, res);
  } else {
    // All other requests are handled by Socket.IO or ignored
    res.writeHead(404);
    res.end();
  }
});

// Create Socket.io server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Erlaubt Requests ohne Origin (z.B. von mobilen Apps)
      if (!origin) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('CORS not allowed'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'], // match client transport order
});

// Initialize managers
const gameManager = new GameManager();
const reconnectionManager = new ReconnectionManager(io, gameManager);

// Setup socket event handlers
setupSocketHandlers(io, gameManager, reconnectionManager);

// Start server
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════���════╗');
  console.log('║   🎮 Ludonect WebSocket Server Running 🎮    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server listening on port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Allowed CORS origins:`);
  ALLOWED_ORIGINS.forEach(origin => console.log(`   - ${origin}`));
  console.log(`⏰ Host reconnection timeout: 60 seconds`);
  console.log(`🧹 Stale game cleanup: every 10 minutes`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n[Server] SIGTERM received, shutting down gracefully...');
  reconnectionManager.cleanupAll();
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Server] SIGINT received, shutting down gracefully...');
  reconnectionManager.cleanupAll();
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});