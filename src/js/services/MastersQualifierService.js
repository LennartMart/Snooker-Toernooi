/**
 * Masters Qualifier Service
 * Manages Masters tournament qualification, including getting top 16 qualifiers,
 * handling withdrawals, and managing byes
 */

import { calculateSeasonStandings, getMastersQualifiers } from './SeasonStandingsService.js';
import { TournamentFormat } from '../models/Tournament.js';

/**
 * @typedef {Object} MastersQualifier
 * @property {string} playerId - Player ID
 * @property {string} playerName - Player name
 * @property {number} position - Qualification position (1-16)
 * @property {number} totalPoints - Season points
 * @property {number} tournamentsPlayed - Number of tournaments
 * @property {number} highestBreak - Season highest break
 * @property {'qualified' | 'reserve' | 'withdrawn' | 'bye'} status - Qualification status
 */

/**
 * @typedef {Object} MastersField
 * @property {MastersQualifier[]} qualifiers - 16 qualified players
 * @property {MastersQualifier[]} reserves - Reserve players
 * @property {MastersQualifier[]} withdrawn - Withdrawn players
 * @property {Object[]} byes - Bye entries for withdrawn players
 */

/**
 * @typedef {Object} ByeEntry
 * @property {number} originalPosition - Original qualification position
 * @property {string} originalPlayerId - Original player ID
 * @property {string} replacementPlayerId - Replacement player ID (or null)
 * @property {string} reason - Reason for bye
 */

/**
 * Masters field size
 */
export const MASTERS_FIELD_SIZE = 16;

/**
 * Default number of reserves
 */
export const DEFAULT_RESERVE_COUNT = 4;

/**
 * Gets the top 16 qualifiers for the Masters tournament
 * @param {Object} season - Season data
 * @returns {MastersQualifier[]}
 */
export function getQualifiedPlayers(season) {
  const qualifiers = getMastersQualifiers(season, MASTERS_FIELD_SIZE);
  
  return qualifiers.map((standing, index) => ({
    playerId: standing.playerId,
    playerName: standing.playerName || `Player ${standing.playerId}`,
    position: index + 1,
    totalPoints: standing.totalPoints,
    tournamentsPlayed: standing.tournamentsPlayed,
    highestBreak: standing.highestBreak,
    status: 'qualified',
  }));
}

/**
 * Gets reserve players for the Masters (positions 17-20)
 * @param {Object} season - Season data
 * @param {number} [count=4] - Number of reserves
 * @returns {MastersQualifier[]}
 */
export function getReservePlayers(season, count = DEFAULT_RESERVE_COUNT) {
  const standings = calculateSeasonStandings(season);
  const reserves = standings.slice(MASTERS_FIELD_SIZE, MASTERS_FIELD_SIZE + count);
  
  return reserves.map((standing, index) => ({
    playerId: standing.playerId,
    playerName: standing.playerName || `Player ${standing.playerId}`,
    position: MASTERS_FIELD_SIZE + index + 1,
    totalPoints: standing.totalPoints,
    tournamentsPlayed: standing.tournamentsPlayed,
    highestBreak: standing.highestBreak,
    status: 'reserve',
  }));
}

/**
 * Gets the full Masters field with qualifiers and reserves
 * @param {Object} season - Season data
 * @param {number} [reserveCount=4] - Number of reserves
 * @returns {MastersField}
 */
export function getMastersField(season, reserveCount = DEFAULT_RESERVE_COUNT) {
  const qualifiers = getQualifiedPlayers(season);
  const reserves = getReservePlayers(season, reserveCount);
  
  return {
    qualifiers,
    reserves,
    withdrawn: [],
    byes: [],
  };
}

/**
 * Processes a player withdrawal from the Masters
 * @param {MastersField} field - Current Masters field
 * @param {string} playerId - Player ID withdrawing
 * @param {string} reason - Reason for withdrawal
 * @returns {MastersField} Updated field
 */
