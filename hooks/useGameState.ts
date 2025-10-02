import { create } from 'zustand';
import { GameState, PlayerId, Card, BoardPosition, GameAction } from '../types/game';
import { initializeGame, applyGameAction, getPossibleMoves } from '../utils/gameLogic';
import { createBoardLayout } from '../utils/cardUtils';

// Create a simple initial state that's safe for SSR
const getInitialState = () => ({
  players: [],
  currentPlayer: 'player1' as PlayerId,
  board: Array(10).fill(null).map(() => Array(10).fill(null)),
  deck: [],
  discardPile: [],
  gamePhase: 'setup' as const,
  sequences: [],
  boardLayout: {} as any,
  selectedCard: null as Card | null,
  selectedPosition: null as BoardPosition | null,
  possibleMoves: [] as Array<{ card: Card; position: BoardPosition }>,
});

interface GameStore extends GameState {
  boardLayout: any;
  selectedCard: Card | null;
  selectedPosition: BoardPosition | null;
  possibleMoves: Array<{ card: Card; position: BoardPosition }>;
  
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
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state - safe for SSR
  ...getInitialState(),

  // Actions
  initializeNewGame: (playerCount: number) => {
    const newGame = initializeGame(playerCount);
    set({
      ...newGame,
      boardLayout: createBoardLayout(),
      selectedCard: null,
      selectedPosition: null,
      possibleMoves: []
    });
  },

  // Initialize the store on client side
  initializeStore: () => {
    const state = get();
    if (Object.keys(state.boardLayout).length === 0) {
      set({ boardLayout: createBoardLayout() });
    }
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
    const action: GameAction = {
      type: 'play_card',
      playerId: state.currentPlayer,
      card,
      position
    };

    const newState = applyGameAction(state, action);
    set({
      ...newState,
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
    set(prev => ({
      ...prev,
      ...newGameState,
      selectedCard: null,
      selectedPosition: null,
      possibleMoves: []
    }));
  }
}));
