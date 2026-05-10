/**
 * Error-Path Integrationstest — TECH-15 Erweiterung
 * @vitest-environment node
 *
 * Testet alle dokumentierten Error-Szenarien gegen den Server.
 * Deckt ab: Validierung, Berechtigungen, State-Guards, Reconnect.
 *
 * Run:  npx vitest run tests/integration/error-paths.spec.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = 3098;
const URL = `http://localhost:${PORT}`;

let server: ChildProcess | null = null;
let host: Socket;
let player: Socket;

const hostId = randomUUID();
const playerId = randomUUID();

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server = spawn('npx', ['tsx', 'server/index.ts'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let done = false;
    const onData = (chunk: Buffer) => {
      if (!done && chunk.toString().includes('Server listening')) {
        done = true;
        setTimeout(resolve, 300);
      }
    };
    server.stdout?.on('data', onData);
    server.stderr?.on('data', onData);
    server.on('error', (e) => { if (!done) reject(e); });
    setTimeout(() => { if (!done) reject(new Error('Server start timeout')); }, 10000);
  });
}

function stopServer() {
  server?.kill('SIGTERM');
  server = null;
}

function client(): Socket {
  return io(URL, { transports: ['websocket', 'polling'], forceNew: true });
}

function connect(s: Socket): Promise<void> {
  return new Promise((r) => { if (s.connected) r(); else s.once('connect', () => r()); });
}

function emit<T = any>(s: Socket, event: string, data: any): Promise<T> {
  return new Promise((resolve, reject) => {
    s.emit(event, data, (response: any) => {
      response?.success ? resolve(response) : reject(new Error(response?.error || `${event} failed`));
    });
  });
}

/** Emit but expect failure — returns the error message */
function emitFail(s: Socket, event: string, data: any): Promise<string> {
  return new Promise((resolve, reject) => {
    s.emit(event, data, (response: any) => {
      response?.success === false
        ? resolve(response.error)
        : reject(new Error(`${event} should have failed but succeeded`));
    });
  });
}

