/**
 * Performance Utilities
 * Lazy loading, debouncing, throttling, and DOM optimization helpers
 */

/**
 * Lazy load a module/page component
 * @param {Function} importFn - Dynamic import function returning a promise
 * @returns {Function} Async function that returns the loaded module
 */
export function lazyLoad(importFn) {
  let cachedModule = null;
  let loading = null;
  
  return async function loadModule() {
    if (cachedModule) {
      return cachedModule;
    }
    
    if (loading) {
      return loading;
    }
    
    loading = importFn()
      .then(module => {
        cachedModule = module;
        loading = null;
        return module;
      })
      .catch(err => {
        loading = null;
        throw err;
      });
    
    return loading;
  };
}

/**
 * Debounce a function - delays execution until after wait milliseconds
 * have elapsed since the last time the function was invoked
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @param {Object} options - Options
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait = 250, options = {}) {
  const { leading = false, trailing = true } = options;
  let timeout = null;
  let lastArgs = null;
  let lastThis = null;
  let result = null;
  
  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = lastThis = null;
    result = fn.apply(thisArg, args);
    return result;
  }
  
  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    
    const callNow = leading && !timeout;
    
    if (timeout) {
      globalThis.clearTimeout(timeout);
    }
    
    timeout = globalThis.setTimeout(() => {
      timeout = null;
      if (trailing && lastArgs) {
        invokeFunc();
      }
    }, wait);
    
    if (callNow) {
      return invokeFunc();
    }
    
    return result;
  }
  
  debounced.cancel = function() {
    if (timeout) {
      globalThis.clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = lastThis = null;
  };
  
  debounced.flush = function() {
    if (timeout && lastArgs) {
      globalThis.clearTimeout(timeout);
      timeout = null;
      return invokeFunc();
    }
    return result;
  };
  
  return debounced;
}

/**
 * Throttle a function - ensures function is called at most once per wait period
 * @param {Function} fn - Function to throttle
 * @param {number} wait - Minimum milliseconds between calls
 * @param {Object} options - Options
 * @returns {Function} Throttled function
 */
export function throttle(fn, wait = 100, options = {}) {
  const { leading = true, trailing = true } = options;
  let timeout = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;
  let result = null;
  
  function invokeFunc() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = lastThis = null;
    lastCallTime = Date.now();
    result = fn.apply(thisArg, args);
    return result;
  }
  
  function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);
    
    lastArgs = args;
    lastThis = this;
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        globalThis.clearTimeout(timeout);
        timeout = null;
      }
      if (leading || lastCallTime !== 0) {
        return invokeFunc();
      }
    }
    
    if (!timeout && trailing) {
      timeout = globalThis.setTimeout(() => {
        timeout = null;
        if (trailing && lastArgs) {
          invokeFunc();
        }
      }, remaining);
    }
    
    return result;
  }
  
  throttled.cancel = function() {
    if (timeout) {
      globalThis.clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = lastThis = null;
    lastCallTime = 0;
  };
  
  return throttled;
}

/**
 * Request Animation Frame wrapper for smooth animations
 * @param {Function} fn - Function to call on next frame
 * @returns {number} Animation frame ID
 */
export function onNextFrame(fn) {
  return globalThis.requestAnimationFrame(fn);
}

/**
 * Cancel a scheduled animation frame
 * @param {number} id - Animation frame ID
 */
export function cancelFrame(id) {
  globalThis.cancelAnimationFrame(id);
}

/**
 * Batch DOM updates to minimize reflows
 * @param {Function[]} updates - Array of update functions
 */
export function batchDOMUpdates(updates) {
  // Read phase - gather all measurements first
  const reads = [];
  const writes = [];
  
  updates.forEach(update => {
    if (typeof update === 'function') {
      writes.push(update);
    } else if (update && typeof update.read === 'function' && typeof update.write === 'function') {
      reads.push(update.read);
      writes.push(update.write);
    }
  });
  
  // Execute all reads
  const readResults = reads.map(read => read());
  
  // Execute all writes in a single frame
  onNextFrame(() => {
    writes.forEach((write, index) => {
      if (reads[index]) {
        write(readResults[index]);
      } else {
        write();
      }
    });
  });
}

/**
 * Create a virtual list for efficient rendering of large lists
 * @param {Object} options - Virtual list options
 * @returns {Object} Virtual list controller
 */
