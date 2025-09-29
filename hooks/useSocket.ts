'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

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
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: GameRoom | null;
  joinRoom: (roomId: string, playerName: string, isAdmin?: boolean) => void;
  startGame: (roomId: string, settings?: any) => void;
  sendGameAction: (roomId: string, action: any) => void;
  leaveRoom: (roomId: string) => void;
  error: string | null;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
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
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      if (err.message.includes('xhr poll error') || err.message.includes('polling error')) {
        setError('Connection failed - trying to reconnect...');
        // Attempt to reconnect after a short delay
        setTimeout(() => {
          if (socketRef.current) {
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
      setCurrentRoom(data);
      setError(null);
    });

    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
      if (currentRoom) {
        setCurrentRoom(prev => prev ? { ...prev, players: data.players } : null);
      }
    });

    newSocket.on('player-left', (data) => {
      console.log('Player left:', data);
      if (currentRoom) {
        setCurrentRoom(prev => prev ? { ...prev, players: data.players } : null);
      }
    });

    newSocket.on('game-started', (data) => {
      console.log('Game started:', data);
      if (currentRoom) {
        setCurrentRoom(prev => prev ? { ...prev, gameState: data.gameState } : null);
      }
    });

    newSocket.on('game-update', (data) => {
      console.log('Game update:', data);
      if (currentRoom) {
        setCurrentRoom(prev => prev ? { ...prev, gameState: data.gameState } : null);
      }
    });

    newSocket.on('turn-passed', (data) => {
      console.log('Turn passed:', data);
      if (currentRoom) {
        setCurrentRoom(prev => prev ? { 
          ...prev, 
          gameState: { ...prev.gameState, currentPlayer: data.currentPlayer }
        } : null);
      }
    });

    newSocket.on('room-full', () => {
      setError('Room is full');
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    // Connect
    newSocket.connect();

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = (roomId: string, playerName: string, isAdmin: boolean = false) => {
    if (socket) {
      socket.emit('join-room', { roomId, playerName, isAdmin });
    }
  };

  const startGame = (roomId: string, settings?: any) => {
    if (socket) {
      socket.emit('start-game', { roomId, settings });
    }
  };

  const sendGameAction = (roomId: string, action: any) => {
    if (socket) {
      socket.emit('game-action', { roomId, action });
    }
  };

  const leaveRoom = (roomId: string) => {
    if (socket) {
      socket.emit('leave-room', { roomId });
      setCurrentRoom(null);
    }
  };

  return {
    socket,
    isConnected,
    currentRoom,
    joinRoom,
    startGame,
    sendGameAction,
    leaveRoom,
    error
  };
}