describe('Ludonect Error Paths', () => {
  beforeAll(async () => {
    await startServer();
    host = client();
    player = client();
    await Promise.all([connect(host), connect(player)]);
  });

  afterAll(() => {
    host?.disconnect();
    player?.disconnect();
    stopServer();
  });

  // ── createRoom Validierung ────────────────────────────────────────────────
  it('createRoom ohne Namen schlägt fehl', async () => {
    const err = await emitFail(host, 'createRoom', { playerName: '', playerId: hostId });
    expect(err).toContain('name');
  });

  // ── joinRoom Validierung ──────────────────────────────────────────────────
  it('joinRoom mit ungültigem Code-Format schlägt fehl', async () => {
    const err = await emitFail(player, 'joinRoom', {
      roomCode: 'XX',
      playerName: 'Test',
      playerId: randomUUID(),
    });
    expect(err).toContain('format');
  });

  it('joinRoom mit nicht-existentem Code schlägt fehl', async () => {
    const err = await emitFail(player, 'joinRoom', {
      roomCode: 'ABCD',
      playerName: 'Test',
      playerId: randomUUID(),
    });
    expect(err).toBe('Room not found');
  });

  // ── Setup: Raum für weitere Tests ─────────────────────────────────────────
  let roomCode = '';

  it('Setup: Host erstellt Raum und Spieler joined', async () => {
    const r = await emit(host, 'createRoom', { playerName: 'Host', playerId: hostId });
    roomCode = r.roomCode;
    await emit(player, 'joinRoom', { roomCode, playerName: 'Spieler', playerId });
  });

  // ── startGame Validierung ─────────────────────────────────────────────────
  it('startGame mit <2 Spielern schlägt fehl', async () => {
    // Neuer Raum mit nur Host
    const soloHost = client();
    await connect(soloHost);
    const r = await emit(soloHost, 'createRoom', { playerName: 'Solo', playerId: randomUUID() });
    const err = await emitFail(soloHost, 'startGame', { roomCode: r.roomCode, questionId: 1 });
    expect(err).toContain('2 players');
    soloHost.disconnect();
  });

  it('startGame als Nicht-Host schlägt fehl', async () => {
    const err = await emitFail(player, 'startGame', { roomCode, questionId: 1 });
    expect(err).toContain('Only the host');
  });

  // ── Spiel starten für weitere State-Tests ─────────────────────────────────
  it('Setup: Host startet Spiel', async () => {
    await emit(host, 'startGame', { roomCode, questionId: 1 });
  });

  // ── GAME_ALREADY_STARTED ──────────────────────────────────────────────────
  it('Neuer Spieler nach Spielstart wird abgewiesen (GAME_ALREADY_STARTED)', async () => {
    const late = client();
    await connect(late);
    const err = await emitFail(late, 'joinRoom', {
      roomCode,
      playerName: 'ZuSpät',
      playerId: randomUUID(), // Neue UUID, kein Reconnect
    });
    expect(err).toBe('GAME_ALREADY_STARTED');
    late.disconnect();
  });

  // ── submitAnswer State-Guard ──────────────────────────────────────────────
  it('submitAnswer als Nicht-Host funktioniert trotzdem (Spieler darf antworten)', async () => {
    // Das ist KEIN Error — Spieler soll antworten dürfen. Gegencheck.
    const r = await emit(player, 'submitAnswer', { roomCode, answer: 50 });
    expect(r.success).toBe(true);
  });

  // ── proceedToEstimation Berechtigung ──────────────────────────────────────
  it('proceedToEstimation als Nicht-Host schlägt fehl', async () => {
    const err = await emitFail(player, 'proceedToEstimation', { roomCode });
    expect(err).toContain('Only the host');
  });

  // ── Host proceeden und estimation starten ─────────────────────────────────
  it('Setup: Host proceeded und startet estimation', async () => {
    await emit(host, 'submitAnswer', { roomCode, answer: 42 });
    await emit(host, 'proceedToEstimation', { roomCode });
    const order = [hostId, playerId];
    await emit(host, 'updateOrder', { roomCode, order });
    await emit(host, 'startSorting', { roomCode });
  });

  // ── updateOrder / startSorting Berechtigung ──────────────────────────────
  it('updateOrder als Nicht-Host schlägt fehl (nach startSorting)', async () => {
    const err = await emitFail(player, 'updateOrder', { roomCode, order: [playerId, hostId] });
    expect(err).toContain('Only the host');
  });

  // ── placePlayer State-Guard ───────────────────────────────────────────────
  it('placePlayer funktioniert im estimation-State', async () => {
    const r = await emit(host, 'placePlayer', { roomCode, playerId: hostId });
    expect(r.success).toBe(true);
  });

  // ── prepareNextRound → startNextQuestion State-Guards ─────────────────────
  it('Setup: Host leitet prepare ein', async () => {
    await emit(player, 'placePlayer', { roomCode, playerId });
    await emit(host, 'prepareNextRound', { roomCode });
  });

  it('startNextQuestion als Nicht-Host schlägt fehl', async () => {
    const err = await emitFail(player, 'startNextQuestion', { roomCode, questionId: 2 });
    expect(err).toContain('Only the host');
  });

  it('startNextQuestion aus falschem State schlägt fehl', async () => {
    // Host startet Frage 2 — State wird question
    await emit(host, 'startNextQuestion', { roomCode, questionId: 2 });
    // Nochmal startNextQuestion — jetzt ist State question, nicht prepare
    const err = await emitFail(host, 'startNextQuestion', { roomCode, questionId: 3 });
    expect(err).toContain('prepare');
  });

  // ── Reconnect ─────────────────────────────────────────────────────────────
  it('Reconnect: Spieler kann nach Disconnect wieder beitreten', async () => {
    // Spieler disconnected
    player.disconnect();

    // Neuer Socket mit gleicher UUID
    const reconnected = client();
    await connect(reconnected);

    const r = await emit(reconnected, 'joinRoom', {
      roomCode,
      playerName: 'Spieler',
      playerId, // Gleiche UUID wie vorher
    });

    expect(r.success).toBe(true);
    expect(r.game.players).toHaveLength(2); // Host + Spieler
    reconnected.disconnect();

    // Player für Cleanup neu verbinden
    // (afterAll erwartet connected sockets)
  });

  // ── Fehler-Callback: submitAnswer im falschen State ───────────────────────
  it('submitAnswer im estimation-State schlägt fehl', async () => {
    // Wir sind in question (nach startNextQuestion in vorigem Test)
    // Neuen Raum erstellen, estimation erreichen, dann submitAnswer testen
    const testHost = client();
    await connect(testHost);
    const r = await emit(testHost, 'createRoom', { playerName: 'T', playerId: randomUUID() });

    const testPlayer = client();
    await connect(testPlayer);
    const pId = randomUUID();
    await emit(testPlayer, 'joinRoom', { roomCode: r.roomCode, playerName: 'P', playerId: pId });

    await emit(testHost, 'startGame', { roomCode: r.roomCode, questionId: 1 });
    await emit(testHost, 'submitAnswer', { roomCode: r.roomCode, answer: 10 });
    await emit(testPlayer, 'submitAnswer', { roomCode: r.roomCode, answer: 20 });
    await emit(testHost, 'proceedToEstimation', { roomCode: r.roomCode });
    await emit(testHost, 'updateOrder', { roomCode: r.roomCode, order: [testHost['auth']?.['playerId'] || pId, pId] });
    await emit(testHost, 'startSorting', { roomCode: r.roomCode });

    // Jetzt ist State = estimation → submitAnswer muss fehlschlagen
    const err = await emitFail(testHost, 'submitAnswer', { roomCode: r.roomCode, answer: 99 });
    expect(err).toContain('question');

    testHost.disconnect();
    testPlayer.disconnect();
  });
});
