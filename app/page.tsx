'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GameBoard from '../components/GameBoard';
import CardHand from '../components/CardHand';
import GameControls from '../components/GameControls';
import GameLobby from '../components/GameLobby';
import WinCelebration from '../components/WinCelebration';
import StableHydration from '../components/StableHydration';
import ExtensionSafeWrapper from '../components/ExtensionSafeWrapper';
import NoSSR from '../components/NoSSR';
import { useGameStore } from '../hooks/useGameState';
import { useSocket } from '../hooks/useSocket';
import { BoardPosition } from '../types/game';

// Name Prompt Modal Component
interface NamePromptModalProps {
  roomId: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  error: string | null;
}

const NamePromptModal: React.FC<NamePromptModalProps> = ({ roomId, onSubmit, onCancel, error }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(playerName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-custom-lg p-8 border border-custom max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Join Room</h2>
          <p className="text-secondary">
            Enter your name to join room <span className="font-mono bg-slate-100 px-2 py-1 rounded">{roomId}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="input-custom w-full"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="flex-1 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Home() {
  const {
    players,
    selectedCard,
    selectedPosition,
    selectPosition,
    playCard,
    possibleMoves,
    currentPlayer,
    gamePhase,
    initializeStore,
    winner,
    resetGame,
    updateGameState
  } = useGameStore();

  const { currentRoom, userSession, sendGameAction, joinRoom, startGame, isConnected, error: socketError, clearError } = useSocket();
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  
  // Get URL search parameters and router
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomIdFromUrl = searchParams.get('room');

  // Handle connection state
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Auto-join room from URL parameter - follows strict flow
  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (typeof window === 'undefined') return;
    
    console.log('Auto-join effect - conditions:', {
      roomIdFromUrl,
      isConnected,
      isLoading,
      currentRoom: !!currentRoom,
      pendingRoomId,
      showNamePrompt,
      isJoiningRoom,
      userSession: !!userSession
    });
    
    // Only auto-join if:
    // 1. We have a room ID from URL
    // 2. We're connected to server
    // 3. Not loading
    // 4. Not already in a room
    // 5. Not currently creating/joining a room
    // 6. Not already showing name prompt
    // 7. No existing session (session will handle auto-rejoin)
    if (roomIdFromUrl && 
        isConnected && 
        !isLoading && 
        !currentRoom && 
        !pendingRoomId &&
        !showNamePrompt &&
        !isJoiningRoom &&
        !userSession) {
      console.log('Room ID from URL:', roomIdFromUrl);
      setPendingRoomId(roomIdFromUrl);
      setShowNamePrompt(true);
    }
  }, [roomIdFromUrl, isConnected, isLoading, currentRoom, pendingRoomId, showNamePrompt, isJoiningRoom, userSession]);

  // Reset game state when leaving room
  useEffect(() => {
    if (!currentRoom && gameStarted) {
      setGameStarted(false);
      setShowWinCelebration(false);
      resetGame();
    }
  }, [currentRoom, gameStarted, resetGame]);

  // Handle successful room join - follows strict flow
  useEffect(() => {
    if (currentRoom && pendingRoomId) {
      console.log('Successfully joined room:', currentRoom.id);
      setShowNamePrompt(false);
      setPendingRoomId(null);
      setIsJoiningRoom(false);
      // URL is already updated by the lobby component
    }
  }, [currentRoom, pendingRoomId]);

  // Hide name prompt if we're already in a room
  useEffect(() => {
    if (currentRoom && showNamePrompt) {
      setShowNamePrompt(false);
      setPendingRoomId(null);
      setIsJoiningRoom(false);
    }
  }, [currentRoom, showNamePrompt]);

  // Reset joining state on socket error
  useEffect(() => {
    if (socketError) {
      setIsJoiningRoom(false);
    }
  }, [socketError]);

  // Sync game state with room state
  useEffect(() => {
    if (currentRoom?.gameState) {
      updateGameState(currentRoom.gameState);
    }
  }, [currentRoom?.gameState, updateGameState]);

  // Initialize game when it starts
  useEffect(() => {
    if (gameStarted && currentRoom?.gameState && currentRoom.players.length > 0) {
      initializeStore();
    }
  }, [gameStarted, currentRoom, initializeStore]);

  const handlePositionClick = (position: BoardPosition) => {
    if (gamePhase !== 'playing') return;
    
    if (selectedCard) {
      // Check if this position is a valid move for the selected card
      const isValidMove = possibleMoves.some(
        move => move.card.id === selectedCard.id && 
                move.position.row === position.row && 
                move.position.col === position.col
      );
      
      if (isValidMove) {
        selectPosition(position);
        // Auto-play the card if both card and position are selected
        if (selectedCard && position) {
          playCard(selectedCard, position);
          
          // Send game action to other players
          if (currentRoom) {
            sendGameAction(currentRoom.id, {
              type: 'play_card',
              card: selectedCard,
              position: position
            });
          }
        }
      } else {
        // Just select the position for visual feedback
        selectPosition(position);
      }
    } else {
      // Just select the position for visual feedback
      selectPosition(position);
    }
  };

  // Initialize store on client side
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Handle win celebration
  useEffect(() => {
    if (winner && !showWinCelebration) {
      setShowWinCelebration(true);
    }
  }, [winner, showWinCelebration]);

  // Handle game start
  const handleGameStart = (roomId: string) => {
    setGameStarted(true);
    // Update URL to include room parameter
    router.push(`/?room=${roomId}`);
  };

  // Handle name prompt submission - follows strict flow
  const handleNameSubmit = (playerName: string) => {
    if (pendingRoomId && playerName.trim()) {
      console.log('Joining room with name:', playerName, 'isAdmin: false');
      setIsJoiningRoom(true);
      clearError(); // Clear any previous errors
      // Send join-room with isAdmin=false (joining existing room)
      joinRoom(pendingRoomId, playerName.trim(), false);
    }
  };

  // Handle name prompt cancellation
  const handleNameCancel = () => {
    setShowNamePrompt(false);
    setPendingRoomId(null);
    setIsJoiningRoom(false);
    clearError(); // Clear any errors
    // Remove room parameter from URL
    router.push('/');
  };

  // Check if it's the current player's turn
  const { socket } = useSocket();
  const isMyTurn = currentRoom?.gameState?.currentPlayer === currentRoom?.players.find(p => p.id === socket?.id)?.id;

  // Show loading state
  if (isLoading) {
    return (
      <ExtensionSafeWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-6"></div>
            <p className="text-secondary text-lg font-medium">Connecting to server...</p>
          </div>
        </div>
      </ExtensionSafeWrapper>
    );
  }

  // Show error state
  if (socketError && !isConnected) {
    return (
      <ExtensionSafeWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-card rounded-xl shadow-custom-lg border border-custom">
            <div className="text-red-500 text-6xl mb-6">⚠️</div>
            <h2 className="text-3xl font-bold text-primary mb-4">Connection Error</h2>
            <p className="text-secondary mb-8 text-lg">{socketError}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </ExtensionSafeWrapper>
    );
  }

  console.log('Page.tsx - Render decision:', {
    currentRoom: !!currentRoom,
    gameStarted,
    showNamePrompt,
    pendingRoomId,
    isJoiningRoom,
    shouldShowGameLobby: !currentRoom || !gameStarted
  });

  return (
    <ExtensionSafeWrapper>
      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <NamePromptModal
          roomId={pendingRoomId || ''}
          onSubmit={handleNameSubmit}
          onCancel={handleNameCancel}
          error={socketError}
        />
      )}
      
      {/* Show lobby if not in a room or game hasn't started */}
      {!currentRoom || !gameStarted ? (
        <GameLobby 
          onGameStart={handleGameStart}
          currentRoom={currentRoom}
          isConnected={isConnected}
          userSession={userSession}
          socket={socket}
          joinRoom={joinRoom}
          startGame={startGame}
          error={socketError}
          clearError={clearError}
        />
      ) : (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Sequence Game
            </h1>
            <p className="text-secondary text-lg font-mono bg-slate-100 px-3 py-1 rounded-lg inline-block">
              Room {currentRoom.id}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-secondary mb-1">Players Online</div>
            <div className="text-2xl font-bold text-primary">
              {currentRoom.players?.length || 0}
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <NoSSR fallback={<div className="text-center py-8">Loading game...</div>}>
            {/* Game Controls */}
            <div className="mb-6">
              <GameControls />
            </div>

            {/* Turn Indicator */}
            {currentRoom.gameState?.gamePhase === 'playing' && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-800 mb-2">
                    Current Turn
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {currentRoom.players?.find(p => p.id === currentRoom.gameState?.currentPlayer)?.name}
                  </div>
                  {!isMyTurn && (
                    <p className="text-sm text-secondary mt-3">
                      Wait for your turn to play
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Game Board */}
            <div className="mb-8">
              <GameBoard onPositionClick={handlePositionClick} />
            </div>

            {/* Player Hands */}
            {currentRoom.gameState?.gamePhase === 'playing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentRoom.gameState.players.map((player: any) => (
                  <CardHand 
                    key={player.id} 
                    playerId={player.id}
                    isMyTurn={isMyTurn}
                    isCurrentPlayer={player.id === currentRoom.gameState?.currentPlayer}
                  />
                ))}
              </div>
            )}
          </NoSSR>

          {/* Game Instructions */}
          <NoSSR>
            {currentRoom.gameState?.gamePhase === 'setup' && (
              <div className="bg-card p-8 rounded-xl shadow-custom-lg border border-custom mt-8">
                <h2 className="text-3xl font-bold text-primary mb-6">How to Play Sequence</h2>
                <div className="space-y-6 text-secondary">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-xl font-bold text-primary mb-3">🎯 Objective</h3>
                    <p className="text-lg">Be the first team to get 2 sequences of 5 chips in a row (horizontal, vertical, or diagonal).</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-xl font-bold text-primary mb-3">🎮 Gameplay</h3>
                    <ul className="list-disc list-inside space-y-3 text-lg">
                      <li>Each player is dealt 7 cards (2 players) or 6 cards (3-4 players)</li>
                      <li>On your turn, play a card and place a chip on the corresponding board position</li>
                      <li>Two-eyed Jacks can be placed anywhere on the board</li>
                      <li>One-eyed Jacks can remove any opponent's chip</li>
                      <li>Jokers can be placed anywhere on the board</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-xl font-bold text-primary mb-3">🏆 Winning</h3>
                    <p className="text-lg">First team to get 2 sequences of 5 chips in a row wins the game!</p>
                  </div>
                </div>
              </div>
            )}
          </NoSSR>
        </div>
      </div>

        {/* Win Celebration Modal */}
        {showWinCelebration && winner && (
          <WinCelebration
            winningTeam={winner}
            onClose={() => setShowWinCelebration(false)}
          />
        )}
      </div>
      )}
    </ExtensionSafeWrapper>
  );
}