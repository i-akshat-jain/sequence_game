const { Server } = require('socket.io');

// Game rooms storage
const gameRooms = new Map();

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SITE_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (data) => {
      console.log('🚪 Join room request:', data);
      const { roomId, playerName, isAdmin = false } = data;
      
      // Validate input
      if (!roomId || !playerName) {
        socket.emit('error', { message: 'Room ID and player name are required' });
        return;
      }

      if (roomId.length < 3 || roomId.length > 10) {
        socket.emit('invalid-room-id');
        return;
      }

      if (playerName.length < 1 || playerName.length > 20) {
        socket.emit('error', { message: 'Player name must be between 1 and 20 characters' });
        return;
      }

      // Check if room exists, if not create it
      if (!gameRooms.has(roomId)) {
        // Only allow creating rooms if isAdmin is true or if it's a new room
        if (!isAdmin) {
          socket.emit('room-not-found');
          return;
        }
        
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

      const room = gameRooms.get(roomId);
      
      // Check if room is full
      if (room.players.size >= room.settings.maxPlayers) {
        socket.emit('room-full');
        return;
      }

      // Check if name is already taken in this room
      const existingPlayer = Array.from(room.players.values()).find(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (existingPlayer) {
        // If it's the same player reconnecting, update their socket ID
        if (existingPlayer.isAdmin === isAdmin) {
          console.log('🔄 Player reconnecting, updating socket ID from', existingPlayer.id, 'to', socket.id);
          room.players.delete(existingPlayer.id);
        } else {
          socket.emit('name-taken');
          return;
        }
      }

      socket.join(roomId);
      room.players.set(socket.id, {
        id: socket.id,
        name: playerName,
        isAdmin: isAdmin, // Only set admin based on the isAdmin parameter
        isConnected: true
      });

      console.log('✅ Player added to room:', {
        socketId: socket.id,
        playerName,
        isAdmin,
        roomId,
        totalPlayers: room.players.size
      });

      socket.emit('joined-room', {
        id: roomId,
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
    socket.on('start-game', (data) => {
      console.log('🎮 Start game request received:', data);
      const { roomId, settings } = data;
      const room = gameRooms.get(roomId);
      
      console.log('🎮 Room found:', !!room);
      console.log('🎮 Socket ID:', socket.id);
      console.log('🎮 All players in room:', Array.from(room?.players.keys() || []));
      console.log('🎮 All players data:', Array.from(room?.players.values() || []));
      console.log('🎮 Player in room:', room?.players.get(socket.id));
      console.log('🎮 Is admin:', room?.players.get(socket.id)?.isAdmin);
      
      if (!room || room.players.get(socket.id)?.isAdmin !== true) {
        console.log('❌ Start game failed - not admin or room not found');
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
          const currentPlayerIndex = room.gameState.players.findIndex(p => p.id === room.currentTurn);
          const nextPlayerIndex = (currentPlayerIndex + 1) % room.gameState.players.length;
          room.currentTurn = room.gameState.players[nextPlayerIndex].id;
          room.gameState.currentPlayer = room.currentTurn;
          room.turnStartTime = Date.now();
          
          io.to(roomId).emit('turn-passed', {
            currentPlayer: room.currentTurn,
            gameState: room.gameState
          });
        }
      }, 1000);

      // Update lobby state
      room.lobbyState = 'starting';

      console.log('🎉 Emitting game-started event to room:', roomId);
      console.log('🎉 Game state:', room.gameState);
      
      io.to(roomId).emit('game-started', {
        gameState: room.gameState,
        settings: room.settings,
        currentPlayer: room.currentTurn,
        lobbyState: room.lobbyState
      });
      
      console.log('✅ Game started successfully!');
    });

    // Game action
    socket.on('game-action', (data) => {
      const { roomId, action } = data;
      const room = gameRooms.get(roomId);
      
      if (!room || !room.gameState) return;

      // Process game action here (play card, pass turn, etc.)
      // This would integrate with your existing game logic
      
      io.to(roomId).emit('game-update', {
        gameState: room.gameState,
        action
      });
    });

    // Handle reconnection - update socket ID if player exists
    socket.on('reconnect', () => {
      console.log('User reconnected:', socket.id);
      // The reconnection logic will be handled in the join-room event
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

module.exports = { initializeSocket };
