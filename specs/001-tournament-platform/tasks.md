# Tasks: Snooker Tournament Platform

**Input**: Design documents from `/specs/001-tournament-platform/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested in the feature specification. Omitting test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Vite vanilla JS project with `npm create vite@latest . -- --template vanilla`
- [ ] T002 [P] Install dev dependencies: vitest, @vitest/coverage-v8, jsdom, eslint, prettier
- [ ] T003 [P] Install runtime dependencies: @azure/storage-blob
- [ ] T004 Create project directory structure per plan.md (src/js/{models,services,storage,ui,utils}, src/styles/, src/pages/, tests/)
- [ ] T005 [P] Configure vite.config.js with ES2022 target and Vitest settings
- [ ] T006 [P] Configure ESLint and Prettier for code quality
- [ ] T007 [P] Create .env.example with Azure Storage variables
- [ ] T008 [P] Create src/styles/variables.css with design tokens (colors, spacing, typography)
- [ ] T009 [P] Create src/styles/main.css with global styles and CSS reset

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Data Models (Core Entities)

- [ ] T010 [P] Create Player model in src/js/models/Player.js (id, name, isBye, createdAt)
- [ ] T011 [P] Create Frame model in src/js/models/Frame.js (id, matchId, frameNumber, winnerId)
- [ ] T012 [P] Create Break model in src/js/models/Break.js (id, tournamentId, matchId, playerId, value, frameNumber, createdAt)
- [ ] T013 [P] Create Season model in src/js/models/Season.js (id, name, year, tournamentIds, settings, createdAt, updatedAt)
- [ ] T014 Create Match model in src/js/models/Match.js (id, tournamentId, poolId, roundId, stage, players, frames, winnerId, status, bestOf, isByeMatch, nextMatchId, loserMatchId)
- [ ] T015 Create Pool model in src/js/models/Pool.js (id, name, tournamentId, playerIds, matchIds, standings, isFinalized)
- [ ] T016 Create KnockoutRound model in src/js/models/KnockoutRound.js (id, tournamentId, bracket, roundNumber, name, positionRange, matchIds, bestOf)
- [ ] T017 Create Ranking model in src/js/models/Ranking.js (position, playerId, positionPoints, participationPoints, totalPoints)
- [ ] T018 Create Tournament model in src/js/models/Tournament.js (id, seasonId, name, date, format, status, config, playerIds, pools, brackets, rankings)
- [ ] T019 Create model index file in src/js/models/index.js exporting all models

### Storage Abstraction

- [ ] T020 [P] Create StorageAdapter interface in src/js/storage/StorageAdapter.js (save, load, delete, list)
- [ ] T021 [P] Implement LocalStorageAdapter in src/js/storage/LocalStorageAdapter.js
- [ ] T022 Implement AzureBlobStorageAdapter in src/js/storage/AzureBlobStorageAdapter.js using @azure/storage-blob SDK
- [ ] T023 Create StorageFactory in src/js/storage/StorageFactory.js (returns Azure adapter if configured, localStorage fallback)
- [ ] T024 Create storage index file in src/js/storage/index.js exporting all storage modules

### State Management

- [ ] T025 Create application store in src/js/store/Store.js (state, subscribe, dispatch pattern)
- [ ] T026 Define initial state shape in src/js/store/initialState.js (currentSeason, currentTournament, players, ui)
- [ ] T027 Create store actions in src/js/store/actions.js (SET_SEASON, SET_TOURNAMENT, UPDATE_MATCH, etc.)
- [ ] T028 Create store index file in src/js/store/index.js exporting store singleton

### Utilities

- [ ] T029 [P] Create UUID generator utility in src/js/utils/uuid.js
- [ ] T030 [P] Create date formatter utility in src/js/utils/dateFormatter.js
- [ ] T031 [P] Create JSON validation utility in src/js/utils/validation.js (validates against schemas in contracts/)
- [ ] T032 Create utility index file in src/js/utils/index.js exporting all utilities

### Base UI Infrastructure

- [ ] T033 Create router in src/js/ui/router.js (hash-based SPA routing)
- [ ] T034 [P] Create base component pattern in src/js/ui/Component.js (render function pattern)
- [ ] T035 Create main app shell in src/js/main.js (initializes store, router, renders app)
- [ ] T036 Update src/index.html with app shell structure (nav, main content area, footer)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Tournament Setup & Configuration (Priority: P1) 🎯 MVP

**Goal**: Create tournaments with configurable settings (players, pools, frames per match)

**Independent Test**: Create a tournament with 32 players/8 pools, verify all pools and initial round-robin matches are generated correctly

### Services for User Story 1

- [ ] T037 [US1] Implement PlayerService in src/js/services/PlayerService.js (create, getById, getAll, createByePlayers)
- [ ] T038 [US1] Implement TournamentConfigService in src/js/services/TournamentConfigService.js (validate config, create default configs for regular/Masters formats)
- [ ] T039 [US1] Implement PoolGeneratorService in src/js/services/PoolGeneratorService.js (random draw and seeded assignment using circle method for round-robin)
- [ ] T040 [US1] Implement MatchGeneratorService in src/js/services/MatchGeneratorService.js (generate all pool matches from pools)
- [ ] T041 [US1] Implement TournamentService in src/js/services/TournamentService.js (create tournament, add players, generate pools and matches, save to storage)

### UI Components for User Story 1

- [ ] T042 [P] [US1] Create PlayerSelector component in src/js/ui/components/PlayerSelector.js (multi-select player list with add new)
- [ ] T043 [P] [US1] Create TournamentConfigForm component in src/js/ui/components/TournamentConfigForm.js (name, date, format, player count, pool count, frames settings)
- [ ] T044 [US1] Create TournamentCreatePage in src/js/ui/pages/TournamentCreatePage.js (combines PlayerSelector and TournamentConfigForm)
- [ ] T045 [US1] Create src/pages/tournament-create.html template
- [ ] T046 [US1] Create src/styles/components/tournament-form.css for form styling
- [ ] T047 [US1] Wire up tournament creation route in router and navigation

**Checkpoint**: User Story 1 complete - tournament creation with pools and matches working

---

## Phase 4: User Story 2 - Match Score Entry (Priority: P1)

**Goal**: Enter match results including frame scores and high breaks

**Independent Test**: Enter scores for a single match, verify result is stored and available for standings calculation

### Services for User Story 2

- [ ] T048 [US2] Implement FrameService in src/js/services/FrameService.js (create frame, determine frame winner)
- [ ] T049 [US2] Implement BreakService in src/js/services/BreakService.js (record break, validate threshold, get breaks by match/player/tournament)
- [ ] T050 [US2] Implement MatchService in src/js/services/MatchService.js (update match, add frame result, determine match winner, handle bye auto-complete)

### UI Components for User Story 2

- [ ] T051 [P] [US2] Create FrameScoreEntry component in src/js/ui/components/FrameScoreEntry.js (enter winner for each frame)
- [ ] T052 [P] [US2] Create BreakEntry component in src/js/ui/components/BreakEntry.js (add break value with player selection)
- [ ] T053 [US2] Create MatchScoreCard component in src/js/ui/components/MatchScoreCard.js (displays match, frames, allows score entry)
- [ ] T054 [US2] Create MatchEntryPage in src/js/ui/pages/MatchEntryPage.js (select match, enter scores)
- [ ] T055 [US2] Create src/pages/match-entry.html template
- [ ] T056 [US2] Create src/styles/components/match-entry.css for score entry styling
- [ ] T057 [US2] Wire up match entry route in router and navigation

**Checkpoint**: User Story 2 complete - match score entry working independently

---

## Phase 5: User Story 3 - Pool Standings & Tiebreakers (Priority: P2)

**Goal**: Automatically calculate pool standings with proper tiebreaker rules

**Independent Test**: Enter all pool match results, verify correct ranking with tiebreakers (head-to-head, highest break, shootout)

### Services for User Story 3

- [ ] T058 [US3] Implement TiebreakerService in src/js/services/TiebreakerService.js (head-to-head, matches-won, highest-break comparisons)
- [ ] T059 [US3] Implement PoolStandingsService in src/js/services/PoolStandingsService.js (calculate standings, apply tiebreakers in correct order, handle shootout override)
- [ ] T060 [US3] Implement ShootoutService in src/js/services/ShootoutService.js (record shootout result, update pool standings)

### UI Components for User Story 3

- [ ] T061 [P] [US3] Create PoolStandingsTable component in src/js/ui/components/PoolStandingsTable.js (display position, player, W/L, frames, highest break)
- [ ] T062 [P] [US3] Create ShootoutEntry component in src/js/ui/components/ShootoutEntry.js (enter shootout winner when tiebreaker required)
- [ ] T063 [US3] Create PoolMatchList component in src/js/ui/components/PoolMatchList.js (list all matches in pool with scores)
- [ ] T064 [US3] Create PoolViewPage in src/js/ui/pages/PoolViewPage.js (shows standings table and match list for a pool)
- [ ] T065 [US3] Create src/styles/components/pool-standings.css for standings table styling
- [ ] T066 [US3] Wire up pool view route in router

**Checkpoint**: User Story 3 complete - pool standings with tiebreakers working

---

## Phase 6: User Story 4 - Knockout Bracket Progression (Priority: P2)

**Goal**: Generate and update knockout brackets automatically as results come in

**Independent Test**: Complete all pools, verify correct bracket placement (top 2 to winner bracket, bottom 2 to consolation)

### Services for User Story 4

- [ ] T067 [US4] Implement BracketGeneratorService in src/js/services/BracketGeneratorService.js (generate winner/consolation brackets from pool standings using binary tree structure)
- [ ] T068 [US4] Implement BracketProgressionService in src/js/services/BracketProgressionService.js (advance winners, route losers to lower position matches)
- [ ] T069 [US4] Extend MatchService to handle knockout match progression (update nextMatchId, loserMatchId logic)

### UI Components for User Story 4

- [ ] T070 [P] [US4] Create BracketMatch component in src/js/ui/components/BracketMatch.js (single match box in bracket view)
- [ ] T071 [US4] Create BracketView component in src/js/ui/components/BracketView.js (full bracket visualization with rounds)
- [ ] T072 [US4] Create KnockoutPage in src/js/ui/pages/KnockoutPage.js (shows winner and consolation brackets with match entry)
- [ ] T073 [US4] Create src/styles/components/bracket.css for bracket visualization styling
- [ ] T074 [US4] Wire up knockout bracket route in router

**Checkpoint**: User Story 4 complete - knockout brackets generating and progressing correctly

---

## Phase 7: User Story 5 - Tournament Final Rankings & Points (Priority: P2)

**Goal**: Calculate final rankings with correct point allocation

**Independent Test**: Complete entire tournament, verify each position gets correct points (position points + 10 participation)

### Services for User Story 5

- [ ] T075 [US5] Implement RankingService in src/js/services/RankingService.js (calculate position from bracket results, calculate points: 33-position + 10)
- [ ] T076 [US5] Implement TournamentResultsService in src/js/services/TournamentResultsService.js (compile final rankings, aggregate breaks, finalize tournament)

### UI Components for User Story 5

- [ ] T077 [P] [US5] Create RankingsTable component in src/js/ui/components/RankingsTable.js (display position, player, position points, participation points, total)
- [ ] T078 [P] [US5] Create TournamentBreaksList component in src/js/ui/components/TournamentBreaksList.js (all breaks above threshold sorted descending)
- [ ] T079 [US5] Create TournamentResultsPage in src/js/ui/pages/TournamentResultsPage.js (final rankings and breaks list)
- [ ] T080 [US5] Create src/styles/components/rankings.css for rankings table styling
- [ ] T081 [US5] Wire up tournament results route in router

**Checkpoint**: User Story 5 complete - tournament finalization with points working

---

## Phase 8: User Story 6 - Masters Page: Season Standings (Priority: P3)

**Goal**: Display cumulative season standings and Masters qualifiers

**Independent Test**: Complete two tournaments, verify season points accumulate correctly per player

### Services for User Story 6

- [ ] T082 [US6] Implement SeasonService in src/js/services/SeasonService.js (create season, add tournament, get all tournaments in season)
- [ ] T083 [US6] Implement SeasonStandingsService in src/js/services/SeasonStandingsService.js (aggregate points across tournaments, rank players, identify top 16 qualifiers)
- [ ] T084 [US6] Implement SeasonBreaksService in src/js/services/SeasonBreaksService.js (aggregate all breaks above Masters threshold across tournaments)

### UI Components for User Story 6

- [ ] T085 [P] [US6] Create SeasonStandingsTable component in src/js/ui/components/SeasonStandingsTable.js (cumulative points, highlight top 16)
- [ ] T086 [P] [US6] Create SeasonBreaksList component in src/js/ui/components/SeasonBreaksList.js (breaks 25+ with player and tournament)
- [ ] T087 [US6] Create MastersPage in src/js/ui/pages/MastersPage.js (season standings and season breaks)
- [ ] T088 [US6] Create src/pages/masters.html template
- [ ] T089 [US6] Create src/styles/components/masters.css for Masters page styling
- [ ] T090 [US6] Wire up Masters page route in router and navigation

**Checkpoint**: User Story 6 complete - season standings and Masters qualifiers displaying

---

## Phase 9: User Story 7 - Masters Finale Tournament (Priority: P3)

**Goal**: Run Masters finale with specific format (16 players, different tiebreakers, different frames)

**Independent Test**: Create Masters finale tournament, verify distinct format rules apply (2 frames pool, best of 5/7 knockout, different tiebreaker order)

### Services for User Story 7

- [ ] T091 [US7] Extend TournamentConfigService to include Masters-specific defaults (16 players, 4 pools, 2 frames, QF best of 5, SF/F best of 7)
- [ ] T092 [US7] Extend TiebreakerService to support Masters tiebreaker order (head-to-head → matches-won → highest-break)
- [ ] T093 [US7] Implement MastersQualifierService in src/js/services/MastersQualifierService.js (get top 16 from season, handle withdrawals with byes)

### UI Components for User Story 7

- [ ] T094 [US7] Create MastersSetupPage in src/js/ui/pages/MastersSetupPage.js (select qualifiers, handle adjustments/withdrawals)
- [ ] T095 [US7] Extend TournamentConfigForm to show Masters-specific options when format is "masters"
- [ ] T096 [US7] Create src/styles/components/masters-setup.css for Masters setup page styling

**Checkpoint**: User Story 7 complete - Masters finale with distinct rules working

---

## Phase 10: User Story - Data Management (Cross-Cutting)

**Goal**: Export and import JSON data for backup and portability (FR-030 to FR-034)

**Independent Test**: Export tournament data, import into fresh app, verify all data restored correctly

### Services for Data Management

- [ ] T097 Implement ExportService in src/js/services/ExportService.js (export season/tournament as downloadable JSON file)
- [ ] T098 Implement ImportService in src/js/services/ImportService.js (import JSON file, validate against schemas, merge into state)

### UI Components for Data Management

- [ ] T099 [P] Create ExportButton component in src/js/ui/components/ExportButton.js (download JSON file)
- [ ] T100 [P] Create ImportDialog component in src/js/ui/components/ImportDialog.js (file picker, validation feedback, import action)
- [ ] T101 Create DataManagementPage in src/js/ui/pages/DataManagementPage.js (export/import options)
- [ ] T102 Wire up data management in settings/menu

**Checkpoint**: Data Management complete - export/import functionality working

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T103 [P] Create TournamentViewPage in src/js/ui/pages/TournamentViewPage.js (overview: pools, brackets, current status)
- [ ] T104 [P] Create src/pages/tournament-view.html template
- [ ] T105 [P] Create HomePage in src/js/ui/pages/HomePage.js (season overview, quick links to active tournament)
- [ ] T106 Add responsive styling for mobile devices (320px-2560px) across all components
- [ ] T107 Add WCAG 2.1 AA accessibility: focus states, ARIA labels, keyboard navigation
- [ ] T108 Add loading states and error handling UI across all pages
- [ ] T109 [P] Performance optimization: lazy load pages, minimize reflows
- [ ] T110 [P] Add service index file in src/js/services/index.js exporting all services
- [ ] T111 [P] Create comprehensive README.md with setup and usage instructions
- [ ] T112 Run quickstart.md validation to ensure all setup steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────► Phase 2: Foundational ──────────────┐
                                          │                        │
                                          ▼                        │
                              ┌───────────────────────┐            │
                              │   ALL USER STORIES    │◄───────────┘
                              │   CAN START AFTER     │
                              │   FOUNDATIONAL        │
                              └───────────────────────┘
                                          │
           ┌──────────────────────────────┼──────────────────────────────┐
           │                              │                              │
           ▼                              ▼                              ▼
    Phase 3: US1 (P1)            Phase 4: US2 (P1)            [Other Stories]
    Tournament Setup              Match Score Entry
           │                              │
           └──────────────────────────────┤
                                          ▼
                              Phase 5: US3 (P2)
                              Pool Standings
                                          │
                                          ▼
                              Phase 6: US4 (P2)
                              Knockout Brackets
                                          │
                                          ▼
                              Phase 7: US5 (P2)
                              Final Rankings
                                          │
                                          ▼
                              Phase 8: US6 (P3)
                              Season Standings
                                          │
                                          ▼
                              Phase 9: US7 (P3)
                              Masters Finale
                                          │
                                          ▼
                              Phase 10: Data Mgmt
                                          │
                                          ▼
                              Phase 11: Polish
```

