/**
 * Simple Hash-Based Router
 * SPA routing using URL hash fragments
 */

/**
 * @typedef {Object} Route
 * @property {string} path - Route path pattern
 * @property {function(Object): void} handler - Route handler function
 * @property {string} [title] - Page title
 */

/**
 * @typedef {Object} RouteMatch
 * @property {Route} route - Matched route
 * @property {Object<string, string>} params - Route parameters
 */

class Router {
  constructor() {
    /** @type {Route[]} */
    this._routes = [];

    /** @type {function(string, Object): void|null} */
    this._notFoundHandler = null;

    /** @type {function(RouteMatch): void|null} */
    this._beforeEach = null;

    /** @type {function(RouteMatch): void|null} */
    this._afterEach = null;

    this._currentPath = '';

    // Bind the handler
    this._handleHashChange = this._handleHashChange.bind(this);
  }

  /**
   * Registers a route
   * @param {string} path - Route path (e.g., '/players', '/tournament/:id')
   * @param {function(Object): void} handler - Handler function
   * @param {string} [title] - Page title
   * @returns {Router} this for chaining
   */
  on(path, handler, title = '') {
    this._routes.push({ path, handler, title });
    return this;
  }

  /**
   * Sets the not found handler
   * @param {function(string, Object): void} handler - Handler for unknown routes
   * @returns {Router} this for chaining
   */
  notFound(handler) {
    this._notFoundHandler = handler;
    return this;
  }

  /**
   * Sets a guard to run before each route
   * @param {function(RouteMatch): boolean|Promise<boolean>} guard - Guard function
   * @returns {Router} this for chaining
   */
  beforeEach(guard) {
    this._beforeEach = guard;
    return this;
  }

  /**
   * Sets a callback to run after each route
   * @param {function(RouteMatch): void} callback - Callback function
   * @returns {Router} this for chaining
   */
  afterEach(callback) {
    this._afterEach = callback;
    return this;
  }

  /**
   * Starts the router
   */
  start() {
    window.addEventListener('hashchange', this._handleHashChange);
    // Handle initial route
    this._handleHashChange();
  }

  /**
   * Stops the router
   */
  stop() {
    window.removeEventListener('hashchange', this._handleHashChange);
  }

  /**
   * Navigates to a path
   * @param {string} path - Path to navigate to
   */
  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  }

  /**
   * Replaces current path without adding to history
   * @param {string} path - Path to replace with
   */
  replace(path) {
    const hash = path.startsWith('#') ? path : `#${path}`;
    window.history.replaceState(null, '', hash);
    this._handleHashChange();
  }

  /**
   * Gets the current path
   * @returns {string} Current path
   */
  getCurrentPath() {
    return this._currentPath;
  }

  /**
   * Handles hash change events
   * @private
   */
  async _handleHashChange() {
    const hash = window.location.hash.slice(1) || '/';
    this._currentPath = hash;

    const match = this._matchRoute(hash);

    if (match) {
      // Run before guard
      if (this._beforeEach) {
        const shouldContinue = await this._beforeEach(match);
        if (shouldContinue === false) {
          return;
        }
      }

      // Update page title
      if (match.route.title) {
        document.title = `${match.route.title} - Snooker Tournament`;
      }

      // Execute handler
      try {
        await match.route.handler(match.params);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Route handler error:', error);
      }

      // Run after callback
      if (this._afterEach) {
        this._afterEach(match);
      }
    } else if (this._notFoundHandler) {
      this._notFoundHandler(hash, {});
    }
  }

  /**
   * Matches a path to a route
   * @param {string} path - Path to match
   * @returns {RouteMatch|null} Match result or null
   * @private
   */
  _matchRoute(path) {
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    for (const route of this._routes) {
      const params = this._extractParams(route.path, normalizedPath);
      if (params !== null) {
        return { route, params };
      }
    }

    return null;
  }

  /**
   * Extracts parameters from a path
   * @param {string} pattern - Route pattern
   * @param {string} path - Actual path
   * @returns {Object<string, string>|null} Parameters or null if no match
   * @private
   */
  _extractParams(pattern, path) {
    // Handle exact match
    if (pattern === path) {
      return {};
    }

    // Split into segments
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    // Check if segment counts match
    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Parameter segment
        const paramName = patternPart.slice(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        // Static segment doesn't match
        return null;
      }
    }

    return params;
  }
}

// Create singleton router instance
const router = new Router();

/**
 * Creates a link element with proper hash navigation
 * @param {string} path - Path to link to
 * @param {string} text - Link text
 * @param {string} [className=''] - CSS class
 * @returns {HTMLAnchorElement} Link element
 */
export function createLink(path, text, className = '') {
  const link = document.createElement('a');
  link.href = `#${path.startsWith('/') ? path.slice(1) : path}`;
  link.textContent = text;
  if (className) {
    link.className = className;
  }
  return link;
}

/**
 * Checks if a path is active (current route)
 * @param {string} path - Path to check
 * @returns {boolean} True if active
 */
export function isActive(path) {
  const currentPath = router.getCurrentPath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedCurrent = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
  return normalizedCurrent === normalizedPath;
}

export { router, Router };
export default router;
