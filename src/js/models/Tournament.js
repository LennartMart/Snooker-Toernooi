/**
 * Tournament Model
 * Represents a single competition event
 */

import { generateUUID } from '../utils/uuid.js';
import { BracketType } from './KnockoutRound.js';

/**
 * Tournament formats
 * @enum {string}
 */
export const TournamentFormat = {
  REGULAR: 'regular',
  MASTERS: 'masters',
};

/**
 * Tournament status
 * @enum {string}
 */
export const TournamentStatus = {
  DRAFT: 'draft',
  POOLS: 'pools',
  KNOCKOUT: 'knockout',
  COMPLETE: 'complete',
};

/**
 * Draw types
 * @enum {string}
 */
export const DrawType = {
  RANDOM: 'random',
  SEEDED: 'seeded',
};

/**
 * Tiebreaker types
 * @enum {string}
 */
export const Tiebreaker = {
  HEAD_TO_HEAD: 'head-to-head',
  MATCHES_WON: 'matches-won',
  HIGHEST_BREAK: 'highest-break',
  SHOOTOUT: 'shootout',
};

/**
 * Default knockout formats for regular tournaments
 */
export const DEFAULT_KNOCKOUT_FORMATS_REGULAR = {
  round16: 1,
  quarterFinal: 1,
  semiFinal: 3,
  final: 3,
};

/**
 * Default knockout formats for Masters tournaments
 */
export const DEFAULT_KNOCKOUT_FORMATS_MASTERS = {
  quarterFinal: 5,
  semiFinal: 7,
  final: 7,
};

/**
 * Default tiebreakers for regular tournaments
 */
export const DEFAULT_TIEBREAKERS_REGULAR = [
  Tiebreaker.HEAD_TO_HEAD,
  Tiebreaker.HIGHEST_BREAK,
  Tiebreaker.SHOOTOUT,
];

/**
 * Default tiebreakers for Masters tournaments
 */
export const DEFAULT_TIEBREAKERS_MASTERS = [
  Tiebreaker.HEAD_TO_HEAD,
  Tiebreaker.MATCHES_WON,
  Tiebreaker.HIGHEST_BREAK,
];

/**
 * @typedef {Object} TournamentConfig
 * @property {number} playerCount - Total players (including byes)
 * @property {number} poolCount - Number of pools
 * @property {number} playersPerPool - Players in each pool
 * @property {number} poolFrames - Frames per pool match
 * @property {Object} knockoutFormats - Frames per knockout round
 * @property {string} drawType - "random" or "seeded"
 * @property {string[]} tiebreakers - Ordered tiebreaker rules
 */

/**
 * @typedef {Object} Brackets
 * @property {import('./KnockoutRound.js').KnockoutRoundData[]} winner - Winner bracket rounds
 * @property {import('./KnockoutRound.js').KnockoutRoundData[]} consolation - Consolation bracket rounds
 */

/**
 * @typedef {Object} TournamentData
 * @property {string} id - Unique identifier (UUID)
 * @property {string|null} seasonId - Reference to season
 * @property {string} name - Tournament name
 * @property {string} date - ISO date string
 * @property {string} format - "regular" or "masters"
 * @property {string} status - Tournament status
 * @property {TournamentConfig} config - Configuration
 * @property {string[]} playerIds - Participating players (including byes)
 * @property {import('./Pool.js').PoolData[]} pools - Pool definitions
 * @property {import('./Match.js').MatchData[]} matches - All matches
 * @property {import('./Break.js').BreakData[]} breaks - All recorded breaks
 * @property {Brackets} brackets - Knockout bracket structure
 * @property {import('./Ranking.js').RankingData[]} rankings - Final positions
 * @property {string} createdAt - ISO timestamp
 * @property {string} updatedAt - ISO timestamp
 */

/**
 * Creates default tournament config
 * @param {string} format - Tournament format
 * @returns {TournamentConfig}
 */
export function createDefaultConfig(format = TournamentFormat.REGULAR) {
  if (format === TournamentFormat.MASTERS) {
    return {
      playerCount: 16,
      poolCount: 4,
      playersPerPool: 4,
      poolFrames: 2,
      knockoutFormats: { ...DEFAULT_KNOCKOUT_FORMATS_MASTERS },
      drawType: DrawType.SEEDED,
      tiebreakers: [...DEFAULT_TIEBREAKERS_MASTERS],
    };
  }

  return {
    playerCount: 32,
    poolCount: 8,
    playersPerPool: 4,
    poolFrames: 1,
    knockoutFormats: { ...DEFAULT_KNOCKOUT_FORMATS_REGULAR },
    drawType: DrawType.RANDOM,
    tiebreakers: [...DEFAULT_TIEBREAKERS_REGULAR],
  };
}

