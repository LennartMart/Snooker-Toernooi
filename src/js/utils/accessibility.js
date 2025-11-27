/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant helper functions for keyboard navigation and ARIA
 */

/**
 * Announce a message to screen readers via live region
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announce(message, priority = 'polite') {
  const regionId = priority === 'assertive' ? 'alert-region' : 'live-region';
  const region = document.getElementById(regionId);
  
  if (region) {
    // Clear and set message to ensure announcement
    region.textContent = '';
    globalThis.setTimeout(() => {
      region.textContent = message;
    }, 100);
  }
}

/**
 * Set the page title and announce navigation for screen readers
 * @param {string} title - Page title
 */
export function setPageTitle(title) {
  const fullTitle = `${title} | Snooker Tournament Platform`;
  document.title = fullTitle;
  announce(`Navigated to ${title}`);
}

/**
 * Generate a unique ID for accessibility attributes
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'a11y') {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create accessible description association
 * @param {HTMLElement} element - Element to describe
 * @param {HTMLElement} description - Description element
 */
export function associateDescription(element, description) {
  const descId = description.id || generateId('desc');
  description.id = descId;
  element.setAttribute('aria-describedby', descId);
}

/**
 * Create accessible label association
 * @param {HTMLElement} element - Element to label
 * @param {HTMLElement} label - Label element
 */
export function associateLabel(element, label) {
  const labelId = label.id || generateId('label');
  label.id = labelId;
  element.setAttribute('aria-labelledby', labelId);
}

/**
 * Trap focus within a container (for modals/dialogs)
 * @param {HTMLElement} container - Container to trap focus within
 * @returns {Function} Cleanup function to remove trap
 */
export function trapFocus(container) {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  const focusableElements = container.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  // Store previously focused element
  const previouslyFocused = document.activeElement;
  
  // Focus first element
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  function handleKeydown(e) {
    if (e.key !== 'Tab') {
      return;
    }
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }
  
  container.addEventListener('keydown', handleKeydown);
  container.classList.add('focus-trap-active');
  
  // Return cleanup function
  return function release() {
    container.removeEventListener('keydown', handleKeydown);
    container.classList.remove('focus-trap-active');
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus();
    }
  };
}

/**
 * Handle keyboard navigation for lists/grids
 * @param {HTMLElement} container - Container with list items
 * @param {string} itemSelector - Selector for focusable items
 * @param {Object} options - Navigation options
 */
export function handleListNavigation(container, itemSelector, options = {}) {
  const { 
    orientation = 'vertical', // 'vertical', 'horizontal', or 'grid'
    wrap = true,
    columns = 1 // For grid navigation
  } = options;
  
  function handleKeydown(e) {
    const items = Array.from(container.querySelectorAll(itemSelector));
    const currentIndex = items.indexOf(document.activeElement);
    
    if (currentIndex === -1) {
      return;
    }
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'grid') {
          nextIndex = orientation === 'grid' 
            ? currentIndex + columns 
            : currentIndex + 1;
          e.preventDefault();
        }
        break;
        
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'grid') {
          nextIndex = orientation === 'grid' 
            ? currentIndex - columns 
            : currentIndex - 1;
          e.preventDefault();
        }
        break;
        
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'grid') {
          nextIndex = currentIndex + 1;
          e.preventDefault();
        }
        break;
        
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'grid') {
          nextIndex = currentIndex - 1;
          e.preventDefault();
        }
        break;
        
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
        
      case 'End':
        nextIndex = items.length - 1;
        e.preventDefault();
        break;
        
      default:
        return;
    }
    
    // Handle wrapping
    if (wrap) {
      if (nextIndex < 0) {
        nextIndex = items.length - 1;
      }
      if (nextIndex >= items.length) {
        nextIndex = 0;
      }
    } else {
      nextIndex = Math.max(0, Math.min(items.length - 1, nextIndex));
    }
    
    if (items[nextIndex]) {
      items[nextIndex].focus();
    }
  }
  
  container.addEventListener('keydown', handleKeydown);
  
  return function cleanup() {
    container.removeEventListener('keydown', handleKeydown);
  };
}

/**
 * Create ARIA attributes object for common patterns
 */
