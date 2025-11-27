/**
 * BracketProgressionService
 * Advances winners through brackets and handles loser routing
 */

import { getBracketMatch } from './BracketGeneratorService.js';

/**
 * Advances a winner to the next match
 * @param {Object} bracket - Bracket object
 * @param {string} matchId - Completed match ID
 * @param {string} winnerId - Winner player ID
 * @returns {Object} Updated bracket
 */
export function advanceWinner(bracket, matchId, winnerId) {
  const updatedMatches = [...bracket.matches];
  const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
  
  if (matchIndex === -1) {
    return bracket;
  }
  
  const match = updatedMatches[matchIndex];
  
  // Update the match with winner
  updatedMatches[matchIndex] = {
    ...match,
    winnerId,
    status: 'completed',
  };
  
  // Advance winner to next match if exists
  if (match.nextMatchId) {
    const nextMatchIndex = updatedMatches.findIndex(m => m.id === match.nextMatchId);
    
    if (nextMatchIndex !== -1) {
      const nextMatch = updatedMatches[nextMatchIndex];
      
      // Determine which slot (based on position in current round)
      // Even positions go to player1, odd positions go to player2
      const isPlayer1 = match.position % 2 === 0;
      
      updatedMatches[nextMatchIndex] = {
        ...nextMatch,
        player1Id: isPlayer1 ? winnerId : nextMatch.player1Id,
        player2Id: isPlayer1 ? nextMatch.player2Id : winnerId,
        status: getMatchStatus(
          isPlayer1 ? winnerId : nextMatch.player1Id,
          isPlayer1 ? nextMatch.player2Id : winnerId
        ),
      };
    }
  }
  
  return {
    ...bracket,
    matches: updatedMatches,
    status: isBracketComplete(updatedMatches) ? 'completed' : 'in_progress',
  };
}

/**
 * Routes a loser to a lower bracket match (for consolation routing)
 * @param {Object} bracket - Bracket object
 * @param {string} matchId - Completed match ID
 * @param {string} loserId - Loser player ID
 * @returns {Object} Updated bracket
 */
export function routeLoser(bracket, matchId, loserId) {
  const updatedMatches = [...bracket.matches];
  const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
  
  if (matchIndex === -1) {
    return bracket;
  }
  
  const match = updatedMatches[matchIndex];
  
  // Route to loser match if defined
  if (match.loserMatchId) {
    const loserMatchIndex = updatedMatches.findIndex(m => m.id === match.loserMatchId);
    
    if (loserMatchIndex !== -1) {
      const loserMatch = updatedMatches[loserMatchIndex];
      const isPlayer1 = match.position % 2 === 0;
      
      updatedMatches[loserMatchIndex] = {
        ...loserMatch,
        player1Id: isPlayer1 ? loserId : loserMatch.player1Id,
        player2Id: isPlayer1 ? loserMatch.player2Id : loserId,
        status: getMatchStatus(
          isPlayer1 ? loserId : loserMatch.player1Id,
          isPlayer1 ? loserMatch.player2Id : loserId
        ),
      };
    }
  }
  
  return {
    ...bracket,
    matches: updatedMatches,
  };
}

/**
 * Gets match status based on player assignments
 * @param {string|null} player1Id - Player 1 ID
 * @param {string|null} player2Id - Player 2 ID
 * @returns {string} Match status
 */
function getMatchStatus(player1Id, player2Id) {
  if (player1Id && player2Id) {
    return 'ready';
  }
  if (player1Id || player2Id) {
    return 'pending';
  }
  return 'pending';
}

/**
 * Checks if bracket is complete
 * @param {Array} matches - Bracket matches
 * @returns {boolean} True if complete
 */
function isBracketComplete(matches) {
  // Find the final match (highest round)
  const maxRound = Math.max(...matches.map(m => m.round));
  const finalMatch = matches.find(m => m.round === maxRound);
  
  return finalMatch?.status === 'completed';
}

/**
 * Processes a completed match result
 * Updates the match, advances winner, and routes loser if applicable
 * @param {Object} bracket - Bracket object
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner player ID
 * @returns {Object} Updated bracket
 */
export function processMatchResult(bracket, matchId, winnerId) {
  const match = getBracketMatch(bracket, matchId);
  
  if (!match) {
    return bracket;
  }
  
  // Determine loser
  const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
  
  // First advance winner
  let updatedBracket = advanceWinner(bracket, matchId, winnerId);
  
  // Then route loser if applicable
  if (loserId && match.loserMatchId) {
    updatedBracket = routeLoser(updatedBracket, matchId, loserId);
  }
  
  return updatedBracket;
}

/**
 * Handles bye advancement (when only one player in match)
 * @param {Object} bracket - Bracket object
 * @param {string} matchId - Match ID
 * @returns {Object} Updated bracket
 */
export function handleBye(bracket, matchId) {
  const match = getBracketMatch(bracket, matchId);
  
  if (!match) {
    return bracket;
  }
  
  // Only proceed if exactly one player
  const hasOnePlayer = (match.player1Id && !match.player2Id) || 
                       (!match.player1Id && match.player2Id);
  
  if (!hasOnePlayer) {
    return bracket;
  }
  
  const winnerId = match.player1Id || match.player2Id;
  return advanceWinner(bracket, matchId, winnerId);
}