### User Story Dependencies

| Story | Can Start After | Integrates With |
|-------|-----------------|-----------------|
| US1 (Tournament Setup) | Phase 2 (Foundational) | None - independent |
| US2 (Match Score Entry) | Phase 2 (Foundational) | US1 (needs tournament) |
| US3 (Pool Standings) | US2 (needs match results) | US1, US2 |
| US4 (Knockout Brackets) | US3 (needs pool standings) | US1, US2, US3 |
| US5 (Final Rankings) | US4 (needs knockout results) | US1-US4 |
| US6 (Season Standings) | US5 (needs tournament rankings) | US1-US5 |
| US7 (Masters Finale) | US6 (needs season standings) | All previous |
| Data Management | Phase 2 (Foundational) | All stories (cross-cutting) |

### Within Each User Story

- Services before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T002, T003, T005, T006, T007, T008, T009 can run in parallel after T001

**Phase 2 (Foundational)**:
- Models T010-T013 can run in parallel
- Storage T020-T021 can run in parallel
- Utilities T029-T031 can run in parallel

**Per User Story**: Tasks marked [P] within each phase can run in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# After T009 (Setup complete), launch all independent models in parallel:
T010: Create Player model in src/js/models/Player.js
T011: Create Frame model in src/js/models/Frame.js
T012: Create Break model in src/js/models/Break.js
T013: Create Season model in src/js/models/Season.js

# Then dependent models (reference other models):
T014-T019: Sequential model creation

# Storage adapters in parallel:
T020: Create StorageAdapter interface
T021: Implement LocalStorageAdapter
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Tournament Setup)
4. Complete Phase 4: User Story 2 (Match Score Entry)
5. **STOP and VALIDATE**: Test tournament creation and score entry
6. Deploy/demo if ready - can track a basic tournament manually

### Incremental Delivery

| Milestone | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US2 | Create tournament, enter scores |
| v0.2 | + US3 + US4 | Auto standings, brackets |
| v0.3 | + US5 | Full tournament with points |
| v0.4 | + US6 | Season tracking, Masters page |
| v1.0 | + US7 + Data Mgmt + Polish | Complete platform |

### Suggested MVP Scope

**User Story 1** (Tournament Setup) and **User Story 2** (Match Score Entry) together provide the minimum viable tournament management capability.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable after its dependencies
- Constitution requirements: ≥80% test coverage (add tests in Polish phase if needed), WCAG 2.1 AA, <2s page load, <500ms updates
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
