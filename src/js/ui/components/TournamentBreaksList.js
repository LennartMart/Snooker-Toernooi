/**
 * Tournament Breaks List Component
 * Displays all high breaks above threshold, sorted by value
 */

import { render, createElement, h, mapToElements } from '../Component.js';
import { formatDate } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} TournamentBreaksListConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../models/Break.js').BreakData[]} breaks - Tournament breaks
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup map
 * @property {number} [threshold=20] - Minimum break value to display
 * @property {(breakData: import('../../models/Break.js').BreakData) => void} [onBreakClick] - Callback when break clicked
 * @property {boolean} [showMatchInfo=false] - Show match/frame information
 * @property {string} [title='High Breaks'] - List title
 * @property {number} [limit] - Maximum number of breaks to show
 */

/**
 * Gets CSS class for break value
 * @param {number} value - Break value
 * @returns {string} CSS class
 */
function getBreakValueClass(value) {
  if (value >= 147) {
    return 'breaks-list__value--maximum';
  }
  if (value >= 100) {
    return 'breaks-list__value--century';
  }
  if (value >= 50) {
    return 'breaks-list__value--fifty';
  }
  return '';
}

/**
 * Gets break badge label
 * @param {number} value - Break value
 * @returns {string|null} Badge label or null
 */
function getBreakBadge(value) {
  if (value === 147) {
    return 'Maximum!';
  }
  if (value >= 100) {
    return 'Century';
  }
  return null;
}

/**
 * Renders the tournament breaks list
 * @param {TournamentBreaksListConfig} config - Configuration
 */
export function renderTournamentBreaksList({
  container,
  breaks,
  playerMap,
  threshold = 20,
  onBreakClick,
  showMatchInfo = false,
  title = 'High Breaks',
  limit,
}) {
  // Filter and sort breaks
  let filteredBreaks = breaks.filter((b) => b.value >= threshold);
  filteredBreaks = filteredBreaks.sort((a, b) => b.value - a.value);
  
  if (limit && limit > 0) {
    filteredBreaks = filteredBreaks.slice(0, limit);
  }
  
  // Calculate stats
  const totalBreaks = filteredBreaks.length;
  const centuries = filteredBreaks.filter((b) => b.value >= 100).length;
  const highestBreak = filteredBreaks[0]?.value || 0;
  
  render(
    container,
    createElement(
      'div',
      { className: 'breaks-list' },
      
      // Header
      h.div(
        { className: 'breaks-list__header' },
        h.h2({ className: 'breaks-list__title' }, title),
        h.div(
          { className: 'breaks-list__stats' },
          h.span({ className: 'breaks-list__stat' }, `${totalBreaks} breaks`),
          centuries > 0 && h.span(
            { className: 'breaks-list__stat breaks-list__stat--centuries' },
            `${centuries} centuries`
          ),
          highestBreak > 0 && h.span(
            { className: 'breaks-list__stat breaks-list__stat--highest' },
            `Highest: ${highestBreak}`
          )
        )
      ),
      
      // Breaks list
      filteredBreaks.length > 0
        ? createElement(
            'div',
            { className: 'breaks-list__content' },
            ...mapToElements(filteredBreaks, (breakData, index) => {
              const player = playerMap[breakData.playerId];
              const playerName = player?.name || 'Unknown';
              const valueClass = `breaks-list__value ${getBreakValueClass(breakData.value)}`;
              const badge = getBreakBadge(breakData.value);
              
              return createElement(
                'div',
                {
                  className: 'breaks-list__item',
                  onclick: onBreakClick ? () => onBreakClick(breakData) : undefined,
                  tabindex: onBreakClick ? '0' : undefined,
                  role: onBreakClick ? 'button' : undefined,
                },
                h.span({ className: 'breaks-list__rank' }, `#${index + 1}`),
                h.span({ className: valueClass }, String(breakData.value)),
                h.span({ className: 'breaks-list__player' }, playerName),
                badge && h.span({ className: 'breaks-list__badge' }, badge),
                showMatchInfo && breakData.frameNumber && h.span(
                  { className: 'breaks-list__match-info' },
                  `Frame ${breakData.frameNumber}`
                ),
                breakData.createdAt && h.span(
                  { className: 'breaks-list__date' },
                  formatDate(breakData.createdAt)
                )
              );
            })
          )
        : h.div(
            { className: 'breaks-list__empty' },
            h.p({}, `No breaks above ${threshold} recorded yet.`)
          ),
      
      // Show more link if limited
      limit && breaks.filter((b) => b.value >= threshold).length > limit &&
        h.div(
          { className: 'breaks-list__footer' },
          h.button(
            { className: 'btn btn--link', type: 'button' },
            `View all ${breaks.filter((b) => b.value >= threshold).length} breaks`
          )
        )
    )
  );
}

