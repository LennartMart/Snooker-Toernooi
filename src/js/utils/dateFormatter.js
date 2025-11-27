/**
 * Date Formatter Utility
 * Handles date formatting for the application
 */

/**
 * Default date format options
 */
const DEFAULT_DATE_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

const DEFAULT_DATETIME_OPTIONS = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const DEFAULT_TIME_OPTIONS = {
  hour: '2-digit',
  minute: '2-digit',
};

/**
 * Formats a date string or Date object
 * @param {string|Date|number} date - Date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Format options
 * @param {string} [locale='en-GB'] - Locale for formatting
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = DEFAULT_DATE_OPTIONS, locale = 'en-GB') {
  if (!date) {
    return '';
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleDateString(locale, options);
}

/**
 * Formats a date with time
 * @param {string|Date|number} date - Date to format
 * @param {string} [locale='en-GB'] - Locale for formatting
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date, locale = 'en-GB') {
  return formatDate(date, DEFAULT_DATETIME_OPTIONS, locale);
}

/**
 * Formats just the time portion
 * @param {string|Date|number} date - Date to format
 * @param {string} [locale='en-GB'] - Locale for formatting
 * @returns {string} Formatted time string
 */
export function formatTime(date, locale = 'en-GB') {
  if (!date) {
    return '';
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleTimeString(locale, DEFAULT_TIME_OPTIONS);
}

/**
 * Formats a date relative to now (e.g., "2 days ago", "in 3 hours")
 * @param {string|Date|number} date - Date to format
 * @param {string} [locale='en-GB'] - Locale for formatting
 * @returns {string} Relative time string
 */
export function formatRelative(date, locale = 'en-GB') {
  if (!date) {
    return '';
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day');
  }
  if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, 'hour');
  }
  if (Math.abs(diffMins) >= 1) {
    return rtf.format(diffMins, 'minute');
  }
  return rtf.format(diffSecs, 'second');
}

/**
 * Formats a date for input[type="date"] elements (YYYY-MM-DD)
 * @param {string|Date|number} date - Date to format
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export function formatDateInput(date) {
  if (!date) {
    return '';
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toISOString().split('T')[0];
}

/**
 * Formats a date for input[type="datetime-local"] elements
 * @param {string|Date|number} date - Date to format
 * @returns {string} Local datetime string (YYYY-MM-DDTHH:MM)
 */
export function formatDateTimeInput(date) {
  if (!date) {
    return '';
  }

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  // Format as local time for datetime-local input
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parses a date string or returns null if invalid
 * @param {string|Date|number} date - Date to parse
 * @returns {Date|null} Parsed date or null
 */
export function parseDate(date) {
  if (!date) {
    return null;
  }

  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Gets the current date as ISO string
 * @returns {string} ISO date string
 */
export function getCurrentISODate() {
  return new Date().toISOString();
}

/**
 * Gets the start of day for a date
 * @param {string|Date|number} date - Date to process
 * @returns {Date|null} Start of day or null if invalid
 */
export function startOfDay(date) {
  const parsed = parseDate(date);
  if (!parsed) {
    return null;
  }

  const result = new Date(parsed);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of day for a date
 * @param {string|Date|number} date - Date to process
 * @returns {Date|null} End of day or null if invalid
 */
export function endOfDay(date) {
  const parsed = parseDate(date);
  if (!parsed) {
    return null;
  }

  const result = new Date(parsed);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Checks if two dates are on the same day
 * @param {string|Date|number} date1 - First date
 * @param {string|Date|number} date2 - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(date1, date2) {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);

  if (!d1 || !d2) {
    return false;
  }

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats a season date range
 * @param {string|Date} startDate - Season start date
 * @param {string|Date} [endDate] - Season end date (optional)
 * @returns {string} Formatted date range
 */
export function formatSeasonRange(startDate, endDate) {
  const start = parseDate(startDate);
  if (!start) {
    return '';
  }

  const end = endDate ? parseDate(endDate) : null;

  const startYear = start.getFullYear();
  const endYear = end ? end.getFullYear() : null;

  if (endYear && startYear !== endYear) {
    return `${startYear}/${endYear}`;
  }

  return `${startYear}`;
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelative,
  formatDateInput,
  formatDateTimeInput,
  parseDate,
  getCurrentISODate,
  startOfDay,
  endOfDay,
  isSameDay,
  formatSeasonRange,
};
