import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';

const HOST_TIMEOUT_MS = 60000; // 60 seconds

export class ReconnectionManager {
  private hostTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private io: Server,
    private gameManager: GameManager
  ) {}

  /**
   * Start the host disconnect timeout
   * If host doesn't reconnect within 60s, end the game
   */
  startHostTimeout(roomCode: string): void {
    // Clear any existing timeout
    this.clearHostTimeout(roomCode);

    const timeout = setTimeout(() => {
      console.log(`[Reconnection] Host timeout expired for room ${roomCode}`);
      this.handleHostTimeoutExpired(roomCode);
    }, HOST_TIMEOUT_MS);

    this.hostTimeouts.set(roomCode, timeout);
    this.gameManager.markHostDisconnected(roomCode);

    // Notify players that host disconnected
    this.io.to(roomCode).emit('hostDisconnected', {
      message: 'Host disconnected. Waiting for reconnection (60s)...',
      timeoutSeconds: 60,
    });

    console.log(`[Reconnection] Started ${HOST_TIMEOUT_MS}ms timeout for room ${roomCode}`);
  }

  /**
   * Cancel the host timeout (host reconnected)
   */
  clearHostTimeout(roomCode: string): void {
    const timeout = this.hostTimeouts.get(roomCode);
    if (timeout) {
      clearTimeout(timeout);
      this.hostTimeouts.delete(roomCode);
      console.log(`[Reconnection] Cleared timeout for room ${roomCode}`);
    }
  }

  /**
   * Handle host reconnection
   */
  handleHostReconnected(roomCode: string, newSocketId: string): void {
    this.clearHostTimeout(roomCode);
    this.gameManager.markHostReconnected(roomCode);

    const game = this.gameManager.getGame(roomCode);
    if (!game) return;

    // Update host socket ID
    const hostPlayer = game.players.find(p => p.isHost);
    if (hostPlayer) {
      hostPlayer.id = newSocketId;
    }

    // Update game's hostId
    game.hostId = newSocketId;

    // Notify all players
    this.io.to(roomCode).emit('hostReconnected', {
      message: 'Host reconnected! Game resuming...',
    });

    this.io.to(roomCode).emit('gameUpdate', game);

    console.log(`[Reconnection] Host reconnected to room ${roomCode}`);
  }

  /**
   * Called when host timeout expires
   * End the game and notify all players
   */
  private handleHostTimeoutExpired(roomCode: string): void {
    const game = this.gameManager.getGame(roomCode);
    if (!game) return;

    // Notify all players
    this.io.to(roomCode).emit('gameEnded', {
      reason: 'Host did not reconnect within 60 seconds',
      message: 'The game has ended. Please return to the lobby.',
    });

    // Delete the game
    this.gameManager.deleteGame(roomCode);
    this.hostTimeouts.delete(roomCode);

    console.log(`[Reconnection] Game ${roomCode} ended due to host timeout`);
  }

  /**
   * Check if a socket is a reconnecting host
   * @param socketId - The socket ID trying to reconnect
   * @param roomCode - The room they claim to be rejoining
   * @returns true if this is a valid host reconnection
   */
  isValidHostReconnection(socketId: string, roomCode: string): boolean {
    const game = this.gameManager.getGame(roomCode);
    if (!game) return false;

    // Host must be currently disconnected
    if (game.hostDisconnectedAt === null) return false;

    // Must still be within timeout window
    return !this.gameManager.isHostDisconnectTimedOut(roomCode, HOST_TIMEOUT_MS);
  }

  /**
   * Cleanup all timeouts for a room
   */
  cleanup(roomCode: string): void {
    this.clearHostTimeout(roomCode);
  }

  /**
   * Cleanup all timeouts (for server shutdown)
   */
  cleanupAll(): void {
    for (const timeout of this.hostTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.hostTimeouts.clear();
  }
}
