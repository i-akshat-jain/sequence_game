'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

interface GameLobbyProps {
  onGameStart: (roomId: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onGameStart }) => {
  const { socket, isConnected, currentRoom, joinRoom, startGame, error } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: 4,
    turnTimeLimit: 60,
    gameMode: 'classic'
  });
  const [timeLeft, setTimeLeft] = useState(0);

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

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    
    const newRoomId = generateRoomId();
    setIsCreatingRoom(true);
    joinRoom(newRoomId, playerName, true);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    joinRoom(roomId, playerName, false);
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

  if (!isConnected) {
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
    const isAdmin = currentRoom.players.find(p => p.id === socket?.id)?.isAdmin;
    const currentPlayer = currentRoom.players.find(p => p.id === socket?.id);

    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Game Room: {currentRoom.id}</h1>
              {isAdmin && (
                <button
                  onClick={copyRoomLink}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  📋 Copy Room Link
                </button>
              )}
            </div>

            {/* Timer */}
            {currentRoom.gameState?.gamePhase === 'playing' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Turn Timer:</span>
                  <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`}>
                    {timeLeft}s
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${(timeLeft / currentRoom.settings.turnTimeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Players ({currentRoom.players.length}/{currentRoom.settings.maxPlayers})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentRoom.players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border-2 ${
                      player.id === socket?.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{player.name}</span>
                      <div className="flex items-center space-x-2">
                        {player.isAdmin && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Admin
                          </span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Settings (Admin Only) */}
            {isAdmin && !currentRoom.gameState && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Players
                    </label>
                    <select
                      value={gameSettings.maxPlayers}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Turn Time (seconds)
                    </label>
                    <select
                      value={gameSettings.turnTimeLimit}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, turnTimeLimit: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                      <option value={90}>90 seconds</option>
                      <option value={120}>120 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Game Mode
                    </label>
                    <select
                      value={gameSettings.gameMode}
                      onChange={(e) => setGameSettings(prev => ({ ...prev, gameMode: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="classic">Classic</option>
                      <option value="speed">Speed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {isAdmin && !currentRoom.gameState && (
                <button
                  onClick={handleStartGame}
                  disabled={currentRoom.players.length < 2}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Start Game
                </button>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Leave Room
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Sequence Game
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                disabled={!playerName.trim() || isCreatingRoom}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {isCreatingRoom ? 'Creating Room...' : 'Create New Room'}
              </button>

              <div className="text-center text-gray-500">or</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter room ID"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomId.trim()}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Join Room
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;

