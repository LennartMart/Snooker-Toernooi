/**
 * Pool Model
 * Represents a group of players for round-robin phase
 */

import { generateUUID } from '../utils/uuid.js';

/**
 * @typedef {Object} PoolStanding
 * @property {number} position - 1-4 (position in pool)
 * @property {string} playerId - Player reference
 * @property {number} played - Matches played
 * @property {number} won - Matches won
 * @property {number} lost - Matches lost
 * @property {number} framesFor - Frames won
 * @property {number} framesAgainst - Frames lost
 * @property {number} highestBreak - Highest break in pool
 * @property {number|null} shootoutPosition - Manual override (if needed)
 */

/**
 * @typedef {Object} PoolData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Pool name (e.g., "Pool A")
 * @property {string} tournamentId - Reference to tournament
 * @property {string[]} playerIds - Players in this pool (ordered)
 * @property {string[]} matchIds - All pool matches
 * @property {PoolStanding[]} standings - Calculated standings
 * @property {boolean} isFinalized - True when standings confirmed
 */

/**
 * Pool name generator (A, B, C, ..., Z, AA, AB, ...)
 * @param {number} index - 0-based index
 * @returns {string} Pool name
 */
export function generatePoolName(index) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < 26) {
    return `Pool ${letters[index]}`;
  }
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return `Pool ${letters[first]}${letters[second]}`;
}

/**
 * Creates a new Pool instance
 * @param {Object} params - Pool parameters
 * @returns {PoolData}
 */
export function createPool({
  id,
  name,
  tournamentId,
  playerIds = [],
  matchIds = [],
  standings = [],
  isFinalized = false,
} = {}) {
  if (!tournamentId || typeof tournamentId !== 'string') {
    throw new Error('Pool requires a valid tournamentId');
  }

  if (!name || typeof name !== 'string') {
    throw new Error('Pool requires a valid name');
  }

  return {
    id: id || generateUUID(),
    name,
    tournamentId,
    playerIds: Array.isArray(playerIds) ? [...playerIds] : [],
    matchIds: Array.isArray(matchIds) ? [...matchIds] : [],
    standings: Array.isArray(standings) ? [...standings] : [],
    isFinalized: Boolean(isFinalized),
  };
}

/**
 * Creates an empty pool standing for a player
 * @param {string} playerId - Player ID
 * @param {number} [position=0] - Initial position
 * @returns {PoolStanding}
 */
export function createPoolStanding(playerId, position = 0) {
  return {
    position,
    playerId,
    played: 0,
    won: 0,
    lost: 0,
    framesFor: 0,
    framesAgainst: 0,
    highestBreak: 0,
    shootoutPosition: null,
  };
}

/**
 * Adds a player to a pool
 * @param {PoolData} pool - Pool to update
 * @param {string} playerId - Player ID to add
 * @returns {PoolData} Updated pool
 */
export function addPlayerToPool(pool, playerId) {
  if (pool.playerIds.includes(playerId)) {
    return pool;
  }

  return {
    ...pool,
    playerIds: [...pool.playerIds, playerId],
  };
}

/**
 * Adds a match to a pool
 * @param {PoolData} pool - Pool to update
 * @param {string} matchId - Match ID to add
 * @returns {PoolData} Updated pool
 */
export function addMatchToPool(pool, matchId) {
  if (pool.matchIds.includes(matchId)) {
    return pool;
  }

  return {
    ...pool,
    matchIds: [...pool.matchIds, matchId],
  };
}

/**
 * Updates pool standings
 * @param {PoolData} pool - Pool to update
 * @param {PoolStanding[]} standings - New standings
 * @returns {PoolData} Updated pool
 */
export function updatePoolStandings(pool, standings) {
  return {
    ...pool,
    standings: [...standings],
  };
}

/**
 * Sets a shootout position for a player
 * @param {PoolData} pool - Pool to update
 * @param {string} playerId - Player ID
 * @param {number} position - Shootout result position
 * @returns {PoolData} Updated pool
 */
export function setShootoutPosition(pool, playerId, position) {
  const standings = pool.standings.map((standing) =>
    standing.playerId === playerId ? { ...standing, shootoutPosition: position } : standing
  );

  return {
    ...pool,
    standings,
  };
}

/**
 * Finalizes a pool (locks standings)
 * @param {PoolData} pool - Pool to finalize
 * @returns {PoolData} Finalized pool
 */
export function finalizePool(pool) {
  return {
    ...pool,
    isFinalized: true,
  };
}

/**
 * Gets players at a specific position in pool standings
 * @param {PoolData} pool - Pool to query
 * @param {number} position - Position (1-based)
 * @returns {string[]} Player IDs at that position
 */
export function getPlayersAtPosition(pool, position) {
  return pool.standings.filter((s) => s.position === position).map((s) => s.playerId);
}

/**
 * Validates a pool object
 * @param {PoolData} pool - Pool to validate
 * @returns {boolean}
 */
export function isValidPool(pool) {
  return (
    pool &&
    typeof pool.id === 'string' &&
    typeof pool.name === 'string' &&
    typeof pool.tournamentId === 'string' &&
    Array.isArray(pool.playerIds) &&
    Array.isArray(pool.matchIds) &&
    Array.isArray(pool.standings) &&
    typeof pool.isFinalized === 'boolean'
  );
}

/**
 * Serializes a pool to a plain object for storage
 * @param {PoolData} pool - Pool to serialize
 * @returns {PoolData}
 */
export function serializePool(pool) {
  return {
    id: pool.id,
    name: pool.name,
    tournamentId: pool.tournamentId,
    playerIds: [...pool.playerIds],
    matchIds: [...pool.matchIds],
    standings: pool.standings.map((s) => ({ ...s })),
    isFinalized: pool.isFinalized,
  };
}

/**
 * Deserializes a plain object to a pool
 * @param {Object} data - Data to deserialize
 * @returns {PoolData}
 */
export function deserializePool(data) {
  return createPool({
    id: data.id,
    name: data.name,
    tournamentId: data.tournamentId,
    playerIds: data.playerIds,
    matchIds: data.matchIds,
    standings: data.standings,
    isFinalized: data.isFinalized,
  });
}

export default {
  generatePoolName,
  createPool,
  createPoolStanding,
  addPlayerToPool,
  addMatchToPool,
  updatePoolStandings,
  setShootoutPosition,
  finalizePool,
  getPlayersAtPosition,
  isValidPool,
  serializePool,
  deserializePool,
};
