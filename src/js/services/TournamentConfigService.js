/**
 * Tournament Configuration Service
 * Manages tournament configuration validation and defaults
 */

import { TournamentFormat, DrawType, Tiebreaker } from '../models/Tournament.js';

/**
 * @typedef {Object} TournamentConfigValidation
 * @property {boolean} valid - Whether configuration is valid
 * @property {string[]} errors - List of error messages
 */

/**
 * @typedef {Object} PoolStageConfig
 * @property {number} playerCount - Total number of players
 * @property {number} poolCount - Number of pools
 * @property {number} playersPerPool - Players in each pool
 * @property {number} qualifiersPerPool - Players advancing from each pool
 * @property {number} framesPerMatch - Best of N frames for pool matches
 */

/**
 * @typedef {Object} KnockoutStageConfig
 * @property {Object} framesPerRound - Frames per knockout round
 * @property {number} framesPerRound.quarterFinal - QF best of
 * @property {number} framesPerRound.semiFinal - SF best of
 * @property {number} framesPerRound.final - Final best of
 * @property {number} framesPerRound.consolation - Consolation rounds best of
 */

/**
 * @typedef {Object} TournamentConfigDefaults
 * @property {PoolStageConfig} pool - Pool stage configuration
 * @property {KnockoutStageConfig} knockout - Knockout stage configuration
 * @property {string[]} tiebreakers - Ordered tiebreaker methods
 * @property {number} breakThreshold - Minimum break value to record
 */

/**
 * Default configuration for regular tournaments
 * @type {TournamentConfigDefaults}
 */
export const REGULAR_TOURNAMENT_DEFAULTS = {
  pool: {
    playerCount: 32,
    poolCount: 8,
    playersPerPool: 4,
    qualifiersPerPool: 4, // All qualify for knockout brackets
    framesPerMatch: 3, // Best of 3
  },
  knockout: {
    framesPerRound: {
      quarterFinal: 3, // Best of 3
      semiFinal: 3, // Best of 3
      final: 5, // Best of 5
      consolation: 3, // Best of 3
    },
  },
  tiebreakers: [
    Tiebreaker.HEAD_TO_HEAD,
    Tiebreaker.HIGHEST_BREAK,
    Tiebreaker.SHOOTOUT,
  ],
  breakThreshold: 20,
};

/**
 * Default configuration for Masters tournament
 * @type {TournamentConfigDefaults}
 */
export const MASTERS_TOURNAMENT_DEFAULTS = {
  pool: {
    playerCount: 16,
    poolCount: 4,
    playersPerPool: 4,
    qualifiersPerPool: 4, // All qualify for knockout brackets
    framesPerMatch: 2, // Best of 2 (can tie)
  },
  knockout: {
    framesPerRound: {
      quarterFinal: 5, // Best of 5
      semiFinal: 7, // Best of 7
      final: 7, // Best of 7
      consolation: 5, // Best of 5
    },
  },
  tiebreakers: [
    Tiebreaker.HEAD_TO_HEAD,
    Tiebreaker.MATCHES_WON,
    Tiebreaker.HIGHEST_BREAK,
  ],
  breakThreshold: 25,
};

/**
 * Valid player counts for regular tournaments
 */
export const VALID_PLAYER_COUNTS = [8, 16, 24, 32, 48, 64];

/**
 * Valid pool configurations based on player count
 */
export const POOL_CONFIGURATIONS = {
  8: [{ poolCount: 2, playersPerPool: 4 }],
  16: [
    { poolCount: 4, playersPerPool: 4 },
    { poolCount: 2, playersPerPool: 8 },
  ],
  24: [
    { poolCount: 6, playersPerPool: 4 },
    { poolCount: 4, playersPerPool: 6 },
  ],
  32: [
    { poolCount: 8, playersPerPool: 4 },
    { poolCount: 4, playersPerPool: 8 },
  ],
  48: [
    { poolCount: 8, playersPerPool: 6 },
    { poolCount: 6, playersPerPool: 8 },
  ],
  64: [
    { poolCount: 8, playersPerPool: 8 },
    { poolCount: 16, playersPerPool: 4 },
  ],
};

