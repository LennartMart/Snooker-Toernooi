/**
 * Masters Setup Page
 * Allows selecting qualifiers, handling adjustments and withdrawals for Masters tournament
 */

import { render, createElement, h, showLoading, showError, showEmpty } from '../Component.js';
import { store, setLoading, setError } from '../../store/index.js';
import { router } from '../router.js';
import { getStorage } from '../../storage/index.js';
import { loadSeason } from '../../services/SeasonService.js';
import { 
  getMastersField, 
  processWithdrawal, 
  validateMastersField,
  createMastersTournamentConfig,
  getMastersPoolSeeding,
  getMastersQualificationSummary,
  MASTERS_FIELD_SIZE,
} from '../../services/MastersQualifierService.js';
import { createNewTournament } from '../../services/TournamentService.js';

/**
 * @typedef {Object} MastersSetupPageProps
 * @property {HTMLElement} container - Container element
 * @property {string} seasonId - Season ID
 */

/**
 * Masters setup page state
 */
let pageState = {
  season: null,
  mastersField: null,
  withdrawals: [],
  tournamentName: '',
  tournamentDate: '',
  isSubmitting: false,
  validationErrors: [],
};

/**
 * Resets the page state
 */
function resetState() {
  pageState = {
    season: null,
    mastersField: null,
    withdrawals: [],
    tournamentName: 'Masters Championship',
    tournamentDate: new Date().toISOString().split('T')[0],
    isSubmitting: false,
    validationErrors: [],
  };
}

/**
 * Renders the qualifier list with withdrawal options
 * @param {MastersQualifier[]} qualifiers - Qualified players
 * @param {Function} onWithdraw - Withdrawal callback
 * @returns {HTMLElement}
 */
function renderQualifierList(qualifiers, onWithdraw) {
  return createElement(
    'div',
    { className: 'masters-qualifier-list' },
    h.h3({}, 'Qualified Players'),
    createElement(
      'table',
      { className: 'qualifiers-table' },
      createElement(
        'thead',
        {},
        createElement(
          'tr',
          {},
          h.th({}, 'Seed'),
          h.th({}, 'Player'),
          h.th({}, 'Points'),
          h.th({}, 'Tournaments'),
          h.th({}, 'Status'),
          h.th({}, 'Actions')
        )
      ),
      createElement(
        'tbody',
        {},
        ...qualifiers.map((qualifier, index) => {
          const isWithdrawn = pageState.withdrawals.some(
            (w) => w.playerId === qualifier.playerId
          );
          
          return createElement(
            'tr',
            { 
              className: `qualifier-row ${isWithdrawn ? 'qualifier-row--withdrawn' : ''}`,
              'data-player-id': qualifier.playerId,
            },
            h.td({ className: 'seed-cell' }, String(index + 1)),
            h.td({ className: 'player-cell' }, qualifier.playerName),
            h.td({ className: 'points-cell' }, String(qualifier.totalPoints)),
            h.td({ className: 'tournaments-cell' }, String(qualifier.tournamentsPlayed)),
            h.td(
              { className: 'status-cell' },
              createElement(
                'span',
                { 
                  className: `status-badge status-badge--${qualifier.status}`,
                },
                qualifier.status === 'withdrawn' ? 'Withdrawn' : 'Qualified'
              )
            ),
            h.td(
              { className: 'actions-cell' },
              isWithdrawn
                ? h.button(
                    { 
                      className: 'btn btn--sm btn--secondary',
                      onClick: () => undoWithdrawal(qualifier.playerId),
                    },
                    'Undo'
                  )
                : h.button(
                    { 
                      className: 'btn btn--sm btn--danger',
                      onClick: () => onWithdraw(qualifier.playerId),
                    },
                    'Withdraw'
                  )
            )
          );
        })
      )
    )
  );
}

/**
 * Renders the reserve list
 * @param {MastersQualifier[]} reserves - Reserve players
 * @returns {HTMLElement}
 */
