/**
 * Match Model
 * Represents a contest between two players
 */

import { generateUUID } from '../utils/uuid.js';
import { createFrame } from './Frame.js';

/**
 * Match stages
 * @enum {string}
 */
export const MatchStage = {
  POOL: 'pool',
  WINNER_BRACKET: 'winner-bracket',
  CONSOLATION_BRACKET: 'consolation-bracket',
};

/**
 * Match status
 * @enum {string}
 */
export const MatchStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETE: 'complete',
};

/**
 * @typedef {Object} MatchData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} tournamentId - Reference to tournament
 * @property {string|null} poolId - Pool reference (if pool match)
 * @property {string|null} roundId - Knockout round reference (if knockout)
 * @property {string} stage - Match stage (pool, winner-bracket, consolation-bracket)
 * @property {number} roundNumber - Round within stage
 * @property {string} player1Id - First player ID
 * @property {string} player2Id - Second player ID
 * @property {import('./Frame.js').FrameData[]} frames - Frame results
 * @property {string|null} winnerId - Winner player ID (null if incomplete)
 * @property {string} status - Match status
 * @property {number} bestOf - Number of frames (e.g., 1 for single frame, 3 for best of 3)
 * @property {boolean} isByeMatch - True if one player is a bye
 * @property {string|null} nextMatchId - Winner advances to this match (knockout)
 * @property {string|null} loserMatchId - Loser goes to this match (knockout)
 * @property {string} createdAt - ISO timestamp of creation
 * @property {string} updatedAt - ISO timestamp of last modification
 */

/**
 * Creates a new Match instance
 * @param {Object} params - Match parameters
 * @returns {MatchData}
 */
export function createMatch({
  id,
  tournamentId,
  poolId = null,
  roundId = null,
  stage,
  roundNumber = 1,
  player1Id,
  player2Id,
  frames = [],
  winnerId = null,
  status = MatchStatus.PENDING,
  bestOf = 1,
  isByeMatch = false,
  nextMatchId = null,
  loserMatchId = null,
  createdAt,
  updatedAt,
} = {}) {
  if (!tournamentId || typeof tournamentId !== 'string') {
    throw new Error('Match requires a valid tournamentId');
  }

  if (!stage || !Object.values(MatchStage).includes(stage)) {
    throw new Error('Match requires a valid stage');
  }

  if (!player1Id || typeof player1Id !== 'string') {
    throw new Error('Match requires a valid player1Id');
  }

  if (!player2Id || typeof player2Id !== 'string') {
    throw new Error('Match requires a valid player2Id');
  }

  if (typeof bestOf !== 'number' || bestOf < 1) {
    throw new Error('Match bestOf must be a positive number');
  }

  const now = new Date().toISOString();

  return {
    id: id || generateUUID(),
    tournamentId,
    poolId,
    roundId,
    stage,
    roundNumber,
    player1Id,
    player2Id,
    frames: Array.isArray(frames) ? [...frames] : [],
    winnerId,
    status,
    bestOf,
    isByeMatch: Boolean(isByeMatch),
    nextMatchId,
    loserMatchId,
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
  };
}

/**
 * Calculates frames needed to win the match
 * @param {number} bestOf - Best of N frames
 * @returns {number} Frames to win
 */
export function framesToWin(bestOf) {
  return Math.ceil(bestOf / 2);
}

/**
 * Counts frames won by each player
 * @param {MatchData} match - Match to count
 * @returns {{player1: number, player2: number}}
 */
export function countFramesWon(match) {
  const player1Wins = match.frames.filter((f) => f.winnerId === match.player1Id).length;
  const player2Wins = match.frames.filter((f) => f.winnerId === match.player2Id).length;

  return {
    player1: player1Wins,
    player2: player2Wins,
  };
}

/**
 * Determines if a match is complete
 * @param {MatchData} match - Match to check
 * @returns {boolean}
 */
export function isMatchComplete(match) {
  const { player1, player2 } = countFramesWon(match);
  const needed = framesToWin(match.bestOf);

  return player1 >= needed || player2 >= needed;
}

/**
 * Determines the winner of a match
 * @param {MatchData} match - Match to check
 * @returns {string|null} Winner player ID or null if not complete
 */
export function determineMatchWinner(match) {
  const { player1, player2 } = countFramesWon(match);
  const needed = framesToWin(match.bestOf);

  if (player1 >= needed) {
    return match.player1Id;
  }
  if (player2 >= needed) {
    return match.player2Id;
  }
  return null;
}

