/**
 * Snooker Tournament Platform
 * Main Application Entry Point
 */

import '../styles/variables.css';
import '../styles/main.css';

import { router } from './ui/router.js';
import { store, setCurrentPage, setLoading, setError } from './store/index.js';
import { getStorage, initializeStorage } from './storage/index.js';
import { createElement, h, showError, showEmpty } from './ui/Component.js';
import { renderTournamentCreatePage } from './ui/pages/TournamentCreatePage.js';
import { renderMatchEntryPage } from './ui/pages/MatchEntryPage.js';
import { renderPoolViewPage } from './ui/pages/PoolViewPage.js';
import { renderKnockoutPage } from './ui/pages/KnockoutPage.js';
import { renderTournamentResultsPage } from './ui/pages/TournamentResultsPage.js';
import { renderTournamentViewPage } from './ui/pages/TournamentViewPage.js';
import { renderMastersPage as renderMastersPageComponent } from './ui/pages/MastersPage.js';
import { renderMastersSetupPage } from './ui/pages/MastersSetupPage.js';
import { renderDataManagementPage } from './ui/pages/DataManagementPage.js';
import { renderHomePage as renderHomePageComponent } from './ui/pages/HomePage.js';
import { renderPlayersPage as renderPlayersPageComponent, resetPlayersPageState } from './ui/pages/PlayersPage.js';
import { renderSeasonsPage as renderSeasonsPageComponent, resetSeasonsPageState } from './ui/pages/SeasonsPage.js';

// ============ App Configuration ============

const APP_CONTAINER_ID = 'app';
const HEADER_NAV_ID = 'main-nav';

// ============ Page Placeholders ============
// These will be replaced with actual page components in later phases

/**
 * Renders the home page
 */
function renderHomePage() {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderHomePageComponent({ container });
}

/**
 * Renders the seasons page
 */
function renderSeasonsPage() {
  const container = document.getElementById(APP_CONTAINER_ID);
  // Reset page state when navigating to ensure fresh data
  resetSeasonsPageState();
  renderSeasonsPageComponent({ container });
}

/**
 * Renders the players page
 */
function renderPlayersPage() {
  const container = document.getElementById(APP_CONTAINER_ID);
  // Reset page state when navigating to ensure fresh data
  resetPlayersPageState();
  renderPlayersPageComponent({ container });
}

/**
 * Renders the tournament create page
 */
function renderTournamentCreate() {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderTournamentCreatePage({
    container,
  });
}

/**
 * Renders the tournament page
 * @param {Object} params - Route parameters
 */
function renderTournamentPage(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderTournamentViewPage({
    container,
    tournamentId: params.id,
  });
}

/**
 * Renders the match page
 * @param {Object} params - Route parameters
 */
function renderMatchPage(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  showEmpty(
    container,
    `Match ${params.id} - Use tournament match entry to view matches`,
    h.a({ href: '#/', className: 'btn btn--secondary' }, 'Back to Home')
  );
}

/**
 * Renders the tournament matches page
 * @param {Object} params - Route parameters
 */
function renderTournamentMatches(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderMatchEntryPage({
    container,
    tournamentId: params.id,
  });
}

/**
 * Renders the match entry page
 * @param {Object} params - Route parameters
 */
function renderMatchEntry(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderMatchEntryPage({
    container,
    tournamentId: params.id,
    matchId: params.matchId,
  });
}

/**
 * Renders the pool view page
 * @param {Object} params - Route parameters
 */
function renderPoolView(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderPoolViewPage({
    container,
    tournamentId: params.id,
    poolId: params.poolId,
  });
}

/**
 * Renders the knockout bracket page
 * @param {Object} params - Route parameters
 */
function renderKnockout(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderKnockoutPage({
    container,
    tournamentId: params.id,
  });
}

/**
 * Renders the rankings page (redirects to seasons/masters)
 */
function renderRankingsPage() {
  // Redirect to seasons page for now
  router.navigate('/seasons');
}

/**
 * Renders the Masters page for a season
 * @param {Object} params - Route parameters
 */
function renderMastersSeasonPage(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderMastersPageComponent({
    container,
    seasonId: params.seasonId,
  });
}

/**
 * Renders the Masters setup page
 * @param {Object} params - Route parameters
 */
function renderMastersSetup(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderMastersSetupPage({
    container,
    seasonId: params.seasonId,
  });
}

/**
 * Renders the data management page
 */
function renderDataManagement() {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderDataManagementPage({
    container,
  });
}

/**
 * Renders the tournament results page
 * @param {Object} params - Route parameters
 */
function renderTournamentResults(params) {
  const container = document.getElementById(APP_CONTAINER_ID);
  renderTournamentResultsPage({
    container,
    tournamentId: params.id,
  });
}

/**
 * Renders the 404 page
 * @param {string} path - Attempted path
 */
function renderNotFoundPage(path) {
  const container = document.getElementById(APP_CONTAINER_ID);
  showError(
    container,
    `Page not found: ${path}`,
    () => router.navigate('/')
  );
}

// ============ Navigation ============

/**
 * Creates the navigation header
 * @returns {HTMLElement} Navigation element
 */
