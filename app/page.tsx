'use client';

import React, { useEffect, useState } from 'react';
import GameBoard from '../components/GameBoard';
import CardHand from '../components/CardHand';
import GameControls from '../components/GameControls';
import GameLobby from '../components/GameLobby';
import WinCelebration from '../components/WinCelebration';
import StableHydration from '../components/StableHydration';
import NoSSR from '../components/NoSSR';
import { useGameStore } from '../hooks/useGameState';
import { useSocket } from '../hooks/useSocket';
import { BoardPosition } from '../types/game';

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
    winner
  } = useGameStore();

  const { currentRoom, sendGameAction } = useSocket();
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

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
  };

  // Check if it's the current player's turn
  const { socket } = useSocket();
  const isMyTurn = currentRoom?.gameState?.currentPlayer === currentRoom?.players.find(p => p.id === socket?.id)?.id;

  return (
    <StableHydration>
      {/* Show lobby if not in a room or game hasn't started */}
      {!currentRoom || !gameStarted ? (
        <GameLobby onGameStart={handleGameStart} />
      ) : (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Sequence Game - Room {currentRoom.id}
          </h1>
          <div className="text-sm text-gray-600">
            {currentRoom.players.length} players online
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
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <span className="text-lg font-semibold">
                    Current Turn: {currentRoom.players.find(p => p.id === currentRoom.gameState?.currentPlayer)?.name}
                  </span>
                  {!isMyTurn && (
                    <p className="text-sm text-gray-600 mt-1">
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
              <div className="bg-white p-6 rounded-lg shadow-md mt-8">
                <h2 className="text-2xl font-bold mb-4">How to Play Sequence</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold">Objective</h3>
                    <p>Be the first team to get 2 sequences of 5 chips in a row (horizontal, vertical, or diagonal).</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Gameplay</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Each player is dealt 7 cards (2 players) or 6 cards (3-4 players)</li>
                      <li>On your turn, play a card and place a chip on the corresponding board position</li>
                      <li>Two-eyed Jacks can be placed anywhere on the board</li>
                      <li>One-eyed Jacks can remove any opponent's chip</li>
                      <li>Jokers can be placed anywhere on the board</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Winning</h3>
                    <p>First team to get 2 sequences of 5 chips in a row wins the game!</p>
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
    </StableHydration>
  );
}