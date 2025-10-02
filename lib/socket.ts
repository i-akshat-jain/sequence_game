import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { GameRoom } from '../types/socket';

// Game rooms storage
const gameRooms = new Map<string, GameRoom>();

let io: SocketIOServer | null = null;

export function initializeSocket(server: NetServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SITE_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (data: { roomId: string; playerName: string; isAdmin?: boolean }) => {
      const { roomId, playerName, isAdmin = false } = data;
      
      if (!gameRooms.has(roomId)) {
        // Create new room
        gameRooms.set(roomId, {
          id: roomId,
          admin: socket.id,
          players: new Map(),
          gameState: null,
          settings: {
            maxPlayers: 4,
            turnTimeLimit: 60,
            gameMode: 'classic'
          },
          currentTurn: '',
          turnStartTime: 0,
          timer: null,
          lobbyState: 'waiting' // 'waiting' | 'starting'
        });
      }

      const room = gameRooms.get(roomId)!;
      
      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit('room-full');
        return;
      }

      socket.join(roomId);
      room.players.set(socket.id, {
        id: socket.id,
        name: playerName,
        isAdmin: isAdmin, // Only set admin based on the isAdmin parameter
        isConnected: true
      });

      socket.emit('joined-room', {
        roomId,
        players: Array.from(room.players.values()),
        settings: room.settings,
        gameState: room.gameState,
        lobbyState: room.lobbyState
      });

      socket.to(roomId).emit('player-joined', {
        player: room.players.get(socket.id),
        players: Array.from(room.players.values())
      });
    });

    // Start game
    socket.on('start-game', (data: { roomId: string; settings?: any }) => {
      const { roomId, settings } = data;
      const room = gameRooms.get(roomId);
      
      if (!room || room.players.get(socket.id)?.isAdmin !== true) {
        socket.emit('error', { message: 'Only admin can start the game' });
        return;
      }

      if (room.players.size < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Update settings if provided
      if (settings) {
        room.settings = { ...room.settings, ...settings };
      }

      // Initialize game state
      room.gameState = {
        players: Array.from(room.players.values()).map((player, index) => ({
          id: player.id,
          name: player.name,
          team: index < 2 ? 'team1' : 'team2',
          hand: [],
          isActive: index === 0
        })),
        currentPlayer: Array.from(room.players.values())[0].id,
        board: Array(10).fill(null).map(() => Array(10).fill(null)),
        deck: [],
        discardPile: [],
        gamePhase: 'playing',
        sequences: [],
        winner: null
      };

      room.currentTurn = room.gameState.currentPlayer;
      room.turnStartTime = Date.now();

      // Start turn timer
      if (room.timer) clearInterval(room.timer);
      room.timer = setInterval(() => {
        const elapsed = (Date.now() - room.turnStartTime) / 1000;
        if (elapsed >= room.settings.turnTimeLimit) {
          // Auto-pass turn
          const currentPlayerIndex = room.gameState.players.findIndex((p: any) => p.id === room.currentTurn);
          const nextPlayerIndex = (currentPlayerIndex + 1) % room.gameState.players.length;
          room.currentTurn = room.gameState.players[nextPlayerIndex].id;
          room.gameState.currentPlayer = room.currentTurn;
          room.turnStartTime = Date.now();
          
          io!.to(roomId).emit('turn-passed', {
            currentPlayer: room.currentTurn,
            gameState: room.gameState
          });
        }
      }, 1000);

      // Update lobby state
      room.lobbyState = 'starting';

      io!.to(roomId).emit('game-started', {
        gameState: room.gameState,
        settings: room.settings,
        currentPlayer: room.currentTurn,
        lobbyState: room.lobbyState
      });
    });

    // Game action
    socket.on('game-action', (data: { roomId: string; action: any }) => {
      const { roomId, action } = data;
      const room = gameRooms.get(roomId);
      
      if (!room || !room.gameState) return;

      // Process game action here (play card, pass turn, etc.)
      // This would integrate with your existing game logic
      
      io!.to(roomId).emit('game-update', {
        gameState: room.gameState,
        action
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Find and remove player from all rooms
      for (const [roomId, room] of gameRooms.entries()) {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id);
          
          if (room.players.size === 0) {
            // Clean up empty room
            if (room.timer) clearInterval(room.timer);
            gameRooms.delete(roomId);
          } else {
            // Notify other players
            socket.to(roomId).emit('player-left', {
              playerId: socket.id,
              players: Array.from(room.players.values())
            });
          }
          break;
        }
      }
    });
  });

  return io;
}

export function getSocketIO() {
  return io;
}