function createNavigation() {
  return createElement(
    'nav',
    { id: HEADER_NAV_ID, className: 'main-nav' },
    createElement(
      'div',
      { className: 'nav-brand' },
      h.a({ href: '#/', className: 'brand-link' }, '🎱 Snooker Tournament')
    ),
    createElement(
      'ul',
      { className: 'nav-links' },
      h.li({}, h.a({ href: '#/' }, 'Home')),
      h.li({}, h.a({ href: '#/seasons' }, 'Seasons')),
      h.li({}, h.a({ href: '#/tournament/create' }, 'New Tournament')),
      h.li({}, h.a({ href: '#/players' }, 'Players')),
      h.li({}, h.a({ href: '#/rankings' }, 'Rankings'))
    )
  );
}

/**
 * Updates active navigation link
 * @param {string} currentPath - Current route path
 */
function updateActiveNav(currentPath) {
  const nav = document.getElementById(HEADER_NAV_ID);
  if (!nav) {
    return;
  }

  const links = nav.querySelectorAll('.nav-links a');
  links.forEach((link) => {
    const href = link.getAttribute('href')?.slice(1) || '/'; // Remove #
    const isActive = currentPath === href || 
      (currentPath === '' && href === '/') ||
      (href !== '/' && currentPath.startsWith(href));
    
    link.classList.toggle('active', isActive);
  });
}

// ============ App Initialization ============

/**
 * Sets up the application routes
 */
function setupRoutes() {
  router
    .on('/', renderHomePage, 'Home')
    .on('/seasons', renderSeasonsPage, 'Seasons')
    .on('/season/:seasonId/masters', renderMastersSeasonPage, 'Masters Standings')
    .on('/season/:seasonId/masters/setup', renderMastersSetup, 'Masters Setup')
    .on('/players', renderPlayersPage, 'Players')
    .on('/rankings', renderRankingsPage, 'Rankings')
    .on('/data', renderDataManagement, 'Data Management')
    .on('/tournament/create', renderTournamentCreate, 'Create Tournament')
    .on('/tournament/:id', renderTournamentPage, 'Tournament')
    .on('/tournament/:id/matches', renderTournamentMatches, 'Tournament Matches')
    .on('/tournament/:id/match/:matchId', renderMatchEntry, 'Match Entry')
    .on('/tournament/:id/pool/:poolId', renderPoolView, 'Pool Standings')
    .on('/tournament/:id/knockout', renderKnockout, 'Knockout Brackets')
    .on('/tournament/:id/results', renderTournamentResults, 'Tournament Results')
    .on('/match/:id', renderMatchPage, 'Match')
    .notFound(renderNotFoundPage);

  // Update navigation on route change
  router.afterEach((_match) => {
    const path = router.getCurrentPath();
    store.dispatch(setCurrentPage(path));
    updateActiveNav(path);
  });
}

/**
 * Loads initial data from storage
 */
async function loadInitialData() {
  store.dispatch(setLoading(true));

  try {
    const storage = getStorage();
    
    // Load players
    const players = await storage.getItem('players');
    if (players) {
      store.dispatch({ type: 'SET_PLAYERS', payload: players });
    }

    // Load seasons
    const seasons = await storage.getItem('seasons');
    if (seasons) {
      store.dispatch({ type: 'SET_SEASONS', payload: seasons });
    }

    // Load current season if set
    const currentSeasonId = await storage.getItem('currentSeasonId');
    if (currentSeasonId && seasons) {
      const currentSeason = seasons.find((s) => s.id === currentSeasonId);
      if (currentSeason) {
        store.dispatch({ type: 'SET_CURRENT_SEASON', payload: currentSeason });
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load initial data:', error);
    store.dispatch(setError('Failed to load data from storage'));
  } finally {
    store.dispatch(setLoading(false));
  }
}

/**
 * Creates the app shell
 */
function createAppShell() {
  const root = document.getElementById(APP_CONTAINER_ID);
  if (!root) {
    // eslint-disable-next-line no-console
    console.error('App container not found');
    return;
  }

  // Clear existing content
  root.innerHTML = '';

  // Create app structure
  const header = createElement('header', { className: 'app-header' }, createNavigation());
  
  const main = createElement('main', { id: APP_CONTAINER_ID, className: 'app-main' });
  
  const footer = createElement(
    'footer',
    { className: 'app-footer' },
    h.p({}, `© ${new Date().getFullYear()} Snooker Tournament Platform`)
  );

  // We need to rename the main container ID to avoid conflict
  // Let's use a wrapper approach
  const wrapper = createElement(
    'div',
    { className: 'app-wrapper' },
    header,
    main,
    footer
  );

  // Replace root content with wrapper
  const parent = root.parentNode;
  parent.replaceChild(wrapper, root);

  // Update the main element to have the app ID for route rendering
  main.id = APP_CONTAINER_ID;
}

/**
 * Initializes the application
 */
async function initApp() {
  // Initialize storage first
  await initializeStorage();

  // Create the app shell first
  createAppShell();

  // Set up routes
  setupRoutes();

  // Load initial data
  await loadInitialData();

  // Start the router
  router.start();

  // eslint-disable-next-line no-console
  console.log('🎱 Snooker Tournament Platform initialized');
}

// ============ Start Application ============

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
