/**
 * Break Service
 * Handles recording and retrieving high breaks
 */

import { createBreak, DEFAULT_BREAK_THRESHOLD, MASTERS_BREAK_THRESHOLD } from '../models/Break.js';
import { TournamentFormat } from '../models/Tournament.js';
import { validateBreakScore } from '../utils/index.js';

/**
 * Records a break
 * @param {Object} params - Break parameters
 * @param {string} params.tournamentId - Tournament ID
 * @param {string} params.matchId - Match ID
 * @param {string} params.playerId - Player ID who made the break
 * @param {number} params.value - Break value
 * @param {number|null} [params.frameNumber] - Frame number
 * @param {number} [params.threshold] - Break threshold (defaults based on tournament)
 * @returns {import('../models/Break.js').BreakData}
 */
export function recordBreak({ tournamentId, matchId, playerId, value, frameNumber, threshold = DEFAULT_BREAK_THRESHOLD }) {
  // Validate break value
  const validation = validateBreakScore(value);
  if (!validation.valid) {
    throw new Error(`Invalid break: ${validation.errors.join(', ')}`);
  }

  // Check against threshold
  if (value < threshold) {
    throw new Error(`Break value ${value} is below threshold of ${threshold}`);
  }

  return createBreak({
    tournamentId,
    matchId,
    playerId,
    value,
    frameNumber,
    threshold,
  });
}

/**
 * Gets the appropriate break threshold for a tournament format
 * @param {string} format - Tournament format
 * @returns {number}
 */
export function getBreakThreshold(format) {
  if (format === TournamentFormat.MASTERS) {
    return MASTERS_BREAK_THRESHOLD;
  }
  return DEFAULT_BREAK_THRESHOLD;
}

/**
 * Filters breaks by match
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} matchId - Match ID to filter by
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function getBreaksByMatch(breaks, matchId) {
  return breaks.filter((b) => b.matchId === matchId);
}

/**
 * Filters breaks by player
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} playerId - Player ID to filter by
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function getBreaksByPlayer(breaks, playerId) {
  return breaks.filter((b) => b.playerId === playerId);
}

/**
 * Filters breaks by tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} tournamentId - Tournament ID to filter by
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function getBreaksByTournament(breaks, tournamentId) {
  return breaks.filter((b) => b.tournamentId === tournamentId);
}

/**
 * Gets the highest break from an array
 * @param {import('../models/Break.js').BreakData[]} breaks - Breaks to search
 * @returns {import('../models/Break.js').BreakData|null}
 */
export function getHighestBreak(breaks) {
  if (!breaks || breaks.length === 0) {
    return null;
  }

  return breaks.reduce((highest, current) => (current.value > highest.value ? current : highest), breaks[0]);
}

/**
 * Gets the highest break value from an array
 * @param {import('../models/Break.js').BreakData[]} breaks - Breaks to search
 * @returns {number}
 */
export function getHighestBreakValue(breaks) {
  const highest = getHighestBreak(breaks);
  return highest ? highest.value : 0;
}

/**
 * Gets breaks above a certain threshold
 * @param {import('../models/Break.js').BreakData[]} breaks - Breaks to filter
 * @param {number} threshold - Minimum value
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function getBreaksAboveThreshold(breaks, threshold) {
  return breaks.filter((b) => b.value >= threshold);
}

/**
 * Gets break statistics for a player
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} playerId - Player ID
 * @returns {{ count: number, highest: number, total: number, average: number }}
 */
export function getPlayerBreakStats(breaks, playerId) {
  const playerBreaks = getBreaksByPlayer(breaks, playerId);

  if (playerBreaks.length === 0) {
    return { count: 0, highest: 0, total: 0, average: 0 };
  }

  const total = playerBreaks.reduce((sum, b) => sum + b.value, 0);
  const highest = getHighestBreakValue(playerBreaks);

  return {
    count: playerBreaks.length,
    highest,
    total,
    average: Math.round(total / playerBreaks.length),
  };
}

/**
 * Gets break statistics for a tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} tournamentId - Tournament ID
 * @returns {{ count: number, highest: number, highestPlayerId: string|null, centuryCount: number }}
 */
export function getTournamentBreakStats(breaks, tournamentId) {
  const tournamentBreaks = getBreaksByTournament(breaks, tournamentId);

  if (tournamentBreaks.length === 0) {
    return { count: 0, highest: 0, highestPlayerId: null, centuryCount: 0 };
  }

  const highestBreak = getHighestBreak(tournamentBreaks);
  const centuryCount = tournamentBreaks.filter((b) => b.value >= 100).length;

  return {
    count: tournamentBreaks.length,
    highest: highestBreak ? highestBreak.value : 0,
    highestPlayerId: highestBreak ? highestBreak.playerId : null,
    centuryCount,
  };
}

/**
 * Sorts breaks by value (descending)
 * @param {import('../models/Break.js').BreakData[]} breaks - Breaks to sort
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function sortBreaksByValue(breaks) {
  return [...breaks].sort((a, b) => b.value - a.value);
}

/**
 * Sorts breaks by date (most recent first)
 * @param {import('../models/Break.js').BreakData[]} breaks - Breaks to sort
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function sortBreaksByDate(breaks) {
  return [...breaks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Adds a break to an array
 * @param {import('../models/Break.js').BreakData[]} breaks - Existing breaks
 * @param {import('../models/Break.js').BreakData} breakData - Break to add
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function addBreakToArray(breaks, breakData) {
  return [...breaks, breakData];
}

/**
 * Removes a break from an array
 * @param {import('../models/Break.js').BreakData[]} breaks - Existing breaks
 * @param {string} breakId - ID of break to remove
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function removeBreakFromArray(breaks, breakId) {
  return breaks.filter((b) => b.id !== breakId);
}

export default {
  recordBreak,
  getBreakThreshold,
  getBreaksByMatch,
  getBreaksByPlayer,
  getBreaksByTournament,
  getHighestBreak,
  getHighestBreakValue,
  getBreaksAboveThreshold,
  getPlayerBreakStats,
  getTournamentBreakStats,
  sortBreaksByValue,
  sortBreaksByDate,
  addBreakToArray,
  removeBreakFromArray,
};
