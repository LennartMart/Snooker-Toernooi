# Implementation Plan: Snooker Tournament Platform

**Branch**: `001-tournament-platform` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-tournament-platform/spec.md`

**Status**: ✅ Complete (all 112 tasks implemented)

## Summary

Build a web-based snooker tournament management platform for organizing 32-player tournaments with pool stages, knockout brackets, and season-long standings tracking. The platform enables organizers to create tournaments, enter match results, automatically calculate standings with tiebreakers, generate knockout brackets, and track season points culminating in a Masters finale.

**Technical Approach**: Vanilla JavaScript SPA using Vite, with localStorage for data persistence and JSON export/import for manual backup. Deployed to GitHub Pages via GitHub Actions.

## Technical Context

**Language/Version**: JavaScript ES2022 (vanilla, no framework)  
**Primary Dependencies**: Vite 6.x (build tool), Vitest (testing), ESLint/Prettier (linting)  
**Storage**: Browser localStorage with JSON serialization; manual JSON export/import for backup  
**Testing**: Vitest with jsdom environment (≥80% business logic coverage, ≥95% critical paths)  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions); GitHub Pages hosting  
**Project Type**: Single-page web application (SPA)  
**Performance Goals**: <2s initial load on 4G, <500ms UI response, <100ms storage operations  
**Constraints**: No backend/server-side code (static hosting only), offline-capable via localStorage  
**Scale/Scope**: Single organizer use, 32 players per tournament, 10 tournaments per season, ~15 screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Code Quality | Single responsibility, JSDoc, linting, cyclomatic complexity ≤10 | ✅ ESLint configured, services/models follow SRP |
| II. Testing Standards | ≥80% business logic, ≥95% critical paths (scoring, rankings) | ✅ Vitest configured, critical paths identified |
| III. UX Consistency | Design system, WCAG 2.1 AA, responsive 320px-2560px | ✅ CSS variables, mobile-first approach |
| IV. Performance | <2s load, <500ms API, <100ms DB queries | ✅ localStorage is sub-ms, no network latency |

### Post-Design Check ✅

| Principle | Verification | Status |
|-----------|-------------|--------|
| I. Code Quality | Models, services, UI components all have clear single responsibility | ✅ |
| II. Testing Standards | Test structure defined: unit/integration/fixtures | ✅ |
| III. UX Consistency | Design tokens in variables.css, component styles isolated | ✅ |
| IV. Performance | localStorage operations, no external API calls | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/001-tournament-platform/
├── plan.md              # This file ✅
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/           # Phase 1 output ✅
│   ├── break.schema.json
│   ├── match.schema.json
│   ├── player.schema.json
│   ├── season.schema.json
│   └── tournament.schema.json
├── tasks.md             # Phase 2 output ✅ (112 tasks, all complete)
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── js/
│   ├── models/          # Data entities (Player, Match, Tournament, etc.)
│   │   ├── Break.js
│   │   ├── Frame.js
│   │   ├── KnockoutRound.js
│   │   ├── Match.js
│   │   ├── Player.js
│   │   ├── Pool.js
│   │   ├── Ranking.js
│   │   ├── Season.js
│   │   └── Tournament.js
│   ├── services/        # Business logic (scoring, brackets, rankings)
│   │   ├── BracketGeneratorService.js
│   │   ├── BracketProgressionService.js
│   │   ├── BreakService.js
│   │   ├── ExportService.js
│   │   ├── FrameService.js
│   │   ├── ImportService.js
│   │   ├── MastersQualifierService.js
│   │   ├── MatchGeneratorService.js
│   │   ├── MatchService.js
│   │   ├── PlayerService.js
│   │   ├── PoolGeneratorService.js
│   │   ├── PoolStandingsService.js
│   │   ├── RankingService.js
│   │   ├── SeasonBreaksService.js
│   │   ├── SeasonService.js
│   │   ├── SeasonStandingsService.js
│   │   ├── ShootoutService.js
│   │   ├── TiebreakerService.js
│   │   ├── TournamentConfigService.js
│   │   ├── TournamentResultsService.js
│   │   └── TournamentService.js
│   ├── storage/         # localStorage adapter, import/export
│   │   ├── AzureBlobStorageAdapter.js
│   │   ├── LocalStorageAdapter.js
│   │   ├── StorageAdapter.js
│   │   └── StorageFactory.js
│   ├── store/           # Simple state management
│   │   ├── Store.js
│   │   ├── actions.js
│   │   └── initialState.js
│   ├── ui/
│   │   ├── Component.js
│   │   ├── LoadingStates.js
│   │   ├── router.js
│   │   ├── components/  # Reusable UI components
│   │   │   ├── BracketMatch.js
│   │   │   ├── BracketView.js
│   │   │   ├── BreakEntry.js
│   │   │   ├── ExportButton.js
│   │   │   ├── FrameScoreEntry.js
│   │   │   ├── ImportDialog.js
│   │   │   ├── MatchScoreCard.js
│   │   │   ├── PlayerSelector.js
│   │   │   └── ...
│   │   └── pages/       # Page-level components
│   │       ├── HomePage.js
│   │       ├── TournamentCreatePage.js
│   │       ├── TournamentViewPage.js
│   │       ├── MatchEntryPage.js
│   │       ├── SeasonsPage.js
│   │       ├── MastersPage.js
│   │       └── ...
│   └── utils/           # Helpers (uuid, validation, dateFormatter)
│       ├── accessibility.js
│       ├── dateFormatter.js
│       ├── performance.js
│       ├── uuid.js
│       └── validation.js
├── styles/
│   ├── variables.css    # Design tokens
│   ├── main.css         # Global styles and imports
│   ├── responsive.css   # Mobile-first breakpoints
│   ├── accessibility.css
│   ├── loading-states.css
│   └── components/      # Component-specific styles
│       ├── bracket.css
│       ├── match-entry.css
│       ├── pool-standings.css
│       ├── rankings.css
│       ├── tournament-form.css
│       └── ...
├── pages/               # Additional HTML pages
│   └── tournament-view.html
└── assets/              # Static assets

tests/
├── unit/                # Model and service unit tests
├── integration/         # Workflow tests (tournament creation → completion)
└── fixtures/            # Test data

public/                  # Static assets (copied to dist)
```

