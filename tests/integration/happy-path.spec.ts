/**
 * Happy-Path Integrationstest — TECH-15
 * @vitest-environment node
 *
 * Simuliert einen kompletten Spieleablauf mit 3 Socket.io-Clients
 * gegen einen lokal gestarteten Server.
 *
 * Ablauf:
 *   Host erstellt Raum → 2 Spieler joinen → Host startet Spiel →
 *   Alle antworten → Host proceedToEstimation → Host startSorting →
 *   Alle platzieren sich → Host prepareNextRound → Spiel in Runde 2
 *
 * Run:  npx vitest run tests/integration/happy-path.spec.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

// ── Config ──────────────────────────────────────────────────────────────────
const SERVER_PORT = 3099;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const TEST_TIMEOUT = 30_000;

// ── Test State ──────────────────────────────────────────────────────────────
let serverProcess: ChildProcess | null = null;
let host: Socket;
let player2: Socket;
let player3: Socket;

const hostId = randomUUID();
const player2Id = randomUUID();
const player3Id = randomUUID();

let roomCode = '';
let gameState: any = null;

// ── Helpers ─────────────────────────────────────────────────────────────────
function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(SERVER_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let resolved = false;

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      if (!resolved && text.includes('Server listening')) {
        resolved = true;
        // Give it a tick to finish binding
        setTimeout(resolve, 300);
      }
    };

    serverProcess.stdout?.on('data', onData);
    serverProcess.stderr?.on('data', onData);

    serverProcess.on('error', (err) => {
      if (!resolved) reject(err);
    });

    setTimeout(() => {
      if (!resolved) reject(new Error('Server did not start within 10s'));
    }, 10000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

function createClient(): Socket {
  return io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true,
  });
}

function connect(client: Socket): Promise<void> {
  return new Promise((resolve) => {
    if (client.connected) return resolve();
    client.once('connect', () => resolve());
  });
}

function emitAndWait(client: Socket, event: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    client.emit(event, data, (response: any) => {
      if (response?.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || `Unknown error for ${event}`));
      }
    });
  });
}

function waitForEvent(client: Socket, event: string, timeout = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
    client.once(event, (data: any) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// ── Test Suite ──────────────────────────────────────────────────────────────
describe('Ludonect Happy Path', () => {
  beforeAll(async () => {
    await startServer();
    host = createClient();
    player2 = createClient();
    player3 = createClient();
    await Promise.all([connect(host), connect(player2), connect(player3)]);
  }, TEST_TIMEOUT);

  afterAll(() => {
    host?.disconnect();
    player2?.disconnect();
    player3?.disconnect();
    stopServer();
  });

  // ── Phase 1: Lobby ──────────────────────────────────────────────────────
  it('Host erstellt einen Raum', async () => {
    const response = await emitAndWait(host, 'createRoom', {
      playerName: 'HostPlayer',
      playerId: hostId,
    });

    expect(response.success).toBe(true);
    expect(response.roomCode).toBeDefined();
    expect(response.game.state).toBe('waiting');
    expect(response.game.players).toHaveLength(1);
    expect(response.game.players[0].isHost).toBe(true);

    roomCode = response.roomCode;
    gameState = response.game;
  });

  it('Spieler 2 tritt dem Raum bei', async () => {
    const response = await emitAndWait(player2, 'joinRoom', {
      roomCode,
      playerName: 'SpielerZwei',
      playerId: player2Id,
    });

    expect(response.success).toBe(true);
    expect(response.game.players).toHaveLength(2);
    gameState = response.game;
  });

  it('Spieler 3 tritt dem Raum bei', async () => {
    const response = await emitAndWait(player3, 'joinRoom', {
      roomCode,
      playerName: 'SpielerDrei',
      playerId: player3Id,
    });

    expect(response.success).toBe(true);
    expect(response.game.players).toHaveLength(3);
    gameState = response.game;
  });

  it('Host sieht den Spiel-starten-Button (≥2 Spieler)', () => {
    expect(gameState.players.length).toBeGreaterThanOrEqual(2);
    expect(gameState.state).toBe('waiting');
  });

  // ── Phase 2: Frage beantworten ──────────────────────────────────────────
  it('Host startet das Spiel, alle empfangen navigateTo + gameUpdate', async () => {
    // Listener VOR emit registrieren
    const navPromises = [
      waitForEvent(host, 'navigateTo'),
      waitForEvent(player2, 'navigateTo'),
      waitForEvent(player3, 'navigateTo'),
    ];

    // gameUpdate kann von joinRoom oder startGame kommen — auf den mit state=question warten
    let gameUpdatePromiseResolve: (value: any) => void;
    const gameUpdatePromise = new Promise<any>((resolve) => {
      gameUpdatePromiseResolve = resolve;
    });
    host.on('gameUpdate', function onUpdate(data: any) {
      if (data.state === 'question' && data.currentRound) {
        host.off('gameUpdate', onUpdate);
        gameUpdatePromiseResolve(data);
      }
    });

    const response = await emitAndWait(host, 'startGame', {
      roomCode,
      questionId: 1,
    });
    expect(response.success).toBe(true);

    // gameUpdate (state → question)
    const update = await gameUpdatePromise;
    expect(update.state).toBe('question');
    expect(update.currentRound).toBeDefined();
    expect(update.currentRound.questionId).toBe(1);
    gameState = update;

    // Alle Clients empfangen navigateTo zur QuestionView
    const paths = await Promise.all(navPromises);
    for (const path of paths) {
      expect(path).toContain('/question/');
      expect(path).toContain(roomCode);
      expect(path).toContain('1');
    }
  });

  it('Alle Spieler beantworten die Frage', async () => {
    const results = await Promise.all([
      emitAndWait(host, 'submitAnswer', { roomCode, answer: 42 }),
      emitAndWait(player2, 'submitAnswer', { roomCode, answer: 67 }),
      emitAndWait(player3, 'submitAnswer', { roomCode, answer: 88 }),
    ]);

    for (const r of results) {
      expect(r.success).toBe(true);
    }

    // Warten auf gameUpdate nach letzter Antwort
    const update = await waitForEvent(host, 'gameUpdate');
    expect(update.state).toBe('question');
    const answers = update.currentRound.answers;
    expect(Object.keys(answers)).toHaveLength(3);
    expect(answers[hostId]).toBe(42);
    expect(answers[player2Id]).toBe(67);
    expect(answers[player3Id]).toBe(88);
    gameState = update;
  });

  // ── Phase 3: Estimation ──────────────────────────────────────────────────
  it('Host leitet zur Estimation-View weiter (proceedToEstimation)', async () => {
    // Listener VOR emit registrieren
    const navPromises = [
      waitForEvent(host, 'navigateTo'),
      waitForEvent(player2, 'navigateTo'),
      waitForEvent(player3, 'navigateTo'),
    ];

    const response = await emitAndWait(host, 'proceedToEstimation', { roomCode });
    expect(response.success).toBe(true);

    const paths = await Promise.all(navPromises);
    for (const path of paths) {
      expect(path).toContain('/estimation/');
      expect(path).toContain(roomCode);
    }
  });

  it('Host legt Reihenfolge fest (updateOrder)', async () => {
    const order = [hostId, player2Id, player3Id];
    const response = await emitAndWait(host, 'updateOrder', { roomCode, order });
    expect(response.success).toBe(true);

    const update = await waitForEvent(host, 'gameUpdate');
    expect(update.currentRound.estimationOrder).toEqual(order);
    gameState = update;
  });

  it('Host startet die Sortierung (startSorting)', async () => {
    const response = await emitAndWait(host, 'startSorting', { roomCode });
    expect(response.success).toBe(true);

    const update = await waitForEvent(host, 'gameUpdate');
    expect(update.state).toBe('estimation');
    expect(update.currentRound.sortingStarted).toBe(true);
    expect(update.currentRound.activePlayerId).toBe(hostId);
    gameState = update;
  });

  it('Alle Spieler platzieren sich (placePlayer)', async () => {
    // Spieler 1 (Host) ist Anker — wird automatisch als erster platziert
    const hResult = await emitAndWait(host, 'placePlayer', {
      roomCode,
      playerId: hostId,
    });
    expect(hResult.success).toBe(true);

    let update = await waitForEvent(host, 'gameUpdate');
    expect(update.currentRound.placedPlayers).toContain(hostId);
    expect(update.currentRound.activePlayerId).toBe(player2Id);

    // Spieler 2 platziert sich
    const p2Result = await emitAndWait(player2, 'placePlayer', {
      roomCode,
      playerId: player2Id,
    });
    expect(p2Result.success).toBe(true);

    update = await waitForEvent(host, 'gameUpdate');
    expect(update.currentRound.placedPlayers).toContain(player2Id);
    expect(update.currentRound.activePlayerId).toBe(player3Id);

    // Spieler 3 platziert sich
    const p3Result = await emitAndWait(player3, 'placePlayer', {
      roomCode,
      playerId: player3Id,
    });
    expect(p3Result.success).toBe(true);

    update = await waitForEvent(host, 'gameUpdate');
    expect(update.currentRound.placedPlayers).toContain(player3Id);
    gameState = update;
  });

  // ── Phase 4: Nächste Runde vorbereiten ───────────────────────────────────
  it('Host leitet nächste Runde ein (prepareNextRound)', async () => {
    const response = await emitAndWait(host, 'prepareNextRound', { roomCode });
    expect(response.success).toBe(true);

    const update = await waitForEvent(host, 'gameUpdate');
    expect(update.state).toBe('prepare');
    gameState = update;
  });

  it('Host startet Runde 2 (startNextQuestion)', async () => {
    const response = await emitAndWait(host, 'startNextQuestion', {
      roomCode,
      questionId: 2,
    });
    expect(response.success).toBe(true);

    const update = await waitForEvent(host, 'gameUpdate');
    expect(update.state).toBe('question');
    expect(update.currentRound.questionId).toBe(2);
    expect(update.usedQuestionIds).toContain(1);
    expect(update.usedQuestionIds).toContain(2);
    gameState = update;
  });

  // ── Finale Assertions ──────────────────────────────────────────────────────
  it('Game-State ist konsistent nach vollständigem Happy Path', () => {
    expect(gameState.roomCode).toBe(roomCode);
    expect(gameState.players).toHaveLength(3);
    expect(gameState.state).toBe('question');
    expect(gameState.currentRound.questionId).toBe(2);
    expect(gameState.usedQuestionIds).toEqual([1, 2]);
    // Alle estimation-Flags wurden für neue Runde zurückgesetzt
    for (const player of gameState.players) {
      expect(player.estimation).toBe(false);
    }
  });
});
