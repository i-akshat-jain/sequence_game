export interface SocketPlayer {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
}

export interface GameRoom {
  id: string;
  admin: string;
  players: Map<string, SocketPlayer>;
  gameState: any;
  settings: {
    maxPlayers: number;
    turnTimeLimit: number;
    gameMode: string;
  };
  currentTurn: string;
  turnStartTime: number;
  timer: NodeJS.Timeout | null;
  lobbyState: 'waiting' | 'starting';
}

export type LobbyState = 'waiting' | 'starting';
