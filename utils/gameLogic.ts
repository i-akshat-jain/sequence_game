import { GameState, Player, Card, BoardPosition, Chip, TeamId, PlayerId, GameAction } from '../types/game';
import { canPlayCard, getValidPositions, generateDeck, shuffleDeck, dealCards } from './cardUtils';

// Initialize a new game
export function initializeGame(playerCount: number): GameState {
  const deck = shuffleDeck(generateDeck());
  const { hands, remainingDeck } = dealCards(deck, playerCount);
  
  const players: Player[] = hands.map((hand, index) => ({
    id: `player${index + 1}` as PlayerId,
    name: `Player ${index + 1}`,
    team: index < 2 ? 'team1' : 'team2' as TeamId,
    hand,
    isActive: index === 0
  }));

  return {
    players,
    currentPlayer: 'player1',
    board: Array(10).fill(null).map(() => Array(10).fill(null)),
    deck: remainingDeck,
    discardPile: [],
    gamePhase: 'setup',
    sequences: []
  };
}

// Play a card and place a chip
export function playCard(
  gameState: GameState,
  playerId: PlayerId,
  card: Card,
  position: BoardPosition,
  boardLayout: any
): GameAction | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.isActive) return null;

  // Check if player has the card
  const cardIndex = player.hand.findIndex(c => c.id === card.id);
  if (cardIndex === -1) return null;

  // Check if position is valid
  if (!canPlayCard(card, position, boardLayout)) return null;

  // Check if position is already occupied
  if (gameState.board[position.row][position.col]) return null;

  return {
    type: 'play_card',
    playerId,
    card,
    position
  };
}

// Apply a game action to the state
export function applyGameAction(gameState: GameState, action: GameAction): GameState {
  const newState = { ...gameState };
  const player = newState.players.find(p => p.id === action.playerId);
  
  if (!player) return gameState;

  switch (action.type) {
    case 'play_card':
      if (action.card && action.position) {
        // Remove card from player's hand
        const cardIndex = player.hand.findIndex(c => c.id === action.card!.id);
        if (cardIndex !== -1) {
          player.hand.splice(cardIndex, 1);
        }

        // Add chip to board
        const chip: Chip = {
          id: `chip-${action.playerId}-${action.position.row}-${action.position.col}-${newState.sequences.length}`,
          playerId: action.playerId,
          team: player.team,
          position: action.position
        };
        
        newState.board[action.position.row][action.position.col] = chip;
        
        // Add card to discard pile
        newState.discardPile.push(action.card);
        
        // Check for sequences
        const sequences = checkForSequences(newState, action.position);
        newState.sequences.push(...sequences);
        
        // Check for win condition
        if (sequences.length > 0) {
          const teamSequences = newState.sequences.filter(s => s.team === player.team);
          if (teamSequences.length >= 2) { // Need 2 sequences to win
            newState.gamePhase = 'finished';
            newState.winner = player.team;
          }
        }
        
        // Move to next player
        nextTurn(newState);
      }
      break;
      
    case 'remove_chip':
      if (action.targetChip) {
        const chip = action.targetChip;
        newState.board[chip.position.row][chip.position.col] = null;
      }
      break;
      
    case 'pass_turn':
      nextTurn(newState);
      break;
  }

  return newState;
}

// Move to the next player's turn
function nextTurn(gameState: GameState): void {
  const currentIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
  const nextIndex = (currentIndex + 1) % gameState.players.length;
  
  // Deactivate current player
  gameState.players[currentIndex].isActive = false;
  
  // Activate next player
  gameState.players[nextIndex].isActive = true;
  gameState.currentPlayer = gameState.players[nextIndex].id;
}

// Check if a position is valid for placing a chip
export function isValidPosition(
  position: BoardPosition,
  gameState: GameState,
  boardLayout: any
): boolean {
  // Check bounds
  if (position.row < 0 || position.row >= 10 || position.col < 0 || position.col >= 10) {
    return false;
  }
  
  // Check if position is already occupied
  if (gameState.board[position.row][position.col]) {
    return false;
  }
  
  return true;
}

// Get all possible moves for a player
export function getPossibleMoves(
  gameState: GameState,
  playerId: PlayerId,
  boardLayout: any
): Array<{ card: Card; position: BoardPosition }> {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return [];

  const moves: Array<{ card: Card; position: BoardPosition }> = [];
  
  player.hand.forEach(card => {
    const validPositions = getValidPositions(card, boardLayout);
    validPositions.forEach(position => {
      if (isValidPosition(position, gameState, boardLayout)) {
        moves.push({ card, position });
      }
    });
  });
  
  return moves;
}

