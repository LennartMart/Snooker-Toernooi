/**
 * TournamentResultsPage Component
 * Shows final tournament rankings and breaks list
 */

import { createElement, h, render, showError, showLoading } from '../Component.js';
import { renderRankingsTable } from '../components/RankingsTable.js';
import { renderTournamentBreaksList } from '../components/TournamentBreaksList.js';
import { router } from '../router.js';
import { getStorage } from '../../storage/index.js';
import {
  compileTournamentResults,
  finalizeTournament,
  canFinalizeTournament,
  getTournamentCompletionStatus,
} from '../../services/TournamentResultsService.js';
import { getTournamentChampion, getTournamentRunnerUp } from '../../services/RankingService.js';
import { TournamentStatus } from '../../models/Tournament.js';

/**
 * Renders the tournament results page
 * @param {Object} options - Options
 * @param {HTMLElement} options.container - Container element
 * @param {string} options.tournamentId - Tournament ID
 */
export async function renderTournamentResultsPage(options = {}) {
  const { container, tournamentId } = options;

  if (!container) {
    // eslint-disable-next-line no-console
    console.error('Container element is required');
    return;
  }

  // Show loading
  showLoading(container, 'Loading tournament results...');

  try {
    // Load tournament
    const storage = getStorage();
    const tournaments = (await storage.getItem('tournaments')) || [];
    const tournament = tournaments.find((t) => t.id === tournamentId);

    if (!tournament) {
      showError(container, 'Tournament not found', () => router.navigate('/'));
      return;
    }

    // Load players for name lookup
    const players = (await storage.getItem('players')) || [];
    const playerMap = {};
    players.forEach((p) => {
      playerMap[p.id] = p;
    });

    // Load breaks
    const allBreaks = tournament.breaks || [];

    // Compile results
    const results = compileTournamentResults(tournament, allBreaks);

    // Get completion status
    const completionStatus = getTournamentCompletionStatus(tournament);

    // Render page
    renderPage(container, tournament, results, playerMap, allBreaks, completionStatus);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading tournament results:', error);
    showError(container, 'Failed to load tournament results', () => router.navigate('/'));
  }
}

/**
 * Renders the page content
 * @param {HTMLElement} container - Container
 * @param {Object} tournament - Tournament data
 * @param {Object} results - Compiled results
 * @param {Object} playerMap - Player lookup
 * @param {Array} breaks - All breaks
 * @param {Object} completionStatus - Completion status
 */
function renderPage(container, tournament, results, playerMap, breaks, completionStatus) {
  const champion = getTournamentChampion(tournament);
  const runnerUp = getTournamentRunnerUp(tournament);
  const championName = champion ? playerMap[champion]?.name || 'Unknown' : 'TBD';
  const runnerUpName = runnerUp ? playerMap[runnerUp]?.name || 'Unknown' : 'TBD';

  const isFinalized = tournament.status === TournamentStatus.COMPLETE;
  const canFinalize = canFinalizeTournament(tournament);

  render(
    container,
    createElement(
      'div',
      { className: 'page page--tournament-results' },

      // Header
      createElement(
        'div',
        { className: 'results-header' },
        h.h1({ className: 'results-header__title' }, `${tournament.name} - Results`),
        createElement(
          'div',
          { className: 'results-header__actions' },
          h.a(
            { href: `#/tournament/${tournament.id}`, className: 'btn btn--secondary' },
            '← Back to Tournament'
          ),
          !isFinalized &&
            canFinalize.canFinalize &&
            h.button(
              {
                className: 'btn btn--primary',
                onclick: () => handleFinalize(tournament.id),
              },
              'Finalize Tournament'
            )
        )
      ),

      // Status banner (if not finalized)
      !isFinalized && renderStatusBanner(canFinalize, completionStatus),

      // Champions section (if complete)
      (champion || runnerUp) && renderChampionsSection(championName, runnerUpName, isFinalized),

      // Main content
      createElement(
        'div',
        { className: 'results-content' },

        // Rankings section
        createElement(
          'section',
          { className: 'results-section results-section--rankings' },
          h.h2({ className: 'results-section__title' }, 'Final Rankings'),
          createElement('div', { id: 'rankings-table-container' })
        ),

        // Breaks section
        createElement(
          'section',
          { className: 'results-section results-section--breaks' },
          h.h2({ className: 'results-section__title' }, 'High Breaks'),
          createElement('div', { id: 'breaks-list-container' })
        )
      ),

      // Summary section
      renderSummarySection(tournament, results, playerMap)
    )
  );

  // Render subcomponents after main layout
  const rankingsContainer = document.getElementById('rankings-table-container');
  if (rankingsContainer && results.rankings.length > 0) {
    renderRankingsTable({
      container: rankingsContainer,
      rankings: results.rankings,
      playerMap,
      highlightTop3: true,
      showPointsBreakdown: true,
      title: 'Final Standings',
    });
  } else if (rankingsContainer) {
    render(
      rankingsContainer,
      h.p({ className: 'results-empty' }, 'Rankings will be available after the tournament is finalized.')
    );
  }

  const breaksContainer = document.getElementById('breaks-list-container');
  if (breaksContainer) {
    renderTournamentBreaksList({
      container: breaksContainer,
      breaks,
      playerMap,
      threshold: tournament.config?.breakThreshold || 20,
      showMatchInfo: true,
      title: 'Tournament Breaks',
    });
  }
}

/**
 * Renders the status banner
 * @param {Object} canFinalize - Finalize status
 * @param {Object} completionStatus - Completion status
 * @returns {HTMLElement}
 */
