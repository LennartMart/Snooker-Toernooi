/**
 * SeasonStandingsTable Component
 * Displays cumulative season points and highlights top 16 Masters qualifiers
 */

import { render, createElement, h, mapToElements } from '../Component.js';

/**
 * @typedef {Object} SeasonStandingsTableConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../services/SeasonStandingsService.js').SeasonStanding[]} standings - Season standings
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup map
 * @property {number} [mastersQualifiersCount=16] - Number of Masters qualifiers to highlight
 * @property {(playerId: string) => void} [onPlayerClick] - Callback when player clicked
 * @property {string} [title='Season Standings'] - Table title
 */

/**
 * Gets CSS class for position highlighting
 * @param {number} position - Position number
 * @param {number} cutoff - Masters cutoff position
 * @returns {string} CSS class
 */
function getPositionClass(position, cutoff) {
  if (position === 1) {
    return 'season-standings__row--leader';
  }
  if (position <= cutoff) {
    return 'season-standings__row--qualifying';
  }
  if (position === cutoff + 1 || position === cutoff + 2) {
    return 'season-standings__row--bubble';
  }
  return '';
}

/**
 * Renders the season standings table
 * @param {SeasonStandingsTableConfig} config - Configuration
 */
export function renderSeasonStandingsTable({
  container,
  standings,
  playerMap,
  mastersQualifiersCount = 16,
  onPlayerClick,
  title = 'Season Standings',
}) {
  // Sort standings by position
  const sortedStandings = [...standings].sort((a, b) => a.position - b.position);

  render(
    container,
    createElement(
      'div',
      { className: 'season-standings' },

      // Header
      h.div(
        { className: 'season-standings__header' },
        h.h2({ className: 'season-standings__title' }, title),
        h.div(
          { className: 'season-standings__legend' },
          h.span({ className: 'season-standings__legend-item season-standings__legend-item--qualifying' }, 
            `Top ${mastersQualifiersCount} qualify for Masters`
          )
        )
      ),

      // Table
      createElement(
        'table',
        { className: 'season-standings__table' },
        createElement(
          'thead',
          {},
          createElement(
            'tr',
            {},
            h.th({ className: 'season-standings__col-pos' }, '#'),
            h.th({ className: 'season-standings__col-player' }, 'Player'),
            h.th({ className: 'season-standings__col-points' }, 'Points'),
            h.th({ className: 'season-standings__col-tournaments' }, 'Played'),
            h.th({ className: 'season-standings__col-best' }, 'Best'),
            h.th({ className: 'season-standings__col-avg' }, 'Avg'),
            h.th({ className: 'season-standings__col-status' }, 'Status')
          )
        ),
        createElement(
          'tbody',
          {},
          ...mapToElements(sortedStandings, (standing) => {
            const player = playerMap[standing.playerId];
            const playerName = player?.name || 'Unknown';
            const rowClass = `season-standings__row ${getPositionClass(standing.position, mastersQualifiersCount)}`;

            return createElement(
              'tr',
              {
                className: rowClass,
                onclick: onPlayerClick ? () => onPlayerClick(standing.playerId) : undefined,
                tabindex: onPlayerClick ? '0' : undefined,
                role: onPlayerClick ? 'button' : undefined,
              },
              h.td(
                { className: 'season-standings__cell season-standings__cell--pos' },
                String(standing.position)
              ),
              h.td(
                { className: 'season-standings__cell season-standings__cell--player' },
                playerName
              ),
              h.td(
                { className: 'season-standings__cell season-standings__cell--points' },
                h.strong({}, String(standing.totalPoints))
              ),
              h.td(
                { className: 'season-standings__cell season-standings__cell--number' },
                String(standing.tournamentsPlayed)
              ),
              h.td(
                { className: 'season-standings__cell season-standings__cell--number' },
                standing.bestFinish > 0 ? getOrdinal(standing.bestFinish) : '-'
              ),
              h.td(
                { className: 'season-standings__cell season-standings__cell--number' },
                standing.averageFinish > 0 ? standing.averageFinish.toFixed(1) : '-'
              ),
              h.td(
                { className: 'season-standings__cell season-standings__cell--status' },
                standing.qualifiesForMasters
                  ? h.span({ className: 'season-standings__badge season-standings__badge--qualified' }, '✓ Qualified')
                  : standing.position <= mastersQualifiersCount + 2
                    ? h.span({ className: 'season-standings__badge season-standings__badge--bubble' }, 'On the bubble')
                    : h.span({ className: 'season-standings__badge season-standings__badge--out' }, '-')
              )
            );
          })
        )
      ),

      // Footer
      h.div(
        { className: 'season-standings__footer' },
        h.span(
          { className: 'season-standings__summary' },
          `${sortedStandings.length} players | ${mastersQualifiersCount} qualify for Masters`
        )
      )
    )
  );
}

