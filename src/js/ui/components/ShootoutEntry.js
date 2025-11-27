/**
 * Shootout Entry Component
 * Allows entering shootout winner for tiebreaker resolution
 */

import { render, createElement, h } from '../Component.js';

/**
 * @typedef {Object} ShootoutEntryConfig
 * @property {HTMLElement} container - Container element
 * @property {string} poolId - Pool ID
 * @property {string} poolName - Pool name
 * @property {Array<{player1Id: string, player2Id: string}>} pendingShootouts - Pending shootout pairs
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup
 * @property {(poolId: string, player1Id: string, player2Id: string, winnerId: string, scores?: {p1: number, p2: number}) => void} onShootoutResult - Callback when result entered
 * @property {boolean} [showScores=false] - Whether to allow entering scores
 */

/**
 * Renders the shootout entry component
 * @param {ShootoutEntryConfig} config - Configuration
 */
export function renderShootoutEntry({
  container,
  poolId,
  poolName,
  pendingShootouts,
  playerMap,
  onShootoutResult,
  showScores = false,
}) {
  if (pendingShootouts.length === 0) {
    render(
      container,
      createElement(
        'div',
        { className: 'shootout-entry shootout-entry--empty' },
        h.p({ className: 'shootout-entry__message' }, 'No shootouts required')
      )
    );
    return;
  }

  render(
    container,
    createElement(
      'div',
      { className: 'shootout-entry' },
      h.h3({ className: 'shootout-entry__title' }, `Pool ${poolName} - Shootout Required`),
      h.p(
        { className: 'shootout-entry__description' },
        'A shootout is needed to determine final standings. Select the winner of each shootout.'
      ),

      createElement(
        'div',
        { className: 'shootout-entry__list' },
        ...pendingShootouts.map(({ player1Id, player2Id }, index) => {
          const player1 = playerMap[player1Id];
          const player2 = playerMap[player2Id];
          const player1Name = player1?.name || 'Unknown';
          const player2Name = player2?.name || 'Unknown';

          return createElement(
            'div',
            { className: 'shootout-entry__item', key: `shootout-${index}` },
            createElement(
              'div',
              { className: 'shootout-entry__players' },
              h.span({ className: 'shootout-entry__player' }, player1Name),
              h.span({ className: 'shootout-entry__vs' }, 'vs'),
              h.span({ className: 'shootout-entry__player' }, player2Name)
            ),

            // Score inputs (if enabled)
            showScores &&
              createElement(
                'div',
                { className: 'shootout-entry__scores' },
                createElement(
                  'div',
                  { className: 'shootout-entry__score-input' },
                  h.label({ for: `score-${player1Id}` }, player1Name),
                  h.input({
                    id: `score-${player1Id}`,
                    type: 'number',
                    min: 0,
                    max: 147,
                    className: 'shootout-entry__input',
                    'data-player': player1Id,
                    'data-pair': index,
                  })
                ),
                createElement(
                  'div',
                  { className: 'shootout-entry__score-input' },
                  h.label({ for: `score-${player2Id}` }, player2Name),
                  h.input({
                    id: `score-${player2Id}`,
                    type: 'number',
                    min: 0,
                    max: 147,
                    className: 'shootout-entry__input',
                    'data-player': player2Id,
                    'data-pair': index,
                  })
                )
              ),

            // Winner buttons
            createElement(
              'div',
              { className: 'shootout-entry__actions' },
              h.span({ className: 'shootout-entry__prompt' }, 'Winner:'),
              h.button(
                {
                  className: 'btn btn--primary shootout-entry__btn',
                  onclick: () => handleWinnerSelect(poolId, player1Id, player2Id, player1Id, index, showScores, onShootoutResult),
                },
                player1Name
              ),
              h.button(
                {
                  className: 'btn btn--primary shootout-entry__btn',
                  onclick: () => handleWinnerSelect(poolId, player1Id, player2Id, player2Id, index, showScores, onShootoutResult),
                },
                player2Name
              )
            )
          );
        })
      )
    )
  );
}

/**
 * Handles winner selection
 */
function handleWinnerSelect(poolId, player1Id, player2Id, winnerId, pairIndex, showScores, onShootoutResult) {
  let scores = undefined;

  if (showScores) {
    const p1Input = document.querySelector(`input[data-player="${player1Id}"][data-pair="${pairIndex}"]`);
    const p2Input = document.querySelector(`input[data-player="${player2Id}"][data-pair="${pairIndex}"]`);

    if (p1Input && p2Input) {
      scores = {
        p1: parseInt(p1Input.value, 10) || 0,
        p2: parseInt(p2Input.value, 10) || 0,
      };
    }
  }

  onShootoutResult(poolId, player1Id, player2Id, winnerId, scores);
}

/**
 * Creates a shootout result display
 * @param {import('../../services/ShootoutService.js').ShootoutResult} shootout - Shootout result
 * @param {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup
 * @returns {HTMLElement}
 */
export function createShootoutResultDisplay(shootout, playerMap) {
  const player1 = playerMap[shootout.player1Id];
  const player2 = playerMap[shootout.player2Id];
  const winner = playerMap[shootout.winnerId];

  const player1Name = player1?.name || 'Unknown';
  const player2Name = player2?.name || 'Unknown';
  const winnerName = winner?.name || 'Unknown';

  const hasScores = shootout.player1Score > 0 || shootout.player2Score > 0;

  return createElement(
    'div',
    { className: 'shootout-result' },
    createElement(
      'div',
      { className: 'shootout-result__players' },
      h.span(
        { className: `shootout-result__player ${shootout.winnerId === shootout.player1Id ? 'shootout-result__player--winner' : ''}` },
        player1Name
      ),
      hasScores && h.span({ className: 'shootout-result__score' }, String(shootout.player1Score)),
      h.span({ className: 'shootout-result__vs' }, 'vs'),
      hasScores && h.span({ className: 'shootout-result__score' }, String(shootout.player2Score)),
      h.span(
        { className: `shootout-result__player ${shootout.winnerId === shootout.player2Id ? 'shootout-result__player--winner' : ''}` },
        player2Name
      )
    ),
    h.div({ className: 'shootout-result__winner' }, `Winner: ${winnerName}`)
  );
}

/**
 * Creates a compact shootout indicator
 * @param {boolean} needsShootout - Whether shootout is needed
 * @param {number} [pendingCount] - Number of pending shootouts
 * @returns {HTMLElement}
 */
export function createShootoutIndicator(needsShootout, pendingCount) {
  if (!needsShootout) {
    return h.span({ className: 'shootout-indicator shootout-indicator--none' });
  }

  return h.span(
    { className: 'shootout-indicator shootout-indicator--needed' },
    `⚠ Shootout${pendingCount > 1 ? `s (${pendingCount})` : ''} needed`
  );
}

export default {
  renderShootoutEntry,
  createShootoutResultDisplay,
  createShootoutIndicator,
};
