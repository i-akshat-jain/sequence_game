'use client';

import React, { useEffect } from 'react';
import GameBoard from '../components/GameBoard';
import CardHand from '../components/CardHand';
import GameControls from '../components/GameControls';
import NoSSR from '../components/NoSSR';
import { useGameStore } from '../hooks/useGameState';
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
    initializeStore
  } = useGameStore();

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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Sequence Game
        </h1>
        
        <div className="max-w-6xl mx-auto">
          <NoSSR fallback={<div className="text-center py-8">Loading game...</div>}>
            {/* Game Controls */}
            <div className="mb-6">
              <GameControls />
            </div>

            {/* Game Board */}
            <div className="mb-8">
              <GameBoard onPositionClick={handlePositionClick} />
            </div>

            {/* Player Hands */}
            {gamePhase === 'playing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {players.map((player) => (
                  <CardHand key={player.id} playerId={player.id} />
                ))}
              </div>
            )}
          </NoSSR>

          {/* Game Instructions */}
          <NoSSR>
            {gamePhase === 'setup' && (
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
    </div>
  );
}