export function createVirtualList(options) {
  const {
    container,
    itemHeight,
    totalItems,
    renderItem,
    overscan = 3
  } = options;
  
  let scrollTop = 0;
  let containerHeight = 0;
  
  function getVisibleRange() {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + (overscan * 2);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleCount);
    
    return { startIndex, endIndex };
  }
  
  function render() {
    const { startIndex, endIndex } = getVisibleRange();
    const items = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      const item = renderItem(i);
      item.style.position = 'absolute';
      item.style.top = `${i * itemHeight}px`;
      item.style.left = '0';
      item.style.right = '0';
      items.push(item);
    }
    
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.height = `${totalItems * itemHeight}px`;
    
    items.forEach(item => container.appendChild(item));
  }
  
  function handleScroll() {
    scrollTop = container.parentElement.scrollTop;
    onNextFrame(render);
  }
  
  function init() {
    containerHeight = container.parentElement.clientHeight;
    container.parentElement.addEventListener('scroll', throttle(handleScroll, 16));
    render();
  }
  
  function update(newTotalItems) {
    options.totalItems = newTotalItems;
    render();
  }
  
  function destroy() {
    container.parentElement.removeEventListener('scroll', handleScroll);
  }
  
  return { init, update, destroy, render };
}

/**
 * Intersection Observer wrapper for lazy loading elements
 * @param {Function} callback - Callback when element enters viewport
 * @param {Object} options - IntersectionObserver options
 * @returns {Object} Observer controller
 */
export function createLazyObserver(callback, options = {}) {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0
  } = options;
  
  const observer = new globalThis.IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { root, rootMargin, threshold });
  
  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
}

/**
 * Preload images for better perceived performance
 * @param {string[]} urls - Image URLs to preload
 * @returns {Promise<HTMLImageElement[]>} Loaded images
 */
export function preloadImages(urls) {
  return Promise.all(
    urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new globalThis.Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    })
  );
}

/**
 * Memory cache with expiration
 * @param {Object} options - Cache options
 * @returns {Object} Cache controller
 */
export function createCache(options = {}) {
  const { maxSize = 100, ttl = 300000 } = options; // 5 min default TTL
  const cache = new Map();
  
  function set(key, value) {
    // Evict oldest if at capacity
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  function get(key) {
    const entry = cache.get(key);
    if (!entry) {
      return undefined;
    }
    
    // Check expiration
    if (Date.now() - entry.timestamp > ttl) {
      cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  function has(key) {
    return get(key) !== undefined;
  }
  
  function clear() {
    cache.clear();
  }
  
  function size() {
    return cache.size;
  }
  
  return { set, get, has, clear, size };
}

/**
 * Memoize a function - caches results based on arguments
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Optional function to generate cache key from args
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyFn = null) {
  const cache = new Map();
  
  function memoized(...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  }
  
  memoized.clear = () => cache.clear();
  memoized.size = () => cache.size;
  
  return memoized;
}

/**
 * Idle callback wrapper - execute when browser is idle
 * @param {Function} fn - Function to execute
 * @param {Object} options - Options
 * @returns {number} Callback ID
 */
export function onIdle(fn, options = {}) {
  const { timeout = 1000 } = options;
  
  if ('requestIdleCallback' in globalThis) {
    return globalThis.requestIdleCallback(fn, { timeout });
  }
  
  // Fallback for browsers without requestIdleCallback
  return globalThis.setTimeout(fn, 1);
}

/**
 * Cancel an idle callback
 * @param {number} id - Callback ID
 */
export function cancelIdle(id) {
  if ('cancelIdleCallback' in globalThis) {
    globalThis.cancelIdleCallback(id);
  } else {
    globalThis.clearTimeout(id);
  }
}

/**
 * Measure execution time of a function
 * @param {string} label - Label for the measurement
 * @param {Function} fn - Function to measure
 * @returns {*} Result of the function
 */
export function measure(label, fn) {
  const start = globalThis.performance.now();
  const result = fn();
  const duration = globalThis.performance.now() - start;
  
  // Only log in development
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(`⏱ ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

/**
 * Measure async execution time
 * @param {string} label - Label for the measurement
 * @param {Function} fn - Async function to measure
 * @returns {Promise<*>} Result of the function
 */
export async function measureAsync(label, fn) {
  const start = globalThis.performance.now();
  const result = await fn();
  const duration = globalThis.performance.now() - start;
  
  // Only log in development
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.log(`⏱ ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
}

export default {
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
  measureAsync
};
