/**
 * Storage Factory
 * Creates and manages storage adapters
 */

import { LocalStorageAdapter } from './LocalStorageAdapter.js';
import { AzureBlobStorageAdapter, createAzureAdapterFromEnv } from './AzureBlobStorageAdapter.js';

/**
 * Storage adapter singleton
 * @type {import('./StorageAdapter.js').StorageAdapterBase|null}
 */
let storageInstance = null;

/**
 * Initializes the storage adapter
 * Must be called once at application startup before using getStorage()
 * @returns {Promise<import('./StorageAdapter.js').StorageAdapterBase>}
 */
export async function initializeStorage() {
  if (storageInstance) {
    return storageInstance;
  }

  // Try Azure first
  const azureAdapter = createAzureAdapterFromEnv();
  if (azureAdapter) {
    const isAzureAvailable = await azureAdapter.isAvailable();
    if (isAzureAvailable) {
      storageInstance = azureAdapter;
      return storageInstance;
    }
  }

  // Fall back to localStorage
  const localAdapter = new LocalStorageAdapter();
  const isLocalAvailable = await localAdapter.isAvailable();

  if (!isLocalAvailable) {
    throw new Error('No storage adapter available');
  }

  storageInstance = localAdapter;
  return storageInstance;
}

/**
 * Gets the configured storage adapter synchronously
 * Storage must be initialized first via initializeStorage()
 * @returns {import('./StorageAdapter.js').StorageAdapterBase}
 */
export function getStorage() {
  if (!storageInstance) {
    // Auto-initialize with localStorage for backwards compatibility
    storageInstance = new LocalStorageAdapter();
  }
  return storageInstance;
}

/**
 * Resets the storage instance (useful for testing)
 */
export function resetStorage() {
  storageInstance = null;
}

/**
 * Forces use of a specific storage adapter
 * @param {import('./StorageAdapter.js').StorageAdapterBase} adapter - Adapter to use
 */
export function setStorage(adapter) {
  storageInstance = adapter;
}

/**
 * Gets the current storage adapter name
 * @returns {Promise<string>}
 */
export async function getStorageName() {
  const storage = await getStorage();
  return storage.getName();
}

/**
 * Checks if Azure storage is configured
 * @returns {boolean}
 */
export function isAzureConfigured() {
  return Boolean(
    import.meta.env.VITE_AZURE_STORAGE_URL &&
      import.meta.env.VITE_AZURE_CONTAINER_NAME &&
      import.meta.env.VITE_AZURE_SAS_TOKEN
  );
}

export { LocalStorageAdapter, AzureBlobStorageAdapter };

export default {
  getStorage,
  resetStorage,
  setStorage,
  getStorageName,
  isAzureConfigured,
  LocalStorageAdapter,
  AzureBlobStorageAdapter,
};
