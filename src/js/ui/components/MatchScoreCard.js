/**
 * Match Score Card Component
 * Displays a match and allows score entry
 */

import { render, createElement, h } from '../Component.js';
import { renderFrameScoreEntry } from './FrameScoreEntry.js';
import { renderBreakEntry } from './BreakEntry.js';
import { MatchStatus, countFramesWon } from '../../models/Match.js';

/**
 * @typedef {Object} MatchScoreCardConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../models/Match.js').MatchData} match - Match data
 * @property {import('../../models/Player.js').PlayerData} player1 - Player 1 data
 * @property {import('../../models/Player.js').PlayerData} player2 - Player 2 data
 * @property {import('../../models/Break.js').BreakData[]} breaks - Breaks for this match
 * @property {number} [breakThreshold=20] - Minimum break value
 * @property {(matchId: string, winnerId: string) => Promise<void>} onFrameWinner - Callback when frame winner selected
 * @property {(matchId: string, playerId: string, value: number) => Promise<void>} onBreakRecord - Callback when break recorded
 * @property {boolean} [compact=false] - Show compact version
 */

/**
 * Renders the match score card
 * @param {MatchScoreCardConfig} config - Configuration
 */
export function renderMatchScoreCard({
  container,
  match,
  player1,
  player2,
  breaks = [],
  breakThreshold = 20,
  onFrameWinner,
  onBreakRecord,
  compact = false,
}) {
  const isComplete = match.status === MatchStatus.COMPLETE;
  const isBye = match.isByeMatch;

  if (compact) {
    renderCompactCard({ container, match, player1, player2, isComplete });
    return;
  }

  const player1Name = player1?.name || 'Unknown';
  const player2Name = player2?.name || 'Unknown';

  const { player1: p1Frames, player2: p2Frames } = countFramesWon(match);

  const handleFrameWinner = async (winnerId) => {
    if (onFrameWinner) {
      await onFrameWinner(match.id, winnerId);
    }
  };

  const handleBreakRecord = async (playerId, value) => {
    if (onBreakRecord) {
      await onBreakRecord(match.id, playerId, value);
    }
  };

  render(
    container,
    createElement(
      'div',
      { className: `match-score-card ${isComplete ? 'match-score-card--complete' : ''} ${isBye ? 'match-score-card--bye' : ''}` },
      // Header
      createElement(
        'div',
        { className: 'match-score-card__header' },
        h.span({ className: 'match-score-card__stage' }, formatStage(match.stage)),
        match.roundNumber > 0 && h.span({ className: 'match-score-card__round' }, `Round ${match.roundNumber}`),
        h.span(
          { className: `match-score-card__status match-score-card__status--${match.status}` },
          formatStatus(match.status)
        )
      ),

      // Players and score
      createElement(
        'div',
        { className: 'match-score-card__players' },
        createElement(
          'div',
          {
            className: `match-score-card__player match-score-card__player--left ${
              match.winnerId === player1.id ? 'match-score-card__player--winner' : ''
            }`,
          },
          h.span({ className: 'match-score-card__player-name' }, player1Name),
          player1?.isBye && h.span({ className: 'match-score-card__bye-badge' }, 'BYE')
        ),
        createElement(
          'div',
          { className: 'match-score-card__score' },
          h.span({ className: 'match-score-card__frames' }, `${p1Frames} - ${p2Frames}`),
          h.span({ className: 'match-score-card__best-of' }, `Best of ${match.bestOf}`)
        ),
        createElement(
          'div',
          {
            className: `match-score-card__player match-score-card__player--right ${
              match.winnerId === player2.id ? 'match-score-card__player--winner' : ''
            }`,
          },
          h.span({ className: 'match-score-card__player-name' }, player2Name),
          player2?.isBye && h.span({ className: 'match-score-card__bye-badge' }, 'BYE')
        )
      ),

      // Frame entry section (only if not complete and not bye)
      !isComplete &&
        !isBye &&
        createElement('div', { className: 'match-score-card__frame-entry', id: `frame-entry-${match.id}` }),

      // Break entry section (only if not complete and not bye)
      !isComplete &&
        !isBye &&
        createElement('div', { className: 'match-score-card__break-entry', id: `break-entry-${match.id}` }),

      // Match breaks display
      breaks.length > 0 &&
        createElement(
          'div',
          { className: 'match-score-card__breaks' },
          h.h5({}, 'Breaks'),
          createElement(
            'div',
            { className: 'match-score-card__breaks-list' },
            ...breaks
              .sort((a, b) => b.value - a.value)
              .map((b) =>
                h.span(
                  { className: `match-score-card__break ${b.value >= 100 ? 'match-score-card__break--century' : ''}` },
                  `${b.value} (${b.playerId === player1.id ? player1Name : player2Name})`
                )
              )
          )
        )
    )
  );

  // Render sub-components after main render
  if (!isComplete && !isBye) {
    const frameEntryContainer = document.getElementById(`frame-entry-${match.id}`);
    if (frameEntryContainer) {
      renderFrameScoreEntry({
        container: frameEntryContainer,
        match,
        player1Name,
        player2Name,
        onFrameWinnerSelect: handleFrameWinner,
      });
    }

    const breakEntryContainer = document.getElementById(`break-entry-${match.id}`);
    if (breakEntryContainer) {
      renderBreakEntry({
        container: breakEntryContainer,
        match,
        player1Name,
        player2Name,
        breaks,
        onBreakRecord: handleBreakRecord,
        threshold: breakThreshold,
      });
    }
  }
}

