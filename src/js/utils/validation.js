/**
 * Validation Utility
 * Common validation functions for the application
 */

import { isValidUUID } from './uuid.js';

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string[]} errors - List of error messages
 */

/**
 * Creates a validation result
 * @param {boolean} valid - Whether validation passed
 * @param {string[]} [errors=[]] - Error messages
 * @returns {ValidationResult}
 */
function createResult(valid, errors = []) {
  return { valid, errors };
}

/**
 * Combines multiple validation results
 * @param {...ValidationResult} results - Results to combine
 * @returns {ValidationResult} Combined result
 */
export function combineResults(...results) {
  const allErrors = results.flatMap((r) => r.errors);
  return createResult(allErrors.length === 0, allErrors);
}

// ============ String Validators ============

/**
 * Validates that a value is a non-empty string
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateRequired(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return createResult(false, [`${fieldName} is required`]);
  }
  return createResult(true);
}

/**
 * Validates string length
 * @param {string} value - String to validate
 * @param {string} fieldName - Field name for error message
 * @param {number} [minLength=0] - Minimum length
 * @param {number} [maxLength=Infinity] - Maximum length
 * @returns {ValidationResult}
 */
export function validateStringLength(value, fieldName, minLength = 0, maxLength = Infinity) {
  if (typeof value !== 'string') {
    return createResult(false, [`${fieldName} must be a string`]);
  }

  const errors = [];

  if (value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must be at most ${maxLength} characters`);
  }

  return createResult(errors.length === 0, errors);
}

/**
 * Validates that a string matches a pattern
 * @param {string} value - String to validate
 * @param {RegExp} pattern - Pattern to match
 * @param {string} fieldName - Field name for error message
 * @param {string} [message] - Custom error message
 * @returns {ValidationResult}
 */
export function validatePattern(value, pattern, fieldName, message) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    return createResult(false, [message || `${fieldName} format is invalid`]);
  }
  return createResult(true);
}

// ============ Number Validators ============

/**
 * Validates that a value is a number
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateNumber(value, fieldName) {
  if (typeof value !== 'number' || isNaN(value)) {
    return createResult(false, [`${fieldName} must be a valid number`]);
  }
  return createResult(true);
}

/**
 * Validates number range
 * @param {number} value - Number to validate
 * @param {string} fieldName - Field name for error message
 * @param {number} [min=-Infinity] - Minimum value
 * @param {number} [max=Infinity] - Maximum value
 * @returns {ValidationResult}
 */
export function validateNumberRange(value, fieldName, min = -Infinity, max = Infinity) {
  const numResult = validateNumber(value, fieldName);
  if (!numResult.valid) {
    return numResult;
  }

  const errors = [];

  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (value > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }

  return createResult(errors.length === 0, errors);
}

/**
 * Validates that a value is a positive integer
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validatePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    return createResult(false, [`${fieldName} must be a positive integer`]);
  }
  return createResult(true);
}

/**
 * Validates that a value is a non-negative integer
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    return createResult(false, [`${fieldName} must be a non-negative integer`]);
  }
  return createResult(true);
}

// ============ Date Validators ============

/**
 * Validates that a value is a valid date
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateDate(value, fieldName) {
  if (!value) {
    return createResult(false, [`${fieldName} is required`]);
  }

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    return createResult(false, [`${fieldName} must be a valid date`]);
  }

  return createResult(true);
}

/**
 * Validates that a date is in the future
 * @param {any} value - Date to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateFutureDate(value, fieldName) {
  const dateResult = validateDate(value, fieldName);
  if (!dateResult.valid) {
    return dateResult;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (date <= new Date()) {
    return createResult(false, [`${fieldName} must be in the future`]);
  }

  return createResult(true);
}

/**
 * Validates date range
 * @param {any} startDate - Start date
 * @param {any} endDate - End date
 * @param {string} startFieldName - Start field name
 * @param {string} endFieldName - End field name
 * @returns {ValidationResult}
 */
export function validateDateRange(startDate, endDate, startFieldName, endFieldName) {
  const startResult = validateDate(startDate, startFieldName);
  const endResult = validateDate(endDate, endFieldName);

  if (!startResult.valid || !endResult.valid) {
    return combineResults(startResult, endResult);
  }

  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (start >= end) {
    return createResult(false, [`${endFieldName} must be after ${startFieldName}`]);
  }

  return createResult(true);
}

// ============ Array Validators ============

/**
 * Validates that a value is an array
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateArray(value, fieldName) {
  if (!Array.isArray(value)) {
    return createResult(false, [`${fieldName} must be an array`]);
  }
  return createResult(true);
}

/**
 * Validates array length
 * @param {any[]} value - Array to validate
 * @param {string} fieldName - Field name for error message
 * @param {number} [minLength=0] - Minimum length
 * @param {number} [maxLength=Infinity] - Maximum length
 * @returns {ValidationResult}
 */
export function validateArrayLength(value, fieldName, minLength = 0, maxLength = Infinity) {
  const arrayResult = validateArray(value, fieldName);
  if (!arrayResult.valid) {
    return arrayResult;
  }

  const errors = [];

  if (value.length < minLength) {
    errors.push(`${fieldName} must have at least ${minLength} items`);
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must have at most ${maxLength} items`);
  }

  return createResult(errors.length === 0, errors);
}

// ============ UUID Validators ============

/**
 * Validates that a value is a valid UUID
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateUUID(value, fieldName) {
  if (typeof value !== 'string' || !isValidUUID(value)) {
    return createResult(false, [`${fieldName} must be a valid UUID`]);
  }
  return createResult(true);
}

/**
 * Validates optional UUID (passes if empty)
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateOptionalUUID(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return createResult(true);
  }
  return validateUUID(value, fieldName);
}

// ============ Enum Validators ============

/**
 * Validates that a value is one of the allowed values
 * @param {any} value - Value to validate
 * @param {any[]} allowedValues - Allowed values
 * @param {string} fieldName - Field name for error message
 * @returns {ValidationResult}
 */
