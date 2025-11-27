/**
 * BracketGeneratorService
 * Generates knockout brackets from pool standings using binary tree structure
 * Winner bracket receives top 2 from each pool, consolation receives bottom 2
 */

import { generateUUID } from '../utils/index.js';

/**
 * @typedef {Object} BracketMatch
 * @property {string} id - Match ID
 * @property {string} tournamentId - Tournament ID
 * @property {string} bracketType - 'winner' or 'consolation'
 * @property {number} round - Round number (1 = first round)
 * @property {number} position - Position in round (0-indexed)
 * @property {string|null} player1Id - First player ID
 * @property {string|null} player2Id - Second player ID
 * @property {string|null} winnerId - Winner ID (null if not completed)
 * @property {string|null} nextMatchId - Match ID for winner to advance to
 * @property {string|null} loserMatchId - Match ID for loser (consolation only)
 * @property {number} bestOf - Best of N frames
 * @property {string} status - 'pending', 'ready', 'in_progress', 'completed'
 */

/**
 * @typedef {Object} Bracket
 * @property {string} id - Bracket ID
 * @property {string} tournamentId - Tournament ID
 * @property {string} type - 'winner' or 'consolation'
 * @property {BracketMatch[]} matches - All matches in bracket
 * @property {number} totalRounds - Total number of rounds
 * @property {string} status - 'pending', 'in_progress', 'completed'
 */

/**
 * Calculates the number of rounds needed for a bracket
 * @param {number} playerCount - Number of players
 * @returns {number} Number of rounds
 */
export function calculateRounds(playerCount) {
  if (playerCount <= 1) {
    return 0;
  }
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Calculates the number of matches in a round
 * @param {number} round - Round number (1-indexed)
 * @param {number} totalRounds - Total rounds in bracket
 * @returns {number} Number of matches
 */
export function matchesInRound(round, totalRounds) {
  return Math.pow(2, totalRounds - round);
}

/**
 * Seeds players into bracket positions using standard seeding
 * Ensures top seeds don't meet until later rounds
 * @param {Array<{playerId: string, seed: number}>} seededPlayers - Players with seeds
 * @returns {Array<{playerId: string, seed: number}>} Players in bracket order
 */
export function seedBracketPositions(seededPlayers) {
  const count = seededPlayers.length;
  if (count <= 1) {
    return seededPlayers;
  }
  
  // Sort by seed
  const sorted = [...seededPlayers].sort((a, b) => a.seed - b.seed);
  
  // For standard bracket, use recursive pairing
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(count)));
  const positions = new Array(bracketSize).fill(null);
  
  // Place players using standard seeding algorithm
  // Seed 1 at position 0, seed 2 at position bracketSize-1
  // Then recursively place remaining seeds
  function placeSeeds(seeds, startPos, endPos) {
    if (seeds.length === 0) {
      return;
    }
    if (seeds.length === 1) {
      positions[startPos] = seeds[0];
      return;
    }
    
    const mid = Math.floor((startPos + endPos) / 2);
    const topHalf = [];
    const bottomHalf = [];
    
    seeds.forEach((seed, i) => {
      if (i % 2 === 0) {
        topHalf.push(seed);
      } else {
        bottomHalf.push(seed);
      }
    });
    
    placeSeeds(topHalf, startPos, mid);
    placeSeeds(bottomHalf, mid + 1, endPos);
  }
  
  placeSeeds(sorted, 0, bracketSize - 1);
  
  return positions.filter(p => p !== null);
}

/**
 * Creates matches for a bracket round
 * @param {string} tournamentId - Tournament ID
 * @param {string} bracketType - 'winner' or 'consolation'
 * @param {number} round - Round number
 * @param {number} matchCount - Number of matches in round
 * @param {number} bestOf - Best of N frames
 * @returns {BracketMatch[]} Created matches
 */
export function createRoundMatches(tournamentId, bracketType, round, matchCount, bestOf) {
  const matches = [];
  
  for (let i = 0; i < matchCount; i++) {
    matches.push({
      id: generateUUID(),
      tournamentId,
      bracketType,
      round,
      position: i,
      player1Id: null,
      player2Id: null,
      winnerId: null,
      nextMatchId: null,
      loserMatchId: null,
      bestOf,
      status: 'pending',
    });
  }
  
  return matches;
}

