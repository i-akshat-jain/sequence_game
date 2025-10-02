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
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Sequence Game</h2>
          <p className="text-gray-600 text-lg mb-8">
            A strategy game where you try to get 5 chips in a row!
          </p>
          <button
            onClick={handleNewGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Game Over! 🎉
          </h2>
          <p className="text-2xl text-gray-600 mb-8">
            {winner === 'team1' ? 'Team 1 Wins!' : 'Team 2 Wins!'}
          </p>
          <button
            onClick={handleNewGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Current Turn: {currentPlayerData?.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Team: {currentPlayerData?.team}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
            Team 1 Sequences: {getTeamSequences('team1')}
          </div>
          <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-lg border border-green-200 mt-2">
            Team 2 Sequences: {getTeamSequences('team2')}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {selectedCard && selectedPosition ? (
          <button
            onClick={handlePlayCard}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
          >
            Play Card
          </button>
        ) : (
          <button
            disabled
            className="bg-gray-300 text-gray-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed"
          >
            Select Card & Position
          </button>
        )}
        
        <button
          onClick={handlePassTurn}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          Pass Turn
        </button>
        
        <button
          onClick={handleResetSelection}
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          Reset Selection
        </button>
      </div>

      {selectedCard && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">
            <strong>Selected Card:</strong> {selectedCard.rank} of {selectedCard.suit}
            {selectedCard.isJoker && ' (Joker)'}
          </p>
          {selectedPosition && (
            <p className="text-sm text-blue-800 font-medium mt-1">
              <strong>Selected Position:</strong> ({selectedPosition.row}, {selectedPosition.col})
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-3">How to Play:</p>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
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