export function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    return createResult(
      false,
      [`${fieldName} must be one of: ${allowedValues.join(', ')}`]
    );
  }
  return createResult(true);
}

// ============ Snooker-Specific Validators ============

/**
 * Validates a snooker break score
 * @param {number} score - Break score
 * @returns {ValidationResult}
 */
export function validateBreakScore(score) {
  const rangeResult = validateNumberRange(score, 'Break score', 0, 147);
  if (!rangeResult.valid) {
    return rangeResult;
  }
  return createResult(true);
}

/**
 * Validates frame count for best-of format
 * @param {number} framesRequired - Frames required to win
 * @returns {ValidationResult}
 */
export function validateFramesRequired(framesRequired) {
  const result = validatePositiveInteger(framesRequired, 'Frames required');
  if (!result.valid) {
    return result;
  }

  // Common best-of formats: best of 3, 5, 7, 9, etc.
  if (framesRequired > 18) {
    return createResult(false, ['Frames required cannot exceed 18 (best of 35)']);
  }

  return createResult(true);
}

/**
 * Validates a player object
 * @param {Object} player - Player to validate
 * @returns {ValidationResult}
 */
export function validatePlayer(player) {
  if (!player || typeof player !== 'object') {
    return createResult(false, ['Player must be an object']);
  }

  const results = [];

  // Validate ID
  results.push(validateUUID(player.id, 'Player ID'));

  // Validate name
  results.push(validateRequired(player.name, 'Player name'));
  if (player.name) {
    results.push(validateStringLength(player.name, 'Player name', 1, 100));
  }

  // Validate isBye
  if (typeof player.isBye !== 'boolean') {
    results.push(createResult(false, ['isBye must be a boolean']));
  }

  // Validate createdAt
  if (player.createdAt) {
    results.push(validateDate(player.createdAt, 'Creation date'));
  }

  return combineResults(...results);
}

/**
 * Validates a tournament object
 * @param {Object} tournament - Tournament to validate
 * @returns {ValidationResult}
 */
export function validateTournament(tournament) {
  if (!tournament || typeof tournament !== 'object') {
    return createResult(false, ['Tournament must be an object']);
  }

  const results = [];

  // Validate ID
  results.push(validateUUID(tournament.id, 'Tournament ID'));

  // Validate name
  results.push(validateRequired(tournament.name, 'Tournament name'));
  if (tournament.name) {
    results.push(validateStringLength(tournament.name, 'Tournament name', 1, 200));
  }

  // Validate date
  results.push(validateRequired(tournament.date, 'Tournament date'));
  if (tournament.date) {
    results.push(validateDate(tournament.date, 'Tournament date'));
  }

  // Validate seasonId
  results.push(validateUUID(tournament.seasonId, 'Season ID'));

  // Validate status
  const validStatuses = ['draft', 'pool_stage', 'knockout_stage', 'completed'];
  if (!validStatuses.includes(tournament.status)) {
    results.push(createResult(false, [`Status must be one of: ${validStatuses.join(', ')}`]));
  }

  // Validate format
  const validFormats = ['regular', 'masters'];
  if (!validFormats.includes(tournament.format)) {
    results.push(createResult(false, [`Format must be one of: ${validFormats.join(', ')}`]));
  }

  // Validate config
  if (tournament.config) {
    if (typeof tournament.config.poolFrames === 'number') {
      results.push(validateFramesRequired(tournament.config.poolFrames, 'Pool frames'));
    }
    if (typeof tournament.config.knockoutFrames === 'number') {
      results.push(validateFramesRequired(tournament.config.knockoutFrames, 'Knockout frames'));
    }
    if (typeof tournament.config.finalFrames === 'number') {
      results.push(validateFramesRequired(tournament.config.finalFrames, 'Final frames'));
    }
  }

  // Validate playerIds array
  if (Array.isArray(tournament.playerIds)) {
    results.push(validatePlayerCount(tournament.playerIds.length));
  }

  return combineResults(...results);
}

/**
 * Validates player count for tournament
 * @param {number} count - Player count
 * @param {number} [minPlayers=2] - Minimum players
 * @param {number} [maxPlayers=128] - Maximum players
 * @returns {ValidationResult}
 */
export function validatePlayerCount(count, minPlayers = 2, maxPlayers = 128) {
  const result = validatePositiveInteger(count, 'Player count');
  if (!result.valid) {
    return result;
  }

  return validateNumberRange(count, 'Player count', minPlayers, maxPlayers);
}

/**
 * Validates pool size
 * @param {number} size - Pool size
 * @returns {ValidationResult}
 */
export function validatePoolSize(size) {
  const result = validatePositiveInteger(size, 'Pool size');
  if (!result.valid) {
    return result;
  }

  // Pool sizes typically 3-8 players
  return validateNumberRange(size, 'Pool size', 3, 8);
}

export default {
  combineResults,
  validateRequired,
  validateStringLength,
  validatePattern,
  validateNumber,
  validateNumberRange,
  validatePositiveInteger,
  validateNonNegativeInteger,
  validateDate,
  validateFutureDate,
  validateDateRange,
  validateArray,
  validateArrayLength,
  validateUUID,
  validateOptionalUUID,
  validateEnum,
  validateBreakScore,
  validateFramesRequired,
  validatePlayer,
  validateTournament,
  validatePlayerCount,
  validatePoolSize,
};
