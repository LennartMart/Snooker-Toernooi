/**
 * Base Component
 * Provides a simple render function pattern for UI components
 */

/**
 * @typedef {Object} ComponentOptions
 * @property {string} [tagName='div'] - Root element tag name
 * @property {string} [className=''] - CSS class for root element
 * @property {string} [id=''] - ID for root element
 */

/**
 * Creates a component container element
 * @param {ComponentOptions} [options={}] - Component options
 * @returns {HTMLElement} Component container
 */
export function createContainer(options = {}) {
  const { tagName = 'div', className = '', id = '' } = options;

  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (id) {
    element.id = id;
  }

  return element;
}

/**
 * Renders content into a target element
 * @param {HTMLElement} target - Target container
 * @param {string|HTMLElement|HTMLElement[]} content - Content to render
 */
export function render(target, content) {
  // Clear existing content
  target.innerHTML = '';

  if (typeof content === 'string') {
    target.innerHTML = content;
  } else if (Array.isArray(content)) {
    content.forEach((child) => {
      if (child instanceof HTMLElement) {
        target.appendChild(child);
      }
    });
  } else if (content instanceof HTMLElement) {
    target.appendChild(content);
  }
}

/**
 * Creates an element with optional properties and children
 * @param {string} tagName - Element tag name
 * @param {Object} [props={}] - Element properties
 * @param {...(string|HTMLElement)} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tagName, props = {}, ...children) {
  const element = document.createElement(tagName);

  // Apply properties
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'htmlFor') {
      // Handle htmlFor -> for attribute mapping
      element.setAttribute('for', value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (typeof value === 'boolean') {
      // Handle boolean attributes (disabled, checked, readonly, etc.)
      if (value) {
        element.setAttribute(key, '');
      } else {
        element.removeAttribute(key);
      }
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, value);
    }
  });

  // Append children
  children.forEach((child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    } else if (Array.isArray(child)) {
      child.forEach((c) => {
        if (c instanceof HTMLElement) {
          element.appendChild(c);
        } else if (typeof c === 'string' || typeof c === 'number') {
          element.appendChild(document.createTextNode(String(c)));
        }
      });
    }
  });

  return element;
}

/**
 * Shorthand element creators
 */
export const h = {
  div: (props, ...children) => createElement('div', props, ...children),
  span: (props, ...children) => createElement('span', props, ...children),
  p: (props, ...children) => createElement('p', props, ...children),
  h1: (props, ...children) => createElement('h1', props, ...children),
  h2: (props, ...children) => createElement('h2', props, ...children),
  h3: (props, ...children) => createElement('h3', props, ...children),
  h4: (props, ...children) => createElement('h4', props, ...children),
  ul: (props, ...children) => createElement('ul', props, ...children),
  ol: (props, ...children) => createElement('ol', props, ...children),
  li: (props, ...children) => createElement('li', props, ...children),
  a: (props, ...children) => createElement('a', props, ...children),
  button: (props, ...children) => createElement('button', props, ...children),
  input: (props) => createElement('input', props),
  label: (props, ...children) => createElement('label', props, ...children),
  form: (props, ...children) => createElement('form', props, ...children),
  select: (props, ...children) => createElement('select', props, ...children),
  option: (props, ...children) => createElement('option', props, ...children),
  textarea: (props, ...children) => createElement('textarea', props, ...children),
  table: (props, ...children) => createElement('table', props, ...children),
  thead: (props, ...children) => createElement('thead', props, ...children),
  tbody: (props, ...children) => createElement('tbody', props, ...children),
  tr: (props, ...children) => createElement('tr', props, ...children),
  th: (props, ...children) => createElement('th', props, ...children),
  td: (props, ...children) => createElement('td', props, ...children),
  img: (props) => createElement('img', props),
  nav: (props, ...children) => createElement('nav', props, ...children),
  header: (props, ...children) => createElement('header', props, ...children),
  footer: (props, ...children) => createElement('footer', props, ...children),
  main: (props, ...children) => createElement('main', props, ...children),
  section: (props, ...children) => createElement('section', props, ...children),
  article: (props, ...children) => createElement('article', props, ...children),
  aside: (props, ...children) => createElement('aside', props, ...children),
  fieldset: (props, ...children) => createElement('fieldset', props, ...children),
  legend: (props, ...children) => createElement('legend', props, ...children),
  dl: (props, ...children) => createElement('dl', props, ...children),
  dt: (props, ...children) => createElement('dt', props, ...children),
  dd: (props, ...children) => createElement('dd', props, ...children),
};

/**
 * Creates a fragment from multiple elements
 * @param {...HTMLElement} children - Child elements
 * @returns {DocumentFragment} Document fragment
 */
export function fragment(...children) {
  const frag = document.createDocumentFragment();
  children.forEach((child) => {
    if (child instanceof HTMLElement) {
      frag.appendChild(child);
    } else if (typeof child === 'string') {
      frag.appendChild(document.createTextNode(child));
    }
  });
  return frag;
}

/**
 * Conditionally renders content
 * @param {boolean} condition - Condition to check
 * @param {function(): HTMLElement|string} thenFn - Function to call if true
 * @param {function(): HTMLElement|string} [elseFn] - Function to call if false
 * @returns {HTMLElement|string|null} Rendered content or null
 */
export function when(condition, thenFn, elseFn = null) {
  if (condition) {
    return thenFn();
  }
  return elseFn ? elseFn() : null;
}

/**
 * Maps an array to elements
 * @template T
 * @param {T[]} items - Items to map
 * @param {function(T, number): HTMLElement} mapFn - Mapping function
 * @returns {HTMLElement[]} Array of elements
 */
export function mapToElements(items, mapFn) {
  return items.map((item, index) => mapFn(item, index));
}

/**
 * Binds a form to an object, returning form data on submit
 * @param {HTMLFormElement} form - Form element
 * @param {function(Object): void} onSubmit - Submit handler
 */
export function bindForm(form, onSubmit) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  });
}

/**
 * Shows a loading state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} [message='Loading...'] - Loading message
 */
export function showLoading(container, message = 'Loading...') {
  render(
    container,
    createElement(
      'div',
      { className: 'loading-state' },
      createElement('div', { className: 'loading-spinner' }),
      createElement('p', {}, message)
    )
  );
}

/**
 * Shows an error state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Error message
 * @param {function(): void} [retryFn] - Optional retry function
 */
export function showError(container, message, retryFn = null) {
  const errorElement = createElement(
    'div',
    { className: 'error-state' },
    createElement('p', { className: 'error-message' }, message)
  );

  if (retryFn) {
    errorElement.appendChild(
      createElement('button', { className: 'btn btn--secondary', onClick: retryFn }, 'Retry')
    );
  }

  render(container, errorElement);
}

/**
 * Shows an empty state in a container
 * @param {HTMLElement} container - Container element
 * @param {string} message - Empty state message
 * @param {HTMLElement} [action] - Optional action button
 */
export function showEmpty(container, message, action = null) {
  const emptyElement = createElement(
    'div',
    { className: 'empty-state' },
    createElement('p', {}, message)
  );

  if (action) {
    emptyElement.appendChild(action);
  }

  render(container, emptyElement);
}

export default {
  createContainer,
  render,
  createElement,
  h,
  fragment,
  when,
  mapToElements,
  bindForm,
  showLoading,
  showError,
  showEmpty,
};
