/**
 * Tiebreaker Service
 * Handles tiebreaker logic for pool standings
 */

import { getBreaksByPlayer, getHighestBreakValue } from './BreakService.js';

/**
 * @typedef {Object} PlayerStanding
 * @property {string} playerId - Player ID
 * @property {number} matchesWon - Total matches won
 * @property {number} matchesLost - Total matches lost
 * @property {number} framesWon - Total frames won
 * @property {number} framesLost - Total frames lost
 * @property {number} frameDifference - Frames won - frames lost
 * @property {number} highestBreak - Highest break score
 * @property {number} position - Position in standings (1-indexed)
 */

/**
 * Compares two players head-to-head
 * Returns positive if player1 beat player2, negative if player2 beat player1, 0 if no match
 * @param {string} player1Id - First player ID
 * @param {string} player2Id - Second player ID
 * @param {import('../models/Match.js').MatchData[]} matches - Pool matches
 * @returns {number}
 */
export function compareHeadToHead(player1Id, player2Id, matches) {
  const headToHeadMatch = matches.find(
    (m) =>
      (m.player1Id === player1Id && m.player2Id === player2Id) ||
      (m.player1Id === player2Id && m.player2Id === player1Id)
  );

  if (!headToHeadMatch || !headToHeadMatch.winnerId) {
    return 0; // No completed match between these players
  }

  if (headToHeadMatch.winnerId === player1Id) {
    return 1; // Player 1 won
  }
  return -1; // Player 2 won
}

/**
 * Compares two players by matches won
 * @param {PlayerStanding} standing1 - First player standing
 * @param {PlayerStanding} standing2 - Second player standing
 * @returns {number}
 */
export function compareMatchesWon(standing1, standing2) {
  return standing2.matchesWon - standing1.matchesWon;
}

/**
 * Compares two players by frame difference
 * @param {PlayerStanding} standing1 - First player standing
 * @param {PlayerStanding} standing2 - Second player standing
 * @returns {number}
 */
export function compareFrameDifference(standing1, standing2) {
  return standing2.frameDifference - standing1.frameDifference;
}

/**
 * Compares two players by highest break
 * @param {PlayerStanding} standing1 - First player standing
 * @param {PlayerStanding} standing2 - Second player standing
 * @returns {number}
 */
export function compareHighestBreak(standing1, standing2) {
  return standing2.highestBreak - standing1.highestBreak;
}

/**
 * Resolves a tiebreaker between players using the full tiebreaker chain
 * Order: 1) Head-to-head, 2) Frame difference, 3) Highest break, 4) Shootout required
 * @param {PlayerStanding[]} tiedPlayers - Players with equal standings
 * @param {import('../models/Match.js').MatchData[]} poolMatches - Pool matches
 * @param {Object.<string, boolean>} [shootoutResults] - Shootout results if any
 * @returns {{ resolved: PlayerStanding[], needsShootout: boolean, shootoutPlayers: string[] }}
 */
export function resolveTiebreaker(tiedPlayers, poolMatches, shootoutResults = {}) {
  if (tiedPlayers.length <= 1) {
    return { resolved: tiedPlayers, needsShootout: false, shootoutPlayers: [] };
  }

  // Sort by tiebreaker order
  const sorted = [...tiedPlayers].sort((a, b) => {
    // 1. Head-to-head (only for 2 players)
    if (tiedPlayers.length === 2) {
      const h2h = compareHeadToHead(a.playerId, b.playerId, poolMatches);
      if (h2h !== 0) {
        return -h2h; // Negative because we want winner first
      }
    }

    // 2. Frame difference
    const frameDiff = compareFrameDifference(a, b);
    if (frameDiff !== 0) {
      return frameDiff;
    }

    // 3. Highest break
    const breakDiff = compareHighestBreak(a, b);
    if (breakDiff !== 0) {
      return breakDiff;
    }

    // 4. Check shootout results
    const shootoutKey = [a.playerId, b.playerId].sort().join('-');
    if (shootoutResults[shootoutKey]) {
      return shootoutResults[shootoutKey] === a.playerId ? -1 : 1;
    }

    return 0; // Still tied
  });

  // Check if any are still tied
  const stillTied = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    const h2h = tiedPlayers.length === 2 ? compareHeadToHead(a.playerId, b.playerId, poolMatches) : 0;
    const frameDiff = compareFrameDifference(a, b);
    const breakDiff = compareHighestBreak(a, b);
    const shootoutKey = [a.playerId, b.playerId].sort().join('-');
    const hasShootout = !!shootoutResults[shootoutKey];

    if (h2h === 0 && frameDiff === 0 && breakDiff === 0 && !hasShootout) {
      if (!stillTied.includes(a.playerId)) {
        stillTied.push(a.playerId);
      }
      if (!stillTied.includes(b.playerId)) {
        stillTied.push(b.playerId);
      }
    }
  }

  return {
    resolved: sorted,
    needsShootout: stillTied.length > 0,
    shootoutPlayers: stillTied,
  };
}

/**
 * Calculates a player's standing within a pool
 * @param {string} playerId - Player ID
 * @param {import('../models/Match.js').MatchData[]} poolMatches - Pool matches
 * @param {import('../models/Break.js').BreakData[]} breaks - Tournament breaks
 * @returns {PlayerStanding}
 */
