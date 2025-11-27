/**
 * Players Page
 * Player management with CRUD operations: list, add, edit, delete players
 */

import { render, createElement, h, showLoading, showError } from '../Component.js';
import { store, setLoading, setError } from '../../store/index.js';
import {
  getAllPlayers,
  createNewPlayer,
  updateExistingPlayer,
  deletePlayer,
} from '../../services/PlayerService.js';
import { formatDate } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} PlayersPageProps
 * @property {HTMLElement} container - Container element
 */

/**
 * Page state
 */
let pageState = {
  players: [],
  filteredPlayers: [],
  searchQuery: '',
  sortField: 'name',
  sortDirection: 'asc',
  editingPlayerId: null,
  editingName: '',
  isAddingNew: false,
  newPlayerName: '',
};

/**
 * Container reference for re-renders
 */
let containerRef = null;

/**
 * Loads all players from storage
 */
async function loadPlayers() {
  try {
    store.dispatch(setLoading(true));
    const players = await getAllPlayers();
    pageState.players = players;
    applyFilterAndSort();
  } catch (error) {
    store.dispatch(setError(error.message));
    throw error;
  } finally {
    store.dispatch(setLoading(false));
  }
}

/**
 * Applies search filter and sorting to players
 */
function applyFilterAndSort() {
  let filtered = [...pageState.players];

  // Apply search filter
  if (pageState.searchQuery.trim()) {
    const query = pageState.searchQuery.toLowerCase();
    filtered = filtered.filter((player) =>
      player.name.toLowerCase().includes(query)
    );
  }

  // Apply sorting
  filtered.sort((a, b) => {
    let comparison = 0;
    if (pageState.sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (pageState.sortField === 'createdAt') {
      comparison = new Date(a.createdAt) - new Date(b.createdAt);
    }
    return pageState.sortDirection === 'asc' ? comparison : -comparison;
  });

  pageState.filteredPlayers = filtered;
}

/**
 * Handles search input change
 * @param {Event} e - Input event
 */
function handleSearchChange(e) {
  pageState.searchQuery = e.target.value;
  applyFilterAndSort();
  reRender();
}

/**
 * Handles sort change
 * @param {string} field - Field to sort by
 */
function handleSortChange(field) {
  if (pageState.sortField === field) {
    pageState.sortDirection = pageState.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    pageState.sortField = field;
    pageState.sortDirection = 'asc';
  }
  applyFilterAndSort();
  reRender();
}

/**
 * Handles starting to add a new player
 */
function handleStartAdd() {
  pageState.isAddingNew = true;
  pageState.newPlayerName = '';
  reRender();
  // Focus the input after render
  window.setTimeout(() => {
    const input = document.getElementById('new-player-input');
    if (input) {
      input.focus();
    }
  }, 0);
}

/**
 * Handles canceling the add new player form
 */
function handleCancelAdd() {
  pageState.isAddingNew = false;
  pageState.newPlayerName = '';
  reRender();
}

/**
 * Handles submitting a new player
 */
async function handleSubmitAdd() {
  const name = pageState.newPlayerName.trim();
  if (!name) {
    return;
  }

  try {
    store.dispatch(setLoading(true));
    await createNewPlayer(name);
    pageState.isAddingNew = false;
    pageState.newPlayerName = '';
    await loadPlayers();
    reRender();
  } catch (error) {
    alert(`Failed to create player: ${error.message}`);
  } finally {
    store.dispatch(setLoading(false));
  }
}

/**
 * Handles starting to edit a player
 * @param {string} playerId - Player ID to edit
 * @param {string} currentName - Current player name
 */
function handleStartEdit(playerId, currentName) {
  pageState.editingPlayerId = playerId;
  pageState.editingName = currentName;
  reRender();
  // Focus the input after render
  window.setTimeout(() => {
    const input = document.getElementById(`edit-input-${playerId}`);
    if (input) {
      input.focus();
      input.select();
    }
  }, 0);
}

/**
 * Handles canceling the edit
 */
function handleCancelEdit() {
  pageState.editingPlayerId = null;
  pageState.editingName = '';
  reRender();
}

/**
 * Handles submitting the edit
 * @param {string} playerId - Player ID
 */
async function handleSubmitEdit(playerId) {
  const name = pageState.editingName.trim();
  if (!name) {
    return;
  }

  try {
    store.dispatch(setLoading(true));
    await updateExistingPlayer(playerId, { name });
    pageState.editingPlayerId = null;
    pageState.editingName = '';
    await loadPlayers();
    reRender();
  } catch (error) {
    alert(`Failed to update player: ${error.message}`);
  } finally {
    store.dispatch(setLoading(false));
  }
}

/**
 * Handles deleting a player
 * @param {string} playerId - Player ID
 * @param {string} playerName - Player name for confirmation
 */
async function handleDelete(playerId, playerName) {
  const confirmed = confirm(`Are you sure you want to delete "${playerName}"? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  try {
    store.dispatch(setLoading(true));
    await deletePlayer(playerId);
    await loadPlayers();
    reRender();
  } catch (error) {
    alert(`Failed to delete player: ${error.message}`);
  } finally {
    store.dispatch(setLoading(false));
  }
}

/**
 * Handles keyboard events for inline editing
 * @param {KeyboardEvent} e - Keyboard event
 * @param {string} action - 'add' or 'edit'
 * @param {string} [playerId] - Player ID (for edit)
 */
function handleKeyDown(e, action, playerId) {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (action === 'add') {
      handleSubmitAdd();
    } else if (action === 'edit') {
      handleSubmitEdit(playerId);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (action === 'add') {
      handleCancelAdd();
    } else if (action === 'edit') {
      handleCancelEdit();
    }
  }
}

/**
 * Renders the page header with search and add button
 * @returns {HTMLElement}
 */
function renderHeader() {
  return createElement(
    'header',
    { className: 'players-page__header' },
    createElement(
      'div',
      { className: 'players-page__title-row' },
      h.h1({ className: 'players-page__title' }, '🎱 Players'),
      h.button(
        {
          className: 'btn btn--primary',
          onClick: handleStartAdd,
          disabled: pageState.isAddingNew,
          'aria-label': 'Add new player',
        },
        '+ Add Player'
      )
    ),
    createElement(
      'div',
      { className: 'players-page__controls' },
      createElement(
        'div',
        { className: 'players-page__search' },
        h.input({
          type: 'search',
          className: 'form-input',
          placeholder: 'Search players...',
          value: pageState.searchQuery,
          onInput: handleSearchChange,
          'aria-label': 'Search players',
        })
      ),
      createElement(
        'div',
        { className: 'players-page__sort' },
        h.label({ className: 'form-label--inline' }, 'Sort by:'),
        h.button(
          {
            className: `btn btn--sm ${pageState.sortField === 'name' ? 'btn--active' : 'btn--ghost'}`,
            onClick: () => handleSortChange('name'),
            'aria-pressed': pageState.sortField === 'name',
          },
          `Name ${pageState.sortField === 'name' ? (pageState.sortDirection === 'asc' ? '↑' : '↓') : ''}`
        ),
        h.button(
          {
            className: `btn btn--sm ${pageState.sortField === 'createdAt' ? 'btn--active' : 'btn--ghost'}`,
            onClick: () => handleSortChange('createdAt'),
            'aria-pressed': pageState.sortField === 'createdAt',
          },
          `Date ${pageState.sortField === 'createdAt' ? (pageState.sortDirection === 'asc' ? '↑' : '↓') : ''}`
        )
      )
    )
  );
}

/**
 * Renders the add new player form
 * @returns {HTMLElement}
 */
function renderAddForm() {
  if (!pageState.isAddingNew) {
    return null;
  }

  return createElement(
    'div',
    { className: 'players-page__add-form' },
    h.input({
      id: 'new-player-input',
      type: 'text',
      className: 'form-input',
      placeholder: 'Enter player name',
      value: pageState.newPlayerName,
      onInput: (e) => {
        pageState.newPlayerName = e.target.value;
        // Update button disabled state without full re-render
        const saveBtn = document.querySelector('.players-page__add-actions .btn--primary');
        if (saveBtn) {
          saveBtn.disabled = !e.target.value.trim();
        }
      },
      onKeydown: (e) => handleKeyDown(e, 'add'),
      'aria-label': 'New player name',
    }),
    createElement(
      'div',
      { className: 'players-page__add-actions' },
      h.button(
        {
          className: 'btn btn--primary btn--sm',
          onClick: handleSubmitAdd,
          disabled: !pageState.newPlayerName.trim(),
        },
        'Save'
      ),
      h.button(
        {
          className: 'btn btn--ghost btn--sm',
          onClick: handleCancelAdd,
        },
        'Cancel'
      )
    )
  );
}

/**
 * Renders a single player row
 * @param {Object} player - Player data
 * @returns {HTMLElement}
 */
function renderPlayerRow(player) {
  const isEditing = pageState.editingPlayerId === player.id;

  if (isEditing) {
    return createElement(
      'tr',
      { className: 'players-table__row players-table__row--editing', key: player.id },
      h.td(
        { className: 'players-table__col-name' },
        h.input({
          id: `edit-input-${player.id}`,
          type: 'text',
          className: 'form-input form-input--sm',
          value: pageState.editingName,
          onInput: (e) => {
            pageState.editingName = e.target.value;
          },
          onKeydown: (e) => handleKeyDown(e, 'edit', player.id),
          'aria-label': 'Edit player name',
        })
      ),
      h.td({ className: 'players-table__col-date' }, formatDate(player.createdAt)),
      h.td(
        { className: 'players-table__col-actions' },
        h.button(
          {
            className: 'btn btn--primary btn--sm',
            onClick: () => handleSubmitEdit(player.id),
            disabled: !pageState.editingName.trim(),
            'aria-label': 'Save changes',
          },
          '✓'
        ),
        h.button(
          {
            className: 'btn btn--ghost btn--sm',
            onClick: handleCancelEdit,
            'aria-label': 'Cancel editing',
          },
          '✕'
        )
      )
    );
  }

  return createElement(
    'tr',
    { className: 'players-table__row', key: player.id, tabindex: '0' },
    h.td({ className: 'players-table__col-name' }, player.name),
    h.td({ className: 'players-table__col-date' }, formatDate(player.createdAt)),
    h.td(
      { className: 'players-table__col-actions' },
      h.button(
        {
          className: 'btn btn--ghost btn--sm',
          onClick: () => handleStartEdit(player.id, player.name),
          'aria-label': `Edit ${player.name}`,
        },
        '✏️'
      ),
      h.button(
        {
          className: 'btn btn--ghost btn--sm btn--danger',
          onClick: () => handleDelete(player.id, player.name),
          'aria-label': `Delete ${player.name}`,
        },
        '🗑️'
      )
    )
  );
}

/**
 * Renders the players table
 * @returns {HTMLElement}
 */
function renderPlayersTable() {
  const { filteredPlayers, players } = pageState;

  if (players.length === 0) {
    return createElement(
      'div',
      { className: 'players-page__empty' },
      h.p({ className: 'empty-state__message' }, 'No players yet'),
      h.p({ className: 'empty-state__hint' }, 'Add your first player to get started with tournaments.')
    );
  }

  if (filteredPlayers.length === 0) {
    return createElement(
      'div',
      { className: 'players-page__empty' },
      h.p({ className: 'empty-state__message' }, 'No players match your search'),
      h.button(
        {
          className: 'btn btn--secondary',
          onClick: () => {
            pageState.searchQuery = '';
            applyFilterAndSort();
            reRender();
          },
        },
        'Clear Search'
      )
    );
  }

  return createElement(
    'div',
    { className: 'players-table' },
    createElement(
      'div',
      { className: 'players-table__header' },
      h.span({ className: 'players-table__count' }, `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''}`)
    ),
    createElement(
      'table',
      { className: 'players-table__table', role: 'grid' },
      h.thead(
        {},
        h.tr(
          {},
          h.th({ className: 'players-table__col-name', scope: 'col' }, 'Name'),
          h.th({ className: 'players-table__col-date', scope: 'col' }, 'Added'),
          h.th({ className: 'players-table__col-actions', scope: 'col' }, 'Actions')
        )
      ),
      h.tbody(
        {},
        ...filteredPlayers.map((player) => renderPlayerRow(player))
      )
    )
  );
}

/**
 * Re-renders the page with current state
 */
function reRender() {
  if (!containerRef) {
    return;
  }
  renderPlayersPage({ container: containerRef });
}

/**
 * Renders the Players page
 * @param {PlayersPageProps} props - Page properties
 */
export async function renderPlayersPage(props) {
  const { container } = props;
  containerRef = container;

  // If players not loaded yet, load them
  if (pageState.players.length === 0) {
    showLoading(container, 'Loading players...');
    try {
      await loadPlayers();
    } catch (error) {
      showError(container, `Failed to load players: ${error.message}`, () => {
        renderPlayersPage(props);
      });
      return;
    }
  }

  // Render the page
  const pageElement = createElement(
    'div',
    { className: 'page page--players' },
    renderHeader(),
    renderAddForm(),
    renderPlayersTable()
  );

  render(container, pageElement);
}

/**
 * Resets page state (useful for navigation)
 */
export function resetPlayersPageState() {
  pageState = {
    players: [],
    filteredPlayers: [],
    searchQuery: '',
    sortField: 'name',
    sortDirection: 'asc',
    editingPlayerId: null,
    editingName: '',
    isAddingNew: false,
    newPlayerName: '',
  };
  containerRef = null;
}

export default { renderPlayersPage, resetPlayersPageState };
