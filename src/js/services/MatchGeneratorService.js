/**
 * Match Generator Service
 * Generates matches from pools and knockout brackets
 */

import { createMatch, MatchStage, MatchStatus } from '../models/Match.js';
import { generateRoundRobinPairings } from './PoolGeneratorService.js';
import { generateUUID } from '../utils/uuid.js';

/**
 * @typedef {Object} MatchGeneratorOptions
 * @property {string} tournamentId - Tournament ID
 * @property {import('../models/Pool.js').PoolData[]} pools - Tournament pools
 * @property {number} bestOf - Best of N frames
 */

/**
 * Generates all pool stage matches for a tournament
 * @param {MatchGeneratorOptions} options - Generation options
 * @returns {{matches: import('../models/Match.js').MatchData[], poolUpdates: Object[]}} Generated matches and pool updates
 */
export function generatePoolMatches(options) {
  const { tournamentId, pools, bestOf } = options;
  const allMatches = [];
  const poolUpdates = [];

  for (const pool of pools) {
    const pairings = generateRoundRobinPairings(pool.playerIds);
    const poolMatchIds = [];

    for (const pairing of pairings) {
      // Check if either player is a bye player
      const isByeMatch = pool.playerIds.some((id) => {
        // Bye players have IDs starting with 'bye-'
        return (id === pairing.player1Id || id === pairing.player2Id) && id.startsWith('bye-');
      });

      const match = createMatch({
        id: generateUUID(),
        tournamentId,
        poolId: pool.id,
        roundId: null, // Pool matches don't have a knockout round
        stage: MatchStage.POOL,
        player1Id: pairing.player1Id,
        player2Id: pairing.player2Id,
        frames: [],
        winnerId: null,
        status: MatchStatus.PENDING,
        bestOf,
        isByeMatch,
        scheduledRound: pairing.round,
        nextMatchId: null,
        loserMatchId: null,
      });

      allMatches.push(match);
      poolMatchIds.push(match.id);
    }

    // Track pool match IDs
    poolUpdates.push({
      poolId: pool.id,
      matchIds: poolMatchIds,
    });
  }

  return {
    matches: allMatches,
    poolUpdates,
  };
}

/**
 * @typedef {Object} KnockoutMatchGeneratorOptions
 * @property {string} tournamentId - Tournament ID
 * @property {string} roundId - Knockout round ID
 * @property {string} bracketType - 'winner' or 'consolation'
 * @property {number} matchCount - Number of matches in this round
 * @property {number} bestOf - Best of N frames
 * @property {string} [nextRoundId] - ID of next round (for winner progression)
 * @property {string} [loserRoundId] - ID of loser bracket round (for winner bracket losses)
 */

/**
 * Generates knockout round matches (empty, to be filled when pool stage completes)
 * @param {KnockoutMatchGeneratorOptions} options - Generation options
 * @returns {import('../models/Match.js').MatchData[]} Generated matches
 */
export function generateKnockoutRoundMatches(options) {
  const {
    tournamentId,
    roundId,
    bracketType,
    matchCount,
    bestOf,
    // nextRoundId and loserRoundId are used when linking brackets
    // nextRoundId,
    // loserRoundId,
  } = options;

  const matches = [];

  for (let i = 0; i < matchCount; i++) {
    const match = createMatch({
      id: generateUUID(),
      tournamentId,
      poolId: null,
      roundId,
      stage: bracketType === 'winner' ? MatchStage.KNOCKOUT_WINNER : MatchStage.KNOCKOUT_CONSOLATION,
      player1Id: null, // To be filled from pool results
      player2Id: null,
      frames: [],
      winnerId: null,
      status: MatchStatus.PENDING,
      bestOf,
      isByeMatch: false,
      scheduledRound: null,
      nextMatchId: null, // Will be set when linking bracket
      loserMatchId: null, // Will be set for winner bracket
    });

    matches.push(match);
  }

  return matches;
}

/**
 * Links knockout matches to create bracket progression
 * @param {import('../models/Match.js').MatchData[]} currentRoundMatches - Matches in current round
 * @param {import('../models/Match.js').MatchData[]} nextRoundMatches - Matches in next round
 * @returns {import('../models/Match.js').MatchData[]} Updated current round matches
 */
