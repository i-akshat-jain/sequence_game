'use client';

import React, { useState } from 'react';

interface GameTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const GameTutorial: React.FC<GameTutorialProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Welcome to Sequence!",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">Sequence is a strategy game that combines cards and chips.</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🎯 Objective</h3>
            <p className="text-blue-700">Be the first team to create the required number of sequences (rows of 5 chips).</p>
            <ul className="mt-2 text-sm text-blue-600">
              <li>• 2 players/teams: Need 2 sequences to win</li>
              <li>• 3+ players/teams: Need 1 sequence to win</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "The Game Board",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">The board has 100 positions with cards and 4 free corner spaces.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📋 Card Positions</h3>
              <p className="text-green-700 text-sm">Each card appears twice on the board. Play a card to place a chip on one of its positions.</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⭐ Free Spaces</h3>
              <p className="text-yellow-700 text-sm">The 4 corners are free spaces (marked with ★). No cards can be played here.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Special Jack Cards",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">Jack cards have special powers!</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">🃏 Two-Eyed Jacks</h3>
              <p className="text-red-700 text-sm mb-2">Hearts J and Diamonds J</p>
              <p className="text-red-600 text-sm">Wild cards! Can be placed on any open position (except free spaces).</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">🃏 One-Eyed Jacks</h3>
              <p className="text-purple-700 text-sm mb-2">Clubs J and Spades J</p>
              <p className="text-purple-600 text-sm">Remove an opponent's chip from the board (except from completed sequences).</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Creating Sequences",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">A sequence is 5 chips in a row!</p>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-800">✅ Valid Sequences</h4>
              <ul className="text-blue-700 text-sm mt-1">
                <li>• Horizontal: 5 chips in a straight line</li>
                <li>• Vertical: 5 chips in a straight line</li>
                <li>• Diagonal: 5 chips in a straight line</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <h4 className="font-semibold text-orange-800">🛡️ Protected Chips</h4>
              <p className="text-orange-700 text-sm">Chips in completed sequences cannot be removed by one-eyed Jacks.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Game Flow",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">Here's how to play:</p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold text-gray-800">Select a Card</h4>
                <p className="text-gray-600 text-sm">Click a card from your hand to play it.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold text-gray-800">Choose Position</h4>
                <p className="text-gray-600 text-sm">Click on a valid board position to place your chip.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold text-gray-800">End Turn</h4>
                <p className="text-gray-600 text-sm">Draw a new card and pass to the next player.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Winning the Game",
      content: (
        <div className="space-y-4">
          <p className="text-lg font-semibold text-gray-800">You win by completing the required sequences!</p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🏆 Victory Conditions</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• 2 players: First team to complete 2 sequences wins</li>
              <li>• 3+ players: First team to complete 1 sequence wins</li>
              <li>• Sequences can overlap and share positions</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Plan your sequences strategically</li>
              <li>• Use one-eyed Jacks to block opponents</li>
              <li>• Two-eyed Jacks are valuable - use them wisely</li>
              <li>• Watch for opponent's sequences and block them</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{tutorialSteps[currentStep].title}</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2">
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'bg-white' : 'bg-white bg-opacity-30'
                  }`}
                  style={{ width: `${100 / tutorialSteps.length}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {tutorialSteps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            Previous
          </button>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>
          
          {currentStep === tutorialSteps.length - 1 ? (
            <button
              onClick={onClose}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Start Playing!
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameTutorial;
