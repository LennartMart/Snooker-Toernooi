/**
 * SeasonBreaksList Component
 * Displays breaks 25+ across the season with player and tournament info
 */

import { render, createElement, h, mapToElements } from '../Component.js';
import { formatDate } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} SeasonBreaksListConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../services/SeasonBreaksService.js').SeasonBreak[]} breaks - Season breaks
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup map
 * @property {number} [threshold=25] - Minimum break value displayed
 * @property {(breakData: Object) => void} [onBreakClick] - Callback when break clicked
 * @property {string} [title='Season High Breaks'] - List title
 * @property {number} [limit] - Maximum number of breaks to show
 */

/**
 * Gets CSS class for break value
 * @param {number} value - Break value
 * @returns {string} CSS class
 */
function getBreakValueClass(value) {
  if (value >= 147) {
    return 'season-breaks__value--maximum';
  }
  if (value >= 100) {
    return 'season-breaks__value--century';
  }
  if (value >= 50) {
    return 'season-breaks__value--fifty';
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
 * Renders the season breaks list
 * @param {SeasonBreaksListConfig} config - Configuration
 */
export function renderSeasonBreaksList({
  container,
  breaks,
  playerMap,
  threshold = 25,
  onBreakClick,
  title = 'Season High Breaks',
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
      { className: 'season-breaks' },

      // Header
      h.div(
        { className: 'season-breaks__header' },
        h.h2({ className: 'season-breaks__title' }, title),
        h.div(
          { className: 'season-breaks__stats' },
          h.span({ className: 'season-breaks__stat' }, `${totalBreaks} breaks (${threshold}+)`),
          centuries > 0 &&
            h.span({ className: 'season-breaks__stat season-breaks__stat--centuries' }, `${centuries} centuries`),
          highestBreak > 0 &&
            h.span({ className: 'season-breaks__stat season-breaks__stat--highest' }, `Highest: ${highestBreak}`)
        )
      ),

      // Breaks list
      filteredBreaks.length > 0
        ? createElement(
            'div',
            { className: 'season-breaks__content' },
            ...mapToElements(filteredBreaks, (breakData, index) => {
              const player = playerMap[breakData.playerId];
              const playerName = player?.name || 'Unknown';
              const valueClass = `season-breaks__value ${getBreakValueClass(breakData.value)}`;
              const badge = getBreakBadge(breakData.value);

              return createElement(
                'div',
                {
                  className: 'season-breaks__item',
                  onclick: onBreakClick ? () => onBreakClick(breakData) : undefined,
                  tabindex: onBreakClick ? '0' : undefined,
                  role: onBreakClick ? 'button' : undefined,
                },
                h.span({ className: 'season-breaks__rank' }, `#${index + 1}`),
                h.span({ className: valueClass }, String(breakData.value)),
                h.div(
                  { className: 'season-breaks__info' },
                  h.span({ className: 'season-breaks__player' }, playerName),
                  h.span({ className: 'season-breaks__tournament' }, breakData.tournamentName || 'Unknown Tournament')
                ),
                badge && h.span({ className: 'season-breaks__badge' }, badge),
                breakData.createdAt &&
                  h.span({ className: 'season-breaks__date' }, formatDate(breakData.createdAt))
              );
            })
          )
        : h.div(
            { className: 'season-breaks__empty' },
            h.p({}, `No breaks of ${threshold}+ recorded yet this season.`)
          ),

      // Show more link if limited
      limit &&
        breaks.filter((b) => b.value >= threshold).length > limit &&
        h.div(
          { className: 'season-breaks__footer' },
          h.button(
            { className: 'btn btn--link', type: 'button' },
            `View all ${breaks.filter((b) => b.value >= threshold).length} breaks`
          )
        )
    )
  );
}

/**
 * Creates a compact season breaks summary (for sidebar/preview)
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container element
 * @param {import('../../services/SeasonBreaksService.js').SeasonBreak[]} config.breaks - Breaks
 * @param {Object} config.playerMap - Player lookup
 * @param {number} [config.limit=5] - Max items to show
 */
export function renderCompactSeasonBreaks({ container, breaks, playerMap, limit = 5 }) {
  const sortedBreaks = [...breaks].sort((a, b) => b.value - a.value).slice(0, limit);

  render(
    container,
    createElement(
      'div',
      { className: 'season-breaks-compact' },
      h.h4({ className: 'season-breaks-compact__title' }, 'Top Season Breaks'),
      sortedBreaks.length > 0
        ? createElement(
            'ul',
            { className: 'season-breaks-compact__list' },
            ...mapToElements(sortedBreaks, (breakData) => {
              const player = playerMap[breakData.playerId];
              return h.li(
                { className: 'season-breaks-compact__item' },
                h.span({ className: 'season-breaks-compact__value' }, String(breakData.value)),
                h.span({ className: 'season-breaks-compact__player' }, player?.name || 'Unknown'),
                h.span({ className: 'season-breaks-compact__tournament' }, breakData.tournamentName || '')
              );
            })
          )
        : h.p({ className: 'season-breaks-compact__empty' }, 'No high breaks yet')
    )
  );
}

/**
 * Renders break leaders table (most breaks above threshold)
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container
 * @param {Array<{playerId: string, count: number}>} config.leaders - Break leaders
 * @param {Object} config.playerMap - Player lookup
 * @param {string} [config.title='Break Leaders'] - Title
 */
export function renderBreakLeaders({ container, leaders, playerMap, title = 'Break Leaders' }) {
  render(
    container,
    createElement(
      'div',
      { className: 'break-leaders' },
      h.h3({ className: 'break-leaders__title' }, title),
      leaders.length > 0
        ? createElement(
            'table',
            { className: 'break-leaders__table' },
            createElement(
              'thead',
              {},
              createElement(
                'tr',
                {},
                h.th({}, '#'),
                h.th({}, 'Player'),
                h.th({}, 'Breaks')
              )
            ),
            createElement(
              'tbody',
              {},
              ...mapToElements(leaders, (leader, index) => {
                const player = playerMap[leader.playerId];
                return createElement(
                  'tr',
                  {},
                  h.td({}, String(index + 1)),
                  h.td({}, player?.name || 'Unknown'),
                  h.td({}, String(leader.count))
                );
              })
            )
          )
        : h.p({ className: 'break-leaders__empty' }, 'No break leaders yet')
    )
  );
}

/**
 * Renders century makers list
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container
 * @param {Array<{playerId: string, centuries: number, highest: number}>} config.centuryMakers - Century makers
 * @param {Object} config.playerMap - Player lookup
 */
export function renderCenturyMakers({ container, centuryMakers, playerMap }) {
  render(
    container,
    createElement(
      'div',
      { className: 'century-makers' },
      h.h3({ className: 'century-makers__title' }, 'Century Makers'),
      centuryMakers.length > 0
        ? createElement(
            'div',
            { className: 'century-makers__list' },
            ...mapToElements(centuryMakers, (maker) => {
              const player = playerMap[maker.playerId];
              return createElement(
                'div',
                { className: 'century-makers__item' },
                h.span({ className: 'century-makers__player' }, player?.name || 'Unknown'),
                h.span({ className: 'century-makers__count' }, `${maker.centuries} centuries`),
                h.span({ className: 'century-makers__highest' }, `(Highest: ${maker.highest})`)
              );
            })
          )
        : h.p({ className: 'century-makers__empty' }, 'No centuries made yet this season')
    )
  );
}

export default {
  renderSeasonBreaksList,
  renderCompactSeasonBreaks,
  renderBreakLeaders,
  renderCenturyMakers,
};