/**
 * Links matches across rounds (sets nextMatchId)
 * @param {BracketMatch[]} matches - All bracket matches
 * @returns {BracketMatch[]} Matches with links set
 */
export function linkMatches(matches) {
  const byRound = {};
  
  // Group by round
  matches.forEach(match => {
    if (!byRound[match.round]) {
      byRound[match.round] = [];
    }
    byRound[match.round].push(match);
  });
  
  // Sort each round by position
  Object.keys(byRound).forEach(round => {
    byRound[round].sort((a, b) => a.position - b.position);
  });
  
  const rounds = Object.keys(byRound).map(Number).sort((a, b) => a - b);
  
  // Link each match to next round
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = byRound[rounds[i]];
    const nextRound = byRound[rounds[i + 1]];
    
    currentRound.forEach((match, idx) => {
      const nextMatchIdx = Math.floor(idx / 2);
      if (nextRound[nextMatchIdx]) {
        match.nextMatchId = nextRound[nextMatchIdx].id;
      }
    });
  }
  
  return matches;
}

/**
 * Assigns players to first round matches
 * @param {BracketMatch[]} matches - All bracket matches
 * @param {Array<{playerId: string, seed: number}>} seededPlayers - Players in bracket order
 * @returns {BracketMatch[]} Matches with players assigned
 */
export function assignPlayersToFirstRound(matches, seededPlayers) {
  const firstRoundMatches = matches
    .filter(m => m.round === 1)
    .sort((a, b) => a.position - b.position);
  
  // Pair players into matches
  for (let i = 0; i < seededPlayers.length; i += 2) {
    const matchIdx = Math.floor(i / 2);
    if (firstRoundMatches[matchIdx]) {
      firstRoundMatches[matchIdx].player1Id = seededPlayers[i]?.playerId || null;
      firstRoundMatches[matchIdx].player2Id = seededPlayers[i + 1]?.playerId || null;
      
      // Set status based on player assignment
      if (firstRoundMatches[matchIdx].player1Id && firstRoundMatches[matchIdx].player2Id) {
        firstRoundMatches[matchIdx].status = 'ready';
      } else if (firstRoundMatches[matchIdx].player1Id || firstRoundMatches[matchIdx].player2Id) {
        // Bye - auto-advance
        firstRoundMatches[matchIdx].status = 'completed';
        firstRoundMatches[matchIdx].winnerId = 
          firstRoundMatches[matchIdx].player1Id || firstRoundMatches[matchIdx].player2Id;
      }
    }
  }
  
  return matches;
}

/**
 * Generates winner bracket from pool standings
 * Top 2 from each pool advance to winner bracket
 * @param {string} tournamentId - Tournament ID
 * @param {Array<{poolId: string, standings: Array<{playerId: string, position: number}>}>} poolStandings - Pool standings
 * @param {Object} config - Bracket configuration
 * @param {number} config.bestOf - Best of N frames
 * @returns {Bracket} Generated winner bracket
 */
export function generateWinnerBracket(tournamentId, poolStandings, config = {}) {
  const { bestOf = 3 } = config;
  
  // Get top 2 from each pool
  const qualifiers = [];
  poolStandings.forEach((pool, poolIndex) => {
    const topTwo = pool.standings.slice(0, 2);
    topTwo.forEach((standing, posInPool) => {
      // Seed based on pool position: pool winners get lower seeds
      const seed = posInPool === 0 
        ? poolIndex + 1  // Pool winners: 1, 2, 3, 4
        : poolStandings.length + poolIndex + 1;  // Pool runners-up: 5, 6, 7, 8
      qualifiers.push({
        playerId: standing.playerId,
        seed,
        poolId: pool.poolId,
        poolPosition: posInPool + 1,
      });
    });
  });
  
  const playerCount = qualifiers.length;
  const totalRounds = calculateRounds(playerCount);
  
  if (totalRounds === 0) {
    return {
      id: generateUUID(),
      tournamentId,
      type: 'winner',
      matches: [],
      totalRounds: 0,
      status: 'completed',
    };
  }
  
  // Create all matches for all rounds
  let allMatches = [];
  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = matchesInRound(round, totalRounds);
    const matches = createRoundMatches(tournamentId, 'winner', round, matchCount, bestOf);
    allMatches = [...allMatches, ...matches];
  }
  
  // Link matches
  allMatches = linkMatches(allMatches);
  
  // Seed and assign players
  const seededPlayers = seedBracketPositions(qualifiers);
  allMatches = assignPlayersToFirstRound(allMatches, seededPlayers);
  
  return {
    id: generateUUID(),
    tournamentId,
    type: 'winner',
    matches: allMatches,
    totalRounds,
    status: 'in_progress',
  };
}

