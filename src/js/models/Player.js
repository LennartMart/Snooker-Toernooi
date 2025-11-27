/**
 * Player Model
 * Represents a tournament participant or bye placeholder
 */

import { generateUUID } from '../utils/uuid.js';

/**
 * @typedef {Object} PlayerData
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Player display name
 * @property {boolean} isBye - True if this is a bye placeholder
 * @property {string} createdAt - ISO timestamp of creation
 */

/**
 * Creates a new Player instance
 * @param {Object} params - Player parameters
 * @param {string} [params.id] - Optional ID (generated if not provided)
 * @param {string} params.name - Player display name
 * @param {boolean} [params.isBye=false] - Whether this is a bye placeholder
 * @param {string} [params.createdAt] - ISO timestamp (generated if not provided)
 * @returns {PlayerData}
 */
export function createPlayer({ id, name, isBye = false, createdAt } = {}) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Player name is required and must be a non-empty string');
  }

  return {
    id: id || generateUUID(),
    name: name.trim(),
    isBye: Boolean(isBye),
    createdAt: createdAt || new Date().toISOString(),
  };
}

/**
 * Creates a bye placeholder player
 * @param {number} [index] - Optional index for naming multiple byes
 * @returns {PlayerData}
 */
export function createByePlayer(index) {
  const name = index !== undefined ? `BYE ${index + 1}` : 'BYE';
  return createPlayer({ name, isBye: true });
}

/**
 * Validates a player object
 * @param {PlayerData} player - Player to validate
 * @returns {boolean}
 */
export function isValidPlayer(player) {
  return (
    player &&
    typeof player.id === 'string' &&
    typeof player.name === 'string' &&
    player.name.trim() !== '' &&
    typeof player.isBye === 'boolean' &&
    typeof player.createdAt === 'string'
  );
}

/**
 * Serializes a player to a plain object for storage
 * @param {PlayerData} player - Player to serialize
 * @returns {PlayerData}
 */
export function serializePlayer(player) {
  return {
    id: player.id,
    name: player.name,
    isBye: player.isBye,
    createdAt: player.createdAt,
  };
}

/**
 * Deserializes a plain object to a player
 * @param {Object} data - Data to deserialize
 * @returns {PlayerData}
 */
export function deserializePlayer(data) {
  return createPlayer({
    id: data.id,
    name: data.name,
    isBye: data.isBye,
    createdAt: data.createdAt,
  });
}

export default {
  createPlayer,
  createByePlayer,
  isValidPlayer,
  serializePlayer,
  deserializePlayer,
};
