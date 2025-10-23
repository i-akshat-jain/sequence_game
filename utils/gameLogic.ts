import { GameState, Player, Card, BoardPosition, Chip, TeamId, PlayerId, GameAction, Team } from '../types/game';
import { canPlayCard, getValidPositions, generateDeck, shuffleDeck, dealCards, isDeadCard } from './cardUtils';
import { checkForSequences } from './winConditions';

// Initialize a new game
export function initializeGame(playerCount: number): GameState {
  const deck = shuffleDeck(generateDeck());
  const { hands, remainingDeck } = dealCards(deck, playerCount);
  
  // Create teams based on player count
  const teams: Team[] = [];
  if (playerCount <= 2) {
    teams.push({ id: 'team1', name: 'Team 1', color: 'red', players: [], sequences: [] });
    teams.push({ id: 'team2', name: 'Team 2', color: 'blue', players: [], sequences: [] });
  } else if (playerCount <= 3) {
    teams.push({ id: 'team1', name: 'Team 1', color: 'red', players: [], sequences: [] });
    teams.push({ id: 'team2', name: 'Team 2', color: 'blue', players: [], sequences: [] });
    teams.push({ id: 'team3', name: 'Team 3', color: 'green', players: [], sequences: [] });
  }
  
  const players: Player[] = hands.map((hand, index) => {
    const teamId = playerCount <= 2 
      ? (index % 2 === 0 ? 'team1' : 'team2')
      : (index % 3 === 0 ? 'team1' : index % 3 === 1 ? 'team2' : 'team3') as TeamId;
    
    return {
      id: `player${index + 1}` as PlayerId,
      name: `Player ${index + 1}`,
      team: teamId,
      hand,
      isActive: index === 0,
      discardPile: []
    };
  });

  // Assign players to teams
  players.forEach(player => {
    const team = teams.find(t => t.id === player.team);
    if (team) {
      team.players.push(player.id);
    }
  });

  // Determine required sequences for win condition
  const requiredSequences = playerCount <= 2 ? 2 : 1;

  return {
    players,
    teams,
    currentPlayer: 'player1',
    board: Array(10).fill(null).map(() => Array(10).fill(null)),
    deck: remainingDeck,
    discardPile: [],
    gamePhase: 'setup',
    sequences: [],
    playerCount,
    requiredSequences,
    dealer: 'player1',
    turnOrder: players.map(p => p.id)
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

  // Handle special Jack rules
  if (card.rank === 'J' && card.jackType === 'one-eyed') {
    // One-eyed Jack: remove opponent's chip
    const targetChip = gameState.board[position.row][position.col];
    if (!targetChip || targetChip.team === player.team) return null;
    
    // Check if chip is part of a completed sequence (protected)
    const isProtected = gameState.sequences.some(seq => 
      seq.positions.some(pos => pos.row === position.row && pos.col === position.col)
    );
    if (isProtected) return null;
    
    return {
      type: 'remove_chip',
      playerId,
      card,
      targetPosition: position
    };
  }

  // Handle two-eyed Jack or regular card placement
  if (card.rank === 'J' && card.jackType === 'two-eyed') {
    // Two-eyed Jack: can be placed anywhere
    if (gameState.board[position.row][position.col]) return null;
  } else {
    // Regular card: must match board position
    if (!canPlayCard(card, position, boardLayout)) return null;
    if (gameState.board[position.row][position.col]) return null;
  }

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
          id: `chip-${action.playerId}-${action.position.row}-${action.position.col}-${Date.now()}`,
          playerId: action.playerId,
          team: player.team,
          position: action.position
        };
        
        newState.board[action.position.row][action.position.col] = chip;
        
        // Add card to player's discard pile
        player.discardPile.push(action.card);
        
        // Check for sequences
        const sequences = checkForSequences(newState, action.position);
        newState.sequences.push(...sequences);
        
        // Update team sequences
        const team = newState.teams.find(t => t.id === player.team);
        if (team) {
          team.sequences = newState.sequences.filter(s => s.team === player.team);
        }
        
        // Check for win condition
        const teamSequences = newState.sequences.filter(s => s.team === player.team);
        if (teamSequences.length >= newState.requiredSequences) {
          newState.gamePhase = 'finished';
          newState.winner = player.team;
        }
        
        // Draw a new card
        drawCard(newState, player);
        
        // Move to next player
        nextTurn(newState);
      }
      break;
      
    case 'remove_chip':
      if (action.targetPosition) {
        // Remove opponent's chip
        newState.board[action.targetPosition.row][action.targetPosition.col] = null;
        
        // Add card to player's discard pile
        if (action.card) {
          const cardIndex = player.hand.findIndex(c => c.id === action.card!.id);
          if (cardIndex !== -1) {
            player.hand.splice(cardIndex, 1);
            player.discardPile.push(action.card!);
          }
        }
        
        // Draw a new card
        drawCard(newState, player);
        
        // Move to next player
        nextTurn(newState);
      }
      break;
      
    case 'discard_dead_card':
      if (action.card) {
        // Remove dead card from hand and discard
        const cardIndex = player.hand.findIndex(c => c.id === action.card!.id);
        if (cardIndex !== -1) {
          player.hand.splice(cardIndex, 1);
          player.discardPile.push(action.card!);
        }
        
        // Draw a new card
        drawCard(newState, player);
        
        // Move to next player
        nextTurn(newState);
      }
      break;
      
    case 'pass_turn':
      nextTurn(newState);
      break;
  }

  return newState;
}

