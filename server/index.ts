import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';
import { ReconnectionManager } from './reconnectionManager.js';
import { setupSocketHandlers } from './socketHandlers.js';

// PORT: Railway setzt die Umgebungsvariable PORT dynamisch
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

// Create HTTP server
const httpServer = createServer();

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
  transports: ['websocket', 'polling'],
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