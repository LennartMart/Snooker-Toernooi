/**
 * KnockoutPage Component
 * Shows winner and consolation brackets with match entry
 */

import { createElement, h, render, showError, showLoading } from '../Component.js';
import { renderDualBrackets, renderBracketLegend, renderBracketProgress } from '../components/BracketView.js';
import { router } from '../router.js';
import { store } from '../../store/index.js';
import { getStorage } from '../../storage/index.js';
import { generateBrackets } from '../../services/BracketGeneratorService.js';
import { processMatchResult, processAllByes, getBracketWinner } from '../../services/BracketProgressionService.js';
import { calculatePoolStandings } from '../../services/PoolStandingsService.js';

/**
 * Renders the knockout bracket page
 * @param {Object} options - Options
 * @param {HTMLElement} options.container - Container element
 * @param {string} options.tournamentId - Tournament ID
 */
export async function renderKnockoutPage(options = {}) {
  const { container, tournamentId } = options;
  
  if (!container) {
    // eslint-disable-next-line no-console
    console.error('Container element is required');
    return;
  }
  
  // Show loading
  showLoading(container, 'Loading knockout brackets...');
  
  try {
    // Load tournament
    const storage = getStorage();
    const tournaments = await storage.getItem('tournaments') || [];
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) {
      showError(container, 'Tournament not found', () => router.navigate('/'));
      return;
    }
    
    // Check if we have brackets already
    let brackets = tournament.brackets;
    
    // Generate brackets if not yet created
    if (!brackets || (!brackets.winner && !brackets.consolation)) {
      brackets = await generateBracketsFromPools(tournament);
      
      // Save brackets to tournament
      const updatedTournament = {
        ...tournament,
        brackets,
        updatedAt: new Date().toISOString(),
      };
      
      const updatedTournaments = tournaments.map(t => 
        t.id === tournamentId ? updatedTournament : t
      );
      await storage.setItem('tournaments', updatedTournaments);
    }
    
    // Process any bye matches
    if (brackets.winner) {
      brackets.winner = processAllByes(brackets.winner);
    }
    if (brackets.consolation) {
      brackets.consolation = processAllByes(brackets.consolation);
    }
    
    // Render page
    renderPage(container, tournament, brackets);
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading knockout page:', error);
    showError(container, 'Failed to load knockout brackets', () => router.navigate('/'));
  }
}

/**
 * Generates brackets from pool standings
 * @param {Object} tournament - Tournament data
 * @returns {Object} Winner and consolation brackets
 */
async function generateBracketsFromPools(tournament) {
  // Get pool standings
  const poolStandings = tournament.pools.map(pool => ({
    poolId: pool.id,
    standings: calculatePoolStandings(tournament, pool.id),
  }));
  
  // Get knockout config
  const config = {
    bestOf: tournament.config.knockoutBestOf || tournament.config.poolBestOf || 3,
  };
  
  return generateBrackets(tournament.id, poolStandings, config);
}

/**
 * Renders the page content
 * @param {HTMLElement} container - Container element
 * @param {Object} tournament - Tournament data
 * @param {Object} brackets - Winner and consolation brackets
 */
