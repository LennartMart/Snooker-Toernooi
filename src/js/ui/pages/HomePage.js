/**
 * Home Page
 * Main landing page with season overview and quick links to active tournaments
 */

import { render, createElement, h, showLoading, showError } from '../Component.js';
import { store, setLoading, setError } from '../../store/index.js';
import { router } from '../router.js';
import { getAllSeasons, getCurrentSeason, getSeasonTournamentIds } from '../../services/SeasonService.js';
import { getTournamentsBySeason } from '../../services/TournamentService.js';
import { formatDate } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} HomePageProps
 * @property {HTMLElement} container - Container element
 */

/**
 * Page state
 */
let pageState = {
  currentSeason: null,
  seasons: [],
  tournaments: [],
  activeTournament: null,
};

/**
 * Renders the welcome hero section
 * @returns {HTMLElement}
 */
function renderHero() {
  return createElement(
    'section',
    { className: 'home-hero' },
    createElement(
      'div',
      { className: 'home-hero__content' },
      h.h1({ className: 'home-hero__title' }, '🎱 Snooker Tournament Platform'),
      h.p({ className: 'home-hero__subtitle' }, 
        'Organize and track your snooker tournaments with pool stages, knockout brackets, and season standings.'
      ),
      createElement(
        'div',
        { className: 'home-hero__actions' },
        h.a({ href: '#/tournament/create', className: 'btn btn--primary btn--lg' }, 'Create Tournament'),
        h.a({ href: '#/seasons', className: 'btn btn--secondary btn--lg' }, 'View Seasons')
      )
    )
  );
}

/**
 * Renders the current season card
 * @returns {HTMLElement|null}
 */
function renderCurrentSeason() {
  const { currentSeason, tournaments } = pageState;
  
  if (!currentSeason) {
    return createElement(
      'section',
      { className: 'home-section home-section--season' },
      h.h2({}, 'Current Season'),
      createElement(
        'div',
        { className: 'home-card home-card--empty' },
        h.p({}, 'No active season'),
        h.a({ href: '#/seasons', className: 'btn btn--secondary' }, 'Create a Season')
      )
    );
  }
  
  const completedTournaments = tournaments.filter((t) => t.status === 'completed').length;
  const activeTournaments = tournaments.filter((t) => t.status !== 'completed' && t.status !== 'created').length;
  
  return createElement(
    'section',
    { className: 'home-section home-section--season' },
    h.h2({}, 'Current Season'),
    createElement(
      'a',
      { href: `#/season/${currentSeason.id}/masters`, className: 'home-card home-card--season' },
      createElement(
        'div',
        { className: 'home-card__header' },
        h.h3({}, currentSeason.name),
        createElement(
          'span',
          { className: 'home-card__badge' },
          'Active'
        )
      ),
      createElement(
        'div',
        { className: 'home-card__stats' },
        createElement(
          'div',
          { className: 'home-card__stat' },
          h.span({ className: 'home-card__stat-value' }, String(tournaments.length)),
          h.span({ className: 'home-card__stat-label' }, 'Tournaments')
        ),
        createElement(
          'div',
          { className: 'home-card__stat' },
          h.span({ className: 'home-card__stat-value' }, String(completedTournaments)),
          h.span({ className: 'home-card__stat-label' }, 'Completed')
        ),
        createElement(
          'div',
          { className: 'home-card__stat' },
          h.span({ className: 'home-card__stat-value' }, String(activeTournaments)),
          h.span({ className: 'home-card__stat-label' }, 'In Progress')
        )
      ),
      h.span({ className: 'home-card__link' }, 'View Standings →')
    )
  );
}

/**
 * Renders active tournament card
 * @returns {HTMLElement|null}
 */
function renderActiveTournament() {
  const { activeTournament } = pageState;
  
  if (!activeTournament) {
    return null;
  }
  
  const statusLabels = {
    pool: 'Pool Stage',
    knockout: 'Knockout Stage',
    created: 'Not Started',
  };
  
  const statusLabel = statusLabels[activeTournament.status] || activeTournament.status;
  
  return createElement(
    'section',
    { className: 'home-section home-section--active' },
    h.h2({}, 'Active Tournament'),
    createElement(
      'a',
      { 
        href: `#/tournament/${activeTournament.id}`, 
        className: 'home-card home-card--tournament home-card--highlight' 
      },
      createElement(
        'div',
        { className: 'home-card__header' },
        h.h3({}, activeTournament.name),
        createElement(
          'span',
          { className: `home-card__badge home-card__badge--${activeTournament.status}` },
          statusLabel
        )
      ),
      createElement(
        'div',
        { className: 'home-card__meta' },
        h.span({}, formatDate(activeTournament.date)),
        h.span({}, `${activeTournament.playerIds?.length || 0} players`)
      ),
      createElement(
        'div',
        { className: 'home-card__actions' },
        h.span({ className: 'btn btn--primary' }, 'Continue →')
      )
    )
  );
}

