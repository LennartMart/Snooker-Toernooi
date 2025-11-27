/**
 * Tournament Configuration Form Component
 * Form for configuring tournament settings (name, date, format, players, pools, frames)
 */

import { createElement, h, render } from '../Component.js';
import { TournamentFormat } from '../../models/Tournament.js';
import {
  getDefaultConfig,
  suggestPoolCounts,
  calculatePoolMatches,
  calculateKnockoutSize,
} from '../../services/TournamentConfigService.js';
import { formatDateInput } from '../../utils/dateFormatter.js';

/**
 * @typedef {Object} TournamentConfigFormOptions
 * @property {HTMLElement} container - Container element to render into
 * @property {function(Object): void} [onSubmit] - Callback when form is submitted
 * @property {function(Object): void} [onChange] - Callback when config changes
 * @property {Object} [initialValues] - Initial form values
 */

/**
 * @typedef {Object} TournamentConfigFormState
 * @property {string} name - Tournament name
 * @property {string} date - Tournament date
 * @property {string} format - Tournament format (regular/masters)
 * @property {number} playerCount - Number of players
 * @property {number} poolCount - Number of pools
 * @property {number} poolFrames - Best of N for pool matches
 * @property {number} knockoutFrames - Best of N for knockout matches
 * @property {number} finalFrames - Best of N for finals
 * @property {number} breakThreshold - Minimum break to record
 * @property {string[]} errors - Validation errors
 * @property {boolean} isSubmitting - Submission state
 */

/**
 * Creates a Tournament Configuration Form component
 * @param {TournamentConfigFormOptions} options - Component options
 * @returns {Object} Component API
 */