/**
 * Creates a new Tournament instance
 * @param {Object} params - Tournament parameters
 * @returns {TournamentData}
 */
export function createTournament({
  id,
  seasonId = null,
  name,
  date,
  format = TournamentFormat.REGULAR,
  status = TournamentStatus.DRAFT,
  config,
  playerIds = [],
  pools = [],
  matches = [],
  breaks = [],
  brackets,
  rankings = [],
  createdAt,
  updatedAt,
} = {}) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Tournament name is required');
  }

  if (!date || typeof date !== 'string') {
    throw new Error('Tournament date is required');
  }

  if (!Object.values(TournamentFormat).includes(format)) {
    throw new Error('Invalid tournament format');
  }

  const now = new Date().toISOString();
  const defaultConfig = createDefaultConfig(format);

  return {
    id: id || generateUUID(),
    seasonId,
    name: name.trim(),
    date,
    format,
    status,
    config: config ? { ...defaultConfig, ...config } : defaultConfig,
    playerIds: Array.isArray(playerIds) ? [...playerIds] : [],
    pools: Array.isArray(pools) ? [...pools] : [],
    matches: Array.isArray(matches) ? [...matches] : [],
    breaks: Array.isArray(breaks) ? [...breaks] : [],
    brackets: brackets || {
      [BracketType.WINNER]: [],
      [BracketType.CONSOLATION]: [],
    },
    rankings: Array.isArray(rankings) ? [...rankings] : [],
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
  };
}

/**
 * Updates tournament status
 * @param {TournamentData} tournament - Tournament to update
 * @param {string} newStatus - New status
 * @returns {TournamentData} Updated tournament
 */
