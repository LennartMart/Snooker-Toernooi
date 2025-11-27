/**
 * SeasonStandingsService
 * Aggregates points across tournaments, ranks players, and identifies Masters qualifiers
 */

import { getSeasonById } from './SeasonService.js';
import { getTournamentById } from './TournamentService.js';

/**
 * @typedef {Object} SeasonStanding
 * @property {string} playerId - Player ID
 * @property {number} position - Season position (1-indexed)
 * @property {number} totalPoints - Total accumulated points
 * @property {number} tournamentsPlayed - Number of tournaments played
 * @property {number} bestFinish - Best tournament position
 * @property {number} averageFinish - Average tournament position
 * @property {boolean} qualifiesForMasters - Whether player qualifies for Masters
 */

/**
 * @typedef {Object} SeasonStandingsResult
 * @property {string} seasonId - Season ID
 * @property {string} seasonName - Season name
 * @property {SeasonStanding[]} standings - Player standings
 * @property {number} tournamentsComplete - Number of completed tournaments
 * @property {number} totalTournaments - Total tournaments in season
 * @property {string[]} mastersQualifiers - Player IDs who qualify for Masters
 */

/**
 * Calculates season standings from all tournaments
 * @param {string} seasonId - Season ID
 * @returns {Promise<SeasonStandingsResult>}
 */
export async function calculateSeasonStandings(seasonId) {
  const season = await getSeasonById(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const tournamentIds = season.tournamentIds || [];
  const playerPoints = new Map();
  const playerTournaments = new Map();
  const playerBestFinish = new Map();
  const playerPositions = new Map();

  let tournamentsComplete = 0;

  // Aggregate points from each tournament
  for (const tournamentId of tournamentIds) {
    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      continue;
    }

    // Only count completed tournaments with rankings
    if (tournament.status !== 'complete' || !tournament.rankings) {
      continue;
    }

    tournamentsComplete++;

    for (const ranking of tournament.rankings) {
      const { playerId, totalPoints, position } = ranking;

      // Accumulate points
      const currentPoints = playerPoints.get(playerId) || 0;
      playerPoints.set(playerId, currentPoints + totalPoints);

      // Track tournament count
      const tournamentCount = playerTournaments.get(playerId) || 0;
      playerTournaments.set(playerId, tournamentCount + 1);

      // Track best finish
      const bestFinish = playerBestFinish.get(playerId) || Infinity;
      if (position < bestFinish) {
        playerBestFinish.set(playerId, position);
      }

      // Track all positions for average calculation
      const positions = playerPositions.get(playerId) || [];
      positions.push(position);
      playerPositions.set(playerId, positions);
    }
  }

  // Build standings array
  const standings = [];

  for (const [playerId, totalPoints] of playerPoints) {
    const tournamentsPlayed = playerTournaments.get(playerId) || 0;
    const bestFinish = playerBestFinish.get(playerId) || 0;
    const positions = playerPositions.get(playerId) || [];
    const averageFinish =
      positions.length > 0 ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 : 0;

    standings.push({
      playerId,
      position: 0, // Will be set after sorting
      totalPoints,
      tournamentsPlayed,
      bestFinish,
      averageFinish,
      qualifiesForMasters: false, // Will be set after sorting
    });
  }

  // Sort by total points (descending), then by best finish (ascending) as tiebreaker
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.bestFinish - b.bestFinish;
  });

  // Assign positions and Masters qualification
  const mastersQualifiersCount = season.settings?.mastersQualifiers || 16;
  const mastersQualifiers = [];

  standings.forEach((standing, index) => {
    standing.position = index + 1;
    standing.qualifiesForMasters = index < mastersQualifiersCount;

    if (standing.qualifiesForMasters) {
      mastersQualifiers.push(standing.playerId);
    }
  });

  return {
    seasonId: season.id,
    seasonName: season.name,
    standings,
    tournamentsComplete,
    totalTournaments: tournamentIds.length,
    mastersQualifiers,
  };
}

/**
 * Gets the top N players in season standings
 * @param {string} seasonId - Season ID
 * @param {number} [count=16] - Number of top players
 * @returns {Promise<SeasonStanding[]>}
 */