**Structure Decision**: Single SPA project structure optimized for vanilla JavaScript without framework. Services layer provides business logic separation from UI components. Storage abstraction allows localStorage with potential future Azure Blob integration.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| No framework | Vanilla JS | Per TC-006 constraint, simpler deployment |
| Storage abstraction | LocalStorageAdapter pattern | Enables future Azure Blob without code changes |
| Component pattern | Custom createElement helper | Lightweight, no virtual DOM overhead |

## Implementation Phases

### Phase 0: Research ✅

All unknowns resolved in [research.md](./research.md):
- Azure Blob Storage SDK for optional cloud persistence
- Vite configuration for vanilla JS
- Vitest testing strategy
- Round-robin tournament generation (circle method)
- Knockout bracket structure (binary tree)
- Tiebreaker algorithm (cascading with shootout)
- JSON data schema (normalized with ID references)
- UI/UX patterns for vanilla JS (component-based)

### Phase 1: Design ✅

All contracts and data models defined:
- [data-model.md](./data-model.md) - Entity definitions, relationships, validation rules
- [contracts/](./contracts/) - JSON schemas for all entities
- [quickstart.md](./quickstart.md) - Setup and development guide

### Phase 2: Implementation ✅

All 112 tasks completed in [tasks.md](./tasks.md):
- Phase 1 (Setup): T001-T009
- Phase 2 (Foundational): T010-T029
- Phase 3 (US1 - Tournament Setup): T030-T045
- Phase 4 (US2 - Match Score Entry): T046-T058
- Phase 5 (US3 - Pool Standings): T059-T068
- Phase 6 (US4 - Knockout Brackets): T069-T078
- Phase 7 (US5 - Rankings & Points): T079-T088
- Phase 8 (US6 - Season Standings): T089-T096
- Phase 9 (US7 - Masters Finale): T097-T105
- Phase 10 (Polish): T106-T112

## Key Technical Decisions

1. **localStorage over IndexedDB**: Simpler API, sufficient for data size, JSON-native
2. **Hash-based routing**: No server configuration needed for GitHub Pages
3. **Services pattern**: Business logic isolated from UI, testable
4. **Event-driven updates**: Store dispatches state changes, components re-render
5. **Mobile-first CSS**: Responsive from 320px, touch-friendly controls