/**
 * Renders a compact match card
 * @param {Object} config - Configuration
 */
function renderCompactCard({ container, match, player1, player2, isComplete }) {
  const player1Name = player1?.name || 'Unknown';
  const player2Name = player2?.name || 'Unknown';
  const { player1: p1Frames, player2: p2Frames } = countFramesWon(match);

  render(
    container,
    createElement(
      'div',
      { className: `match-score-card match-score-card--compact ${isComplete ? 'match-score-card--complete' : ''}` },
      createElement(
        'div',
        { className: 'match-score-card__compact-content' },
        h.span(
          { className: match.winnerId === player1.id ? 'match-score-card__winner' : '' },
          player1Name
        ),
        h.span({ className: 'match-score-card__compact-score' }, `${p1Frames}-${p2Frames}`),
        h.span(
          { className: match.winnerId === player2.id ? 'match-score-card__winner' : '' },
          player2Name
        )
      )
    )
  );
}

/**
 * Formats match stage for display
 * @param {string} stage - Match stage
 * @returns {string}
 */
function formatStage(stage) {
  const stages = {
    pool: 'Pool Stage',
    'winner-bracket': 'Winner Bracket',
    'consolation-bracket': 'Consolation Bracket',
  };
  return stages[stage] || stage;
}

/**
 * Formats match status for display
 * @param {string} status - Match status
 * @returns {string}
 */
function formatStatus(status) {
  const statuses = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    complete: 'Complete',
  };
  return statuses[status] || status;
}

/**
 * Creates a match list item
 * @param {import('../../models/Match.js').MatchData} match - Match
 * @param {import('../../models/Player.js').PlayerData} player1 - Player 1
 * @param {import('../../models/Player.js').PlayerData} player2 - Player 2
 * @param {() => void} onClick - Click handler
 * @returns {HTMLElement}
 */
export function createMatchListItem(match, player1, player2, onClick) {
  const { player1: p1Frames, player2: p2Frames } = countFramesWon(match);
  const isComplete = match.status === MatchStatus.COMPLETE;

  return createElement(
    'li',
    {
      className: `match-list-item ${isComplete ? 'match-list-item--complete' : ''}`,
      onclick: onClick,
    },
    h.span(
      { className: `match-list-item__player ${match.winnerId === player1?.id ? 'match-list-item__player--winner' : ''}` },
      player1?.name || 'TBD'
    ),
    h.span({ className: 'match-list-item__score' }, `${p1Frames}-${p2Frames}`),
    h.span(
      { className: `match-list-item__player ${match.winnerId === player2?.id ? 'match-list-item__player--winner' : ''}` },
      player2?.name || 'TBD'
    )
  );
}

export default {
  renderMatchScoreCard,
  createMatchListItem,
};
