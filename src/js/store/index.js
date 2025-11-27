/**
 * Store Index
 * Exports store singleton and related modules
 */

export { store, Store } from './Store.js';

export { initialState, defaultUIState, createInitialState } from './initialState.js';

export {
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
} from './actions.js';
