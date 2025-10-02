'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
}

interface WaitingLobbyProps {
  roomId: string;
  players: Player[];
  lobbyState: 'waiting' | 'starting';
  onGameStart: () => void;
}

const WaitingLobby: React.FC<WaitingLobbyProps> = ({
  roomId,
  players,
  lobbyState,
  onGameStart
}) => {
  const { socket, userSession } = useSocket();

  // Check if current user is admin
  const isAdmin = userSession?.isAdmin || false;
  const currentPlayer = players.find(p => p.id === userSession?.userId);
  
  console.log('WaitingLobby - RENDERED!');
  console.log('WaitingLobby - userSession:', userSession);
  console.log('WaitingLobby - isAdmin:', isAdmin);
  console.log('WaitingLobby - currentPlayer:', currentPlayer);
  console.log('WaitingLobby - players:', players);
  console.log('WaitingLobby - roomId:', roomId);
  console.log('WaitingLobby - lobbyState:', lobbyState);

  // Handle start game
  const handleStartGame = () => {
    if (socket && roomId) {
      socket.emit('start-game', { roomId });
    }
  };

  // Listen for game started
  useEffect(() => {
    if (socket) {
      const handleGameStarted = () => {
        onGameStart();
      };

      socket.on('game-started', handleGameStarted);

      return () => {
        socket.off('game-started', handleGameStarted);
      };
    }
  }, [socket, onGameStart]);

  const totalPlayers = players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Waiting Lobby</h1>
          <p className="text-blue-200 text-lg">Room: <span className="font-mono font-bold text-yellow-300">{roomId}</span></p>
        </div>

        {/* Players List */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Players ({totalPlayers}/4)</h2>
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 bg-gray-500/20 border-gray-400 text-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    player.isConnected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="font-medium">{player.name}</span>
                  {player.isAdmin && (
                    <span className="px-2 py-1 bg-yellow-500/30 text-yellow-200 text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  {player.isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waiting Message */}
        <div className="mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              Waiting for Admin to Start Game
            </div>
            <p className="text-blue-200">
              {totalPlayers < 2
                ? `Need at least 2 players to start. Currently ${totalPlayers}/4 players.`
                : `Ready to start! ${totalPlayers}/4 players in room.`
              }
            </p>
          </div>
        </div>

        {/* Start Game Button (Admin only) */}
        {isAdmin && (
          <div className="text-center">
            <button
              onClick={handleStartGame}
              disabled={totalPlayers < 2}
              className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform ${
                totalPlayers >= 2
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              {totalPlayers < 2
                ? 'Need at least 2 players'
                : 'Start Game'
              }
            </button>
          </div>
        )}

        {/* Lobby State Indicator */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            lobbyState === 'waiting'
              ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400'
              : 'bg-blue-500/20 text-blue-200 border border-blue-400'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              lobbyState === 'waiting'
                ? 'bg-yellow-400'
                : 'bg-blue-400'
            }`} />
            {lobbyState === 'waiting' && 'Waiting for admin to start game'}
            {lobbyState === 'starting' && 'Game is starting...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingLobby;