export async function getTopSeasonPlayers(seasonId, count = 16) {
  const { standings } = await calculateSeasonStandings(seasonId);
  return standings.slice(0, count);
}

/**
 * Gets Masters qualifiers for a season
 * @param {string} seasonId - Season ID
 * @returns {Promise<string[]>} Array of qualifying player IDs
 */
export async function getMastersQualifiers(seasonId) {
  const { mastersQualifiers } = await calculateSeasonStandings(seasonId);
  return mastersQualifiers;
}

/**
 * Gets a player's season standing
 * @param {string} seasonId - Season ID
 * @param {string} playerId - Player ID
 * @returns {Promise<SeasonStanding|null>}
 */
export async function getPlayerSeasonStanding(seasonId, playerId) {
  const { standings } = await calculateSeasonStandings(seasonId);
  return standings.find((s) => s.playerId === playerId) || null;
}

/**
 * Gets player rankings across all tournaments in a season
 * @param {string} seasonId - Season ID
 * @param {string} playerId - Player ID
 * @returns {Promise<Array<{tournamentId: string, tournamentName: string, position: number, points: number}>>}
 */
export async function getPlayerTournamentHistory(seasonId, playerId) {
  const season = await getSeasonById(seasonId);

  if (!season) {
    throw new Error(`Season with ID "${seasonId}" not found`);
  }

  const history = [];

  for (const tournamentId of season.tournamentIds) {
    const tournament = await getTournamentById(tournamentId);

    if (!tournament || !tournament.rankings) {
      continue;
    }

    const ranking = tournament.rankings.find((r) => r.playerId === playerId);

    if (ranking) {
      history.push({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        position: ranking.position,
        points: ranking.totalPoints,
      });
    }
  }

  return history;
}

/**
 * Checks if a player qualifies for Masters
 * @param {string} seasonId - Season ID
 * @param {string} playerId - Player ID
 * @returns {Promise<boolean>}
 */
export async function doesPlayerQualifyForMasters(seasonId, playerId) {
  const { mastersQualifiers } = await calculateSeasonStandings(seasonId);
  return mastersQualifiers.includes(playerId);
}

/**
 * Gets the points gap to qualification
 * @param {string} seasonId - Season ID
 * @param {string} playerId - Player ID
 * @returns {Promise<{qualifies: boolean, pointsGap: number, position: number}>}
 */
export async function getQualificationGap(seasonId, playerId) {
  const { standings, mastersQualifiers } = await calculateSeasonStandings(seasonId);

  const playerStanding = standings.find((s) => s.playerId === playerId);

  if (!playerStanding) {
    return { qualifies: false, pointsGap: Infinity, position: -1 };
  }

  const qualifies = mastersQualifiers.includes(playerId);
  const cutoffPosition = mastersQualifiers.length;
  const cutoffStanding = standings[cutoffPosition - 1];
  const pointsGap = qualifies ? 0 : cutoffStanding ? cutoffStanding.totalPoints - playerStanding.totalPoints : 0;

  return {
    qualifies,
    pointsGap,
    position: playerStanding.position,
  };
}

/**
 * Gets season standings summary
 * @param {string} seasonId - Season ID
 * @returns {Promise<Object>}
 */
export async function getSeasonStandingsSummary(seasonId) {
  const result = await calculateSeasonStandings(seasonId);

  const totalPoints = result.standings.reduce((sum, s) => sum + s.totalPoints, 0);
  const avgPointsPerPlayer = result.standings.length > 0 ? Math.round(totalPoints / result.standings.length) : 0;

  return {
    seasonId: result.seasonId,
    seasonName: result.seasonName,
    totalPlayers: result.standings.length,
    tournamentsComplete: result.tournamentsComplete,
    totalTournaments: result.totalTournaments,
    mastersQualifiersCount: result.mastersQualifiers.length,
    leader: result.standings[0] || null,
    avgPointsPerPlayer,
  };
}

export default {
  calculateSeasonStandings,
  getTopSeasonPlayers,
  getMastersQualifiers,
  getPlayerSeasonStanding,
  getPlayerTournamentHistory,
  doesPlayerQualifyForMasters,
  getQualificationGap,
  getSeasonStandingsSummary,
};
