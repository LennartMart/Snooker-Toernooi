/**
 * Ranking Model
 * Represents final tournament position and points
 */

/**
 * @typedef {Object} RankingData
 * @property {number} position - Final position (1-32)
 * @property {string} playerId - Player reference
 * @property {number} positionPoints - Points from position (32 for 1st, 31 for 2nd, etc.)
 * @property {number} participationPoints - Bonus points (default: 10)
 * @property {number} totalPoints - Sum of all points
 */

/**
 * Default participation points
 */
export const DEFAULT_PARTICIPATION_POINTS = 10;

/**
 * Calculates position points based on final position
 * Position 1 gets 32 points, position 2 gets 31, ..., position 32 gets 1
 * @param {number} position - Final position (1-32)
 * @param {number} [totalPlayers=32] - Total number of players
 * @returns {number} Position points
 */
export function calculatePositionPoints(position, totalPlayers = 32) {
  if (position < 1 || position > totalPlayers) {
    throw new Error(`Position must be between 1 and ${totalPlayers}`);
  }
  return totalPlayers - position + 1;
}

/**
 * Creates a new Ranking instance
 * @param {Object} params - Ranking parameters
 * @param {number} params.position - Final position
 * @param {string} params.playerId - Player ID
 * @param {number} [params.positionPoints] - Position points (calculated if not provided)
 * @param {number} [params.participationPoints=DEFAULT_PARTICIPATION_POINTS] - Participation bonus
 * @param {number} [params.totalPoints] - Total points (calculated if not provided)
 * @param {number} [params.totalPlayers=32] - Total players for position points calculation
 * @returns {RankingData}
 */
export function createRanking({
  position,
  playerId,
  positionPoints,
  participationPoints = DEFAULT_PARTICIPATION_POINTS,
  totalPoints,
  totalPlayers = 32,
} = {}) {
  if (typeof position !== 'number' || position < 1) {
    throw new Error('Ranking requires a valid position (>= 1)');
  }

  if (!playerId || typeof playerId !== 'string') {
    throw new Error('Ranking requires a valid playerId');
  }

  const calculatedPositionPoints =
    positionPoints !== undefined ? positionPoints : calculatePositionPoints(position, totalPlayers);

  const calculatedTotalPoints =
    totalPoints !== undefined ? totalPoints : calculatedPositionPoints + participationPoints;

  return {
    position,
    playerId,
    positionPoints: calculatedPositionPoints,
    participationPoints,
    totalPoints: calculatedTotalPoints,
  };
}

/**
 * Creates rankings for all positions
 * @param {Array<{position: number, playerId: string}>} positions - Array of position assignments
 * @param {number} [participationPoints=DEFAULT_PARTICIPATION_POINTS] - Participation bonus
 * @param {number} [totalPlayers=32] - Total players
 * @returns {RankingData[]} Array of rankings
 */
export function createRankingsForTournament(
  positions,
  participationPoints = DEFAULT_PARTICIPATION_POINTS,
  totalPlayers = 32
) {
  return positions.map(({ position, playerId }) =>
    createRanking({
      position,
      playerId,
      participationPoints,
      totalPlayers,
    })
  );
}

/**
 * Gets the ranking for a specific player
 * @param {RankingData[]} rankings - All rankings
 * @param {string} playerId - Player ID to find
 * @returns {RankingData|null} Player's ranking or null
 */
export function getRankingForPlayer(rankings, playerId) {
  return rankings.find((r) => r.playerId === playerId) || null;
}

/**
 * Sorts rankings by position (ascending)
 * @param {RankingData[]} rankings - Rankings to sort
 * @returns {RankingData[]} Sorted rankings
 */
export function sortRankingsByPosition(rankings) {
  return [...rankings].sort((a, b) => a.position - b.position);
}

/**
 * Sorts rankings by total points (descending)
 * @param {RankingData[]} rankings - Rankings to sort
 * @returns {RankingData[]} Sorted rankings
 */
export function sortRankingsByPoints(rankings) {
  return [...rankings].sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Validates a ranking object
 * @param {RankingData} ranking - Ranking to validate
 * @returns {boolean}
 */
export function isValidRanking(ranking) {
  return (
    ranking &&
    typeof ranking.position === 'number' &&
    ranking.position >= 1 &&
    typeof ranking.playerId === 'string' &&
    typeof ranking.positionPoints === 'number' &&
    ranking.positionPoints >= 0 &&
    typeof ranking.participationPoints === 'number' &&
    ranking.participationPoints >= 0 &&
    typeof ranking.totalPoints === 'number' &&
    ranking.totalPoints >= 0
  );
}

/**
 * Serializes a ranking to a plain object for storage
 * @param {RankingData} ranking - Ranking to serialize
 * @returns {RankingData}
 */
export function serializeRanking(ranking) {
  return {
    position: ranking.position,
    playerId: ranking.playerId,
    positionPoints: ranking.positionPoints,
    participationPoints: ranking.participationPoints,
    totalPoints: ranking.totalPoints,
  };
}

/**
 * Deserializes a plain object to a ranking
 * @param {Object} data - Data to deserialize
 * @returns {RankingData}
 */
export function deserializeRanking(data) {
  return createRanking({
    position: data.position,
    playerId: data.playerId,
    positionPoints: data.positionPoints,
    participationPoints: data.participationPoints,
    totalPoints: data.totalPoints,
  });
}

export default {
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
};