// Draw a card from the deck
function drawCard(gameState: GameState, player: Player): void {
  if (gameState.deck.length === 0) {
    // Reshuffle discard pile if deck is empty
    reshuffleDeck(gameState);
  }
  
  if (gameState.deck.length > 0) {
    const drawnCard = gameState.deck.pop()!;
    player.hand.push(drawnCard);
  }
}

// Reshuffle discard pile when deck is empty
function reshuffleDeck(gameState: GameState): void {
  // Collect all discard piles
  const allDiscards: Card[] = [...gameState.discardPile];
  gameState.players.forEach(player => {
    allDiscards.push(...player.discardPile);
    player.discardPile = []; // Clear player discard piles
  });
  
  // Shuffle and create new deck
  gameState.deck = shuffleDeck(allDiscards);
  gameState.discardPile = []; // Clear general discard pile
}

// Move to the next player's turn
function nextTurn(gameState: GameState): void {
  const currentIndex = gameState.turnOrder.findIndex(id => id === gameState.currentPlayer);
  const nextIndex = (currentIndex + 1) % gameState.turnOrder.length;
  
  // Deactivate current player
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (currentPlayer) {
    currentPlayer.isActive = false;
  }
  
  // Activate next player
  const nextPlayerId = gameState.turnOrder[nextIndex];
  const nextPlayer = gameState.players.find(p => p.id === nextPlayerId);
  if (nextPlayer) {
    nextPlayer.isActive = true;
    gameState.currentPlayer = nextPlayerId;
  }
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
    // Handle special Jack rules
    if (card.rank === 'J' && card.jackType === 'two-eyed') {
      // Two-eyed Jack: can be placed anywhere
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (!gameState.board[row][col]) {
            moves.push({ card, position: { row, col } });
          }
        }
      }
    } else if (card.rank === 'J' && card.jackType === 'one-eyed') {
      // One-eyed Jack: can remove any opponent's chip
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          const chip = gameState.board[row][col];
          if (chip && chip.team !== player.team) {
            // Check if chip is not part of a completed sequence
            const isProtected = gameState.sequences.some(seq => 
              seq.positions.some(pos => pos.row === row && pos.col === col)
            );
            if (!isProtected) {
              moves.push({ card, position: { row, col } });
            }
          }
        }
      }
    } else {
      // Regular card: must match board position
      const validPositions = getValidPositions(card, boardLayout);
      validPositions.forEach(position => {
        if (isValidPosition(position, gameState, boardLayout)) {
          moves.push({ card, position });
        }
      });
    }
  });
  
  return moves;
}

// Check if a player has any dead cards
export function getDeadCards(gameState: GameState, playerId: PlayerId, boardLayout: any): Card[] {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return [];

  return player.hand.filter(card => isDeadCard(card, gameState, boardLayout));
}

// Handle automatic dead card discard
export function handleDeadCards(gameState: GameState, playerId: PlayerId, boardLayout: any): GameAction[] {
  const deadCards = getDeadCards(gameState, playerId, boardLayout);
  const actions: GameAction[] = [];
  
  deadCards.forEach(card => {
    actions.push({
      type: 'discard_dead_card',
      playerId,
      card
    });
  });
  
  return actions;
}

