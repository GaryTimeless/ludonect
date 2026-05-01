import type { Router, RouteLocationNormalized } from 'vue-router';
import { socketService } from '@/services/socketService';
import type { GameSession } from '../../server/types';

// Routes that require game state validation
const GAME_ROUTES = ['question', 'estimation', 'PrepareNextRound'] as const;

// State → route name mapping (which view is valid for each server state)
const STATE_ROUTE_MAP: Record<string, string> = {
  waiting: 'Lobby',
  question: 'question',
  estimation: 'estimation',
  prepare: 'PrepareNextRound',
};

/**
 * Returns the correct route path for the current game state.
 * Used to redirect users who land on a wrong URL.
 */
function getCorrectPath(gameState: GameSession | null): string | null {
  if (!gameState || !gameState.roomCode) return null;

  const round = gameState.currentRound;
  const code = gameState.roomCode;

  switch (gameState.state) {
    case 'question':
      return round ? `/question/${code}/${round.questionId}` : null;
    case 'estimation':
      return round ? `/estimation/${code}/${round.questionId}` : null;
    case 'prepare':
      return `/prepare/${code}`;
    default:
      return null;
  }
}

export function setupRouterGuards(router: Router) {
  router.beforeEach((to: RouteLocationNormalized) => {
    // Public routes — always allowed
    const routeName = to.name as string;
    if (!GAME_ROUTES.includes(routeName as typeof GAME_ROUTES[number])) {
      return true;
    }

    // Game routes — validate access
    const gameState = socketService.gameState.value;
    const playerId = localStorage.getItem('playerId');
    const roomCode = to.params.gameId as string | undefined;

    // 1. No game state yet (e.g. page just loaded, socket still connecting)
    //    Allow navigation — the component will re-check once gameState arrives
    if (!gameState || !gameState.roomCode) {
      console.log(`[Guard] No game state yet for ${to.path}, allowing (will validate on state update)`);
      return true;
    }

    // 2. Room code mismatch: URL says room X but actual game is room Y
    if (roomCode && roomCode !== gameState.roomCode) {
      console.log(`[Guard] Room mismatch: URL=${roomCode}, game=${gameState.roomCode}, redirecting to /`);
      return { path: '/' };
    }

    // 3. Player not in game
    if (playerId && !gameState.players.some(p => p.id === playerId)) {
      console.log(`[Guard] Player ${playerId} not in room ${gameState.roomCode}, redirecting to /`);
      return { path: '/' };
    }

    // 4. State mismatch: URL doesn't match game state
    const expectedState = STATE_ROUTE_MAP[gameState.state];
    if (expectedState && expectedState !== routeName) {
      const correctPath = getCorrectPath(gameState);
      if (correctPath && correctPath !== to.path) {
        console.log(`[Guard] State mismatch: route=${routeName}, state=${gameState.state}, redirecting to ${correctPath}`);
        return { path: correctPath };
      }
    }

    return true;
  });
}
