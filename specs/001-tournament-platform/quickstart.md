# Quickstart: Snooker Tournament Platform

**Feature**: `001-tournament-platform`  
**Date**: 2025-11-27

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- Modern browser (Chrome, Firefox, Safari, Edge - last 2 versions)
- Optional: Azure Storage account for cloud persistence

## Project Setup

### 1. Initialize Vite Project

```bash
npm create vite@latest snooker-tournament -- --template vanilla
cd snooker-tournament
npm install
```

### 2. Install Development Dependencies

```bash
# Testing
npm install -D vitest @vitest/coverage-v8 jsdom

# Linting & Formatting
npm install -D eslint prettier eslint-config-prettier

# Azure Storage (optional)
npm install @azure/storage-blob
```

### 3. Project Structure

Create the following directory structure:

```bash
mkdir -p src/{js/{models,services,storage,ui,utils},styles/components,pages,assets}
mkdir -p tests/{unit,integration,fixtures}
```

### 4. Configuration Files

**vite.config.js**:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

**.env.example**:
```
VITE_AZURE_STORAGE_URL=https://your-account.blob.core.windows.net
VITE_AZURE_CONTAINER_NAME=tournaments
VITE_AZURE_SAS_TOKEN=your-sas-token
```

## Development

### Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Run Tests

```bash
# Watch mode
npm test

# Single run with coverage
npm run test:coverage
```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Key Implementation Notes

### Storage Abstraction

The application uses a storage abstraction layer that supports:
- **Azure Blob Storage**: Primary storage for production
- **localStorage**: Fallback for development/offline use

```javascript
// src/js/storage/index.js
export async function saveData(key, data) {
  if (isAzureConfigured()) {
    return saveToAzure(key, data);
  }
  return saveToLocalStorage(key, data);
}
```

### State Management

Simple store pattern for application state:

```javascript
// src/js/store.js
const store = {
  state: {
    season: null,
    tournament: null,
    players: [],
  },
  listeners: new Set(),
  
  getState() { return this.state; },
  
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(fn => fn(this.state));
  },
  
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
};
```

### Component Pattern

Vanilla JS component pattern:

```javascript
// src/js/ui/components/pool-standings.js
export function PoolStandings(pool, matches, breaks) {
  const standings = calculateStandings(pool, matches, breaks);
  
  return `
    <div class="pool-standings" data-pool-id="${pool.id}">
      <h3>${pool.name}</h3>
      <table>
        <thead>
          <tr>
            <th>Pos</th>
            <th>Player</th>
            <th>P</th>
            <th>W</th>
            <th>L</th>
            <th>HB</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map(renderStandingRow).join('')}
        </tbody>
      </table>
    </div>
  `;
}
```

## Testing Strategy

### Unit Tests (≥80% coverage)

Test models and services in isolation:

```javascript
// tests/unit/services/standings.test.js
import { describe, it, expect } from 'vitest';
import { calculateStandings } from '../../../src/js/services/standings.js';

describe('calculateStandings', () => {
  it('should rank players by wins', () => {
    const pool = { playerIds: ['p1', 'p2', 'p3', 'p4'] };
    const matches = [
      { player1Id: 'p1', player2Id: 'p2', winnerId: 'p1' },
      // ...
    ];
    
    const standings = calculateStandings(pool, matches, []);
    expect(standings[0].playerId).toBe('p1');
  });
});
```

### Critical Path Tests (≥95% coverage)

Scoring, rankings, and tiebreakers require thorough testing:

```javascript
// tests/unit/services/tiebreakers.test.js
describe('tiebreakers', () => {
  it('should apply head-to-head first', () => { /* ... */ });
  it('should use highest break when h2h tied', () => { /* ... */ });
  it('should fall back to shootout', () => { /* ... */ });
});
```

## Deployment

### Static Hosting (Recommended)

Build output is static files, deployable to:
- Azure Static Web Apps
- Netlify
- Vercel
- GitHub Pages

```bash
npm run build
# Deploy contents of dist/ folder
```

### Azure Static Web Apps

```bash
# Install Azure CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./dist --env production
```

## Common Tasks

### Create a New Tournament

1. Navigate to "New Tournament"
2. Enter name and date
3. Select format (Regular/Masters)
4. Configure players and pools
5. Choose draw type (Random/Seeded)
6. Click "Create Tournament"

### Enter Match Results

1. Select tournament and pool/round
2. Click on match
3. Enter frame winners
4. Add breaks (if any)
5. Save match result

### Export/Import Data

**Export**:
```javascript
const data = await exportSeasonData(seasonId);
downloadAsJson(data, `season-${seasonId}.json`);
```

**Import**:
```javascript
const file = await selectJsonFile();
const data = await parseAndValidate(file);
await importSeasonData(data);
```
