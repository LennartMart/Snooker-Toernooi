/**
 * Export Service
 * Handles exporting tournament and season data as downloadable JSON files
 */

import { getStorage } from '../storage/index.js';

/**
 * @typedef {Object} ExportOptions
 * @property {boolean} [includePlayers=true] - Include player data
 * @property {boolean} [includeSeasons=true] - Include season data
 * @property {boolean} [includeTournaments=true] - Include tournament data
 * @property {boolean} [includeMatches=true] - Include match data
 * @property {boolean} [includeBreaks=true] - Include break data
 * @property {boolean} [pretty=true] - Format JSON with indentation
 */

/**
 * @typedef {Object} ExportData
 * @property {Object} metadata - Export metadata
 * @property {string} metadata.version - Export format version
 * @property {string} metadata.exportDate - Export timestamp
 * @property {string} metadata.appName - Application name
 * @property {Object} [players] - Player data
 * @property {Object} [seasons] - Season data
 * @property {Object} [tournaments] - Tournament data
 * @property {Object} [matches] - Match data
 * @property {Object} [breaks] - Break data
 */

/**
 * Current export format version
 */
export const EXPORT_VERSION = '1.0.0';

/**
 * Application name for export metadata
 */
export const APP_NAME = 'Snooker Tournament Platform';

/**
 * Default export options
 * @type {ExportOptions}
 */
export const DEFAULT_EXPORT_OPTIONS = {
  includePlayers: true,
  includeSeasons: true,
  includeTournaments: true,
  includeMatches: true,
  includeBreaks: true,
  pretty: true,
};

/**
 * Creates export metadata
 * @returns {Object}
 */
function createMetadata() {
  return {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    appName: APP_NAME,
  };
}

/**
 * Exports all data from storage
 * @param {ExportOptions} [options] - Export options
 * @returns {Promise<ExportData>}
 */
export async function exportAllData(options = {}) {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const storage = getStorage();
  
  const exportData = {
    metadata: createMetadata(),
  };
  
  if (opts.includePlayers) {
    exportData.players = (await storage.getItem('players')) || [];
  }
  
  if (opts.includeSeasons) {
    exportData.seasons = (await storage.getItem('seasons')) || [];
    exportData.currentSeasonId = await storage.getItem('currentSeasonId');
  }
  
  if (opts.includeTournaments) {
    exportData.tournaments = (await storage.getItem('tournaments')) || [];
  }
  
  if (opts.includeMatches) {
    exportData.matches = (await storage.getItem('matches')) || [];
  }
  
  if (opts.includeBreaks) {
    exportData.breaks = (await storage.getItem('breaks')) || [];
  }
  
  return exportData;
}

/**
 * Exports a specific season with all its tournaments
 * @param {string} seasonId - Season ID
 * @param {ExportOptions} [options] - Export options
 * @returns {Promise<ExportData>}
 */
export async function exportSeason(seasonId, options = {}) {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const storage = getStorage();
  
  // Get season
  const seasons = (await storage.getItem('seasons')) || [];
  const season = seasons.find((s) => s.id === seasonId);
  
  if (!season) {
    throw new Error(`Season not found: ${seasonId}`);
  }
  
  const exportData = {
    metadata: {
      ...createMetadata(),
      exportType: 'season',
      seasonId,
      seasonName: season.name,
    },
    seasons: [season],
  };
  
  // Get tournament IDs from season
  const tournamentIds = season.tournamentIds || [];
  
  if (opts.includeTournaments && tournamentIds.length > 0) {
    const tournaments = (await storage.getItem('tournaments')) || [];
    exportData.tournaments = tournaments.filter((t) => 
      tournamentIds.includes(t.id)
    );
  }
  
  // Get matches for these tournaments
  if (opts.includeMatches && exportData.tournaments) {
    const matches = (await storage.getItem('matches')) || [];
    const tournamentIdSet = new Set(tournamentIds);
    exportData.matches = matches.filter((m) => 
      tournamentIdSet.has(m.tournamentId)
    );
  }
  
  // Get breaks for these tournaments
  if (opts.includeBreaks && exportData.tournaments) {
    const breaks = (await storage.getItem('breaks')) || [];
    const tournamentIdSet = new Set(tournamentIds);
    exportData.breaks = breaks.filter((b) => 
      tournamentIdSet.has(b.tournamentId)
    );
  }
  
  // Get players involved
  if (opts.includePlayers && exportData.tournaments) {
    const players = (await storage.getItem('players')) || [];
    const playerIds = new Set();
    
    for (const tournament of exportData.tournaments) {
      if (tournament.playerIds) {
        tournament.playerIds.forEach((id) => playerIds.add(id));
      }
    }
    
    exportData.players = players.filter((p) => playerIds.has(p.id));
  }
  
  return exportData;
}

