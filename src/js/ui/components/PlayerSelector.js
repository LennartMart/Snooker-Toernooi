/**
 * Player Selector Component
 * Multi-select player list with ability to add new players
 */

import { createElement, h, render, mapToElements } from '../Component.js';
import { getAllPlayers, createNewPlayer, searchPlayers } from '../../services/PlayerService.js';

/**
 * @typedef {Object} PlayerSelectorOptions
 * @property {HTMLElement} container - Container element to render into
 * @property {string[]} [selectedIds=[]] - Initially selected player IDs
 * @property {function(string[]): void} [onSelectionChange] - Callback when selection changes
 * @property {number} [minSelection=0] - Minimum required selections
 * @property {number} [maxSelection=Infinity] - Maximum allowed selections
 */

/**
 * @typedef {Object} PlayerSelectorState
 * @property {import('../../models/Player.js').PlayerData[]} players - All available players
 * @property {Set<string>} selectedIds - Selected player IDs
 * @property {string} searchQuery - Current search query
 * @property {boolean} isLoading - Loading state
 * @property {string|null} error - Error message
 * @property {boolean} showAddForm - Whether to show add player form
 * @property {string} newPlayerName - Name for new player
 */

/**
 * Creates a Player Selector component
 * @param {PlayerSelectorOptions} options - Component options
 * @returns {Object} Component API
 */
