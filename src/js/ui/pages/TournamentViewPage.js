/**
 * Tournament View Page
 * Overview page showing tournament status, pools, brackets, and quick actions
 */

import { render, createElement, h, showLoading, showError, showEmpty } from '../Component.js';
import { store, setLoading, setError } from '../../store/index.js';
import { router } from '../router.js';
import { getStorage } from '../../storage/index.js';
import { getTournamentById } from '../../services/TournamentService.js';
import { getPendingMatches } from '../../services/MatchService.js';
import { getBreaksByTournament, getBreaksAboveThreshold } from '../../services/BreakService.js';
import { calculatePoolStandings } from '../../services/PoolStandingsService.js';
import { formatDate } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} TournamentViewPageProps
 * @property {HTMLElement} container - Container element
 * @property {string} tournamentId - Tournament ID
 */

/**
 * Page state
 */
let pageState = {
  tournament: null,
  matches: [],
  breaks: [],
  poolStandings: {},
};

/**
 * Gets tournament status info
 * @returns {Object}
 */
function getTournamentStatus() {
  const { tournament, matches } = pageState;
  
  if (!tournament) {
    return { status: 'unknown', label: 'Unknown', color: 'gray' };
  }
  
  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.winnerId).length;
  const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
  
  if (tournament.status === 'completed') {
    return { 
      status: 'completed', 
      label: 'Completed', 
      color: 'success',
      progress: 100,
      completedMatches,
      totalMatches,
    };
  }
  
  if (tournament.status === 'knockout') {
    return { 
      status: 'knockout', 
      label: 'Knockout Stage', 
      color: 'primary',
      progress,
      completedMatches,
      totalMatches,
    };
  }
  
  if (completedMatches === 0) {
    return { 
      status: 'pending', 
      label: 'Not Started', 
      color: 'gray',
      progress: 0,
      completedMatches,
      totalMatches,
    };
  }
  
  return { 
    status: 'pool', 
    label: 'Pool Stage', 
    color: 'info',
    progress,
    completedMatches,
    totalMatches,
  };
}

/**
 * Renders the tournament header
 * @returns {HTMLElement}
 */
function renderHeader() {
  const { tournament } = pageState;
  const status = getTournamentStatus();
  
  return createElement(
    'header',
    { className: 'tournament-view__header' },
    createElement(
      'div',
      { className: 'tournament-view__title-row' },
      h.h1({ className: 'tournament-view__title' }, tournament.name),
      createElement(
        'span',
        { className: `tournament-view__status tournament-view__status--${status.color}` },
        status.label
      )
    ),
    createElement(
      'div',
      { className: 'tournament-view__meta' },
      h.span({ className: 'tournament-view__date' }, formatDate(tournament.date)),
      h.span({ className: 'tournament-view__format' }, tournament.format === 'masters' ? 'Masters' : 'Regular'),
      h.span({ className: 'tournament-view__players' }, `${tournament.playerIds?.length || 0} players`)
    ),
    // Progress bar
    createElement(
      'div',
      { className: 'tournament-view__progress' },
      createElement(
        'div',
        { className: 'tournament-view__progress-bar' },
        createElement('div', {
          className: 'tournament-view__progress-fill',
          style: `width: ${status.progress}%`,
        })
      ),
      h.span(
        { className: 'tournament-view__progress-text' },
        `${status.completedMatches}/${status.totalMatches} matches completed`
      )
    )
  );
}

/**
 * Renders quick action buttons
 * @returns {HTMLElement}
 */
function renderQuickActions() {
  const { tournament } = pageState;
  const status = getTournamentStatus();
  
  const actions = [];
  
  // Continue button
  if (status.status === 'pool' || status.status === 'pending') {
    actions.push(
      h.a(
        { 
          href: `#/tournament/${tournament.id}/matches`, 
          className: 'btn btn--primary btn--lg' 
        },
        'Continue Match Entry'
      )
    );
  }
  
  if (status.status === 'knockout') {
    actions.push(
      h.a(
        { 
          href: `#/tournament/${tournament.id}/knockout`, 
          className: 'btn btn--primary btn--lg' 
        },
        'View Knockout Brackets'
      )
    );
  }
  
  if (status.status === 'completed') {
    actions.push(
      h.a(
        { 
          href: `#/tournament/${tournament.id}/results`, 
          className: 'btn btn--primary btn--lg' 
        },
        'View Results'
      )
    );
  }
  
  // Secondary actions
  actions.push(
    h.a(
      { 
        href: `#/tournament/${tournament.id}/matches`, 
        className: 'btn btn--secondary' 
      },
      'All Matches'
    )
  );
  
  if (tournament.pools?.length > 0) {
    actions.push(
      h.a(
        { 
          href: `#/tournament/${tournament.id}/pool/${tournament.pools[0].id}`, 
          className: 'btn btn--secondary' 
        },
        'Pool Standings'
      )
    );
  }
  
  return createElement(
    'section',
    { className: 'tournament-view__actions' },
    ...actions
  );
}

