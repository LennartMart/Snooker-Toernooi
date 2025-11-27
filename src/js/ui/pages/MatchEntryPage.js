/**
 * Match Entry Page
 * Page for entering match scores and breaks
 */

import { render, createElement, h, showLoading, showError, showEmpty } from '../Component.js';
import { renderMatchScoreCard, createMatchListItem } from '../components/MatchScoreCard.js';
import { store } from '../../store/index.js';
import { getMatchById, recordFrameResult, recordMatchBreak } from '../../services/MatchService.js';
import { getTournamentById, saveTournament } from '../../services/TournamentService.js';

/**
 * @typedef {Object} MatchEntryPageConfig
 * @property {HTMLElement} container - Container element
 * @property {string} tournamentId - Tournament ID
 * @property {string} [matchId] - Optional specific match to show
 */

/**
 * Renders the match entry page
 * @param {MatchEntryPageConfig} config - Configuration
 */
export async function renderMatchEntryPage({ container, tournamentId, matchId }) {
  showLoading(container, 'Loading match data...');

  try {
    // Get tournament
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      showError(container, 'Tournament not found', h.a({ href: '#/' }, 'Back to Home'));
      return;
    }

    // Get players map
    const players = store.getState().players;
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

    // If specific match requested
    if (matchId) {
      const match = getMatchById(tournament, matchId);
      if (!match) {
        showError(container, 'Match not found', h.a({ href: `#/tournament/${tournamentId}` }, 'Back to Tournament'));
        return;
      }

      renderSingleMatch({ container, tournament, match, playerMap });
      return;
    }

    // Show match selection
    renderMatchSelection({ container, tournament, playerMap });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading match entry page:', error);
    showError(container, `Error: ${error.message}`, h.a({ href: '#/' }, 'Back to Home'));
  }
}

/**
 * Renders single match entry view
 */
function renderSingleMatch({ container, tournament, match, playerMap }) {
  const player1 = playerMap[match.player1Id];
  const player2 = playerMap[match.player2Id];
  const matchBreaks = tournament.breaks.filter((b) => b.matchId === match.id);

  const handleFrameWinner = async (matchId, winnerId) => {
    try {
      const result = recordFrameResult(tournament, matchId, winnerId);
      await saveTournament(result.tournament);

      // Re-render with updated data
      const updatedTournament = await getTournamentById(tournament.id);
      const updatedMatch = getMatchById(updatedTournament, matchId);
      renderSingleMatch({
        container,
        tournament: updatedTournament,
        match: updatedMatch,
        playerMap,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error recording frame:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleBreakRecord = async (matchId, playerId, value) => {
    try {
      const result = recordMatchBreak(tournament, matchId, playerId, value);
      await saveTournament(result.tournament);

      // Re-render with updated data
      const updatedTournament = await getTournamentById(tournament.id);
      const updatedMatch = getMatchById(updatedTournament, matchId);
      renderSingleMatch({
        container,
        tournament: updatedTournament,
        match: updatedMatch,
        playerMap,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error recording break:', error);
      alert(`Error: ${error.message}`);
    }
  };

  render(
    container,
    createElement(
      'div',
      { className: 'page page--match-entry' },
      // Navigation
      createElement(
        'div',
        { className: 'match-entry__nav' },
        h.a({ href: `#/tournament/${tournament.id}/matches`, className: 'btn btn--secondary' }, '← All Matches'),
        h.a({ href: `#/tournament/${tournament.id}`, className: 'btn btn--secondary' }, 'Tournament Overview')
      ),

      // Page title
      h.h1({ className: 'match-entry__title' }, 'Enter Match Score'),

      // Match card container
      createElement('div', { className: 'match-entry__card', id: 'match-card-container' })
    )
  );

  // Render match card
  const matchCardContainer = document.getElementById('match-card-container');
  renderMatchScoreCard({
    container: matchCardContainer,
    match,
    player1,
    player2,
    breaks: matchBreaks,
    breakThreshold: tournament.config.breakThreshold || 20,
    onFrameWinner: handleFrameWinner,
    onBreakRecord: handleBreakRecord,
  });
}

/**
 * Renders match selection view
 */
function renderMatchSelection({ container, tournament, playerMap }) {
  // Group matches by pool
  const poolMatches = tournament.matches.filter((m) => m.stage === 'pool');
  const knockoutMatches = tournament.matches.filter((m) => m.stage !== 'pool');

  // Group pool matches by poolId
  const matchesByPool = {};
  poolMatches.forEach((match) => {
    if (!matchesByPool[match.poolId]) {
      matchesByPool[match.poolId] = [];
    }
    matchesByPool[match.poolId].push(match);
  });

  render(
    container,
    createElement(
      'div',
      { className: 'page page--match-selection' },
      // Header
      createElement(
        'div',
        { className: 'match-selection__header' },
        h.a({ href: `#/tournament/${tournament.id}`, className: 'btn btn--secondary' }, '← Back to Tournament'),
        h.h1({}, 'Select Match')
      ),

      // Filters
      createElement(
        'div',
        { className: 'match-selection__filters' },
        h.label({}, 'Show:'),
        h.select(
          {
            className: 'match-selection__filter-select',
            onchange: (e) => filterMatches(e.target.value),
          },
          h.option({ value: 'all' }, 'All Matches'),
          h.option({ value: 'pending' }, 'Pending'),
          h.option({ value: 'in-progress' }, 'In Progress'),
          h.option({ value: 'complete' }, 'Complete')
        )
      ),

      // Pool matches
      Object.keys(matchesByPool).length > 0 &&
        createElement(
          'div',
          { className: 'match-selection__section' },
          h.h2({}, 'Pool Matches'),
          ...Object.entries(matchesByPool).map(([poolId, matches]) => {
            const pool = tournament.pools.find((p) => p.id === poolId);
            return createElement(
              'div',
              { className: 'match-selection__pool' },
              h.h3({}, pool ? `Pool ${pool.name}` : 'Pool'),
              createElement(
                'ul',
                { className: 'match-selection__list' },
                ...matches.map((match) =>
                  createMatchListItem(
                    match,
                    playerMap[match.player1Id],
                    playerMap[match.player2Id],
                    () => {
                      window.location.hash = `#/tournament/${tournament.id}/match/${match.id}`;
                    }
                  )
                )
              )
            );
          })
        ),

      // Knockout matches
      knockoutMatches.length > 0 &&
        createElement(
          'div',
          { className: 'match-selection__section' },
          h.h2({}, 'Knockout Matches'),
          createElement(
            'ul',
            { className: 'match-selection__list' },
            ...knockoutMatches.map((match) =>
              createMatchListItem(
                match,
                playerMap[match.player1Id],
                playerMap[match.player2Id],
                () => {
                  window.location.hash = `#/tournament/${tournament.id}/match/${match.id}`;
                }
              )
            )
          )
        ),

      // No matches
      tournament.matches.length === 0 && showEmpty(container, 'No matches found')
    )
  );
}

/**
 * Filters displayed matches
 * @param {string} filter - Filter value
 */
function filterMatches(filter) {
  const items = document.querySelectorAll('.match-list-item');
  items.forEach((item) => {
    const isComplete = item.classList.contains('match-list-item--complete');
    const isInProgress = item.classList.contains('match-list-item--in-progress');

    let show = true;
    if (filter === 'pending') {
      show = !isComplete && !isInProgress;
    } else if (filter === 'in-progress') {
      show = isInProgress;
    } else if (filter === 'complete') {
      show = isComplete;
    }

    item.style.display = show ? '' : 'none';
  });
}

export default {
  renderMatchEntryPage,
};
