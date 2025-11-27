/**
 * BracketMatch Component
 * Displays a single match box in a bracket view
 */

import { createElement, h } from '../Component.js';
import { store } from '../../store/index.js';

/**
 * Gets player name from store
 * @param {string|null} playerId - Player ID
 * @returns {string} Player name or placeholder
 */
function getPlayerName(playerId) {
  if (!playerId) {
    return 'TBD';
  }
  
  const state = store.getState();
  const player = state.players.find(p => p.id === playerId);
  return player?.name || 'Unknown';
}

/**
 * Gets status class for the match
 * @param {string} status - Match status
 * @returns {string} CSS class
 */
function getStatusClass(status) {
  switch (status) {
    case 'completed':
      return 'bracket-match--completed';
    case 'in_progress':
      return 'bracket-match--in-progress';
    case 'ready':
      return 'bracket-match--ready';
    default:
      return 'bracket-match--pending';
  }
}

/**
 * Renders a single bracket match box
 * @param {Object} options - Options
 * @param {Object} options.match - Bracket match data
 * @param {Function} [options.onMatchClick] - Click handler
 * @param {boolean} [options.showScores] - Whether to show scores
 * @param {Object} [options.matchScores] - Match scores {player1Frames, player2Frames}
 * @returns {HTMLElement} Match element
 */
export function renderBracketMatch(options = {}) {
  const { match, onMatchClick, showScores = false, matchScores } = options;
  
  const isClickable = match.status === 'ready' || match.status === 'in_progress';
  
  const player1Name = getPlayerName(match.player1Id);
  const player2Name = getPlayerName(match.player2Id);
  
  const isPlayer1Winner = match.winnerId === match.player1Id;
  const isPlayer2Winner = match.winnerId === match.player2Id;
  
  const handleClick = () => {
    if (isClickable && onMatchClick) {
      onMatchClick(match);
    }
  };
  
  const player1Class = [
    'bracket-match__player',
    isPlayer1Winner ? 'bracket-match__player--winner' : '',
    match.winnerId && !isPlayer1Winner ? 'bracket-match__player--loser' : '',
    !match.player1Id ? 'bracket-match__player--tbd' : '',
  ].filter(Boolean).join(' ');
  
  const player2Class = [
    'bracket-match__player',
    isPlayer2Winner ? 'bracket-match__player--winner' : '',
    match.winnerId && !isPlayer2Winner ? 'bracket-match__player--loser' : '',
    !match.player2Id ? 'bracket-match__player--tbd' : '',
  ].filter(Boolean).join(' ');
  
  return createElement(
    'div',
    {
      className: `bracket-match ${getStatusClass(match.status)} ${isClickable ? 'bracket-match--clickable' : ''}`,
      'data-match-id': match.id,
      onclick: handleClick,
    },
    // Player 1 row
    createElement(
      'div',
      { className: player1Class },
      h.span({ className: 'bracket-match__name' }, player1Name),
      showScores && matchScores ? h.span({ className: 'bracket-match__score' }, String(matchScores.player1Frames)) : null
    ),
    // Player 2 row
    createElement(
      'div',
      { className: player2Class },
      h.span({ className: 'bracket-match__name' }, player2Name),
      showScores && matchScores ? h.span({ className: 'bracket-match__score' }, String(matchScores.player2Frames)) : null
    ),
    // Match info (optional)
    match.status !== 'pending' && match.status !== 'completed' ? 
      h.div(
        { className: 'bracket-match__info' },
        match.status === 'in_progress' ? 'In Progress' : 'Ready'
      ) : null
  );
}

/**
 * Creates a compact bracket match for smaller displays
 * @param {Object} options - Options
 * @param {Object} options.match - Bracket match data
 * @param {Function} [options.onMatchClick] - Click handler
 * @returns {HTMLElement} Compact match element
 */
export function renderCompactBracketMatch(options = {}) {
  const { match, onMatchClick } = options;
  
  const player1Name = getPlayerName(match.player1Id);
  const player2Name = getPlayerName(match.player2Id);
  
  const isClickable = match.status === 'ready' || match.status === 'in_progress';
  
  const handleClick = () => {
    if (isClickable && onMatchClick) {
      onMatchClick(match);
    }
  };
  
  return createElement(
    'div',
    {
      className: `bracket-match bracket-match--compact ${getStatusClass(match.status)}`,
      onclick: isClickable ? handleClick : null,
    },
    h.span({ className: 'bracket-match__vs' }, `${player1Name} vs ${player2Name}`)
  );
}

/**
 * Renders an empty match slot (for bye or future match)
 * @param {Object} options - Options
 * @param {number} options.position - Position in round
 * @returns {HTMLElement} Empty slot element
 */
export function renderEmptyMatchSlot(options = {}) {
  const { position } = options;
  
  return createElement(
    'div',
    {
      className: 'bracket-match bracket-match--empty',
      'data-position': position,
    },
    h.div({ className: 'bracket-match__player bracket-match__player--tbd' }, h.span({}, 'BYE')),
    h.div({ className: 'bracket-match__player bracket-match__player--tbd' }, h.span({}, 'BYE'))
  );
}

export default {
  renderBracketMatch,
  renderCompactBracketMatch,
  renderEmptyMatchSlot,
};
