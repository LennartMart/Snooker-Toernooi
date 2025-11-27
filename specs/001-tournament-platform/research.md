# Research: Snooker Tournament Platform

**Feature**: `001-tournament-platform`  
**Date**: 2025-11-27  
**Status**: Complete

## Research Tasks

### 1. Azure Blob Storage for JSON Persistence

**Decision**: Use `@azure/storage-blob` SDK for cloud storage

**Rationale**:
- Official Microsoft SDK, well-maintained
- Supports browser environments via bundled builds
- Simple blob operations (upload/download JSON files)
- SAS tokens enable secure access without backend

**Alternatives Considered**:
- Azure Table Storage: Overkill for simple JSON files, more complex API
- Azure Cosmos DB: Too expensive for simple document storage
- Firebase: Would add Google dependency, preference is Azure

**Implementation Notes**:
- Use SAS tokens with limited permissions (read/write to specific container)
- Store tokens in environment variables (Vite's `import.meta.env`)
- Fallback to localStorage when Azure unavailable or in development

### 2. Vite Configuration for Vanilla JS

**Decision**: Minimal Vite setup with vanilla JS

**Rationale**:
- Zero-config for vanilla projects
- Fast HMR during development
- Efficient production builds with tree-shaking
- Native ES modules support

**Configuration Needs**:
```javascript
// vite.config.js
export default {
  build: {
    target: 'es2022',
    outDir: 'dist'
  },
  define: {
    // Environment variables for Azure connection
  }
}
```

**Alternatives Considered**:
- Webpack: More complex configuration, slower builds
- Parcel: Less control over output, larger community for Vite
- No bundler: Would lose HMR and optimization benefits

### 3. Testing Strategy with Vitest

**Decision**: Use Vitest for all testing

**Rationale**:
- Native Vite integration (same config, fast execution)
- Jest-compatible API (familiar patterns)
- Built-in coverage reporting
- Supports ES modules natively

**Test Structure**:
- Unit tests: Models, services, utilities (≥80% coverage)
- Integration tests: Workflow scenarios (tournament creation → completion)
- Critical path tests: Scoring, rankings, tiebreakers (≥95% coverage)

**Alternatives Considered**:
- Jest: Would require additional configuration for ES modules
- Mocha/Chai: More setup required, less integrated
- Playwright: For E2E, but Vitest sufficient for unit/integration

### 4. Round-Robin Tournament Generation

**Decision**: Implement circle method algorithm for round-robin scheduling

**Rationale**:
- Guarantees balanced schedule (each player plays exactly once vs each opponent)
- O(n²) complexity acceptable for small pools (4 players = 6 matches)
- Well-documented algorithm, easy to implement

**Algorithm**:
```
For pool of 4 players [A, B, C, D]:
Round 1: A-B, C-D
Round 2: A-C, B-D  
Round 3: A-D, B-C
```

**Alternatives Considered**:
- Random pairing: Could create unbalanced schedules
- Berger tables: More complex, same result for small pools

### 5. Knockout Bracket Structure

**Decision**: Binary tree structure with winner/loser progression

**Rationale**:
- 16-player winner bracket: 4 rounds (R16 → QF → SF → F)
- Loser bracket progression: Winners fight for higher places, losers for lower
- Each match determines 2 adjacent positions (e.g., 1st/2nd, 3rd/4th)

**Implementation Notes**:
```
Winner Bracket (places 1-16):
- Round 1: 8 matches → 8 winners (places 1-8), 8 losers (places 9-16)
- Round 2 winners: 4 matches → places 1-4, losers places 5-8
- Round 2 losers: 4 matches → places 9-12, losers 13-16
- Continue until all 16 positions determined

Consolation Bracket (places 17-32):
- Same structure for bottom 16 players
```

### 6. Tiebreaker Algorithm

**Decision**: Cascading tiebreaker with manual shootout override

**Rationale**:
- Clear precedence: head-to-head → highest break → shootout
- Head-to-head handles most ties (2-player tie in 4-player pool)
- Shootout is rare edge case, manual entry acceptable

**Implementation**:
```javascript
function comparePlayers(a, b, matches, breaks) {
  // 1. Compare wins
  if (a.wins !== b.wins) return b.wins - a.wins;
  
  // 2. Head-to-head
  const h2h = getHeadToHead(a, b, matches);
  if (h2h !== 0) return h2h;
  
  // 3. Highest break
  const aBreak = getHighestBreak(a, breaks);
  const bBreak = getHighestBreak(b, breaks);
  if (aBreak !== bBreak) return bBreak - aBreak;
  
  // 4. Shootout (manual override)
  return a.shootoutRank - b.shootoutRank;
}
```

### 7. JSON Data Schema Design

**Decision**: Normalized structure with references by ID

**Rationale**:
- Avoids data duplication
- Enables efficient updates
- Standard pattern for document storage

**Structure**:
```
season.json
├── id, name, year
├── tournaments: [tournamentId, ...]
└── settings: { breakThreshold, mastersQualifiers }

tournament.json
├── id, name, date, seasonId, format
├── players: [playerId, ...]
├── pools: [{ id, playerIds: [...] }]
├── matches: [{ id, poolId, player1Id, player2Id, frames, breaks }]
├── brackets: { winner: {...}, consolation: {...} }
└── rankings: [{ position, playerId, points }]

players.json
├── [{ id, name }]
```

### 8. UI/UX Patterns for Vanilla JS

**Decision**: Component-based architecture without framework

**Rationale**:
- Reusable render functions
- State management via simple store pattern
- Event delegation for efficiency

**Patterns**:
```javascript
// Component pattern
function PoolStandings(pool, matches) {
  const standings = calculateStandings(pool, matches);
  return `
    <table class="standings">
      ${standings.map(row => `<tr>...</tr>`).join('')}
    </table>
  `;
}

// State management
const store = {
  state: { tournament: null, ... },
  subscribe(fn) { ... },
  dispatch(action) { ... }
};
```

**Alternatives Considered**:
- Web Components: Added complexity, less browser support
- lit-html: Would add dependency, vanilla templates sufficient
- Alpine.js: Small but still a framework dependency

## Summary of Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Storage | Azure Blob + localStorage | Cloud persistence with offline fallback |
| Build | Vite (minimal config) | Fast development, optimized builds |
| Testing | Vitest | Native Vite integration, Jest-compatible |
| Scheduling | Circle method | Balanced round-robin in O(n²) |
| Brackets | Binary tree | Clear winner/loser progression |
| Tiebreakers | Cascading algorithm | Handles all documented rules |
| Data | Normalized JSON | Efficient storage and updates |
| UI | Vanilla components | No framework overhead |

## Unresolved Items

None - all NEEDS CLARIFICATION items resolved.