/**
 * Adds a frame result to a match
 * @param {MatchData} match - Match to update
 * @param {string} winnerId - Winner of the frame
 * @returns {MatchData} Updated match
 */
export function addFrameToMatch(match, winnerId) {
  if (match.winnerId !== null) {
    throw new Error('Cannot add frame to completed match');
  }

  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw new Error('Frame winner must be one of the match players');
  }

  const frameNumber = match.frames.length + 1;
  const newFrame = createFrame({
    matchId: match.id,
    frameNumber,
    winnerId,
  });

  const newFrames = [...match.frames, newFrame];
  const updatedMatch = {
    ...match,
    frames: newFrames,
    status: MatchStatus.IN_PROGRESS,
    updatedAt: new Date().toISOString(),
  };

  // Check if match is now complete
  const winner = determineMatchWinner(updatedMatch);
  if (winner) {
    updatedMatch.winnerId = winner;
    updatedMatch.status = MatchStatus.COMPLETE;
  }

  return updatedMatch;
}

/**
 * Auto-completes a bye match (1-0 win for non-bye player)
 * @param {MatchData} match - Bye match to complete
 * @param {string} nonByePlayerId - ID of the non-bye player
 * @returns {MatchData} Completed match
 */
export function autoCompleteByeMatch(match, nonByePlayerId) {
  if (!match.isByeMatch) {
    throw new Error('Can only auto-complete bye matches');
  }

  const frame = createFrame({
    matchId: match.id,
    frameNumber: 1,
    winnerId: nonByePlayerId,
  });

  return {
    ...match,
    frames: [frame],
    winnerId: nonByePlayerId,
    status: MatchStatus.COMPLETE,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gets the frame score string (e.g., "2-1")
 * @param {MatchData} match - Match to format
 * @returns {string} Score string
 */
export function getMatchScoreString(match) {
  const { player1, player2 } = countFramesWon(match);
  return `${player1}-${player2}`;
}

/**
 * Validates a match object
 * @param {MatchData} match - Match to validate
 * @returns {boolean}
 */
export function isValidMatch(match) {
  return (
    match &&
    typeof match.id === 'string' &&
    typeof match.tournamentId === 'string' &&
    (match.poolId === null || typeof match.poolId === 'string') &&
    (match.roundId === null || typeof match.roundId === 'string') &&
    Object.values(MatchStage).includes(match.stage) &&
    typeof match.roundNumber === 'number' &&
    typeof match.player1Id === 'string' &&
    typeof match.player2Id === 'string' &&
    Array.isArray(match.frames) &&
    (match.winnerId === null || typeof match.winnerId === 'string') &&
    Object.values(MatchStatus).includes(match.status) &&
    typeof match.bestOf === 'number' &&
    typeof match.isByeMatch === 'boolean' &&
    typeof match.createdAt === 'string' &&
    typeof match.updatedAt === 'string'
  );
}

/**
 * Serializes a match to a plain object for storage
 * @param {MatchData} match - Match to serialize
 * @returns {MatchData}
 */
export function serializeMatch(match) {
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    poolId: match.poolId,
    roundId: match.roundId,
    stage: match.stage,
    roundNumber: match.roundNumber,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    frames: match.frames.map((f) => ({ ...f })),
    winnerId: match.winnerId,
    status: match.status,
    bestOf: match.bestOf,
    isByeMatch: match.isByeMatch,
    nextMatchId: match.nextMatchId,
    loserMatchId: match.loserMatchId,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}

/**
 * Deserializes a plain object to a match
 * @param {Object} data - Data to deserialize
 * @returns {MatchData}
 */
export function deserializeMatch(data) {
  return createMatch({
    id: data.id,
    tournamentId: data.tournamentId,
    poolId: data.poolId,
    roundId: data.roundId,
    stage: data.stage,
    roundNumber: data.roundNumber,
    player1Id: data.player1Id,
    player2Id: data.player2Id,
    frames: data.frames,
    winnerId: data.winnerId,
    status: data.status,
    bestOf: data.bestOf,
    isByeMatch: data.isByeMatch,
    nextMatchId: data.nextMatchId,
    loserMatchId: data.loserMatchId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

export default {
  MatchStage,
  MatchStatus,
  createMatch,
  framesToWin,
  countFramesWon,
  isMatchComplete,
  determineMatchWinner,
  addFrameToMatch,
  autoCompleteByeMatch,
  getMatchScoreString,
  isValidMatch,
  serializeMatch,
  deserializeMatch,
};
