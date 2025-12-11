import { Server, Socket } from 'socket.io';
import { GameManager } from './gameManager.js';
import { ReconnectionManager } from './reconnectionManager.js';
import { generateRoomCode, generateShareableLink, isValidRoomCode } from './utils.js';
import {
  Player,
  CreateRoomResponse,
  JoinRoomData,
  JoinRoomResponse,
  StartGameData,
  SubmitAnswerData,
  UpdateOrderData,
  PlacePlayerData,
  GenericRoomData,
  GenericResponse,
} from './types.js';

export function setupSocketHandlers(
  io: Server,
  gameManager: GameManager,
  reconnectionManager: ReconnectionManager
) {
  const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // =========================================================================
    // CREATE ROOM
    // =========================================================================
    socket.on('createRoom', (playerName: string, callback: (response: CreateRoomResponse) => void) => {
      try {
        if (!playerName || playerName.trim().length === 0) {
          callback({ success: false, error: 'Player name is required' });
          return;
        }

        const roomCode = generateRoomCode();
        const game = gameManager.createGame(roomCode, socket.id, playerName.trim());
        socket.join(roomCode);

        const shareLink = generateShareableLink(roomCode, BASE_URL);

        callback({
          success: true,
          roomCode,
          shareLink,
          game,
        });

        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Created by ${playerName}`);
      } catch (error) {
        console.error('[CreateRoom] Error:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // =========================================================================
    // JOIN ROOM
    // =========================================================================
    socket.on('joinRoom', (data: JoinRoomData, callback: (response: JoinRoomResponse) => void) => {
      try {
        const { roomCode, playerName } = data;

        if (!roomCode || !playerName) {
          callback({ success: false, error: 'Room code and player name are required' });
          return;
        }

        const cleanRoomCode = roomCode.toUpperCase().trim();

        if (!isValidRoomCode(cleanRoomCode)) {
          callback({ success: false, error: 'Invalid room code format' });
          return;
        }

        const game = gameManager.getGame(cleanRoomCode);
        if (!game) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        // Check if player already exists (rejoin scenario)
        const existingPlayer = game.players.find(p => p.id === socket.id);
        if (existingPlayer) {
          socket.join(cleanRoomCode);
          callback({ success: true, game });
          return;
        }

        const player: Player = {
          id: socket.id,
          name: playerName.trim(),
          isHost: false,
          joinedAt: Date.now(),
        };

        gameManager.addPlayer(cleanRoomCode, player);
        socket.join(cleanRoomCode);

        callback({ success: true, game });
        io.to(cleanRoomCode).emit('gameUpdate', game);
        console.log(`[Room ${cleanRoomCode}] ${playerName} joined`);
      } catch (error) {
        console.error('[JoinRoom] Error:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // =========================================================================
    // START GAME
    // =========================================================================
    socket.on('startGame', (data: StartGameData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, questionId } = data;
        const game = gameManager.getGame(roomCode);

        if (!game) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (game.hostId !== socket.id) {
          callback({ success: false, error: 'Only the host can start the game' });
          return;
        }

        if (game.players.length < 2) {
          callback({ success: false, error: 'At least 2 players required to start' });
          return;
        }

        gameManager.updateGameState(roomCode, {
          state: 'question',
          currentRound: {
            questionId,
            sortingStarted: false,
            estimationOrder: [],
            activePlayerId: null,
            placedPlayers: [],
            answers: {},
          },
        });

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        io.to(roomCode).emit('navigateTo', `/question/${roomCode}/${questionId}`);
        console.log(`[Room ${roomCode}] Game started with question ${questionId}`);
      } catch (error) {
        console.error('[StartGame] Error:', error);
        callback({ success: false, error: 'Failed to start game' });
      }
    });

    // =========================================================================
    // SUBMIT ANSWER
    // =========================================================================
    socket.on('submitAnswer', (data: SubmitAnswerData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, answer } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        // Store answer
        game.currentRound.answers[socket.id] = answer;

        // Mark player as having submitted
        const player = game.players.find(p => p.id === socket.id);
        if (player) {
          player.estimation = true;
        }

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Player ${socket.id} submitted answer: ${answer}`);
      } catch (error) {
        console.error('[SubmitAnswer] Error:', error);
        callback({ success: false, error: 'Failed to submit answer' });
      }
    });

    // =========================================================================
    // UPDATE ORDER (Host arranges players)
    // =========================================================================
    socket.on('updateOrder', (data: UpdateOrderData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, order } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        if (game.hostId !== socket.id) {
          callback({ success: false, error: 'Only the host can update order' });
          return;
        }

        game.currentRound.estimationOrder = order;

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Order updated:`, order);
      } catch (error) {
        console.error('[UpdateOrder] Error:', error);
        callback({ success: false, error: 'Failed to update order' });
      }
    });

    // =========================================================================
    // START SORTING (Begin estimation phase)
    // =========================================================================
    socket.on('startSorting', (data: GenericRoomData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        if (game.hostId !== socket.id) {
          callback({ success: false, error: 'Only the host can start sorting' });
          return;
        }

        game.currentRound.sortingStarted = true;
        game.currentRound.activePlayerId = game.currentRound.estimationOrder[0] || null;
        game.state = 'estimation';

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        io.to(roomCode).emit('navigateTo', `/estimation/${roomCode}/${game.currentRound.questionId}`);
        console.log(`[Room ${roomCode}] Sorting started`);
      } catch (error) {
        console.error('[StartSorting] Error:', error);
        callback({ success: false, error: 'Failed to start sorting' });
      }
    });

    // =========================================================================
    // PLACE PLAYER (Player places themselves in order)
    // =========================================================================
    socket.on('placePlayer', (data: PlacePlayerData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, playerId } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        // Add player to placed list
        if (!game.currentRound.placedPlayers.includes(playerId)) {
          game.currentRound.placedPlayers.push(playerId);
        }

        // Set next active player
        const nextIndex = game.currentRound.placedPlayers.length;
        game.currentRound.activePlayerId = game.currentRound.estimationOrder[nextIndex] || null;

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Player ${playerId} placed`);
      } catch (error) {
        console.error('[PlacePlayer] Error:', error);
        callback({ success: false, error: 'Failed to place player' });
      }
    });

    // =========================================================================
    // PREPARE NEXT ROUND
    // =========================================================================
    socket.on('prepareNextRound', (data: GenericRoomData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode } = data;
        const game = gameManager.getGame(roomCode);

        if (!game) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (game.hostId !== socket.id) {
          callback({ success: false, error: 'Only the host can prepare next round' });
          return;
        }

        gameManager.updateGameState(roomCode, { state: 'prepare' });

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        io.to(roomCode).emit('navigateTo', `/prepare/${roomCode}`);
        console.log(`[Room ${roomCode}] Preparing next round`);
      } catch (error) {
        console.error('[PrepareNextRound] Error:', error);
        callback({ success: false, error: 'Failed to prepare next round' });
      }
    });

    // =========================================================================
    // RESET ROUND
    // =========================================================================
    socket.on('resetRound', (data: GenericRoomData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode } = data;
        const game = gameManager.getGame(roomCode);

        if (!game) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (game.hostId !== socket.id) {
          callback({ success: false, error: 'Only the host can reset round' });
          return;
        }

        // Reset player estimation flags
        game.players.forEach(p => (p.estimation = false));

        gameManager.updateGameState(roomCode, {
          state: 'waiting',
          currentRound: null,
        });

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Round reset`);
      } catch (error) {
        console.error('[ResetRound] Error:', error);
        callback({ success: false, error: 'Failed to reset round' });
      }
    });

    // =========================================================================
    // DISCONNECT
    // =========================================================================
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      const roomCode = gameManager.findRoomBySocketId(socket.id);
      if (!roomCode) return;

      const game = gameManager.getGame(roomCode);
      if (!game) return;

      const isHost = game.hostId === socket.id;

      if (isHost) {
        // Host disconnected - start timeout
        console.log(`[Room ${roomCode}] Host disconnected, starting timeout`);
        reconnectionManager.startHostTimeout(roomCode);
      } else {
        // Regular player disconnected - remove immediately
        gameManager.removePlayer(roomCode, socket.id);
        const updatedGame = gameManager.getGame(roomCode);
        if (updatedGame) {
          io.to(roomCode).emit('gameUpdate', updatedGame);
        }
      }
    });

    // =========================================================================
    // RECONNECT (Host rejoins)
    // =========================================================================
    socket.on('reconnectAsHost', (data: GenericRoomData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode } = data;

        if (!reconnectionManager.isValidHostReconnection(socket.id, roomCode)) {
          callback({ success: false, error: 'Invalid reconnection or timeout expired' });
          return;
        }

        socket.join(roomCode);
        reconnectionManager.handleHostReconnected(roomCode, socket.id);

        callback({ success: true });
      } catch (error) {
        console.error('[ReconnectAsHost] Error:', error);
        callback({ success: false, error: 'Failed to reconnect' });
      }
    });
  });

  // Cleanup stale games every 10 minutes
  setInterval(() => {
    const deleted = gameManager.cleanupStaleGames();
    if (deleted > 0) {
      console.log(`[Cleanup] Removed ${deleted} stale games`);
    }
  }, 600000);
}
