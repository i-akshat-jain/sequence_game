'use client';

import React from 'react';
import { Card } from '../types/game';
import { useGameStore } from '../hooks/useGameState';

interface CardHandProps {
  playerId: string;
  isMyTurn?: boolean;
  isCurrentPlayer?: boolean;
}

const CardHand: React.FC<CardHandProps> = ({ playerId, isMyTurn = false, isCurrentPlayer = false }) => {
  const { players, selectedCard, selectCard, currentPlayer } = useGameStore();
  
  const player = players.find(p => p.id === playerId);
  if (!player) return null;

  const getCardDisplay = (card: Card) => {
    if (card.isJoker) {
      return '🃏';
    }
    
    const suitSymbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    };
    
    return `${card.rank}${suitSymbols[card.suit]}`;
  };

  const getCardColor = (card: Card) => {
    if (card.isJoker) return 'text-purple-600';
    return card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black';
  };

  const getCardClass = (card: Card) => {
    const baseClass = "w-16 h-20 border-2 rounded-lg flex flex-col items-center justify-center text-sm font-bold transition-all duration-200 shadow-sm";
    const isSelected = selectedCard?.id === card.id;
    const isPlayable = isMyTurn && isCurrentPlayer;
    
    let additionalClass = "";
    
    if (isSelected) {
      additionalClass = "border-yellow-500 bg-yellow-100 transform scale-105 shadow-lg";
    } else if (isPlayable) {
      additionalClass = "border-gray-400 bg-white hover:border-blue-400 hover:bg-blue-50 hover:scale-105 hover:shadow-md cursor-pointer";
    } else {
      additionalClass = "border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed";
    }
    
    return `${baseClass} ${additionalClass}`;
  };

  const handleCardClick = (card: Card) => {
    if (isMyTurn && isCurrentPlayer) {
      selectCard(selectedCard?.id === card.id ? null : card);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-green-50 p-6 rounded-xl shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {player.name}
          </h3>
          {isCurrentPlayer && (
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {isMyTurn ? 'Your Turn' : 'Current Turn'}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
          {player.hand.length} cards
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 justify-center">
        {player.hand.map((card) => (
          <div
            key={card.id}
            className={getCardClass(card)}
            onClick={() => handleCardClick(card)}
            title={`${card.rank} of ${card.suit}${card.isJoker ? ' (Joker)' : ''}`}
          >
            <div className={`text-lg ${getCardColor(card)}`}>
              {getCardDisplay(card)}
            </div>
            {card.jackType && (
              <div className="text-xs text-gray-500 mt-1 font-medium">
                {card.jackType === 'two-eyed' ? 'Any' : 'Remove'}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {isCurrentPlayer && selectedCard && (
        <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">
            Selected: {getCardDisplay(selectedCard)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Click on a valid board position to play this card
          </p>
        </div>
      )}
    </div>
  );
};

export default CardHand;
