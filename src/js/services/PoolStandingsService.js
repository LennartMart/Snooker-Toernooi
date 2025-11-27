/**
 * Pool Standings Service
 * Calculates pool standings with tiebreakers
 */

import {
  calculatePlayerStanding,
  groupByMatchesWon,
  resolveTiebreaker,
  needsTiebreaker,
} from './TiebreakerService.js';
import { getMatchesByPool } from './MatchService.js';

/**
 * @typedef {import('./TiebreakerService.js').PlayerStanding} PlayerStanding
 */

/**
 * @typedef {Object} PoolStandings
 * @property {string} poolId - Pool ID
 * @property {string} poolName - Pool name
 * @property {PlayerStanding[]} standings - Sorted player standings
 * @property {boolean} isComplete - Whether all matches are complete
 * @property {boolean} hasTiebreaker - Whether any tiebreakers were applied
 * @property {string[]} shootoutRequired - Player IDs requiring shootout
 */

/**
 * Calculates standings for a pool
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} poolId - Pool ID
 * @param {Object.<string, string>} [shootoutResults={}] - Shootout results
 * @returns {PoolStandings}
 */
export function calculatePoolStandings(tournament, poolId, shootoutResults = {}) {
  const pool = tournament.pools.find((p) => p.id === poolId);
  if (!pool) {
    throw new Error(`Pool with ID ${poolId} not found`);
  }

  const poolMatches = getMatchesByPool(tournament, poolId);

  // Calculate standings for each player
  const standings = pool.playerIds.map((playerId) =>
    calculatePlayerStanding(playerId, poolMatches, tournament.breaks)
  );

  // Check if all matches are complete
  const completedMatches = poolMatches.filter((m) => m.winnerId !== null);
  const isComplete = completedMatches.length === poolMatches.length;

  // Sort by matches won first
  standings.sort((a, b) => b.matchesWon - a.matchesWon);

  // Group players with equal matches won
  const groups = groupByMatchesWon(standings);
  const hasTiebreaker = needsTiebreaker(standings);

  // Apply tiebreakers to each group
  let shootoutRequired = [];
  const resolvedStandings = [];

  // Get sorted win counts (descending)
  const winCounts = Array.from(groups.keys()).sort((a, b) => b - a);

  for (const wins of winCounts) {
    const tiedPlayers = groups.get(wins);

    if (tiedPlayers.length > 1) {
      const result = resolveTiebreaker(tiedPlayers, poolMatches, shootoutResults);
      resolvedStandings.push(...result.resolved);
      if (result.needsShootout) {
        shootoutRequired = [...shootoutRequired, ...result.shootoutPlayers];
      }
    } else {
      resolvedStandings.push(...tiedPlayers);
    }
  }

  // Assign positions
  resolvedStandings.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return {
    poolId,
    poolName: pool.name,
    standings: resolvedStandings,
    isComplete,
    hasTiebreaker,
    shootoutRequired,
  };
}

/**
 * Gets standings for all pools in a tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {Object.<string, Object.<string, string>>} [allShootoutResults={}] - All shootout results by pool
 * @returns {PoolStandings[]}
 */
export function getAllPoolStandings(tournament, allShootoutResults = {}) {
  return tournament.pools.map((pool) =>
    calculatePoolStandings(tournament, pool.id, allShootoutResults[pool.id] || {})
  );
}

/**
 * Gets top N players from a pool standings
 * @param {PoolStandings} standings - Pool standings
 * @param {number} n - Number of players to get
 * @returns {PlayerStanding[]}
 */
export function getTopPlayers(standings, n) {
  return standings.standings.slice(0, n);
}

/**
 * Gets bottom N players from a pool standings
 * @param {PoolStandings} standings - Pool standings
 * @param {number} n - Number of players to get
 * @returns {PlayerStanding[]}
 */
export function getBottomPlayers(standings, n) {
  return standings.standings.slice(-n);
}

/**
 * Gets players by position range
 * @param {PoolStandings} standings - Pool standings
 * @param {number} startPosition - Start position (1-indexed)
 * @param {number} endPosition - End position (1-indexed)
 * @returns {PlayerStanding[]}
 */
export function getPlayersByPositionRange(standings, startPosition, endPosition) {
  return standings.standings.filter(
    (s) => s.position >= startPosition && s.position <= endPosition
  );
}

/**
 * Checks if a pool needs shootout to determine standings
 * @param {PoolStandings} standings - Pool standings
 * @returns {boolean}
 */
export function needsShootout(standings) {
  return standings.shootoutRequired.length > 0;
}

/**
 * Gets all pools that need shootout
 * @param {PoolStandings[]} allStandings - All pool standings
 * @returns {PoolStandings[]}
 */
export function getPoolsNeedingShootout(allStandings) {
  return allStandings.filter(needsShootout);
}

/**
 * Checks if all pools are complete
 * @param {PoolStandings[]} allStandings - All pool standings
 * @returns {boolean}
 */
export function areAllPoolsComplete(allStandings) {
  return allStandings.every((s) => s.isComplete && s.shootoutRequired.length === 0);
}

/**
 * Gets pool progress summary
 * @param {PoolStandings[]} allStandings - All pool standings
 * @returns {{ completed: number, total: number, needsShootout: number }}
 */
export function getPoolProgress(allStandings) {
  return {
    completed: allStandings.filter((s) => s.isComplete && s.shootoutRequired.length === 0).length,
    total: allStandings.length,
    needsShootout: allStandings.filter(needsShootout).length,
  };
}

/**
 * Validates pool standings
 * @param {PoolStandings} standings - Pool standings
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePoolStandings(standings) {
  const errors = [];

  // Check for duplicate positions
  const positions = standings.standings.map((s) => s.position);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    errors.push('Duplicate positions detected');
  }

  // Check positions are sequential
  const sortedPositions = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== i + 1) {
      errors.push(`Position ${i + 1} is missing`);
    }
  }

  // Check standings are properly sorted
  for (let i = 0; i < standings.standings.length - 1; i++) {
    const current = standings.standings[i];
    const next = standings.standings[i + 1];
    if (current.position > next.position) {
      errors.push('Standings are not properly sorted by position');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  calculatePoolStandings,
  getAllPoolStandings,
  getTopPlayers,
  getBottomPlayers,
  getPlayersByPositionRange,
  needsShootout,
  getPoolsNeedingShootout,
  areAllPoolsComplete,
  getPoolProgress,
  validatePoolStandings,
};