/**
 * Renders pool summary cards
 * @returns {HTMLElement}
 */
function renderPoolSummary() {
  const { tournament, matches } = pageState;
  
  if (!tournament.pools || tournament.pools.length === 0) {
    return null;
  }
  
  const poolCards = tournament.pools.map((pool) => {
    const poolMatches = matches.filter((m) => m.poolId === pool.id);
    const completedMatches = poolMatches.filter((m) => m.winnerId).length;
    const totalMatches = poolMatches.length;
    const isComplete = completedMatches === totalMatches && totalMatches > 0;
    
    return createElement(
      'a',
      { 
        href: `#/tournament/${tournament.id}/pool/${pool.id}`,
        className: `pool-card ${isComplete ? 'pool-card--complete' : ''}`,
      },
      h.h4({ className: 'pool-card__name' }, pool.name || `Pool ${pool.id.slice(-4)}`),
      createElement(
        'div',
        { className: 'pool-card__info' },
        h.span({}, `${pool.playerIds?.length || 0} players`),
        h.span({}, `${completedMatches}/${totalMatches} matches`)
      ),
      createElement(
        'div',
        { className: 'pool-card__progress' },
        createElement('div', {
          className: 'pool-card__progress-bar',
          style: `width: ${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%`,
        })
      )
    );
  });
  
  return createElement(
    'section',
    { className: 'tournament-view__pools' },
    h.h2({}, 'Pool Stage'),
    createElement(
      'div',
      { className: 'pool-cards-grid' },
      ...poolCards
    )
  );
}

/**
 * Renders knockout bracket summary
 * @returns {HTMLElement}
 */
function renderKnockoutSummary() {
  const { tournament, matches } = pageState;
  
  if (!tournament.knockout) {
    return null;
  }
  
  const knockoutMatches = matches.filter((m) => m.bracketType);
  const winnerMatches = knockoutMatches.filter((m) => m.bracketType === 'winner');
  const consolationMatches = knockoutMatches.filter((m) => m.bracketType === 'consolation');
  
  const winnerComplete = winnerMatches.filter((m) => m.winnerId).length;
  const consolationComplete = consolationMatches.filter((m) => m.winnerId).length;
  
  return createElement(
    'section',
    { className: 'tournament-view__knockout' },
    h.h2({}, 'Knockout Stage'),
    createElement(
      'div',
      { className: 'bracket-summary-grid' },
      // Winner bracket
      createElement(
        'a',
        { 
          href: `#/tournament/${tournament.id}/knockout`,
          className: 'bracket-summary-card',
        },
        h.h4({}, 'Winner Bracket'),
        h.p({}, `${winnerComplete}/${winnerMatches.length} matches`),
        createElement(
          'div',
          { className: 'bracket-summary-card__progress' },
          createElement('div', {
            className: 'bracket-summary-card__progress-bar',
            style: `width: ${winnerMatches.length > 0 ? (winnerComplete / winnerMatches.length) * 100 : 0}%`,
          })
        )
      ),
      // Consolation bracket
      createElement(
        'a',
        { 
          href: `#/tournament/${tournament.id}/knockout`,
          className: 'bracket-summary-card',
        },
        h.h4({}, 'Consolation Bracket'),
        h.p({}, `${consolationComplete}/${consolationMatches.length} matches`),
        createElement(
          'div',
          { className: 'bracket-summary-card__progress' },
          createElement('div', {
            className: 'bracket-summary-card__progress-bar',
            style: `width: ${consolationMatches.length > 0 ? (consolationComplete / consolationMatches.length) * 100 : 0}%`,
          })
        )
      )
    ),
    h.a(
      { 
        href: `#/tournament/${tournament.id}/knockout`, 
        className: 'btn btn--secondary' 
      },
      'View Full Brackets'
    )
  );
}

/**
 * Renders high breaks summary
 * @returns {HTMLElement}
 */
