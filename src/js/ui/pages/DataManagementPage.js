/**
 * Data Management Page
 * Page for managing data export and import
 */

import { render, createElement, h, showLoading, showError } from '../Component.js';
import { store, setLoading, setError } from '../../store/index.js';
import { router } from '../router.js';
import { createExportButton } from '../components/ExportButton.js';
import { createImportButton } from '../components/ImportDialog.js';
import { getExportStats, exportAllData } from '../../services/ExportService.js';
import { clearAllData } from '../../services/ImportService.js';

/**
 * @typedef {Object} DataManagementPageProps
 * @property {HTMLElement} container - Container element
 */

/**
 * Page state
 */
let pageState = {
  stats: null,
  isLoading: false,
  showClearConfirm: false,
};

/**
 * Loads data statistics
 * @returns {Promise<Object>}
 */
async function loadStats() {
  try {
    const data = await exportAllData();
    return getExportStats(data);
  } catch {
    return null;
  }
}

/**
 * Renders the storage info section
 * @returns {HTMLElement}
 */
function renderStorageInfo() {
  const { stats } = pageState;
  
  if (!stats) {
    return createElement(
      'div',
      { className: 'data-stats data-stats--empty' },
      h.p({ className: 'text-muted' }, 'No data statistics available')
    );
  }
  
  // Format size
  const sizeKB = (stats.sizeBytes / 1024).toFixed(2);
  const sizeMB = (stats.sizeBytes / (1024 * 1024)).toFixed(2);
  const sizeDisplay = stats.sizeBytes > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
  
  return createElement(
    'div',
    { className: 'data-stats' },
    h.h3({}, 'Current Data'),
    createElement(
      'div',
      { className: 'data-stats__grid' },
      createElement(
        'div',
        { className: 'data-stats__item' },
        h.span({ className: 'data-stats__value' }, String(stats.playerCount)),
        h.span({ className: 'data-stats__label' }, 'Players')
      ),
      createElement(
        'div',
        { className: 'data-stats__item' },
        h.span({ className: 'data-stats__value' }, String(stats.seasonCount)),
        h.span({ className: 'data-stats__label' }, 'Seasons')
      ),
      createElement(
        'div',
        { className: 'data-stats__item' },
        h.span({ className: 'data-stats__value' }, String(stats.tournamentCount)),
        h.span({ className: 'data-stats__label' }, 'Tournaments')
      ),
      createElement(
        'div',
        { className: 'data-stats__item' },
        h.span({ className: 'data-stats__value' }, String(stats.matchCount)),
        h.span({ className: 'data-stats__label' }, 'Matches')
      ),
      createElement(
        'div',
        { className: 'data-stats__item' },
        h.span({ className: 'data-stats__value' }, String(stats.breakCount)),
        h.span({ className: 'data-stats__label' }, 'Breaks')
      ),
      createElement(
        'div',
        { className: 'data-stats__item' },
        h.span({ className: 'data-stats__value' }, sizeDisplay),
        h.span({ className: 'data-stats__label' }, 'Total Size')
      )
    )
  );
}

/**
 * Renders the export section
 * @returns {HTMLElement}
 */
function renderExportSection() {
  return createElement(
    'section',
    { className: 'data-section data-section--export' },
    h.h2({}, 'Export Data'),
    h.p({ className: 'data-section__description' },
      'Download your data as a JSON file. This can be used for backup or to transfer to another device.'
    ),
    createElement(
      'div',
      { className: 'data-section__actions' },
      createExportButton({
        type: 'all',
        label: 'Export All Data',
        size: 'lg',
        onExportComplete: () => {
          // Show success message
          showNotification('Data exported successfully!');
        },
        onExportError: (error) => {
          showNotification(`Export failed: ${error.message}`, 'error');
        },
      })
    ),
    createElement(
      'div',
      { className: 'data-section__info' },
      h.p({ className: 'text-muted' },
        'The export includes all players, seasons, tournaments, matches, and breaks.'
      )
    )
  );
}

/**
 * Renders the import section
 * @returns {HTMLElement}
 */