function renderStatusBanner(canFinalize, completionStatus) {
  if (canFinalize.canFinalize) {
    return createElement(
      'div',
      { className: 'results-banner results-banner--ready' },
      h.span({ className: 'results-banner__icon' }, '✓'),
      h.span({}, 'All matches completed. Tournament ready to be finalized.')
    );
  }

  return createElement(
    'div',
    { className: 'results-banner results-banner--pending' },
    h.span({ className: 'results-banner__icon' }, '⏳'),
    h.div(
      {},
      h.p({ className: 'results-banner__text' }, 'Tournament in progress'),
      createElement(
        'ul',
        { className: 'results-banner__reasons' },
        ...canFinalize.reasons.map((reason) => h.li({}, reason))
      ),
      createElement(
        'div',
        { className: 'results-banner__progress' },
        completionStatus.pools.total > 0 &&
          h.span({}, `Pools: ${completionStatus.pools.completed}/${completionStatus.pools.total}`),
        completionStatus.winnerBracket.total > 0 &&
          h.span({}, `Winner Bracket: ${completionStatus.winnerBracket.completed}/${completionStatus.winnerBracket.total}`),
        completionStatus.consolationBracket.total > 0 &&
          h.span({}, `Consolation: ${completionStatus.consolationBracket.completed}/${completionStatus.consolationBracket.total}`)
      )
    )
  );
}

/**
 * Renders the champions section
 * @param {string} championName - Champion name
 * @param {string} runnerUpName - Runner-up name
 * @param {boolean} isFinalized - Whether tournament is finalized
 * @returns {HTMLElement}
 */
function renderChampionsSection(championName, runnerUpName, isFinalized) {
  return createElement(
    'div',
    { className: 'results-champions' },
    createElement(
      'div',
      { className: 'results-champions__winner' },
      h.span({ className: 'results-champions__label' }, isFinalized ? 'Champion' : 'Leading'),
      h.span({ className: 'results-champions__name results-champions__name--gold' }, championName),
      h.span({ className: 'results-champions__trophy' }, '🏆')
    ),
    createElement(
      'div',
      { className: 'results-champions__runnerup' },
      h.span({ className: 'results-champions__label' }, 'Runner-up'),
      h.span({ className: 'results-champions__name results-champions__name--silver' }, runnerUpName)
    )
  );
}

/**
 * Renders the summary section
 * @param {Object} tournament - Tournament
 * @param {Object} results - Results
 * @param {Object} playerMap - Player map
 * @returns {HTMLElement}
 */
function renderSummarySection(tournament, results, playerMap) {
  const totalPlayers = results.rankings.length;
  const totalBreaks = results.breaks.length;
  const highestBreak = results.breakStats.highest;
  const highestBreakPlayer = results.breakStats.highestPlayerId
    ? playerMap[results.breakStats.highestPlayerId]?.name
    : null;

  return createElement(
    'section',
    { className: 'results-summary' },
    h.h3({ className: 'results-summary__title' }, 'Tournament Summary'),
    createElement(
      'div',
      { className: 'results-summary__grid' },
      createElement(
        'div',
        { className: 'results-summary__item' },
        h.span({ className: 'results-summary__label' }, 'Total Players'),
        h.span({ className: 'results-summary__value' }, String(totalPlayers))
      ),
      createElement(
        'div',
        { className: 'results-summary__item' },
        h.span({ className: 'results-summary__label' }, 'Format'),
        h.span({ className: 'results-summary__value' }, tournament.format === 'masters' ? 'Masters' : 'Regular')
      ),
      createElement(
        'div',
        { className: 'results-summary__item' },
        h.span({ className: 'results-summary__label' }, 'High Breaks Recorded'),
        h.span({ className: 'results-summary__value' }, String(totalBreaks))
      ),
      highestBreak > 0 &&
        createElement(
          'div',
          { className: 'results-summary__item results-summary__item--highlight' },
          h.span({ className: 'results-summary__label' }, 'Highest Break'),
          h.span({ className: 'results-summary__value' }, String(highestBreak)),
          highestBreakPlayer && h.span({ className: 'results-summary__subtext' }, `by ${highestBreakPlayer}`)
        ),
      createElement(
        'div',
        { className: 'results-summary__item' },
        h.span({ className: 'results-summary__label' }, 'Date'),
        h.span({ className: 'results-summary__value' }, new Date(tournament.date).toLocaleDateString())
      ),
      createElement(
        'div',
        { className: 'results-summary__item' },
        h.span({ className: 'results-summary__label' }, 'Status'),
        h.span(
          {
            className: `results-summary__value results-summary__value--${
              results.isFinalized ? 'complete' : 'pending'
            }`,
          },
          results.isFinalized ? 'Finalized' : 'In Progress'
        )
      )
    )
  );
}

/**
 * Handles finalizing the tournament
 * @param {string} tournamentId - Tournament ID
 */
async function handleFinalize(tournamentId) {
  const confirmed = confirm('Are you sure you want to finalize this tournament? This will lock all results.');

  if (!confirmed) {
    return;
  }

  try {
    const storage = getStorage();
    const tournaments = (await storage.getItem('tournaments')) || [];
    const tournament = tournaments.find((t) => t.id === tournamentId);
    const breaks = tournament?.breaks || [];

    await finalizeTournament(tournamentId, breaks);

    // Reload page
    router.navigate(`/tournament/${tournamentId}/results`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error finalizing tournament:', error);
    alert('Failed to finalize tournament: ' + error.message);
  }
}

export default {
  renderTournamentResultsPage,
};