function renderReserveList(reserves) {
  if (reserves.length === 0) {
    return createElement(
      'div',
      { className: 'masters-reserve-list masters-reserve-list--empty' },
      h.h3({}, 'Reserve Players'),
      h.p({ className: 'text-muted' }, 'No reserve players available')
    );
  }
  
  return createElement(
    'div',
    { className: 'masters-reserve-list' },
    h.h3({}, 'Reserve Players'),
    createElement(
      'table',
      { className: 'reserves-table' },
      createElement(
        'thead',
        {},
        createElement(
          'tr',
          {},
          h.th({}, 'Pos'),
          h.th({}, 'Player'),
          h.th({}, 'Points'),
          h.th({}, 'Status')
        )
      ),
      createElement(
        'tbody',
        {},
        ...reserves.map((reserve) =>
          createElement(
            'tr',
            { className: 'reserve-row' },
            h.td({}, String(reserve.position)),
            h.td({}, reserve.playerName),
            h.td({}, String(reserve.totalPoints)),
            h.td(
              {},
              createElement(
                'span',
                { className: `status-badge status-badge--${reserve.status}` },
                reserve.status === 'qualified' ? 'Promoted' : 'Reserve'
              )
            )
          )
        )
      )
    )
  );
}

/**
 * Renders the pool preview based on seeding
 * @param {Object} pools - Pool assignments
 * @returns {HTMLElement}
 */
function renderPoolPreview(pools) {
  const poolNames = ['A', 'B', 'C', 'D'];
  const poolKeys = ['poolA', 'poolB', 'poolC', 'poolD'];
  
  return createElement(
    'div',
    { className: 'masters-pool-preview' },
    h.h3({}, 'Pool Preview (Seeded)'),
    createElement(
      'div',
      { className: 'pool-preview-grid' },
      ...poolKeys.map((key, index) =>
        createElement(
          'div',
          { className: 'pool-preview-card' },
          h.h4({}, `Pool ${poolNames[index]}`),
          createElement(
            'ul',
            { className: 'pool-player-list' },
            ...pools[key].map((player) =>
              h.li(
                { className: 'pool-player-item' },
                h.span({ className: 'player-seed' }, `#${player.position}`),
                h.span({ className: 'player-name' }, player.playerName)
              )
            )
          )
        )
      )
    )
  );
}

/**
 * Renders withdrawal log
 * @returns {HTMLElement}
 */
function renderWithdrawalLog() {
  if (pageState.withdrawals.length === 0) {
    return null;
  }
  
  return createElement(
    'div',
    { className: 'withdrawal-log' },
    h.h3({}, 'Withdrawals'),
    createElement(
      'ul',
      { className: 'withdrawal-list' },
      ...pageState.withdrawals.map((w) =>
        h.li(
          { className: 'withdrawal-item' },
          h.span({ className: 'withdrawal-player' }, w.playerName),
          h.span({ className: 'withdrawal-reason' }, w.reason || 'No reason given')
        )
      )
    )
  );
}

/**
 * Renders tournament setup form
 * @returns {HTMLElement}
 */
function renderTournamentForm() {
  return createElement(
    'div',
    { className: 'masters-tournament-form' },
    h.h3({}, 'Tournament Details'),
    createElement(
      'div',
      { className: 'form-group' },
      h.label({ htmlFor: 'tournament-name' }, 'Tournament Name'),
      h.input({
        type: 'text',
        id: 'tournament-name',
        className: 'form-control',
        value: pageState.tournamentName,
        onChange: (e) => {
          pageState.tournamentName = e.target.value;
        },
      })
    ),
    createElement(
      'div',
      { className: 'form-group' },
      h.label({ htmlFor: 'tournament-date' }, 'Tournament Date'),
      h.input({
        type: 'date',
        id: 'tournament-date',
        className: 'form-control',
        value: pageState.tournamentDate,
        onChange: (e) => {
          pageState.tournamentDate = e.target.value;
        },
      })
    )
  );
}

/**
 * Renders validation errors
 * @returns {HTMLElement|null}
 */
