/**
 * Tournament Service
 * Main service for tournament management
 */

import {
  createTournament,
  TournamentFormat,
  TournamentStatus,
  serializeTournament,
  deserializeTournament,
} from '../models/Tournament.js';
import { generatePools, validatePoolDistribution } from './PoolGeneratorService.js';
import { generatePoolMatches, validateMatches } from './MatchGeneratorService.js';
import { createTournamentConfig, validateTournamentConfig } from './TournamentConfigService.js';
import { createByePlayers, calculateByesNeeded } from './PlayerService.js';
import { addTournamentToSeasonById } from './SeasonService.js';
import { getStorage } from '../storage/index.js';
import { store, setCurrentTournament, addTournament, updateTournament } from '../store/index.js';
import { generateUUID, validateTournament } from '../utils/index.js';

const STORAGE_KEY_PREFIX = 'tournament_';

/**
 * @typedef {Object} CreateTournamentParams
 * @property {string} name - Tournament name
 * @property {string} date - Tournament date (ISO string)
 * @property {string} seasonId - Season ID this tournament belongs to
 * @property {string} format - Tournament format (regular or masters)
 * @property {string[]} playerIds - Player IDs participating
 * @property {number} poolCount - Number of pools
 * @property {number} [poolFrames] - Best of N frames for pool matches
 * @property {number} [knockoutFrames] - Best of N frames for knockout
 * @property {number} [finalFrames] - Best of N frames for finals
 * @property {number} [breakThreshold] - Minimum break to record
 */

/**
 * Creates a new tournament with pools and matches
 * @param {CreateTournamentParams} params - Tournament parameters
 * @returns {Promise<import('../models/Tournament.js').TournamentData>}
 */
