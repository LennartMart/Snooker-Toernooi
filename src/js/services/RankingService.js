/**
 * RankingService
 * Calculates final tournament positions and point allocations
 */

import {
  createRankingsForTournament,
  DEFAULT_PARTICIPATION_POINTS,
} from '../models/Ranking.js';
import {
  getBracketWinner,
  getBracketRunnerUp,
  getBracketStandings,
} from './BracketProgressionService.js';

/**
 * Position range for each bracket in a regular tournament
 * Winner bracket: Positions 1-16
 * Consolation bracket: Positions 17-32
 */
export const POSITION_RANGES = {
  winner: { start: 1, end: 16 },
  consolation: { start: 17, end: 32 },
};

/**
 * Position range for Masters tournament (16 players)
 */
export const MASTERS_POSITION_RANGES = {
  winner: { start: 1, end: 8 },
  consolation: { start: 9, end: 16 },
};

/**
 * Gets position ranges based on tournament format
 * @param {string} format - Tournament format ('regular' or 'masters')
 * @returns {Object} Position ranges
 */
export function getPositionRanges(format) {
  return format === 'masters' ? MASTERS_POSITION_RANGES : POSITION_RANGES;
}

/**
 * Calculates final positions from a bracket
 * @param {Object} bracket - Bracket object
 * @param {string} bracketType - 'winner' or 'consolation'
 * @param {string} format - Tournament format
 * @returns {Array<{playerId: string, position: number}>} Final positions
 */
export function calculateBracketPositions(bracket, bracketType, format = 'regular') {
  if (!bracket || !bracket.matches || bracket.matches.length === 0) {
    return [];
  }

  const ranges = getPositionRanges(format);
  const range = ranges[bracketType];
  const bracketStandings = getBracketStandings(bracket);

  // Map bracket standings to absolute positions
  return bracketStandings.map((standing) => ({
    playerId: standing.playerId,
    position: range.start + standing.position - 1,
  }));
}

/**
 * Calculates positions for players eliminated in pool stage
 * (Players who finished 3rd or 4th in pools go to consolation bracket)
 * @param {Array<{id: string, standings: Array}>} pools - Pool data with standings
 * @param {string} format - Tournament format
 * @returns {Array<{playerId: string, position: number}>} Pool-eliminated positions
 */
export function calculatePoolEliminationPositions(pools, _format = 'regular') {
  // In the current format, all players advance to knockout
  // Pool positions 3-4 go to consolation bracket
  // This function handles any edge cases where players don't make knockout
  return [];
}

/**
 * Combines winner and consolation bracket positions
 * @param {Object} winnerBracket - Winner bracket
 * @param {Object} consolationBracket - Consolation bracket
 * @param {string} format - Tournament format
 * @returns {Array<{playerId: string, position: number}>} All positions
 */
export function combineAllPositions(winnerBracket, consolationBracket, format = 'regular') {
  const winnerPositions = calculateBracketPositions(winnerBracket, 'winner', format);
  const consolationPositions = calculateBracketPositions(
    consolationBracket,
    'consolation',
    format
  );

  return [...winnerPositions, ...consolationPositions].sort((a, b) => a.position - b.position);
}

/**
 * Calculates complete tournament rankings with points
 * @param {Object} tournament - Tournament object
 * @returns {import('../models/Ranking.js').RankingData[]} Rankings
 */
export function calculateTournamentRankings(tournament) {
  if (!tournament) {
    throw new Error('Tournament is required');
  }

  const { format, brackets, config } = tournament;
  const totalPlayers = config?.playerCount || 32;
  const participationPoints =
    config?.participationPoints ?? DEFAULT_PARTICIPATION_POINTS;

  // Get positions from both brackets
  const positions = combineAllPositions(
    brackets?.winner,
    brackets?.consolation,
    format
  );

  // Filter out bye players
  const realPlayerPositions = positions.filter((p) => {
    const player = tournament.playerIds?.includes(p.playerId);
    return player;
  });

  // Create rankings with points
  return createRankingsForTournament(realPlayerPositions, participationPoints, totalPlayers);
}