export function processWithdrawal(field, playerId, reason) {
  const qualifierIndex = field.qualifiers.findIndex((q) => q.playerId === playerId);
  
  if (qualifierIndex === -1) {
    // Player not in qualifiers, might be in reserves
    const reserveIndex = field.reserves.findIndex((r) => r.playerId === playerId);
    if (reserveIndex === -1) {
      throw new Error(`Player ${playerId} not found in Masters field`);
    }
    
    // Remove from reserves
    const [withdrawn] = field.reserves.splice(reserveIndex, 1);
    withdrawn.status = 'withdrawn';
    field.withdrawn.push(withdrawn);
    
    return field;
  }
  
  // Get withdrawn qualifier
  const [withdrawn] = field.qualifiers.splice(qualifierIndex, 1);
  const originalPosition = withdrawn.position;
  withdrawn.status = 'withdrawn';
  field.withdrawn.push(withdrawn);
  
  // Find replacement from reserves
  const replacement = field.reserves.shift();
  
  if (replacement) {
    // Promote reserve to qualifier
    replacement.status = 'qualified';
    field.qualifiers.push(replacement);
    
    // Record bye information
    field.byes.push({
      originalPosition,
      originalPlayerId: playerId,
      replacementPlayerId: replacement.playerId,
      reason,
    });
  } else {
    // No replacement available - will need bye in tournament
    field.byes.push({
      originalPosition,
      originalPlayerId: playerId,
      replacementPlayerId: null,
      reason,
    });
  }
  
  // Re-sort qualifiers by position
  field.qualifiers.sort((a, b) => a.position - b.position);
  
  // Update positions
  field.qualifiers.forEach((q, i) => {
    q.position = i + 1;
  });
  
  return field;
}

/**
 * Handles multiple withdrawals
 * @param {MastersField} field - Current Masters field
 * @param {Array<{playerId: string, reason: string}>} withdrawals - Withdrawals to process
 * @returns {MastersField} Updated field
 */
export function processMultipleWithdrawals(field, withdrawals) {
  let updatedField = { ...field };
  
  for (const { playerId, reason } of withdrawals) {
    updatedField = processWithdrawal(updatedField, playerId, reason);
  }
  
  return updatedField;
}

/**
 * Adds a bye to the field when no reserve is available
 * @param {MastersField} field - Current Masters field
 * @param {number} position - Position to add bye
 * @param {string} reason - Reason for bye
 * @returns {MastersField} Updated field
 */
export function addBye(field, position, reason) {
  field.byes.push({
    originalPosition: position,
    originalPlayerId: null,
    replacementPlayerId: null,
    reason,
  });
  
  return field;
}

/**
 * Checks if the Masters field is valid (has 16 players)
 * @param {MastersField} field - Masters field to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMastersField(field) {
  const errors = [];
  
  if (field.qualifiers.length < MASTERS_FIELD_SIZE) {
    errors.push(`Only ${field.qualifiers.length} qualifiers, need ${MASTERS_FIELD_SIZE}`);
  }
  
  if (field.qualifiers.length > MASTERS_FIELD_SIZE) {
    errors.push(`Too many qualifiers: ${field.qualifiers.length}, max is ${MASTERS_FIELD_SIZE}`);
  }
  
  // Check for duplicate players
  const playerIds = field.qualifiers.map((q) => q.playerId);
  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== playerIds.length) {
    errors.push('Duplicate players in qualifiers list');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates Masters tournament configuration from qualified field
 * @param {MastersField} field - Validated Masters field
 * @param {Object} options - Additional tournament options
 * @param {string} options.name - Tournament name
 * @param {string} options.seasonId - Season ID
 * @param {Date} [options.date] - Tournament date
 * @returns {Object} Tournament creation params
 */
export function createMastersTournamentConfig(field, options) {
  const { valid, errors } = validateMastersField(field);
  
  if (!valid) {
    throw new Error(`Invalid Masters field: ${errors.join(', ')}`);
  }
  
  const playerIds = field.qualifiers.map((q) => q.playerId);
  
  return {
    name: options.name || 'Masters Championship',
    format: TournamentFormat.MASTERS,
    seasonId: options.seasonId,
    date: options.date || new Date(),
    playerIds,
    config: {
      playerCount: MASTERS_FIELD_SIZE,
      poolCount: 4,
      playersPerPool: 4,
      poolStageFrames: 2, // Best of 2 (can draw)
      knockoutStageFrames: {
        quarterFinal: 5, // Best of 5
        semiFinal: 7, // Best of 7
        final: 7, // Best of 7
        consolation: 5, // Best of 5
      },
      tiebreakers: ['head-to-head', 'matches-won', 'highest-break'],
      breakThreshold: 25,
    },
    isMasters: true,
    mastersField: field,
  };
}

/**
 * Gets the seeded pool assignments for Masters (by position)
 * Pools are seeded so top 4 go to different pools, 5-8 to different pools, etc.
 * @param {MastersQualifier[]} qualifiers - Qualified players in position order
 * @returns {Object} Pool assignments { poolA: [...], poolB: [...], poolC: [...], poolD: [...] }
 */
