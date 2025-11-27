/**
 * Loading States Components
 * Reusable loading, error, empty, and toast notification components
 */

import { createElement, h, render } from './Component.js';
import { announce } from '../utils/accessibility.js';

/**
 * Create a loading spinner element
 * @param {Object} options - Spinner options
 * @param {string} options.size - 'sm', 'md', or 'lg'
 * @returns {HTMLElement}
 */
export function createSpinner(options = {}) {
  const { size = 'md' } = options;
  const sizeClass = size !== 'md' ? `loading-spinner--${size}` : '';
  
  return createElement('div', {
    className: `loading-spinner ${sizeClass}`.trim(),
    role: 'status',
    'aria-label': 'Loading'
  });
}

/**
 * Create a loading state container
 * @param {string} message - Loading message
 * @param {Object} options - Loading options
 * @returns {HTMLElement}
 */
export function createLoadingState(message = 'Loading...', options = {}) {
  const { size = 'md' } = options;
  
  return createElement(
    'div',
    { 
      className: 'loading-state',
      role: 'status',
      'aria-live': 'polite',
      'aria-busy': 'true'
    },
    createSpinner({ size }),
    h.p({}, message)
  );
}

/**
 * Create a skeleton loader
 * @param {string} type - 'text', 'title', 'avatar', 'button', 'card', 'table-row', 'input'
 * @param {Object} options - Skeleton options
 * @returns {HTMLElement}
 */
export function createSkeleton(type = 'text', options = {}) {
  const { width = 'full', count = 1 } = options;
  
  const classMap = {
    'text': `skeleton skeleton-text skeleton-text--${width}`,
    'title': 'skeleton skeleton-title',
    'avatar': 'skeleton skeleton-avatar',
    'button': 'skeleton skeleton-button',
    'card': 'skeleton skeleton-card',
    'table-row': 'skeleton skeleton-table-row',
    'input': 'skeleton skeleton-input'
  };
  
  const className = classMap[type] || classMap['text'];
  
  if (count > 1) {
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(createElement('div', { className, 'aria-hidden': 'true' }));
    }
    return createElement('div', { className: 'skeleton-group', role: 'status', 'aria-label': 'Loading content' }, ...items);
  }
  
  return createElement('div', { className, role: 'status', 'aria-label': 'Loading content', 'aria-hidden': 'true' });
}

/**
 * Create a skeleton card with content placeholders
 * @returns {HTMLElement}
 */
export function createSkeletonCard() {
  return createElement(
    'div',
    { className: 'card skeleton-card-content', role: 'status', 'aria-label': 'Loading card' },
    createSkeleton('title'),
    createSkeleton('text', { width: 'full' }),
    createSkeleton('text', { width: 'medium' }),
    createSkeleton('text', { width: 'short' })
  );
}

/**
 * Create an error state container
 * @param {string} message - Error message
 * @param {Object} options - Error options
 * @returns {HTMLElement}
 */
export function createErrorState(message, options = {}) {
  const { 
    title = 'Something went wrong',
    onRetry = null,
    onDismiss = null
  } = options;
  
  const children = [
    createElement('div', { className: 'error-state__icon', 'aria-hidden': 'true' }, '⚠️'),
    createElement('h3', { className: 'error-state__title' }, title),
    createElement('p', { className: 'error-state__message' }, message)
  ];
  
  if (onRetry || onDismiss) {
    const actions = createElement('div', { className: 'error-state__actions' });
    
    if (onRetry) {
      actions.appendChild(
        h.button({ className: 'btn btn-primary', onClick: onRetry }, 'Try Again')
      );
    }
    
    if (onDismiss) {
      actions.appendChild(
        h.button({ className: 'btn btn-secondary', onClick: onDismiss }, 'Dismiss')
      );
    }
    
    children.push(actions);
  }
  
  // Announce error to screen readers
  announce(message, 'assertive');
  
  return createElement(
    'div',
    { 
      className: 'error-state',
      role: 'alert',
      'aria-live': 'assertive'
    },
    ...children
  );
}

/**
 * Create an error alert box
 * @param {string} message - Error message
 * @param {Object} options - Alert options
 * @returns {HTMLElement}
 */
export function createErrorAlert(message, options = {}) {
  const { title = 'Error', onDismiss = null } = options;
  
  const alert = createElement(
    'div',
    { className: 'error-alert', role: 'alert', 'aria-live': 'assertive' },
    createElement('span', { className: 'error-alert__icon', 'aria-hidden': 'true' }, '⚠️'),
    createElement(
      'div',
      { className: 'error-alert__content' },
      createElement('div', { className: 'error-alert__title' }, title),
      createElement('div', { className: 'error-alert__message' }, message)
    )
  );
  
  if (onDismiss) {
    alert.appendChild(
      h.button(
        { 
          className: 'error-alert__dismiss', 
          onClick: onDismiss,
          'aria-label': 'Dismiss error'
        }, 
        '✕'
      )
    );
  }
  
  return alert;
}

