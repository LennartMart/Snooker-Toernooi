/**
 * Shootout Service
 * Handles shootout tiebreaker recording and resolution
 */

import { generateUUID } from '../utils/index.js';

/**
 * @typedef {Object} ShootoutResult
 * @property {string} id - Unique identifier
 * @property {string} poolId - Pool ID
 * @property {string} player1Id - First player ID
 * @property {string} player2Id - Second player ID
 * @property {string} winnerId - Winner player ID
 * @property {number} player1Score - Player 1's shootout score
 * @property {number} player2Score - Player 2's shootout score
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} ShootoutConfig
 * @property {string} poolId - Pool ID
 * @property {string} player1Id - First player ID
 * @property {string} player2Id - Second player ID
 */

/**
 * Creates a new shootout result
 * @param {Object} params - Shootout parameters
 * @param {string} params.poolId - Pool ID
 * @param {string} params.player1Id - First player ID
 * @param {string} params.player2Id - Second player ID
 * @param {string} params.winnerId - Winner player ID
 * @param {number} [params.player1Score] - Player 1's score
 * @param {number} [params.player2Score] - Player 2's score
 * @returns {ShootoutResult}
 */
export function createShootoutResult({
  poolId,
  player1Id,
  player2Id,
  winnerId,
  player1Score = 0,
  player2Score = 0,
}) {
  if (!poolId || typeof poolId !== 'string') {
    throw new Error('poolId is required');
  }

  if (!player1Id || typeof player1Id !== 'string') {
    throw new Error('player1Id is required');
  }

  if (!player2Id || typeof player2Id !== 'string') {
    throw new Error('player2Id is required');
  }

  if (!winnerId || typeof winnerId !== 'string') {
    throw new Error('winnerId is required');
  }

  if (winnerId !== player1Id && winnerId !== player2Id) {
    throw new Error('winnerId must be one of the players');
  }

  return {
    id: generateUUID(),
    poolId,
    player1Id,
    player2Id,
    winnerId,
    player1Score,
    player2Score,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Records a shootout result
 * @param {ShootoutResult[]} shootouts - Existing shootouts
 * @param {Object} params - Shootout parameters
 * @returns {ShootoutResult[]}
 */
export function recordShootout(shootouts, params) {
  const result = createShootoutResult(params);
  return [...shootouts, result];
}

/**
 * Gets shootout results for a pool
 * @param {ShootoutResult[]} shootouts - All shootouts
 * @param {string} poolId - Pool ID
 * @returns {ShootoutResult[]}
 */
export function getShootoutsByPool(shootouts, poolId) {
  return shootouts.filter((s) => s.poolId === poolId);
}

/**
 * Converts shootout results to tiebreaker format
 * @param {ShootoutResult[]} shootouts - Shootout results
 * @returns {Object.<string, string>} Map of player pair key to winner ID
 */
export function shootoutsToTiebreakerFormat(shootouts) {
  const result = {};

  for (const shootout of shootouts) {
    const key = [shootout.player1Id, shootout.player2Id].sort().join('-');
    result[key] = shootout.winnerId;
  }

  return result;
}

/**
 * Gets pending shootouts (players who need to have a shootout)
 * @param {string[]} playersNeedingShootout - Player IDs requiring shootout
 * @param {ShootoutResult[]} existingShootouts - Already completed shootouts
 * @returns {Array<{player1Id: string, player2Id: string}>}
 */
export function getPendingShootouts(playersNeedingShootout, existingShootouts) {
  const pending = [];
  const completedKeys = new Set(
    existingShootouts.map((s) => [s.player1Id, s.player2Id].sort().join('-'))
  );

  // Generate all pairs
  for (let i = 0; i < playersNeedingShootout.length; i++) {
    for (let j = i + 1; j < playersNeedingShootout.length; j++) {
      const player1Id = playersNeedingShootout[i];
      const player2Id = playersNeedingShootout[j];
      const key = [player1Id, player2Id].sort().join('-');

      if (!completedKeys.has(key)) {
        pending.push({ player1Id, player2Id });
      }
    }
  }

  return pending;
}

/**
 * Gets shootout result between two players
 * @param {ShootoutResult[]} shootouts - All shootouts
 * @param {string} player1Id - First player ID
 * @param {string} player2Id - Second player ID
 * @returns {ShootoutResult|undefined}
 */
export function getShootoutBetweenPlayers(shootouts, player1Id, player2Id) {
  const key = [player1Id, player2Id].sort().join('-');

  return shootouts.find((s) => {
    const shootoutKey = [s.player1Id, s.player2Id].sort().join('-');
    return shootoutKey === key;
  });
}

/**
 * Checks if all required shootouts are complete
 * @param {string[]} playersNeedingShootout - Player IDs requiring shootout
 * @param {ShootoutResult[]} existingShootouts - Already completed shootouts
 * @returns {boolean}
 */
export function areShootoutsComplete(playersNeedingShootout, existingShootouts) {
  return getPendingShootouts(playersNeedingShootout, existingShootouts).length === 0;
}

/**
 * Validates a shootout result
 * @param {ShootoutResult} shootout - Shootout to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateShootout(shootout) {
  const errors = [];

  if (!shootout.id) {
    errors.push('Shootout ID is required');
  }

  if (!shootout.poolId) {
    errors.push('Pool ID is required');
  }

  if (!shootout.player1Id || !shootout.player2Id) {
    errors.push('Both player IDs are required');
  }

  if (!shootout.winnerId) {
    errors.push('Winner ID is required');
  } else if (shootout.winnerId !== shootout.player1Id && shootout.winnerId !== shootout.player2Id) {
    errors.push('Winner must be one of the players');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Removes a shootout result
 * @param {ShootoutResult[]} shootouts - All shootouts
 * @param {string} shootoutId - ID to remove
 * @returns {ShootoutResult[]}
 */
export function removeShootout(shootouts, shootoutId) {
  return shootouts.filter((s) => s.id !== shootoutId);
}

/**
 * Gets all shootouts for a tournament
 * @param {ShootoutResult[]} shootouts - All shootouts
 * @param {string[]} poolIds - Pool IDs in the tournament
 * @returns {ShootoutResult[]}
 */
export function getShootoutsForTournament(shootouts, poolIds) {
  const poolIdSet = new Set(poolIds);
  return shootouts.filter((s) => poolIdSet.has(s.poolId));
}

export default {
  createShootoutResult,
  recordShootout,
  getShootoutsByPool,
  shootoutsToTiebreakerFormat,
  getPendingShootouts,
  getShootoutBetweenPlayers,
  areShootoutsComplete,
  validateShootout,
  removeShootout,
  getShootoutsForTournament,
};
