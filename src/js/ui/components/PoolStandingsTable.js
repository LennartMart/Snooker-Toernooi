/**
 * Pool Standings Table Component
 * Displays pool standings with positions, W/L, frames, and highest break
 */

import { render, createElement, h } from '../Component.js';

/**
 * @typedef {Object} PoolStandingsTableConfig
 * @property {HTMLElement} container - Container element
 * @property {import('../../services/PoolStandingsService.js').PoolStandings} standings - Pool standings
 * @property {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player lookup map
 * @property {(playerId: string) => void} [onPlayerClick] - Callback when player clicked
 * @property {boolean} [compact=false] - Show compact version
 * @property {boolean} [showHighlights=true] - Show position highlighting (top 2, bottom 2)
 */

/**
 * Renders the pool standings table
 * @param {PoolStandingsTableConfig} config - Configuration
 */
export function renderPoolStandingsTable({
  container,
  standings,
  playerMap,
  onPlayerClick,
  compact = false,
  showHighlights = true,
}) {
  const totalPlayers = standings.standings.length;

  render(
    container,
    createElement(
      'div',
      { className: `pool-standings ${compact ? 'pool-standings--compact' : ''}` },
      // Pool header
      createElement(
        'div',
        { className: 'pool-standings__header' },
        h.h3({ className: 'pool-standings__title' }, `Pool ${standings.poolName}`),
        createElement(
          'div',
          { className: 'pool-standings__status' },
          standings.isComplete
            ? h.span({ className: 'pool-standings__badge pool-standings__badge--complete' }, 'Complete')
            : h.span({ className: 'pool-standings__badge pool-standings__badge--pending' }, 'In Progress'),
          standings.hasTiebreaker &&
            h.span({ className: 'pool-standings__badge pool-standings__badge--tiebreaker' }, 'Tiebreaker'),
          standings.shootoutRequired.length > 0 &&
            h.span({ className: 'pool-standings__badge pool-standings__badge--shootout' }, 'Shootout Needed')
        )
      ),

      // Standings table
      createElement(
        'table',
        { className: 'pool-standings__table' },
        createElement(
          'thead',
          {},
          createElement(
            'tr',
            {},
            h.th({ className: 'pool-standings__col-pos' }, '#'),
            h.th({ className: 'pool-standings__col-player' }, 'Player'),
            h.th({ className: 'pool-standings__col-record' }, 'W-L'),
            !compact && h.th({ className: 'pool-standings__col-frames' }, 'Frames'),
            !compact && h.th({ className: 'pool-standings__col-diff' }, '+/-'),
            h.th({ className: 'pool-standings__col-break' }, 'HB')
          )
        ),
        createElement(
          'tbody',
          {},
          ...standings.standings.map((standing) => {
            const player = playerMap[standing.playerId];
            const playerName = player?.name || 'Unknown';
            const isTop2 = standing.position <= 2;
            const isBottom2 = standing.position > totalPlayers - 2;
            const needsShootout = standings.shootoutRequired.includes(standing.playerId);

            let rowClass = 'pool-standings__row';
            if (showHighlights) {
              if (isTop2) {
                rowClass += ' pool-standings__row--top';
              }
              if (isBottom2 && totalPlayers > 2) {
                rowClass += ' pool-standings__row--bottom';
              }
            }
            if (needsShootout) {
              rowClass += ' pool-standings__row--shootout';
            }

            return createElement(
              'tr',
              {
                className: rowClass,
                onclick: onPlayerClick ? () => onPlayerClick(standing.playerId) : undefined,
              },
              h.td({ className: 'pool-standings__col-pos' }, String(standing.position)),
              createElement(
                'td',
                { className: 'pool-standings__col-player' },
                h.span({ className: 'pool-standings__player-name' }, playerName),
                player?.isBye && h.span({ className: 'pool-standings__bye-badge' }, 'BYE')
              ),
              h.td({ className: 'pool-standings__col-record' }, `${standing.matchesWon}-${standing.matchesLost}`),
              !compact && h.td({ className: 'pool-standings__col-frames' }, `${standing.framesWon}-${standing.framesLost}`),
              !compact && h.td({ className: 'pool-standings__col-diff' }, formatDiff(standing.frameDifference)),
              createElement(
                'td',
                { className: 'pool-standings__col-break' },
                standing.highestBreak > 0
                  ? h.span(
                      {
                        className: `pool-standings__break ${standing.highestBreak >= 100 ? 'pool-standings__break--century' : ''}`,
                      },
                      String(standing.highestBreak)
                    )
                  : h.span({ className: 'pool-standings__break pool-standings__break--none' }, '-')
              )
            );
          })
        )
      ),

      // Legend (if showing highlights)
      showHighlights &&
        createElement(
          'div',
          { className: 'pool-standings__legend' },
          createElement(
            'span',
            { className: 'pool-standings__legend-item pool-standings__legend-item--top' },
            'Top 2: Winner Bracket'
          ),
          createElement(
            'span',
            { className: 'pool-standings__legend-item pool-standings__legend-item--bottom' },
            'Bottom 2: Consolation'
          )
        )
    )
  );
}

/**
 * Formats frame difference with + sign
 * @param {number} diff - Frame difference
 * @returns {string}
 */
function formatDiff(diff) {
  if (diff > 0) {
    return `+${diff}`;
  }
  return String(diff);
}

/**
 * Creates a mini standings display for overview
 * @param {import('../../services/PoolStandingsService.js').PoolStandings} standings - Pool standings
 * @param {Object.<string, import('../../models/Player.js').PlayerData>} playerMap - Player map
 * @returns {HTMLElement}
 */
export function createMiniStandings(standings, playerMap) {
  return createElement(
    'div',
    { className: 'pool-mini-standings' },
    h.div({ className: 'pool-mini-standings__header' }, `Pool ${standings.poolName}`),
    createElement(
      'ol',
      { className: 'pool-mini-standings__list' },
      ...standings.standings.slice(0, 4).map((standing) => {
        const player = playerMap[standing.playerId];
        return h.li(
          { className: standing.position <= 2 ? 'pool-mini-standings__item--top' : '' },
          `${player?.name || 'Unknown'} (${standing.matchesWon}-${standing.matchesLost})`
        );
      })
    )
  );
}

/**
 * Creates a standings position badge
 * @param {number} position - Position (1-indexed)
 * @param {boolean} [isWinner=false] - Whether this is a winning position
 * @returns {HTMLElement}
 */
export function createPositionBadge(position, isWinner = false) {
  let className = 'position-badge';

  if (position === 1) {
    className += ' position-badge--first';
  } else if (position === 2) {
    className += ' position-badge--second';
  } else if (position === 3) {
    className += ' position-badge--third';
  }

  if (isWinner) {
    className += ' position-badge--winner';
  }

  return h.span({ className }, String(position));
}

export default {
  renderPoolStandingsTable,
  createMiniStandings,
  createPositionBadge,
};
