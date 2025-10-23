import { Card, Suit, Rank, BoardLayout, BoardPosition } from '../types/game';

// Generate deterministic IDs for SSR compatibility
function generateDeterministicId(prefix: string, ...args: (string | number)[]): string {
  return `${prefix}-${args.join('-')}`;
}

// Generate two standard 52-card decks (104 cards total) for Sequence game
export function generateDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  // Generate 2 complete decks (104 cards total, no jokers in Sequence)
  for (let deckCount = 0; deckCount < 2; deckCount++) {
    suits.forEach(suit => {
      ranks.forEach(rank => {
        deck.push({
          id: generateDeterministicId('card', deckCount, suit, rank),
          suit,
          rank,
          isJoker: false,
          jackType: rank === 'J' ? (suit === 'hearts' || suit === 'diamonds' ? 'two-eyed' : 'one-eyed') : undefined
        });
      });
    });
  }

  return deck;
}

// Maximum randomness shuffle for truly random deck distribution
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  // Use multiple sources of randomness for maximum variation
  const timeSeed = Date.now(); // Current timestamp in milliseconds
  const randomSeed = Math.random() * 1000000; // Additional random factor
  const deckHash = deck.reduce((hash, card, index) => {
    return hash + card.id.charCodeAt(0) + card.suit.charCodeAt(0) + card.rank.charCodeAt(0) + index;
  }, 0);
  
  // Combine all randomness sources
  const seed = timeSeed + randomSeed + deckHash;
  
  // Fisher-Yates shuffle with maximum randomness
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Create a highly random index using multiple mathematical operations
    const randomFactor1 = (seed * (i + 1)) % 1000000;
    const randomFactor2 = (i * 17 + seed % 11) % 1000000;
    const randomFactor3 = (Math.sin(seed + i) * 1000000) % 1000000;
    const j = Math.floor((randomFactor1 + randomFactor2 + randomFactor3) % (i + 1));
    
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Deal cards to players according to Sequence rules
export function dealCards(deck: Card[], playerCount: number): { hands: Card[][], remainingDeck: Card[] } {
  // Sequence dealing rules:
  // 2 players: 7 cards each
  // 3-4 players: 6 cards each  
  // 6 players: 5 cards each
  // 8-9 players: 4 cards each
  // 10-12 players: 3 cards each
  let cardsPerPlayer: number;
  if (playerCount === 2) {
    cardsPerPlayer = 7;
  } else if (playerCount >= 3 && playerCount <= 4) {
    cardsPerPlayer = 6;
  } else if (playerCount === 6) {
    cardsPerPlayer = 5;
  } else if (playerCount >= 8 && playerCount <= 9) {
    cardsPerPlayer = 4;
  } else if (playerCount >= 10 && playerCount <= 12) {
    cardsPerPlayer = 3;
  } else {
    cardsPerPlayer = 6; // Default fallback
  }

  const hands: Card[][] = [];
  
  for (let i = 0; i < playerCount; i++) {
    hands.push([]);
  }

  for (let cardIndex = 0; cardIndex < cardsPerPlayer * playerCount; cardIndex++) {
    const playerIndex = cardIndex % playerCount;
    hands[playerIndex].push(deck[cardIndex]);
  }

  return {
    hands,
    remainingDeck: deck.slice(cardsPerPlayer * playerCount)
  };
}

// Create the board layout mapping cards to positions
// The Sequence board has a specific 10x10 layout with two copies of each card
export function createBoardLayout(): BoardLayout {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const layout: BoardLayout = {};

  // Create a properly shuffled Sequence board layout
  // Each card appears exactly twice on the board
  const allCards: { suit: Suit; rank: Rank }[] = [];
  
  // Generate all 52 unique cards
  suits.forEach(suit => {
    ranks.forEach(rank => {
      allCards.push({ suit, rank });
    });
  });

  // Create two copies of each card for the board (104 cards total for 100 positions)
  const boardCards: { suit: Suit; rank: Rank }[] = [];
  allCards.forEach(card => {
    const cardCopy1 = { ...card };
    const cardCopy2 = { ...card };
    boardCards.push(cardCopy1);
    boardCards.push(cardCopy2);
  });

  // Debug check to ensure we have the right number of cards
  console.log(`Created ${boardCards.length} board cards (should be 104)`);
  console.log(`First few cards:`, boardCards.slice(0, 5));
  if (boardCards.length !== 104) {
    console.error(`Expected 104 cards but got ${boardCards.length}`);
  }

  // Shuffle the board cards to create a random layout
  const shuffledCards = shuffleBoardCards(boardCards);
  
  // Debug check to ensure shuffled cards are valid
  console.log(`Shuffled ${shuffledCards.length} cards`);
  console.log(`First few shuffled cards:`, shuffledCards.slice(0, 5));
  if (shuffledCards.length !== 104) {
    console.error(`Expected 104 shuffled cards but got ${shuffledCards.length}`);
  }
  
  // Check for undefined cards in the shuffled array
  const undefinedCards = shuffledCards.filter(card => !card || !card.suit || !card.rank);
  if (undefinedCards.length > 0) {
    console.error(`Found ${undefinedCards.length} undefined/invalid cards in shuffled array`);
    console.error(`Undefined cards:`, undefinedCards);
  }

  // Create 100 positions (10x10) with the shuffled cards
  // We only need the first 100 cards from our 104-card deck
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const cardIndex = row * 10 + col;
      
      // Safety check to ensure we don't exceed the shuffled cards array
      if (cardIndex >= shuffledCards.length) {
        console.error(`Card index ${cardIndex} exceeds shuffled cards length ${shuffledCards.length}`);
        // Fallback to a default card if needed
        layout[`${row}-${col}`] = {
          card: {
            id: `board-${row}-${col}`,
            suit: 'hearts',
            rank: 'A',
            isJoker: false
          },
          row,
          col
        };
        continue;
      }
      
      const card = shuffledCards[cardIndex];
      
      // Safety check to ensure card exists and has required properties
      if (!card || !card.suit || !card.rank) {
        console.error(`Invalid card at index ${cardIndex} for position (${row}, ${col}):`, card);
        // Fallback to a default card if needed
        layout[`${row}-${col}`] = {
          card: {
            id: `board-${row}-${col}`,
            suit: 'hearts',
            rank: 'A',
            isJoker: false
          },
          row,
          col
        };
        continue;
      }
      
      layout[`${row}-${col}`] = {
        card: {
          id: `board-${row}-${col}`,
          suit: card.suit,
          rank: card.rank,
          isJoker: false
        },
        row,
        col
      };
    }
  }

  return layout;
}

