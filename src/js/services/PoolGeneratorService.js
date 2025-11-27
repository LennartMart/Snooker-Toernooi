/**
 * Pool Generator Service
 * Generates tournament pools with player assignments
 * Implements random draw and seeded assignment using circle method for round-robin
 */

import { createPool, generatePoolName } from '../models/Pool.js';
import { generateUUID } from '../utils/uuid.js';

/**
 * @typedef {Object} PoolGeneratorOptions
 * @property {string} tournamentId - Tournament ID
 * @property {string[]} playerIds - Array of player IDs to distribute
 * @property {number} poolCount - Number of pools to create
 * @property {boolean} [seeded=false] - Whether to use seeded assignment
 * @property {string[]} [seeds] - Ordered player IDs for seeded draw (highest ranked first)
 */

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @template T
 * @param {T[]} array - Array to shuffle
 * @returns {T[]} New shuffled array
 */
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Distributes players across pools with snake draft order
 * Ensures balanced pools when player count doesn't divide evenly
 * @param {string[]} playerIds - Ordered player IDs
 * @param {number} poolCount - Number of pools
 * @returns {string[][]} Array of player ID arrays, one per pool
 */
function distributePlayersSnakeDraft(playerIds, poolCount) {
  const pools = Array.from({ length: poolCount }, () => []);
  
  let poolIndex = 0;
  let direction = 1; // 1 = forward, -1 = backward

  for (const playerId of playerIds) {
    pools[poolIndex].push(playerId);
    
    // Snake draft: alternate direction at each end
    const nextIndex = poolIndex + direction;
    if (nextIndex >= poolCount || nextIndex < 0) {
      direction *= -1; // Reverse direction
    } else {
      poolIndex = nextIndex;
    }
  }

  return pools;
}

/**
 * Distributes players across pools for seeded draw
 * Top seeds are distributed across pools to avoid early matchups
 * @param {string[]} seedOrder - Player IDs in seed order (best first)
 * @param {number} poolCount - Number of pools
 * @returns {string[][]} Array of player ID arrays, one per pool
 */
function distributePlayersSeeded(seedOrder, poolCount) {
  // Use snake draft to distribute seeds evenly
  // This ensures top seeds don't end up in the same pool
  return distributePlayersSnakeDraft(seedOrder, poolCount);
}

/**
 * Generates round-robin match pairings using the circle method
 * This is the standard algorithm for generating a complete round-robin schedule
 * @param {string[]} playerIds - Array of player IDs in the pool
 * @returns {Array<{player1Id: string, player2Id: string, round: number}>} Match pairings
 */
export function generateRoundRobinPairings(playerIds) {
  const pairings = [];
  const n = playerIds.length;
  
  // If odd number of players, add a virtual "bye" position
  const players = [...playerIds];
  const hasBye = n % 2 !== 0;
  if (hasBye) {
    players.push(null); // null represents bye
  }

  const numPlayers = players.length;
  const numRounds = numPlayers - 1;
  const halfSize = numPlayers / 2;

  // Fix player 0, rotate others
  for (let round = 0; round < numRounds; round++) {
    // Generate pairings for this round
    for (let i = 0; i < halfSize; i++) {
      const player1Index = i;
      const player2Index = numPlayers - 1 - i;
      
      const player1 = players[player1Index];
      const player2 = players[player2Index];
      
      // Skip bye matches (null player)
      if (player1 !== null && player2 !== null) {
        pairings.push({
          player1Id: player1,
          player2Id: player2,
          round: round + 1,
        });
      }
    }
    
    // Rotate players (keep first player fixed)
    // Move last player to position 1, shift others right
    const fixed = players[0];
    const last = players.pop();
    players.splice(1, 0, last);
    players[0] = fixed;
  }

  return pairings;
}

/**
 * Generates pools for a tournament
 * @param {PoolGeneratorOptions} options - Pool generation options
 * @returns {import('../models/Pool.js').PoolData[]} Generated pools
 */
export function generatePools(options) {
  const { tournamentId, playerIds, poolCount, seeded = false, seeds } = options;

  if (playerIds.length < poolCount) {
    throw new Error(`Cannot create ${poolCount} pools with only ${playerIds.length} players`);
  }

  if (poolCount < 1) {
    throw new Error('Pool count must be at least 1');
  }

  // Distribute players to pools
  let poolAssignments;
  
  if (seeded && seeds && seeds.length > 0) {
    // Verify all seeds are in playerIds
    const playerIdSet = new Set(playerIds);
    const validSeeds = seeds.filter((id) => playerIdSet.has(id));
    
    // Get unseeded players
    const seedSet = new Set(validSeeds);
    const unseededPlayers = playerIds.filter((id) => !seedSet.has(id));
    
    // Shuffle unseeded players
    const shuffledUnseeded = shuffle(unseededPlayers);
    
    // Combine seeds with shuffled unseeded
    const orderedPlayers = [...validSeeds, ...shuffledUnseeded];
    
    poolAssignments = distributePlayersSeeded(orderedPlayers, poolCount);
  } else {
    // Random draw - shuffle all players
    const shuffledPlayers = shuffle(playerIds);
    poolAssignments = distributePlayersSnakeDraft(shuffledPlayers, poolCount);
  }

  // Create pool objects
  const pools = poolAssignments.map((poolPlayerIds, index) => {
    return createPool({
      id: generateUUID(),
      name: generatePoolName(index),
      tournamentId,
      playerIds: poolPlayerIds,
      matchIds: [], // Matches will be added by MatchGeneratorService
      standings: [], // Standings will be calculated when matches are played
      isFinalized: false,
    });
  });

  return pools;
}

/**
 * Validates pool distribution
 * @param {import('../models/Pool.js').PoolData[]} pools - Pools to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validatePoolDistribution(pools) {
  const errors = [];
  
  if (pools.length === 0) {
    errors.push('No pools generated');
    return { valid: false, errors };
  }

  // Check all pools have at least 2 players
  for (const pool of pools) {
    if (pool.playerIds.length < 2) {
      errors.push(`Pool ${pool.name} has fewer than 2 players`);
    }
  }

  // Check pool size variance (should be at most 1)
  const sizes = pools.map((p) => p.playerIds.length);
  const maxSize = Math.max(...sizes);
  const minSize = Math.min(...sizes);
  
  if (maxSize - minSize > 1) {
    errors.push(`Pool sizes are unbalanced: ${minSize} to ${maxSize} players`);
  }

  // Check for duplicate players across pools
  const allPlayers = pools.flatMap((p) => p.playerIds);
  const uniquePlayers = new Set(allPlayers);
  
  if (uniquePlayers.size !== allPlayers.length) {
    errors.push('Some players are assigned to multiple pools');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates pool statistics
 * @param {import('../models/Pool.js').PoolData[]} pools - Pools to analyze
 * @returns {Object} Pool statistics
 */
export function getPoolStatistics(pools) {
  const sizes = pools.map((p) => p.playerIds.length);
  const totalPlayers = sizes.reduce((sum, size) => sum + size, 0);
  
  return {
    poolCount: pools.length,
    totalPlayers,
    minPoolSize: Math.min(...sizes),
    maxPoolSize: Math.max(...sizes),
    averagePoolSize: totalPlayers / pools.length,
    matchesPerPool: sizes.map((size) => (size * (size - 1)) / 2),
    totalMatches: sizes.reduce((sum, size) => sum + (size * (size - 1)) / 2, 0),
  };
}

export default {
  generatePools,
  generateRoundRobinPairings,
  validatePoolDistribution,
  getPoolStatistics,
};
