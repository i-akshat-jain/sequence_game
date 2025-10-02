'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WaitingLobby from './WaitingLobby';

interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
}

interface GameLobbyProps {
  onGameStart: (roomId: string) => void;
  currentRoom: {
    id: string;
    players: Player[];
    settings: any;
    gameState: any;
    lobbyState: 'waiting' | 'starting';
  } | null;
  isConnected: boolean;
  userSession: any;
  socket: any;
  joinRoom: (roomId: string, playerName: string, isAdmin?: boolean) => void;
  startGame: (roomId: string, settings?: any) => void;
  error: string | null;
  clearError: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ 
  onGameStart, 
  currentRoom, 
  isConnected, 
  userSession, 
  socket, 
  joinRoom, 
  startGame, 
  error, 
  clearError 
}) => {
  console.log('GameLobby - received props:', {
    socket: !!socket,
    isConnected,
    currentRoom: !!currentRoom,
    userSession: !!userSession
  });
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: 4,
    turnTimeLimit: 60,
    gameMode: 'classic'
  });
  const [timeLeft, setTimeLeft] = useState(0);

  // Pre-fill player name from session
  useEffect(() => {
    if (userSession && userSession.playerName && !playerName) {
      setPlayerName(userSession.playerName);
    }
  }, [userSession, playerName]);

  // Generate random room ID for creating rooms
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Timer effect
  useEffect(() => {
    if (currentRoom?.gameState && currentRoom.gameState.gamePhase === 'playing') {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - (currentRoom.gameState.turnStartTime || 0)) / 1000;
        const remaining = Math.max(0, currentRoom.settings.turnTimeLimit - elapsed);
        setTimeLeft(Math.ceil(remaining));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  // Reset loading states when room is joined or error occurs
  useEffect(() => {
    if (currentRoom) {
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
    }
  }, [currentRoom]);

  // Reset loading states when error occurs
  useEffect(() => {
    if (error) {
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
      setPendingRoomId(null);
    }
  }, [error]);

  // Handle successful room join - update URL after joined-room event
  useEffect(() => {
    if (currentRoom && pendingRoomId) {
      console.log('Successfully joined room:', currentRoom.id);
      // Update URL without triggering auto-join logic
      const newUrl = `/?room=${currentRoom.id}`;
      window.history.replaceState({}, '', newUrl);
      setPendingRoomId(null);
      // Clear the room ID input since we're now in the room
      setRoomId('');
    }
  }, [currentRoom, pendingRoomId]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    
    const newRoomId = generateRoomId();
    console.log('Admin creating room:', newRoomId, 'with name:', playerName);
    setIsCreatingRoom(true);
    clearError(); // Clear any previous errors
    
    // Store room ID for URL update after successful join
    setPendingRoomId(newRoomId);
    
    try {
      console.log('Sending join-room request with:', { roomId: newRoomId, playerName: playerName.trim(), isAdmin: true });
      joinRoom(newRoomId, playerName.trim(), true);
      // URL will be updated in useEffect after joined-room event
    } catch (err) {
      console.error('Failed to create room:', err);
      setIsCreatingRoom(false);
      setPendingRoomId(null);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomId.trim()) return;
    
    setIsJoiningRoom(true);
    clearError(); // Clear any previous errors
    
    // Store room ID for URL update after successful join
    setPendingRoomId(roomId.trim().toUpperCase());
    
    try {
      joinRoom(roomId.trim().toUpperCase(), playerName.trim(), false);
      // URL will be updated in useEffect after joined-room event
    } catch (err) {
      console.error('Failed to join room:', err);
      setIsJoiningRoom(false);
      setPendingRoomId(null);
    }
  };

  const handleStartGame = () => {
    if (currentRoom) {
      startGame(currentRoom.id, gameSettings);
      onGameStart(currentRoom.id);
    }
  };

  const copyRoomLink = () => {
    if (currentRoom) {
      const link = `${window.location.origin}?room=${currentRoom.id}`;
      navigator.clipboard.writeText(link);
    }
  };

  console.log('GameLobby - isConnected:', isConnected);
  console.log('GameLobby - currentRoom:', !!currentRoom);
  
  if (!isConnected) {
    console.log('GameLobby - Showing loading screen (not connected)');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (currentRoom) {
    const isAdmin = currentRoom.players?.find((p: Player) => p.id === socket?.id)?.isAdmin || userSession?.isAdmin;
    
    console.log('GameLobby - currentRoom:', currentRoom);
    console.log('GameLobby - socket?.id:', socket?.id);
    console.log('GameLobby - players:', currentRoom.players);
    console.log('GameLobby - isAdmin:', isAdmin);
    console.log('GameLobby - gameState:', currentRoom.gameState);
    console.log('GameLobby - lobbyState:', currentRoom.lobbyState);
    console.log('GameLobby - userSession:', userSession);
    console.log('GameLobby - userSession.isAdmin:', userSession?.isAdmin);
    console.log('GameLobby - condition check:', {
      hasGameState: !!currentRoom.gameState,
      gamePhase: currentRoom.gameState?.gamePhase,
      isAdmin: isAdmin,
      userSessionIsAdmin: userSession?.isAdmin,
      shouldShowWaitingLobby: (!currentRoom.gameState || currentRoom.gameState.gamePhase === 'setup') && !isAdmin
    });
    
    // Show waiting lobby only for normal players (not admins) if game hasn't started yet
    if ((!currentRoom.gameState || currentRoom.gameState.gamePhase === 'setup') && !isAdmin) {
      console.log('GameLobby - Showing WaitingLobby for normal player');
      return (
        <WaitingLobby
          roomId={currentRoom.id}
          players={currentRoom.players || []}
          lobbyState={currentRoom.lobbyState || 'waiting'}
          onGameStart={() => onGameStart(currentRoom.id)}
        />
      );
    }

    // Show admin interface if game hasn't started yet, or game interface if game is in progress
    const currentPlayer = currentRoom.players?.find((p: Player) => p.id === socket?.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card rounded-xl shadow-custom-lg p-8 border border-custom">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">Game Room</h1>
                <p className="text-secondary text-lg font-mono bg-slate-100 px-3 py-1 rounded-lg inline-block">
                  {currentRoom.id}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={copyRoomLink}
                  className="btn-secondary flex items-center gap-2"
                >
                  📋 Copy Room Link
                </button>
              )}
            </div>

            {/* Timer */}
            {currentRoom.gameState?.gamePhase === 'playing' && (
              <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-amber-800">Turn Timer</span>
                  <div className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-amber-600'}`}>
                    {timeLeft}s
                  </div>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${(timeLeft / currentRoom.settings.turnTimeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-primary mb-6">
                Players ({currentRoom.players?.length || 0}/{currentRoom.settings?.maxPlayers || 4})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRoom.players?.map((player: Player) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      player.id === socket?.id 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-custom bg-slate-50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="font-semibold text-primary">{player.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isAdmin && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Settings (Admin Only) - Show when game hasn't started */}
            {isAdmin && (!currentRoom.gameState || currentRoom.gameState.gamePhase === 'setup') && (
              <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-custom">
                <h3 className="text-xl font-bold text-primary mb-6">Game Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-3">
                      Max Players
                    </label>
                    <select
                      value={gameSettings.maxPlayers}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                      className="input-custom"
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-3">
                      Turn Time (seconds)
                    </label>
                    <select
                      value={gameSettings.turnTimeLimit}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, turnTimeLimit: parseInt(e.target.value) }))}
                      className="input-custom"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                      <option value={90}>90 seconds</option>
                      <option value={120}>120 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-3">
                      Game Mode
                    </label>
                    <select
                      value={gameSettings.gameMode}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, gameMode: e.target.value }))}
                      className="input-custom"
                    >
                      <option value="classic">Classic</option>
                      <option value="speed">Speed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Show when game hasn't started */}
            {isAdmin && (!currentRoom.gameState || currentRoom.gameState.gamePhase === 'setup') && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartGame}
                  disabled={(currentRoom.players?.length || 0) < 2}
                  className="btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none py-4 text-lg flex-1"
                >
                  {(currentRoom.players?.length || 0) < 2
                    ? 'Need at least 2 players'
                    : 'Start Game'
                  }
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg flex-1"
                >
                  Leave Room
                </button>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-card rounded-xl shadow-custom-lg p-8 border border-custom">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Sequence Game
            </h1>
            <p className="text-secondary text-lg">
              Play the classic card game online
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-primary mb-3">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input-custom"
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                disabled={!playerName.trim() || isCreatingRoom || isJoiningRoom}
                className="w-full btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none py-4 text-lg"
              >
                {isCreatingRoom ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating Room...
                  </div>
                ) : (
                  'Create New Room'
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-custom"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted font-medium">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-3">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID"
                  className="input-custom"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomId.trim() || isJoiningRoom || isCreatingRoom}
                className="w-full btn-secondary disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none py-4 text-lg"
              >
                {isJoiningRoom ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Joining Room...
                  </div>
                ) : (
                  'Join Room'
                )}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;