export const ariaPatterns = {
  /**
   * Button attributes
   * @param {Object} options - Button options
   * @returns {Object} ARIA attributes
   */
  button(options = {}) {
    const attrs = { role: 'button', tabIndex: 0 };
    if (options.pressed !== undefined) {
      attrs['aria-pressed'] = options.pressed;
    }
    if (options.expanded !== undefined) {
      attrs['aria-expanded'] = options.expanded;
    }
    if (options.controls) {
      attrs['aria-controls'] = options.controls;
    }
    if (options.label) {
      attrs['aria-label'] = options.label;
    }
    if (options.disabled) {
      attrs['aria-disabled'] = 'true';
    }
    return attrs;
  },
  
  /**
   * Tab attributes
   * @param {Object} options - Tab options
   * @returns {Object} ARIA attributes
   */
  tab(options = {}) {
    return {
      role: 'tab',
      tabIndex: options.selected ? 0 : -1,
      'aria-selected': options.selected ? 'true' : 'false',
      'aria-controls': options.panelId,
      id: options.id
    };
  },
  
  /**
   * Tab panel attributes
   * @param {Object} options - Panel options
   * @returns {Object} ARIA attributes
   */
  tabPanel(options = {}) {
    return {
      role: 'tabpanel',
      tabIndex: 0,
      'aria-labelledby': options.tabId,
      id: options.id,
      hidden: !options.visible
    };
  },
  
  /**
   * Dialog attributes
   * @param {Object} options - Dialog options
   * @returns {Object} ARIA attributes
   */
  dialog(options = {}) {
    const attrs = {
      role: options.alert ? 'alertdialog' : 'dialog',
      'aria-modal': 'true'
    };
    if (options.labelId) {
      attrs['aria-labelledby'] = options.labelId;
    }
    if (options.descriptionId) {
      attrs['aria-describedby'] = options.descriptionId;
    }
    return attrs;
  },
  
  /**
   * Menu attributes
   * @param {Object} options - Menu options
   * @returns {Object} ARIA attributes
   */
  menu(options = {}) {
    return {
      role: 'menu',
      'aria-label': options.label || 'Menu',
      'aria-orientation': options.orientation || 'vertical'
    };
  },
  
  /**
   * Menu item attributes
   * @param {Object} options - Menu item options
   * @returns {Object} ARIA attributes
   */
  menuItem(options = {}) {
    const attrs = { role: 'menuitem', tabIndex: -1 };
    if (options.disabled) {
      attrs['aria-disabled'] = 'true';
    }
    return attrs;
  },
  
  /**
   * Progress bar attributes
   * @param {Object} options - Progress options
   * @returns {Object} ARIA attributes
   */
  progressBar(options = {}) {
    return {
      role: 'progressbar',
      'aria-valuenow': options.value || 0,
      'aria-valuemin': options.min || 0,
      'aria-valuemax': options.max || 100,
      'aria-valuetext': options.text || `${options.value}%`,
      'aria-label': options.label || 'Progress'
    };
  },
  
  /**
   * Alert attributes
   * @param {Object} options - Alert options
   * @returns {Object} ARIA attributes
   */
  alert(options = {}) {
    return {
      role: 'alert',
      'aria-live': options.priority || 'assertive',
      'aria-atomic': 'true'
    };
  },
  
  /**
   * Status message attributes
   * @param {Object} options - Status options
   * @returns {Object} ARIA attributes
   */
  status(_options = {}) {
    return {
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true'
    };
  },
  
  /**
   * Grid/table attributes
   * @param {Object} options - Grid options
   * @returns {Object} ARIA attributes
   */
  grid(options = {}) {
    return {
      role: 'grid',
      'aria-label': options.label,
      'aria-rowcount': options.rowCount,
      'aria-colcount': options.colCount
    };
  },
  
  /**
   * Sortable column header attributes
   * @param {Object} options - Column options
   * @returns {Object} ARIA attributes
   */
  sortableColumn(options = {}) {
    const attrs = {
      role: 'columnheader',
      'aria-sort': options.sortDirection || 'none',
      tabIndex: 0
    };
    if (options.label) {
      attrs['aria-label'] = `${options.label}, sortable`;
    }
    return attrs;
  }
};

/**
 * Add keyboard click handler for non-button elements
 * @param {HTMLElement} element - Element to make keyboard accessible
 * @param {Function} handler - Click handler
 */
export function addKeyboardClick(element, handler) {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  });
  
  element.addEventListener('click', handler);
}

/**
 * Check if an element is visible and focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether element is focusable
 */
export function isFocusable(element) {
  if (!element) {
    return false;
  }
  
  // Check visibility
  const style = globalThis.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  // Check if element is disabled
  if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  
  // Check tabindex
  const tabindex = element.getAttribute('tabindex');
  if (tabindex !== null && parseInt(tabindex, 10) < 0) {
    return false;
  }
  
  // Check if naturally focusable
  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (focusableTags.includes(element.tagName)) {
    return true;
  }
  
  // Check tabindex for other elements
  return tabindex !== null && parseInt(tabindex, 10) >= 0;
}

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} Array of focusable elements
 */
export function getFocusableElements(container) {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(selectors))
    .filter(el => isFocusable(el));
}

export default {
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
  getFocusableElements
};
