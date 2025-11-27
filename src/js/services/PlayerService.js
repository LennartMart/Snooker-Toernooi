/**
 * Player Service
 * Manages player CRUD operations and business logic
 */

import { createPlayer, createByePlayer, serializePlayer, deserializePlayer } from '../models/Player.js';
import { getStorage } from '../storage/index.js';
import { store, setPlayers, addPlayer, updatePlayer, removePlayer } from '../store/index.js';
import { validatePlayer } from '../utils/index.js';

const STORAGE_KEY = 'players';

/**
 * Gets all players from storage
 * @returns {Promise<import('../models/Player.js').PlayerData[]>}
 */
export async function getAllPlayers() {
  const storage = getStorage();
  const data = await storage.getItem(STORAGE_KEY);
  
  if (!data) {
    return [];
  }

  // Filter out bye players as they are generated dynamically
  return data
    .map(deserializePlayer)
    .filter((player) => !player.isBye);
}

/**
 * Gets a player by ID
 * @param {string} id - Player ID
 * @returns {Promise<import('../models/Player.js').PlayerData|null>}
 */
export async function getPlayerById(id) {
  const players = await getAllPlayers();
  return players.find((p) => p.id === id) || null;
}

/**
 * Gets multiple players by IDs
 * @param {string[]} ids - Player IDs
 * @returns {Promise<import('../models/Player.js').PlayerData[]>}
 */
export async function getPlayersByIds(ids) {
  const players = await getAllPlayers();
  return players.filter((p) => ids.includes(p.id));
}

/**
 * Creates a new player
 * @param {string} name - Player name
 * @returns {Promise<import('../models/Player.js').PlayerData>}
 */
export async function createNewPlayer(name) {
  const player = createPlayer({ name });
  
  const validation = validatePlayer(player);
  if (!validation.valid) {
    throw new Error(`Invalid player: ${validation.errors.join(', ')}`);
  }

  const players = await getAllPlayers();
  
  // Check for duplicate name
  const existingPlayer = players.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  if (existingPlayer) {
    throw new Error(`Player with name "${name}" already exists`);
  }

  players.push(player);
  
  // Save to storage
  const storage = getStorage();
  await storage.setItem(STORAGE_KEY, players.map(serializePlayer));
  
  // Update store
  store.dispatch(addPlayer(player));
  
  return player;
}

/**
 * Updates an existing player
 * @param {string} id - Player ID
 * @param {Partial<import('../models/Player.js').PlayerData>} updates - Fields to update
 * @returns {Promise<import('../models/Player.js').PlayerData>}
 */
export async function updateExistingPlayer(id, updates) {
  const players = await getAllPlayers();
  const index = players.findIndex((p) => p.id === id);
  
  if (index === -1) {
    throw new Error(`Player with ID "${id}" not found`);
  }

  // Apply updates
  const updatedPlayer = {
    ...players[index],
    ...updates,
    id: players[index].id, // Prevent ID from being changed
    isBye: players[index].isBye, // Prevent isBye from being changed
    createdAt: players[index].createdAt, // Preserve original creation date
  };

  const validation = validatePlayer(updatedPlayer);
  if (!validation.valid) {
    throw new Error(`Invalid player: ${validation.errors.join(', ')}`);
  }

  // Check for duplicate name
  const existingPlayer = players.find(
    (p) => p.id !== id && p.name.toLowerCase() === updatedPlayer.name.toLowerCase()
  );
  if (existingPlayer) {
    throw new Error(`Player with name "${updatedPlayer.name}" already exists`);
  }

  players[index] = updatedPlayer;
  
  // Save to storage
  const storage = getStorage();
  await storage.setItem(STORAGE_KEY, players.map(serializePlayer));
  
  // Update store
  store.dispatch(updatePlayer(updatedPlayer));
  
  return updatedPlayer;
}

/**
 * Deletes a player
 * @param {string} id - Player ID
 * @returns {Promise<void>}
 */
export async function deletePlayer(id) {
  const players = await getAllPlayers();
  const index = players.findIndex((p) => p.id === id);
  
  if (index === -1) {
    throw new Error(`Player with ID "${id}" not found`);
  }

  players.splice(index, 1);
  
  // Save to storage
  const storage = getStorage();
  await storage.setItem(STORAGE_KEY, players.map(serializePlayer));
  
  // Update store
  store.dispatch(removePlayer(id));
}

/**
 * Creates bye players to fill pool slots
 * Used when player count doesn't evenly divide into pools
 * @param {number} count - Number of bye players to create
 * @returns {import('../models/Player.js').PlayerData[]}
 */
export function createByePlayers(count) {
  const byePlayers = [];
  for (let i = 0; i < count; i++) {
    byePlayers.push(createByePlayer(i + 1));
  }
  return byePlayers;
}

/**
 * Calculates how many bye players are needed
 * @param {number} playerCount - Current player count
 * @param {number} poolCount - Number of pools
 * @returns {number} Number of bye players needed
 */
export function calculateByesNeeded(playerCount, poolCount) {
  const playersPerPool = Math.ceil(playerCount / poolCount);
  const totalSlots = playersPerPool * poolCount;
  return totalSlots - playerCount;
}

/**
 * Loads players into the store from storage
 * @returns {Promise<void>}
 */
export async function loadPlayersIntoStore() {
  const players = await getAllPlayers();
  store.dispatch(setPlayers(players));
}

/**
 * Saves current store players to storage
 * @returns {Promise<void>}
 */
export async function savePlayersFromStore() {
  const state = store.getState();
  const storage = getStorage();
  await storage.setItem(STORAGE_KEY, state.players.map(serializePlayer));
}

/**
 * Searches players by name
 * @param {string} query - Search query
 * @returns {Promise<import('../models/Player.js').PlayerData[]>}
 */
export async function searchPlayers(query) {
  const players = await getAllPlayers();
  const lowerQuery = query.toLowerCase();
  return players.filter((p) => p.name.toLowerCase().includes(lowerQuery));
}

/**
 * Gets player count
 * @returns {Promise<number>}
 */
export async function getPlayerCount() {
  const players = await getAllPlayers();
  return players.length;
}

export default {
  getAllPlayers,
  getPlayerById,
  getPlayersByIds,
  createNewPlayer,
  updateExistingPlayer,
  deletePlayer,
  createByePlayers,
  calculateByesNeeded,
  loadPlayersIntoStore,
  savePlayersFromStore,
  searchPlayers,
  getPlayerCount,
};
