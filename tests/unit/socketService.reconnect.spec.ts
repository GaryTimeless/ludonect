// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// localStorage mock (jsdom 0.34 environment has incomplete Storage methods)
// ─────────────────────────────────────────────────────────────────────────────
const localStorageStore = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => localStorageStore.get(key) ?? null,
  setItem: (key: string, value: string) => { localStorageStore.set(key, value) },
  removeItem: (key: string) => { localStorageStore.delete(key) },
  clear: () => { localStorageStore.clear() },
})

// ─────────────────────────────────────────────────────────────────────────────
// socket.io-client mock — must be hoisted (vi.mock is always hoisted by Vitest)
// ─────────────────────────────────────────────────────────────────────────────
const eventHandlers: Record<string, Function> = {}

const mockSocket = {
  connected: false as boolean,
  id: 'test-socket-id',
  emit: vi.fn(),
  on: vi.fn((event: string, handler: Function) => {
    eventHandlers[event] = handler
  }),
  connect: vi.fn(),
  disconnect: vi.fn(),
  off: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

import { socketService } from '@/services/socketService'

function triggerSocketEvent(event: string, ...args: any[]) {
  eventHandlers[event]?.(...args)
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Context (localStorage helpers)
// ─────────────────────────────────────────────────────────────────────────────
describe('SocketService – Room Context', () => {
  beforeEach(() => {
    localStorageStore.clear()
  })

  it('setRoomContext saves roomCode to localStorage', () => {
    socketService.setRoomContext('ABCD')
    expect(localStorageStore.get('currentRoomCode')).toBe('ABCD')
  })

  it('clearRoomContext removes roomCode from localStorage', () => {
    localStorageStore.set('currentRoomCode', 'ABCD')
    socketService.clearRoomContext()
    expect(localStorageStore.get('currentRoomCode')).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Auto-Rejoin on reconnect
// ─────────────────────────────────────────────────────────────────────────────
describe('SocketService – Auto-Rejoin', () => {
  beforeEach(() => {
    localStorageStore.clear()
    vi.clearAllMocks()
    // Clear stored event handlers from previous test
    Object.keys(eventHandlers).forEach(k => delete eventHandlers[k])
    // Reset socket state and (re-)connect to register fresh event handlers
    mockSocket.connected = false
    socketService.disconnect()
    socketService.connect()
    // Simulate socket being fully connected so emit() doesn't reject
    mockSocket.connected = true
  })

  afterEach(() => {
    socketService.disconnect()
    mockSocket.connected = false
  })

  it('emits joinRoom with stored context when connect event fires', async () => {
    localStorageStore.set('currentRoomCode', 'ABCD')
    localStorageStore.set('playerId', 'player-uuid')
    localStorageStore.set('playerName', 'TestUser')

    mockSocket.emit.mockImplementation((event: string, _data: any, callback: Function) => {
      if (event === 'joinRoom') callback({ success: true, game: {} })
    })

    triggerSocketEvent('connect')
    await Promise.resolve() // flush microtask queue

    const joinCall = (mockSocket.emit as ReturnType<typeof vi.fn>).mock.calls
      .find(([event]) => event === 'joinRoom')

    expect(joinCall).toBeTruthy()
    expect(joinCall![1]).toEqual({
      roomCode: 'ABCD',
      playerName: 'TestUser',
      playerId: 'player-uuid',
    })
    // Context must stay intact after successful rejoin
    expect(localStorageStore.get('currentRoomCode')).toBe('ABCD')
  })

  it('clears room context when joinRoom returns an error', async () => {
    localStorageStore.set('currentRoomCode', 'GONE')
    localStorageStore.set('playerId', 'player-uuid')
    localStorageStore.set('playerName', 'TestUser')

    mockSocket.emit.mockImplementation((event: string, _data: any, callback: Function) => {
      if (event === 'joinRoom') callback({ success: false, error: 'Room not found' })
    })

    triggerSocketEvent('connect')
    await Promise.resolve()

    expect(localStorageStore.get('currentRoomCode')).toBeUndefined()
  })

  it('does not emit joinRoom when no room context is stored', async () => {
    // localStorageStore is empty — fresh user, nothing to rejoin
    mockSocket.emit.mockImplementation((_event: string, _data: any, cb?: Function) => {
      cb?.({ success: true })
    })

    triggerSocketEvent('connect')
    await Promise.resolve()

    const joinCall = (mockSocket.emit as ReturnType<typeof vi.fn>).mock.calls
      .find(([event]) => event === 'joinRoom')
    expect(joinCall).toBeUndefined()
  })

  it('clears room context when gameEnded event fires', () => {
    localStorageStore.set('currentRoomCode', 'ABCD')
    vi.spyOn(window, 'alert').mockImplementation(() => {})

    triggerSocketEvent('gameEnded', { reason: 'host_left', message: 'Spiel beendet.' })

    expect(localStorageStore.get('currentRoomCode')).toBeUndefined()
  })
})
