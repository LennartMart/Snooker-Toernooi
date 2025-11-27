/**
 * Pool Match List Component
 * Displays all matches in a pool with scores
 */

import { render, createElement, h } from '../Component.js';
import { MatchStatus, countFramesWon, getMatchScoreString } from '../../models/Match.js';

/**
 * @typedef {Object} PoolMatchListConfig
 * @property {HTMLElement} container - Container element
 * @property {string} poolId - Pool ID
 * @property {string} poolName - Pool name
 * @property {import('../../models/Match.js').MatchData[]} matches - Pool matches
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup
 * @property {(matchId: string) => void} [onMatchClick] - Callback when match clicked
 * @property {boolean} [groupByRound=true] - Group matches by round
 * @property {boolean} [showActions=true] - Show action buttons
 */

/**
 * Renders the pool match list
 * @param {PoolMatchListConfig} config - Configuration
 */
export function renderPoolMatchList({
  container,
  poolId: _poolId,
  poolName,
  matches,
  playerMap,
  onMatchClick,
  groupByRound = true,
  showActions = true,
}) {
  // Sort matches by round
  const sortedMatches = [...matches].sort((a, b) => a.roundNumber - b.roundNumber);

  // Group by round if enabled
  const groupedMatches = groupByRound ? groupMatchesByRound(sortedMatches) : { 0: sortedMatches };

  // Calculate progress
  const completedCount = matches.filter((m) => m.status === MatchStatus.COMPLETE).length;
  const totalCount = matches.length;

  render(
    container,
    createElement(
      'div',
      { className: 'pool-match-list' },
      // Header
      createElement(
        'div',
        { className: 'pool-match-list__header' },
        h.h3({ className: 'pool-match-list__title' }, `Pool ${poolName} Matches`),
        createElement(
          'div',
          { className: 'pool-match-list__progress' },
          h.span(
            { className: 'pool-match-list__progress-text' },
            `${completedCount}/${totalCount} complete`
          ),
          createElement(
            'div',
            { className: 'pool-match-list__progress-bar' },
            h.div({
              className: 'pool-match-list__progress-fill',
              style: `width: ${(completedCount / totalCount) * 100}%`,
            })
          )
        )
      ),

      // Match groups
      createElement(
        'div',
        { className: 'pool-match-list__content' },
        ...Object.entries(groupedMatches).map(([round, roundMatches]) =>
          createElement(
            'div',
            { className: 'pool-match-list__round' },
            groupByRound && h.h4({ className: 'pool-match-list__round-title' }, `Round ${parseInt(round) + 1}`),
            createElement(
              'ul',
              { className: 'pool-match-list__matches' },
              ...roundMatches.map((match) => createMatchListItem(match, playerMap, onMatchClick, showActions))
            )
          )
        )
      )
    )
  );
}

/**
 * Groups matches by round number
 * @param {import('../../models/Match.js').MatchData[]} matches - Matches to group
 * @returns {Object.<number, import('../../models/Match.js').MatchData[]>}
 */
function groupMatchesByRound(matches) {
  const groups = {};

  for (const match of matches) {
    const round = match.roundNumber - 1; // Convert to 0-indexed for grouping
    if (!groups[round]) {
      groups[round] = [];
    }
    groups[round].push(match);
  }

  return groups;
}

/**
 * Creates a match list item
 * @param {import('../../models/Match.js').MatchData} match - Match data
 * @param {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup
 * @param {(matchId: string) => void} [onMatchClick] - Click handler
 * @param {boolean} showActions - Whether to show actions
 * @returns {HTMLElement}
 */
function createMatchListItem(match, playerMap, onMatchClick, showActions) {
  const player1 = playerMap[match.player1Id];
  const player2 = playerMap[match.player2Id];
  const player1Name = player1?.name || 'TBD';
  const player2Name = player2?.name || 'TBD';

  const { player1: p1Frames, player2: p2Frames } = countFramesWon(match);
  const isComplete = match.status === MatchStatus.COMPLETE;
  const isInProgress = match.status === MatchStatus.IN_PROGRESS;
  const isBye = match.isByeMatch;

  let statusClass = 'pool-match-list__match';
  if (isComplete) {
    statusClass += ' pool-match-list__match--complete';
  }
  if (isInProgress) {
    statusClass += ' pool-match-list__match--in-progress';
  }
  if (isBye) {
    statusClass += ' pool-match-list__match--bye';
  }

  return createElement(
    'li',
    { className: statusClass },
    // Players and score
    createElement(
      'div',
      { className: 'pool-match-list__match-content' },
      createElement(
        'div',
        { className: `pool-match-list__player ${match.winnerId === match.player1Id ? 'pool-match-list__player--winner' : ''}` },
        h.span({ className: 'pool-match-list__player-name' }, player1Name),
        player1?.isBye && h.span({ className: 'pool-match-list__bye-badge' }, 'BYE')
      ),
      createElement(
        'div',
        { className: 'pool-match-list__score' },
        isComplete || isInProgress
          ? h.span({ className: 'pool-match-list__score-value' }, `${p1Frames}-${p2Frames}`)
          : h.span({ className: 'pool-match-list__score-pending' }, 'vs')
      ),
      createElement(
        'div',
        { className: `pool-match-list__player ${match.winnerId === match.player2Id ? 'pool-match-list__player--winner' : ''}` },
        h.span({ className: 'pool-match-list__player-name' }, player2Name),
        player2?.isBye && h.span({ className: 'pool-match-list__bye-badge' }, 'BYE')
      )
    ),

    // Status and actions
    createElement(
      'div',
      { className: 'pool-match-list__match-meta' },
      createElement(
        'span',
        { className: `pool-match-list__status pool-match-list__status--${match.status}` },
        formatStatus(match.status)
      ),
      showActions &&
        !isBye &&
        !isComplete &&
        onMatchClick &&
        h.button(
          {
            className: 'btn btn--sm btn--secondary pool-match-list__action',
            onclick: (e) => {
              e.stopPropagation();
              onMatchClick(match.id);
            },
          },
          isInProgress ? 'Continue' : 'Enter Score'
        )
    )
  );
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
 * Creates a compact match result display
 * @param {import('../../models/Match.js').MatchData} match - Match
 * @param {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup
 * @returns {HTMLElement}
 */
export function createCompactMatchResult(match, playerMap) {
  const player1 = playerMap[match.player1Id];
  const player2 = playerMap[match.player2Id];
  const score = getMatchScoreString(match);

  return createElement(
    'span',
    { className: 'compact-match-result' },
    h.span(
      { className: match.winnerId === match.player1Id ? 'compact-match-result__winner' : '' },
      player1?.name || 'TBD'
    ),
    h.span({ className: 'compact-match-result__score' }, ` ${score} `),
    h.span(
      { className: match.winnerId === match.player2Id ? 'compact-match-result__winner' : '' },
      player2?.name || 'TBD'
    )
  );
}

/**
 * Gets match count by status
 * @param {import('../../models/Match.js').MatchData[]} matches - Matches
 * @returns {{ pending: number, inProgress: number, complete: number }}
 */
export function getMatchStatusCounts(matches) {
  return {
    pending: matches.filter((m) => m.status === MatchStatus.PENDING).length,
    inProgress: matches.filter((m) => m.status === MatchStatus.IN_PROGRESS).length,
    complete: matches.filter((m) => m.status === MatchStatus.COMPLETE).length,
  };
}

export default {
  renderPoolMatchList,
  createCompactMatchResult,
  getMatchStatusCounts,
};
