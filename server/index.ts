import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';
import { ReconnectionManager } from './reconnectionManager.js';
import { setupSocketHandlers } from './socketHandlers.js';

// ── Client Error Ring Buffer ────────────────────────────────────────────────
const MAX_CLIENT_ERRORS = 50;
const clientErrors: Array<{ time: string; type: string; message: string; url: string; ua: string; stack?: string }> = [];

// ── Client-side Error Logging Endpoint ─────────────────────────────────────
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
      // Store in ring buffer for dashboard
      clientErrors.unshift({ time: timestamp || new Date().toISOString(), type, message, url: href || url, ua: userAgent, stack });
      if (clientErrors.length > MAX_CLIENT_ERRORS) clientErrors.pop();
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
  } else if (req.url === '/dashboard') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.writeHead(200);
    res.end(renderDashboard(gameManager));
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
      } else if (process.env.NODE_ENV !== 'production') {
        // In development, allow all local network origins (e.g. phone/tablet testing)
        const hostname = new URL(origin).hostname;
        if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
          console.log(`[CORS] Allowed dev-network origin: ${origin}`);
          callback(null, true);
        } else {
          console.warn(`[CORS] Blocked origin: ${origin}`);
          callback(new Error('CORS not allowed'));
        }
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

// ── Dev Dashboard ───────────────────────────────────────────────────────────
function renderDashboard(gm: GameManager): string {
  const games = gm.getAllGames();
  const now = Date.now();

  const gameCards = games.length === 0
    ? '<div class="empty">Keine aktiven Räume</div>'
    : games.map(g => {
        const age = Math.round((now - g.createdAt) / 1000);
        const players = g.players.map(p => {
          const icon = p.animalIcon || '❓';
          const host = p.isHost ? ' 👑' : '';
          const disc = p.disconnectedAt ? ' ⚠️' : '';
          const ans = g.currentRound?.answers?.[p.id];
          const answer = ans !== undefined ? ` → ${ans}` : '';
          return `<li><span class="icon">${icon}</span> ${p.name}${host}${disc}<span class="muted">${answer}</span></li>`;
        }).join('');
        const qId = g.currentRound?.questionId;
        const answers = g.currentRound?.answers
          ? Object.entries(g.currentRound.answers).map(([pid, val]) => {
              const p = g.players.find(pl => pl.id === pid);
              return `${p?.name || pid.slice(0,6)}: ${val}`;
            }).join(', ')
          : '—';
        const order = g.currentRound?.estimationOrder?.length
          ? g.currentRound.estimationOrder.map(id => g.players.find(p => p.id === id)?.name || id.slice(0,6)).join(' → ')
          : '—';

        return `<div class="card">
      <div class="card-head">
        <span class="room-code">🏠 ${g.roomCode}</span>
        <span class="state state-${g.state}">${g.state}</span>
        <span class="muted">${age}s alt</span>
        <span class="muted">📋 ${g.catalog}</span>
      </div>
      <div class="card-body">
        <div class="row"><strong>Spieler (${g.players.length}):</strong><ul>${players}</ul></div>
        <div class="row"><strong>Frage ID:</strong> ${qId || '—'}</div>
        <div class="row"><strong>Antworten:</strong> ${answers}</div>
        <div class="row"><strong>Reihenfolge:</strong> ${order}</div>
      </div>
    </div>`;
      }).join('');

  const errorRows = clientErrors.length === 0
    ? '<div class="empty">Keine Client-Fehler</div>'
    : clientErrors.map(e => {
        const shortUA = (e.ua || '').split(' ').slice(-2).join(' ').slice(0, 40);
        return `<div class="error-row">
      <span class="err-time">${e.time}</span>
      <span class="err-type">${e.type}</span>
      <span class="err-msg">${e.message.slice(0, 120)}</span>
      <span class="err-url muted">${e.url?.slice(0, 50) || ''}</span>
      <span class="err-ua muted">${shortUA}</span>
    </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ludonect Dev Dashboard</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family: system-ui, sans-serif; background:#0d1117; color:#c9d1d9; padding:16px; }
  h1 { font-size:1.3rem; color:#e6edf3; }
  h2 { font-size:1.1rem; color:#e6edf3; margin:20px 0 10px; border-bottom:1px solid #30363d; padding-bottom:4px; }
  .muted { color:#8b949e; font-size:0.85rem; }
  .empty { padding:20px; text-align:center; color:#8b949e; font-style:italic; }
  .card { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:12px; margin-bottom:12px; }
  .card-head { display:flex; gap:12px; align-items:center; margin-bottom:8px; flex-wrap:wrap; }
  .room-code { font-weight:700; font-size:1.1rem; color:#58a6ff; }
  .state { padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:600; }
  .state-waiting { background:#1a3a1a; color:#3fb950; }
  .state-question { background:#1a2a3a; color:#58a6ff; }
  .state-estimation { background:#3a2a1a; color:#d2991d; }
  .state-prepare { background:#2a1a2a; color:#bc8cff; }
  .card-body .row { margin:4px 0; }
  .card-body ul { list-style:none; padding-left:8px; }
  .card-body li { padding:2px 0; font-size:0.9rem; }
  .error-row { display:flex; gap:8px; padding:6px 0; border-bottom:1px solid #21262d; font-size:0.82rem; flex-wrap:wrap; }
  .err-time { color:#8b949e; white-space:nowrap; }
  .err-type { color:#f85149; font-weight:600; white-space:nowrap; }
  .err-msg { color:#c9d1d9; flex:1; min-width:150px; }
  .err-url { white-space:nowrap; }
  .err-ua { white-space:nowrap; }
  .refresh { color:#8b949e; font-size:0.8rem; margin-left:12px; }
  .icon { font-size:1.1rem; }
</style>
</head>
<body>
<h1>🛠 Ludonect Dev Dashboard <span class="refresh">(auto-refresh 3s)</span></h1>

<h2>🎮 Aktive Räume (${games.length})</h2>
${gameCards}

<h2>🐛 Client-Fehler (${clientErrors.length})</h2>
${errorRows}

<script>setTimeout(()=>location.reload(),3000)</script>
</body>
</html>`;
}
// ───────────────────────────────────────────────────────────────────────────

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