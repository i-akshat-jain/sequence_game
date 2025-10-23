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

export type PlayerId = string; // Allow dynamic player IDs
export type TeamId = 'team1' | 'team2' | 'team3';

export interface Player {
  id: PlayerId;
  name: string;
  team: TeamId;
  hand: Card[];
  isActive: boolean;
  discardPile: Card[]; // Personal discard pile for each player
}

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  players: PlayerId[];
  sequences: Sequence[];
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
  teams: Team[];
  currentPlayer: PlayerId;
  board: (Chip | null)[][]; // 10x10 grid
  deck: Card[];
  discardPile: Card[]; // General discard pile
  gamePhase: 'setup' | 'playing' | 'finished';
  winner?: TeamId;
  sequences: Sequence[];
  playerCount: number;
  requiredSequences: number; // 2 for 2-player/team, 1 for 3-player/team
  dealer: PlayerId;
  turnOrder: PlayerId[];
  boardLayout?: any; // Server-generated board layout
}

export interface Sequence {
  id: string;
  team: TeamId;
  positions: BoardPosition[];
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export interface GameAction {
  type: 'play_card' | 'place_chip' | 'remove_chip' | 'pass_turn' | 'draw_card' | 'discard_dead_card';
  playerId: PlayerId;
  card?: Card;
  position?: BoardPosition;
  targetChip?: Chip;
  targetPosition?: BoardPosition; // For one-eyed jack removal
}

// Board layout - each position corresponds to specific cards
export interface BoardLayout {
  [key: string]: {
    card: Card;
    row: number;
    col: number;
  };
}
