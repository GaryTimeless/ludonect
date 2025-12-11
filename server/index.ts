import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';
import { ReconnectionManager } from './reconnectionManager.js';
import { setupSocketHandlers } from './socketHandlers.js';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
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
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🎮 Ludonect WebSocket Server Running 🎮    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server listening on port: ${PORT}`);
  console.log(`🌐 Accepting connections from: ${CLIENT_URL}`);
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
