// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GameManager } from '../../server/gameManager'
import { ReconnectionManager } from '../../server/reconnectionManager'
import { setupSocketHandlers } from '../../server/socketHandlers'

// ─────────────────────────────────────────────────────────────────────────────
// Minimal mock helpers
// ─────────────────────────────────────────────────────────────────────────────

function createMockSocket(id: string) {
  const handlers: Record<string, Function> = {}
  return {
    id,
    join: vi.fn(),
    emit: vi.fn(),
    on(event: string, handler: Function) { handlers[event] = handler },
    trigger(event: string, ...args: any[]) { handlers[event]?.(...args) },
  }
}

function createMockIo() {
  let connectionHandler: Function | null = null
  const roomEmit = vi.fn()
  const io = {
    on: vi.fn((event: string, handler: Function) => {
      if (event === 'connection') connectionHandler = handler
    }),
    to: vi.fn(() => ({ emit: roomEmit })),
    emit: vi.fn(),
  }
  return {
    io,
    roomEmit,
    connectSocket: (socket: ReturnType<typeof createMockSocket>) =>
      connectionHandler?.(socket),
  }
}

// Simulate a player joining via the joinRoom socket event
function simulateJoinRoom(
  socket: ReturnType<typeof createMockSocket>,
  roomCode: string,
  playerId: string,
  playerName: string,
) {
  return new Promise<void>((resolve) => {
    socket.trigger('joinRoom', { roomCode, playerId, playerName }, (response: any) => {
      if (!response.success) throw new Error(response.error)
      resolve()
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Grace Period tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Player Grace Period on Disconnect', () => {
  let gameManager: GameManager
  let reconnectionManager: ReconnectionManager
  let mock: ReturnType<typeof createMockIo>
  const ROOM = 'TEST'
  const HOST_ID = 'host-uuid'
  const PLAYER_ID = 'player-uuid'

  beforeEach(() => {
    vi.useFakeTimers()
    gameManager = new GameManager()
    mock = createMockIo()
    reconnectionManager = new ReconnectionManager(mock.io as any, gameManager)
    setupSocketHandlers(mock.io as any, gameManager, reconnectionManager)

    // Set up a game with a host directly
    const game = gameManager.createGame(ROOM, HOST_ID, 'host-socket', 'HostPlayer')
    game.players[0].animalIcon = '🦊'
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sets disconnectedAt on player disconnect instead of removing immediately', async () => {
    // Player joins
    const playerSocket = createMockSocket('player-socket')
    mock.connectSocket(playerSocket)
    await simulateJoinRoom(playerSocket, ROOM, PLAYER_ID, 'PlayerOne')

    const game = gameManager.getGame(ROOM)!
    expect(game.players).toHaveLength(2)

    // Player disconnects
    playerSocket.trigger('disconnect')

    const player = game.players.find(p => p.id === PLAYER_ID)
    expect(player).toBeDefined()
    expect(player!.disconnectedAt).toBeTypeOf('number')
  })

  it('removes player after grace period expires', async () => {
    const playerSocket = createMockSocket('player-socket')
    mock.connectSocket(playerSocket)
    await simulateJoinRoom(playerSocket, ROOM, PLAYER_ID, 'PlayerOne')

    playerSocket.trigger('disconnect')

    // Still in room during grace period
    expect(gameManager.getGame(ROOM)!.players).toHaveLength(2)

    // Advance past the 2-minute grace period
    vi.advanceTimersByTime(121_000)

    expect(gameManager.getGame(ROOM)!.players).toHaveLength(1)
    expect(gameManager.getGame(ROOM)!.players[0].id).toBe(HOST_ID)
  })

  it('does not remove player who reconnects within the grace period', async () => {
    const playerSocket = createMockSocket('player-socket-1')
    mock.connectSocket(playerSocket)
    await simulateJoinRoom(playerSocket, ROOM, PLAYER_ID, 'PlayerOne')

    // Player disconnects
    playerSocket.trigger('disconnect')
    expect(gameManager.getGame(ROOM)!.players.find(p => p.id === PLAYER_ID)?.disconnectedAt)
      .toBeTypeOf('number')

    // Player reconnects within grace period with a new socket
    const newSocket = createMockSocket('player-socket-2')
    mock.connectSocket(newSocket)
    await simulateJoinRoom(newSocket, ROOM, PLAYER_ID, 'PlayerOne')

    // disconnectedAt must be cleared
    const player = gameManager.getGame(ROOM)!.players.find(p => p.id === PLAYER_ID)
    expect(player).toBeDefined()
    expect(player!.disconnectedAt).toBeUndefined()

    // Advance past grace period — player must still be there
    vi.advanceTimersByTime(121_000)
    expect(gameManager.getGame(ROOM)!.players).toHaveLength(2)
  })

  it('restores socketId to the new socket after reconnect', async () => {
    const playerSocket = createMockSocket('player-socket-1')
    mock.connectSocket(playerSocket)
    await simulateJoinRoom(playerSocket, ROOM, PLAYER_ID, 'PlayerOne')

    playerSocket.trigger('disconnect')

    const newSocket = createMockSocket('player-socket-2')
    mock.connectSocket(newSocket)
    await simulateJoinRoom(newSocket, ROOM, PLAYER_ID, 'PlayerOne')

    const player = gameManager.getGame(ROOM)!.players.find(p => p.id === PLAYER_ID)
    expect(player!.socketId).toBe('player-socket-2')
  })
})
