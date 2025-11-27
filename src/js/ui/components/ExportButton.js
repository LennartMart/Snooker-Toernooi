/**
 * Export Button Component
 * Button for exporting tournament/season data as JSON
 */

import { createElement, h } from '../Component.js';
import {
  exportAndDownloadAll,
  exportAndDownloadSeason,
  exportAndDownloadTournament,
} from '../../services/ExportService.js';

/**
 * @typedef {Object} ExportButtonProps
 * @property {'all' | 'season' | 'tournament'} [type='all'] - Export type
 * @property {string} [id] - ID for season/tournament export
 * @property {string} [label] - Button label
 * @property {string} [className] - Additional CSS classes
 * @property {'sm' | 'md' | 'lg'} [size='md'] - Button size
 * @property {boolean} [disabled=false] - Disabled state
 * @property {Function} [onExportStart] - Called when export starts
 * @property {Function} [onExportComplete] - Called when export completes
 * @property {Function} [onExportError] - Called on export error
 */

/**
 * Creates an Export Button component
 * @param {ExportButtonProps} props - Component props
 * @returns {HTMLElement}
 */
export function createExportButton(props = {}) {
  const {
    type = 'all',
    id,
    label,
    className = '',
    size = 'md',
    disabled = false,
    onExportStart,
    onExportComplete,
    onExportError,
  } = props;
  
  let isExporting = false;
  
  /**
   * Gets the default label based on type
   * @returns {string}
   */
  function getDefaultLabel() {
    switch (type) {
      case 'season':
        return 'Export Season';
      case 'tournament':
        return 'Export Tournament';
      default:
        return 'Export All Data';
    }
  }
  
  /**
   * Handles the export action
   */
  async function handleExport() {
    if (isExporting || disabled) {
      return;
    }
    
    isExporting = true;
    updateButton();
    
    if (onExportStart) {
      onExportStart();
    }
    
    try {
      switch (type) {
        case 'season':
          if (!id) {
            throw new Error('Season ID is required for season export');
          }
          await exportAndDownloadSeason(id);
          break;
        case 'tournament':
          if (!id) {
            throw new Error('Tournament ID is required for tournament export');
          }
          await exportAndDownloadTournament(id);
          break;
        default:
          await exportAndDownloadAll();
      }
      
      if (onExportComplete) {
        onExportComplete();
      }
    } catch (error) {
      if (onExportError) {
        onExportError(error);
      } else {
        // eslint-disable-next-line no-console
        console.error('Export failed:', error);
      }
    } finally {
      isExporting = false;
      updateButton();
    }
  }
  
  /**
   * Updates button state
   */
  function updateButton() {
    if (button) {
      button.disabled = isExporting || disabled;
      button.textContent = isExporting ? 'Exporting...' : (label || getDefaultLabel());
      button.classList.toggle('btn--loading', isExporting);
    }
  }
  
  const sizeClass = size !== 'md' ? `btn--${size}` : '';
  
  const button = createElement(
    'button',
    {
      type: 'button',
      className: `btn btn--secondary export-btn ${sizeClass} ${className}`.trim(),
      onClick: handleExport,
      disabled: disabled || isExporting,
      'aria-label': label || getDefaultLabel(),
    },
    createElement(
      'span',
      { className: 'export-btn__icon' },
      '📥'
    ),
    createElement(
      'span',
      { className: 'export-btn__text' },
      label || getDefaultLabel()
    )
  );
  
  return button;
}

/**
 * Creates an inline export link
 * @param {ExportButtonProps} props - Component props
 * @returns {HTMLElement}
 */
export function createExportLink(props = {}) {
  const {
    type = 'all',
    id,
    label,
    className = '',
    onExportStart,
    onExportComplete,
    onExportError,
  } = props;
  
  /**
   * Gets the default label based on type
   * @returns {string}
   */
  function getDefaultLabel() {
    switch (type) {
      case 'season':
        return 'Export as JSON';
      case 'tournament':
        return 'Export as JSON';
      default:
        return 'Export all data';
    }
  }
  
  /**
   * Handles the export action
   * @param {Event} e - Click event
   */
  async function handleExport(e) {
    e.preventDefault();
    
    if (onExportStart) {
      onExportStart();
    }
    
    try {
      switch (type) {
        case 'season':
          if (id) {
            await exportAndDownloadSeason(id);
          }
          break;
        case 'tournament':
          if (id) {
            await exportAndDownloadTournament(id);
          }
          break;
        default:
          await exportAndDownloadAll();
      }
      
      if (onExportComplete) {
        onExportComplete();
      }
    } catch (error) {
      if (onExportError) {
        onExportError(error);
      }
    }
  }
  
  return h.a(
    {
      href: '#',
      className: `export-link ${className}`.trim(),
      onClick: handleExport,
    },
    label || getDefaultLabel()
  );
}

/**
 * Creates an export dropdown with multiple options
 * @param {Object} props - Component props
 * @param {string} [props.seasonId] - Season ID for season export
 * @param {string} [props.tournamentId] - Tournament ID for tournament export
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement}
 */
export function createExportDropdown(props = {}) {
  const { seasonId, tournamentId, className = '' } = props;
  let isOpen = false;
  let dropdownElement = null;
  
  /**
   * Toggles dropdown visibility
   */
  function toggleDropdown() {
    isOpen = !isOpen;
    if (dropdownElement) {
      dropdownElement.classList.toggle('export-dropdown--open', isOpen);
    }
  }
  
  /**
   * Closes dropdown
   */
  function closeDropdown() {
    isOpen = false;
    if (dropdownElement) {
      dropdownElement.classList.remove('export-dropdown--open');
    }
  }
  
  /**
   * Handles export option click
   * @param {string} type - Export type
   * @param {string} [id] - ID for season/tournament
   */
  async function handleOption(type, id) {
    closeDropdown();
    
    try {
      switch (type) {
        case 'season':
          if (id) {
            await exportAndDownloadSeason(id);
          }
          break;
        case 'tournament':
          if (id) {
            await exportAndDownloadTournament(id);
          }
          break;
        default:
          await exportAndDownloadAll();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', error);
    }
  }
  
  const options = [
    { label: 'Export All Data', type: 'all' },
  ];
  
  if (seasonId) {
    options.push({ label: 'Export Season', type: 'season', id: seasonId });
  }
  
  if (tournamentId) {
    options.push({ label: 'Export Tournament', type: 'tournament', id: tournamentId });
  }
  
  dropdownElement = createElement(
    'div',
    { className: `export-dropdown ${className}`.trim() },
    createElement(
      'button',
      {
        type: 'button',
        className: 'btn btn--secondary export-dropdown__trigger',
        onClick: toggleDropdown,
        'aria-expanded': isOpen,
        'aria-haspopup': 'true',
      },
      '📥 Export',
      createElement('span', { className: 'export-dropdown__arrow' }, ' ▼')
    ),
    createElement(
      'ul',
      {
        className: 'export-dropdown__menu',
        role: 'menu',
      },
      ...options.map((option) =>
        createElement(
          'li',
          { role: 'none' },
          createElement(
            'button',
            {
              type: 'button',
              className: 'export-dropdown__item',
              role: 'menuitem',
              onClick: () => handleOption(option.type, option.id),
            },
            option.label
          )
        )
      )
    )
  );
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (dropdownElement && !dropdownElement.contains(e.target)) {
      closeDropdown();
    }
  });
  
  return dropdownElement;
}

export default {
  createExportButton,
  createExportLink,
  createExportDropdown,
};
