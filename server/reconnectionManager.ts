import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';

const HOST_TIMEOUT_MS = 60000; // 60 seconds
const PLAYER_TIMEOUT_MS = 60000; // 60 seconds grace period for regular players

export class ReconnectionManager {
  private hostTimeouts = new Map<string, NodeJS.Timeout>();
  private playerTimeouts = new Map<string, NodeJS.Timeout>(); // key: `${roomCode}:${playerId}`

  constructor(
    private io: Server,
    private gameManager: GameManager
  ) { }

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

    // Update the host's socket connection (id stays the same persistent UUID)
    const hostPlayer = game.players.find(p => p.id === game.hostId);
    if (hostPlayer) {
      hostPlayer.socketId = newSocketId;
    }

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

    const oldHostId = game.hostId;

    // Remove the old host from the player list
    game.players = game.players.filter(p => p.id !== oldHostId);

    if (game.players.length === 0) {
      // No players left — clean up the room
      this.gameManager.deleteGame(roomCode);
      this.hostTimeouts.delete(roomCode);
      console.log(`[Reconnection] Room ${roomCode} deleted — no players remaining`);
      return;
    }

    // Clean up stale references in currentRound (avoids "Unknown" labels)
    if (game.currentRound) {
      // Remove departed host from placed list and turn order
      game.currentRound.placedPlayers = game.currentRound.placedPlayers.filter(id => id !== oldHostId);
      game.currentRound.estimationOrder = game.currentRound.estimationOrder.filter(id => id !== oldHostId);

      // If the departed host was the active player, advance to the next one
      if (game.currentRound.activePlayerId === oldHostId) {
        const remainingOrder = game.currentRound.estimationOrder;
        game.currentRound.activePlayerId = remainingOrder.length > 0 ? remainingOrder[0] : null;
        game.currentRound.currentTurnIndex = 0;
      }
    }

    // Promote the first remaining player to host
    const newHost = game.players[0];
    newHost.isHost = true;
    game.hostId = newHost.id;
    game.hostDisconnectedAt = null;
    this.hostTimeouts.delete(roomCode);

    console.log(`[Reconnection] Host migrated in room ${roomCode} → new host: ${newHost.name} (${newHost.id})`);

    // Notify all players about the migration
    this.io.to(roomCode).emit('hostMigrated', {
      newHostId: newHost.id,
      newHostName: newHost.name,
    });

    // Push updated game state so all clients reflect the new host
    this.io.to(roomCode).emit('gameUpdate', game);
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
   * Start grace period for a regular player who disconnected.
   * If they don't reconnect within PLAYER_TIMEOUT_MS, remove them from the game.
   */
  startPlayerTimeout(roomCode: string, playerId: string, playerName: string): void {
    const key = `${roomCode}:${playerId}`;
    this.clearPlayerTimeout(roomCode, playerId);

    this.gameManager.markPlayerDisconnected(roomCode, playerId);

    const game = this.gameManager.getGame(roomCode);
    if (game) {
      this.io.to(roomCode).emit('gameUpdate', game);
    }

    const timeout = setTimeout(() => {
      console.log(`[Reconnection] Player timeout expired: ${playerName} in room ${roomCode}`);
      this.gameManager.removePlayer(roomCode, playerId);
      this.playerTimeouts.delete(key);

      const updatedGame = this.gameManager.getGame(roomCode);
      if (updatedGame) {
        this.io.to(roomCode).emit('gameUpdate', updatedGame);
      }
    }, PLAYER_TIMEOUT_MS);

    this.playerTimeouts.set(key, timeout);
    console.log(`[Reconnection] Started ${PLAYER_TIMEOUT_MS}ms player timeout for ${playerName} in ${roomCode}`);
  }

  /**
   * Cancel a player's disconnect timeout (player reconnected in time).
   */
  clearPlayerTimeout(roomCode: string, playerId: string): void {
    const key = `${roomCode}:${playerId}`;
    const timeout = this.playerTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.playerTimeouts.delete(key);
      console.log(`[Reconnection] Cleared player timeout for ${playerId} in ${roomCode}`);
    }
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
    for (const timeout of this.playerTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.playerTimeouts.clear();
  }
}
