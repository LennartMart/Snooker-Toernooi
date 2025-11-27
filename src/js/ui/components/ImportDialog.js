/**
 * Import Dialog Component
 * Modal dialog for importing data from JSON files
 */

import { createElement, h, render } from '../Component.js';
import {
  validateFile,
  importFromFile,
  createImportPreview,
  checkVersionCompatibility,
} from '../../services/ImportService.js';

/**
 * @typedef {Object} ImportDialogProps
 * @property {Function} [onImportSuccess] - Called after successful import
 * @property {Function} [onImportError] - Called on import error
 * @property {Function} [onClose] - Called when dialog is closed
 */

/**
 * Import dialog state
 */
let dialogState = {
  isOpen: false,
  step: 'select', // 'select' | 'preview' | 'importing' | 'complete' | 'error'
  selectedFile: null,
  validation: null,
  preview: null,
  importMode: 'merge', // 'merge' | 'replace'
  importResult: null,
  error: null,
};

/**
 * Container element reference
 */
let containerElement = null;
let callbacks = {};

/**
 * Resets dialog state
 */
function resetState() {
  dialogState = {
    isOpen: false,
    step: 'select',
    selectedFile: null,
    validation: null,
    preview: null,
    importMode: 'merge',
    importResult: null,
    error: null,
  };
}

/**
 * Renders the file selection step
 * @returns {HTMLElement}
 */
function renderSelectStep() {
  return createElement(
    'div',
    { className: 'import-dialog__step import-dialog__step--select' },
    h.h3({}, 'Select File'),
    h.p({ className: 'import-dialog__description' }, 
      'Choose a JSON file exported from the Snooker Tournament Platform.'
    ),
    createElement(
      'div',
      { className: 'import-dialog__dropzone', id: 'import-dropzone' },
      createElement(
        'input',
        {
          type: 'file',
          id: 'import-file-input',
          accept: '.json',
          className: 'import-dialog__file-input',
          onChange: handleFileSelect,
        }
      ),
      createElement(
        'label',
        { htmlFor: 'import-file-input', className: 'import-dialog__dropzone-label' },
        h.span({ className: 'import-dialog__dropzone-icon' }, '📁'),
        h.span({ className: 'import-dialog__dropzone-text' }, 'Click to select a file'),
        h.span({ className: 'import-dialog__dropzone-hint' }, 'or drag and drop a .json file here')
      )
    )
  );
}

/**
 * Renders the preview step
 * @returns {HTMLElement}
 */
function renderPreviewStep() {
  const { validation, preview, selectedFile } = dialogState;
  
  if (!validation || !preview) {
    return h.div({}, 'Loading preview...');
  }
  
  const versionCheck = checkVersionCompatibility(preview.metadata?.version);
  
  return createElement(
    'div',
    { className: 'import-dialog__step import-dialog__step--preview' },
    h.h3({}, 'Import Preview'),
    
    // File info
    createElement(
      'div',
      { className: 'import-dialog__file-info' },
      h.p({}, `File: ${selectedFile?.name || 'Unknown'}`),
      h.p({}, `Version: ${preview.metadata?.version || 'Unknown'}`),
      h.p({}, `Export Date: ${preview.metadata?.exportDate || 'Unknown'}`)
    ),
    
    // Version warning
    !versionCheck.compatible
      ? createElement(
          'div',
          { className: 'alert alert--warning' },
          h.p({}, versionCheck.message)
        )
      : null,
    
    // Validation errors
    validation.errors.length > 0
      ? createElement(
          'div',
          { className: 'alert alert--error' },
          h.h4({}, 'Validation Errors'),
          createElement(
            'ul',
            {},
            ...validation.errors.map((err) => h.li({}, err))
          )
        )
      : null,
    
    // Validation warnings
    validation.warnings.length > 0
      ? createElement(
          'div',
          { className: 'alert alert--warning' },
          h.h4({}, 'Warnings'),
          createElement(
            'ul',
            {},
            ...validation.warnings.map((warn) => h.li({}, warn))
          )
        )
      : null,
    
    // Summary
    createElement(
      'div',
      { className: 'import-dialog__summary' },
      h.h4({}, 'Data Summary'),
      createElement(
        'dl',
        { className: 'import-dialog__stats' },
        h.dt({}, 'Players'),
        h.dd({}, String(validation.summary?.playerCount || 0)),
        h.dt({}, 'Seasons'),
        h.dd({}, String(validation.summary?.seasonCount || 0)),
        h.dt({}, 'Tournaments'),
        h.dd({}, String(validation.summary?.tournamentCount || 0)),
        h.dt({}, 'Matches'),
        h.dd({}, String(validation.summary?.matchCount || 0)),
        h.dt({}, 'Breaks'),
        h.dd({}, String(validation.summary?.breakCount || 0))
      )
    ),
    
    // Import mode selection
    createElement(
      'div',
      { className: 'import-dialog__mode' },
      h.h4({}, 'Import Mode'),
      createElement(
        'label',
        { className: 'import-dialog__radio' },
        createElement('input', {
          type: 'radio',
          name: 'importMode',
          value: 'merge',
          checked: dialogState.importMode === 'merge',
          onChange: () => {
            dialogState.importMode = 'merge';
            renderDialog();
          },
        }),
        createElement(
          'span',
          {},
          'Merge with existing data',
          h.small({ className: 'text-muted' }, ' - Updates existing records, adds new ones')
        )
      ),
      createElement(
        'label',
        { className: 'import-dialog__radio' },
        createElement('input', {
          type: 'radio',
          name: 'importMode',
          value: 'replace',
          checked: dialogState.importMode === 'replace',
          onChange: () => {
            dialogState.importMode = 'replace';
            renderDialog();
          },
        }),
        createElement(
          'span',
          {},
          'Replace all data',
          h.small({ className: 'text-muted text-danger' }, ' - Deletes all existing data')
        )
      )
    ),
    
    // Actions
    createElement(
      'div',
      { className: 'import-dialog__actions' },
      h.button(
        {
          type: 'button',
          className: 'btn btn--secondary',
          onClick: () => {
            dialogState.step = 'select';
            dialogState.selectedFile = null;
            dialogState.validation = null;
            dialogState.preview = null;
            renderDialog();
          },
        },
        '← Back'
      ),
      h.button(
        {
          type: 'button',
          className: 'btn btn--primary',
          onClick: handleImport,
          disabled: !validation.valid,
        },
        'Import Data'
      )
    )
  );
}

