/**
 * Break Model
 * Represents a high scoring run (20+ points)
 */

import { generateUUID } from '../utils/uuid.js';

/**
 * @typedef {Object} BreakData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} tournamentId - Reference to tournament
 * @property {string} matchId - Reference to match
 * @property {string} playerId - Player who made the break
 * @property {number} value - Break value (must be >= threshold)
 * @property {number|null} frameNumber - Frame in which break occurred (optional)
 * @property {string} createdAt - ISO timestamp of when recorded
 */

/**
 * Default minimum break threshold
 */
export const DEFAULT_BREAK_THRESHOLD = 20;

/**
 * Masters minimum break threshold for season statistics
 */
export const MASTERS_BREAK_THRESHOLD = 25;

/**
 * Creates a new Break instance
 * @param {Object} params - Break parameters
 * @param {string} [params.id] - Optional ID (generated if not provided)
 * @param {string} params.tournamentId - Reference to tournament
 * @param {string} params.matchId - Reference to match
 * @param {string} params.playerId - Player who made the break
 * @param {number} params.value - Break value
 * @param {number|null} [params.frameNumber=null] - Frame number (optional)
 * @param {string} [params.createdAt] - ISO timestamp (generated if not provided)
 * @param {number} [params.threshold=DEFAULT_BREAK_THRESHOLD] - Minimum threshold to validate against
 * @returns {BreakData}
 */
export function createBreak({
  id,
  tournamentId,
  matchId,
  playerId,
  value,
  frameNumber = null,
  createdAt,
  threshold = DEFAULT_BREAK_THRESHOLD,
} = {}) {
  if (!tournamentId || typeof tournamentId !== 'string') {
    throw new Error('Break requires a valid tournamentId');
  }

  if (!matchId || typeof matchId !== 'string') {
    throw new Error('Break requires a valid matchId');
  }

  if (!playerId || typeof playerId !== 'string') {
    throw new Error('Break requires a valid playerId');
  }

  if (typeof value !== 'number' || value < threshold) {
    throw new Error(`Break value must be a number >= ${threshold}`);
  }

  // Maximum possible break in snooker is 147
  if (value > 147) {
    throw new Error('Break value cannot exceed 147');
  }

  return {
    id: id || generateUUID(),
    tournamentId,
    matchId,
    playerId,
    value,
    frameNumber: frameNumber !== null ? Number(frameNumber) : null,
    createdAt: createdAt || new Date().toISOString(),
  };
}

/**
 * Validates a break object
 * @param {BreakData} breakData - Break to validate
 * @param {number} [threshold=DEFAULT_BREAK_THRESHOLD] - Minimum threshold
 * @returns {boolean}
 */
export function isValidBreak(breakData, threshold = DEFAULT_BREAK_THRESHOLD) {
  return (
    breakData &&
    typeof breakData.id === 'string' &&
    typeof breakData.tournamentId === 'string' &&
    typeof breakData.matchId === 'string' &&
    typeof breakData.playerId === 'string' &&
    typeof breakData.value === 'number' &&
    breakData.value >= threshold &&
    breakData.value <= 147 &&
    (breakData.frameNumber === null || typeof breakData.frameNumber === 'number') &&
    typeof breakData.createdAt === 'string'
  );
}

/**
 * Checks if a break qualifies for Masters season statistics
 * @param {BreakData} breakData - Break to check
 * @returns {boolean}
 */
export function isMastersQualifyingBreak(breakData) {
  return breakData && breakData.value >= MASTERS_BREAK_THRESHOLD;
}

/**
 * Compares two breaks by value (for sorting, descending)
 * @param {BreakData} a - First break
 * @param {BreakData} b - Second break
 * @returns {number}
 */
export function compareBreaksByValue(a, b) {
  return b.value - a.value;
}

/**
 * Serializes a break to a plain object for storage
 * @param {BreakData} breakData - Break to serialize
 * @returns {BreakData}
 */
export function serializeBreak(breakData) {
  return {
    id: breakData.id,
    tournamentId: breakData.tournamentId,
    matchId: breakData.matchId,
    playerId: breakData.playerId,
    value: breakData.value,
    frameNumber: breakData.frameNumber,
    createdAt: breakData.createdAt,
  };
}

/**
 * Deserializes a plain object to a break
 * @param {Object} data - Data to deserialize
 * @param {number} [threshold=DEFAULT_BREAK_THRESHOLD] - Minimum threshold
 * @returns {BreakData}
 */
export function deserializeBreak(data, threshold = DEFAULT_BREAK_THRESHOLD) {
  return createBreak({
    id: data.id,
    tournamentId: data.tournamentId,
    matchId: data.matchId,
    playerId: data.playerId,
    value: data.value,
    frameNumber: data.frameNumber,
    createdAt: data.createdAt,
    threshold,
  });
}

export default {
  DEFAULT_BREAK_THRESHOLD,
  MASTERS_BREAK_THRESHOLD,
  createBreak,
  isValidBreak,
  isMastersQualifyingBreak,
  compareBreaksByValue,
  serializeBreak,
  deserializeBreak,
};
