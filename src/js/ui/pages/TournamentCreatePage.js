/**
 * Tournament Create Page
 * Page for creating a new tournament
 * Combines PlayerSelector and TournamentConfigForm components
 */

import { createElement, h, render } from '../Component.js';
import { createPlayerSelector } from '../components/PlayerSelector.js';
import { createTournamentConfigForm } from '../components/TournamentConfigForm.js';
import { createNewTournament } from '../../services/TournamentService.js';
import { getCurrentSeason, createNewSeason, getAllSeasons, setCurrentSeason } from '../../services/SeasonService.js';
import { store } from '../../store/index.js';
import { router } from '../router.js';

/**
 * @typedef {Object} TournamentCreatePageOptions
 * @property {HTMLElement} container - Container element to render into
 * @property {string} [seasonId] - Season ID to create tournament in
 */

/**
 * @typedef {Object} TournamentCreatePageState
 * @property {string[]} selectedPlayerIds - Selected player IDs
 * @property {Object|null} configData - Tournament configuration data
 * @property {boolean} isCreating - Whether tournament is being created
 * @property {string|null} error - Error message
 * @property {string} currentStep - Current wizard step (players, config, review)
 */

/**
 * Renders the Tournament Create Page
 * @param {TournamentCreatePageOptions} options - Page options
 */
