/**
 * Seasons Page
 * Lists all seasons and their tournaments
 */

import { render, createElement, h, showLoading, showError } from '../Component.js';
import { store, setLoading, setError } from '../../store/index.js';
import { router } from '../router.js';
import { getAllSeasons, getCurrentSeason, getSeasonTournamentIds } from '../../services/SeasonService.js';
import { getTournamentsBySeason } from '../../services/TournamentService.js';
import { formatDate } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} SeasonsPageProps
 * @property {HTMLElement} container - Container element
 */

/**
 * Page state
 */
let pageState = {
  seasons: [],
  currentSeasonId: null,
  tournamentsBySeasonId: {},
};

/**
 * Renders the page header
 * @returns {HTMLElement}
 */
function renderHeader() {
  return createElement(
    'header',
    { className: 'seasons-page__header' },
    h.h1({ className: 'seasons-page__title' }, 'Seasons'),
    h.p({ className: 'seasons-page__subtitle' }, 'Manage your snooker seasons and tournaments'),
    createElement(
      'div',
      { className: 'seasons-page__actions' },
      h.a({ href: '#/tournament/create', className: 'btn btn--primary' }, '+ Create Tournament')
    )
  );
}

/**
 * Renders a tournament card
 * @param {Object} tournament - Tournament data
 * @returns {HTMLElement}
 */
function renderTournamentCard(tournament) {
  const statusClass = tournament.status === 'completed' 
    ? 'tournament-card--completed' 
    : tournament.status === 'pool_stage' || tournament.status === 'knockout'
      ? 'tournament-card--active'
      : 'tournament-card--pending';

  const statusLabel = tournament.status === 'completed' 
    ? 'Completed' 
    : tournament.status === 'pool_stage' 
      ? 'Pool Stage'
      : tournament.status === 'knockout'
        ? 'Knockout'
        : 'Pending';

  return createElement(
    'a',
    { 
      href: `#/tournament/${tournament.id}`,
      className: `tournament-card ${statusClass}`,
    },
    createElement(
      'div',
      { className: 'tournament-card__header' },
      h.h4({ className: 'tournament-card__name' }, tournament.name),
      h.span({ className: 'tournament-card__status' }, statusLabel)
    ),
    createElement(
      'div',
      { className: 'tournament-card__meta' },
      h.span({ className: 'tournament-card__date' }, formatDate(tournament.date)),
      h.span({ className: 'tournament-card__players' }, `${tournament.playerIds?.length || 0} players`),
      h.span({ className: 'tournament-card__format' }, tournament.format === 'masters' ? 'Masters' : 'Regular')
    )
  );
}

/**
 * Renders a season card with its tournaments
 * @param {Object} season - Season data
 * @returns {HTMLElement}
 */
function renderSeasonCard(season) {
  const tournaments = pageState.tournamentsBySeasonId[season.id] || [];
  const isCurrent = season.id === pageState.currentSeasonId;
  
  return createElement(
    'section',
    { className: `season-card ${isCurrent ? 'season-card--current' : ''}` },
    createElement(
      'header',
      { className: 'season-card__header' },
      createElement(
        'div',
        { className: 'season-card__title-row' },
        h.h3({ className: 'season-card__name' }, season.name),
        isCurrent 
          ? h.span({ className: 'season-card__badge' }, 'Current')
          : null
      ),
      createElement(
        'div',
        { className: 'season-card__stats' },
        h.span({}, `${tournaments.length} tournament${tournaments.length !== 1 ? 's' : ''}`),
        tournaments.length > 0
          ? h.span({}, ` • ${tournaments.filter((t) => t.status === 'completed').length} completed`)
          : null
      )
    ),
    tournaments.length > 0
      ? createElement(
          'div',
          { className: 'season-card__tournaments' },
          ...tournaments.map(renderTournamentCard)
        )
      : createElement(
          'div',
          { className: 'season-card__empty' },
          h.p({ className: 'text-muted' }, 'No tournaments in this season yet'),
          h.a({ href: '#/tournament/create', className: 'btn btn--secondary btn--sm' }, 'Create Tournament')
        ),
    isCurrent && tournaments.length > 0
      ? createElement(
          'footer',
          { className: 'season-card__footer' },
          h.a({ href: `#/season/${season.id}/masters`, className: 'btn btn--secondary btn--sm' }, 'View Masters Standings')
        )
      : null
  );
}

/**
 * Renders empty state
 * @returns {HTMLElement}
 */
function renderEmptyState() {
  return createElement(
    'div',
    { className: 'seasons-page__empty' },
    h.p({ className: 'text-muted' }, 'No seasons yet.'),
    h.p({}, 'Create your first tournament to automatically start a new season.'),
    h.a({ href: '#/tournament/create', className: 'btn btn--primary' }, 'Create Tournament')
  );
}

/**
 * Renders the seasons list
 * @returns {HTMLElement}
 */
function renderSeasonsList() {
  const { seasons } = pageState;

  if (seasons.length === 0) {
    return renderEmptyState();
  }

  // Sort seasons by year descending
  const sortedSeasons = [...seasons].sort((a, b) => b.year - a.year);

  return createElement(
    'div',
    { className: 'seasons-page__list' },
    ...sortedSeasons.map(renderSeasonCard)
  );
}

/**
 * Renders the page content
 */
function renderSeasonsPageContent() {
  const container = document.getElementById('app');
  if (!container) {
    return;
  }

  render(
    container,
    createElement(
      'div',
      { className: 'page page--seasons seasons-page' },
      renderHeader(),
      renderSeasonsList()
    )
  );
}

/**
 * Renders the Seasons page
 * @param {SeasonsPageProps} options - Page options
 */
export async function renderSeasonsPage({ container }) {
  showLoading(container, 'Loading seasons...');
  store.dispatch(setLoading(true));

  try {
    // Load all seasons
    const seasons = await getAllSeasons();
    
    // Get current season
    const currentSeasonData = await getCurrentSeason();
    const currentSeasonId = currentSeasonData?.id || null;

    // Load tournaments for each season
    const tournamentsBySeasonId = {};
    for (const season of seasons) {
      const tournamentIds = await getSeasonTournamentIds(season.id);
      if (tournamentIds && tournamentIds.length > 0) {
        tournamentsBySeasonId[season.id] = await getTournamentsBySeason(season.id, tournamentIds);
      } else {
        tournamentsBySeasonId[season.id] = [];
      }
    }

    pageState = {
      seasons,
      currentSeasonId,
      tournamentsBySeasonId,
    };

    renderSeasonsPageContent();
  } catch (error) {
    store.dispatch(setError(error.message));
    showError(container, `Failed to load seasons: ${error.message}`, () => {
      router.navigate('/');
    });
  } finally {
    store.dispatch(setLoading(false));
  }
}

/**
 * Resets the page state (call when navigating away)
 */
export function resetSeasonsPageState() {
  pageState = {
    seasons: [],
    currentSeasonId: null,
    tournamentsBySeasonId: {},
  };
}

export default {
  renderSeasonsPage,
  resetSeasonsPageState,
};
