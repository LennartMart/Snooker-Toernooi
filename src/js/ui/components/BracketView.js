/**
 * BracketView Component
 * Full bracket visualization with rounds and match connections
 */

import { createElement, h } from '../Component.js';
import { renderBracketMatch } from './BracketMatch.js';
import { getMatchesByRound, getRoundName } from '../../services/BracketGeneratorService.js';

/**
 * Renders a bracket round column
 * @param {Object} options - Options
 * @param {Object} options.bracket - Bracket data
 * @param {number} options.round - Round number
 * @param {Function} [options.onMatchClick] - Match click handler
 * @param {boolean} [options.showScores] - Whether to show scores
 * @param {Object} [options.matchScoresMap] - Map of match ID to scores
 * @returns {HTMLElement} Round column element
 */
function renderBracketRound(options = {}) {
  const { bracket, round, onMatchClick, showScores = false, matchScoresMap = {} } = options;
  
  const matches = getMatchesByRound(bracket, round);
  const roundName = getRoundName(round, bracket.totalRounds);
  
  return createElement(
    'div',
    { className: 'bracket-round', 'data-round': round },
    h.div({ className: 'bracket-round__header' }, roundName),
    createElement(
      'div',
      { className: 'bracket-round__matches' },
      ...matches.map(match => 
        createElement(
          'div',
          { className: 'bracket-round__match-wrapper' },
          renderBracketMatch({
            match,
            onMatchClick,
            showScores,
            matchScores: matchScoresMap[match.id],
          })
        )
      )
    )
  );
}

/**
 * Renders connector lines between rounds
 * @param {number} matchCount - Number of matches in current round
 * @returns {HTMLElement} Connector element
 */
function renderConnectors(matchCount) {
  const connectors = [];
  
  for (let i = 0; i < matchCount; i += 2) {
    connectors.push(
      createElement(
        'div',
        { className: 'bracket-connector' },
        h.div({ className: 'bracket-connector__line bracket-connector__line--top' }),
        h.div({ className: 'bracket-connector__line bracket-connector__line--bottom' }),
        h.div({ className: 'bracket-connector__line bracket-connector__line--middle' })
      )
    );
  }
  
  return createElement(
    'div',
    { className: 'bracket-connectors' },
    ...connectors
  );
}

/**
 * Renders a full bracket view
 * @param {Object} options - Options
 * @param {Object} options.bracket - Bracket data
 * @param {string} [options.title] - Bracket title
 * @param {Function} [options.onMatchClick] - Match click handler
 * @param {boolean} [options.showScores] - Whether to show scores
 * @param {Object} [options.matchScoresMap] - Map of match ID to scores
 * @returns {HTMLElement} Bracket element
 */
export function renderBracketView(options = {}) {
  const { bracket, title, onMatchClick, showScores = false, matchScoresMap = {} } = options;
  
  if (!bracket || !bracket.matches || bracket.matches.length === 0) {
    return createElement(
      'div',
      { className: 'bracket-view bracket-view--empty' },
      h.p({ className: 'text-muted' }, 'No bracket generated yet.')
    );
  }
  
  const roundsContent = [];
  
  for (let round = 1; round <= bracket.totalRounds; round++) {
    // Add round column
    roundsContent.push(
      renderBracketRound({
        bracket,
        round,
        onMatchClick,
        showScores,
        matchScoresMap,
      })
    );
    
    // Add connectors between rounds (except after last round)
    if (round < bracket.totalRounds) {
      const matchCount = getMatchesByRound(bracket, round).length;
      roundsContent.push(renderConnectors(matchCount));
    }
  }
  
  return createElement(
    'div',
    { className: 'bracket-view' },
    title ? h.h3({ className: 'bracket-view__title' }, title) : null,
    createElement(
      'div',
      { className: 'bracket-view__container' },
      ...roundsContent
    )
  );
}

