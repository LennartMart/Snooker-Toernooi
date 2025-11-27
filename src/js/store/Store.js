/**
 * Application Store
 * Simple state management with subscribe/dispatch pattern
 */

import { initialState, createInitialState } from './initialState.js';
import { ActionTypes } from './actions.js';

/**
 * @typedef {Object} Action
 * @property {string} type - Action type
 * @property {any} [payload] - Action payload
 */

/**
 * @typedef {function(import('./initialState.js').AppState): void} Listener
 */

/**
 * Store class - manages application state
 */
class Store {
  constructor() {
    /** @type {import('./initialState.js').AppState} */
    this._state = createInitialState();

    /** @type {Set<Listener>} */
    this._listeners = new Set();
  }

  /**
   * Gets the current state
   * @returns {import('./initialState.js').AppState}
   */
  getState() {
    return this._state;
  }

  /**
   * Subscribes to state changes
   * @param {Listener} listener - Callback function
   * @returns {function(): void} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Dispatches an action to update state
   * @param {Action} action - Action to dispatch
   */
  dispatch(action) {
    const prevState = this._state;
    this._state = this._reduce(prevState, action);

    // Notify listeners if state changed
    if (this._state !== prevState) {
      this._notifyListeners();
    }
  }

  /**
   * Notifies all listeners of state change
   * @private
   */
  _notifyListeners() {
    this._listeners.forEach((listener) => {
      try {
        listener(this._state);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error in store listener:', error);
      }
    });
  }

  /**
   * Reducer function - produces new state from action
   * @param {import('./initialState.js').AppState} state - Current state
   * @param {Action} action - Action to apply
   * @returns {import('./initialState.js').AppState} New state
   * @private
   */
  _reduce(state, action) {
    switch (action.type) {
      // Season actions
      case ActionTypes.SET_CURRENT_SEASON:
        return { ...state, currentSeason: action.payload };

      case ActionTypes.SET_SEASONS:
        return { ...state, seasons: action.payload };

      case ActionTypes.ADD_SEASON:
        return { ...state, seasons: [...state.seasons, action.payload] };

      case ActionTypes.UPDATE_SEASON:
        return {
          ...state,
          seasons: state.seasons.map((s) => (s.id === action.payload.id ? action.payload : s)),
          currentSeason:
            state.currentSeason?.id === action.payload.id ? action.payload : state.currentSeason,
        };

      // Tournament actions
      case ActionTypes.SET_CURRENT_TOURNAMENT:
        return { ...state, currentTournament: action.payload };

      case ActionTypes.ADD_TOURNAMENT: {
        // Also update current season if tournament belongs to it
        let updatedSeason = state.currentSeason;
        if (updatedSeason && action.payload.seasonId === updatedSeason.id) {
          updatedSeason = {
            ...updatedSeason,
            tournamentIds: [...updatedSeason.tournamentIds, action.payload.id],
          };
        }
        return {
          ...state,
          currentTournament: action.payload,
          currentSeason: updatedSeason,
        };
      }

      case ActionTypes.UPDATE_TOURNAMENT:
        return {
          ...state,
          currentTournament:
            state.currentTournament?.id === action.payload.id
              ? action.payload
              : state.currentTournament,
        };

      // Player actions
      case ActionTypes.SET_PLAYERS:
        return { ...state, players: action.payload };

      case ActionTypes.ADD_PLAYER:
        return { ...state, players: [...state.players, action.payload] };

      case ActionTypes.UPDATE_PLAYER:
        return {
          ...state,
          players: state.players.map((p) => (p.id === action.payload.id ? action.payload : p)),
        };

      case ActionTypes.REMOVE_PLAYER:
        return {
          ...state,
          players: state.players.filter((p) => p.id !== action.payload),
        };

      // Match actions
      case ActionTypes.UPDATE_MATCH:
        if (!state.currentTournament) {
          return state;
        }
        return {
          ...state,
          currentTournament: {
            ...state.currentTournament,
            matches: state.currentTournament.matches.map((m) =>
              m.id === action.payload.id ? action.payload : m
            ),
          },
        };

      case ActionTypes.ADD_BREAK:
        if (!state.currentTournament) {
          return state;
        }
        return {
          ...state,
          currentTournament: {
            ...state.currentTournament,
            breaks: [...state.currentTournament.breaks, action.payload],
          },
        };

      // Pool actions
      case ActionTypes.UPDATE_POOL:
        if (!state.currentTournament) {
          return state;
        }
        return {
          ...state,
          currentTournament: {
            ...state.currentTournament,
            pools: state.currentTournament.pools.map((p) =>
              p.id === action.payload.id ? action.payload : p
            ),
          },
        };

      // UI actions
      case ActionTypes.SET_LOADING:
        return { ...state, ui: { ...state.ui, loading: action.payload } };

      case ActionTypes.SET_ERROR:
        return { ...state, ui: { ...state.ui, error: action.payload } };

      case ActionTypes.CLEAR_ERROR:
        return { ...state, ui: { ...state.ui, error: null } };

      case ActionTypes.SET_CURRENT_PAGE:
        return { ...state, ui: { ...state.ui, currentPage: action.payload } };

      case ActionTypes.OPEN_MODAL:
        return {
          ...state,
          ui: {
            ...state.ui,
            modal: {
              isOpen: true,
              type: action.payload.type,
              data: action.payload.data,
            },
          },
        };

      case ActionTypes.CLOSE_MODAL:
        return {
          ...state,
          ui: {
            ...state.ui,
            modal: {
              isOpen: false,
              type: null,
              data: null,
            },
          },
        };

      // State management
      case ActionTypes.RESET_STATE:
        return createInitialState();

      case ActionTypes.LOAD_STATE:
        return { ...initialState, ...action.payload };

      default:
        return state;
    }
  }

  /**
   * Selects a portion of state
   * @template T
   * @param {function(import('./initialState.js').AppState): T} selector - Selector function
   * @returns {T} Selected value
   */
  select(selector) {
    return selector(this._state);
  }
}

// Create singleton store instance
const store = new Store();

export { store, Store };
export default store;
