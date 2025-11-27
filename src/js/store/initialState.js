/**
 * Initial State
 * Defines the default application state shape
 */

/**
 * @typedef {Object} UIState
 * @property {boolean} loading - Global loading state
 * @property {string|null} error - Current error message
 * @property {string} currentPage - Current page/route
 * @property {Object} modal - Modal state
 * @property {boolean} modal.isOpen - Whether modal is open
 * @property {string|null} modal.type - Type of modal (create, edit, confirm, etc.)
 * @property {any} modal.data - Modal-specific data
 */

/**
 * @typedef {Object} AppState
 * @property {import('../models/Season.js').SeasonData|null} currentSeason - Active season
 * @property {import('../models/Tournament.js').TournamentData|null} currentTournament - Active tournament
 * @property {import('../models/Player.js').PlayerData[]} players - All registered players
 * @property {import('../models/Season.js').SeasonData[]} seasons - All seasons
 * @property {UIState} ui - UI state
 */

/**
 * Default UI state
 * @type {UIState}
 */
export const defaultUIState = {
  loading: false,
  error: null,
  currentPage: 'home',
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
};

/**
 * Initial application state
 * @type {AppState}
 */
export const initialState = {
  currentSeason: null,
  currentTournament: null,
  players: [],
  seasons: [],
  ui: { ...defaultUIState },
};

/**
 * Creates a fresh copy of the initial state
 * @returns {AppState}
 */
export function createInitialState() {
  return {
    currentSeason: null,
    currentTournament: null,
    players: [],
    seasons: [],
    ui: { ...defaultUIState },
  };
}

export default initialState;
