/**
 * Rankings Table Component
 * Displays final tournament rankings with position, player, points breakdown
 */

import { render, createElement, h, mapToElements } from '../Component.js';
import { getPositionLabel } from '../../services/RankingService.js';

/**
 * @typedef {Object} RankingsTableConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../models/Ranking.js').RankingData[]} rankings - Tournament rankings
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup map
 * @property {(playerId: string) => void} [onPlayerClick] - Callback when player clicked
 * @property {boolean} [showPointsBreakdown=true] - Show position/participation breakdown
 * @property {boolean} [highlightTop3=true] - Highlight top 3 positions
 * @property {string} [title='Final Rankings'] - Table title
 */

/**
 * Gets CSS class for position highlighting
 * @param {number} position - Position number
 * @param {boolean} highlightTop3 - Whether to highlight
 * @returns {string} CSS class
 */
function getPositionClass(position, highlightTop3) {
  if (!highlightTop3) {
    return '';
  }
  
  switch (position) {
    case 1:
      return 'rankings-table__row--gold';
    case 2:
      return 'rankings-table__row--silver';
    case 3:
      return 'rankings-table__row--bronze';
    default:
      return '';
  }
}

/**
 * Creates a position badge element
 * @param {number} position - Position number
 * @returns {HTMLElement}
 */
function createPositionBadge(position) {
  const label = getPositionLabel(position);
  let badgeClass = 'rankings-table__position';
  
  if (position === 1) {
    badgeClass += ' rankings-table__position--gold';
  } else if (position === 2) {
    badgeClass += ' rankings-table__position--silver';
  } else if (position === 3) {
    badgeClass += ' rankings-table__position--bronze';
  }
  
  return h.span({ className: badgeClass }, label);
}

/**
 * Renders the rankings table
 * @param {RankingsTableConfig} config - Configuration
 */
export function renderRankingsTable({
  container,
  rankings,
  playerMap,
  onPlayerClick,
  showPointsBreakdown = true,
  highlightTop3 = true,
  title = 'Final Rankings',
}) {
  // Sort rankings by position
  const sortedRankings = [...rankings].sort((a, b) => a.position - b.position);
  
  render(
    container,
    createElement(
      'div',
      { className: 'rankings-table' },
      
      // Header
      h.div(
        { className: 'rankings-table__header' },
        h.h2({ className: 'rankings-table__title' }, title),
        h.span(
          { className: 'rankings-table__count' },
          `${sortedRankings.length} players`
        )
      ),
      
      // Table
      createElement(
        'table',
        { className: 'rankings-table__table' },
        createElement(
          'thead',
          {},
          createElement(
            'tr',
            {},
            h.th({ className: 'rankings-table__col-pos' }, 'Pos'),
            h.th({ className: 'rankings-table__col-player' }, 'Player'),
            showPointsBreakdown && h.th({ className: 'rankings-table__col-pos-pts' }, 'Pos Pts'),
            showPointsBreakdown && h.th({ className: 'rankings-table__col-part-pts' }, 'Part Pts'),
            h.th({ className: 'rankings-table__col-total' }, 'Total')
          )
        ),
        createElement(
          'tbody',
          {},
          ...mapToElements(sortedRankings, (ranking) => {
            const player = playerMap[ranking.playerId];
            const playerName = player?.name || 'Unknown';
            const rowClass = `rankings-table__row ${getPositionClass(ranking.position, highlightTop3)}`;
            
            return createElement(
              'tr',
              {
                className: rowClass,
                onclick: onPlayerClick ? () => onPlayerClick(ranking.playerId) : undefined,
                tabindex: onPlayerClick ? '0' : undefined,
                role: onPlayerClick ? 'button' : undefined,
                'aria-label': onPlayerClick ? `View ${playerName}'s details` : undefined,
              },
              h.td(
                { className: 'rankings-table__cell rankings-table__cell--pos' },
                createPositionBadge(ranking.position)
              ),
              h.td(
                { className: 'rankings-table__cell rankings-table__cell--player' },
                playerName
              ),
              showPointsBreakdown && h.td(
                { className: 'rankings-table__cell rankings-table__cell--number' },
                String(ranking.positionPoints)
              ),
              showPointsBreakdown && h.td(
                { className: 'rankings-table__cell rankings-table__cell--number' },
                String(ranking.participationPoints)
              ),
              h.td(
                { className: 'rankings-table__cell rankings-table__cell--total' },
                h.strong({}, String(ranking.totalPoints))
              )
            );
          })
        )
      ),
      
      // Footer with totals summary
      h.div(
        { className: 'rankings-table__footer' },
        h.span(
          { className: 'rankings-table__summary' },
          sortedRankings.length > 0
            ? `Champion: ${playerMap[sortedRankings[0]?.playerId]?.name || 'TBD'}`
            : 'No rankings available'
        )
      )
    )
  );
}

/**
 * Creates a compact rankings list (for sidebar/preview)
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container element
 * @param {import('../../models/Ranking.js').RankingData[]} config.rankings - Rankings
 * @param {Object} config.playerMap - Player lookup
 * @param {number} [config.limit=5] - Max items to show
 */
export function renderCompactRankings({ container, rankings, playerMap, limit = 5 }) {
  const topRankings = [...rankings]
    .sort((a, b) => a.position - b.position)
    .slice(0, limit);
  
  render(
    container,
    createElement(
      'div',
      { className: 'rankings-compact' },
      h.h4({ className: 'rankings-compact__title' }, 'Top Finishers'),
      createElement(
        'ol',
        { className: 'rankings-compact__list' },
        ...mapToElements(topRankings, (ranking) => {
          const player = playerMap[ranking.playerId];
          return h.li(
            { className: 'rankings-compact__item' },
            h.span({ className: 'rankings-compact__name' }, player?.name || 'Unknown'),
            h.span({ className: 'rankings-compact__points' }, `${ranking.totalPoints} pts`)
          );
        })
      )
    )
  );
}

/**
 * Creates a ranking row element for use in other components
 * @param {import('../../models/Ranking.js').RankingData} ranking - Ranking data
 * @param {import('../../models/Player.js').PlayerData} player - Player data
 * @param {Object} [options] - Options
 * @returns {HTMLElement}
 */
export function createRankingRow(ranking, player, options = {}) {
  const { showPoints = true, onClick } = options;
  
  return createElement(
    'div',
    {
      className: 'ranking-row',
      onclick: onClick,
      tabindex: onClick ? '0' : undefined,
    },
    h.span({ className: 'ranking-row__position' }, getPositionLabel(ranking.position)),
    h.span({ className: 'ranking-row__player' }, player?.name || 'Unknown'),
    showPoints && h.span({ className: 'ranking-row__points' }, `${ranking.totalPoints} pts`)
  );
}

export default {
  renderRankingsTable,
  renderCompactRankings,
  createRankingRow,
};
