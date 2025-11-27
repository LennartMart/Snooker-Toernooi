/**
 * LocalStorage Adapter
 * Implements StorageAdapter using browser localStorage
 */

import { StorageAdapterBase } from './StorageAdapter.js';

/**
 * Storage key prefix to namespace our data
 */
const STORAGE_PREFIX = 'snooker-tournament';

/**
 * LocalStorageAdapter - Uses browser localStorage for persistence
 * Good for development and offline fallback
 */
export class LocalStorageAdapter extends StorageAdapterBase {
  /**
   * Creates a prefixed key for localStorage
   * @param {string} key - Original key
   * @returns {string} Prefixed key
   * @private
   */
  _getPrefixedKey(key) {
    return `${STORAGE_PREFIX}:${key}`;
  }

  /**
   * Removes the prefix from a key
   * @param {string} prefixedKey - Prefixed key
   * @returns {string} Original key
   * @private
   */
  _removePrefixFromKey(prefixedKey) {
    return prefixedKey.replace(`${STORAGE_PREFIX}:`, '');
  }

  /**
   * @inheritdoc
   */
  async save(key, data) {
    try {
      const prefixedKey = this._getPrefixedKey(key);
      const serialized = JSON.stringify(data);
      localStorage.setItem(prefixedKey, serialized);
    } catch (error) {
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage quota exceeded. Please clear some data.');
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async load(key) {
    const prefixedKey = this._getPrefixedKey(key);
    const data = localStorage.getItem(prefixedKey);

    if (data === null) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * @inheritdoc
   */
  async delete(key) {
    const prefixedKey = this._getPrefixedKey(key);
    const exists = localStorage.getItem(prefixedKey) !== null;

    if (exists) {
      localStorage.removeItem(prefixedKey);
      return true;
    }

    return false;
  }

  /**
   * @inheritdoc
   */
  async list(prefix) {
    const keys = [];
    const searchPrefix = this._getPrefixedKey(prefix);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(searchPrefix)) {
        keys.push(this._removePrefixFromKey(key));
      }
    }

    return keys;
  }

  /**
   * @inheritdoc
   */
  async isAvailable() {
    try {
      const testKey = `${STORAGE_PREFIX}:__test__`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  getName() {
    return 'LocalStorageAdapter';
  }

  /**
   * Clears all data with our prefix
   * @returns {Promise<void>}
   */
  async clearAll() {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Gets total size of stored data in bytes (approximate)
   * @returns {Promise<number>}
   */
  async getStorageSize() {
    let size = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    }

    // Multiply by 2 for UTF-16 encoding
    return size * 2;
  }
}

export default LocalStorageAdapter;