export function updateTournamentStatus(tournament, newStatus) {
  if (!Object.values(TournamentStatus).includes(newStatus)) {
    throw new Error('Invalid tournament status');
  }

  return {
    ...tournament,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds players to a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {string[]} playerIds - Player IDs to add
 * @returns {TournamentData} Updated tournament
 */
export function addPlayersToTournament(tournament, playerIds) {
  const existingIds = new Set(tournament.playerIds);
  const newIds = playerIds.filter((id) => !existingIds.has(id));

  return {
    ...tournament,
    playerIds: [...tournament.playerIds, ...newIds],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sets pools for a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {import('./Pool.js').PoolData[]} pools - Pools to set
 * @returns {TournamentData} Updated tournament
 */
export function setTournamentPools(tournament, pools) {
  return {
    ...tournament,
    pools: [...pools],
    status: TournamentStatus.POOLS,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds a match to a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {import('./Match.js').MatchData} match - Match to add
 * @returns {TournamentData} Updated tournament
 */
export function addMatchToTournament(tournament, match) {
  return {
    ...tournament,
    matches: [...tournament.matches, match],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates a match in a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {import('./Match.js').MatchData} updatedMatch - Updated match
 * @returns {TournamentData} Updated tournament
 */
export function updateMatchInTournament(tournament, updatedMatch) {
  return {
    ...tournament,
    matches: tournament.matches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Adds a break to a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {import('./Break.js').BreakData} breakData - Break to add
 * @returns {TournamentData} Updated tournament
 */
export function addBreakToTournament(tournament, breakData) {
  return {
    ...tournament,
    breaks: [...tournament.breaks, breakData],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sets brackets for a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {Brackets} brackets - Brackets to set
 * @returns {TournamentData} Updated tournament
 */
export function setTournamentBrackets(tournament, brackets) {
  return {
    ...tournament,
    brackets,
    status: TournamentStatus.KNOCKOUT,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Sets final rankings for a tournament
 * @param {TournamentData} tournament - Tournament to update
 * @param {import('./Ranking.js').RankingData[]} rankings - Rankings to set
 * @returns {TournamentData} Updated tournament
 */
export function setTournamentRankings(tournament, rankings) {
  return {
    ...tournament,
    rankings: [...rankings],
    status: TournamentStatus.COMPLETE,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gets a match by ID from a tournament
 * @param {TournamentData} tournament - Tournament to query
 * @param {string} matchId - Match ID
 * @returns {import('./Match.js').MatchData|null}
 */
export function getMatchById(tournament, matchId) {
  return tournament.matches.find((m) => m.id === matchId) || null;
}

/**
 * Gets a pool by ID from a tournament
 * @param {TournamentData} tournament - Tournament to query
 * @param {string} poolId - Pool ID
 * @returns {import('./Pool.js').PoolData|null}
 */
export function getPoolById(tournament, poolId) {
  return tournament.pools.find((p) => p.id === poolId) || null;
}

/**
 * Gets all pool matches for a tournament
 * @param {TournamentData} tournament - Tournament to query
 * @returns {import('./Match.js').MatchData[]}
 */
export function getPoolMatches(tournament) {
  return tournament.matches.filter((m) => m.stage === 'pool');
}

/**
 * Checks if all pool matches are complete
 * @param {TournamentData} tournament - Tournament to check
 * @returns {boolean}
 */
export function areAllPoolMatchesComplete(tournament) {
  const poolMatches = getPoolMatches(tournament);
  return poolMatches.length > 0 && poolMatches.every((m) => m.winnerId !== null);
}

/**
 * Validates a tournament object
 * @param {TournamentData} tournament - Tournament to validate
 * @returns {boolean}
 */
export function isValidTournament(tournament) {
  return (
    tournament &&
    typeof tournament.id === 'string' &&
    (tournament.seasonId === null || typeof tournament.seasonId === 'string') &&
    typeof tournament.name === 'string' &&
    tournament.name.trim() !== '' &&
    typeof tournament.date === 'string' &&
    Object.values(TournamentFormat).includes(tournament.format) &&
    Object.values(TournamentStatus).includes(tournament.status) &&
    tournament.config &&
    typeof tournament.config.playerCount === 'number' &&
    typeof tournament.config.poolCount === 'number' &&
    typeof tournament.config.playersPerPool === 'number' &&
    Array.isArray(tournament.playerIds) &&
    Array.isArray(tournament.pools) &&
    Array.isArray(tournament.matches) &&
    Array.isArray(tournament.breaks) &&
    tournament.brackets &&
    Array.isArray(tournament.rankings) &&
    typeof tournament.createdAt === 'string' &&
    typeof tournament.updatedAt === 'string'
  );
}

/**
 * Validates tournament config
 * @param {TournamentConfig} config - Config to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateTournamentConfig(config) {
  const errors = [];

  if (config.playerCount !== config.poolCount * config.playersPerPool) {
    errors.push(
      `playerCount (${config.playerCount}) must equal poolCount (${config.poolCount}) × playersPerPool (${config.playersPerPool})`
    );
  }

  // Pool count must be power of 2
  if (!Number.isInteger(Math.log2(config.poolCount))) {
    errors.push(`poolCount (${config.poolCount}) must be a power of 2 (2, 4, 8, 16)`);
  }

  if (config.playersPerPool < 3 || config.playersPerPool > 8) {
    errors.push(`playersPerPool (${config.playersPerPool}) must be between 3 and 8`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serializes a tournament to a plain object for storage
 * @param {TournamentData} tournament - Tournament to serialize
 * @returns {TournamentData}
 */
export function serializeTournament(tournament) {
  return {
    id: tournament.id,
    seasonId: tournament.seasonId,
    name: tournament.name,
    date: tournament.date,
    format: tournament.format,
    status: tournament.status,
    config: { ...tournament.config },
    playerIds: [...tournament.playerIds],
    pools: tournament.pools.map((p) => ({ ...p })),
    matches: tournament.matches.map((m) => ({ ...m })),
    breaks: tournament.breaks.map((b) => ({ ...b })),
    brackets: {
      [BracketType.WINNER]: tournament.brackets[BracketType.WINNER].map((r) => ({ ...r })),
      [BracketType.CONSOLATION]: tournament.brackets[BracketType.CONSOLATION].map((r) => ({
        ...r,
      })),
    },
    rankings: tournament.rankings.map((r) => ({ ...r })),
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
  };
}

/**
 * Deserializes a plain object to a tournament
 * @param {Object} data - Data to deserialize
 * @returns {TournamentData}
 */
export function deserializeTournament(data) {
  return createTournament({
    id: data.id,
    seasonId: data.seasonId,
    name: data.name,
    date: data.date,
    format: data.format,
    status: data.status,
    config: data.config,
    playerIds: data.playerIds,
    pools: data.pools,
    matches: data.matches,
    breaks: data.breaks,
    brackets: data.brackets,
    rankings: data.rankings,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

export default {
  TournamentFormat,
  TournamentStatus,
  DrawType,
  Tiebreaker,
  DEFAULT_KNOCKOUT_FORMATS_REGULAR,
  DEFAULT_KNOCKOUT_FORMATS_MASTERS,
  DEFAULT_TIEBREAKERS_REGULAR,
  DEFAULT_TIEBREAKERS_MASTERS,
  createDefaultConfig,
  createTournament,
  updateTournamentStatus,
  addPlayersToTournament,
  setTournamentPools,
  addMatchToTournament,
  updateMatchInTournament,
  addBreakToTournament,
  setTournamentBrackets,
  setTournamentRankings,
  getMatchById,
  getPoolById,
  getPoolMatches,
  areAllPoolMatchesComplete,
  isValidTournament,
  validateTournamentConfig,
  serializeTournament,
  deserializeTournament,
};
