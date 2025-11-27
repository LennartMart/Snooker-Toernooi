/**
 * Import Service
 * Handles importing tournament and season data from JSON files
 */

import { getStorage } from '../storage/index.js';
import { EXPORT_VERSION } from './ExportService.js';

/**
 * @typedef {Object} ImportOptions
 * @property {'replace' | 'merge'} [mode='merge'] - Import mode
 * @property {boolean} [validateOnly=false] - Only validate, don't import
 * @property {boolean} [skipValidation=false] - Skip schema validation
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import was successful
 * @property {string[]} errors - Error messages
 * @property {string[]} warnings - Warning messages
 * @property {Object} stats - Import statistics
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether data is valid
 * @property {string[]} errors - Validation errors
 * @property {string[]} warnings - Validation warnings
 * @property {Object} summary - Data summary
 */

/**
 * Default import options
 * @type {ImportOptions}
 */
export const DEFAULT_IMPORT_OPTIONS = {
  mode: 'merge',
  validateOnly: false,
  skipValidation: false,
};

/**
 * Supported export versions for import
 */
export const SUPPORTED_VERSIONS = ['1.0.0'];

/**
 * Parses JSON data from string
 * @param {string} jsonString - JSON string to parse
 * @returns {{ data: Object | null, error: string | null }}
 */
export function parseJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return { data, error: null };
  } catch (e) {
    return { data: null, error: `Invalid JSON: ${e.message}` };
  }
}

/**
 * Reads file as text
 * @param {File} file - File to read
 * @returns {Promise<string>}
 */
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Validates import data structure
 * @param {Object} data - Data to validate
 * @returns {ValidationResult}
 */
