export interface Player {
  id: string;           // socket.id
  name: string;
  isHost: boolean;
  joinedAt: number;
  estimation?: boolean; // Has submitted answer
}

export interface GameSession {
  roomCode: string;     // 6-char code (e.g., "AB3XK9")
  createdAt: number;
  hostId: string;       // Original host socket.id
  hostDisconnectedAt: number | null; // Timestamp when host disconnected
  state: 'waiting' | 'question' | 'estimation' | 'prepare';
  players: Player[];
  currentRound: CurrentRound | null;
  usedQuestionIds: number[];
}

export interface CurrentRound {
  questionId: number;
  sortingStarted: boolean;
  estimationOrder: string[];      // Array of player socket IDs
  activePlayerId: string | null;  // Current player's turn
  placedPlayers: string[];        // IDs of players who have placed themselves
  answers: Record<string, number>; // playerId -> answer value
}

export interface CreateRoomResponse {
  success: boolean;
  roomCode?: string;
  shareLink?: string;
  game?: GameSession;
  error?: string;
}

export interface JoinRoomData {
  roomCode: string;
  playerName: string;
}

export interface JoinRoomResponse {
  success: boolean;
  game?: GameSession;
  error?: string;
}

export interface StartGameData {
  roomCode: string;
  questionId: number;
}

export interface SubmitAnswerData {
  roomCode: string;
  answer: number;
}

export interface UpdateOrderData {
  roomCode: string;
  order: string[]; // Array of player IDs
}

export interface PlacePlayerData {
  roomCode: string;
  playerId: string;
}

export interface GenericRoomData {
  roomCode: string;
}

export interface GenericResponse {
  success: boolean;
  error?: string;
}