function renderValidationErrors() {
  if (pageState.validationErrors.length === 0) {
    return null;
  }
  
  return createElement(
    'div',
    { className: 'validation-errors alert alert--danger' },
    h.h4({}, 'Cannot Create Tournament'),
    createElement(
      'ul',
      {},
      ...pageState.validationErrors.map((error) => h.li({}, error))
    )
  );
}

/**
 * Shows withdrawal dialog
 * @param {string} playerId - Player ID
 */
function showWithdrawalDialog(playerId) {
  const qualifier = pageState.mastersField.qualifiers.find(
    (q) => q.playerId === playerId
  );
  
  if (!qualifier) {
    return;
  }
  
  // Simple prompt for reason (in production, use a modal)
  const reason = window.prompt(
    `Withdraw ${qualifier.playerName} from Masters?\n\nEnter reason (optional):`,
    ''
  );
  
  if (reason !== null) {
    processPlayerWithdrawal(playerId, reason);
  }
}

/**
 * Processes a player withdrawal
 * @param {string} playerId - Player ID
 * @param {string} reason - Withdrawal reason
 */
function processPlayerWithdrawal(playerId, reason) {
  const qualifier = pageState.mastersField.qualifiers.find(
    (q) => q.playerId === playerId
  );
  
  if (!qualifier) {
    return;
  }
  
  pageState.withdrawals.push({
    playerId,
    playerName: qualifier.playerName,
    reason: reason || 'Withdrawn',
  });
  
  // Update the field
  pageState.mastersField = processWithdrawal(
    pageState.mastersField,
    playerId,
    reason
  );
  
  // Re-render
  renderMastersSetupPageContent();
}

/**
 * Undoes a withdrawal
 * @param {string} playerId - Player ID
 */
function undoWithdrawal(playerId) {
  // Remove from withdrawals list
  pageState.withdrawals = pageState.withdrawals.filter(
    (w) => w.playerId !== playerId
  );
  
  // Reload the field from season
  pageState.mastersField = getMastersField(pageState.season);
  
  // Re-process remaining withdrawals
  for (const withdrawal of pageState.withdrawals) {
    pageState.mastersField = processWithdrawal(
      pageState.mastersField,
      withdrawal.playerId,
      withdrawal.reason
    );
  }
  
  // Re-render
  renderMastersSetupPageContent();
}

/**
 * Validates the current setup
 * @returns {boolean}
 */
function validateSetup() {
  const errors = [];
  
  // Check tournament name
  if (!pageState.tournamentName.trim()) {
    errors.push('Tournament name is required');
  }
  
  // Check tournament date
  if (!pageState.tournamentDate) {
    errors.push('Tournament date is required');
  }
  
  // Validate field
  const fieldValidation = validateMastersField(pageState.mastersField);
  if (!fieldValidation.valid) {
    errors.push(...fieldValidation.errors);
  }
  
  pageState.validationErrors = errors;
  return errors.length === 0;
}

/**
 * Creates the Masters tournament
 */
async function handleCreateTournament() {
  if (!validateSetup()) {
    renderMastersSetupPageContent();
    return;
  }
  
  pageState.isSubmitting = true;
  renderMastersSetupPageContent();
  
  try {
    const config = createMastersTournamentConfig(pageState.mastersField, {
      name: pageState.tournamentName,
      seasonId: pageState.season.id,
      date: new Date(pageState.tournamentDate),
    });
    
    const tournament = await createNewTournament(config);
    
    // Save tournament
    const storage = getStorage();
    const tournaments = (await storage.getItem('tournaments')) || [];
    tournaments.push(tournament);
    await storage.setItem('tournaments', tournaments);
    
    // Navigate to tournament
    router.navigate(`/tournament/${tournament.id}/matches`);
  } catch (error) {
    pageState.validationErrors = [error.message];
    pageState.isSubmitting = false;
    renderMastersSetupPageContent();
  }
}

/**
 * Renders the page content
 */
