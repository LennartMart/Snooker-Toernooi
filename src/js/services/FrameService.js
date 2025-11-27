/**
 * Frame Service
 * Handles frame creation and winner determination
 */

import { createFrame, setFrameWinner, isFrameComplete } from '../models/Frame.js';

/**
 * Creates frames for a match
 * @param {string} matchId - Match ID to create frames for
 * @param {number} bestOf - Number of frames (best of N)
 * @returns {import('../models/Frame.js').FrameData[]}
 */
export function createFramesForMatch(matchId, bestOf) {
  if (!matchId || typeof matchId !== 'string') {
    throw new Error('matchId is required');
  }

  if (typeof bestOf !== 'number' || bestOf < 1) {
    throw new Error('bestOf must be a positive integer');
  }

  const frames = [];
  for (let i = 1; i <= bestOf; i++) {
    frames.push(
      createFrame({
        matchId,
        frameNumber: i,
      })
    );
  }

  return frames;
}

/**
 * Records the winner of a frame
 * @param {import('../models/Frame.js').FrameData} frame - Frame to update
 * @param {string} winnerId - Player ID who won the frame
 * @returns {import('../models/Frame.js').FrameData}
 */
export function recordFrameWinner(frame, winnerId) {
  if (!frame) {
    throw new Error('Frame is required');
  }

  if (!winnerId || typeof winnerId !== 'string') {
    throw new Error('winnerId is required');
  }

  return setFrameWinner(frame, winnerId);
}

/**
 * Determines if a match is complete based on frame results
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of frames
 * @param {number} bestOf - Best of N frames
 * @param {string} player1Id - First player ID
 * @param {string} player2Id - Second player ID
 * @returns {{ isComplete: boolean, winnerId: string|null, player1Wins: number, player2Wins: number }}
 */
export function determineMatchWinner(frames, bestOf, player1Id, player2Id) {
  const framesNeeded = Math.ceil(bestOf / 2);

  let player1Wins = 0;
  let player2Wins = 0;

  for (const frame of frames) {
    if (isFrameComplete(frame)) {
      if (frame.winnerId === player1Id) {
        player1Wins++;
      } else if (frame.winnerId === player2Id) {
        player2Wins++;
      }
    }
  }

  let winnerId = null;
  let isComplete = false;

  if (player1Wins >= framesNeeded) {
    winnerId = player1Id;
    isComplete = true;
  } else if (player2Wins >= framesNeeded) {
    winnerId = player2Id;
    isComplete = true;
  }

  return {
    isComplete,
    winnerId,
    player1Wins,
    player2Wins,
  };
}

/**
 * Gets frame counts for each player
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of frames
 * @param {string} player1Id - First player ID
 * @param {string} player2Id - Second player ID
 * @returns {{ player1Wins: number, player2Wins: number }}
 */
export function getFrameCounts(frames, player1Id, player2Id) {
  let player1Wins = 0;
  let player2Wins = 0;

  for (const frame of frames) {
    if (isFrameComplete(frame)) {
      if (frame.winnerId === player1Id) {
        player1Wins++;
      } else if (frame.winnerId === player2Id) {
        player2Wins++;
      }
    }
  }

  return { player1Wins, player2Wins };
}

/**
 * Gets the next available frame number
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of existing frames
 * @returns {number}
 */
export function getNextFrameNumber(frames) {
  if (!frames || frames.length === 0) {
    return 1;
  }

  const completedFrames = frames.filter(isFrameComplete);
  return completedFrames.length + 1;
}

/**
 * Gets the current frame (next frame to be played)
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of frames
 * @returns {import('../models/Frame.js').FrameData|null}
 */
export function getCurrentFrame(frames) {
  if (!frames || frames.length === 0) {
    return null;
  }

  return frames.find((frame) => !isFrameComplete(frame)) || null;
}

/**
 * Adds a new frame to the match frames
 * @param {import('../models/Frame.js').FrameData[]} frames - Existing frames
 * @param {string} matchId - Match ID
 * @returns {import('../models/Frame.js').FrameData[]}
 */
export function addFrame(frames, matchId) {
  const nextNumber = getNextFrameNumber(frames);
  const newFrame = createFrame({
    matchId,
    frameNumber: nextNumber,
  });

  return [...frames, newFrame];
}

/**
 * Updates a frame in the frames array
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of frames
 * @param {import('../models/Frame.js').FrameData} updatedFrame - Updated frame
 * @returns {import('../models/Frame.js').FrameData[]}
 */
export function updateFrameInArray(frames, updatedFrame) {
  return frames.map((frame) => (frame.id === updatedFrame.id ? updatedFrame : frame));
}

/**
 * Gets frame by ID
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of frames
 * @param {string} frameId - Frame ID
 * @returns {import('../models/Frame.js').FrameData|undefined}
 */
export function getFrameById(frames, frameId) {
  return frames.find((frame) => frame.id === frameId);
}

/**
 * Gets frame by number
 * @param {import('../models/Frame.js').FrameData[]} frames - Array of frames
 * @param {number} frameNumber - Frame number
 * @returns {import('../models/Frame.js').FrameData|undefined}
 */
export function getFrameByNumber(frames, frameNumber) {
  return frames.find((frame) => frame.frameNumber === frameNumber);
}

export default {
  createFramesForMatch,
  recordFrameWinner,
  determineMatchWinner,
  getFrameCounts,
  getNextFrameNumber,
  getCurrentFrame,
  addFrame,
  updateFrameInArray,
  getFrameById,
  getFrameByNumber,
};