// Shuffle board cards using a proper Fisher-Yates shuffle with maximum randomness
function shuffleBoardCards(cards: { suit: Suit; rank: Rank }[]): { suit: Suit; rank: Rank }[] {
  // Create a deep copy to avoid modifying the original array
  const shuffled = cards.map(card => ({ ...card }));
  
  // Use multiple sources of randomness for maximum variation
  const timeSeed = Date.now(); // Current timestamp in milliseconds
  const randomSeed = Math.random() * 1000000; // Additional random factor
  const cardHash = cards.reduce((hash, card, index) => {
    return hash + card.suit.charCodeAt(0) + card.rank.charCodeAt(0) + index;
  }, 0);
  
  // Combine all randomness sources
  const seed = timeSeed + randomSeed + cardHash;
  
  // Fisher-Yates shuffle with maximum randomness
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Create a highly random index using multiple mathematical operations
    const randomFactor1 = (seed * (i + 1)) % 1000000;
    const randomFactor2 = (i * 17 + seed % 11) % 1000000;
    const randomFactor3 = (Math.sin(seed + i) * 1000000) % 1000000;
    const j = Math.floor((randomFactor1 + randomFactor2 + randomFactor3) % (i + 1));
    
    // Ensure j is within bounds
    const safeJ = Math.max(0, Math.min(j, i));
    
    // Swap elements safely
    if (shuffled[i] && shuffled[safeJ]) {
      [shuffled[i], shuffled[safeJ]] = [shuffled[safeJ], shuffled[i]];
    }
  }
  
  // Validate that all cards are still valid after shuffling
  const validCards = shuffled.filter(card => card && card.suit && card.rank);
  if (validCards.length !== shuffled.length) {
    console.error(`Lost ${shuffled.length - validCards.length} cards during shuffle`);
    return cards.map(card => ({ ...card })); // Return original if shuffle failed
  }
  
  return shuffled;
}

// Check if a card can be played at a specific position
export function canPlayCard(card: Card, position: BoardPosition, boardLayout: BoardLayout): boolean {
  const positionKey = `${position.row}-${position.col}`;
  const boardCard = boardLayout[positionKey];
  
  if (!boardCard) return false;
  
  // Two-eyed jacks can be played anywhere (wild cards)
  if (card.rank === 'J' && card.jackType === 'two-eyed') return true;
  
  // Regular cards must match the board position
  return card.suit === boardCard.card.suit && card.rank === boardCard.card.rank;
}

// Check if a card is a dead card (no available positions)
export function isDeadCard(card: Card, gameState: any, boardLayout: BoardLayout): boolean {
  // Two-eyed jacks are never dead (can be played anywhere)
  if (card.rank === 'J' && card.jackType === 'two-eyed') return false;
  
  // One-eyed jacks are never dead (can remove any opponent chip)
  if (card.rank === 'J' && card.jackType === 'one-eyed') return false;
  
  // Check if there are any available positions for this card
  const validPositions = getValidPositions(card, boardLayout);
  return validPositions.every(position => 
    gameState.board[position.row][position.col] !== null
  );
}

// Get all valid positions for a card
export function getValidPositions(card: Card, boardLayout: BoardLayout): BoardPosition[] {
  const validPositions: BoardPosition[] = [];
  
  Object.entries(boardLayout).forEach(([key, layout]) => {
    const [row, col] = key.split('-').map(Number);
    const position: BoardPosition = { row, col, cardPosition: layout.card };
    
    if (canPlayCard(card, position, boardLayout)) {
      validPositions.push(position);
    }
  });
  
  return validPositions;
}
