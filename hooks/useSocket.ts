'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { sessionStorage, UserSession } from '../lib/sessionStorage';

interface GameRoom {
  id: string;
  players: Array<{
    id: string;
    name: string;
    isAdmin: boolean;
    isConnected: boolean;
  }>;
  settings: {
    maxPlayers: number;
    turnTimeLimit: number;
    gameMode: string;
  };
  gameState: any;
  lobbyState: 'waiting' | 'starting';
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: GameRoom | null;
  userSession: UserSession | null;
  joinRoom: (roomId: string, playerName: string, isAdmin?: boolean) => void;
  startGame: (roomId: string, settings?: any) => void;
  sendGameAction: (roomId: string, action: any) => void;
  leaveRoom: (roomId: string) => void;
  clearError: () => void;
  error: string | null;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Load existing session
    const existingSession = sessionStorage.loadSession();
    if (existingSession) {
      setUserSession(existingSession);
      console.log('✅ Session loaded from localStorage:', existingSession);
    } else {
      console.log('❌ No existing session found');
    }

    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'
      : 'http://localhost:3000', {
      path: '/api/socket',
      autoConnect: false,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      // Clear room state on disconnect
      setCurrentRoom(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      if (err.message.includes('xhr poll error') || err.message.includes('polling error')) {
        setError('Connection failed - trying to reconnect...');
        // Attempt to reconnect after a short delay
        setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }, 2000);
      } else {
        setError('Failed to connect to server');
      }
    });

    // Room event handlers
    newSocket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      console.log('Room data structure:', {
        id: data.id,
        players: data.players,
        settings: data.settings,
        gameState: data.gameState,
        lobbyState: data.lobbyState,
        readyPlayers: data.readyPlayers
      });
      setCurrentRoom(data);
      setError(null);
      
      // Save session with room info
      const currentPlayer = data.players.find((p: any) => p.id === newSocket.id);
      if (currentPlayer && newSocket.id) {
        const session: UserSession = {
          userId: newSocket.id,
          playerName: currentPlayer.name,
          currentRoomId: data.id,
          isAdmin: currentPlayer.isAdmin,
          lastActivity: Date.now()
        };
        sessionStorage.saveSession(session);
        setUserSession(session);
        console.log('💾 Session saved to localStorage:', session);
      }
    });

    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, players: data.players };
      });
    });

    newSocket.on('player-left', (data) => {
      console.log('Player left:', data);
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, players: data.players };
      });
    });

    newSocket.on('game-started', (data) => {
      console.log('Game started:', data);
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, gameState: data.gameState };
      });
    });

    newSocket.on('game-update', (data) => {
      console.log('Game update:', data);
      setCurrentRoom(prev => {
        if (!prev) return null;
        return { ...prev, gameState: data.gameState };
      });
    });

    newSocket.on('turn-passed', (data) => {
      console.log('Turn passed:', data);
      setCurrentRoom(prev => {
        if (!prev || !prev.gameState) return prev;
        return { 
          ...prev, 
          gameState: { ...prev.gameState, currentPlayer: data.currentPlayer }
        };
      });
    });

    newSocket.on('room-full', () => {
      setError('Room is full. Please try joining another room.');
    });

    newSocket.on('room-not-found', () => {
      setError('Room not found. Please check the room ID and try again.');
    });

    newSocket.on('invalid-room-id', () => {
      setError('Invalid room ID. Please check the room ID and try again.');
    });

    newSocket.on('name-taken', () => {
      setError('Name is already taken in this room. Please choose a different name.');
    });

    newSocket.on('error', (data) => {
      setError(data.message || 'An error occurred. Please try again.');
    });

    // Connect
    newSocket.connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setCurrentRoom(null);
      setError(null);
    };
  }, []);

  // Auto-rejoin when both socket is connected and user has a session
  useEffect(() => {
    if (socket && isConnected && userSession && userSession.currentRoomId && !currentRoom) {
      console.log('🔄 Auto-rejoining room:', userSession.currentRoomId, 'as', userSession.playerName);
      socket.emit('join-room', {
        roomId: userSession.currentRoomId,
        playerName: userSession.playerName,
        isAdmin: userSession.isAdmin
      });
    }
  }, [socket, isConnected, userSession, currentRoom]);

  const joinRoom = useCallback((roomId: string, playerName: string, isAdmin: boolean = false) => {
    if (socket) {
      socket.emit('join-room', { roomId, playerName, isAdmin });
      
      // Update session with new room attempt
      sessionStorage.updateSession({
        currentRoomId: roomId,
        playerName: playerName,
        isAdmin: isAdmin
      });
    }
  }, [socket]);

  const startGame = useCallback((roomId: string, settings?: any) => {
    if (socket) {
      socket.emit('start-game', { roomId, settings });
    }
  }, [socket]);

  const sendGameAction = useCallback((roomId: string, action: any) => {
    if (socket) {
      socket.emit('game-action', { roomId, action });
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('leave-room', { roomId });
      setCurrentRoom(null);
      
      // Clear session when leaving room
      sessionStorage.updateSession({
        currentRoomId: null
      });
      setUserSession(prev => prev ? { ...prev, currentRoomId: null } : null);
    }
  }, [socket]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    socket,
    isConnected,
    currentRoom,
    userSession,
    joinRoom,
    startGame,
    sendGameAction,
    leaveRoom,
    clearError,
    error
  };
}