/**
 * Renders both winner and consolation brackets
 * @param {Object} options - Options
 * @param {Object} options.winnerBracket - Winner bracket data
 * @param {Object} options.consolationBracket - Consolation bracket data
 * @param {Function} [options.onMatchClick] - Match click handler
 * @param {boolean} [options.showScores] - Whether to show scores
 * @param {Object} [options.matchScoresMap] - Map of match ID to scores
 * @returns {HTMLElement} Combined brackets element
 */
export function renderDualBrackets(options = {}) {
  const { 
    winnerBracket, 
    consolationBracket, 
    onMatchClick, 
    showScores = false, 
    matchScoresMap = {} 
  } = options;
  
  return createElement(
    'div',
    { className: 'dual-brackets' },
    createElement(
      'div',
      { className: 'dual-brackets__section dual-brackets__section--winner' },
      h.h2({ className: 'dual-brackets__heading' }, '🏆 Winner Bracket'),
      renderBracketView({
        bracket: winnerBracket,
        onMatchClick,
        showScores,
        matchScoresMap,
      })
    ),
    createElement(
      'div',
      { className: 'dual-brackets__section dual-brackets__section--consolation' },
      h.h2({ className: 'dual-brackets__heading' }, '🎱 Consolation Bracket'),
      renderBracketView({
        bracket: consolationBracket,
        onMatchClick,
        showScores,
        matchScoresMap,
      })
    )
  );
}

/**
 * Renders a bracket legend
 * @returns {HTMLElement} Legend element
 */
export function renderBracketLegend() {
  return createElement(
    'div',
    { className: 'bracket-legend' },
    createElement(
      'div',
      { className: 'bracket-legend__item' },
      h.span({ className: 'bracket-legend__color bracket-legend__color--ready' }),
      h.span({}, 'Ready to Play')
    ),
    createElement(
      'div',
      { className: 'bracket-legend__item' },
      h.span({ className: 'bracket-legend__color bracket-legend__color--in-progress' }),
      h.span({}, 'In Progress')
    ),
    createElement(
      'div',
      { className: 'bracket-legend__item' },
      h.span({ className: 'bracket-legend__color bracket-legend__color--completed' }),
      h.span({}, 'Completed')
    ),
    createElement(
      'div',
      { className: 'bracket-legend__item' },
      h.span({ className: 'bracket-legend__color bracket-legend__color--pending' }),
      h.span({}, 'Pending')
    )
  );
}

/**
 * Gets bracket progress statistics
 * @param {Object} bracket - Bracket data
 * @returns {{ total: number, completed: number, inProgress: number, ready: number, pending: number }}
 */
export function getBracketProgress(bracket) {
  if (!bracket || !bracket.matches) {
    return { total: 0, completed: 0, inProgress: 0, ready: 0, pending: 0 };
  }
  
  const matches = bracket.matches;
  return {
    total: matches.length,
    completed: matches.filter(m => m.status === 'completed').length,
    inProgress: matches.filter(m => m.status === 'in_progress').length,
    ready: matches.filter(m => m.status === 'ready').length,
    pending: matches.filter(m => m.status === 'pending').length,
  };
}

/**
 * Renders a progress bar for bracket completion
 * @param {Object} bracket - Bracket data
 * @returns {HTMLElement} Progress element
 */
export function renderBracketProgress(bracket) {
  const progress = getBracketProgress(bracket);
  const percentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;
  
  return createElement(
    'div',
    { className: 'bracket-progress' },
    createElement(
      'div',
      { className: 'bracket-progress__bar' },
      createElement(
        'div',
        { 
          className: 'bracket-progress__fill',
          style: `width: ${percentage}%`,
        }
      )
    ),
    h.span({ className: 'bracket-progress__text' }, `${progress.completed} / ${progress.total} matches (${percentage}%)`)
  );
}

export default {
  renderBracketView,
  renderDualBrackets,
  renderBracketLegend,
  getBracketProgress,
  renderBracketProgress,
};
