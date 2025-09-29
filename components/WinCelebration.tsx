'use client';

import React, { useEffect, useState } from 'react';

interface WinCelebrationProps {
  winningTeam: string;
  onClose: () => void;
}

const WinCelebration: React.FC<WinCelebrationProps> = ({ winningTeam, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    
    // Play celebration sound (if available)
    const audio = new Audio('/sounds/applause.mp3');
    audio.play().catch(() => {
      // Ignore if audio fails to play
    });

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center relative overflow-hidden">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="relative z-10">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Congratulations!
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            <span className={`font-bold ${winningTeam === 'team1' ? 'text-red-600' : 'text-blue-600'}`}>
              {winningTeam === 'team1' ? 'Team 1' : 'Team 2'}
            </span> wins!
          </p>
          
          <div className="text-4xl mb-6">
            👏👏👏
          </div>
          
          <p className="text-gray-500 mb-6">
            Great game! Well played everyone!
          </p>
          
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinCelebration;

