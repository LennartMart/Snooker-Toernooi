/**
 * KnockoutRound Model
 * Represents a round in the knockout stage
 */

import { generateUUID } from '../utils/uuid.js';

/**
 * Bracket types
 * @enum {string}
 */
export const BracketType = {
  WINNER: 'winner',
  CONSOLATION: 'consolation',
};

/**
 * @typedef {Object} KnockoutRoundData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} tournamentId - Reference to tournament
 * @property {string} bracket - "winner" or "consolation"
 * @property {number} roundNumber - Round within bracket (1-based)
 * @property {string} name - Display name (e.g., "Quarter-Finals")
 * @property {[number, number]} positionRange - Positions being determined [min, max]
 * @property {string[]} matchIds - Matches in this round
 * @property {number} bestOf - Frames to win (e.g., 3 for best of 3)
 */

/**
 * Round name mappings
 */
const ROUND_NAMES = {
  1: 'Round of 16',
  2: 'Quarter-Finals',
  3: 'Semi-Finals',
  4: 'Final',
};

/**
 * Gets a display name for a knockout round
 * @param {number} roundNumber - Round number
 * @param {string} bracket - Bracket type
 * @returns {string} Display name
 */
export function getRoundName(roundNumber, bracket) {
  const prefix = bracket === BracketType.CONSOLATION ? 'Consolation ' : '';
  const baseName = ROUND_NAMES[roundNumber] || `Round ${roundNumber}`;
  return `${prefix}${baseName}`;
}

/**
 * Creates a new KnockoutRound instance
 * @param {Object} params - KnockoutRound parameters
 * @returns {KnockoutRoundData}
 */
export function createKnockoutRound({
  id,
  tournamentId,
  bracket,
  roundNumber,
  name,
  positionRange,
  matchIds = [],
  bestOf = 1,
} = {}) {
  if (!tournamentId || typeof tournamentId !== 'string') {
    throw new Error('KnockoutRound requires a valid tournamentId');
  }

  if (!bracket || !Object.values(BracketType).includes(bracket)) {
    throw new Error('KnockoutRound requires a valid bracket type');
  }

  if (typeof roundNumber !== 'number' || roundNumber < 1) {
    throw new Error('KnockoutRound requires a valid roundNumber (>= 1)');
  }

  if (!Array.isArray(positionRange) || positionRange.length !== 2) {
    throw new Error('KnockoutRound requires a valid positionRange [min, max]');
  }

  if (typeof bestOf !== 'number' || bestOf < 1) {
    throw new Error('KnockoutRound bestOf must be a positive number');
  }

  return {
    id: id || generateUUID(),
    tournamentId,
    bracket,
    roundNumber,
    name: name || getRoundName(roundNumber, bracket),
    positionRange: [positionRange[0], positionRange[1]],
    matchIds: Array.isArray(matchIds) ? [...matchIds] : [],
    bestOf,
  };
}

/**
 * Adds a match to a knockout round
 * @param {KnockoutRoundData} round - Round to update
 * @param {string} matchId - Match ID to add
 * @returns {KnockoutRoundData} Updated round
 */
export function addMatchToRound(round, matchId) {
  if (round.matchIds.includes(matchId)) {
    return round;
  }

  return {
    ...round,
    matchIds: [...round.matchIds, matchId],
  };
}

/**
 * Checks if a round is complete (all matches have winners)
 * @param {KnockoutRoundData} round - Round to check
 * @param {Map<string, import('./Match.js').MatchData>} matchesMap - Map of match ID to match
 * @returns {boolean}
 */
export function isRoundComplete(round, matchesMap) {
  return round.matchIds.every((matchId) => {
    const match = matchesMap.get(matchId);
    return match && match.winnerId !== null;
  });
}

/**
 * Gets the winners of all matches in a round
 * @param {KnockoutRoundData} round - Round to query
 * @param {Map<string, import('./Match.js').MatchData>} matchesMap - Map of match ID to match
 * @returns {string[]} Winner player IDs
 */
export function getRoundWinners(round, matchesMap) {
  return round.matchIds
    .map((matchId) => {
      const match = matchesMap.get(matchId);
      return match ? match.winnerId : null;
    })
    .filter((id) => id !== null);
}

/**
 * Gets the losers of all matches in a round
 * @param {KnockoutRoundData} round - Round to query
 * @param {Map<string, import('./Match.js').MatchData>} matchesMap - Map of match ID to match
 * @returns {string[]} Loser player IDs
 */
export function getRoundLosers(round, matchesMap) {
  return round.matchIds
    .map((matchId) => {
      const match = matchesMap.get(matchId);
      if (!match || !match.winnerId) {
        return null;
      }
      return match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    })
    .filter((id) => id !== null);
}

/**
 * Validates a knockout round object
 * @param {KnockoutRoundData} round - Round to validate
 * @returns {boolean}
 */
export function isValidKnockoutRound(round) {
  return (
    round &&
    typeof round.id === 'string' &&
    typeof round.tournamentId === 'string' &&
    Object.values(BracketType).includes(round.bracket) &&
    typeof round.roundNumber === 'number' &&
    round.roundNumber >= 1 &&
    typeof round.name === 'string' &&
    Array.isArray(round.positionRange) &&
    round.positionRange.length === 2 &&
    Array.isArray(round.matchIds) &&
    typeof round.bestOf === 'number' &&
    round.bestOf >= 1
  );
}

/**
 * Serializes a knockout round to a plain object for storage
 * @param {KnockoutRoundData} round - Round to serialize
 * @returns {KnockoutRoundData}
 */
export function serializeKnockoutRound(round) {
  return {
    id: round.id,
    tournamentId: round.tournamentId,
    bracket: round.bracket,
    roundNumber: round.roundNumber,
    name: round.name,
    positionRange: [...round.positionRange],
    matchIds: [...round.matchIds],
    bestOf: round.bestOf,
  };
}

/**
 * Deserializes a plain object to a knockout round
 * @param {Object} data - Data to deserialize
 * @returns {KnockoutRoundData}
 */
export function deserializeKnockoutRound(data) {
  return createKnockoutRound({
    id: data.id,
    tournamentId: data.tournamentId,
    bracket: data.bracket,
    roundNumber: data.roundNumber,
    name: data.name,
    positionRange: data.positionRange,
    matchIds: data.matchIds,
    bestOf: data.bestOf,
  });
}

export default {
  BracketType,
  getRoundName,
  createKnockoutRound,
  addMatchToRound,
  isRoundComplete,
  getRoundWinners,
  getRoundLosers,
  isValidKnockoutRound,
  serializeKnockoutRound,
  deserializeKnockoutRound,
};
