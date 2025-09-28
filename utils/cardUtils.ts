import { Card, Suit, Rank, BoardLayout, BoardPosition } from '../types/game';

// Generate deterministic IDs for SSR compatibility
function generateDeterministicId(prefix: string, ...args: (string | number)[]): string {
  return `${prefix}-${args.join('-')}`;
}

// Generate a single deck of 52 cards + 2 jokers
export function generateDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  // Generate regular cards (2 of each for 104 total)
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

    // Add 2 jokers per deck
    deck.push({
      id: generateDeterministicId('joker', deckCount, 0),
      suit: 'hearts', // Jokers don't have suits, but we need to assign one
      rank: 'J',
      isJoker: true,
      jackType: 'two-eyed'
    });
  }

  return deck;
}

// Simple deterministic shuffle for SSR compatibility
export function shuffleDeck(deck: Card[]): Card[] {
  // For SSR compatibility, we'll use a simple deterministic shuffle
  // that produces the same result on server and client
  const shuffled = [...deck];
  const seed = 12345; // Fixed seed for deterministic behavior
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Simple linear congruential generator for deterministic "random" numbers
    const j = ((seed * (i + 1)) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards to players
export function dealCards(deck: Card[], playerCount: number): { hands: Card[][], remainingDeck: Card[] } {
  const cardsPerPlayer = playerCount === 2 ? 7 : 6;
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
export function createBoardLayout(): BoardLayout {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const layout: BoardLayout = {};

  // The Sequence board has a specific layout where each card appears twice
  // For simplicity, we'll create a 10x10 grid where each position corresponds to a card
  let positionIndex = 0;
  
  // Create 100 positions (10x10) with cards
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const suit = suits[Math.floor(positionIndex / 25)];
      const rank = ranks[positionIndex % 13];
      
      layout[`${row}-${col}`] = {
        card: {
          id: `board-${row}-${col}`,
          suit,
          rank,
          isJoker: false
        },
        row,
        col
      };
      
      positionIndex++;
    }
  }

  return layout;
}

// Check if a card can be played at a specific position
export function canPlayCard(card: Card, position: BoardPosition, boardLayout: BoardLayout): boolean {
  const positionKey = `${position.row}-${position.col}`;
  const boardCard = boardLayout[positionKey];
  
  if (!boardCard) return false;
  
  // Jokers can be played anywhere
  if (card.isJoker) return true;
  
  // Two-eyed jacks can be played anywhere
  if (card.rank === 'J' && card.jackType === 'two-eyed') return true;
  
  // Regular cards must match the board position
  return card.suit === boardCard.card.suit && card.rank === boardCard.card.rank;
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
