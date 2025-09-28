import { GameState, BoardPosition, Sequence, TeamId, Chip } from '../types/game';

// Check for sequences starting from a given position
export function checkForSequences(gameState: GameState, position: BoardPosition): Sequence[] {
  const sequences: Sequence[] = [];
  const chip = gameState.board[position.row][position.col];
  
  if (!chip) return sequences;

  // Check all 8 directions for sequences
  const directions = [
    { dr: -1, dc: -1 }, // diagonal up-left
    { dr: -1, dc: 0 },  // up
    { dr: -1, dc: 1 },  // diagonal up-right
    { dr: 0, dc: -1 },  // left
    { dr: 0, dc: 1 },   // right
    { dr: 1, dc: -1 },  // diagonal down-left
    { dr: 1, dc: 0 },   // down
    { dr: 1, dc: 1 }    // diagonal down-right
  ];

  directions.forEach(({ dr, dc }, index) => {
    const sequence = checkDirection(gameState, position, dr, dc, chip.team);
    if (sequence && sequence.positions.length >= 5) {
      sequences.push(sequence);
    }
  });

  return sequences;
}

// Check for a sequence in a specific direction
function checkDirection(
  gameState: GameState,
  startPosition: BoardPosition,
  dr: number,
  dc: number,
  team: TeamId
): Sequence | null {
  const positions: BoardPosition[] = [];
  
  // Check in both directions from the starting position
  for (let i = -4; i <= 4; i++) {
    const row = startPosition.row + (i * dr);
    const col = startPosition.col + (i * dc);
    
    // Check bounds
    if (row < 0 || row >= 10 || col < 0 || col >= 10) continue;
    
    const chip = gameState.board[row][col];
    
    if (chip && chip.team === team) {
      positions.push({ row, col });
    } else {
      // If we have a sequence of 5 or more, return it
      if (positions.length >= 5) {
        return {
          id: `sequence-${team}-${positions[0].row}-${positions[0].col}-${dr}-${dc}`,
          team,
          positions: [...positions],
          direction: getDirectionName(dr, dc)
        };
      }
      // Reset positions if sequence is broken
      positions.length = 0;
    }
  }
  
  // Check if we have a valid sequence at the end
  if (positions.length >= 5) {
    return {
      id: `sequence-${team}-${positions[0].row}-${positions[0].col}-${dr}-${dc}`,
      team,
      positions: [...positions],
      direction: getDirectionName(dr, dc)
    };
  }
  
  return null;
}

// Get direction name for sequence
function getDirectionName(dr: number, dc: number): 'horizontal' | 'vertical' | 'diagonal' {
  if (dr === 0) return 'horizontal';
  if (dc === 0) return 'vertical';
  return 'diagonal';
}

// Check if a team has won (2 sequences required)
export function checkWinCondition(gameState: GameState): TeamId | null {
  const teamSequences = new Map<TeamId, Sequence[]>();
  
  // Count sequences by team
  gameState.sequences.forEach(sequence => {
    if (!teamSequences.has(sequence.team)) {
      teamSequences.set(sequence.team, []);
    }
    teamSequences.get(sequence.team)!.push(sequence);
  });
  
  // Check if any team has 2 or more sequences
  for (const [team, sequences] of teamSequences) {
    if (sequences.length >= 2) {
      return team;
    }
  }
  
  return null;
}

// Get all sequences for a specific team
export function getTeamSequences(gameState: GameState, team: TeamId): Sequence[] {
  return gameState.sequences.filter(sequence => sequence.team === team);
}

// Check if a position is part of any sequence
export function isPositionInSequence(
  gameState: GameState,
  position: BoardPosition,
  team?: TeamId
): boolean {
  return gameState.sequences.some(sequence => {
    if (team && sequence.team !== team) return false;
    
    return sequence.positions.some(pos => 
      pos.row === position.row && pos.col === position.col
    );
  });
}

// Get the longest sequence for a team
export function getLongestSequence(gameState: GameState, team: TeamId): Sequence | null {
  const teamSequences = getTeamSequences(gameState, team);
  if (teamSequences.length === 0) return null;
  
  return teamSequences.reduce((longest, current) => 
    current.positions.length > longest.positions.length ? current : longest
  );
}

// Check if a move would create a new sequence
export function wouldCreateSequence(
  gameState: GameState,
  position: BoardPosition,
  team: TeamId
): boolean {
  // Temporarily add a chip to check for sequences
  const tempChip: Chip = {
    id: 'temp',
    playerId: 'temp' as any,
    team,
    position
  };
  
  const tempBoard = gameState.board.map(row => [...row]);
  tempBoard[position.row][position.col] = tempChip;
  
  const tempGameState = {
    ...gameState,
    board: tempBoard
  };
  
  const sequences = checkForSequences(tempGameState, position);
  return sequences.length > 0;
}
