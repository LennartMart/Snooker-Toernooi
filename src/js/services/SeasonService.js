/**
 * SeasonService
 * Manages seasons, adding tournaments, and retrieving season data
 */

import {
  createSeason,
  addTournamentToSeason,
  removeTournamentFromSeason,
  updateSeasonSettings,
  serializeSeason,
  deserializeSeason,
} from '../models/Season.js';
import { getStorage } from '../storage/index.js';
import { store } from '../store/index.js';

const STORAGE_KEY_SEASONS = 'seasons';
const STORAGE_KEY_CURRENT_SEASON = 'currentSeasonId';

/**
 * Creates a new season
 * @param {Object} params - Season parameters
 * @param {string} params.name - Season name
 * @param {number} params.year - Starting year
 * @param {Object} [params.settings] - Season settings
 * @returns {Promise<import('../models/Season.js').SeasonData>}
 */
export async function createNewSeason({ name, year, settings = {} }) {
  if (!name || name.trim() === '') {
    throw new Error('Season name is required');
  }

  if (!year || year < 2000 || year > 2100) {
    throw new Error('Valid year is required');
  }

  // Create season
  const season = createSeason({
    name,
    year,
    settings,
  });

  // Save to storage
  await saveSeason(season);

  // Update store
  store.dispatch({ type: 'ADD_SEASON', payload: season });

  return season;
}

/**
 * Saves a season to storage
 * @param {import('../models/Season.js').SeasonData} season - Season to save
 * @returns {Promise<void>}
 */
export async function saveSeason(season) {
  const storage = getStorage();
  const seasons = (await storage.getItem(STORAGE_KEY_SEASONS)) || [];

  const existingIndex = seasons.findIndex((s) => s.id === season.id);
  if (existingIndex >= 0) {
    seasons[existingIndex] = serializeSeason(season);
  } else {
    seasons.push(serializeSeason(season));
  }

  await storage.setItem(STORAGE_KEY_SEASONS, seasons);
}

/**
 * Loads a season from storage
 * @param {string} seasonId - Season ID
 * @returns {Promise<import('../models/Season.js').SeasonData|null>}
 */
export async function loadSeason(seasonId) {
  const storage = getStorage();
  const seasons = (await storage.getItem(STORAGE_KEY_SEASONS)) || [];
  const seasonData = seasons.find((s) => s.id === seasonId);

  if (!seasonData) {
    return null;
  }

  return deserializeSeason(seasonData);
}

/**
 * Gets all seasons
 * @returns {Promise<import('../models/Season.js').SeasonData[]>}
 */
export async function getAllSeasons() {
  const storage = getStorage();
  const seasons = (await storage.getItem(STORAGE_KEY_SEASONS)) || [];
  return seasons.map(deserializeSeason);
}

/**
 * Gets a season by ID
 * @param {string} seasonId - Season ID
 * @returns {Promise<import('../models/Season.js').SeasonData|null>}
 */
export async function getSeasonById(seasonId) {
  return loadSeason(seasonId);
}

/**
 * Adds a tournament to a season
 * @param {string} seasonId - Season ID
 * @param {string} tournamentId - Tournament ID to add
 * @returns {Promise<import('../models/Season.js').SeasonData>}
 */