function renderBreaksSummary() {
  const { tournament } = pageState;
  const highBreaks = getBreaksAboveThreshold(pageState.breaks, tournament.config?.breakThreshold || 25);
  
  if (highBreaks.length === 0) {
    return createElement(
      'section',
      { className: 'tournament-view__breaks' },
      h.h2({}, 'High Breaks'),
      h.p({ className: 'text-muted' }, 'No high breaks recorded yet')
    );
  }
  
  // Sort by value descending, take top 5
  const topBreaks = [...highBreaks]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  
  return createElement(
    'section',
    { className: 'tournament-view__breaks' },
    h.h2({}, 'High Breaks'),
    createElement(
      'ul',
      { className: 'breaks-summary-list' },
      ...topBreaks.map((breakRecord, index) =>
        createElement(
          'li',
          { className: 'breaks-summary-item' },
          h.span({ className: 'breaks-summary-rank' }, `#${index + 1}`),
          h.span({ className: 'breaks-summary-value' }, String(breakRecord.value)),
          h.span({ className: 'breaks-summary-player' }, breakRecord.playerName || `Player`)
        )
      )
    ),
    highBreaks.length > 5
      ? h.p({ className: 'text-muted' }, `+${highBreaks.length - 5} more breaks`)
      : null
  );
}

/**
 * Renders upcoming matches
 * @returns {HTMLElement}
 */
function renderUpcomingMatches() {
  const { tournament, matches } = pageState;
  const incomplete = getPendingMatches({ matches });
  
  if (incomplete.length === 0) {
    return null;
  }
  
  // Take next 5 matches
  const nextMatches = incomplete.slice(0, 5);
  
  return createElement(
    'section',
    { className: 'tournament-view__upcoming' },
    h.h2({}, 'Next Matches'),
    createElement(
      'ul',
      { className: 'upcoming-matches-list' },
      ...nextMatches.map((match) =>
        createElement(
          'li',
          { className: 'upcoming-match-item' },
          h.a(
            { 
              href: `#/tournament/${tournament.id}/match/${match.id}`,
              className: 'upcoming-match-link',
            },
            h.span({ className: 'upcoming-match-players' }, 
              `${match.player1Name || 'Player 1'} vs ${match.player2Name || 'Player 2'}`
            ),
            h.span({ className: 'upcoming-match-stage' }, 
              match.poolId ? 'Pool' : match.bracketType || 'Match'
            )
          )
        )
      )
    ),
    incomplete.length > 5
      ? h.a(
          { 
            href: `#/tournament/${tournament.id}/matches`, 
            className: 'btn btn--text' 
          },
          `View all ${incomplete.length} remaining matches →`
        )
      : null
  );
}

/**
 * Renders the page content
 */
function renderTournamentViewPageContent() {
  const container = document.getElementById('app');
  
  render(
    container,
    createElement(
      'div',
      { className: 'page page--tournament-view' },
      renderHeader(),
      renderQuickActions(),
      
      createElement(
        'div',
        { className: 'tournament-view__grid' },
        // Main content
        createElement(
          'div',
          { className: 'tournament-view__main' },
          renderPoolSummary(),
          renderKnockoutSummary()
        ),
        
        // Sidebar
        createElement(
          'aside',
          { className: 'tournament-view__sidebar' },
          renderBreaksSummary(),
          renderUpcomingMatches()
        )
      )
    )
  );
}

/**
 * Renders the Tournament View page
 * @param {TournamentViewPageProps} props - Page props
 */
export async function renderTournamentViewPage({ container, tournamentId }) {
  showLoading(container, 'Loading tournament...');
  store.dispatch(setLoading(true));
  
  try {
    // Load tournament
    const tournament = await getTournamentById(tournamentId);
    
    if (!tournament) {
      showEmpty(
        container,
        'Tournament not found',
        h.a({ href: '#/', className: 'btn btn--secondary' }, 'Back to Home')
      );
      return;
    }
    
    // Load matches from tournament and breaks from storage
    const matches = tournament.matches || [];
    const storage = getStorage();
    const allBreaks = (await storage.getItem('breaks')) || [];
    const breaks = getBreaksByTournament(allBreaks, tournamentId);
    
    pageState = {
      tournament,
      matches,
      breaks,
      poolStandings: {},
    };
    
    // Calculate pool standings
    if (tournament.pools) {
      for (const pool of tournament.pools) {
        pageState.poolStandings[pool.id] = calculatePoolStandings(tournament, pool.id);
      }
    }
    
    renderTournamentViewPageContent();
  } catch (error) {
    store.dispatch(setError(error.message));
    showError(container, `Failed to load tournament: ${error.message}`, () => {
      router.navigate('/');
    });
  } finally {
    store.dispatch(setLoading(false));
  }
}

export default {
  renderTournamentViewPage,
};