export function validateImportData(data) {
  const errors = [];
  const warnings = [];
  
  // Check metadata
  if (!data.metadata) {
    errors.push('Missing metadata section');
  } else {
    // Check version
    if (!data.metadata.version) {
      warnings.push('Missing version in metadata');
    } else if (!SUPPORTED_VERSIONS.includes(data.metadata.version)) {
      warnings.push(`Version ${data.metadata.version} may not be fully compatible (supported: ${SUPPORTED_VERSIONS.join(', ')})`);
    }
    
    // Check export date
    if (!data.metadata.exportDate) {
      warnings.push('Missing export date in metadata');
    }
  }
  
  // Validate players array
  if (data.players !== undefined) {
    if (!Array.isArray(data.players)) {
      errors.push('Players must be an array');
    } else {
      data.players.forEach((player, index) => {
        if (!player.id) {
          errors.push(`Player at index ${index} missing id`);
        }
        if (!player.name) {
          warnings.push(`Player at index ${index} missing name`);
        }
      });
    }
  }
  
  // Validate seasons array
  if (data.seasons !== undefined) {
    if (!Array.isArray(data.seasons)) {
      errors.push('Seasons must be an array');
    } else {
      data.seasons.forEach((season, index) => {
        if (!season.id) {
          errors.push(`Season at index ${index} missing id`);
        }
        if (!season.name) {
          warnings.push(`Season at index ${index} missing name`);
        }
      });
    }
  }
  
  // Validate tournaments array
  if (data.tournaments !== undefined) {
    if (!Array.isArray(data.tournaments)) {
      errors.push('Tournaments must be an array');
    } else {
      data.tournaments.forEach((tournament, index) => {
        if (!tournament.id) {
          errors.push(`Tournament at index ${index} missing id`);
        }
        if (!tournament.name) {
          warnings.push(`Tournament at index ${index} missing name`);
        }
      });
    }
  }
  
  // Validate matches array
  if (data.matches !== undefined) {
    if (!Array.isArray(data.matches)) {
      errors.push('Matches must be an array');
    } else {
      data.matches.forEach((match, index) => {
        if (!match.id) {
          errors.push(`Match at index ${index} missing id`);
        }
        if (!match.tournamentId) {
          warnings.push(`Match at index ${index} missing tournamentId`);
        }
      });
    }
  }
  
  // Validate breaks array
  if (data.breaks !== undefined) {
    if (!Array.isArray(data.breaks)) {
      errors.push('Breaks must be an array');
    } else {
      data.breaks.forEach((breakRecord, index) => {
        if (!breakRecord.id) {
          errors.push(`Break at index ${index} missing id`);
        }
        if (typeof breakRecord.value !== 'number') {
          warnings.push(`Break at index ${index} has invalid value`);
        }
      });
    }
  }
  
  // Create summary
  const summary = {
    version: data.metadata?.version || 'unknown',
    exportDate: data.metadata?.exportDate || 'unknown',
    exportType: data.metadata?.exportType || 'full',
    playerCount: data.players?.length || 0,
    seasonCount: data.seasons?.length || 0,
    tournamentCount: data.tournaments?.length || 0,
    matchCount: data.matches?.length || 0,
    breakCount: data.breaks?.length || 0,
  };
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

/**
 * Merges arrays by ID, preferring new data
 * @param {Array} existing - Existing array
 * @param {Array} incoming - Incoming array
 * @param {string} [idField='id'] - Field to use as ID
 * @returns {Array}
 */
function mergeArraysById(existing, incoming, idField = 'id') {
  const map = new Map();
  
  // Add existing items
  for (const item of existing) {
    map.set(item[idField], item);
  }
  
  // Override with incoming items
  for (const item of incoming) {
    map.set(item[idField], item);
  }
  
  return Array.from(map.values());
}

/**
 * Imports data into storage
 * @param {Object} data - Data to import
 * @param {ImportOptions} [options] - Import options
 * @returns {Promise<ImportResult>}
 */
export async function importData(data, options = {}) {
  const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options };
  const warnings = [];
  const stats = {
    playersImported: 0,
    seasonsImported: 0,
    tournamentsImported: 0,
    matchesImported: 0,
    breaksImported: 0,
  };
  
  // Validate first
  if (!opts.skipValidation) {
    const validation = validateImportData(data);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
        stats,
      };
    }
    warnings.push(...validation.warnings);
  }
  
  // If validate only, return here
  if (opts.validateOnly) {
    return {
      success: true,
      errors: [],
      warnings,
      stats: validateImportData(data).summary,
    };
  }
  
  const storage = getStorage();
  
  try {
    // Import players
    if (data.players) {
      const existing = opts.mode === 'replace' ? [] : ((await storage.getItem('players')) || []);
      const merged = opts.mode === 'replace' ? data.players : mergeArraysById(existing, data.players);
      await storage.setItem('players', merged);
      stats.playersImported = data.players.length;
    }
    
    // Import seasons
    if (data.seasons) {
      const existing = opts.mode === 'replace' ? [] : ((await storage.getItem('seasons')) || []);
      const merged = opts.mode === 'replace' ? data.seasons : mergeArraysById(existing, data.seasons);
      await storage.setItem('seasons', merged);
      stats.seasonsImported = data.seasons.length;
    }
    
    // Import current season ID
    if (data.currentSeasonId !== undefined) {
      await storage.setItem('currentSeasonId', data.currentSeasonId);
    }
    
    // Import tournaments
    if (data.tournaments) {
      const existing = opts.mode === 'replace' ? [] : ((await storage.getItem('tournaments')) || []);
      const merged = opts.mode === 'replace' ? data.tournaments : mergeArraysById(existing, data.tournaments);
      await storage.setItem('tournaments', merged);
      stats.tournamentsImported = data.tournaments.length;
    }
    
    // Import matches
    if (data.matches) {
      const existing = opts.mode === 'replace' ? [] : ((await storage.getItem('matches')) || []);
      const merged = opts.mode === 'replace' ? data.matches : mergeArraysById(existing, data.matches);
      await storage.setItem('matches', merged);
      stats.matchesImported = data.matches.length;
    }
    
    // Import breaks
    if (data.breaks) {
      const existing = opts.mode === 'replace' ? [] : ((await storage.getItem('breaks')) || []);
      const merged = opts.mode === 'replace' ? data.breaks : mergeArraysById(existing, data.breaks);
      await storage.setItem('breaks', merged);
      stats.breaksImported = data.breaks.length;
    }
    
    return {
      success: true,
      errors: [],
      warnings,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Import failed: ${error.message}`],
      warnings,
      stats,
    };
  }
}

/**
 * Imports from a file
 * @param {File} file - File to import from
 * @param {ImportOptions} [options] - Import options
 * @returns {Promise<ImportResult>}
 */
export async function importFromFile(file, options) {
  // Validate file type
  if (!file.name.endsWith('.json')) {
    return {
      success: false,
      errors: ['File must be a .json file'],
      warnings: [],
      stats: {},
    };
  }
  
  // Read file
  let content;
  try {
    content = await readFile(file);
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to read file: ${error.message}`],
      warnings: [],
      stats: {},
    };
  }
  
  // Parse JSON
  const { data, error } = parseJSON(content);
  if (error) {
    return {
      success: false,
      errors: [error],
      warnings: [],
      stats: {},
    };
  }
  
  // Import data
  return importData(data, options);
}