/**
 * Generates consolation bracket from pool standings
 * Bottom 2 from each pool go to consolation bracket
 * @param {string} tournamentId - Tournament ID
 * @param {Array<{poolId: string, standings: Array<{playerId: string, position: number}>}>} poolStandings - Pool standings
 * @param {Object} config - Bracket configuration
 * @param {number} config.bestOf - Best of N frames
 * @returns {Bracket} Generated consolation bracket
 */
export function generateConsolationBracket(tournamentId, poolStandings, config = {}) {
  const { bestOf = 3 } = config;
  
  // Get bottom 2 from each pool (positions 3 and 4)
  const qualifiers = [];
  poolStandings.forEach((pool, poolIndex) => {
    const bottomTwo = pool.standings.slice(2, 4);
    bottomTwo.forEach((standing, posInPool) => {
      // Seed based on pool position
      const seed = posInPool === 0 
        ? poolIndex + 1  // 3rd place: 1, 2, 3, 4
        : poolStandings.length + poolIndex + 1;  // 4th place: 5, 6, 7, 8
      qualifiers.push({
        playerId: standing.playerId,
        seed,
        poolId: pool.poolId,
        poolPosition: posInPool + 3,  // Position 3 or 4
      });
    });
  });
  
  const playerCount = qualifiers.length;
  const totalRounds = calculateRounds(playerCount);
  
  if (totalRounds === 0) {
    return {
      id: generateUUID(),
      tournamentId,
      type: 'consolation',
      matches: [],
      totalRounds: 0,
      status: 'completed',
    };
  }
  
  // Create all matches for all rounds
  let allMatches = [];
  for (let round = 1; round <= totalRounds; round++) {
    const matchCount = matchesInRound(round, totalRounds);
    const matches = createRoundMatches(tournamentId, 'consolation', round, matchCount, bestOf);
    allMatches = [...allMatches, ...matches];
  }
  
  // Link matches
  allMatches = linkMatches(allMatches);
  
  // Seed and assign players
  const seededPlayers = seedBracketPositions(qualifiers);
  allMatches = assignPlayersToFirstRound(allMatches, seededPlayers);
  
  return {
    id: generateUUID(),
    tournamentId,
    type: 'consolation',
    matches: allMatches,
    totalRounds,
    status: 'in_progress',
  };
}

/**
 * Generates both brackets for a tournament
 * @param {string} tournamentId - Tournament ID
 * @param {Array<{poolId: string, standings: Array<{playerId: string, position: number}>}>} poolStandings - Pool standings
 * @param {Object} config - Bracket configuration
 * @returns {{winner: Bracket, consolation: Bracket}} Both brackets
 */
export function generateBrackets(tournamentId, poolStandings, config = {}) {
  const winner = generateWinnerBracket(tournamentId, poolStandings, config);
  const consolation = generateConsolationBracket(tournamentId, poolStandings, config);
  
  return { winner, consolation };
}

/**
 * Gets the round name
 * @param {number} round - Round number
 * @param {number} totalRounds - Total rounds
 * @returns {string} Round name
 */
export function getRoundName(round, totalRounds) {
  const roundsFromEnd = totalRounds - round;
  
  switch (roundsFromEnd) {
    case 0:
      return 'Final';
    case 1:
      return 'Semi-Finals';
    case 2:
      return 'Quarter-Finals';
    default:
      return `Round ${round}`;
  }
}

/**
 * Gets bracket match by ID
 * @param {Bracket} bracket - Bracket object
 * @param {string} matchId - Match ID
 * @returns {BracketMatch|null} Match or null if not found
 */
export function getBracketMatch(bracket, matchId) {
  return bracket.matches.find(m => m.id === matchId) || null;
}

/**
 * Gets all matches in a round
 * @param {Bracket} bracket - Bracket object
 * @param {number} round - Round number
 * @returns {BracketMatch[]} Matches in round
 */
export function getMatchesByRound(bracket, round) {
  return bracket.matches
    .filter(m => m.round === round)
    .sort((a, b) => a.position - b.position);
}
