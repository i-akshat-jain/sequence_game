'use client';

import React from 'react';
import { useGameStore } from '../hooks/useGameState';

const GameControls: React.FC = () => {
  const {
    gamePhase,
    currentPlayer,
    players,
    selectedCard,
    selectedPosition,
    playCard,
    passTurn,
    resetSelection,
    initializeNewGame,
    winner,
    sequences
  } = useGameStore();

  const currentPlayerData = players.find(p => p.id === currentPlayer);

  const handlePlayCard = () => {
    if (selectedCard && selectedPosition) {
      playCard(selectedCard, selectedPosition);
    }
  };

  const handlePassTurn = () => {
    passTurn();
  };

  const handleNewGame = () => {
    initializeNewGame(2); // Default to 2 players
  };

  const handleResetSelection = () => {
    resetSelection();
  };

  const getTeamSequences = (team: string) => {
    return sequences.filter(seq => seq.team === team).length;
  };

  if (gamePhase === 'setup') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Sequence Game</h2>
        <p className="text-gray-600 text-center mb-6">
          A strategy game where you try to get 5 chips in a row!
        </p>
        <div className="text-center">
          <button
            onClick={handleNewGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          Game Over! 🎉
        </h2>
        <p className="text-xl text-center mb-4">
          {winner === 'team1' ? 'Team 1 Wins!' : 'Team 2 Wins!'}
        </p>
        <div className="text-center">
          <button
            onClick={handleNewGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            Current Turn: {currentPlayerData?.name}
          </h3>
          <p className="text-sm text-gray-600">
            Team: {currentPlayerData?.team}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">
            Team 1 Sequences: {getTeamSequences('team1')}
          </div>
          <div className="text-sm text-gray-600">
            Team 2 Sequences: {getTeamSequences('team2')}
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        {selectedCard && selectedPosition ? (
          <button
            onClick={handlePlayCard}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Play Card
          </button>
        ) : (
          <button
            disabled
            className="bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed"
          >
            Select Card & Position
          </button>
        )}
        
        <button
          onClick={handlePassTurn}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Pass Turn
        </button>
        
        <button
          onClick={handleResetSelection}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Reset Selection
        </button>
      </div>

      {selectedCard && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Selected Card:</strong> {selectedCard.rank} of {selectedCard.suit}
            {selectedCard.isJoker && ' (Joker)'}
          </p>
          {selectedPosition && (
            <p className="text-sm text-blue-800">
              <strong>Selected Position:</strong> ({selectedPosition.row}, {selectedPosition.col})
            </p>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p><strong>How to Play:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Select a card from your hand</li>
          <li>Click on a valid board position</li>
          <li>Get 5 chips in a row to create a sequence</li>
          <li>First team to get 2 sequences wins!</li>
        </ul>
      </div>
    </div>
  );
};

export default GameControls;
