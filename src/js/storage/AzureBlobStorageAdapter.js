/**
 * Azure Blob Storage Adapter
 * Implements StorageAdapter using Azure Blob Storage
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { StorageAdapterBase } from './StorageAdapter.js';

/**
 * AzureBlobStorageAdapter - Uses Azure Blob Storage for persistence
 * Requires SAS token configuration
 */
export class AzureBlobStorageAdapter extends StorageAdapterBase {
  /**
   * Creates an AzureBlobStorageAdapter instance
   * @param {Object} config - Configuration options
   * @param {string} config.storageUrl - Azure Storage account URL
   * @param {string} config.containerName - Blob container name
   * @param {string} config.sasToken - SAS token for authentication
   */
  constructor({ storageUrl, containerName, sasToken }) {
    super();

    if (!storageUrl || !containerName || !sasToken) {
      throw new Error('Azure Storage configuration incomplete');
    }

    this._storageUrl = storageUrl;
    this._containerName = containerName;
    this._sasToken = sasToken;
    this._containerClient = null;
  }

  /**
   * Gets or creates the container client
   * @returns {import('@azure/storage-blob').ContainerClient}
   * @private
   */
  _getContainerClient() {
    if (!this._containerClient) {
      const blobServiceClient = new BlobServiceClient(`${this._storageUrl}?${this._sasToken}`);
      this._containerClient = blobServiceClient.getContainerClient(this._containerName);
    }
    return this._containerClient;
  }

  /**
   * Converts a key to a blob name
   * @param {string} key - Storage key
   * @returns {string} Blob name
   * @private
   */
  _getBlobName(key) {
    // Replace slashes with a safe separator for blob names
    return `${key}.json`;
  }

  /**
   * @inheritdoc
   */
  async save(key, data) {
    const containerClient = this._getContainerClient();
    const blobName = this._getBlobName(key);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const content = JSON.stringify(data, null, 2);
    const contentBuffer = new TextEncoder().encode(content);

    await blockBlobClient.uploadData(contentBuffer, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
    });
  }

  /**
   * @inheritdoc
   */
  async load(key) {
    try {
      const containerClient = this._getContainerClient();
      const blobName = this._getBlobName(key);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download(0);

      // Convert stream to text
      const blobBody = await downloadResponse.blobBody;
      if (!blobBody) {
        return null;
      }

      const text = await blobBody.text();
      return JSON.parse(text);
    } catch (error) {
      // Return null if blob doesn't exist
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async delete(key) {
    try {
      const containerClient = this._getContainerClient();
      const blobName = this._getBlobName(key);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.delete();
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async list(prefix) {
    const containerClient = this._getContainerClient();
    const blobPrefix = `${prefix}`;
    const keys = [];

    // List blobs with the given prefix
    for await (const blob of containerClient.listBlobsFlat({ prefix: blobPrefix })) {
      // Remove .json extension to get the key
      const key = blob.name.replace(/\.json$/, '');
      keys.push(key);
    }

    return keys;
  }

  /**
   * @inheritdoc
   */
  async isAvailable() {
    try {
      const containerClient = this._getContainerClient();
      // Try to get container properties to verify connection
      await containerClient.getProperties();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  getName() {
    return 'AzureBlobStorageAdapter';
  }

  /**
   * Ensures the container exists
   * @returns {Promise<void>}
   */
  async ensureContainer() {
    const containerClient = this._getContainerClient();
    await containerClient.createIfNotExists({
      access: 'blob', // Public read access for blobs
    });
  }
}

/**
 * Creates an Azure adapter from environment variables
 * @returns {AzureBlobStorageAdapter|null}
 */
export function createAzureAdapterFromEnv() {
  const storageUrl = import.meta.env.VITE_AZURE_STORAGE_URL;
  const containerName = import.meta.env.VITE_AZURE_CONTAINER_NAME;
  const sasToken = import.meta.env.VITE_AZURE_SAS_TOKEN;

  if (!storageUrl || !containerName || !sasToken) {
    return null;
  }

  return new AzureBlobStorageAdapter({
    storageUrl,
    containerName,
    sasToken,
  });
}

export default AzureBlobStorageAdapter;