/**
 * Create an empty state container
 * @param {string} message - Empty state message
 * @param {Object} options - Empty state options
 * @returns {HTMLElement}
 */
export function createEmptyState(message, options = {}) {
  const { 
    title = null,
    icon = '📭',
    actionText = null,
    onAction = null
  } = options;
  
  const children = [
    createElement('div', { className: 'empty-state__icon', 'aria-hidden': 'true' }, icon)
  ];
  
  if (title) {
    children.push(createElement('h3', { className: 'empty-state__title' }, title));
  }
  
  children.push(createElement('p', { className: 'empty-state__message' }, message));
  
  if (actionText && onAction) {
    children.push(
      createElement(
        'div',
        { className: 'empty-state__action' },
        h.button({ className: 'btn btn-primary', onClick: onAction }, actionText)
      )
    );
  }
  
  return createElement(
    'div',
    { className: 'empty-state' },
    ...children
  );
}

/**
 * Create a success state container
 * @param {string} message - Success message
 * @param {Object} options - Success options
 * @returns {HTMLElement}
 */
export function createSuccessState(message, options = {}) {
  const { title = 'Success!', onAction = null, actionText = 'Continue' } = options;
  
  const children = [
    createElement('div', { className: 'success-state__icon', 'aria-hidden': 'true' }, '✓'),
    createElement('h3', { className: 'success-state__title' }, title),
    createElement('p', { className: 'success-state__message' }, message)
  ];
  
  if (onAction) {
    children.push(
      h.button({ className: 'btn btn-primary', onClick: onAction }, actionText)
    );
  }
  
  // Announce success to screen readers
  announce(message, 'polite');
  
  return createElement(
    'div',
    { className: 'success-state', role: 'status', 'aria-live': 'polite' },
    ...children
  );
}

/**
 * Create a success alert
 * @param {string} message - Success message
 * @returns {HTMLElement}
 */
export function createSuccessAlert(message) {
  return createElement(
    'div',
    { className: 'success-alert', role: 'status', 'aria-live': 'polite' },
    createElement('span', { className: 'success-alert__icon', 'aria-hidden': 'true' }, '✓'),
    createElement(
      'div',
      { className: 'success-alert__content' },
      createElement('div', { className: 'success-alert__message' }, message)
    )
  );
}

/**
 * Create a progress bar
 * @param {number} value - Current value (0-100)
 * @param {Object} options - Progress options
 * @returns {HTMLElement}
 */
export function createProgressBar(value, options = {}) {
  const { 
    label = 'Progress',
    showLabel = true,
    variant = 'default', // 'success', 'warning', 'error'
    indeterminate = false
  } = options;
  
  const variantClass = variant !== 'default' ? `progress-bar--${variant}` : '';
  const indeterminateClass = indeterminate ? 'progress-bar--indeterminate' : '';
  
  const bar = createElement(
    'div',
    {
      className: `progress-bar ${variantClass} ${indeterminateClass}`.trim(),
      role: 'progressbar',
      'aria-valuenow': indeterminate ? undefined : value,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-label': label,
      'aria-valuetext': indeterminate ? 'Loading' : `${value}%`
    },
    createElement('div', { 
      className: 'progress-bar__fill',
      style: indeterminate ? {} : { width: `${value}%` }
    })
  );
  
  if (showLabel && !indeterminate) {
    return createElement(
      'div',
      { className: 'progress-container' },
      createElement(
        'div',
        { className: 'progress-label' },
        createElement('span', { className: 'progress-label__text' }, label),
        createElement('span', { className: 'progress-label__value' }, `${value}%`)
      ),
      bar
    );
  }
  
  return bar;
}

/* ============ Toast Notification System ============ */

let toastContainer = null;
const toasts = new Map();
let toastId = 0;

/**
 * Get or create toast container
 * @returns {HTMLElement}
 */
function getToastContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = createElement('div', { 
      className: 'toast-container',
      role: 'region',
      'aria-label': 'Notifications'
    });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {Object} options - Toast options
 * @returns {number} Toast ID for manual dismissal
 */
