/**
 * Storage Index
 * Exports all storage modules
 */

export {
  StorageKeys,
  createStorageKey,
  parseStorageKey,
  StorageAdapterBase,
} from './StorageAdapter.js';

export { LocalStorageAdapter } from './LocalStorageAdapter.js';

export { AzureBlobStorageAdapter, createAzureAdapterFromEnv } from './AzureBlobStorageAdapter.js';

export {
  getStorage,
  initializeStorage,
  resetStorage,
  setStorage,
  getStorageName,
  isAzureConfigured,
} from './StorageFactory.js';