function renderImportSection() {
  return createElement(
    'section',
    { className: 'data-section data-section--import' },
    h.h2({}, 'Import Data'),
    h.p({ className: 'data-section__description' },
      'Import data from a previously exported JSON file. You can choose to merge with existing data or replace all data.'
    ),
    createElement(
      'div',
      { className: 'data-section__actions' },
      createImportButton({
        label: 'Import from File',
        onImportSuccess: () => {
          showNotification('Data imported successfully!');
          // Reload page to show updated data
          refreshPage();
        },
        onImportError: (error) => {
          showNotification(`Import failed: ${error.message}`, 'error');
        },
      })
    ),
    createElement(
      'div',
      { className: 'data-section__info' },
      h.p({ className: 'text-muted' },
        'The file must be a valid JSON export from the Snooker Tournament Platform.'
      )
    )
  );
}

/**
 * Handles clear all data
 */
async function handleClearData() {
  if (!pageState.showClearConfirm) {
    pageState.showClearConfirm = true;
    renderDataManagementPageContent();
    return;
  }
  
  try {
    await clearAllData();
    showNotification('All data cleared successfully');
    pageState.showClearConfirm = false;
    await refreshPage();
  } catch (error) {
    showNotification(`Failed to clear data: ${error.message}`, 'error');
  }
}

/**
 * Renders the danger zone section
 * @returns {HTMLElement}
 */
function renderDangerZone() {
  return createElement(
    'section',
    { className: 'data-section data-section--danger' },
    h.h2({}, 'Danger Zone'),
    createElement(
      'div',
      { className: 'danger-zone' },
      createElement(
        'div',
        { className: 'danger-zone__item' },
        createElement(
          'div',
          { className: 'danger-zone__info' },
          h.h4({}, 'Clear All Data'),
          h.p({}, 'Permanently delete all players, seasons, tournaments, matches, and breaks. This action cannot be undone.')
        ),
        pageState.showClearConfirm
          ? createElement(
              'div',
              { className: 'danger-zone__confirm' },
              h.p({ className: 'text-danger' }, 'Are you sure? This cannot be undone!'),
              createElement(
                'div',
                { className: 'danger-zone__buttons' },
                h.button(
                  {
                    type: 'button',
                    className: 'btn btn--secondary',
                    onClick: () => {
                      pageState.showClearConfirm = false;
                      renderDataManagementPageContent();
                    },
                  },
                  'Cancel'
                ),
                h.button(
                  {
                    type: 'button',
                    className: 'btn btn--danger',
                    onClick: handleClearData,
                  },
                  'Yes, Delete Everything'
                )
              )
            )
          : h.button(
              {
                type: 'button',
                className: 'btn btn--danger-outline',
                onClick: handleClearData,
              },
              'Clear All Data'
            )
      )
    )
  );
}

/**
 * Shows a notification message
 * @param {string} message - Message to show
 * @param {'success' | 'error'} [type='success'] - Notification type
 */
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = createElement(
    'div',
    { className: `notification notification--${type}` },
    h.span({}, message),
    h.button({
      type: 'button',
      className: 'notification__close',
      onClick: () => notification.remove(),
      'aria-label': 'Dismiss',
    }, '×')
  );
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  globalThis.setTimeout(() => notification.remove(), 5000);
}

/**
 * Refreshes the page data
 */
async function refreshPage() {
  pageState.stats = await loadStats();
  renderDataManagementPageContent();
}

/**
 * Renders the page content
 */
function renderDataManagementPageContent() {
  const container = document.getElementById('app');
  
  render(
    container,
    createElement(
      'div',
      { className: 'page page--data-management' },
      // Header
      createElement(
        'header',
        { className: 'page-header' },
        h.h1({}, 'Data Management'),
        h.p({ className: 'lead' }, 'Export, import, and manage your tournament data')
      ),
      
      // Storage info
      renderStorageInfo(),
      
      // Export section
      renderExportSection(),
      
      // Import section
      renderImportSection(),
      
      // Danger zone
      renderDangerZone()
    )
  );
}

/**
 * Renders the Data Management page
 * @param {DataManagementPageProps} props - Page props
 */
export async function renderDataManagementPage({ container }) {
  showLoading(container, 'Loading data information...');
  store.dispatch(setLoading(true));
  
  try {
    // Load stats
    pageState.stats = await loadStats();
    pageState.showClearConfirm = false;
    
    // Render content
    renderDataManagementPageContent();
  } catch (error) {
    store.dispatch(setError(error.message));
    showError(container, `Failed to load data: ${error.message}`, () => {
      router.navigate('/');
    });
  } finally {
    store.dispatch(setLoading(false));
  }
}

export default {
  renderDataManagementPage,
};