/**
 * Creates a compact breaks summary (for sidebar/preview)
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container element
 * @param {import('../../models/Break.js').BreakData[]} config.breaks - Breaks
 * @param {Object} config.playerMap - Player lookup
 * @param {number} [config.limit=3] - Max items to show
 */
export function renderCompactBreaks({ container, breaks, playerMap, limit = 3 }) {
  const sortedBreaks = [...breaks].sort((a, b) => b.value - a.value).slice(0, limit);
  
  render(
    container,
    createElement(
      'div',
      { className: 'breaks-compact' },
      h.h4({ className: 'breaks-compact__title' }, 'Top Breaks'),
      sortedBreaks.length > 0
        ? createElement(
            'ul',
            { className: 'breaks-compact__list' },
            ...mapToElements(sortedBreaks, (breakData) => {
              const player = playerMap[breakData.playerId];
              return h.li(
                { className: 'breaks-compact__item' },
                h.span({ className: 'breaks-compact__value' }, String(breakData.value)),
                h.span({ className: 'breaks-compact__player' }, player?.name || 'Unknown')
              );
            })
          )
        : h.p({ className: 'breaks-compact__empty' }, 'No high breaks yet')
    )
  );
}

/**
 * Creates a break item element for use in other components
 * @param {import('../../models/Break.js').BreakData} breakData - Break data
 * @param {import('../../models/Player.js').PlayerData} player - Player data
 * @param {Object} [options] - Options
 * @returns {HTMLElement}
 */
export function createBreakItem(breakData, player, options = {}) {
  const { showBadge = true, onClick } = options;
  const badge = showBadge ? getBreakBadge(breakData.value) : null;
  
  return createElement(
    'div',
    {
      className: `break-item ${getBreakValueClass(breakData.value)}`,
      onclick: onClick,
      tabindex: onClick ? '0' : undefined,
    },
    h.span({ className: 'break-item__value' }, String(breakData.value)),
    h.span({ className: 'break-item__player' }, player?.name || 'Unknown'),
    badge && h.span({ className: 'break-item__badge' }, badge)
  );
}

/**
 * Gets break statistics display
 * @param {import('../../models/Break.js').BreakData[]} breaks - All breaks
 * @returns {Object} Stats object
 */
export function getBreakStatistics(breaks) {
  if (!breaks || breaks.length === 0) {
    return {
      total: 0,
      centuries: 0,
      fifties: 0,
      highest: 0,
      average: 0,
    };
  }
  
  const total = breaks.length;
  const centuries = breaks.filter((b) => b.value >= 100).length;
  const fifties = breaks.filter((b) => b.value >= 50 && b.value < 100).length;
  const highest = Math.max(...breaks.map((b) => b.value));
  const average = Math.round(breaks.reduce((sum, b) => sum + b.value, 0) / total);
  
  return { total, centuries, fifties, highest, average };
}

export default {
  renderTournamentBreaksList,
  renderCompactBreaks,
  createBreakItem,
  getBreakStatistics,
};