export async function createNewTournament(params) {
  const {
    name,
    date,
    seasonId,
    format = TournamentFormat.REGULAR,
    playerIds,
    poolCount,
    poolFrames,
    knockoutFrames,
    finalFrames,
    breakThreshold,
  } = params;

  // Validate inputs
  if (!name || name.trim() === '') {
    throw new Error('Tournament name is required');
  }

  if (!seasonId) {
    throw new Error('Season ID is required');
  }

  if (!playerIds || playerIds.length < 4) {
    throw new Error('At least 4 players are required');
  }

  if (poolCount < 1) {
    throw new Error('At least 1 pool is required');
  }

  // Create tournament configuration
  const config = createTournamentConfig({
    format,
    playerCount: playerIds.length,
    poolCount,
    poolFrames,
    knockoutFrames,
    finalFrames,
    breakThreshold,
  });

  // Validate configuration
  const configValidation = validateTournamentConfig(config);
  if (!configValidation.valid) {
    throw new Error(`Invalid configuration: ${configValidation.errors.join(', ')}`);
  }

  // Calculate if we need bye players
  const byesNeeded = calculateByesNeeded(playerIds.length, poolCount);
  let allPlayerIds = [...playerIds];

  if (byesNeeded > 0) {
    const byePlayers = createByePlayers(byesNeeded);
    allPlayerIds = [...playerIds, ...byePlayers.map((p) => p.id)];
  }

  // Generate tournament ID
  const tournamentId = generateUUID();

  // Generate pools
  const pools = generatePools({
    tournamentId,
    playerIds: allPlayerIds,
    poolCount,
    seeded: false, // Random draw by default
  });

  // Validate pool distribution
  const poolValidation = validatePoolDistribution(pools);
  if (!poolValidation.valid) {
    throw new Error(`Invalid pool distribution: ${poolValidation.errors.join(', ')}`);
  }

  // Generate pool matches
  const { matches, poolUpdates } = generatePoolMatches({
    tournamentId,
    pools,
    bestOf: config.poolStageFrames,
  });

  // Validate matches
  const matchValidation = validateMatches(matches);
  if (!matchValidation.valid) {
    throw new Error(`Invalid matches: ${matchValidation.errors.join(', ')}`);
  }

  // Update pools with match IDs
  const updatedPools = pools.map((pool) => {
    const update = poolUpdates.find((u) => u.poolId === pool.id);
    return {
      ...pool,
      matchIds: update ? update.matchIds : [],
    };
  });

  // Create tournament object
  const tournament = createTournament({
    id: tournamentId,
    seasonId,
    name: name.trim(),
    date,
    format,
    status: TournamentStatus.POOL_STAGE,
    config,
    playerIds: allPlayerIds,
    pools: updatedPools,
    matches,
    brackets: {
      winner: [],
      consolation: [],
    },
    rankings: [],
    breaks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Validate tournament
  const tournamentValidation = validateTournament(tournament);
  if (!tournamentValidation.valid) {
    throw new Error(`Invalid tournament: ${tournamentValidation.errors.join(', ')}`);
  }

  // Save to storage
  await saveTournament(tournament);

  // Add tournament to season's tournamentIds
  await addTournamentToSeasonById(seasonId, tournament.id);

  // Update store
  store.dispatch(addTournament(tournament));
  store.dispatch(setCurrentTournament(tournament));

  return tournament;
}

/**
 * Saves a tournament to storage
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament to save
 * @returns {Promise<void>}
 */
export async function saveTournament(tournament) {
  const storage = getStorage();
  const key = `${STORAGE_KEY_PREFIX}${tournament.id}`;
  await storage.setItem(key, serializeTournament(tournament));
}

/**
 * Loads a tournament from storage
 * @param {string} tournamentId - Tournament ID
 * @returns {Promise<import('../models/Tournament.js').TournamentData|null>}
 */
export async function loadTournament(tournamentId) {
  const storage = getStorage();
  const key = `${STORAGE_KEY_PREFIX}${tournamentId}`;
  const data = await storage.getItem(key);
  
  if (!data) {
    return null;
  }

  return deserializeTournament(data);
}

/**
 * Updates a tournament
 * @param {string} tournamentId - Tournament ID
 * @param {Partial<import('../models/Tournament.js').TournamentData>} updates - Fields to update
 * @returns {Promise<import('../models/Tournament.js').TournamentData>}
 */
export async function updateExistingTournament(tournamentId, updates) {
  const tournament = await loadTournament(tournamentId);
  
  if (!tournament) {
    throw new Error(`Tournament with ID "${tournamentId}" not found`);
  }

  const updatedTournament = {
    ...tournament,
    ...updates,
    id: tournament.id, // Prevent ID from being changed
    createdAt: tournament.createdAt, // Preserve creation date
    updatedAt: new Date().toISOString(),
  };

  // Validate updated tournament
  const validation = validateTournament(updatedTournament);
  if (!validation.valid) {
    throw new Error(`Invalid tournament: ${validation.errors.join(', ')}`);
  }

  // Save to storage
  await saveTournament(updatedTournament);

  // Update store
  store.dispatch(updateTournament(updatedTournament));

  return updatedTournament;
}

/**
 * Gets a tournament by ID
 * @param {string} tournamentId - Tournament ID
 * @returns {Promise<import('../models/Tournament.js').TournamentData|null>}
 */
export async function getTournamentById(tournamentId) {
  return loadTournament(tournamentId);
}

/**
 * Gets all tournaments for a season
 * @param {string} seasonId - Season ID
 * @param {string[]} tournamentIds - Tournament IDs in the season
 * @returns {Promise<import('../models/Tournament.js').TournamentData[]>}
 */
export async function getTournamentsBySeason(seasonId, tournamentIds) {
  const tournaments = [];
  
  for (const id of tournamentIds) {
    const tournament = await loadTournament(id);
    if (tournament && tournament.seasonId === seasonId) {
      tournaments.push(tournament);
    }
  }

  return tournaments;
}

/**
 * Deletes a tournament
 * @param {string} tournamentId - Tournament ID
 * @returns {Promise<void>}
 */
export async function deleteTournament(tournamentId) {
  const storage = getStorage();
  const key = `${STORAGE_KEY_PREFIX}${tournamentId}`;
  await storage.removeItem(key);

  // Clear from store if it's the current tournament
  const state = store.getState();
  if (state.currentTournament?.id === tournamentId) {
    store.dispatch(setCurrentTournament(null));
  }
}

/**
 * Sets the current tournament in the store
 * @param {string} tournamentId - Tournament ID
 * @returns {Promise<void>}
 */
export async function setActiveTournament(tournamentId) {
  const tournament = await loadTournament(tournamentId);
  
  if (!tournament) {
    throw new Error(`Tournament with ID "${tournamentId}" not found`);
  }

  store.dispatch(setCurrentTournament(tournament));
}

/**
 * Gets tournament status summary
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament to analyze
 * @returns {Object} Status summary
 */
export function getTournamentStatusSummary(tournament) {
  const totalMatches = tournament.matches.length;
  const completedMatches = tournament.matches.filter((m) => m.status === 'completed').length;
  const inProgressMatches = tournament.matches.filter((m) => m.status === 'in_progress').length;
  const pendingMatches = tournament.matches.filter((m) => m.status === 'pending').length;

  const poolMatches = tournament.matches.filter((m) => m.stage === 'pool');
  const completedPoolMatches = poolMatches.filter((m) => m.status === 'completed').length;

  const knockoutMatches = tournament.matches.filter((m) => 
    m.stage === 'knockout_winner' || m.stage === 'knockout_consolation'
  );
  const completedKnockoutMatches = knockoutMatches.filter((m) => m.status === 'completed').length;

  return {
    status: tournament.status,
    totalMatches,
    completedMatches,
    inProgressMatches,
    pendingMatches,
    progressPercent: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
    poolStage: {
      total: poolMatches.length,
      completed: completedPoolMatches,
      isComplete: completedPoolMatches === poolMatches.length,
    },
    knockoutStage: {
      total: knockoutMatches.length,
      completed: completedKnockoutMatches,
      isComplete: knockoutMatches.length > 0 && completedKnockoutMatches === knockoutMatches.length,
    },
    totalBreaks: tournament.breaks.length,
    totalPlayers: tournament.playerIds.length,
    totalPools: tournament.pools.length,
  };
}

/**
 * Checks if pool stage is complete
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament to check
 * @returns {boolean}
 */
export function isPoolStageComplete(tournament) {
  const poolMatches = tournament.matches.filter((m) => m.stage === 'pool');
  return poolMatches.every((m) => m.status === 'completed');
}

/**
 * Checks if tournament is complete
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament to check
 * @returns {boolean}
 */
export function isTournamentComplete(tournament) {
  return tournament.status === TournamentStatus.COMPLETED;
}

export default {
  createNewTournament,
  saveTournament,
  loadTournament,
  updateExistingTournament,
  getTournamentById,
  getTournamentsBySeason,
  deleteTournament,
  setActiveTournament,
  getTournamentStatusSummary,
  isPoolStageComplete,
  isTournamentComplete,
};
