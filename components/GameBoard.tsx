'use client';

import React from 'react';
import { BoardPosition, Chip } from '../types/game';
import { useGameStore } from '../hooks/useGameState';

interface GameBoardProps {
  onPositionClick?: (position: BoardPosition) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ onPositionClick }) => {
  const { board, boardLayout, selectedPosition, possibleMoves, sequences } = useGameStore();

  const getPositionClass = (row: number, col: number) => {
    const baseClass = "w-12 h-12 border border-gray-300 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200";
    
    // Check if this position is in a sequence
    const isInSequence = sequences.some(seq => 
      seq.positions.some(pos => pos.row === row && pos.col === col)
    );
    
    // Check if this position is a possible move
    const isPossibleMove = possibleMoves.some(move => 
      move.position.row === row && move.position.col === col
    );
    
    // Check if this position is selected
    const isSelected = selectedPosition?.row === row && selectedPosition?.col === col;
    
    let additionalClass = "";
    
    if (isInSequence) {
      additionalClass = "bg-green-200 border-green-500";
    } else if (isPossibleMove) {
      additionalClass = "bg-blue-100 border-blue-400 hover:bg-blue-200";
    } else if (isSelected) {
      additionalClass = "bg-yellow-200 border-yellow-500";
    } else {
      additionalClass = "bg-white hover:bg-gray-50";
    }
    
    return `${baseClass} ${additionalClass}`;
  };

  const getChipColor = (chip: Chip) => {
    const colors = {
      player1: 'bg-red-500',
      player2: 'bg-blue-500', 
      player3: 'bg-green-500',
      player4: 'bg-yellow-500'
    };
    return colors[chip.playerId] || 'bg-gray-500';
  };

  const getCardDisplay = (row: number, col: number) => {
    const positionKey = `${row}-${col}`;
    const layout = boardLayout[positionKey];
    
    if (!layout) return '';
    
    const { suit, rank } = layout.card;
    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    
    return `${rank}${suitSymbols[suit]}`;
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="grid grid-cols-10 gap-1 max-w-2xl mx-auto">
        {Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 10 }, (_, col) => {
            const chip = board[row][col];
            const cardDisplay = getCardDisplay(row, col);
            
            return (
              <div
                key={`${row}-${col}`}
                className={getPositionClass(row, col)}
                onClick={() => onPositionClick?.({ row, col })}
                title={`${cardDisplay} (${row}, ${col})`}
              >
                {chip ? (
                  <div className={`w-8 h-8 rounded-full ${getChipColor(chip)} border-2 border-white shadow-sm`} />
                ) : (
                  <span className="text-gray-600 text-xs">{cardDisplay}</span>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Player 1</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span>Player 2</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Player 3</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span>Player 4</span>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