function renderPage(container, tournament, brackets) {
  // Build match scores map from tournament matches
  const matchScoresMap = buildMatchScoresMap(tournament);
  
  // Check for winners
  const winnerChampion = brackets.winner ? getBracketWinner(brackets.winner) : null;
  const consolationChampion = brackets.consolation ? getBracketWinner(brackets.consolation) : null;
  
  const handleMatchClick = (match) => {
    // Navigate to match entry
    router.navigate(`/tournament/${tournament.id}/match/${match.id}`);
  };
  
  render(
    container,
    createElement(
      'div',
      { className: 'page page--knockout' },
      // Header
      createElement(
        'div',
        { className: 'knockout-header' },
        h.h1({}, `${tournament.name} - Knockout Stage`),
        createElement(
          'div',
          { className: 'knockout-header__actions' },
          h.a(
            { href: `#/tournament/${tournament.id}`, className: 'btn btn--secondary' },
            '← Back to Tournament'
          )
        )
      ),
      
      // Champions display (if complete)
      winnerChampion || consolationChampion ? renderChampions(winnerChampion, consolationChampion) : null,
      
      // Legend
      renderBracketLegend(),
      
      // Progress
      brackets.winner ? createElement(
        'div',
        { className: 'knockout-progress' },
        h.h4({}, 'Winner Bracket Progress'),
        renderBracketProgress(brackets.winner)
      ) : null,
      
      brackets.consolation ? createElement(
        'div',
        { className: 'knockout-progress' },
        h.h4({}, 'Consolation Bracket Progress'),
        renderBracketProgress(brackets.consolation)
      ) : null,
      
      // Brackets
      renderDualBrackets({
        winnerBracket: brackets.winner,
        consolationBracket: brackets.consolation,
        onMatchClick: handleMatchClick,
        showScores: true,
        matchScoresMap,
      }),
      
      // Instructions
      createElement(
        'div',
        { className: 'knockout-instructions' },
        h.p({ className: 'text-muted' }, 'Click on a "Ready" match to enter scores.')
      )
    )
  );
}

/**
 * Builds a map of match ID to scores
 * @param {Object} tournament - Tournament data
 * @returns {Object} Match scores map
 */
function buildMatchScoresMap(tournament) {
  const scoresMap = {};
  
  tournament.matches.forEach(match => {
    if (match.frames && match.frames.length > 0) {
      const player1Frames = match.frames.filter(f => f.winnerId === match.player1Id).length;
      const player2Frames = match.frames.filter(f => f.winnerId === match.player2Id).length;
      
      scoresMap[match.id] = {
        player1Frames,
        player2Frames,
      };
    }
  });
  
  return scoresMap;
}

/**
 * Renders champions display
 * @param {string|null} winnerChampion - Winner bracket champion ID
 * @param {string|null} consolationChampion - Consolation bracket champion ID
 * @returns {HTMLElement} Champions element
 */
function renderChampions(winnerChampion, consolationChampion) {
  const state = store.getState();
  const players = state.players;
  
  const winnerName = winnerChampion 
    ? players.find(p => p.id === winnerChampion)?.name || 'Unknown'
    : null;
  const consolationName = consolationChampion
    ? players.find(p => p.id === consolationChampion)?.name || 'Unknown'
    : null;
  
  return createElement(
    'div',
    { className: 'knockout-champions' },
    winnerName ? createElement(
      'div',
      { className: 'knockout-champion knockout-champion--winner' },
      h.span({ className: 'knockout-champion__icon' }, '🏆'),
      h.span({ className: 'knockout-champion__label' }, 'Tournament Champion'),
      h.span({ className: 'knockout-champion__name' }, winnerName)
    ) : null,
    consolationName ? createElement(
      'div',
      { className: 'knockout-champion knockout-champion--consolation' },
      h.span({ className: 'knockout-champion__icon' }, '🎱'),
      h.span({ className: 'knockout-champion__label' }, 'Consolation Winner'),
      h.span({ className: 'knockout-champion__name' }, consolationName)
    ) : null
  );
}

/**
 * Updates bracket with match result
 * @param {Object} tournament - Tournament data
 * @param {string} bracketType - 'winner' or 'consolation'
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner player ID
 * @returns {Object} Updated tournament
 */
export function updateBracketWithResult(tournament, bracketType, matchId, winnerId) {
  const brackets = { ...tournament.brackets };
  
  if (bracketType === 'winner' && brackets.winner) {
    brackets.winner = processMatchResult(brackets.winner, matchId, winnerId);
  } else if (bracketType === 'consolation' && brackets.consolation) {
    brackets.consolation = processMatchResult(brackets.consolation, matchId, winnerId);
  }
  
  return {
    ...tournament,
    brackets,
    updatedAt: new Date().toISOString(),
  };
}

export default {
  renderKnockoutPage,
  updateBracketWithResult,
};
