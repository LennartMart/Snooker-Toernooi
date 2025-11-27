/**
 * Pool View Page
 * Shows standings table and match list for a pool
 */

import { render, createElement, h, showLoading, showError } from '../Component.js';
import { renderPoolStandingsTable } from '../components/PoolStandingsTable.js';
import { renderPoolMatchList } from '../components/PoolMatchList.js';
import { renderShootoutEntry } from '../components/ShootoutEntry.js';
import { store } from '../../store/index.js';
import { getTournamentById } from '../../services/TournamentService.js';
import { getMatchesByPool } from '../../services/MatchService.js';
import { calculatePoolStandings } from '../../services/PoolStandingsService.js';
import { getPendingShootouts, shootoutsToTiebreakerFormat, recordShootout } from '../../services/ShootoutService.js';

/**
 * @typedef {Object} PoolViewPageConfig
 * @property {HTMLElement} container - Container element
 * @property {string} tournamentId - Tournament ID
 * @property {string} poolId - Pool ID
 */

/**
 * Renders the pool view page
 * @param {PoolViewPageConfig} config - Configuration
 */
export async function renderPoolViewPage({ container, tournamentId, poolId }) {
  showLoading(container, 'Loading pool data...');

  try {
    // Get tournament
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      showError(container, 'Tournament not found', h.a({ href: '#/' }, 'Back to Home'));
      return;
    }

    // Get pool
    const pool = tournament.pools.find((p) => p.id === poolId);
    if (!pool) {
      showError(
        container,
        'Pool not found',
        h.a({ href: `#/tournament/${tournamentId}` }, 'Back to Tournament')
      );
      return;
    }

    // Get players map
    const players = store.getState().players;
    const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));

    // Get pool matches
    const poolMatches = getMatchesByPool(tournament, poolId);

    // Calculate standings
    const shootoutResults = tournament.shootouts || [];
    const poolShootouts = shootoutResults.filter((s) => s.poolId === poolId);
    const standings = calculatePoolStandings(
      tournament,
      poolId,
      shootoutsToTiebreakerFormat(poolShootouts)
    );

    // Get pending shootouts
    const pendingShootouts = standings.shootoutRequired.length > 0
      ? getPendingShootouts(standings.shootoutRequired, poolShootouts)
      : [];

    // Render page
    renderPoolPage({
      container,
      tournament,
      pool,
      poolMatches,
      standings,
      pendingShootouts,
      playerMap,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading pool view:', error);
    showError(container, `Error: ${error.message}`, h.a({ href: '#/' }, 'Back to Home'));
  }
}

/**
 * Renders the pool page content
 */
function renderPoolPage({
  container,
  tournament,
  pool,
  poolMatches,
  standings,
  pendingShootouts,
  playerMap,
}) {
  const handleMatchClick = (matchId) => {
    window.location.hash = `#/tournament/${tournament.id}/match/${matchId}`;
  };

  const handleShootoutResult = async (poolId, player1Id, player2Id, winnerId, scores) => {
    try {
      // Record shootout (in a real app, this would persist to storage)
      const updatedTournament = {
        ...tournament,
        shootouts: recordShootout(tournament.shootouts || [], {
          poolId,
          player1Id,
          player2Id,
          winnerId,
          player1Score: scores?.p1 || 0,
          player2Score: scores?.p2 || 0,
        }),
      };

      // Re-render with updated data
      // In a real app, you'd save to storage and re-fetch
      const newStandings = calculatePoolStandings(
        updatedTournament,
        poolId,
        shootoutsToTiebreakerFormat(updatedTournament.shootouts.filter((s) => s.poolId === poolId))
      );

      const newPendingShootouts = newStandings.shootoutRequired.length > 0
        ? getPendingShootouts(
            newStandings.shootoutRequired,
            updatedTournament.shootouts.filter((s) => s.poolId === poolId)
          )
        : [];

      renderPoolPage({
        container,
        tournament: updatedTournament,
        pool,
        poolMatches,
        standings: newStandings,
        pendingShootouts: newPendingShootouts,
        playerMap,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error recording shootout:', error);
      alert(`Error: ${error.message}`);
    }
  };

  render(
    container,
    createElement(
      'div',
      { className: 'page page--pool-view' },
      // Navigation
      createElement(
        'div',
        { className: 'pool-view__nav' },
        h.a({ href: `#/tournament/${tournament.id}`, className: 'btn btn--secondary' }, '← Back to Tournament'),
        h.a({ href: `#/tournament/${tournament.id}/matches`, className: 'btn btn--secondary' }, 'All Matches')
      ),

      // Page title
      h.h1({ className: 'pool-view__title' }, `Pool ${pool.name}`),

      // Pool status
      createElement(
        'div',
        { className: 'pool-view__status' },
        standings.isComplete
          ? h.span({ className: 'pool-view__badge pool-view__badge--complete' }, '✓ All matches complete')
          : h.span({ className: 'pool-view__badge pool-view__badge--pending' }, 'Matches in progress'),
        standings.shootoutRequired.length > 0 &&
          h.span({ className: 'pool-view__badge pool-view__badge--shootout' }, '⚠ Shootout required')
      ),

      // Main content grid
      createElement(
        'div',
        { className: 'pool-view__content' },
        // Standings section
        createElement(
          'div',
          { className: 'pool-view__standings' },
          h.h2({}, 'Standings'),
          createElement('div', { id: 'pool-standings-container' })
        ),

        // Matches section
        createElement(
          'div',
          { className: 'pool-view__matches' },
          h.h2({}, 'Matches'),
          createElement('div', { id: 'pool-matches-container' })
        )
      ),

      // Shootout section (if needed)
      pendingShootouts.length > 0 &&
        createElement(
          'div',
          { className: 'pool-view__shootout' },
          h.h2({}, 'Tiebreaker Shootout'),
          createElement('div', { id: 'shootout-entry-container' })
        )
    )
  );

  // Render sub-components
  const standingsContainer = document.getElementById('pool-standings-container');
  if (standingsContainer) {
    renderPoolStandingsTable({
      container: standingsContainer,
      standings,
      playerMap,
    });
  }

  const matchesContainer = document.getElementById('pool-matches-container');
  if (matchesContainer) {
    renderPoolMatchList({
      container: matchesContainer,
      poolId: pool.id,
      poolName: pool.name,
      matches: poolMatches,
      playerMap,
      onMatchClick: handleMatchClick,
    });
  }

  if (pendingShootouts.length > 0) {
    const shootoutContainer = document.getElementById('shootout-entry-container');
    if (shootoutContainer) {
      renderShootoutEntry({
        container: shootoutContainer,
        poolId: pool.id,
        poolName: pool.name,
        pendingShootouts,
        playerMap,
        onShootoutResult: handleShootoutResult,
      });
    }
  }
}

export default {
  renderPoolViewPage,
};
