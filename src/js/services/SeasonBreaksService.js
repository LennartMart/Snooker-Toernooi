/**
 * SeasonBreaksService
 * Aggregates all high breaks across tournaments for Masters statistics
 */

import { getSeasonById } from './SeasonService.js';
import { getTournamentById } from './TournamentService.js';
import { MASTERS_BREAK_THRESHOLD } from '../models/Break.js';

/**
 * @typedef {Object} SeasonBreak
 * @property {string} id - Break ID
 * @property {string} tournamentId - Tournament where break was made
 * @property {string} tournamentName - Tournament name
 * @property {string} matchId - Match ID
 * @property {string} playerId - Player who made the break
 * @property {number} value - Break value
 * @property {number} frameNumber - Frame number
 * @property {string} createdAt - When break was recorded
 */

/**
 * @typedef {Object} SeasonBreaksResult
 * @property {string} seasonId - Season ID
 * @property {string} seasonName - Season name
 * @property {SeasonBreak[]} breaks - All breaks above Masters threshold
 * @property {number} totalBreaks - Total count of qualifying breaks
 * @property {number} centuryCount - Number of centuries (100+)
 * @property {SeasonBreak|null} highestBreak - Highest break of the season
 * @property {Object.<string, number>} breaksByPlayer - Breaks count per player
 */

/**
 * Gets all breaks above Masters threshold for a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<SeasonBreaksResult>}
 */
export async function getSeasonBreaks(seasonId) {
  const season = await getSeasonById(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const mastersThreshold = season.settings?.mastersBreakThreshold || MASTERS_BREAK_THRESHOLD;
  const allBreaks = [];
  const breaksByPlayer = {};

  // Collect breaks from all tournaments
  for (const tournamentId of season.tournamentIds) {
    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      continue;
    }

    // Get breaks from tournament
    const tournamentBreaks = tournament.breaks || [];
    const qualifyingBreaks = tournamentBreaks.filter((b) => b.value >= mastersThreshold);

    // Add tournament info to each break
    for (const breakData of qualifyingBreaks) {
      allBreaks.push({
        ...breakData,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
      });

      // Count by player
      const playerId = breakData.playerId;
      breaksByPlayer[playerId] = (breaksByPlayer[playerId] || 0) + 1;
    }
  }

  // Sort by value descending
  const sortedBreaks = allBreaks.sort((a, b) => b.value - a.value);

  // Calculate statistics
  const centuryCount = sortedBreaks.filter((b) => b.value >= 100).length;
  const highestBreak = sortedBreaks.length > 0 ? sortedBreaks[0] : null;

  return {
    seasonId: season.id,
    seasonName: season.name,
    breaks: sortedBreaks,
    totalBreaks: sortedBreaks.length,
    centuryCount,
    highestBreak,
    breaksByPlayer,
  };
}

/**
 * Gets top breaks for a season
 * @param {string} seasonId - Season ID
 * @param {number} [limit=10] - Maximum number of breaks to return
 * @returns {Promise<SeasonBreak[]>}
 */
export async function getTopSeasonBreaks(seasonId, limit = 10) {
  const { breaks } = await getSeasonBreaks(seasonId);
  return breaks.slice(0, limit);
}

/**
 * Gets all breaks by a specific player in a season
 * @param {string} seasonId - Season ID
 * @param {string} playerId - Player ID
 * @returns {Promise<SeasonBreak[]>}
 */
export async function getPlayerSeasonBreaks(seasonId, playerId) {
  const { breaks } = await getSeasonBreaks(seasonId);
  return breaks.filter((b) => b.playerId === playerId);
}

/**
 * Gets player break statistics for a season
 * @param {string} seasonId - Season ID
 * @param {string} playerId - Player ID
 * @returns {Promise<{count: number, highest: number, centuries: number, total: number}>}
 */
export async function getPlayerSeasonBreakStats(seasonId, playerId) {
  const playerBreaks = await getPlayerSeasonBreaks(seasonId, playerId);

  if (playerBreaks.length === 0) {
    return { count: 0, highest: 0, centuries: 0, total: 0 };
  }

  const highest = Math.max(...playerBreaks.map((b) => b.value));
  const centuries = playerBreaks.filter((b) => b.value >= 100).length;
  const total = playerBreaks.reduce((sum, b) => sum + b.value, 0);

  return {
    count: playerBreaks.length,
    highest,
    centuries,
    total,
  };
}

/**
 * Gets the highest break for a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<SeasonBreak|null>}
 */
export async function getSeasonHighestBreak(seasonId) {
  const { highestBreak } = await getSeasonBreaks(seasonId);
  return highestBreak;
}

/**
 * Gets break leaders for a season (most breaks above threshold)
 * @param {string} seasonId - Season ID
 * @param {number} [limit=10] - Maximum number of players to return
 * @returns {Promise<Array<{playerId: string, count: number}>>}
 */
export async function getSeasonBreakLeaders(seasonId, limit = 10) {
  const { breaksByPlayer } = await getSeasonBreaks(seasonId);

  const leaders = Object.entries(breaksByPlayer)
    .map(([playerId, count]) => ({ playerId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return leaders;
}

/**
 * Gets century makers for a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<Array<{playerId: string, centuries: number, highest: number}>>}
 */
export async function getSeasonCenturyMakers(seasonId) {
  const { breaks } = await getSeasonBreaks(seasonId);
  const centuryBreaks = breaks.filter((b) => b.value >= 100);

  // Group by player
  const playerCenturies = {};

  for (const breakData of centuryBreaks) {
    const playerId = breakData.playerId;
    if (!playerCenturies[playerId]) {
      playerCenturies[playerId] = {
        playerId,
        centuries: 0,
        highest: 0,
      };
    }

    playerCenturies[playerId].centuries++;
    if (breakData.value > playerCenturies[playerId].highest) {
      playerCenturies[playerId].highest = breakData.value;
    }
  }

  // Sort by century count, then by highest break
  return Object.values(playerCenturies).sort((a, b) => {
    if (b.centuries !== a.centuries) {
      return b.centuries - a.centuries;
    }
    return b.highest - a.highest;
  });
}

/**
 * Gets season break statistics summary
 * @param {string} seasonId - Season ID
 * @returns {Promise<Object>}
 */
export async function getSeasonBreaksSummary(seasonId) {
  const result = await getSeasonBreaks(seasonId);
  const season = await getSeasonById(seasonId);

  return {
    seasonId: result.seasonId,
    seasonName: result.seasonName,
    threshold: season?.settings?.mastersBreakThreshold || MASTERS_BREAK_THRESHOLD,
    totalBreaks: result.totalBreaks,
    centuryCount: result.centuryCount,
    highestBreak: result.highestBreak?.value || 0,
    highestBreakPlayer: result.highestBreak?.playerId || null,
    uniquePlayers: Object.keys(result.breaksByPlayer).length,
  };
}

/**
 * Checks if a break qualifies for Masters statistics
 * @param {number} value - Break value
 * @param {number} [threshold=MASTERS_BREAK_THRESHOLD] - Threshold
 * @returns {boolean}
 */
export function isQualifyingBreak(value, threshold = MASTERS_BREAK_THRESHOLD) {
  return value >= threshold;
}

export default {
  getSeasonBreaks,
  getTopSeasonBreaks,
  getPlayerSeasonBreaks,
  getPlayerSeasonBreakStats,
  getSeasonHighestBreak,
  getSeasonBreakLeaders,
  getSeasonCenturyMakers,
  getSeasonBreaksSummary,
  isQualifyingBreak,
};
