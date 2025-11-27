/**
 * MastersPage Component
 * Shows season standings and high breaks for Masters qualification
 */

import { createElement, h, render, showError, showLoading, showEmpty } from '../Component.js';
import { renderSeasonStandingsTable, renderQualificationCutline } from '../components/SeasonStandingsTable.js';
import { renderSeasonBreaksList, renderCenturyMakers } from '../components/SeasonBreaksList.js';
import { router } from '../router.js';
import { getStorage } from '../../storage/index.js';
import { calculateSeasonStandings, getSeasonStandingsSummary } from '../../services/SeasonStandingsService.js';
import { getSeasonBreaks, getSeasonCenturyMakers, getSeasonBreaksSummary } from '../../services/SeasonBreaksService.js';
import { getCurrentSeason, getAllSeasons } from '../../services/SeasonService.js';

/**
 * Renders the Masters qualification page
 * @param {Object} options - Options
 * @param {HTMLElement} options.container - Container element
 * @param {string} [options.seasonId] - Season ID (uses current season if not specified)
 */
export async function renderMastersPage(options = {}) {
  const { container, seasonId } = options;

  if (!container) {
    // eslint-disable-next-line no-console
    console.error('Container element is required');
    return;
  }

  // Show loading
  showLoading(container, 'Loading Masters qualification data...');

  try {
    // Get season
    let season;
    if (seasonId) {
      const storage = getStorage();
      const seasons = (await storage.getItem('seasons')) || [];
      season = seasons.find((s) => s.id === seasonId);
    } else {
      season = await getCurrentSeason();
    }

    if (!season) {
      // Check if there are any seasons
      const allSeasons = await getAllSeasons();
      if (allSeasons.length === 0) {
        showEmpty(
          container,
          'No seasons available',
          h.div(
            {},
            h.p({}, 'Create a season to start tracking Masters qualification.'),
            h.a({ href: '#/seasons', className: 'btn btn--primary' }, 'Manage Seasons')
          )
        );
        return;
      }
      // Use the most recent season
      season = allSeasons.sort((a, b) => b.year - a.year)[0];
    }

    // Load players
    const storage = getStorage();
    const players = (await storage.getItem('players')) || [];
    const playerMap = {};
    players.forEach((p) => {
      playerMap[p.id] = p;
    });

    // Calculate standings and breaks
    const standingsResult = await calculateSeasonStandings(season.id);
    const breaksResult = await getSeasonBreaks(season.id);
    const centuryMakers = await getSeasonCenturyMakers(season.id);
    const standingsSummary = await getSeasonStandingsSummary(season.id);
    const breaksSummary = await getSeasonBreaksSummary(season.id);

    // Render page
    renderPage(container, season, standingsResult, breaksResult, centuryMakers, standingsSummary, breaksSummary, playerMap);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading Masters page:', error);
    showError(container, 'Failed to load Masters qualification data', () => router.navigate('/'));
  }
}

/**
 * Renders the page content
 * @param {HTMLElement} container - Container
 * @param {Object} season - Season data
 * @param {Object} standingsResult - Standings result
 * @param {Object} breaksResult - Breaks result
 * @param {Array} centuryMakers - Century makers
 * @param {Object} standingsSummary - Standings summary
 * @param {Object} breaksSummary - Breaks summary
 * @param {Object} playerMap - Player lookup
 */
