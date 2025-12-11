import { GameSession, Player } from './types.js';

export class GameManager {
  private games = new Map<string, GameSession>();

  /**
   * Create a new game session
   */
  createGame(roomCode: string, hostSocketId: string, hostName: string): GameSession {
    const session: GameSession = {
      roomCode,
      createdAt: Date.now(),
      hostId: hostSocketId,
      hostDisconnectedAt: null,
      state: 'waiting',
      players: [
        {
          id: hostSocketId,
          name: `${hostName} (Host)`,
          isHost: true,
          joinedAt: Date.now(),
        },
      ],
      currentRound: null,
      usedQuestionIds: [],
    };

    this.games.set(roomCode, session);
    console.log(`[GameManager] Created game: ${roomCode}`);
    return session;
  }

  /**
   * Get a game session by room code
   */
  getGame(roomCode: string): GameSession | undefined {
    return this.games.get(roomCode);
  }

  /**
   * Get all active games (for debugging/monitoring)
   */
  getAllGames(): GameSession[] {
    return Array.from(this.games.values());
  }

  /**
   * Add a player to an existing game
   */
  addPlayer(roomCode: string, player: Player): GameSession | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    game.players.push(player);
    console.log(`[GameManager] Player ${player.name} joined ${roomCode}`);
    return game;
  }

  /**
   * Remove a player from a game
   * Returns true if game was deleted (no players left)
   */
  removePlayer(roomCode: string, socketId: string): boolean {
    const game = this.games.get(roomCode);
    if (!game) return false;

    const playerName = game.players.find(p => p.id === socketId)?.name || 'Unknown';
    game.players = game.players.filter(p => p.id !== socketId);

    console.log(`[GameManager] Player ${playerName} left ${roomCode}`);

    // Delete game if no players remain
    if (game.players.length === 0) {
      this.games.delete(roomCode);
      console.log(`[GameManager] Deleted empty game: ${roomCode}`);
      return true;
    }

    return false;
  }

  /**
   * Update game state with partial updates
   */
  updateGameState(roomCode: string, updates: Partial<GameSession>): GameSession | null {
    const game = this.games.get(roomCode);
    if (!game) return null;

    Object.assign(game, updates);
    return game;
  }

  /**
   * Mark host as disconnected
   */
  markHostDisconnected(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (game) {
      game.hostDisconnectedAt = Date.now();
      console.log(`[GameManager] Host disconnected from ${roomCode} at ${game.hostDisconnectedAt}`);
    }
  }

  /**
   * Mark host as reconnected
   */
  markHostReconnected(roomCode: string): void {
    const game = this.games.get(roomCode);
    if (game) {
      game.hostDisconnectedAt = null;
      console.log(`[GameManager] Host reconnected to ${roomCode}`);
    }
  }

  /**
   * Check if host disconnection has timed out
   * @param roomCode
   * @param timeoutMs - Timeout in milliseconds (default 60000 = 60s)
   * @returns true if timed out
   */
  isHostDisconnectTimedOut(roomCode: string, timeoutMs: number = 60000): boolean {
    const game = this.games.get(roomCode);
    if (!game || game.hostDisconnectedAt === null) return false;

    const elapsed = Date.now() - game.hostDisconnectedAt;
    return elapsed >= timeoutMs;
  }

  /**
   * Delete a specific game
   */
  deleteGame(roomCode: string): boolean {
    const existed = this.games.has(roomCode);
    this.games.delete(roomCode);
    if (existed) {
      console.log(`[GameManager] Manually deleted game: ${roomCode}`);
    }
    return existed;
  }

  /**
   * Cleanup stale games (older than maxAgeMs)
   * @param maxAgeMs - Maximum age in milliseconds (default 1 hour)
   * @returns Number of games deleted
   */
  cleanupStaleGames(maxAgeMs: number = 3600000): number {
    const now = Date.now();
    let deleted = 0;

    for (const [code, game] of this.games.entries()) {
      if (now - game.createdAt > maxAgeMs) {
        this.games.delete(code);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`[GameManager] Cleaned up ${deleted} stale games`);
    }

    return deleted;
  }

  /**
   * Get total number of active games
   */
  getGameCount(): number {
    return this.games.size;
  }

  /**
   * Find which room a socket is in (by player ID)
   */
  findRoomBySocketId(socketId: string): string | null {
    for (const [roomCode, game] of this.games.entries()) {
      if (game.players.some(p => p.id === socketId)) {
        return roomCode;
      }
    }
    return null;
  }
}