export function calculatePlayerStanding(playerId, poolMatches, breaks) {
  const playerMatches = poolMatches.filter(
    (m) => m.player1Id === playerId || m.player2Id === playerId
  );

  let matchesWon = 0;
  let matchesLost = 0;
  let framesWon = 0;
  let framesLost = 0;

  for (const match of playerMatches) {
    if (!match.winnerId) {
      continue; // Skip incomplete matches
    }

    // Count frames
    for (const frame of match.frames) {
      if (frame.winnerId === playerId) {
        framesWon++;
      } else if (frame.winnerId) {
        framesLost++;
      }
    }

    // Count match result
    if (match.winnerId === playerId) {
      matchesWon++;
    } else {
      matchesLost++;
    }
  }

  // Get highest break
  const playerBreaks = getBreaksByPlayer(breaks, playerId);
  const highestBreak = getHighestBreakValue(playerBreaks);

  return {
    playerId,
    matchesWon,
    matchesLost,
    framesWon,
    framesLost,
    frameDifference: framesWon - framesLost,
    highestBreak,
    position: 0, // Will be set later
  };
}

/**
 * Groups players by their number of matches won
 * @param {PlayerStanding[]} standings - Player standings
 * @returns {Map<number, PlayerStanding[]>}
 */
export function groupByMatchesWon(standings) {
  const groups = new Map();

  for (const standing of standings) {
    const wins = standing.matchesWon;
    if (!groups.has(wins)) {
      groups.set(wins, []);
    }
    groups.get(wins).push(standing);
  }

  return groups;
}

/**
 * Checks if a tiebreaker is needed
 * @param {PlayerStanding[]} standings - Pool standings
 * @returns {boolean}
 */
export function needsTiebreaker(standings) {
  const groups = groupByMatchesWon(standings);
  for (const players of groups.values()) {
    if (players.length > 1) {
      return true;
    }
  }
  return false;
}

/**
 * Gets tiebreaker explanation
 * @param {PlayerStanding} standing1 - First player
 * @param {PlayerStanding} standing2 - Second player
 * @param {import('../models/Match.js').MatchData[]} poolMatches - Pool matches
 * @returns {string}
 */
export function getTiebreakerExplanation(standing1, standing2, poolMatches) {
  const h2h = compareHeadToHead(standing1.playerId, standing2.playerId, poolMatches);
  if (h2h !== 0) {
    return 'Head-to-head result';
  }

  const frameDiff = compareFrameDifference(standing1, standing2);
  if (frameDiff !== 0) {
    return 'Frame difference';
  }

  const breakDiff = compareHighestBreak(standing1, standing2);
  if (breakDiff !== 0) {
    return 'Highest break';
  }

  return 'Shootout required';
}

/**
 * Tiebreaker order definitions
 */
export const TiebreakerOrder = {
  REGULAR: ['head-to-head', 'frame-difference', 'highest-break', 'shootout'],
  MASTERS: ['head-to-head', 'matches-won', 'highest-break'],
};

/**
 * Resolves a Masters tiebreaker between players
 * Order: 1) Head-to-head, 2) Matches won, 3) Highest break
 * @param {PlayerStanding[]} tiedPlayers - Players with equal standings
 * @param {import('../models/Match.js').MatchData[]} poolMatches - Pool matches
 * @returns {{ resolved: PlayerStanding[], needsShootout: boolean, shootoutPlayers: string[] }}
 */
export function resolveMastersTiebreaker(tiedPlayers, poolMatches) {
  if (tiedPlayers.length <= 1) {
    return { resolved: tiedPlayers, needsShootout: false, shootoutPlayers: [] };
  }

  // Sort by Masters tiebreaker order
  const sorted = [...tiedPlayers].sort((a, b) => {
    // 1. Head-to-head (only for 2 players)
    if (tiedPlayers.length === 2) {
      const h2h = compareHeadToHead(a.playerId, b.playerId, poolMatches);
      if (h2h !== 0) {
        return -h2h; // Negative because we want winner first
      }
    }

    // 2. Matches won (different from regular which uses frame difference)
    const matchesDiff = compareMatchesWon(a, b);
    if (matchesDiff !== 0) {
      return matchesDiff;
    }

    // 3. Highest break
    const breakDiff = compareHighestBreak(a, b);
    if (breakDiff !== 0) {
      return breakDiff;
    }

    return 0; // Still tied - no shootout in Masters
  });

  return {
    resolved: sorted,
    needsShootout: false, // Masters doesn't use shootout
    shootoutPlayers: [],
  };
}

/**
 * Gets tiebreaker explanation for Masters format
 * @param {PlayerStanding} standing1 - First player
 * @param {PlayerStanding} standing2 - Second player
 * @param {import('../models/Match.js').MatchData[]} poolMatches - Pool matches
 * @returns {string}
 */
export function getMastersTiebreakerExplanation(standing1, standing2, poolMatches) {
  const h2h = compareHeadToHead(standing1.playerId, standing2.playerId, poolMatches);
  if (h2h !== 0) {
    return 'Head-to-head result';
  }

  const matchesDiff = compareMatchesWon(standing1, standing2);
  if (matchesDiff !== 0) {
    return 'Matches won';
  }

  const breakDiff = compareHighestBreak(standing1, standing2);
  if (breakDiff !== 0) {
    return 'Highest break';
  }

  return 'Tied - position shared';
}

/**
 * Resolves tiebreaker using specified order
 * @param {PlayerStanding[]} tiedPlayers - Players with equal standings
 * @param {import('../models/Match.js').MatchData[]} poolMatches - Pool matches
 * @param {string} format - Tournament format ('regular' or 'masters')
 * @param {Object.<string, boolean>} [shootoutResults] - Shootout results if any
 * @returns {{ resolved: PlayerStanding[], needsShootout: boolean, shootoutPlayers: string[] }}
 */
export function resolveTiebreakerByFormat(tiedPlayers, poolMatches, format, shootoutResults = {}) {
  if (format === 'masters') {
    return resolveMastersTiebreaker(tiedPlayers, poolMatches);
  }
  return resolveTiebreaker(tiedPlayers, poolMatches, shootoutResults);
}

export default {
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
};