/**
 * Renders the importing step
 * @returns {HTMLElement}
 */
function renderImportingStep() {
  return createElement(
    'div',
    { className: 'import-dialog__step import-dialog__step--importing' },
    h.h3({}, 'Importing...'),
    createElement(
      'div',
      { className: 'import-dialog__progress' },
      createElement('div', { className: 'import-dialog__spinner' }),
      h.p({}, 'Please wait while your data is being imported.')
    )
  );
}

/**
 * Renders the complete step
 * @returns {HTMLElement}
 */
function renderCompleteStep() {
  const { importResult } = dialogState;
  
  return createElement(
    'div',
    { className: 'import-dialog__step import-dialog__step--complete' },
    h.h3({}, '✓ Import Complete'),
    
    // Stats
    createElement(
      'div',
      { className: 'import-dialog__summary' },
      h.h4({}, 'Imported'),
      createElement(
        'dl',
        { className: 'import-dialog__stats' },
        h.dt({}, 'Players'),
        h.dd({}, String(importResult?.stats?.playersImported || 0)),
        h.dt({}, 'Seasons'),
        h.dd({}, String(importResult?.stats?.seasonsImported || 0)),
        h.dt({}, 'Tournaments'),
        h.dd({}, String(importResult?.stats?.tournamentsImported || 0)),
        h.dt({}, 'Matches'),
        h.dd({}, String(importResult?.stats?.matchesImported || 0)),
        h.dt({}, 'Breaks'),
        h.dd({}, String(importResult?.stats?.breaksImported || 0))
      )
    ),
    
    // Warnings
    importResult?.warnings?.length > 0
      ? createElement(
          'div',
          { className: 'alert alert--warning' },
          h.h4({}, 'Warnings'),
          createElement(
            'ul',
            {},
            ...importResult.warnings.map((warn) => h.li({}, warn))
          )
        )
      : null,
    
    // Actions
    createElement(
      'div',
      { className: 'import-dialog__actions' },
      h.button(
        {
          type: 'button',
          className: 'btn btn--primary',
          onClick: closeDialog,
        },
        'Done'
      )
    )
  );
}

/**
 * Renders the error step
 * @returns {HTMLElement}
 */
function renderErrorStep() {
  const { error, importResult } = dialogState;
  const errors = importResult?.errors || [error?.message || 'Unknown error'];
  
  return createElement(
    'div',
    { className: 'import-dialog__step import-dialog__step--error' },
    h.h3({}, '✗ Import Failed'),
    
    createElement(
      'div',
      { className: 'alert alert--error' },
      createElement(
        'ul',
        {},
        ...errors.map((err) => h.li({}, err))
      )
    ),
    
    // Actions
    createElement(
      'div',
      { className: 'import-dialog__actions' },
      h.button(
        {
          type: 'button',
          className: 'btn btn--secondary',
          onClick: () => {
            dialogState.step = 'select';
            dialogState.error = null;
            dialogState.importResult = null;
            renderDialog();
          },
        },
        'Try Again'
      ),
      h.button(
        {
          type: 'button',
          className: 'btn btn--primary',
          onClick: closeDialog,
        },
        'Close'
      )
    )
  );
}

/**
 * Renders the dialog content
 */