/**
 * Gets the default configuration for a tournament format
 * @param {string} format - Tournament format (regular or masters)
 * @returns {TournamentConfigDefaults}
 */
export function getDefaultConfig(format) {
  if (format === TournamentFormat.MASTERS) {
    return structuredClone(MASTERS_TOURNAMENT_DEFAULTS);
  }
  return structuredClone(REGULAR_TOURNAMENT_DEFAULTS);
}

/**
 * Validates a tournament configuration
 * @param {Object} config - Configuration to validate
 * @returns {TournamentConfigValidation}
 */
export function validateTournamentConfig(config) {
  const errors = [];

  // Validate player count
  if (!config.pool?.playerCount || config.pool.playerCount < 4) {
    errors.push('Tournament must have at least 4 players');
  }

  // Validate pool count
  if (!config.pool?.poolCount || config.pool.poolCount < 1) {
    errors.push('Tournament must have at least 1 pool');
  }

  // Validate players per pool
  if (config.pool?.playerCount && config.pool?.poolCount) {
    const playersPerPool = Math.ceil(config.pool.playerCount / config.pool.poolCount);
    if (playersPerPool < 2) {
      errors.push('Each pool must have at least 2 players');
    }
    if (playersPerPool > 8) {
      errors.push('Each pool should not exceed 8 players');
    }
  }

  // Validate frames per match (must be odd for best-of format, except Masters pool)
  if (config.pool?.framesPerMatch) {
    if (config.pool.framesPerMatch < 1) {
      errors.push('Frames per match must be at least 1');
    }
    if (config.pool.framesPerMatch > 35) {
      errors.push('Frames per match cannot exceed 35');
    }
  }

  // Validate knockout frames
  if (config.knockout?.framesPerRound) {
    const { quarterFinal, semiFinal, final } = config.knockout.framesPerRound;
    
    if (quarterFinal && quarterFinal % 2 === 0) {
      errors.push('Quarter-final frames must be an odd number (best-of format)');
    }
    if (semiFinal && semiFinal % 2 === 0) {
      errors.push('Semi-final frames must be an odd number (best-of format)');
    }
    if (final && final % 2 === 0) {
      errors.push('Final frames must be an odd number (best-of format)');
    }
  }

  // Validate tiebreakers
  if (config.tiebreakers && !Array.isArray(config.tiebreakers)) {
    errors.push('Tiebreakers must be an array');
  }

  // Validate break threshold
  if (config.breakThreshold !== undefined) {
    if (typeof config.breakThreshold !== 'number' || config.breakThreshold < 0) {
      errors.push('Break threshold must be a non-negative number');
    }
    if (config.breakThreshold > 147) {
      errors.push('Break threshold cannot exceed 147 (maximum possible break)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a tournament configuration from user inputs
 * @param {Object} params - Configuration parameters
 * @param {string} params.format - Tournament format
 * @param {number} params.playerCount - Number of players
 * @param {number} params.poolCount - Number of pools
 * @param {number} [params.poolFrames] - Frames per pool match
 * @param {number} [params.knockoutFrames] - Default frames for knockout
 * @param {number} [params.finalFrames] - Frames for final
 * @param {number} [params.breakThreshold] - Break threshold
 * @returns {import('../models/Tournament.js').TournamentConfig}
 */
export function createTournamentConfig(params) {
  const {
    format = TournamentFormat.REGULAR,
    playerCount,
    poolCount,
    poolFrames,
    knockoutFrames,
    finalFrames,
    breakThreshold,
  } = params;

  const defaults = getDefaultConfig(format);
  
  const playersPerPool = Math.ceil(playerCount / poolCount);

  return {
    playerCount,
    poolCount,
    playersPerPool,
    drawType: DrawType.RANDOM,
    poolStageFrames: poolFrames ?? defaults.pool.framesPerMatch,
    knockoutStageFrames: {
      quarterFinal: knockoutFrames ?? defaults.knockout.framesPerRound.quarterFinal,
      semiFinal: knockoutFrames ?? defaults.knockout.framesPerRound.semiFinal,
      final: finalFrames ?? defaults.knockout.framesPerRound.final,
      consolation: knockoutFrames ?? defaults.knockout.framesPerRound.consolation,
    },
    tiebreakers: defaults.tiebreakers,
    breakThreshold: breakThreshold ?? defaults.breakThreshold,
  };
}

/**
 * Suggests pool count based on player count
 * @param {number} playerCount - Number of players
 * @returns {number[]} Suggested pool counts
 */
export function suggestPoolCounts(playerCount) {
  const suggestions = [];
  
  // Try common pool sizes (4, 5, 6, 7, 8)
  for (const poolSize of [4, 5, 6, 7, 8]) {
    if (playerCount % poolSize === 0) {
      suggestions.push(playerCount / poolSize);
    }
  }

  // Also include closest configurations with byes
  if (suggestions.length === 0) {
    // Find nearest player count that divides evenly
    for (let adjusted = playerCount; adjusted <= playerCount + 8; adjusted++) {
      for (const poolSize of [4, 5, 6]) {
        if (adjusted % poolSize === 0) {
          const poolCount = adjusted / poolSize;
          if (!suggestions.includes(poolCount) && poolCount >= 2 && poolCount <= 16) {
            suggestions.push(poolCount);
          }
        }
      }
    }
  }

  return suggestions.sort((a, b) => a - b);
}

/**
 * Calculates the number of matches in the pool stage
 * @param {number} poolCount - Number of pools
 * @param {number} playersPerPool - Players in each pool
 * @returns {number} Total pool stage matches
 */
export function calculatePoolMatches(poolCount, playersPerPool) {
  // Round-robin: each player plays every other player once
  // Formula: n(n-1)/2 matches per pool
  const matchesPerPool = (playersPerPool * (playersPerPool - 1)) / 2;
  return poolCount * matchesPerPool;
}

/**
 * Calculates the knockout bracket size
 * @param {number} poolCount - Number of pools
 * @param {number} qualifiersPerPool - Players advancing per pool
 * @returns {Object} Bracket sizes
 */
export function calculateKnockoutSize(poolCount, qualifiersPerPool = 4) {
  const totalQualifiers = poolCount * qualifiersPerPool;
  
  // Winner bracket: top 2 from each pool (poolCount * 2)
  // Consolation bracket: bottom 2 from each pool (poolCount * 2)
  const winnerBracketSize = poolCount * 2;
  const consolationBracketSize = poolCount * 2;

  // Calculate rounds needed for each bracket
  const winnerRounds = Math.ceil(Math.log2(winnerBracketSize));
  const consolationRounds = Math.ceil(Math.log2(consolationBracketSize));

  return {
    totalQualifiers,
    winnerBracketSize,
    consolationBracketSize,
    winnerRounds,
    consolationRounds,
    totalKnockoutMatches: (winnerBracketSize - 1) + (consolationBracketSize - 1),
  };
}

/**
 * Validates that a configuration matches a tournament format's constraints
 * @param {string} format - Tournament format
 * @param {Object} config - Configuration to validate
 * @returns {TournamentConfigValidation}
 */
export function validateFormatConstraints(format, config) {
  const errors = [];

  if (format === TournamentFormat.MASTERS) {
    if (config.pool?.playerCount !== 16) {
      errors.push('Masters tournament must have exactly 16 players');
    }
    if (config.pool?.poolCount !== 4) {
      errors.push('Masters tournament must have exactly 4 pools');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  REGULAR_TOURNAMENT_DEFAULTS,
  MASTERS_TOURNAMENT_DEFAULTS,
  VALID_PLAYER_COUNTS,
  POOL_CONFIGURATIONS,
  getDefaultConfig,
  validateTournamentConfig,
  createTournamentConfig,
  suggestPoolCounts,
  calculatePoolMatches,
  calculateKnockoutSize,
  validateFormatConstraints,
};