export async function addTournamentToSeasonById(seasonId, tournamentId) {
  const season = await loadSeason(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const updatedSeason = addTournamentToSeason(season, tournamentId);
  await saveSeason(updatedSeason);

  // Update store
  store.dispatch({ type: 'UPDATE_SEASON', payload: updatedSeason });

  return updatedSeason;
}

/**
 * Removes a tournament from a season
 * @param {string} seasonId - Season ID
 * @param {string} tournamentId - Tournament ID to remove
 * @returns {Promise<import('../models/Season.js').SeasonData>}
 */
export async function removeTournamentFromSeasonById(seasonId, tournamentId) {
  const season = await loadSeason(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const updatedSeason = removeTournamentFromSeason(season, tournamentId);
  await saveSeason(updatedSeason);

  // Update store
  store.dispatch({ type: 'UPDATE_SEASON', payload: updatedSeason });

  return updatedSeason;
}

/**
 * Updates season settings
 * @param {string} seasonId - Season ID
 * @param {Object} newSettings - New settings
 * @returns {Promise<import('../models/Season.js').SeasonData>}
 */
export async function updateSeasonSettingsById(seasonId, newSettings) {
  const season = await loadSeason(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const updatedSeason = updateSeasonSettings(season, newSettings);
  await saveSeason(updatedSeason);

  // Update store
  store.dispatch({ type: 'UPDATE_SEASON', payload: updatedSeason });

  return updatedSeason;
}

/**
 * Deletes a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<void>}
 */
export async function deleteSeason(seasonId) {
  const storage = getStorage();
  const seasons = (await storage.getItem(STORAGE_KEY_SEASONS)) || [];
  const filteredSeasons = seasons.filter((s) => s.id !== seasonId);

  await storage.setItem(STORAGE_KEY_SEASONS, filteredSeasons);

  // Clear current season if it was deleted
  const currentSeasonId = await storage.getItem(STORAGE_KEY_CURRENT_SEASON);
  if (currentSeasonId === seasonId) {
    await storage.removeItem(STORAGE_KEY_CURRENT_SEASON);
  }

  // Update store
  store.dispatch({ type: 'REMOVE_SEASON', payload: seasonId });
}

/**
 * Sets the current active season
 * @param {string} seasonId - Season ID
 * @returns {Promise<void>}
 */
export async function setCurrentSeason(seasonId) {
  const season = await loadSeason(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const storage = getStorage();
  await storage.setItem(STORAGE_KEY_CURRENT_SEASON, seasonId);

  // Update store
  store.dispatch({ type: 'SET_CURRENT_SEASON', payload: season });
}

/**
 * Gets the current active season
 * @returns {Promise<import('../models/Season.js').SeasonData|null>}
 */
export async function getCurrentSeason() {
  const storage = getStorage();
  const currentSeasonId = await storage.getItem(STORAGE_KEY_CURRENT_SEASON);

  if (!currentSeasonId) {
    return null;
  }

  return loadSeason(currentSeasonId);
}

/**
 * Gets all tournaments in a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<string[]>} Tournament IDs
 */
export async function getSeasonTournamentIds(seasonId) {
  const season = await loadSeason(seasonId);

  if (!season) {
    return [];
  }

  return season.tournamentIds;
}

/**
 * Gets season count
 * @returns {Promise<number>}
 */
export async function getSeasonCount() {
  const seasons = await getAllSeasons();
  return seasons.length;
}

/**
 * Creates a default season name based on year
 * @param {number} year - Starting year
 * @returns {string} Season name (e.g., "2024-2025")
 */
export function generateSeasonName(year) {
  return `${year}-${year + 1}`;
}

/**
 * Validates if a season can be created
 * @param {string} name - Proposed name
 * @param {number} year - Proposed year
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
export async function validateNewSeason(name, year) {
  const errors = [];

  if (!name || name.trim() === '') {
    errors.push('Season name is required');
  }

  if (!year || year < 2000 || year > 2100) {
    errors.push('Valid year between 2000 and 2100 is required');
  }

  // Check for duplicate names
  const seasons = await getAllSeasons();
  if (seasons.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    errors.push('A season with this name already exists');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  createNewSeason,
  saveSeason,
  loadSeason,
  getAllSeasons,
  getSeasonById,
  addTournamentToSeasonById,
  removeTournamentFromSeasonById,
  updateSeasonSettingsById,
  deleteSeason,
  setCurrentSeason,
  getCurrentSeason,
  getSeasonTournamentIds,
  getSeasonCount,
  generateSeasonName,
  validateNewSeason,
};
