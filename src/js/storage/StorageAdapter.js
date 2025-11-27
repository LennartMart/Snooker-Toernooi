/**
 * Storage Adapter Interface
 * Abstract base class defining the storage contract
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {function(string, any): Promise<void>} save - Save data with a key
 * @property {function(string): Promise<any|null>} load - Load data by key
 * @property {function(string): Promise<boolean>} delete - Delete data by key
 * @property {function(string): Promise<string[]>} list - List keys matching prefix
 * @property {function(): Promise<boolean>} isAvailable - Check if storage is available
 */

/**
 * Storage key prefixes
 */
export const StorageKeys = {
  SEASONS: 'seasons',
  TOURNAMENTS: 'tournaments',
  PLAYERS: 'players',
  APP_STATE: 'app-state',
};

/**
 * Creates a full storage key with prefix
 * @param {string} prefix - Key prefix
 * @param {string} id - Entity ID
 * @returns {string} Full key
 */
export function createStorageKey(prefix, id) {
  return `${prefix}/${id}`;
}

/**
 * Parses a storage key to extract prefix and ID
 * @param {string} key - Full key
 * @returns {{prefix: string, id: string}}
 */
export function parseStorageKey(key) {
  const parts = key.split('/');
  return {
    prefix: parts[0],
    id: parts.slice(1).join('/'),
  };
}

/**
 * Abstract StorageAdapter class
 * Implementations must provide all methods
 */
export class StorageAdapterBase {
  /**
   * Save data with a key
   * @param {string} key - Storage key
   * @param {any} data - Data to save (will be JSON serialized)
   * @returns {Promise<void>}
   */
  async save(_key, _data) {
    throw new Error('save() must be implemented by subclass');
  }

  /**
   * Load data by key
   * @param {string} key - Storage key
   * @returns {Promise<any|null>} Data or null if not found
   */
  async load(_key) {
    throw new Error('load() must be implemented by subclass');
  }

  /**
   * Delete data by key
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(_key) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * List keys matching a prefix
   * @param {string} prefix - Key prefix to match
   * @returns {Promise<string[]>} Array of matching keys
   */
  async list(_prefix) {
    throw new Error('list() must be implemented by subclass');
  }

  /**
   * Check if storage is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error('isAvailable() must be implemented by subclass');
  }

  /**
   * Get the adapter name for logging
   * @returns {string}
   */
  getName() {
    return 'StorageAdapter';
  }

  /**
   * Alias for load() - gets an item from storage
   * @param {string} key - Storage key
   * @returns {Promise<any|null>} Data or null if not found
   */
  async getItem(key) {
    return this.load(key);
  }

  /**
   * Alias for save() - sets an item in storage
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   * @returns {Promise<void>}
   */
  async setItem(key, data) {
    return this.save(key, data);
  }

  /**
   * Alias for delete() - removes an item from storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async removeItem(key) {
    return this.delete(key);
  }
}

export default {
  StorageKeys,
  createStorageKey,
  parseStorageKey,
  StorageAdapterBase,
};
