/**
 * Frame Score Entry Component
 * Allows entering winner for each frame in a match
 */

import { render, createElement, h } from '../Component.js';

/**
 * @typedef {Object} FrameScoreEntryConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../models/Match.js').MatchData} match - Match data
 * @property {string} player1Name - Player 1 display name
 * @property {string} player2Name - Player 2 display name
 * @property {(playerId: string) => void} onFrameWinnerSelect - Callback when frame winner is selected
 * @property {boolean} [disabled=false] - Whether input is disabled
 */

/**
 * Renders the frame score entry component
 * @param {FrameScoreEntryConfig} config - Component configuration
 */
export function renderFrameScoreEntry({ container, match, player1Name, player2Name, onFrameWinnerSelect, disabled = false }) {
  const currentFrameNumber = match.frames.length + 1;
  const framesNeeded = Math.ceil(match.bestOf / 2);

  // Count current scores
  const player1Wins = match.frames.filter((f) => f.winnerId === match.player1Id).length;
  const player2Wins = match.frames.filter((f) => f.winnerId === match.player2Id).length;

  const isMatchComplete = match.winnerId !== null;

  render(
    container,
    createElement(
      'div',
      { className: 'frame-score-entry' },
      // Current score display
      createElement(
        'div',
        { className: 'frame-score-entry__current' },
        createElement(
          'div',
          { className: `frame-score-entry__player ${player1Wins > player2Wins ? 'frame-score-entry__player--leading' : ''}` },
          h.span({ className: 'frame-score-entry__player-name' }, player1Name),
          h.span({ className: 'frame-score-entry__player-score' }, String(player1Wins))
        ),
        h.span({ className: 'frame-score-entry__vs' }, 'vs'),
        createElement(
          'div',
          { className: `frame-score-entry__player ${player2Wins > player1Wins ? 'frame-score-entry__player--leading' : ''}` },
          h.span({ className: 'frame-score-entry__player-score' }, String(player2Wins)),
          h.span({ className: 'frame-score-entry__player-name' }, player2Name)
        )
      ),

      // Match info
      createElement(
        'div',
        { className: 'frame-score-entry__info' },
        h.span({}, `Best of ${match.bestOf} (First to ${framesNeeded})`)
      ),

      // Frame winner buttons (only show if match not complete)
      !isMatchComplete &&
        createElement(
          'div',
          { className: 'frame-score-entry__actions' },
          h.p({ className: 'frame-score-entry__prompt' }, `Frame ${currentFrameNumber} winner:`),
          createElement(
            'div',
            { className: 'frame-score-entry__buttons' },
            h.button(
              {
                className: 'btn btn--primary frame-score-entry__btn',
                disabled: disabled,
                onclick: () => onFrameWinnerSelect(match.player1Id),
              },
              player1Name
            ),
            h.button(
              {
                className: 'btn btn--primary frame-score-entry__btn',
                disabled: disabled,
                onclick: () => onFrameWinnerSelect(match.player2Id),
              },
              player2Name
            )
          )
        ),

      // Match complete message
      isMatchComplete &&
        createElement(
          'div',
          { className: 'frame-score-entry__complete' },
          h.p(
            { className: 'frame-score-entry__winner' },
            `Winner: ${match.winnerId === match.player1Id ? player1Name : player2Name}`
          )
        ),

      // Frame history
      match.frames.length > 0 &&
        createElement(
          'div',
          { className: 'frame-score-entry__history' },
          h.h4({}, 'Frame Results'),
          createElement(
            'ul',
            { className: 'frame-score-entry__frame-list' },
            ...match.frames.map((frame) =>
              h.li(
                { className: 'frame-score-entry__frame-item' },
                `Frame ${frame.frameNumber}: ${frame.winnerId === match.player1Id ? player1Name : player2Name}`
              )
            )
          )
        )
    )
  );
}

/**
 * Creates a compact frame score display (for lists)
 * @param {import('../../models/Match.js').MatchData} match - Match data
 * @param {string} player1Name - Player 1 name
 * @param {string} player2Name - Player 2 name
 * @returns {HTMLElement}
 */
export function createFrameScoreDisplay(match, player1Name, player2Name) {
  const player1Wins = match.frames.filter((f) => f.winnerId === match.player1Id).length;
  const player2Wins = match.frames.filter((f) => f.winnerId === match.player2Id).length;

  return createElement(
    'span',
    { className: 'frame-score-display' },
    h.span({ className: match.winnerId === match.player1Id ? 'frame-score-display--winner' : '' }, player1Name),
    h.span({ className: 'frame-score-display__score' }, ` ${player1Wins}-${player2Wins} `),
    h.span({ className: match.winnerId === match.player2Id ? 'frame-score-display--winner' : '' }, player2Name)
  );
}

export default {
  renderFrameScoreEntry,
  createFrameScoreDisplay,
};
