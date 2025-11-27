/**
 * Break Entry Component
 * Allows recording high breaks during a match
 */

import { render, createElement, h } from '../Component.js';
import { DEFAULT_BREAK_THRESHOLD } from '../../models/Break.js';

/**
 * @typedef {Object} BreakEntryConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../models/Match.js').MatchData} match - Match data
 * @property {string} player1Name - Player 1 display name
 * @property {string} player2Name - Player 2 display name
 * @property {import('../../models/Break.js').BreakData[]} breaks - Existing breaks for this match
 * @property {(playerId: string, value: number) => void} onBreakRecord - Callback when break is recorded
 * @property {number} [threshold=20] - Minimum break value
 * @property {boolean} [disabled=false] - Whether input is disabled
 */

/**
 * Renders the break entry component
 * @param {BreakEntryConfig} config - Component configuration
 */
export function renderBreakEntry({
  container,
  match,
  player1Name,
  player2Name,
  breaks = [],
  onBreakRecord,
  threshold = DEFAULT_BREAK_THRESHOLD,
  disabled = false,
}) {
  let selectedPlayerId = match.player1Id;
  let breakValue = '';

  const handlePlayerChange = (e) => {
    selectedPlayerId = e.target.value;
  };

  const handleValueChange = (e) => {
    breakValue = e.target.value;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(breakValue, 10);

    if (isNaN(value) || value < threshold || value > 147) {
      alert(`Break must be between ${threshold} and 147`);
      return;
    }

    onBreakRecord(selectedPlayerId, value);

    // Reset form
    breakValue = '';
    const input = container.querySelector('.break-entry__value-input');
    if (input) {
      input.value = '';
    }
  };

  // Sort breaks by value (highest first)
  const sortedBreaks = [...breaks].sort((a, b) => b.value - a.value);

  render(
    container,
    createElement(
      'div',
      { className: 'break-entry' },
      h.h4({ className: 'break-entry__title' }, 'Record Break'),

      // Break entry form
      createElement(
        'form',
        { className: 'break-entry__form', onsubmit: handleSubmit },
        createElement(
          'div',
          { className: 'break-entry__field' },
          h.label({ className: 'break-entry__label', for: 'break-player' }, 'Player'),
          createElement(
            'select',
            {
              id: 'break-player',
              className: 'break-entry__select',
              onchange: handlePlayerChange,
              disabled: disabled,
            },
            h.option({ value: match.player1Id }, player1Name),
            h.option({ value: match.player2Id }, player2Name)
          )
        ),
        createElement(
          'div',
          { className: 'break-entry__field' },
          h.label({ className: 'break-entry__label', for: 'break-value' }, `Break Value (${threshold}+)`),
          h.input({
            id: 'break-value',
            type: 'number',
            className: 'break-entry__value-input',
            min: threshold,
            max: 147,
            placeholder: `${threshold}-147`,
            oninput: handleValueChange,
            disabled: disabled,
          })
        ),
        h.button(
          {
            type: 'submit',
            className: 'btn btn--secondary break-entry__submit',
            disabled: disabled,
          },
          'Add Break'
        )
      ),

      // Info text
      h.p(
        { className: 'break-entry__info' },
        threshold >= 100 ? 'Century breaks only' : `Minimum ${threshold} points required`
      ),

      // Break list
      sortedBreaks.length > 0 &&
        createElement(
          'div',
          { className: 'break-entry__list' },
          h.h5({}, 'Match Breaks'),
          createElement(
            'ul',
            { className: 'break-entry__breaks' },
            ...sortedBreaks.map((b) =>
              createElement(
                'li',
                { className: `break-entry__break-item ${b.value >= 100 ? 'break-entry__break-item--century' : ''}` },
                h.span({ className: 'break-entry__break-value' }, String(b.value)),
                h.span(
                  { className: 'break-entry__break-player' },
                  b.playerId === match.player1Id ? player1Name : player2Name
                )
              )
            )
          )
        )
    )
  );
}

/**
 * Creates a compact break display for a match
 * @param {import('../../models/Break.js').BreakData[]} breaks - Breaks for the match
 * @param {Object.<string, string>} playerNames - Map of player ID to name
 * @returns {HTMLElement}
 */
export function createBreakDisplay(breaks, playerNames) {
  if (breaks.length === 0) {
    return h.span({ className: 'break-display break-display--empty' }, 'No breaks');
  }

  // Get highest break
  const highest = breaks.reduce((max, b) => (b.value > max.value ? b : max), breaks[0]);

  return createElement(
    'span',
    { className: 'break-display' },
    h.span({ className: highest.value >= 100 ? 'break-display--century' : '' }, `Highest: ${highest.value}`),
    h.span({ className: 'break-display__player' }, ` (${playerNames[highest.playerId] || 'Unknown'})`)
  );
}

/**
 * Creates a break badge
 * @param {number} value - Break value
 * @returns {HTMLElement}
 */
export function createBreakBadge(value) {
  let className = 'break-badge';

  if (value === 147) {
    className += ' break-badge--maximum';
  } else if (value >= 100) {
    className += ' break-badge--century';
  } else if (value >= 50) {
    className += ' break-badge--fifty';
  }

  return h.span({ className }, String(value));
}

export default {
  renderBreakEntry,
  createBreakDisplay,
  createBreakBadge,
};
