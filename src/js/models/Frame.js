/**
 * Frame Model
 * Represents a single game within a match
 */

import { generateUUID } from '../utils/uuid.js';

/**
 * @typedef {Object} FrameData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} matchId - Reference to parent match
 * @property {number} frameNumber - 1-indexed frame number within match
 * @property {string|null} winnerId - Player ID of frame winner (null if not played)
 */

/**
 * Creates a new Frame instance
 * @param {Object} params - Frame parameters
 * @param {string} [params.id] - Optional ID (generated if not provided)
 * @param {string} params.matchId - Reference to parent match
 * @param {number} params.frameNumber - 1-indexed frame number
 * @param {string|null} [params.winnerId=null] - Winner player ID
 * @returns {FrameData}
 */
export function createFrame({ id, matchId, frameNumber, winnerId = null } = {}) {
  if (!matchId || typeof matchId !== 'string') {
    throw new Error('Frame requires a valid matchId');
  }

  if (typeof frameNumber !== 'number' || frameNumber < 1) {
    throw new Error('Frame requires a valid frameNumber (>= 1)');
  }

  return {
    id: id || generateUUID(),
    matchId,
    frameNumber,
    winnerId,
  };
}

/**
 * Sets the winner of a frame
 * @param {FrameData} frame - Frame to update
 * @param {string} winnerId - Winner player ID
 * @returns {FrameData} - New frame with winner set
 */
export function setFrameWinner(frame, winnerId) {
  if (!winnerId || typeof winnerId !== 'string') {
    throw new Error('winnerId is required and must be a string');
  }

  return {
    ...frame,
    winnerId,
  };
}

/**
 * Checks if a frame is complete (has a winner)
 * @param {FrameData} frame - Frame to check
 * @returns {boolean}
 */
export function isFrameComplete(frame) {
  return frame.winnerId !== null;
}

/**
 * Validates a frame object
 * @param {FrameData} frame - Frame to validate
 * @returns {boolean}
 */
export function isValidFrame(frame) {
  return (
    frame &&
    typeof frame.id === 'string' &&
    typeof frame.matchId === 'string' &&
    typeof frame.frameNumber === 'number' &&
    frame.frameNumber >= 1 &&
    (frame.winnerId === null || typeof frame.winnerId === 'string')
  );
}

/**
 * Serializes a frame to a plain object for storage
 * @param {FrameData} frame - Frame to serialize
 * @returns {FrameData}
 */
export function serializeFrame(frame) {
  return {
    id: frame.id,
    matchId: frame.matchId,
    frameNumber: frame.frameNumber,
    winnerId: frame.winnerId,
  };
}

/**
 * Deserializes a plain object to a frame
 * @param {Object} data - Data to deserialize
 * @returns {FrameData}
 */
export function deserializeFrame(data) {
  return createFrame({
    id: data.id,
    matchId: data.matchId,
    frameNumber: data.frameNumber,
    winnerId: data.winnerId,
  });
}

export default {
  createFrame,
  setFrameWinner,
  isFrameComplete,
  isValidFrame,
  serializeFrame,
  deserializeFrame,
};