export function renderTournamentCreatePage(options) {
  const { container, seasonId } = options;

  /** @type {TournamentCreatePageState} */
  let state = {
    selectedPlayerIds: [],
    configData: null,
    isCreating: false,
    error: null,
    currentStep: 'players',
  };

  /** @type {Object|null} */
  let configForm = null;

  /**
   * Gets or creates a season ID
   * @returns {Promise<string>}
   */
  async function getOrCreateSeasonId() {
    if (seasonId) {
      return seasonId;
    }
    
    const currentState = store.getState();
    if (currentState.currentSeason) {
      return currentState.currentSeason.id;
    }
    
    // Try to get current season from storage
    const currentSeason = await getCurrentSeason();
    if (currentSeason) {
      return currentSeason.id;
    }
    
    // Check if any seasons exist for the current year
    const currentYear = new Date().getFullYear();
    const existingSeasons = await getAllSeasons();
    const matchingSeason = existingSeasons.find((s) => s.year === currentYear);
    
    if (matchingSeason) {
      // Set this as the current season and return it
      await setCurrentSeason(matchingSeason.id);
      return matchingSeason.id;
    }
    
    // Create a default season if none exists for this year
    const newSeason = await createNewSeason({
      name: `${currentYear}-${currentYear + 1}`,
      year: currentYear,
    });
    
    // Set the newly created season as current
    await setCurrentSeason(newSeason.id);
    return newSeason.id;
  }

  /**
   * Handles player selection change
   * @param {string[]} ids - Selected player IDs
   */
  function handlePlayerSelectionChange(ids) {
    state.selectedPlayerIds = ids;
    updateNavigation();
  }

  /**
   * Handles config form change
   * @param {Object} data - Form data
   */
  function handleConfigChange(data) {
    state.configData = data;
    updateNavigation();
  }

  /**
   * Goes to next step
   */
  function goToNextStep() {
    if (state.currentStep === 'players') {
      // Validate player selection
      if (state.selectedPlayerIds.length < 4) {
        state.error = 'Please select at least 4 players';
        renderPage();
        return;
      }
      state.currentStep = 'config';
      state.error = null;
    } else if (state.currentStep === 'config') {
      if (configForm) {
        const validation = configForm.validate();
        if (!validation.valid) {
          return;
        }
        state.configData = configForm.getData();
      }
      state.currentStep = 'review';
      state.error = null;
    }
    renderPage();
  }

  /**
   * Goes to previous step
   */
  function goToPreviousStep() {
    if (state.currentStep === 'config') {
      state.currentStep = 'players';
    } else if (state.currentStep === 'review') {
      state.currentStep = 'config';
    }
    state.error = null;
    renderPage();
  }

  /**
   * Creates the tournament
   */
  async function createTournament() {
    if (state.isCreating) {
      return;
    }

    state.isCreating = true;
    state.error = null;
    renderPage();

    try {
      const resolvedSeasonId = await getOrCreateSeasonId();
      
      const tournament = await createNewTournament({
        name: state.configData.name,
        date: state.configData.date,
        seasonId: resolvedSeasonId,
        format: state.configData.format,
        playerIds: state.selectedPlayerIds,
        poolCount: state.configData.poolCount,
        poolFrames: state.configData.poolFrames,
        knockoutFrames: state.configData.knockoutFrames,
        finalFrames: state.configData.finalFrames,
        breakThreshold: state.configData.breakThreshold,
      });

      // Navigate to the tournament view
      router.navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      state.error = error.message;
      state.isCreating = false;
      renderPage();
    }
  }

  /**
   * Updates navigation button states
   */
  function updateNavigation() {
    // Navigation is handled by renderPage through state
  }

  /**
   * Renders the step indicator
   * @returns {HTMLElement}
   */
  function renderStepIndicator() {
    const steps = [
      { id: 'players', label: '1. Select Players' },
      { id: 'config', label: '2. Configure' },
      { id: 'review', label: '3. Review' },
    ];

    return h.nav(
      { className: 'step-indicator', 'aria-label': 'Tournament creation steps' },
      h.ol(
        { className: 'step-list' },
        ...steps.map((step) =>
          h.li(
            {
              className: `step-item ${state.currentStep === step.id ? 'step-item--active' : ''} ${
                steps.findIndex((s) => s.id === state.currentStep) > steps.findIndex((s) => s.id === step.id)
                  ? 'step-item--completed'
                  : ''
              }`,
            },
            h.span({ className: 'step-label' }, step.label)
          )
        )
      )
    );
  }

  /**
   * Renders the players step
   * @param {HTMLElement} stepContainer - Container for step content
   */
  function renderPlayersStep(stepContainer) {
    const content = createElement('div', { className: 'step-content step-content--players' });
    
    const playerContainer = createElement('div', { className: 'player-selector-container' });
    content.appendChild(playerContainer);

    stepContainer.appendChild(content);

    // Create player selector after container is in DOM
    createPlayerSelector({
      container: playerContainer,
      selectedIds: state.selectedPlayerIds,
      onSelectionChange: handlePlayerSelectionChange,
      minSelection: 4,
      maxSelection: 128,
    });
  }

  /**
   * Renders the config step
   * @param {HTMLElement} stepContainer - Container for step content
   */
  function renderConfigStep(stepContainer) {
    const content = createElement('div', { className: 'step-content step-content--config' });
    
    const formContainer = createElement('div', { className: 'config-form-container' });
    content.appendChild(formContainer);

    stepContainer.appendChild(content);

    // Create config form after container is in DOM
    configForm = createTournamentConfigForm({
      container: formContainer,
      initialValues: {
        ...state.configData,
        playerCount: state.selectedPlayerIds.length,
      },
      onChange: handleConfigChange,
      onSubmit: (data) => {
        state.configData = data;
        goToNextStep();
      },
    });
  }

  /**
   * Renders the review step
   * @param {HTMLElement} stepContainer - Container for step content
   */
  function renderReviewStep(stepContainer) {
    const content = createElement(
      'div',
      { className: 'step-content step-content--review' },
      
      h.div(
        { className: 'review-section' },
        h.h3({}, 'Tournament Details'),
        h.dl(
          { className: 'review-list' },
          h.dt({}, 'Name'),
          h.dd({}, state.configData?.name || 'Not set'),
          h.dt({}, 'Date'),
          h.dd({}, state.configData?.date || 'Not set'),
          h.dt({}, 'Format'),
          h.dd({}, state.configData?.format || 'regular')
        )
      ),

      h.div(
        { className: 'review-section' },
        h.h3({}, 'Players & Pools'),
        h.dl(
          { className: 'review-list' },
          h.dt({}, 'Players'),
          h.dd({}, `${state.selectedPlayerIds.length} selected`),
          h.dt({}, 'Pools'),
          h.dd({}, state.configData?.poolCount || 'Not set'),
          h.dt({}, 'Players per pool'),
          h.dd({}, `~${Math.ceil(state.selectedPlayerIds.length / (state.configData?.poolCount || 1))}`)
        )
      ),

      h.div(
        { className: 'review-section' },
        h.h3({}, 'Match Settings'),
        h.dl(
          { className: 'review-list' },
          h.dt({}, 'Pool matches'),
          h.dd({}, `Best of ${state.configData?.poolFrames || 3}`),
          h.dt({}, 'Knockout matches'),
          h.dd({}, `Best of ${state.configData?.knockoutFrames || 3}`),
          h.dt({}, 'Final'),
          h.dd({}, `Best of ${state.configData?.finalFrames || 5}`),
          h.dt({}, 'Break threshold'),
          h.dd({}, state.configData?.breakThreshold || 20)
        )
      ),

      state.isCreating
        ? h.div({ className: 'review-creating' }, 'Creating tournament...')
        : null
    );

    stepContainer.appendChild(content);
  }

  /**
   * Renders the navigation buttons
   * @returns {HTMLElement}
   */
  function renderNavigation() {
    const canGoBack = state.currentStep !== 'players';
    const canGoNext = state.currentStep !== 'review';
    const canCreate = state.currentStep === 'review' && !state.isCreating;

    return h.div(
      { className: 'page-navigation' },
      
      canGoBack
        ? h.button(
            {
              type: 'button',
              className: 'btn btn--secondary',
              onClick: goToPreviousStep,
              disabled: state.isCreating,
            },
            '← Back'
          )
        : h.span({}), // Spacer

      canGoNext
        ? h.button(
            {
              type: 'button',
              className: 'btn btn--primary',
              onClick: goToNextStep,
            },
            'Next →'
          )
        : null,

      canCreate
        ? h.button(
            {
              type: 'button',
              className: 'btn btn--primary btn--lg',
              onClick: createTournament,
              disabled: state.isCreating,
            },
            state.isCreating ? 'Creating...' : 'Create Tournament'
          )
        : null
    );
  }

  /**
   * Renders the page
   */
  function renderPage() {
    const stepContainer = createElement('div', { className: 'step-container' });

    // Render current step content
    switch (state.currentStep) {
      case 'players':
        renderPlayersStep(stepContainer);
        break;
      case 'config':
        renderConfigStep(stepContainer);
        break;
      case 'review':
        renderReviewStep(stepContainer);
        break;
    }

    const page = createElement(
      'div',
      { className: 'page page--tournament-create' },
      
      h.h1({}, 'Create Tournament'),

      // Error display
      state.error
        ? h.div({ className: 'alert alert--error' }, state.error)
        : null,

      // Step indicator
      renderStepIndicator(),

      // Step content
      stepContainer,

      // Navigation
      renderNavigation()
    );

    render(container, page);
  }

  // Initial render
  renderPage();
}

export default { renderTournamentCreatePage };
