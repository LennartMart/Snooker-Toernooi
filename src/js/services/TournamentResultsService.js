/**
 * TournamentResultsService
 * Compiles final tournament rankings, aggregates breaks, and finalizes tournaments
 */

import { TournamentStatus } from '../models/Tournament.js';
import { DEFAULT_PARTICIPATION_POINTS } from '../models/Ranking.js';
import {
  calculateTournamentRankings,
  getTournamentChampion,
  getTournamentRunnerUp,
  validateRankingsComplete,
  getPositionLabel,
} from './RankingService.js';
import {
  getBreaksByTournament,
  sortBreaksByValue,
  getHighestBreak,
  getTournamentBreakStats,
} from './BreakService.js';
import { saveTournament, loadTournament } from './TournamentService.js';
import { store, updateTournament } from '../store/index.js';

/**
 * @typedef {Object} TournamentResults
 * @property {string} tournamentId - Tournament ID
 * @property {string} tournamentName - Tournament name
 * @property {string} date - Tournament date
 * @property {string} format - Tournament format
 * @property {string|null} champion - Champion player ID
 * @property {string|null} runnerUp - Runner-up player ID
 * @property {import('../models/Ranking.js').RankingData[]} rankings - Final rankings
 * @property {import('../models/Break.js').BreakData[]} breaks - All tournament breaks
 * @property {Object} breakStats - Break statistics
 * @property {boolean} isFinalized - Whether tournament is finalized
 */

/**
 * Compiles complete tournament results
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @returns {TournamentResults}
 */
export function compileTournamentResults(tournament, breaks = []) {
  if (!tournament) {
    throw new Error('Tournament is required');
  }

  const tournamentBreaks = getBreaksByTournament(breaks, tournament.id);
  const sortedBreaks = sortBreaksByValue(tournamentBreaks);
  const breakStats = getTournamentBreakStats(breaks, tournament.id);

  // Calculate rankings if not already present
  let rankings = tournament.rankings;
  if (!rankings || rankings.length === 0) {
    rankings = calculateTournamentRankings(tournament);
  }

  const champion = getTournamentChampion(tournament);
  const runnerUp = getTournamentRunnerUp(tournament);

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    date: tournament.date,
    format: tournament.format,
    champion,
    runnerUp,
    rankings,
    breaks: sortedBreaks,
    breakStats,
    isFinalized: tournament.status === TournamentStatus.COMPLETE,
  };
}

/**
 * Finalizes a tournament and calculates final rankings
 * @param {string} tournamentId - Tournament ID
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @returns {Promise<TournamentResults>}
 */
export async function finalizeTournament(tournamentId, breaks = []) {
  const tournament = await loadTournament(tournamentId);

  if (!tournament) {
    throw new Error(`Tournament with ID "${tournamentId}" not found`);
  }

  // Calculate final rankings
  const rankings = calculateTournamentRankings(tournament);

  // Validate all players have rankings
  const validation = validateRankingsComplete(tournament, rankings);
  if (!validation.valid) {
    // eslint-disable-next-line no-console
    console.warn(`Some players missing rankings: ${validation.missing.join(', ')}`);
  }

  // Update tournament with final rankings and status
  const finalizedTournament = {
    ...tournament,
    status: TournamentStatus.COMPLETE,
    rankings,
    updatedAt: new Date().toISOString(),
  };

  // Save to storage
  await saveTournament(finalizedTournament);

  // Update store
  store.dispatch(updateTournament(finalizedTournament));

  // Return compiled results
  return compileTournamentResults(finalizedTournament, breaks);
}

/**
 * Gets all breaks for a tournament sorted by value
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} tournamentId - Tournament ID
 * @param {number} [minValue] - Minimum break value (optional filter)
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function getTournamentBreaks(breaks, tournamentId, minValue) {
  let tournamentBreaks = getBreaksByTournament(breaks, tournamentId);

  if (minValue !== undefined) {
    tournamentBreaks = tournamentBreaks.filter((b) => b.value >= minValue);
  }

  return sortBreaksByValue(tournamentBreaks);
}

/**
 * Gets the highest break for a tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} tournamentId - Tournament ID
 * @returns {import('../models/Break.js').BreakData|null}
 */
export function getTournamentHighestBreak(breaks, tournamentId) {
  const tournamentBreaks = getBreaksByTournament(breaks, tournamentId);
  return getHighestBreak(tournamentBreaks);
}

/**
 * Gets breaks by player for a tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {string} tournamentId - Tournament ID
 * @param {string} playerId - Player ID
 * @returns {import('../models/Break.js').BreakData[]}
 */
export function getPlayerTournamentBreaks(breaks, tournamentId, playerId) {
  return breaks.filter((b) => b.tournamentId === tournamentId && b.playerId === playerId);
}

/**
 * Creates a player result summary for a tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} playerId - Player ID
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @returns {Object} Player result summary
 */