function renderMastersSetupPageContent() {
  const container = document.getElementById('app');
  
  if (!pageState.season || !pageState.mastersField) {
    return;
  }
  
  // Get pool preview
  const poolSeeding = pageState.mastersField.qualifiers.length === MASTERS_FIELD_SIZE
    ? getMastersPoolSeeding(pageState.mastersField.qualifiers)
    : null;
  
  render(
    container,
    createElement(
      'div',
      { className: 'page page--masters-setup' },
      // Header
      createElement(
        'header',
        { className: 'page-header' },
        h.h1({}, 'Masters Setup'),
        h.p({ className: 'lead' }, `Season: ${pageState.season.name}`),
        h.a({ href: `#/season/${pageState.season.id}/masters`, className: 'btn btn--secondary' }, '← Back to Standings')
      ),
      
      // Summary
      createElement(
        'section',
        { className: 'masters-setup-summary' },
        createElement(
          'div',
          { className: 'summary-cards' },
          createElement(
            'div',
            { className: 'summary-card' },
            h.span({ className: 'summary-value' }, String(pageState.mastersField.qualifiers.length)),
            h.span({ className: 'summary-label' }, 'Qualified')
          ),
          createElement(
            'div',
            { className: 'summary-card' },
            h.span({ className: 'summary-value' }, String(pageState.mastersField.reserves.length)),
            h.span({ className: 'summary-label' }, 'Reserves')
          ),
          createElement(
            'div',
            { className: 'summary-card' },
            h.span({ className: 'summary-value' }, String(pageState.withdrawals.length)),
            h.span({ className: 'summary-label' }, 'Withdrawals')
          )
        )
      ),
      
      // Validation errors
      renderValidationErrors(),
      
      // Main content
      createElement(
        'div',
        { className: 'masters-setup-content' },
        // Left column: Qualifiers and Reserves
        createElement(
          'div',
          { className: 'masters-setup-players' },
          renderQualifierList(pageState.mastersField.qualifiers, showWithdrawalDialog),
          renderReserveList(pageState.mastersField.reserves),
          renderWithdrawalLog()
        ),
        
        // Right column: Pool Preview and Form
        createElement(
          'div',
          { className: 'masters-setup-config' },
          poolSeeding ? renderPoolPreview(poolSeeding) : null,
          renderTournamentForm(),
          
          // Create button
          createElement(
            'div',
            { className: 'masters-setup-actions' },
            h.button(
              {
                className: 'btn btn--primary btn--lg',
                onClick: handleCreateTournament,
                disabled: pageState.isSubmitting,
              },
              pageState.isSubmitting ? 'Creating...' : 'Create Masters Tournament'
            )
          )
        )
      )
    )
  );
}

/**
 * Renders the Masters setup page
 * @param {MastersSetupPageProps} props - Page props
 */
export async function renderMastersSetupPage({ container, seasonId }) {
  resetState();
  showLoading(container, 'Loading season data...');
  store.dispatch(setLoading(true));
  
  try {
    // Load season
    const season = await loadSeason(seasonId);
    
    if (!season) {
      showError(container, 'Season not found', () => {
        router.navigate('/seasons');
      });
      return;
    }
    
    pageState.season = season;
    
    // Get qualification summary
    const summary = getMastersQualificationSummary(season);
    
    if (!summary.canRunMasters) {
      showEmpty(
        container,
        `Not enough players for Masters. Need ${MASTERS_FIELD_SIZE}, have ${summary.totalPlayers}`,
        h.a({ href: `#/season/${seasonId}/masters`, className: 'btn btn--secondary' }, 'Back to Standings')
      );
      return;
    }
    
    // Get Masters field
    pageState.mastersField = getMastersField(season);
    pageState.tournamentName = `${season.name} - Masters Championship`;
    
    // Render content
    renderMastersSetupPageContent();
  } catch (error) {
    store.dispatch(setError(error.message));
    showError(container, `Failed to load season: ${error.message}`, () => {
      router.navigate('/seasons');
    });
  } finally {
    store.dispatch(setLoading(false));
  }
}

export default {
  renderMastersSetupPage,
};