export function showToast(message, options = {}) {
  const {
    type = 'info', // 'success', 'error', 'warning', 'info'
    title = null,
    duration = 5000, // ms, 0 for no auto-dismiss
    dismissible = true
  } = options;
  
  const id = ++toastId;
  const container = getToastContainer();
  
  const icons = {
    success: '✓',
    error: '⚠️',
    warning: '⚠',
    info: 'ℹ️'
  };
  
  const toast = createElement(
    'div',
    { 
      className: `toast toast--${type}`,
      role: type === 'error' ? 'alert' : 'status',
      'aria-live': type === 'error' ? 'assertive' : 'polite'
    },
    createElement('span', { className: 'toast__icon', 'aria-hidden': 'true' }, icons[type] || icons.info),
    createElement(
      'div',
      { className: 'toast__content' },
      title ? createElement('div', { className: 'toast__title' }, title) : null,
      createElement('div', { className: 'toast__message' }, message)
    )
  );
  
  if (dismissible) {
    toast.appendChild(
      h.button(
        { 
          className: 'toast__dismiss',
          onClick: () => dismissToast(id),
          'aria-label': 'Dismiss notification'
        },
        '✕'
      )
    );
  }
  
  container.appendChild(toast);
  toasts.set(id, toast);
  
  // Announce to screen readers
  announce(title ? `${title}: ${message}` : message, type === 'error' ? 'assertive' : 'polite');
  
  // Auto dismiss
  if (duration > 0) {
    globalThis.setTimeout(() => dismissToast(id), duration);
  }
  
  return id;
}

/**
 * Dismiss a toast notification
 * @param {number} id - Toast ID
 */
export function dismissToast(id) {
  const toast = toasts.get(id);
  if (toast) {
    toast.classList.add('toast--exiting');
    globalThis.setTimeout(() => {
      toast.remove();
      toasts.delete(id);
    }, 300);
  }
}

/**
 * Dismiss all toast notifications
 */
export function dismissAllToasts() {
  toasts.forEach((toast, id) => dismissToast(id));
}

/* ============ Convenience Toast Methods ============ */

export function showSuccessToast(message, options = {}) {
  return showToast(message, { ...options, type: 'success' });
}

export function showErrorToast(message, options = {}) {
  return showToast(message, { ...options, type: 'error' });
}

export function showWarningToast(message, options = {}) {
  return showToast(message, { ...options, type: 'warning' });
}

export function showInfoToast(message, options = {}) {
  return showToast(message, { ...options, type: 'info' });
}

/* ============ Button Loading State ============ */

/**
 * Set button to loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - Whether loading
 * @param {string} loadingText - Optional loading text
 */
export function setButtonLoading(button, loading, loadingText = null) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.classList.add('btn--loading');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (loadingText) {
      button.textContent = loadingText;
    }
  } else {
    button.classList.remove('btn--loading');
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

/* ============ Page Loading State ============ */

/**
 * Show/hide page loading overlay
 * @param {boolean} show - Whether to show
 * @param {string} message - Loading message
 */
export function setPageLoading(show, message = 'Loading...') {
  let overlay = document.getElementById('page-loading-overlay');
  
  if (show) {
    if (!overlay) {
      overlay = createElement(
        'div',
        { id: 'page-loading-overlay', className: 'overlay-loading' },
        createElement(
          'div',
          { className: 'overlay-loading__content' },
          createSpinner({ size: 'lg' }),
          h.p({}, message)
        )
      );
      document.body.appendChild(overlay);
    }
    document.body.classList.add('page-loading');
    announce(message, 'polite');
  } else {
    if (overlay) {
      overlay.remove();
    }
    document.body.classList.remove('page-loading');
  }
}

/* ============ Render Helpers for Containers ============ */

/**
 * Render loading state into a container
 * @param {HTMLElement} container - Target container
 * @param {string} message - Loading message
 */
export function renderLoading(container, message = 'Loading...') {
  render(container, createLoadingState(message));
}

/**
 * Render error state into a container
 * @param {HTMLElement} container - Target container
 * @param {string} message - Error message
 * @param {Object} options - Error options
 */
export function renderError(container, message, options = {}) {
  render(container, createErrorState(message, options));
}

/**
 * Render empty state into a container
 * @param {HTMLElement} container - Target container
 * @param {string} message - Empty message
 * @param {Object} options - Empty state options
 */
export function renderEmpty(container, message, options = {}) {
  render(container, createEmptyState(message, options));
}

/**
 * Render success state into a container
 * @param {HTMLElement} container - Target container
 * @param {string} message - Success message
 * @param {Object} options - Success options
 */
export function renderSuccess(container, message, options = {}) {
  render(container, createSuccessState(message, options));
}

export default {
  createSpinner,
  createLoadingState,
  createSkeleton,
  createSkeletonCard,
  createErrorState,
  createErrorAlert,
  createEmptyState,
  createSuccessState,
  createSuccessAlert,
  createProgressBar,
  showToast,
  dismissToast,
  dismissAllToasts,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  setButtonLoading,
  setPageLoading,
  renderLoading,
  renderError,
  renderEmpty,
  renderSuccess
};
