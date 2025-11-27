/**
 * Match Service
 * Handles match updates, frame results, and winner determination
 */

import {
  MatchStatus,
  addFrameToMatch,
  autoCompleteByeMatch,
  countFramesWon,
  getMatchScoreString,
} from '../models/Match.js';
import { recordBreak, addBreakToArray, getBreaksByMatch, getHighestBreakValue } from './BreakService.js';
import { store } from '../store/index.js';

/**
 * Gets a match from the tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} matchId - Match ID
 * @returns {import('../models/Match.js').MatchData|undefined}
 */
export function getMatchById(tournament, matchId) {
  return tournament.matches.find((m) => m.id === matchId);
}

/**
 * Updates a match in the tournament
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {import('../models/Match.js').MatchData} updatedMatch - Updated match
 * @returns {import('../models/Tournament.js').TournamentData}
 */
export function updateMatchInTournament(tournament, updatedMatch) {
  const matchIndex = tournament.matches.findIndex((m) => m.id === updatedMatch.id);
  if (matchIndex === -1) {
    throw new Error(`Match with ID ${updatedMatch.id} not found in tournament`);
  }

  const newMatches = [...tournament.matches];
  newMatches[matchIndex] = updatedMatch;

  return {
    ...tournament,
    matches: newMatches,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Records a frame result for a match
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} matchId - Match ID
 * @param {string} frameWinnerId - Player who won the frame
 * @returns {{ tournament: import('../models/Tournament.js').TournamentData, match: import('../models/Match.js').MatchData }}
 */
export function recordFrameResult(tournament, matchId, frameWinnerId) {
  const match = getMatchById(tournament, matchId);
  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  if (match.winnerId !== null) {
    throw new Error('Cannot add frame to completed match');
  }

  if (frameWinnerId !== match.player1Id && frameWinnerId !== match.player2Id) {
    throw new Error('Frame winner must be one of the match players');
  }

  const updatedMatch = addFrameToMatch(match, frameWinnerId);
  const updatedTournament = updateMatchInTournament(tournament, updatedMatch);

  return {
    tournament: updatedTournament,
    match: updatedMatch,
  };
}

/**
 * Records a break for a match
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} matchId - Match ID
 * @param {string} playerId - Player who made the break
 * @param {number} value - Break value
 * @param {number|null} [frameNumber] - Frame number
 * @returns {{ tournament: import('../models/Tournament.js').TournamentData, break: import('../models/Break.js').BreakData }}
 */
export function recordMatchBreak(tournament, matchId, playerId, value, frameNumber = null) {
  const match = getMatchById(tournament, matchId);
  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  if (playerId !== match.player1Id && playerId !== match.player2Id) {
    throw new Error('Break must be made by one of the match players');
  }

  // Get break threshold from tournament config
  const threshold = tournament.config.breakThreshold || 20;

  const breakData = recordBreak({
    tournamentId: tournament.id,
    matchId,
    playerId,
    value,
    frameNumber,
    threshold,
  });

  const updatedTournament = {
    ...tournament,
    breaks: addBreakToArray(tournament.breaks, breakData),
    updatedAt: new Date().toISOString(),
  };

  return {
    tournament: updatedTournament,
    break: breakData,
  };
}

/**
 * Completes a bye match automatically
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} matchId - Match ID
 * @returns {import('../models/Tournament.js').TournamentData}
 */
export function completeByeMatch(tournament, matchId) {
  const match = getMatchById(tournament, matchId);
  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  if (!match.isByeMatch) {
    throw new Error('This is not a bye match');
  }

  // Find the non-bye player
  const players = store.getState().players;
  const player1 = players.find((p) => p.id === match.player1Id);

  const nonByePlayerId = player1?.isBye ? match.player2Id : match.player1Id;

  const updatedMatch = autoCompleteByeMatch(match, nonByePlayerId);
  return updateMatchInTournament(tournament, updatedMatch);
}

/**
 * Gets all matches for a pool
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} poolId - Pool ID
 * @returns {import('../models/Match.js').MatchData[]}
 */
export function getMatchesByPool(tournament, poolId) {
  return tournament.matches.filter((m) => m.poolId === poolId);
}

/**
 * Gets all matches for a round
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} roundId - Round ID
 * @returns {import('../models/Match.js').MatchData[]}
 */
export function getMatchesByRound(tournament, roundId) {
  return tournament.matches.filter((m) => m.roundId === roundId);
}

/**
 * Gets pending matches (not yet complete)
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @returns {import('../models/Match.js').MatchData[]}
 */
export function getPendingMatches(tournament) {
  return tournament.matches.filter((m) => m.status !== MatchStatus.COMPLETE);
}

/**
 * Gets completed matches
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @returns {import('../models/Match.js').MatchData[]}
 */
export function getCompletedMatches(tournament) {
  return tournament.matches.filter((m) => m.status === MatchStatus.COMPLETE);
}

/**
 * Gets matches by player
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} playerId - Player ID
 * @returns {import('../models/Match.js').MatchData[]}
 */
export function getMatchesByPlayer(tournament, playerId) {
  return tournament.matches.filter((m) => m.player1Id === playerId || m.player2Id === playerId);
}

/**
 * Gets a player's opponent in a match
 * @param {import('../models/Match.js').MatchData} match - Match
 * @param {string} playerId - Player ID
 * @returns {string}
 */
export function getOpponentId(match, playerId) {
  if (match.player1Id === playerId) {
    return match.player2Id;
  }
  if (match.player2Id === playerId) {
    return match.player1Id;
  }
  throw new Error('Player is not in this match');
}

/**
 * Checks if a player won a match
 * @param {import('../models/Match.js').MatchData} match - Match
 * @param {string} playerId - Player ID
 * @returns {boolean}
 */
export function didPlayerWin(match, playerId) {
  return match.winnerId === playerId;
}

/**
 * Gets match statistics
 * @param {import('../models/Match.js').MatchData} match - Match
 * @param {import('../models/Break.js').BreakData[]} breaks - All tournament breaks
 * @returns {{ player1Frames: number, player2Frames: number, highestBreak: number, isComplete: boolean }}
 */
export function getMatchStats(match, breaks) {
  const { player1, player2 } = countFramesWon(match);
  const matchBreaks = getBreaksByMatch(breaks, match.id);
  const highestBreak = getHighestBreakValue(matchBreaks);

  return {
    player1Frames: player1,
    player2Frames: player2,
    highestBreak,
    isComplete: match.status === MatchStatus.COMPLETE,
  };
}

/**
 * Formats match result for display
 * @param {import('../models/Match.js').MatchData} match - Match
 * @param {Object.<string, string>} playerNames - Map of player ID to name
 * @returns {{ player1Name: string, player2Name: string, score: string, winner: string|null }}
 */
export function formatMatchResult(match, playerNames) {
  const player1Name = playerNames[match.player1Id] || 'Unknown';
  const player2Name = playerNames[match.player2Id] || 'Unknown';
  const score = getMatchScoreString(match);
  const winner = match.winnerId ? playerNames[match.winnerId] || 'Unknown' : null;

  return {
    player1Name,
    player2Name,
    score,
    winner,
  };
}

/**
 * Starts a match (changes status to in-progress)
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} matchId - Match ID
 * @returns {import('../models/Tournament.js').TournamentData}
 */
export function startMatch(tournament, matchId) {
  const match = getMatchById(tournament, matchId);
  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  if (match.status !== MatchStatus.PENDING) {
    throw new Error('Can only start pending matches');
  }

  const updatedMatch = {
    ...match,
    status: MatchStatus.IN_PROGRESS,
    updatedAt: new Date().toISOString(),
  };

  return updateMatchInTournament(tournament, updatedMatch);
}

/**
 * Advances winner to next match (knockout stage)
 * @param {import('../models/Tournament.js').TournamentData} tournament - Tournament
 * @param {string} completedMatchId - Completed match ID
 * @returns {import('../models/Tournament.js').TournamentData}
 */
export function advanceWinner(tournament, completedMatchId) {
  const completedMatch = getMatchById(tournament, completedMatchId);
  if (!completedMatch) {
    throw new Error(`Match with ID ${completedMatchId} not found`);
  }

  if (!completedMatch.winnerId) {
    throw new Error('Match is not complete');
  }

  let updatedTournament = tournament;

  // Advance winner to next match
  if (completedMatch.nextMatchId) {
    const nextMatch = getMatchById(updatedTournament, completedMatch.nextMatchId);
    if (nextMatch) {
      const updatedNextMatch = {
        ...nextMatch,
        // Place winner in available slot
        ...(nextMatch.player1Id === null || nextMatch.player1Id === undefined
          ? { player1Id: completedMatch.winnerId }
          : { player2Id: completedMatch.winnerId }),
        updatedAt: new Date().toISOString(),
      };
      updatedTournament = updateMatchInTournament(updatedTournament, updatedNextMatch);
    }
  }

  // Handle loser match (consolation bracket)
  if (completedMatch.loserMatchId && completedMatch.winnerId) {
    const loserId = completedMatch.winnerId === completedMatch.player1Id ? completedMatch.player2Id : completedMatch.player1Id;

    const loserMatch = getMatchById(updatedTournament, completedMatch.loserMatchId);
    if (loserMatch) {
      const updatedLoserMatch = {
        ...loserMatch,
        // Place loser in available slot
        ...(loserMatch.player1Id === null || loserMatch.player1Id === undefined
          ? { player1Id: loserId }
          : { player2Id: loserId }),
        updatedAt: new Date().toISOString(),
      };
      updatedTournament = updateMatchInTournament(updatedTournament, updatedLoserMatch);
    }
  }

  return updatedTournament;
}

export default {
  getMatchById,
  updateMatchInTournament,
  recordFrameResult,
  recordMatchBreak,
  completeByeMatch,
  getMatchesByPool,
  getMatchesByRound,
  getPendingMatches,
  getCompletedMatches,
  getMatchesByPlayer,
  getOpponentId,
  didPlayerWin,
  getMatchStats,
  formatMatchResult,
  startMatch,
  advanceWinner,
};
