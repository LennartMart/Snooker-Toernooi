/**
 * Store Actions
 * Action types and action creators for state management
 */

/**
 * Action types
 * @enum {string}
 */
export const ActionTypes = {
  // Season actions
  SET_CURRENT_SEASON: 'SET_CURRENT_SEASON',
  SET_SEASONS: 'SET_SEASONS',
  ADD_SEASON: 'ADD_SEASON',
  UPDATE_SEASON: 'UPDATE_SEASON',

  // Tournament actions
  SET_CURRENT_TOURNAMENT: 'SET_CURRENT_TOURNAMENT',
  ADD_TOURNAMENT: 'ADD_TOURNAMENT',
  UPDATE_TOURNAMENT: 'UPDATE_TOURNAMENT',

  // Player actions
  SET_PLAYERS: 'SET_PLAYERS',
  ADD_PLAYER: 'ADD_PLAYER',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  REMOVE_PLAYER: 'REMOVE_PLAYER',

  // Match actions
  UPDATE_MATCH: 'UPDATE_MATCH',
  ADD_BREAK: 'ADD_BREAK',

  // Pool actions
  UPDATE_POOL: 'UPDATE_POOL',

  // UI actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',

  // State management
  RESET_STATE: 'RESET_STATE',
  LOAD_STATE: 'LOAD_STATE',
};

// ============ Season Action Creators ============

/**
 * Sets the current season
 * @param {import('../models/Season.js').SeasonData|null} season
 * @returns {{type: string, payload: any}}
 */
export function setCurrentSeason(season) {
  return { type: ActionTypes.SET_CURRENT_SEASON, payload: season };
}

/**
 * Sets all seasons
 * @param {import('../models/Season.js').SeasonData[]} seasons
 * @returns {{type: string, payload: any}}
 */
export function setSeasons(seasons) {
  return { type: ActionTypes.SET_SEASONS, payload: seasons };
}

/**
 * Adds a new season
 * @param {import('../models/Season.js').SeasonData} season
 * @returns {{type: string, payload: any}}
 */
export function addSeason(season) {
  return { type: ActionTypes.ADD_SEASON, payload: season };
}

/**
 * Updates an existing season
 * @param {import('../models/Season.js').SeasonData} season
 * @returns {{type: string, payload: any}}
 */
export function updateSeason(season) {
  return { type: ActionTypes.UPDATE_SEASON, payload: season };
}

// ============ Tournament Action Creators ============

/**
 * Sets the current tournament
 * @param {import('../models/Tournament.js').TournamentData|null} tournament
 * @returns {{type: string, payload: any}}
 */
export function setCurrentTournament(tournament) {
  return { type: ActionTypes.SET_CURRENT_TOURNAMENT, payload: tournament };
}

/**
 * Adds a new tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament
 * @returns {{type: string, payload: any}}
 */
export function addTournament(tournament) {
  return { type: ActionTypes.ADD_TOURNAMENT, payload: tournament };
}

/**
 * Updates an existing tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament
 * @returns {{type: string, payload: any}}
 */
export function updateTournament(tournament) {
  return { type: ActionTypes.UPDATE_TOURNAMENT, payload: tournament };
}

// ============ Player Action Creators ============

/**
 * Sets all players
 * @param {import('../models/Player.js').PlayerData[]} players
 * @returns {{type: string, payload: any}}
 */
export function setPlayers(players) {
  return { type: ActionTypes.SET_PLAYERS, payload: players };
}

/**
 * Adds a new player
 * @param {import('../models/Player.js').PlayerData} player
 * @returns {{type: string, payload: any}}
 */
export function addPlayer(player) {
  return { type: ActionTypes.ADD_PLAYER, payload: player };
}

/**
 * Updates an existing player
 * @param {import('../models/Player.js').PlayerData} player
 * @returns {{type: string, payload: any}}
 */
export function updatePlayer(player) {
  return { type: ActionTypes.UPDATE_PLAYER, payload: player };
}

/**
 * Removes a player
 * @param {string} playerId
 * @returns {{type: string, payload: any}}
 */
export function removePlayer(playerId) {
  return { type: ActionTypes.REMOVE_PLAYER, payload: playerId };
}

// ============ Match Action Creators ============

/**
 * Updates a match in the current tournament
 * @param {import('../models/Match.js').MatchData} match
 * @returns {{type: string, payload: any}}
 */
export function updateMatch(match) {
  return { type: ActionTypes.UPDATE_MATCH, payload: match };
}

/**
 * Adds a break to the current tournament
 * @param {import('../models/Break.js').BreakData} breakData
 * @returns {{type: string, payload: any}}
 */
export function addBreak(breakData) {
  return { type: ActionTypes.ADD_BREAK, payload: breakData };
}

// ============ Pool Action Creators ============

/**
 * Updates a pool in the current tournament
 * @param {import('../models/Pool.js').PoolData} pool
 * @returns {{type: string, payload: any}}
 */
export function updatePool(pool) {
  return { type: ActionTypes.UPDATE_POOL, payload: pool };
}

// ============ UI Action Creators ============

/**
 * Sets loading state
 * @param {boolean} loading
 * @returns {{type: string, payload: any}}
 */
export function setLoading(loading) {
  return { type: ActionTypes.SET_LOADING, payload: loading };
}

/**
 * Sets error state
 * @param {string|null} error
 * @returns {{type: string, payload: any}}
 */
export function setError(error) {
  return { type: ActionTypes.SET_ERROR, payload: error };
}

/**
 * Clears error state
 * @returns {{type: string}}
 */
export function clearError() {
  return { type: ActionTypes.CLEAR_ERROR };
}

/**
 * Sets current page
 * @param {string} page
 * @returns {{type: string, payload: any}}
 */
export function setCurrentPage(page) {
  return { type: ActionTypes.SET_CURRENT_PAGE, payload: page };
}

/**
 * Opens a modal
 * @param {string} type - Modal type
 * @param {any} data - Modal data
 * @returns {{type: string, payload: any}}
 */
export function openModal(type, data = null) {
  return { type: ActionTypes.OPEN_MODAL, payload: { type, data } };
}

/**
 * Closes the current modal
 * @returns {{type: string}}
 */
export function closeModal() {
  return { type: ActionTypes.CLOSE_MODAL };
}

// ============ State Management Action Creators ============

/**
 * Resets state to initial
 * @returns {{type: string}}
 */
export function resetState() {
  return { type: ActionTypes.RESET_STATE };
}

/**
 * Loads state from storage
 * @param {import('./initialState.js').AppState} state
 * @returns {{type: string, payload: any}}
 */
export function loadState(state) {
  return { type: ActionTypes.LOAD_STATE, payload: state };
}

export default {
  ActionTypes,
  // Season
  setCurrentSeason,
  setSeasons,
  addSeason,
  updateSeason,
  // Tournament
  setCurrentTournament,
  addTournament,
  updateTournament,
  // Player
  setPlayers,
  addPlayer,
  updatePlayer,
  removePlayer,
  // Match
  updateMatch,
  addBreak,
  // Pool
  updatePool,
  // UI
  setLoading,
  setError,
  clearError,
  setCurrentPage,
  openModal,
  closeModal,
  // State
  resetState,
  loadState,
};