function renderDialog() {
  if (!containerElement) {
    return;
  }
  
  let stepContent;
  switch (dialogState.step) {
    case 'preview':
      stepContent = renderPreviewStep();
      break;
    case 'importing':
      stepContent = renderImportingStep();
      break;
    case 'complete':
      stepContent = renderCompleteStep();
      break;
    case 'error':
      stepContent = renderErrorStep();
      break;
    default:
      stepContent = renderSelectStep();
  }
  
  const content = createElement(
    'div',
    { 
      className: 'import-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'import-dialog-title',
    },
    // Backdrop
    createElement('div', { 
      className: 'import-dialog__backdrop',
      onClick: dialogState.step === 'importing' ? null : closeDialog,
    }),
    
    // Dialog
    createElement(
      'div',
      { className: 'import-dialog__content' },
      // Header
      createElement(
        'header',
        { className: 'import-dialog__header' },
        h.h2({ id: 'import-dialog-title' }, 'Import Data'),
        dialogState.step !== 'importing'
          ? h.button(
              {
                type: 'button',
                className: 'import-dialog__close',
                onClick: closeDialog,
                'aria-label': 'Close dialog',
              },
              '×'
            )
          : null
      ),
      
      // Body
      createElement(
        'div',
        { className: 'import-dialog__body' },
        stepContent
      )
    )
  );
  
  render(containerElement, content);
}

/**
 * Handles file selection
 * @param {Event} e - Change event
 */
async function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) {
    return;
  }
  
  dialogState.selectedFile = file;
  dialogState.step = 'importing'; // Show loading while validating
  renderDialog();
  
  try {
    // Validate file
    const validation = await validateFile(file);
    dialogState.validation = validation;
    
    // Read file for preview
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        dialogState.preview = createImportPreview(data);
        dialogState.step = 'preview';
        renderDialog();
      } catch {
        dialogState.error = new Error('Failed to parse file');
        dialogState.step = 'error';
        renderDialog();
      }
    };
    reader.onerror = () => {
      dialogState.error = new Error('Failed to read file');
      dialogState.step = 'error';
      renderDialog();
    };
    reader.readAsText(file);
  } catch (error) {
    dialogState.error = error;
    dialogState.step = 'error';
    renderDialog();
  }
}

/**
 * Handles import action
 */
async function handleImport() {
  dialogState.step = 'importing';
  renderDialog();
  
  try {
    const result = await importFromFile(dialogState.selectedFile, {
      mode: dialogState.importMode,
    });
    
    dialogState.importResult = result;
    
    if (result.success) {
      dialogState.step = 'complete';
      if (callbacks.onImportSuccess) {
        callbacks.onImportSuccess(result);
      }
    } else {
      dialogState.step = 'error';
      if (callbacks.onImportError) {
        callbacks.onImportError(new Error(result.errors.join(', ')));
      }
    }
  } catch (error) {
    dialogState.error = error;
    dialogState.step = 'error';
    if (callbacks.onImportError) {
      callbacks.onImportError(error);
    }
  }
  
  renderDialog();
}

/**
 * Opens the import dialog
 * @param {ImportDialogProps} props - Dialog props
 */
export function openImportDialog(props = {}) {
  callbacks = {
    onImportSuccess: props.onImportSuccess,
    onImportError: props.onImportError,
    onClose: props.onClose,
  };
  
  resetState();
  dialogState.isOpen = true;
  
  // Create container if needed
  if (!containerElement) {
    containerElement = document.createElement('div');
    containerElement.id = 'import-dialog-container';
    document.body.appendChild(containerElement);
  }
  
  renderDialog();
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Closes the import dialog
 */
export function closeDialog() {
  dialogState.isOpen = false;
  
  // Remove dialog
  if (containerElement) {
    containerElement.innerHTML = '';
  }
  
  // Restore body scroll
  document.body.style.overflow = '';
  
  if (callbacks.onClose) {
    callbacks.onClose();
  }
  
  // Reset state
  resetState();
}

/**
 * Creates an import button that opens the dialog
 * @param {Object} props - Button props
 * @param {string} [props.label='Import Data'] - Button label
 * @param {string} [props.className] - Additional CSS classes
 * @param {Function} [props.onImportSuccess] - Success callback
 * @param {Function} [props.onImportError] - Error callback
 * @returns {HTMLElement}
 */
export function createImportButton(props = {}) {
  const { label = 'Import Data', className = '', onImportSuccess, onImportError } = props;
  
  return h.button(
    {
      type: 'button',
      className: `btn btn--secondary import-btn ${className}`.trim(),
      onClick: () => openImportDialog({
        onImportSuccess,
        onImportError,
      }),
    },
    createElement('span', { className: 'import-btn__icon' }, '📤'),
    createElement('span', { className: 'import-btn__text' }, label)
  );
}

export default {
  openImportDialog,
  closeDialog,
  createImportButton,
};