/**
 * Renders recent tournaments list
 * @returns {HTMLElement}
 */
function renderRecentTournaments() {
  const { tournaments } = pageState;
  
  // Sort by date descending
  const sortedTournaments = [...tournaments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  if (sortedTournaments.length === 0) {
    return createElement(
      'section',
      { className: 'home-section home-section--recent' },
      h.h2({}, 'Recent Tournaments'),
      createElement(
        'div',
        { className: 'home-card home-card--empty' },
        h.p({}, 'No tournaments yet'),
        h.a({ href: '#/tournament/create', className: 'btn btn--secondary' }, 'Create your first tournament')
      )
    );
  }
  
  return createElement(
    'section',
    { className: 'home-section home-section--recent' },
    h.h2({}, 'Recent Tournaments'),
    createElement(
      'ul',
      { className: 'tournament-list' },
      ...sortedTournaments.map((tournament) =>
        createElement(
          'li',
          { className: 'tournament-list__item' },
          h.a(
            { 
              href: `#/tournament/${tournament.id}`,
              className: 'tournament-list__link',
            },
            createElement(
              'div',
              { className: 'tournament-list__info' },
              h.span({ className: 'tournament-list__name' }, tournament.name),
              h.span({ className: 'tournament-list__date' }, formatDate(tournament.date))
            ),
            createElement(
              'span',
              { className: `tournament-list__status tournament-list__status--${tournament.status}` },
              tournament.status === 'completed' ? '✓ Completed' : tournament.status
            )
          )
        )
      )
    ),
    tournaments.length > 5
      ? h.a({ href: '#/seasons', className: 'btn btn--text' }, 'View all tournaments →')
      : null
  );
}

/**
 * Renders quick actions grid
 * @returns {HTMLElement}
 */
function renderQuickActions() {
  const actions = [
    { 
      icon: '🏆', 
      title: 'New Tournament', 
      description: 'Create a new tournament',
      href: '#/tournament/create',
    },
    { 
      icon: '👥', 
      title: 'Players', 
      description: 'Manage player profiles',
      href: '#/players',
    },
    { 
      icon: '📅', 
      title: 'Seasons', 
      description: 'View all seasons',
      href: '#/seasons',
    },
    { 
      icon: '💾', 
      title: 'Data', 
      description: 'Import & export data',
      href: '#/data',
    },
  ];
  
  return createElement(
    'section',
    { className: 'home-section home-section--actions' },
    h.h2({}, 'Quick Actions'),
    createElement(
      'div',
      { className: 'quick-actions-grid' },
      ...actions.map((action) =>
        h.a(
          { href: action.href, className: 'quick-action-card' },
          h.span({ className: 'quick-action-card__icon' }, action.icon),
          h.span({ className: 'quick-action-card__title' }, action.title),
          h.span({ className: 'quick-action-card__description' }, action.description)
        )
      )
    )
  );
}

/**
 * Renders the page content
 */
function renderHomePageContent() {
  const container = document.getElementById('app');
  
  render(
    container,
    createElement(
      'div',
      { className: 'page page--home' },
      renderHero(),
      
      createElement(
        'div',
        { className: 'home-grid' },
        // Main content
        createElement(
          'div',
          { className: 'home-main' },
          renderActiveTournament(),
          renderCurrentSeason(),
          renderRecentTournaments()
        ),
        
        // Sidebar
        createElement(
          'aside',
          { className: 'home-sidebar' },
          renderQuickActions()
        )
      )
    )
  );
}

/**
 * Renders the Home page
 * @param {HomePageProps} props - Page props
 */
export async function renderHomePage({ container }) {
  showLoading(container, 'Loading...');
  store.dispatch(setLoading(true));
  
  try {
    // Load seasons
    const seasons = await getAllSeasons();
    const currentSeasonData = await getCurrentSeason();
    const currentSeasonId = currentSeasonData?.id || null;
    
    // Find current season
    const currentSeason = currentSeasonId 
      ? seasons.find((s) => s.id === currentSeasonId)
      : seasons[0]; // Default to first season if no current set
    
    // Load tournaments for current season
    let tournaments = [];
    if (currentSeason) {
      const tournamentIds = await getSeasonTournamentIds(currentSeason.id);
      tournaments = await getTournamentsBySeason(currentSeason.id, tournamentIds);
    }
    
    // Find active tournament (not completed, most recent)
    const activeTournament = tournaments
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;
    
    pageState = {
      currentSeason,
      seasons,
      tournaments,
      activeTournament,
    };
    
    renderHomePageContent();
  } catch (error) {
    store.dispatch(setError(error.message));
    showError(container, `Failed to load data: ${error.message}`, () => {
      router.navigate('/');
    });
  } finally {
    store.dispatch(setLoading(false));
  }
}

export default {
  renderHomePage,
};