/**
 * Gets the tournament champion
 * @param {Object} tournament - Tournament object
 * @returns {string|null} Champion player ID
 */
export function getTournamentChampion(tournament) {
  if (!tournament?.brackets?.winner) {
    return null;
  }
  return getBracketWinner(tournament.brackets.winner);
}

/**
 * Gets the tournament runner-up
 * @param {Object} tournament - Tournament object
 * @returns {string|null} Runner-up player ID
 */
export function getTournamentRunnerUp(tournament) {
  if (!tournament?.brackets?.winner) {
    return null;
  }
  return getBracketRunnerUp(tournament.brackets.winner);
}

/**
 * Gets players at specific positions
 * @param {import('../models/Ranking.js').RankingData[]} rankings - Tournament rankings
 * @param {number[]} positions - Position numbers to find
 * @returns {import('../models/Ranking.js').RankingData[]} Matching rankings
 */
export function getPlayersAtPositions(rankings, positions) {
  return rankings.filter((r) => positions.includes(r.position));
}

/**
 * Gets top N players by position
 * @param {import('../models/Ranking.js').RankingData[]} rankings - Tournament rankings
 * @param {number} n - Number of top players
 * @returns {import('../models/Ranking.js').RankingData[]} Top N rankings
 */
export function getTopPlayers(rankings, n) {
  return [...rankings].sort((a, b) => a.position - b.position).slice(0, n);
}

/**
 * Validates that all players have rankings
 * @param {Object} tournament - Tournament object
 * @param {import('../models/Ranking.js').RankingData[]} rankings - Rankings to validate
 * @returns {{valid: boolean, missing: string[]}} Validation result
 */
export function validateRankingsComplete(tournament, rankings) {
  if (!tournament?.playerIds) {
    return { valid: false, missing: [] };
  }

  // Filter out bye players
  const realPlayers = tournament.playerIds.filter((id) => {
    // Check if player exists and is not a bye
    // In a real implementation, we'd check the player object
    return id !== null && id !== undefined;
  });

  const rankedPlayerIds = new Set(rankings.map((r) => r.playerId));
  const missing = realPlayers.filter((id) => !rankedPlayerIds.has(id));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Gets the position label (1st, 2nd, 3rd, etc.)
 * @param {number} position - Position number
 * @returns {string} Position label
 */
export function getPositionLabel(position) {
  if (position === 1) {
    return '1st';
  }
  if (position === 2) {
    return '2nd';
  }
  if (position === 3) {
    return '3rd';
  }
  return `${position}th`;
}

/**
 * Creates a summary of tournament results
 * @param {Object} tournament - Tournament object
 * @param {import('../models/Ranking.js').RankingData[]} rankings - Rankings
 * @returns {Object} Results summary
 */
export function createTournamentResultsSummary(tournament, rankings) {
  const champion = getTournamentChampion(tournament);
  const runnerUp = getTournamentRunnerUp(tournament);
  const sortedRankings = [...rankings].sort((a, b) => a.position - b.position);

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    date: tournament.date,
    format: tournament.format,
    champion,
    runnerUp,
    totalPlayers: rankings.length,
    rankings: sortedRankings,
    isComplete: tournament.status === 'complete',
  };
}

export default {
  POSITION_RANGES,
  MASTERS_POSITION_RANGES,
  getPositionRanges,
  calculateBracketPositions,
  calculatePoolEliminationPositions,
  combineAllPositions,
  calculateTournamentRankings,
  getTournamentChampion,
  getTournamentRunnerUp,
  getPlayersAtPositions,
  getTopPlayers,
  validateRankingsComplete,
  getPositionLabel,
  createTournamentResultsSummary,
};