export function linkKnockoutMatches(currentRoundMatches, nextRoundMatches) {
  // For a typical knockout bracket:
  // Match 0 and 1 winners go to next round match 0
  // Match 2 and 3 winners go to next round match 1
  // etc.

  const updatedMatches = [...currentRoundMatches];

  for (let i = 0; i < currentRoundMatches.length; i++) {
    const nextMatchIndex = Math.floor(i / 2);
    
    if (nextMatchIndex < nextRoundMatches.length) {
      updatedMatches[i] = {
        ...updatedMatches[i],
        nextMatchId: nextRoundMatches[nextMatchIndex].id,
      };
    }
  }

  return updatedMatches;
}

/**
 * Creates a bye match that auto-completes
 * @param {Object} params - Match parameters
 * @param {string} params.tournamentId - Tournament ID
 * @param {string} params.poolId - Pool ID (if pool stage)
 * @param {string} params.roundId - Round ID (if knockout stage)
 * @param {string} params.stage - Match stage
 * @param {string} params.player1Id - First player ID (real player)
 * @param {string} params.player2Id - Second player ID (bye player)
 * @param {number} params.bestOf - Best of N frames
 * @returns {import('../models/Match.js').MatchData} Completed bye match
 */
export function createByeMatch(params) {
  const { tournamentId, poolId, roundId, stage, player1Id, player2Id, bestOf } = params;

  // Determine which player is the bye
  const isBye1 = player1Id?.startsWith('bye-');
  const isBye2 = player2Id?.startsWith('bye-');
  
  // Real player wins by default
  const winnerId = isBye1 ? player2Id : isBye2 ? player1Id : null;

  const match = createMatch({
    id: generateUUID(),
    tournamentId,
    poolId,
    roundId,
    stage,
    player1Id,
    player2Id,
    frames: [], // Bye matches have no frames
    winnerId,
    status: winnerId ? MatchStatus.COMPLETED : MatchStatus.PENDING,
    bestOf,
    isByeMatch: true,
    scheduledRound: null,
    nextMatchId: null,
    loserMatchId: null,
  });

  return match;
}

/**
 * Calculates match count for a knockout round
 * @param {number} totalPlayers - Total players entering the bracket
 * @param {number} roundNumber - Round number (1 = first round)
 * @returns {number} Number of matches in the round
 */
export function calculateMatchCount(totalPlayers, roundNumber) {
  // First round: totalPlayers / 2
  // Each subsequent round halves the matches
  return Math.ceil(totalPlayers / Math.pow(2, roundNumber));
}

/**
 * Validates generated matches
 * @param {import('../models/Match.js').MatchData[]} matches - Matches to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateMatches(matches) {
  const errors = [];

  if (matches.length === 0) {
    errors.push('No matches generated');
    return { valid: false, errors };
  }

  // Check all matches have required fields
  for (const match of matches) {
    if (!match.id) {
      errors.push('Match missing ID');
    }
    if (!match.tournamentId) {
      errors.push('Match missing tournament ID');
    }
    if (!match.stage) {
      errors.push('Match missing stage');
    }
    if (match.bestOf < 1) {
      errors.push(`Match ${match.id} has invalid bestOf value: ${match.bestOf}`);
    }
  }

  // Check for duplicate match IDs
  const matchIds = matches.map((m) => m.id);
  const uniqueIds = new Set(matchIds);
  
  if (uniqueIds.size !== matchIds.length) {
    errors.push('Duplicate match IDs found');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets match statistics
 * @param {import('../models/Match.js').MatchData[]} matches - Matches to analyze
 * @returns {Object} Match statistics
 */
export function getMatchStatistics(matches) {
  const poolMatches = matches.filter((m) => m.stage === MatchStage.POOL);
  const knockoutMatches = matches.filter((m) => 
    m.stage === MatchStage.KNOCKOUT_WINNER || m.stage === MatchStage.KNOCKOUT_CONSOLATION
  );

  return {
    totalMatches: matches.length,
    poolMatches: poolMatches.length,
    knockoutMatches: knockoutMatches.length,
    byeMatches: matches.filter((m) => m.isByeMatch).length,
    completedMatches: matches.filter((m) => m.status === MatchStatus.COMPLETED).length,
    pendingMatches: matches.filter((m) => m.status === MatchStatus.PENDING).length,
    inProgressMatches: matches.filter((m) => m.status === MatchStatus.IN_PROGRESS).length,
  };
}

export default {
  generatePoolMatches,
  generateKnockoutRoundMatches,
  linkKnockoutMatches,
  createByeMatch,
  calculateMatchCount,
  validateMatches,
  getMatchStatistics,
};
