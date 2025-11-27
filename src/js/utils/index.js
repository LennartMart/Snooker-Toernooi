/**
 * Utils Index
 * Exports all utility functions
 */

export { generateUUID, isValidUUID } from './uuid.js';

export {
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
} from './dateFormatter.js';

export {
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
} from './validation.js';

export {
  announce,
  setPageTitle,
  generateId,
  associateDescription,
  associateLabel,
  trapFocus,
  handleListNavigation,
  ariaPatterns,
  addKeyboardClick,
  isFocusable,
  getFocusableElements,
} from './accessibility.js';

export {
  lazyLoad,
  debounce,
  throttle,
  onNextFrame,
  cancelFrame,
  batchDOMUpdates,
  createVirtualList,
  createLazyObserver,
  preloadImages,
  createCache,
  memoize,
  onIdle,
  cancelIdle,
  measure,
  measureAsync,
} from './performance.js';