/**
 * Validates a file without importing
 * @param {File} file - File to validate
 * @returns {Promise<ValidationResult>}
 */
export async function validateFile(file) {
  // Read file
  let content;
  try {
    content = await readFile(file);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read file: ${error.message}`],
      warnings: [],
      summary: {},
    };
  }
  
  // Parse JSON
  const { data, error } = parseJSON(content);
  if (error) {
    return {
      valid: false,
      errors: [error],
      warnings: [],
      summary: {},
    };
  }
  
  // Validate data
  return validateImportData(data);
}

/**
 * Clears all data from storage
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  const storage = getStorage();
  
  await storage.setItem('players', []);
  await storage.setItem('seasons', []);
  await storage.setItem('tournaments', []);
  await storage.setItem('matches', []);
  await storage.setItem('breaks', []);
  await storage.removeItem('currentSeasonId');
}

/**
 * Creates an import preview without importing
 * @param {Object} data - Data to preview
 * @returns {Object} Preview information
 */
export function createImportPreview(data) {
  const validation = validateImportData(data);
  
  return {
    isValid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    summary: validation.summary,
    metadata: data.metadata || {},
    sampleData: {
      players: data.players?.slice(0, 5) || [],
      seasons: data.seasons?.slice(0, 5) || [],
      tournaments: data.tournaments?.slice(0, 5) || [],
    },
  };
}

/**
 * Checks compatibility between export version and current app
 * @param {string} version - Export version
 * @returns {{ compatible: boolean, message: string }}
 */
export function checkVersionCompatibility(version) {
  if (!version) {
    return {
      compatible: true,
      message: 'No version specified, assuming compatible',
    };
  }
  
  if (SUPPORTED_VERSIONS.includes(version)) {
    return {
      compatible: true,
      message: `Version ${version} is fully supported`,
    };
  }
  
  // Check major version compatibility
  const [major] = version.split('.');
  const [currentMajor] = EXPORT_VERSION.split('.');
  
  if (major === currentMajor) {
    return {
      compatible: true,
      message: `Version ${version} should be compatible (same major version)`,
    };
  }
  
  return {
    compatible: false,
    message: `Version ${version} may not be compatible with current version ${EXPORT_VERSION}`,
  };
}

export default {
  DEFAULT_IMPORT_OPTIONS,
  SUPPORTED_VERSIONS,
  parseJSON,
  readFile,
  validateImportData,
  importData,
  importFromFile,
  validateFile,
  clearAllData,
  createImportPreview,
  checkVersionCompatibility,
};