/**
 * Exports a specific tournament
 * @param {string} tournamentId - Tournament ID
 * @param {ExportOptions} [options] - Export options
 * @returns {Promise<ExportData>}
 */
export async function exportTournament(tournamentId, options = {}) {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const storage = getStorage();
  
  // Get tournament
  const tournaments = (await storage.getItem('tournaments')) || [];
  const tournament = tournaments.find((t) => t.id === tournamentId);
  
  if (!tournament) {
    throw new Error(`Tournament not found: ${tournamentId}`);
  }
  
  const exportData = {
    metadata: {
      ...createMetadata(),
      exportType: 'tournament',
      tournamentId,
      tournamentName: tournament.name,
    },
    tournaments: [tournament],
  };
  
  // Get matches
  if (opts.includeMatches) {
    const matches = (await storage.getItem('matches')) || [];
    exportData.matches = matches.filter((m) => m.tournamentId === tournamentId);
  }
  
  // Get breaks
  if (opts.includeBreaks) {
    const breaks = (await storage.getItem('breaks')) || [];
    exportData.breaks = breaks.filter((b) => b.tournamentId === tournamentId);
  }
  
  // Get players
  if (opts.includePlayers && tournament.playerIds) {
    const players = (await storage.getItem('players')) || [];
    const playerIdSet = new Set(tournament.playerIds);
    exportData.players = players.filter((p) => playerIdSet.has(p.id));
  }
  
  return exportData;
}

/**
 * Converts export data to JSON string
 * @param {ExportData} data - Export data
 * @param {boolean} [pretty=true] - Format with indentation
 * @returns {string}
 */
export function toJSON(data, pretty = true) {
  return pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
}

/**
 * Creates a downloadable blob from export data
 * @param {ExportData} data - Export data
 * @param {boolean} [pretty=true] - Format with indentation
 * @returns {Blob}
 */
export function createBlob(data, pretty = true) {
  const json = toJSON(data, pretty);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Generates a filename for export
 * @param {string} type - Export type (all, season, tournament)
 * @param {string} [name] - Item name for season/tournament exports
 * @returns {string}
 */
export function generateFilename(type, name) {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = name 
    ? name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    : '';
  
  switch (type) {
    case 'season':
      return `snooker-season-${safeName}-${timestamp}.json`;
    case 'tournament':
      return `snooker-tournament-${safeName}-${timestamp}.json`;
    default:
      return `snooker-backup-${timestamp}.json`;
  }
}

/**
 * Triggers a download of export data
 * @param {ExportData} data - Export data
 * @param {string} [filename] - Custom filename
 */
export function downloadExport(data, filename) {
  const blob = createBlob(data);
  const url = URL.createObjectURL(blob);
  
  const type = data.metadata?.exportType || 'all';
  const name = data.metadata?.seasonName || data.metadata?.tournamentName;
  const downloadFilename = filename || generateFilename(type, name);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports and downloads all data
 * @param {ExportOptions} [options] - Export options
 */
export async function exportAndDownloadAll(options) {
  const data = await exportAllData(options);
  downloadExport(data);
}

/**
 * Exports and downloads a season
 * @param {string} seasonId - Season ID
 * @param {ExportOptions} [options] - Export options
 */
export async function exportAndDownloadSeason(seasonId, options) {
  const data = await exportSeason(seasonId, options);
  downloadExport(data);
}

/**
 * Exports and downloads a tournament
 * @param {string} tournamentId - Tournament ID
 * @param {ExportOptions} [options] - Export options
 */
export async function exportAndDownloadTournament(tournamentId, options) {
  const data = await exportTournament(tournamentId, options);
  downloadExport(data);
}

/**
 * Gets export statistics
 * @param {ExportData} data - Export data
 * @returns {Object}
 */
export function getExportStats(data) {
  return {
    version: data.metadata?.version || 'unknown',
    exportDate: data.metadata?.exportDate || 'unknown',
    playerCount: data.players?.length || 0,
    seasonCount: data.seasons?.length || 0,
    tournamentCount: data.tournaments?.length || 0,
    matchCount: data.matches?.length || 0,
    breakCount: data.breaks?.length || 0,
    sizeBytes: toJSON(data, false).length,
  };
}

export default {
  EXPORT_VERSION,
  APP_NAME,
  DEFAULT_EXPORT_OPTIONS,
  exportAllData,
  exportSeason,
  exportTournament,
  toJSON,
  createBlob,
  generateFilename,
  downloadExport,
  exportAndDownloadAll,
  exportAndDownloadSeason,
  exportAndDownloadTournament,
  getExportStats,
};