export function getPlayerTournamentResult(tournament, playerId, breaks = []) {
  const ranking = tournament.rankings?.find((r) => r.playerId === playerId);
  const playerBreaks = getPlayerTournamentBreaks(breaks, tournament.id, playerId);
  const highestBreak = getHighestBreak(playerBreaks);

  return {
    playerId,
    tournamentId: tournament.id,
    position: ranking?.position || null,
    positionLabel: ranking ? getPositionLabel(ranking.position) : null,
    positionPoints: ranking?.positionPoints || 0,
    participationPoints: ranking?.participationPoints || DEFAULT_PARTICIPATION_POINTS,
    totalPoints: ranking?.totalPoints || 0,
    breaksCount: playerBreaks.length,
    highestBreak: highestBreak?.value || 0,
    isChampion: getTournamentChampion(tournament) === playerId,
    isRunnerUp: getTournamentRunnerUp(tournament) === playerId,
  };
}

/**
 * Gets top performers in a tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @param {number} [count=5] - Number of top performers
 * @returns {Array} Top performers with stats
 */
export function getTopPerformers(tournament, breaks = [], count = 5) {
  const rankings = tournament.rankings || [];
  const sortedRankings = [...rankings].sort((a, b) => a.position - b.position);

  return sortedRankings.slice(0, count).map((ranking) => ({
    ...ranking,
    ...getPlayerTournamentResult(tournament, ranking.playerId, breaks),
  }));
}

/**
 * Creates an export-ready results object
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {import('../models/Break.js').BreakData[]} breaks - All breaks
 * @returns {Object} Export-ready results
 */
export function createExportableResults(tournament, breaks = []) {
  const results = compileTournamentResults(tournament, breaks);

  return {
    ...results,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
}

/**
 * Validates if a tournament can be finalized
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @returns {{canFinalize: boolean, reasons: string[]}}
 */
export function canFinalizeTournament(tournament) {
  const reasons = [];

  if (!tournament) {
    return { canFinalize: false, reasons: ['Tournament not found'] };
  }

  if (tournament.status === TournamentStatus.COMPLETE) {
    return { canFinalize: false, reasons: ['Tournament is already finalized'] };
  }

  // Check if all knockout matches are complete
  const allMatches = [...(tournament.brackets?.winner?.matches || [])];
  if (tournament.brackets?.consolation?.matches) {
    allMatches.push(...tournament.brackets.consolation.matches);
  }

  if (allMatches.length === 0) {
    reasons.push('Knockout brackets not yet generated');
  } else {
    const incompleteMatches = allMatches.filter((m) => m.status !== 'completed');
    if (incompleteMatches.length > 0) {
      reasons.push(`${incompleteMatches.length} knockout matches not completed`);
    }
  }

  // Check winner bracket final
  const winnerBracket = tournament.brackets?.winner;
  if (winnerBracket?.matches) {
    const maxRound = Math.max(...winnerBracket.matches.map((m) => m.round));
    const finalMatch = winnerBracket.matches.find((m) => m.round === maxRound);
    if (!finalMatch?.winnerId) {
      reasons.push('Winner bracket final not completed');
    }
  }

  return {
    canFinalize: reasons.length === 0,
    reasons,
  };
}

/**
 * Gets a summary of tournament completion status
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @returns {Object} Completion status
 */
export function getTournamentCompletionStatus(tournament) {
  const winnerMatches = tournament.brackets?.winner?.matches || [];
  const consolationMatches = tournament.brackets?.consolation?.matches || [];
  const poolMatches = tournament.matches?.filter((m) => m.stage === 'pool') || [];

  const completedPoolMatches = poolMatches.filter((m) => m.status === 'completed').length;
  const completedWinnerMatches = winnerMatches.filter((m) => m.status === 'completed').length;
  const completedConsolationMatches = consolationMatches.filter(
    (m) => m.status === 'completed'
  ).length;

  return {
    pools: {
      total: poolMatches.length,
      completed: completedPoolMatches,
      percent: poolMatches.length > 0 ? Math.round((completedPoolMatches / poolMatches.length) * 100) : 0,
      isComplete: completedPoolMatches === poolMatches.length,
    },
    winnerBracket: {
      total: winnerMatches.length,
      completed: completedWinnerMatches,
      percent: winnerMatches.length > 0 ? Math.round((completedWinnerMatches / winnerMatches.length) * 100) : 0,
      isComplete: completedWinnerMatches === winnerMatches.length,
    },
    consolationBracket: {
      total: consolationMatches.length,
      completed: completedConsolationMatches,
      percent: consolationMatches.length > 0 ? Math.round((completedConsolationMatches / consolationMatches.length) * 100) : 0,
      isComplete: completedConsolationMatches === consolationMatches.length,
    },
    overall: {
      isFinalized: tournament.status === TournamentStatus.COMPLETE,
      canFinalize: canFinalizeTournament(tournament).canFinalize,
    },
  };
}

export default {
  compileTournamentResults,
  finalizeTournament,
  getTournamentBreaks,
  getTournamentHighestBreak,
  getPlayerTournamentBreaks,
  getPlayerTournamentResult,
  getTopPerformers,
  createExportableResults,
  canFinalizeTournament,
  getTournamentCompletionStatus,
};
