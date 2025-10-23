import { create } from 'zustand';
import { GameState, PlayerId, Card, BoardPosition, GameAction } from '../types/game';
import { initializeGame, applyGameAction, getPossibleMoves, handleDeadCards } from '../utils/gameLogic';
import { createBoardLayout } from '../utils/cardUtils';

// Simple fallback board layout generator
const createFallbackBoardLayout = (): { [key: string]: { card: any; row: number; col: number } } => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const boardLayout: { [key: string]: { card: any; row: number; col: number } } = {};
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const suitIndex = (row + col) % 4;
      const rankIndex = (row * 10 + col) % 13;
      
      boardLayout[`${row}-${col}`] = {
        card: {
          id: `board-${row}-${col}`,
          suit: suits[suitIndex],
          rank: ranks[rankIndex],
          isJoker: false
        },
        row: row,
        col: col
      };
    }
  }
  
  return boardLayout;
};

// Create a simple initial state that's safe for SSR
const getInitialState = () => ({
  players: [],
  teams: [],
  currentPlayer: 'player1' as PlayerId,
  board: Array(10).fill(null).map(() => Array(10).fill(null)),
  deck: [],
  discardPile: [],
  gamePhase: 'setup' as const,
  sequences: [],
  playerCount: 0,
  requiredSequences: 2,
  dealer: 'player1' as PlayerId,
  turnOrder: [],
  boardLayout: {} as { [key: string]: { card: any; row: number; col: number } },
  selectedCard: null as Card | null,
  selectedPosition: null as BoardPosition | null,
  possibleMoves: [] as Array<{ card: Card; position: BoardPosition }>,
  selectedCards: {} as { [playerId: string]: Card },
});

interface GameStore extends GameState {
  boardLayout: { [key: string]: { card: any; row: number; col: number } };
  selectedCard: Card | null;
  selectedPosition: BoardPosition | null;
  possibleMoves: Array<{ card: Card; position: BoardPosition }>;
  selectedCards: { [playerId: string]: Card };
  
  // Actions
  initializeNewGame: (playerCount: number) => void;
  initializeStore: () => void;
  selectCard: (card: Card | null) => void;
  selectPosition: (position: BoardPosition | null) => void;
  playCard: (card: Card, position: BoardPosition) => void;
  passTurn: () => void;
  updatePossibleMoves: () => void;
  resetSelection: () => void;
  resetGame: () => void;
  updateGameState: (newGameState: Partial<GameState>) => void;
  updateSelectedCards: (selectedCards: { [playerId: string]: Card }) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state - safe for SSR
  ...getInitialState(),

  // Actions
  initializeNewGame: (playerCount: number) => {
    const newGame = initializeGame(playerCount);
    // Don't create board layout here - it will come from server
    set({
      ...newGame,
      selectedCard: null,
      selectedPosition: null,
      possibleMoves: []
    });
  },

  // Initialize the store on client side
  initializeStore: () => {
    const state = get();
    // Don't create board layout here - it will come from server
    // set({ boardLayout: createBoardLayout() });
  },

  selectCard: (card: Card | null) => {
    const state = get();
    set({ selectedCard: card });
    
    // Update possible moves when a card is selected
    if (card) {
      const moves = getPossibleMoves(state, state.currentPlayer, state.boardLayout);
      set({ possibleMoves: moves.filter(move => move.card.id === card.id) });
    } else {
      set({ possibleMoves: [] });
    }
  },

  selectPosition: (position: BoardPosition | null) => {
    set({ selectedPosition: position });
  },

  playCard: (card: Card, position: BoardPosition) => {
    const state = get();
    
    // Check for dead cards first
    const deadCardActions = handleDeadCards(state, state.currentPlayer, state.boardLayout);
    if (deadCardActions.length > 0) {
      // Auto-discard dead cards
      let newState: GameState = state;
      deadCardActions.forEach(action => {
        newState = applyGameAction(newState, action);
      });
      set({
        ...newState,
        boardLayout: state.boardLayout,
        selectedCard: null,
        selectedPosition: null,
        possibleMoves: []
      });
      return;
    }
    
    const action: GameAction = {
      type: 'play_card',
      playerId: state.currentPlayer,
      card,
      position
    };

    const newState = applyGameAction(state, action);
    set({
      ...newState,
      boardLayout: state.boardLayout,
      selectedCard: null,
      selectedPosition: null,
      possibleMoves: []
    });
  },

  passTurn: () => {
    const state = get();
    const action: GameAction = {
      type: 'pass_turn',
      playerId: state.currentPlayer
    };

    const newState = applyGameAction(state, action);
    set({
      ...newState,
      boardLayout: state.boardLayout,
      selectedCard: null,
      selectedPosition: null,
      possibleMoves: []
    });
  },

  updatePossibleMoves: () => {
    const state = get();
    const moves = getPossibleMoves(state, state.currentPlayer, state.boardLayout);
    set({ possibleMoves: moves });
  },

  resetSelection: () => {
    set({
      selectedCard: null,
      selectedPosition: null,
      possibleMoves: []
    });
  },

  // Reset the entire game state
  resetGame: () => {
    set(getInitialState());
  },

  // Update game state from server
  updateGameState: (newGameState: Partial<GameState>) => {
    console.log('🔄 Updating game state:', newGameState);
    console.log('🔄 Board layout keys in update:', Object.keys(newGameState.boardLayout || {}));
    console.log('🔄 Board layout sample in update:', Object.keys(newGameState.boardLayout || {}).slice(0, 5));
    
    set(prev => {
      let boardLayout = newGameState.boardLayout || prev.boardLayout;
      
      // Fallback: Create simple board layout if server didn't provide one
      if (!boardLayout || Object.keys(boardLayout).length === 0) {
        console.log('🔄 Creating fallback board layout on client');
        boardLayout = createFallbackBoardLayout();
      }
      
      const updatedState = {
        ...prev,
        ...newGameState,
        // Ensure board layout is properly set from server or fallback
        boardLayout: boardLayout,
        selectedCard: null,
        selectedPosition: null,
        possibleMoves: []
      };
      
      console.log('🔄 Final board layout keys after update:', Object.keys(updatedState.boardLayout || {}));
      console.log('🔄 Final board layout sample after update:', Object.keys(updatedState.boardLayout || {}).slice(0, 5));
      
      return updatedState;
    });
  },

  // Update selected cards from other players
  updateSelectedCards: (selectedCards: { [playerId: string]: Card }) => {
    console.log('🎯 Updating selected cards:', selectedCards);
    set({ selectedCards });
  }
}));
