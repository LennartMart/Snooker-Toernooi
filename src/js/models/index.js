/**
 * Models Index
 * Exports all data models
 */

// Player
export {
  createPlayer,
  createByePlayer,
  isValidPlayer,
  serializePlayer,
  deserializePlayer,
} from './Player.js';

// Frame
export {
  createFrame,
  setFrameWinner,
  isFrameComplete,
  isValidFrame,
  serializeFrame,
  deserializeFrame,
} from './Frame.js';

// Break
export {
  DEFAULT_BREAK_THRESHOLD,
  MASTERS_BREAK_THRESHOLD,
  createBreak,
  isValidBreak,
  isMastersQualifyingBreak,
  compareBreaksByValue,
  serializeBreak,
  deserializeBreak,
} from './Break.js';

// Season
export {
  DEFAULT_SEASON_SETTINGS,
  createSeason,
  addTournamentToSeason,
  removeTournamentFromSeason,
  updateSeasonSettings,
  isValidSeason,
  serializeSeason,
  deserializeSeason,
} from './Season.js';

// Match
export {
  MatchStage,
  MatchStatus,
  createMatch,
  framesToWin,
  countFramesWon,
  isMatchComplete,
  determineMatchWinner,
  addFrameToMatch,
  autoCompleteByeMatch,
  getMatchScoreString,
  isValidMatch,
  serializeMatch,
  deserializeMatch,
} from './Match.js';

// Pool
export {
  generatePoolName,
  createPool,
  createPoolStanding,
  addPlayerToPool,
  addMatchToPool,
  updatePoolStandings,
  setShootoutPosition,
  finalizePool,
  getPlayersAtPosition,
  isValidPool,
  serializePool,
  deserializePool,
} from './Pool.js';

// KnockoutRound
export {
  BracketType,
  getRoundName,
  createKnockoutRound,
  addMatchToRound,
  isRoundComplete,
  getRoundWinners,
  getRoundLosers,
  isValidKnockoutRound,
  serializeKnockoutRound,
  deserializeKnockoutRound,
} from './KnockoutRound.js';

// Ranking
export {
  DEFAULT_PARTICIPATION_POINTS,
  calculatePositionPoints,
  createRanking,
  createRankingsForTournament,
  getRankingForPlayer,
  sortRankingsByPosition,
  sortRankingsByPoints,
  isValidRanking,
  serializeRanking,
  deserializeRanking,
} from './Ranking.js';

// Tournament
export {
  TournamentFormat,
  TournamentStatus,
  DrawType,
  Tiebreaker,
  DEFAULT_KNOCKOUT_FORMATS_REGULAR,
  DEFAULT_KNOCKOUT_FORMATS_MASTERS,
  DEFAULT_TIEBREAKERS_REGULAR,
  DEFAULT_TIEBREAKERS_MASTERS,
  createDefaultConfig,
  createTournament,
  updateTournamentStatus,
  addPlayersToTournament,
  setTournamentPools,
  addMatchToTournament,
  updateMatchInTournament,
  addBreakToTournament,
  setTournamentBrackets,
  setTournamentRankings,
  getMatchById,
  getPoolById,
  getPoolMatches,
  areAllPoolMatchesComplete,
  isValidTournament,
  validateTournamentConfig,
  serializeTournament,
  deserializeTournament,
} from './Tournament.js';
