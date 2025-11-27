/**
 * Season Model
 * Represents a collection of tournaments culminating in a Masters finale
 */

import { generateUUID } from '../utils/uuid.js';
import { DEFAULT_BREAK_THRESHOLD, MASTERS_BREAK_THRESHOLD } from './Break.js';

/**
 * @typedef {Object} SeasonSettings
 * @property {number} breakThreshold - Minimum break to record (default: 20)
 * @property {number} mastersBreakThreshold - Minimum break for Masters stats (default: 25)
 * @property {number} mastersQualifiers - Top N qualify for Masters (default: 16)
 * @property {number} participationPoints - Points for participation (default: 10)
 */

/**
 * @typedef {Object} SeasonData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Season name (e.g., "2024-2025")
 * @property {number} year - Starting year
 * @property {string[]} tournamentIds - References to tournaments
 * @property {SeasonSettings} settings - Season configuration
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last modification
 */

/**
 * Default season settings
 */
export const DEFAULT_SEASON_SETTINGS = {
  breakThreshold: DEFAULT_BREAK_THRESHOLD,
  mastersBreakThreshold: MASTERS_BREAK_THRESHOLD,
  mastersQualifiers: 16,
  participationPoints: 10,
};

/**
 * Creates a new Season instance
 * @param {Object} params - Season parameters
 * @param {string} [params.id] - Optional ID (generated if not provided)
 * @param {string} params.name - Season name
 * @param {number} params.year - Starting year
 * @param {string[]} [params.tournamentIds=[]] - Tournament references
 * @param {Partial<SeasonSettings>} [params.settings={}] - Season settings
 * @param {string} [params.createdAt] - ISO timestamp (generated if not provided)
 * @param {string} [params.updatedAt] - ISO timestamp (generated if not provided)
 * @returns {SeasonData}
 */
export function createSeason({
  id,
  name,
  year,
  tournamentIds = [],
  settings = {},
  createdAt,
  updatedAt,
} = {}) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Season name is required and must be a non-empty string');
  }

  if (typeof year !== 'number' || year < 2000 || year > 2100) {
    throw new Error('Season year is required and must be a valid year (2000-2100)');
  }

  const now = new Date().toISOString();

  return {
    id: id || generateUUID(),
    name: name.trim(),
    year,
    tournamentIds: Array.isArray(tournamentIds) ? [...tournamentIds] : [],
    settings: {
      ...DEFAULT_SEASON_SETTINGS,
      ...settings,
    },
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
  };
}

/**
 * Adds a tournament to a season
 * @param {SeasonData} season - Season to update
 * @param {string} tournamentId - Tournament ID to add
 * @returns {SeasonData} - New season with tournament added
 */
export function addTournamentToSeason(season, tournamentId) {
  if (!tournamentId || typeof tournamentId !== 'string') {
    throw new Error('tournamentId is required and must be a string');
  }

  if (season.tournamentIds.includes(tournamentId)) {
    return season; // Already exists
  }

  return {
    ...season,
    tournamentIds: [...season.tournamentIds, tournamentId],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Removes a tournament from a season
 * @param {SeasonData} season - Season to update
 * @param {string} tournamentId - Tournament ID to remove
 * @returns {SeasonData} - New season with tournament removed
 */
export function removeTournamentFromSeason(season, tournamentId) {
  return {
    ...season,
    tournamentIds: season.tournamentIds.filter((id) => id !== tournamentId),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates season settings
 * @param {SeasonData} season - Season to update
 * @param {Partial<SeasonSettings>} newSettings - Settings to update
 * @returns {SeasonData} - New season with updated settings
 */
export function updateSeasonSettings(season, newSettings) {
  return {
    ...season,
    settings: {
      ...season.settings,
      ...newSettings,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates a season object
 * @param {SeasonData} season - Season to validate
 * @returns {boolean}
 */
export function isValidSeason(season) {
  return (
    season &&
    typeof season.id === 'string' &&
    typeof season.name === 'string' &&
    season.name.trim() !== '' &&
    typeof season.year === 'number' &&
    Array.isArray(season.tournamentIds) &&
    season.settings &&
    typeof season.settings.breakThreshold === 'number' &&
    typeof season.settings.mastersBreakThreshold === 'number' &&
    typeof season.settings.mastersQualifiers === 'number' &&
    typeof season.settings.participationPoints === 'number' &&
    typeof season.createdAt === 'string' &&
    typeof season.updatedAt === 'string'
  );
}

/**
 * Serializes a season to a plain object for storage
 * @param {SeasonData} season - Season to serialize
 * @returns {SeasonData}
 */
export function serializeSeason(season) {
  return {
    id: season.id,
    name: season.name,
    year: season.year,
    tournamentIds: [...season.tournamentIds],
    settings: { ...season.settings },
    createdAt: season.createdAt,
    updatedAt: season.updatedAt,
  };
}

/**
 * Deserializes a plain object to a season
 * @param {Object} data - Data to deserialize
 * @returns {SeasonData}
 */
export function deserializeSeason(data) {
  return createSeason({
    id: data.id,
    name: data.name,
    year: data.year,
    tournamentIds: data.tournamentIds,
    settings: data.settings,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

export default {
  DEFAULT_SEASON_SETTINGS,
  createSeason,
  addTournamentToSeason,
  removeTournamentFromSeason,
  updateSeasonSettings,
  isValidSeason,
  serializeSeason,
  deserializeSeason,
};
