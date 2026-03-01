import { Server, Socket } from 'socket.io';
import { GameManager } from './gameManager.js';
import { ReconnectionManager } from './reconnectionManager.js';
import { generateRoomCode, generateShareableLink, isValidRoomCode } from './utils.js';
import {
  Player,
  CreateRoomData,
  CreateRoomResponse,
  JoinRoomData,
  JoinRoomResponse,
  StartGameData,
  SubmitAnswerData,
  UpdateOrderData,
  PlacePlayerData,
  GenericRoomData,
  GenericResponse,
  StartNextQuestionData,
  UpdatePlacedPlayersData,
} from './types.js';

export function setupSocketHandlers(
  io: Server,
  gameManager: GameManager,
  reconnectionManager: ReconnectionManager
) {
  const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    /** Returns true if the current socket belongs to the host of the given game. */
    function isSocketHost(game: { hostId: string; players: { id: string; socketId: string }[] }): boolean {
      const player = game.players.find(p => p.socketId === socket.id);
      return player?.id === game.hostId;
    }

    // =========================================================================
    // CREATE ROOM
    // =========================================================================
    socket.on('createRoom', (data: CreateRoomData, callback: (response: CreateRoomResponse) => void) => {
      try {
        const { playerName, playerId } = data;
        if (!playerName || playerName.trim().length === 0 || !playerId) {
          callback({ success: false, error: 'Player name and ID are required' });
          return;
        }

        const roomCode = generateRoomCode();
        const game = gameManager.createGame(roomCode, playerId, socket.id, playerName.trim());
        socket.join(roomCode);

        const shareLink = generateShareableLink(roomCode, BASE_URL);

        callback({ success: true, roomCode, shareLink, game });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Created by ${playerName} (${playerId})`);
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
        const { roomCode, playerName, playerId } = data;

        if (!roomCode || !playerName || !playerId) {
          callback({ success: false, error: 'Room code, player name and ID are required' });
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

        const player: Player = {
          id: playerId,
          socketId: socket.id,
          name: playerName.trim(),
          isHost: false,
          joinedAt: Date.now(),
        };

        const result = gameManager.upsertPlayer(cleanRoomCode, player);
        if (!result) {
          callback({ success: false, error: 'Failed to join room' });
          return;
        }

        socket.join(cleanRoomCode);
        callback({ success: true, game: result.game });
        io.to(cleanRoomCode).emit('gameUpdate', result.game);
        console.log(`[Room ${cleanRoomCode}] ${playerName} ${result.action} (${playerId})`);
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

        if (!isSocketHost(game)) {
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
            currentTurnIndex: 0,
            activePlayerId: null,
            placedPlayers: [],
            initialOrder: [],
            answers: {},
            playerOrderings: {},
          },
        });

        // Mark the first question as used so it cannot appear again later
        if (!game.usedQuestionIds.includes(questionId)) {
          game.usedQuestionIds.push(questionId);
        }

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

        // Find player by socketId to get persistent UUID
        const player = game.players.find(p => p.socketId === socket.id);
        if (!player) {
          callback({ success: false, error: 'Player not found' });
          return;
        }

        game.currentRound.answers[player.id] = answer;
        player.estimation = true;

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] ${player.name} submitted answer: ${answer}`);
      } catch (error) {
        console.error('[SubmitAnswer] Error:', error);
        callback({ success: false, error: 'Failed to submit answer' });
      }
    });

    // =========================================================================
    // PROCEED TO ESTIMATION (Host moves everyone from question to estimation)
    // =========================================================================
    socket.on('proceedToEstimation', (data: GenericRoomData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        if (!isSocketHost(game)) {
          callback({ success: false, error: 'Only the host can proceed to estimation' });
          return;
        }

        // Navigate all players to estimation view
        callback({ success: true });
        io.to(roomCode).emit('navigateTo', `/estimation/${roomCode}/${game.currentRound.questionId}`);
        console.log(`[Room ${roomCode}] Proceeding to estimation view`);
      } catch (error) {
        console.error('[ProceedToEstimation] Error:', error);
        callback({ success: false, error: 'Failed to proceed to estimation' });
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

        if (!isSocketHost(game)) {
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

        if (!isSocketHost(game)) {
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

        if (!isSocketHost(game)) {
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

        if (!isSocketHost(game)) {
          callback({ success: false, error: 'Only the host can reset round' });
          return;
        }

        // Reset player estimation flags
        game.players.forEach(p => (p.estimation = false));

        // Clear current round completely
        if (game.currentRound) {
          game.currentRound.answers = {};
          game.currentRound.sortingStarted = false;
          game.currentRound.sortingFinished = false;
          game.currentRound.secondTurnStartPlayer = false;
          game.currentRound.estimationOrder = [];
          game.currentRound.currentTurnIndex = 0;
          game.currentRound.placedPlayers = [];
          game.currentRound.initialOrder = [];
          game.currentRound.activePlayerId = null;
          game.currentRound.playerOrderings = {};
        }

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Round reset`);
      } catch (error) {
        console.error('[ResetRound] Error:', error);
        callback({ success: false, error: 'Failed to reset round' });
      }
    });

    // =========================================================================
    // START NEXT QUESTION
    // =========================================================================
    socket.on('startNextQuestion', (data: StartNextQuestionData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, questionId } = data;
        const game = gameManager.getGame(roomCode);

        if (!game) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (!isSocketHost(game)) {
          callback({ success: false, error: 'Only the host can start next question' });
          return;
        }

        // Add question to used list
        if (!game.usedQuestionIds.includes(questionId)) {
          game.usedQuestionIds.push(questionId);
        }

        // Reset player estimation flags
        game.players.forEach(p => (p.estimation = false));

        // Start new round
        gameManager.updateGameState(roomCode, {
          state: 'question',
          currentRound: {
            questionId,
            sortingStarted: false,
            sortingFinished: false,
            estimationOrder: [],
            currentTurnIndex: 0,
            activePlayerId: null,
            placedPlayers: [],
            initialOrder: [],
            answers: {},
            playerOrderings: {},
          },
        });

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        io.to(roomCode).emit('navigateTo', `/question/${roomCode}/${questionId}`);
        console.log(`[Room ${roomCode}] Started next question: ${questionId}`);
      } catch (error) {
        console.error('[StartNextQuestion] Error:', error);
        callback({ success: false, error: 'Failed to start next question' });
      }
    });

    // =========================================================================
    // UPDATE PLACED PLAYERS (during estimation phase)
    // =========================================================================
    socket.on('updatePlacedPlayers', (data: UpdatePlacedPlayersData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, placedPlayers } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        // Update placed players
        game.currentRound.placedPlayers = placedPlayers;

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Updated placed players:`, placedPlayers);
      } catch (error) {
        console.error('[UpdatePlacedPlayers] Error:', error);
        callback({ success: false, error: 'Failed to update placed players' });
      }
    });

    // =========================================================================
    // SAVE PLAYER ORDER (Host sets initial estimation order)
    // =========================================================================
    socket.on('savePlayerOrder', (data: UpdateOrderData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, order } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        if (!isSocketHost(game)) {
          callback({ success: false, error: 'Only the host can save player order' });
          return;
        }

        // Update the players array order
        const orderedPlayers = order
          .map(id => game.players.find(p => p.id === id))
          .filter(p => p !== undefined);

        game.players = orderedPlayers as any[];

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Player order saved:`, order);
      } catch (error) {
        console.error('[SavePlayerOrder] Error:', error);
        callback({ success: false, error: 'Failed to save player order' });
      }
    });

    // =========================================================================
    // START ESTIMATION GAME (Host begins turn-based phase)
    // =========================================================================
    socket.on('startEstimationGame', (data: GenericRoomData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        if (!isSocketHost(game)) {
          callback({ success: false, error: 'Only the host can start estimation' });
          return;
        }

        // estimation order = all players in the host-arranged sequence
        const order = [...game.players.map(p => p.id)];

        game.currentRound.sortingStarted = true;
        game.currentRound.estimationOrder = order;
        game.currentRound.initialOrder = [...order];
        // Only P1 starts in the placed list as the anchor
        game.currentRound.placedPlayers = [order[0]];
        // P2 is the first active player (index 1); P1's turn is at index 0 and is skipped
        game.currentRound.currentTurnIndex = 1;
        game.currentRound.activePlayerId = order.length > 1 ? order[1] : null;

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
        console.log(`[Room ${roomCode}] Estimation game started (progressive mode)`);
        console.log(`[Room ${roomCode}] estimationOrder:`, order);
        console.log(`[Room ${roomCode}] placedPlayers (anchor):`, game.currentRound.placedPlayers);
        console.log(`[Room ${roomCode}] First active player: ${game.currentRound.activePlayerId} (index 1)`);
      } catch (error) {
        console.error('[StartEstimationGame] Error:', error);
        callback({ success: false, error: 'Failed to start estimation game' });
      }
    });

    // =========================================================================
    // FINISH PLAYER TURN (Player finishes placing themselves)
    // =========================================================================
    socket.on('finishPlayerTurn', (data: UpdatePlacedPlayersData, callback: (response: GenericResponse) => void) => {
      try {
        const { roomCode, placedPlayers, isSecondTurn } = data;
        const game = gameManager.getGame(roomCode);

        if (!game || !game.currentRound) {
          callback({ success: false, error: 'Invalid game state' });
          return;
        }

        const currentOrder = game.currentRound.estimationOrder || [];

        // Validate: only accept known player IDs, deduplicate
        const validPlayerIds = new Set(game.players.map(p => p.id));
        const seenIds = new Set<string>();
        const validated: string[] = [];
        for (const id of placedPlayers) {
          if (validPlayerIds.has(id) && !seenIds.has(id)) {
            validated.push(id);
            seenIds.add(id);
          }
        }

        if (isSecondTurn) {
          // P1 has finished their final second turn → round complete
          game.currentRound.placedPlayers = validated;
          game.currentRound.sortingFinished = true;
          game.currentRound.secondTurnStartPlayer = false;
          game.currentRound.activePlayerId = null;
          console.log(`[Room ${roomCode}] P1 second turn complete → sorting finished!`);
        } else {
          // Normal turn: adopt the player's submitted order as the new running list
          game.currentRound.placedPlayers = validated;

          const currentIndex = game.currentRound.currentTurnIndex ?? 1;
          const nextIndex = currentIndex + 1;

          console.log(`[Room ${roomCode}] finishPlayerTurn: index=${currentIndex}→${nextIndex}, orderLen=${currentOrder.length}`);

          if (nextIndex < currentOrder.length) {
            // More regular players to go
            game.currentRound.currentTurnIndex = nextIndex;
            game.currentRound.activePlayerId = currentOrder[nextIndex];
            game.currentRound.secondTurnStartPlayer = false;
            console.log(`[Room ${roomCode}] Next player: ${game.currentRound.activePlayerId} (index ${nextIndex})`);
          } else {
            // All players (P2..Pn) done → P1 gets second turn
            game.currentRound.currentTurnIndex = nextIndex;
            game.currentRound.activePlayerId = currentOrder[0];
            game.currentRound.secondTurnStartPlayer = true;
            console.log(`[Room ${roomCode}] All done → P1 second turn: ${currentOrder[0]}`);
          }
        }

        callback({ success: true });
        io.to(roomCode).emit('gameUpdate', game);
      } catch (error) {
        console.error('[FinishPlayerTurn] Error:', error);
        callback({ success: false, error: 'Failed to finish player turn' });
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

      // Find player by socketId
      const player = game.players.find(p => p.socketId === socket.id);
      if (!player) return;

      const isHost = game.hostId === player.id;

      if (isHost) {
        console.log(`[Room ${roomCode}] Host disconnected, starting timeout`);
        reconnectionManager.startHostTimeout(roomCode);
      } else {
        // Regular player disconnected — remove by persistent id
        gameManager.removePlayer(roomCode, player.id);
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