export function createPlayerSelector(options) {
  const {
    container,
    selectedIds = [],
    onSelectionChange,
    minSelection = 0,
    maxSelection = Infinity,
  } = options;

  /** @type {PlayerSelectorState} */
  let state = {
    players: [],
    selectedIds: new Set(selectedIds),
    searchQuery: '',
    isLoading: true,
    error: null,
    showAddForm: false,
    newPlayerName: '',
  };

  /**
   * Updates state and re-renders
   * @param {Partial<PlayerSelectorState>} updates - State updates
   */
  function setState(updates) {
    state = { ...state, ...updates };
    renderComponent();
  }

  /**
   * Loads players from service
   */
  async function loadPlayers() {
    setState({ isLoading: true, error: null });
    
    try {
      const players = await getAllPlayers();
      setState({ players, isLoading: false });
    } catch (error) {
      setState({ error: error.message, isLoading: false });
    }
  }

  /**
   * Handles search input
   * @param {Event} e - Input event
   */
  async function handleSearch(e) {
    const query = e.target.value;
    // Update state without immediate re-render to preserve focus
    state.searchQuery = query;

    if (query.trim() === '') {
      const players = await getAllPlayers();
      setState({ players, searchQuery: query });
    } else {
      const players = await searchPlayers(query);
      setState({ players, searchQuery: query });
    }
  }

  /**
   * Toggles player selection
   * @param {string} playerId - Player ID to toggle
   */
  function toggleSelection(playerId) {
    const newSelectedIds = new Set(state.selectedIds);
    
    if (newSelectedIds.has(playerId)) {
      newSelectedIds.delete(playerId);
    } else if (newSelectedIds.size < maxSelection) {
      newSelectedIds.add(playerId);
    }

    setState({ selectedIds: newSelectedIds });
    
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelectedIds));
    }
  }

  /**
   * Selects all visible players
   */
  function selectAll() {
    const newSelectedIds = new Set(state.selectedIds);
    const availableSlots = maxSelection - newSelectedIds.size;
    
    state.players.slice(0, availableSlots).forEach((player) => {
      newSelectedIds.add(player.id);
    });

    setState({ selectedIds: newSelectedIds });
    
    if (onSelectionChange) {
      onSelectionChange(Array.from(newSelectedIds));
    }
  }

  /**
   * Deselects all players
   */
  function deselectAll() {
    setState({ selectedIds: new Set() });
    
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  }

  /**
   * Shows the add player form
   */
  function showAddPlayerForm() {
    setState({ showAddForm: true, newPlayerName: '' });
  }

  /**
   * Hides the add player form
   */
  function hideAddPlayerForm() {
    setState({ showAddForm: false, newPlayerName: '' });
  }

  /**
   * Handles new player name input
   * @param {Event} e - Input event
   */
  function handleNewPlayerName(e) {
    // Update state without re-rendering to avoid losing focus
    state.newPlayerName = e.target.value;
    // Update button disabled state directly
    const submitBtn = container.querySelector('.add-player-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !e.target.value.trim();
    }
  }

  /**
   * Creates a new player
   * @param {Event} e - Form submit event
   */
  async function handleAddPlayer(e) {
    e.preventDefault();
    
    const name = state.newPlayerName.trim();
    if (!name) {
      return;
    }

    setState({ isLoading: true, error: null });

    try {
      const player = await createNewPlayer(name);
      
      // Auto-select the new player if we haven't hit max
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.size < maxSelection) {
        newSelectedIds.add(player.id);
      }

      // Reload players
      const players = await getAllPlayers();
      
      setState({
        players,
        selectedIds: newSelectedIds,
        showAddForm: false,
        newPlayerName: '',
        isLoading: false,
      });

      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelectedIds));
      }
    } catch (error) {
      setState({ error: error.message, isLoading: false });
    }
  }

  /**
   * Renders a player item
   * @param {import('../../models/Player.js').PlayerData} player - Player to render
   * @returns {HTMLElement}
   */
  function renderPlayerItem(player) {
    const isSelected = state.selectedIds.has(player.id);
    const isDisabled = !isSelected && state.selectedIds.size >= maxSelection;

    return h.li(
      {
        className: `player-item ${isSelected ? 'player-item--selected' : ''} ${isDisabled ? 'player-item--disabled' : ''}`,
        onClick: () => !isDisabled && toggleSelection(player.id),
      },
      h.input({
        type: 'checkbox',
        checked: isSelected,
        disabled: isDisabled,
        className: 'player-item__checkbox',
        'aria-label': `Select ${player.name}`,
      }),
      h.span({ className: 'player-item__name' }, player.name)
    );
  }

  /**
   * Renders the add player form
   * @returns {HTMLElement}
   */
  function renderAddPlayerForm() {
    if (!state.showAddForm) {
      return h.button(
        {
          type: 'button',
          className: 'btn btn--secondary btn--sm',
          onClick: showAddPlayerForm,
        },
        '+ Add New Player'
      );
    }

    return createElement(
      'form',
      { className: 'add-player-form', onSubmit: handleAddPlayer },
      h.div(
        { className: 'form-group form-group--inline' },
        h.input({
          type: 'text',
          className: 'form-input',
          placeholder: 'Player name',
          value: state.newPlayerName,
          onInput: handleNewPlayerName,
          autoFocus: true,
        }),
        h.button(
          { type: 'submit', className: 'btn btn--primary btn--sm', disabled: !state.newPlayerName.trim() },
          'Add'
        ),
        h.button(
          { type: 'button', className: 'btn btn--secondary btn--sm', onClick: hideAddPlayerForm },
          'Cancel'
        )
      )
    );
  }

  /**
   * Renders the component
   */
  function renderComponent() {
    const selectedCount = state.selectedIds.size;
    const validSelection = selectedCount >= minSelection;

    const element = createElement(
      'div',
      { className: 'player-selector' },
      
      // Header
      h.div(
        { className: 'player-selector__header' },
        h.h3({}, 'Select Players'),
        h.span(
          { className: `player-selector__count ${!validSelection ? 'player-selector__count--invalid' : ''}` },
          `${selectedCount} selected`,
          minSelection > 0 ? ` (min: ${minSelection})` : '',
          maxSelection < Infinity ? ` (max: ${maxSelection})` : ''
        )
      ),

      // Search
      h.div(
        { className: 'player-selector__search' },
        h.input({
          type: 'search',
          className: 'form-input',
          placeholder: 'Search players...',
          value: state.searchQuery,
          onInput: handleSearch,
        })
      ),

      // Actions
      h.div(
        { className: 'player-selector__actions' },
        h.button(
          { type: 'button', className: 'btn btn--text btn--sm', onClick: selectAll },
          'Select All'
        ),
        h.button(
          { type: 'button', className: 'btn btn--text btn--sm', onClick: deselectAll },
          'Deselect All'
        )
      ),

      // Error
      state.error ? h.div({ className: 'alert alert--error' }, state.error) : null,

      // Loading
      state.isLoading
        ? h.div({ className: 'player-selector__loading' }, 'Loading players...')
        : null,

      // Player list
      !state.isLoading
        ? createElement(
            'ul',
            { className: 'player-list' },
            ...mapToElements(state.players, renderPlayerItem)
          )
        : null,

      // Empty state
      !state.isLoading && state.players.length === 0
        ? h.div(
            { className: 'player-selector__empty' },
            state.searchQuery ? 'No players found' : 'No players yet. Add your first player below.'
          )
        : null,

      // Add player form
      h.div({ className: 'player-selector__add' }, renderAddPlayerForm())
    );

    render(container, element);
  }

  // Initialize
  loadPlayers();

  // Public API
  return {
    /**
     * Gets the selected player IDs
     * @returns {string[]}
     */
    getSelectedIds() {
      return Array.from(state.selectedIds);
    },

    /**
     * Sets the selected player IDs
     * @param {string[]} ids - Player IDs to select
     */
    setSelectedIds(ids) {
      setState({ selectedIds: new Set(ids) });
      if (onSelectionChange) {
        onSelectionChange(ids);
      }
    },

    /**
     * Refreshes the player list
     */
    refresh() {
      loadPlayers();
    },

    /**
     * Checks if selection is valid
     * @returns {boolean}
     */
    isValid() {
      return state.selectedIds.size >= minSelection && state.selectedIds.size <= maxSelection;
    },

    /**
     * Gets the selected count
     * @returns {number}
     */
    getSelectedCount() {
      return state.selectedIds.size;
    },
  };
}

export default { createPlayerSelector };