export function getMastersPoolSeeding(qualifiers) {
  if (qualifiers.length !== MASTERS_FIELD_SIZE) {
    throw new Error(`Masters requires exactly ${MASTERS_FIELD_SIZE} players`);
  }
  
  // Seeding pattern: snake draft
  // Seeds 1, 8, 9, 16 → Pool A
  // Seeds 2, 7, 10, 15 → Pool B
  // Seeds 3, 6, 11, 14 → Pool C
  // Seeds 4, 5, 12, 13 → Pool D
  const pools = {
    poolA: [],
    poolB: [],
    poolC: [],
    poolD: [],
  };
  
  const seedPattern = [
    { seed: 1, pool: 'poolA' },
    { seed: 2, pool: 'poolB' },
    { seed: 3, pool: 'poolC' },
    { seed: 4, pool: 'poolD' },
    { seed: 5, pool: 'poolD' },
    { seed: 6, pool: 'poolC' },
    { seed: 7, pool: 'poolB' },
    { seed: 8, pool: 'poolA' },
    { seed: 9, pool: 'poolA' },
    { seed: 10, pool: 'poolB' },
    { seed: 11, pool: 'poolC' },
    { seed: 12, pool: 'poolD' },
    { seed: 13, pool: 'poolD' },
    { seed: 14, pool: 'poolC' },
    { seed: 15, pool: 'poolB' },
    { seed: 16, pool: 'poolA' },
  ];
  
  for (const { seed, pool } of seedPattern) {
    const qualifier = qualifiers[seed - 1];
    if (qualifier) {
      pools[pool].push(qualifier);
    }
  }
  
  return pools;
}

/**
 * Gets the number of byes required based on withdrawals
 * @param {MastersField} field - Masters field
 * @returns {number}
 */
export function getByeCount(field) {
  return field.byes.filter((bye) => bye.replacementPlayerId === null).length;
}

/**
 * Checks if the season has enough players to run Masters
 * @param {Object} season - Season data
 * @returns {{ canRunMasters: boolean, playerCount: number, minimumRequired: number }}
 */
export function canRunMasters(season) {
  const standings = calculateSeasonStandings(season);
  const playerCount = standings.length;
  
  return {
    canRunMasters: playerCount >= MASTERS_FIELD_SIZE,
    playerCount,
    minimumRequired: MASTERS_FIELD_SIZE,
  };
}

/**
 * Gets summary of Masters qualification status
 * @param {Object} season - Season data
 * @returns {Object} Qualification summary
 */
export function getMastersQualificationSummary(season) {
  const standings = calculateSeasonStandings(season);
  const qualifiers = standings.slice(0, MASTERS_FIELD_SIZE);
  const reserves = standings.slice(MASTERS_FIELD_SIZE, MASTERS_FIELD_SIZE + DEFAULT_RESERVE_COUNT);
  
  // Calculate cutoff points
  const cutoffPoints = qualifiers.length > 0 ? qualifiers[qualifiers.length - 1].totalPoints : 0;
  const bubblePlayer = qualifiers.length > 0 ? qualifiers[qualifiers.length - 1] : null;
  const firstReserve = reserves.length > 0 ? reserves[0] : null;
  
  // Gap between last qualifier and first reserve
  const qualificationGap = bubblePlayer && firstReserve 
    ? bubblePlayer.totalPoints - firstReserve.totalPoints 
    : null;
  
  return {
    totalPlayers: standings.length,
    qualifiedCount: qualifiers.length,
    reserveCount: reserves.length,
    cutoffPoints,
    bubblePlayer,
    firstReserve,
    qualificationGap,
    canRunMasters: qualifiers.length >= MASTERS_FIELD_SIZE,
    standings: standings.map((s, i) => ({
      ...s,
      isQualified: i < MASTERS_FIELD_SIZE,
      isReserve: i >= MASTERS_FIELD_SIZE && i < MASTERS_FIELD_SIZE + DEFAULT_RESERVE_COUNT,
      isBubble: i === MASTERS_FIELD_SIZE - 1,
    })),
  };
}

export default {
  MASTERS_FIELD_SIZE,
  DEFAULT_RESERVE_COUNT,
  getQualifiedPlayers,
  getReservePlayers,
  getMastersField,
  processWithdrawal,
  processMultipleWithdrawals,
  addBye,
  validateMastersField,
  createMastersTournamentConfig,
  getMastersPoolSeeding,
  getByeCount,
  canRunMasters,
  getMastersQualificationSummary,
};