/**
 * Gets ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} n - Number
 * @returns {string} Ordinal string
 */
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Creates a compact season standings list (for sidebar/preview)
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container element
 * @param {import('../../services/SeasonStandingsService.js').SeasonStanding[]} config.standings - Standings
 * @param {Object} config.playerMap - Player lookup
 * @param {number} [config.limit=5] - Max items to show
 */
export function renderCompactSeasonStandings({ container, standings, playerMap, limit = 5 }) {
  const topStandings = [...standings]
    .sort((a, b) => a.position - b.position)
    .slice(0, limit);

  render(
    container,
    createElement(
      'div',
      { className: 'season-standings-compact' },
      h.h4({ className: 'season-standings-compact__title' }, 'Season Leaders'),
      createElement(
        'ol',
        { className: 'season-standings-compact__list' },
        ...mapToElements(topStandings, (standing) => {
          const player = playerMap[standing.playerId];
          return h.li(
            { className: 'season-standings-compact__item' },
            h.span({ className: 'season-standings-compact__name' }, player?.name || 'Unknown'),
            h.span({ className: 'season-standings-compact__points' }, `${standing.totalPoints} pts`)
          );
        })
      )
    )
  );
}

/**
 * Renders the Masters qualification cutline indicator
 * @param {Object} config - Configuration
 * @param {HTMLElement} config.container - Container
 * @param {import('../../services/SeasonStandingsService.js').SeasonStanding[]} config.standings - Standings
 * @param {Object} config.playerMap - Player map
 * @param {number} config.cutoff - Qualification cutoff position
 */
export function renderQualificationCutline({ container, standings, playerMap, cutoff }) {
  const sortedStandings = [...standings].sort((a, b) => a.position - b.position);
  const lastQualifier = sortedStandings[cutoff - 1];
  const firstNonQualifier = sortedStandings[cutoff];
  
  const pointsGap = lastQualifier && firstNonQualifier 
    ? lastQualifier.totalPoints - firstNonQualifier.totalPoints 
    : 0;

  render(
    container,
    createElement(
      'div',
      { className: 'qualification-cutline' },
      h.div(
        { className: 'qualification-cutline__above' },
        h.span({ className: 'qualification-cutline__label' }, `${cutoff}. (Last to qualify)`),
        h.span({ className: 'qualification-cutline__player' }, playerMap[lastQualifier?.playerId]?.name || 'TBD'),
        h.span({ className: 'qualification-cutline__points' }, `${lastQualifier?.totalPoints || 0} pts`)
      ),
      h.div({ className: 'qualification-cutline__line' }),
      h.div(
        { className: 'qualification-cutline__below' },
        h.span({ className: 'qualification-cutline__label' }, `${cutoff + 1}. (First out)`),
        h.span({ className: 'qualification-cutline__player' }, playerMap[firstNonQualifier?.playerId]?.name || '-'),
        h.span({ className: 'qualification-cutline__points' }, `${firstNonQualifier?.totalPoints || 0} pts`),
        pointsGap > 0 && h.span({ className: 'qualification-cutline__gap' }, `(${pointsGap} pts behind)`)
      )
    )
  );
}

export default {
  renderSeasonStandingsTable,
  renderCompactSeasonStandings,
  renderQualificationCutline,
};
