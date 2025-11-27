/**
 * Services Index
 * Exports all services for convenient importing
 */

// Player Service
export {
  createPlayer,
  updatePlayer,
  getPlayerById,
  getAllPlayers,
  deletePlayer,
  searchPlayers,
  validatePlayerName,
} from './PlayerService.js';

// Tournament Config Service
export {
  REGULAR_TOURNAMENT_DEFAULTS,
  MASTERS_TOURNAMENT_DEFAULTS,
  VALID_PLAYER_COUNTS,
  POOL_CONFIGURATIONS,
  getDefaultConfig,
  validateTournamentConfig,
  createTournamentConfig,
  suggestPoolCounts,
  calculatePoolMatches,
  calculateKnockoutSize,
  validateFormatConstraints,
} from './TournamentConfigService.js';

// Tournament Service
export {
  createTournament,
  saveTournament,
  loadTournament,
  getTournamentById,
  getAllTournaments,
  updateTournamentStatus,
  deleteTournament,
  getTournamentsBySeasonId,
  isTournamentComplete,
} from './TournamentService.js';

// Pool Generator Service
export {
  generatePools,
  generatePoolsRandom,
  generatePoolsSeeded,
  distributePlayersToPools,
  validatePoolAssignment,
} from './PoolGeneratorService.js';

// Match Generator Service
export {
  generatePoolMatches,
  generateRoundRobinMatches,
  getMatchesByPoolId,
  getMatchesByTournamentId,
  getIncompleteMatches,
} from './MatchGeneratorService.js';

// Frame Service
export {
  createFrame,
  updateFrameScore,
  getFrameWinner,
  calculateFrameStatus,
  isFrameComplete,
  getFramesByMatchId,
} from './FrameService.js';

// Break Service
export {
  createBreak,
  getBreaksByTournamentId,
  getBreaksByMatchId,
  getBreaksByPlayer,
  getHighestBreakValue,
  getBreaksAboveThreshold,
  getTournamentHighBreaks,
} from './BreakService.js';

// Match Service
export {
  getMatchById,
  updateMatchScore,
  determineMatchWinner,
  isMatchComplete,
  calculateMatchScore,
  getMatchPlayers,
} from './MatchService.js';

// Pool Standings Service
export {
  calculatePoolStandings,
  getPoolStandingsWithDetails,
  determinePoolQualifiers,
  getPoolSummary,
} from './PoolStandingsService.js';

// Tiebreaker Service
export {
  compareHeadToHead,
  compareMatchesWon,
  compareFrameDifference,
  compareHighestBreak,
  resolveTiebreaker,
  resolveMastersTiebreaker,
  resolveTiebreakerByFormat,
  calculatePlayerStanding,
  groupByMatchesWon,
  needsTiebreaker,
  getTiebreakerExplanation,
  getMastersTiebreakerExplanation,
  TiebreakerOrder,
} from './TiebreakerService.js';

// Shootout Service
export {
  createShootout,
  recordShootoutAttempt,
  determineShootoutWinner,
  getShootoutsByPoolId,
  getPendingShootouts,
} from './ShootoutService.js';

// Bracket Generator Service
export {
  generateKnockoutBrackets,
  generateWinnerBracket,
  generateConsolationBracket,
  seedPlayersIntoBracket,
  getBracketMatches,
} from './BracketGeneratorService.js';

// Bracket Progression Service
export {
  progressWinner,
  updateBracketMatch,
  getNextMatch,
  getBracketProgress,
  isBracketComplete,
  getFinalPositions,
} from './BracketProgressionService.js';

// Ranking Service
export {
  calculateTournamentRankings,
  calculateWinnerBracketPositions,
  calculateConsolationBracketPositions,
  calculatePoolEliminationPositions,
  getTournamentChampion,
  getTournamentRunnerUp,
  getPositionPoints,
  getParticipationPoints,
} from './RankingService.js';

// Tournament Results Service
export {
  compileTournamentResults,
  finalizeTournament,
  aggregateTournamentBreaks,
  getTournamentSummary,
} from './TournamentResultsService.js';

// Season Service
export {
  createNewSeason,
  saveSeason,
  loadSeason,
  getSeasonById,
  getAllSeasons,
  addTournamentToSeasonById,
  removeSeasonTournament,
  setCurrentSeason,
  getCurrentSeasonId,
} from './SeasonService.js';

// Season Standings Service
export {
  calculateSeasonStandings,
  getPlayerSeasonStats,
  getMastersQualifiers,
  getSeasonStandingsWithBreaks,
} from './SeasonStandingsService.js';

// Season Breaks Service
export {
  getSeasonBreaks,
  getSeasonMastersBreaks,
  getPlayerSeasonBreaks,
  getSeasonBreakStatistics,
} from './SeasonBreaksService.js';

// Masters Qualifier Service
export {
  MASTERS_FIELD_SIZE,
  DEFAULT_RESERVE_COUNT,
  getQualifiedPlayers,
  getReservePlayers,
  getMastersField,
  processWithdrawal,
  processMultipleWithdrawals,
  addBye,
  validateMastersField,
  createMastersTournamentConfig,
  getMastersPoolSeeding,
  getByeCount,
  canRunMasters,
  getMastersQualificationSummary,
} from './MastersQualifierService.js';

// Export Service
export {
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
} from './ExportService.js';

// Import Service
export {
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
} from './ImportService.js';