function renderPage(container, season, standingsResult, breaksResult, centuryMakers, standingsSummary, breaksSummary, playerMap) {
  const mastersQualifiersCount = season.settings?.mastersQualifiers || 16;

  render(
    container,
    createElement(
      'div',
      { className: 'page page--masters' },

      // Header
      createElement(
        'div',
        { className: 'masters-header' },
        h.h1({ className: 'masters-header__title' }, `${season.name} Masters Qualification`),
        h.p(
          { className: 'masters-header__subtitle' },
          `Top ${mastersQualifiersCount} players qualify for the season-ending Masters tournament`
        ),
        createElement(
          'div',
          { className: 'masters-header__actions' },
          h.a({ href: '#/', className: 'btn btn--secondary' }, '← Home'),
          h.a({ href: '#/seasons', className: 'btn btn--secondary' }, 'All Seasons')
        )
      ),

      // Summary cards
      renderSummaryCards(standingsSummary, breaksSummary, mastersQualifiersCount),

      // Main content grid
      createElement(
        'div',
        { className: 'masters-content' },

        // Left column: Standings
        createElement(
          'section',
          { className: 'masters-section masters-section--standings' },
          h.h2({}, 'Season Standings'),
          createElement('div', { id: 'season-standings-container' }),
          createElement('div', { id: 'qualification-cutline-container', className: 'masters-cutline' })
        ),

        // Right column: Breaks
        createElement(
          'section',
          { className: 'masters-section masters-section--breaks' },
          h.h2({}, 'Season High Breaks'),
          createElement('div', { id: 'season-breaks-container' }),
          centuryMakers.length > 0 && createElement('div', { id: 'century-makers-container', className: 'masters-centuries' })
        )
      )
    )
  );

  // Render subcomponents
  const standingsContainer = document.getElementById('season-standings-container');
  if (standingsContainer) {
    renderSeasonStandingsTable({
      container: standingsContainer,
      standings: standingsResult.standings,
      playerMap,
      mastersQualifiersCount,
      title: 'Qualification Race',
      onPlayerClick: (playerId) => {
        // Could navigate to player profile
        // eslint-disable-next-line no-console
        console.log('Player clicked:', playerId);
      },
    });
  }

  const cutlineContainer = document.getElementById('qualification-cutline-container');
  if (cutlineContainer && standingsResult.standings.length > mastersQualifiersCount) {
    renderQualificationCutline({
      container: cutlineContainer,
      standings: standingsResult.standings,
      playerMap,
      cutoff: mastersQualifiersCount,
    });
  }

  const breaksContainer = document.getElementById('season-breaks-container');
  if (breaksContainer) {
    renderSeasonBreaksList({
      container: breaksContainer,
      breaks: breaksResult.breaks,
      playerMap,
      threshold: breaksSummary.threshold,
      title: `High Breaks (${breaksSummary.threshold}+)`,
      limit: 20,
    });
  }

  const centuryContainer = document.getElementById('century-makers-container');
  if (centuryContainer && centuryMakers.length > 0) {
    renderCenturyMakers({
      container: centuryContainer,
      centuryMakers,
      playerMap,
    });
  }
}

/**
 * Renders summary cards
 * @param {Object} standingsSummary - Standings summary
 * @param {Object} breaksSummary - Breaks summary
 * @param {number} mastersQualifiersCount - Qualifiers count
 * @returns {HTMLElement}
 */
function renderSummaryCards(standingsSummary, breaksSummary, mastersQualifiersCount) {
  return createElement(
    'div',
    { className: 'masters-summary' },

    // Tournaments card
    createElement(
      'div',
      { className: 'masters-summary__card' },
      h.span({ className: 'masters-summary__value' }, `${standingsSummary.tournamentsComplete}`),
      h.span({ className: 'masters-summary__label' }, 'Tournaments Completed'),
      standingsSummary.totalTournaments > 0 &&
        h.span(
          { className: 'masters-summary__sub' },
          `of ${standingsSummary.totalTournaments} scheduled`
        )
    ),

    // Players card
    createElement(
      'div',
      { className: 'masters-summary__card' },
      h.span({ className: 'masters-summary__value' }, `${standingsSummary.totalPlayers}`),
      h.span({ className: 'masters-summary__label' }, 'Players in Race'),
      h.span(
        { className: 'masters-summary__sub' },
        `Top ${mastersQualifiersCount} qualify`
      )
    ),

    // Leader card
    standingsSummary.leader &&
      createElement(
        'div',
        { className: 'masters-summary__card masters-summary__card--highlight' },
        h.span({ className: 'masters-summary__value' }, `${standingsSummary.leader.totalPoints}`),
        h.span({ className: 'masters-summary__label' }, 'Leader Points'),
        h.span({ className: 'masters-summary__sub' }, 'Current points leader')
      ),

    // Breaks card
    createElement(
      'div',
      { className: 'masters-summary__card' },
      h.span({ className: 'masters-summary__value' }, `${breaksSummary.totalBreaks}`),
      h.span({ className: 'masters-summary__label' }, `High Breaks (${breaksSummary.threshold}+)`),
      breaksSummary.centuryCount > 0 &&
        h.span(
          { className: 'masters-summary__sub masters-summary__sub--highlight' },
          `${breaksSummary.centuryCount} centuries`
        )
    ),

    // Highest break card
    breaksSummary.highestBreak > 0 &&
      createElement(
        'div',
        { className: 'masters-summary__card masters-summary__card--break' },
        h.span({ className: 'masters-summary__value' }, `${breaksSummary.highestBreak}`),
        h.span({ className: 'masters-summary__label' }, 'Season High Break'),
        h.span({ className: 'masters-summary__sub' }, 'Best of the season')
      )
  );
}

export default {
  renderMastersPage,
};