export function createTournamentConfigForm(options) {
  const { container, onSubmit, onChange, initialValues = {} } = options;

  // Get default values based on format
  const defaultConfig = getDefaultConfig(initialValues.format || TournamentFormat.REGULAR);

  /** @type {TournamentConfigFormState} */
  let state = {
    name: initialValues.name || '',
    date: initialValues.date || formatDateInput(new Date()),
    format: initialValues.format || TournamentFormat.REGULAR,
    playerCount: initialValues.playerCount || defaultConfig.pool.playerCount,
    poolCount: initialValues.poolCount || defaultConfig.pool.poolCount,
    poolFrames: initialValues.poolFrames || defaultConfig.pool.framesPerMatch,
    knockoutFrames: initialValues.knockoutFrames || defaultConfig.knockout.framesPerRound.quarterFinal,
    finalFrames: initialValues.finalFrames || defaultConfig.knockout.framesPerRound.final,
    breakThreshold: initialValues.breakThreshold || defaultConfig.breakThreshold,
    errors: [],
    isSubmitting: false,
  };

  /**
   * Updates state and re-renders
   * @param {Partial<TournamentConfigFormState>} updates - State updates
   */
  function setState(updates) {
    state = { ...state, ...updates };
    renderComponent();
    
    if (onChange) {
      onChange(getFormData());
    }
  }

  /**
   * Gets form data
   * @returns {Object}
   */
  function getFormData() {
    return {
      name: state.name,
      date: state.date,
      format: state.format,
      playerCount: state.playerCount,
      poolCount: state.poolCount,
      poolFrames: state.poolFrames,
      knockoutFrames: state.knockoutFrames,
      finalFrames: state.finalFrames,
      breakThreshold: state.breakThreshold,
    };
  }

  /**
   * Validates the form
   * @returns {string[]} Array of error messages
   */
  function validate() {
    const errors = [];

    // Name validation
    if (!state.name || state.name.trim() === '') {
      errors.push('Tournament name is required');
    } else if (state.name.length > 100) {
      errors.push('Tournament name must be 100 characters or less');
    }

    // Date validation
    if (!state.date) {
      errors.push('Tournament date is required');
    }

    // Player count validation
    if (state.playerCount < 4) {
      errors.push('Minimum 4 players required');
    }
    if (state.playerCount > 128) {
      errors.push('Maximum 128 players allowed');
    }

    // Pool count validation
    if (state.poolCount < 1) {
      errors.push('At least 1 pool required');
    }
    if (state.poolCount > state.playerCount) {
      errors.push('Pool count cannot exceed player count');
    }

    // Players per pool validation
    const playersPerPool = Math.ceil(state.playerCount / state.poolCount);
    if (playersPerPool < 2) {
      errors.push('Each pool must have at least 2 players');
    }
    if (playersPerPool > 8) {
      errors.push('Each pool should have at most 8 players');
    }

    // Validate frames (must be odd for knockout)
    if (state.knockoutFrames % 2 === 0) {
      errors.push('Knockout frames must be odd (best-of format)');
    }
    if (state.finalFrames % 2 === 0) {
      errors.push('Final frames must be odd (best-of format)');
    }

    // Masters format constraints
    if (state.format === TournamentFormat.MASTERS) {
      if (state.playerCount !== 16) {
        errors.push('Masters tournament must have exactly 16 players');
      }
      if (state.poolCount !== 4) {
        errors.push('Masters tournament must have exactly 4 pools');
      }
    }

    return errors;
  }

  /**
   * Handles form submission
   * @param {Event} e - Submit event
   */
  function handleSubmit(e) {
    e.preventDefault();

    const errors = validate();
    if (errors.length > 0) {
      setState({ errors });
      return;
    }

    setState({ errors: [], isSubmitting: true });

    if (onSubmit) {
      onSubmit(getFormData());
    }
  }

  /**
   * Handles format change
   * @param {Event} e - Change event
   */
  function handleFormatChange(e) {
    const format = e.target.value;
    const defaults = getDefaultConfig(format);

    setState({
      format,
      playerCount: defaults.pool.playerCount,
      poolCount: defaults.pool.poolCount,
      poolFrames: defaults.pool.framesPerMatch,
      knockoutFrames: defaults.knockout.framesPerRound.quarterFinal,
      finalFrames: defaults.knockout.framesPerRound.final,
      breakThreshold: defaults.breakThreshold,
      errors: [],
    });
  }

  /**
   * Handles player count change
   * @param {Event} e - Change event
   */
  function handlePlayerCountChange(e) {
    const playerCount = parseInt(e.target.value, 10) || 0;
    const suggestedPools = suggestPoolCounts(playerCount);
    const poolCount = suggestedPools.length > 0 ? suggestedPools[0] : state.poolCount;

    setState({ playerCount, poolCount, errors: [] });
  }

  /**
   * Handles pool count change
   * @param {Event} e - Change event
   */
  function handlePoolCountChange(e) {
    setState({ poolCount: parseInt(e.target.value, 10) || 1, errors: [] });
  }

  /**
   * Handles tournament name input without re-rendering to preserve focus
   * @param {Event} e - Input event
   */
  function handleNameInput(e) {
    state.name = e.target.value;
    state.errors = [];
    if (onChange) {
      onChange(getFormData());
    }
  }

  /**
   * Handles date input without re-rendering to preserve focus
   * @param {Event} e - Input event
   */
  function handleDateInput(e) {
    state.date = e.target.value;
    state.errors = [];
    if (onChange) {
      onChange(getFormData());
    }
  }

  /**
   * Handles break threshold input without re-rendering to preserve focus
   * @param {Event} e - Input event
   */
  function handleBreakThresholdInput(e) {
    state.breakThreshold = parseInt(e.target.value, 10) || 0;
    state.errors = [];
    if (onChange) {
      onChange(getFormData());
    }
  }

  /**
   * Calculates tournament statistics for display
   * @returns {Object}
   */
  function calculateStats() {
    const playersPerPool = Math.ceil(state.playerCount / state.poolCount);
    const poolMatches = calculatePoolMatches(state.poolCount, playersPerPool);
    const knockout = calculateKnockoutSize(state.poolCount);

    return {
      playersPerPool,
      poolMatches,
      knockoutMatches: knockout.totalKnockoutMatches,
      totalMatches: poolMatches + knockout.totalKnockoutMatches,
      winnerBracketSize: knockout.winnerBracketSize,
      consolationBracketSize: knockout.consolationBracketSize,
    };
  }

  /**
   * Renders the stats preview
   * @returns {HTMLElement}
   */
  function renderStatsPreview() {
    const stats = calculateStats();

    return h.div(
      { className: 'config-preview' },
      h.h4({}, 'Tournament Preview'),
      h.dl(
        { className: 'stats-list' },
        h.dt({}, 'Players per pool'),
        h.dd({}, `~${stats.playersPerPool}`),
        h.dt({}, 'Pool stage matches'),
        h.dd({}, stats.poolMatches),
        h.dt({}, 'Knockout matches'),
        h.dd({}, stats.knockoutMatches),
        h.dt({}, 'Total matches'),
        h.dd({}, stats.totalMatches),
        h.dt({}, 'Winner bracket'),
        h.dd({}, `${stats.winnerBracketSize} players`),
        h.dt({}, 'Consolation bracket'),
        h.dd({}, `${stats.consolationBracketSize} players`)
      )
    );
  }

  /**
   * Renders the component
   */
  function renderComponent() {
    const isMasters = state.format === TournamentFormat.MASTERS;
    const suggestedPools = suggestPoolCounts(state.playerCount);

    const element = createElement(
      'form',
      { className: 'tournament-config-form', onSubmit: handleSubmit },

      // Error display
      state.errors.length > 0
        ? h.div(
            { className: 'alert alert--error' },
            h.ul({}, ...state.errors.map((err) => h.li({}, err)))
          )
        : null,

      // Basic info section
      h.fieldset(
        { className: 'form-section' },
        h.legend({}, 'Basic Information'),

        // Name
        h.div(
          { className: 'form-group' },
          h.label({ for: 'tournament-name' }, 'Tournament Name *'),
          h.input({
            type: 'text',
            id: 'tournament-name',
            className: 'form-input',
            value: state.name,
            onInput: handleNameInput,
            required: true,
            maxLength: 100,
            placeholder: 'e.g., Summer Tournament 2024',
          })
        ),

        // Date
        h.div(
          { className: 'form-group' },
          h.label({ for: 'tournament-date' }, 'Date *'),
          h.input({
            type: 'date',
            id: 'tournament-date',
            className: 'form-input',
            value: state.date,
            onInput: handleDateInput,
            required: true,
          })
        ),

        // Format
        h.div(
          { className: 'form-group' },
          h.label({ for: 'tournament-format' }, 'Format'),
          h.select(
            {
              id: 'tournament-format',
              className: 'form-select',
              value: state.format,
              onChange: handleFormatChange,
            },
            h.option({ value: TournamentFormat.REGULAR }, 'Regular Tournament'),
            h.option({ value: TournamentFormat.MASTERS }, 'Masters Finale')
          )
        )
      ),

      // Player/Pool configuration
      h.fieldset(
        { className: 'form-section' },
        h.legend({}, 'Players & Pools'),

        // Player count
        h.div(
          { className: 'form-group' },
          h.label({ for: 'player-count' }, 'Number of Players'),
          h.input({
            type: 'number',
            id: 'player-count',
            className: 'form-input',
            value: state.playerCount,
            onInput: handlePlayerCountChange,
            min: 4,
            max: 128,
            disabled: isMasters,
          }),
          isMasters ? h.span({ className: 'form-hint' }, 'Fixed at 16 for Masters') : null
        ),

        // Pool count
        h.div(
          { className: 'form-group' },
          h.label({ for: 'pool-count' }, 'Number of Pools'),
          h.select(
            {
              id: 'pool-count',
              className: 'form-select',
              value: state.poolCount,
              onChange: handlePoolCountChange,
              disabled: isMasters,
            },
            ...suggestedPools.map((count) =>
              h.option({ value: count }, `${count} pools`)
            ),
            // Add current value if not in suggestions
            !suggestedPools.includes(state.poolCount)
              ? h.option({ value: state.poolCount }, `${state.poolCount} pools`)
              : null
          ),
          isMasters ? h.span({ className: 'form-hint' }, 'Fixed at 4 for Masters') : null
        )
      ),

      // Frames configuration
      h.fieldset(
        { className: 'form-section' },
        h.legend({}, 'Match Settings'),

        // Pool stage frames
        h.div(
          { className: 'form-group' },
          h.label({ for: 'pool-frames' }, 'Pool Stage (Best of)'),
          h.select(
            {
              id: 'pool-frames',
              className: 'form-select',
              value: state.poolFrames,
              onChange: (e) => setState({ poolFrames: parseInt(e.target.value, 10), errors: [] }),
            },
            h.option({ value: 1 }, 'Best of 1'),
            h.option({ value: 2 }, 'Best of 2 (can tie)'),
            h.option({ value: 3 }, 'Best of 3'),
            h.option({ value: 5 }, 'Best of 5')
          )
        ),

        // Knockout frames
        h.div(
          { className: 'form-group' },
          h.label({ for: 'knockout-frames' }, 'Knockout Stage (Best of)'),
          h.select(
            {
              id: 'knockout-frames',
              className: 'form-select',
              value: state.knockoutFrames,
              onChange: (e) => setState({ knockoutFrames: parseInt(e.target.value, 10), errors: [] }),
            },
            h.option({ value: 3 }, 'Best of 3'),
            h.option({ value: 5 }, 'Best of 5'),
            h.option({ value: 7 }, 'Best of 7')
          )
        ),

        // Final frames
        h.div(
          { className: 'form-group' },
          h.label({ for: 'final-frames' }, 'Final (Best of)'),
          h.select(
            {
              id: 'final-frames',
              className: 'form-select',
              value: state.finalFrames,
              onChange: (e) => setState({ finalFrames: parseInt(e.target.value, 10), errors: [] }),
            },
            h.option({ value: 3 }, 'Best of 3'),
            h.option({ value: 5 }, 'Best of 5'),
            h.option({ value: 7 }, 'Best of 7'),
            h.option({ value: 9 }, 'Best of 9')
          )
        ),

        // Break threshold
        h.div(
          { className: 'form-group' },
          h.label({ for: 'break-threshold' }, 'Break Threshold'),
          h.input({
            type: 'number',
            id: 'break-threshold',
            className: 'form-input',
            value: state.breakThreshold,
            onInput: handleBreakThresholdInput,
            min: 0,
            max: 147,
          }),
          h.span({ className: 'form-hint' }, 'Minimum break score to record')
        )
      ),

      // Stats preview
      renderStatsPreview(),

      // Submit button
      h.div(
        { className: 'form-actions' },
        h.button(
          {
            type: 'submit',
            className: 'btn btn--primary btn--lg',
            disabled: state.isSubmitting,
          },
          state.isSubmitting ? 'Creating...' : 'Create Tournament'
        )
      )
    );

    render(container, element);
  }

  // Initial render
  renderComponent();

  // Public API
  return {
    /**
     * Gets the current form data
     * @returns {Object}
     */
    getData() {
      return getFormData();
    },

    /**
     * Sets form data
     * @param {Object} data - Form data to set
     */
    setData(data) {
      setState({
        name: data.name ?? state.name,
        date: data.date ?? state.date,
        format: data.format ?? state.format,
        playerCount: data.playerCount ?? state.playerCount,
        poolCount: data.poolCount ?? state.poolCount,
        poolFrames: data.poolFrames ?? state.poolFrames,
        knockoutFrames: data.knockoutFrames ?? state.knockoutFrames,
        finalFrames: data.finalFrames ?? state.finalFrames,
        breakThreshold: data.breakThreshold ?? state.breakThreshold,
        errors: [],
      });
    },

    /**
     * Validates the form
     * @returns {{valid: boolean, errors: string[]}}
     */
    validate() {
      const errors = validate();
      setState({ errors });
      return { valid: errors.length === 0, errors };
    },

    /**
     * Resets form to defaults
     */
    reset() {
      const defaults = getDefaultConfig(TournamentFormat.REGULAR);
      setState({
        name: '',
        date: formatDateInput(new Date()),
        format: TournamentFormat.REGULAR,
        playerCount: defaults.pool.playerCount,
        poolCount: defaults.pool.poolCount,
        poolFrames: defaults.pool.framesPerMatch,
        knockoutFrames: defaults.knockout.framesPerRound.quarterFinal,
        finalFrames: defaults.knockout.framesPerRound.final,
        breakThreshold: defaults.breakThreshold,
        errors: [],
        isSubmitting: false,
      });
    },

    /**
     * Sets submitting state
     * @param {boolean} submitting - Submitting state
     */
    setSubmitting(submitting) {
      setState({ isSubmitting: submitting });
    },

    /**
     * Sets errors
     * @param {string[]} errors - Error messages
     */
    setErrors(errors) {
      setState({ errors });
    },
  };
}

export default { createTournamentConfigForm };