/**
 * Processes all bye matches in a bracket
 * @param {Object} bracket - Bracket object
 * @returns {Object} Updated bracket with byes processed
 */
export function processAllByes(bracket) {
  let updatedBracket = { ...bracket };
  
  // Find all matches that are byes
  const byeMatches = bracket.matches.filter(m => 
    m.status === 'pending' &&
    ((m.player1Id && !m.player2Id) || (!m.player1Id && m.player2Id))
  );
  
  // Process each bye
  byeMatches.forEach(match => {
    updatedBracket = handleBye(updatedBracket, match.id);
  });
  
  return updatedBracket;
}

/**
 * Gets the current round matches that are ready to play
 * @param {Object} bracket - Bracket object
 * @returns {Array} Ready matches
 */
export function getReadyMatches(bracket) {
  return bracket.matches.filter(m => m.status === 'ready');
}

/**
 * Gets matches in progress
 * @param {Object} bracket - Bracket object
 * @returns {Array} In-progress matches
 */
export function getInProgressMatches(bracket) {
  return bracket.matches.filter(m => m.status === 'in_progress');
}

/**
 * Gets completed matches
 * @param {Object} bracket - Bracket object
 * @returns {Array} Completed matches
 */
export function getCompletedMatches(bracket) {
  return bracket.matches.filter(m => m.status === 'completed');
}

/**
 * Gets the bracket winner (final match winner)
 * @param {Object} bracket - Bracket object
 * @returns {string|null} Winner player ID or null
 */
export function getBracketWinner(bracket) {
  const maxRound = Math.max(...bracket.matches.map(m => m.round));
  const finalMatch = bracket.matches.find(m => m.round === maxRound);
  return finalMatch?.winnerId || null;
}

/**
 * Gets the bracket runner-up (final match loser)
 * @param {Object} bracket - Bracket object
 * @returns {string|null} Runner-up player ID or null
 */
export function getBracketRunnerUp(bracket) {
  const maxRound = Math.max(...bracket.matches.map(m => m.round));
  const finalMatch = bracket.matches.find(m => m.round === maxRound);
  
  if (!finalMatch?.winnerId) {
    return null;
  }
  
  return finalMatch.player1Id === finalMatch.winnerId 
    ? finalMatch.player2Id 
    : finalMatch.player1Id;
}

/**
 * Gets a player's path through the bracket
 * @param {Object} bracket - Bracket object
 * @param {string} playerId - Player ID
 * @returns {Array} Matches the player participated in
 */
export function getPlayerPath(bracket, playerId) {
  return bracket.matches
    .filter(m => m.player1Id === playerId || m.player2Id === playerId)
    .sort((a, b) => a.round - b.round);
}

/**
 * Gets final standings from a bracket
 * @param {Object} bracket - Bracket object
 * @returns {Array<{playerId: string, position: number}>} Final standings
 */
export function getBracketStandings(bracket) {
  const standings = [];
  const maxRound = Math.max(...bracket.matches.map(m => m.round));
  
  // Winner
  const winner = getBracketWinner(bracket);
  if (winner) {
    standings.push({ playerId: winner, position: 1 });
  }
  
  // Runner-up
  const runnerUp = getBracketRunnerUp(bracket);
  if (runnerUp) {
    standings.push({ playerId: runnerUp, position: 2 });
  }
  
  // Semi-final losers (3rd/4th place)
  if (maxRound >= 2) {
    const semiFinalRound = maxRound - 1;
    const semiFinalMatches = bracket.matches.filter(m => m.round === semiFinalRound);
    
    semiFinalMatches.forEach(match => {
      if (match.winnerId && match.player1Id && match.player2Id) {
        const loserId = match.player1Id === match.winnerId 
          ? match.player2Id 
          : match.player1Id;
        if (loserId && !standings.find(s => s.playerId === loserId)) {
          standings.push({ playerId: loserId, position: 3 });
        }
      }
    });
  }
  
  // Continue for earlier round losers
  for (let round = maxRound - 2; round >= 1; round--) {
    const roundMatches = bracket.matches.filter(m => m.round === round);
    const nextPosition = standings.length + 1;
    
    roundMatches.forEach(match => {
      if (match.winnerId && match.player1Id && match.player2Id) {
        const loserId = match.player1Id === match.winnerId 
          ? match.player2Id 
          : match.player1Id;
        if (loserId && !standings.find(s => s.playerId === loserId)) {
          standings.push({ playerId: loserId, position: nextPosition });
        }
      }
    });
  }
  
  return standings;
}

/**
 * Updates match status to in_progress
 * @param {Object} bracket - Bracket object
 * @param {string} matchId - Match ID
 * @returns {Object} Updated bracket
 */
export function startMatch(bracket, matchId) {
  const updatedMatches = bracket.matches.map(m => {
    if (m.id === matchId && m.status === 'ready') {
      return { ...m, status: 'in_progress' };
    }
    return m;
  });
  
  return {
    ...bracket,
    matches: updatedMatches,
  };
}
