export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type JackType = 'two-eyed' | 'one-eyed';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isJoker?: boolean;
  jackType?: JackType;
}

export type PlayerId = 'player1' | 'player2' | 'player3' | 'player4';
export type TeamId = 'team1' | 'team2';

export interface Player {
  id: PlayerId;
  name: string;
  team: TeamId;
  hand: Card[];
  isActive: boolean;
}

export interface Chip {
  id: string;
  playerId: PlayerId;
  team: TeamId;
  position: BoardPosition;
}

export interface BoardPosition {
  row: number;
  col: number;
  cardPosition?: Card; // The card that corresponds to this position
}

export interface GameState {
  players: Player[];
  currentPlayer: PlayerId;
  board: (Chip | null)[][]; // 10x10 grid
  deck: Card[];
  discardPile: Card[];
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: TeamId;
  sequences: Sequence[];
}

export interface Sequence {
  id: string;
  team: TeamId;
  positions: BoardPosition[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export interface GameAction {
  type: 'play_card' | 'place_chip' | 'remove_chip' | 'pass_turn';
  playerId: PlayerId;
  card?: Card;
  position?: BoardPosition;
  targetChip?: Chip;
}

// Board layout - each position corresponds to specific cards
export interface BoardLayout {
  [key: string]: {
    card: Card;
    row: number;
    col: number;
  };
}
