# Feature Specification: Snooker Tournament Platform

**Feature Branch**: `001-tournament-platform`  
**Created**: 2025-11-27  
**Status**: Draft  
**Input**: User description: "Platform voor snookertornooien aanmaken, opvolgen tijdens het tornooi en eindklassement voorzien"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tournament Setup & Configuration (Priority: P1)

As a tournament organizer, I want to create a new tournament with configurable settings (number of players, pools, frames per match) so that I can set up our regular season tournaments with 32 players in 8 pools.

**Why this priority**: Without tournament creation, no other functionality can work. This is the foundation of the entire platform.

**Independent Test**: Can be fully tested by creating a tournament with custom settings and verifying all pools and initial matches are generated correctly.

**Acceptance Scenarios**:

1. **Given** I am on the tournament creation page, **When** I enter tournament name, date, and select 32 players with 8 pools of 4, **Then** the system creates the tournament with 8 pools, each containing 4 players with all pool matches scheduled
2. **Given** a tournament is being created, **When** I configure "1 frame per pool match" and "best of 3 for finals", **Then** the match format is saved correctly for each tournament phase
3. **Given** I want to create a Masters tournament, **When** I select "Masters format" with 16 players and 4 pools of 4, **Then** pool matches are configured for 2 frames each with specified knockout formats (best of 5/7)

---

### User Story 2 - Match Score Entry (Priority: P1)

As a tournament organizer, I want to enter match results including frame scores and high breaks (20+) so that standings are automatically calculated.

**Why this priority**: Core functionality - without score entry, no tournament progress can be tracked. Equal priority with tournament setup.

**Independent Test**: Can be tested by entering scores for a single match and verifying the result is stored and standings update.

**Acceptance Scenarios**:

1. **Given** a pool match is in progress, **When** I enter frame scores (e.g., Player A wins 1-0), **Then** the match result is recorded and pool standings update automatically
2. **Given** I am entering match results, **When** a player scores a break of 25, **Then** I can record this break associated with the player and the match
3. **Given** a best-of-3 match, **When** I enter that Player A wins frames 1 and 2, **Then** the match is marked as won by Player A (2-0) before needing frame 3

---

### User Story 3 - Pool Standings & Tiebreakers (Priority: P2)

As a tournament organizer, I want pool standings to be calculated automatically with proper tiebreaker rules so that I can determine who advances to each bracket.

**Why this priority**: Depends on match score entry being complete. Essential for tournament progression but secondary to basic score entry.

**Independent Test**: Can be tested by entering all pool match results and verifying correct ranking with tiebreakers applied.

**Acceptance Scenarios**:

1. **Given** all pool matches are completed, **When** two players have equal wins, **Then** the head-to-head result determines ranking
2. **Given** head-to-head is a tie (both won matches against each other), **When** comparing rankings, **Then** highest break (20+) determines ranking
3. **Given** a shootout is required, **When** I enter the shootout result, **Then** the final pool ranking reflects the shootout winner
4. **Given** Masters tournament format, **When** calculating tiebreakers, **Then** the system uses: head-to-head → matches won → highest break (different from regular tournaments)

---

### User Story 4 - Knockout Bracket Progression (Priority: P2)

As a tournament organizer, I want the knockout brackets to be generated and updated automatically as results come in so that players know their next opponents.

**Why this priority**: Required after pool stage completion. Depends on pool standings being finalized.

**Independent Test**: Can be tested by completing all pools and verifying correct bracket placement for top 2 (winner bracket) and bottom 2 (consolation bracket) from each pool.

**Acceptance Scenarios**:

1. **Given** all pool matches are complete, **When** pools are finalized, **Then** positions 1-2 from each pool enter the winner bracket (places 1-16) and positions 3-4 enter the consolation bracket (places 17-32)
2. **Given** a winner bracket match is completed, **When** the result is entered, **Then** the winner advances to next round (fighting for higher positions) and loser drops to fight for lower positions in that segment
3. **Given** Masters format quarter-finals, **When** pool stages complete, **Then** top 2 from each pool advance to quarter-finals (best of 5), then semi-finals and finals (best of 7)

---

### User Story 5 - Tournament Final Rankings & Points (Priority: P2)

As a tournament organizer, I want final rankings to be calculated with correct point allocation so that players receive their season points.

**Why this priority**: Required after knockout completion. The culmination of a single tournament.

**Independent Test**: Can be tested by completing an entire tournament and verifying each position gets correct points (position points + 10 participation points).

**Acceptance Scenarios**:

1. **Given** all knockout matches are complete, **When** final positions are determined, **Then** position 1 gets 32 points, position 2 gets 31 points, down to position 32 getting 1 point
2. **Given** any finishing position, **When** calculating total points, **Then** 10 participation points are added (winner gets 42 total, last place gets 11 total)
3. **Given** tournament is complete, **When** viewing results, **Then** I see a list of all breaks 20+ from that tournament sorted by break value descending

---

### User Story 6 - Masters Page: Season Standings (Priority: P3)

As a player or organizer, I want to see the cumulative season standings after each tournament so that I know who is qualifying for the Masters finale.

**Why this priority**: Aggregates data from multiple tournaments. Can only be fully tested after multiple tournaments exist.

**Independent Test**: Can be tested by completing two tournaments and verifying season points accumulate correctly per player.

**Acceptance Scenarios**:

1. **Given** multiple tournaments are complete, **When** I view the Masters page, **Then** I see cumulative points per player across all tournaments
2. **Given** the season standings, **When** 10 tournaments are complete, **Then** the top 16 players are highlighted as Masters qualifiers
3. **Given** the Masters page, **When** viewing break records, **Then** I see all breaks 25+ across all tournaments sorted by break value descending with player name and tournament date

---

### User Story 7 - Masters Finale Tournament (Priority: P3)

As a tournament organizer, I want to run the Masters finale with its specific format (16 players, different tiebreakers, different frame counts) so that the season champion is determined.

**Why this priority**: Final event of the season. Uses different rules than regular tournaments but same underlying system.

**Independent Test**: Can be tested by creating a Masters finale tournament and verifying distinct format rules apply.

**Acceptance Scenarios**:

1. **Given** I create a Masters finale, **When** configuring, **Then** I can set 16 players, 4 pools of 4, with 2 frames per pool match
2. **Given** Masters pool matches, **When** calculating tiebreakers, **Then** the order is: head-to-head → matches won → highest break
3. **Given** Masters knockout stages, **When** configured, **Then** quarter-finals are best of 5, semi-finals and finals are best of 7
4. **Given** player withdrawals, **When** setting up Masters, **Then** I can adjust the number of qualifiers (configurable from default 16)

---

### Edge Cases

- What happens when a player withdraws mid-tournament? *(Assumption: Remaining matches are forfeited, player placed last in their pool/bracket)*
- How does the system handle a shootout that isn't played? *(Assumption: Organizer can manually override rankings)*
- What happens when fewer than 32 players register? *(Bye placeholders are added to fill the 32-player bracket; matches against bye are automatic wins)*
- How are duplicate breaks handled in tiebreakers? *(Assumption: Only highest break per player counts for tiebreaker)*
- What happens when the Masters has fewer than 16 qualifiers available? *(Bye placeholders are added to fill remaining spots)*

## Requirements *(mandatory)*

### Functional Requirements

**Tournament Management**
- **FR-001**: System MUST allow creation of tournaments with configurable name, date, and format
- **FR-002**: System MUST support configurable number of players (default: 32)
- **FR-003**: System MUST support configurable number of pools (default: 8)
- **FR-004**: System MUST support configurable players per pool (default: 4)
- **FR-005**: System MUST support configurable frames per match (e.g., 1 frame, best of 3, best of 5, best of 7)
- **FR-006**: System MUST automatically generate pool assignments when tournament is created
- **FR-006a**: System MUST support random draw for pool assignments (default for regular tournaments)
- **FR-006b**: System MUST support manual seeding for pool assignments (used for Masters groups)
- **FR-007**: System MUST automatically generate all pool match pairings (round-robin within pool)
- **FR-007a**: System MUST add "bye" placeholders when fewer than 32 players register to maintain bracket structure
- **FR-007b**: System MUST auto-complete matches against bye as wins (opponent advances automatically, no breaks recorded)

**Match & Score Management**
- **FR-008**: System MUST allow entry of frame-by-frame scores for each match
- **FR-009**: System MUST automatically determine match winner based on frames won and format (e.g., first to 2 in best of 3)
- **FR-010**: System MUST allow recording of high breaks associated with a player and match
- **FR-010a**: System MUST support configurable minimum break threshold for recording (default: 20)
- **FR-010b**: System MUST support configurable minimum break threshold for Masters season statistics display (default: 25)
- **FR-011**: System MUST track which player made each break

**Pool Standings & Tiebreakers**
- **FR-012**: System MUST calculate pool standings based on matches won
- **FR-013**: System MUST apply tiebreaker 1: head-to-head result between tied players
- **FR-014**: System MUST apply tiebreaker 2: highest break (above configured threshold) when head-to-head is inconclusive
- **FR-015**: System MUST support shootout entry when other tiebreakers are inconclusive
- **FR-016**: System MUST support alternate tiebreaker order for Masters format (head-to-head → matches won → highest break)

**Knockout Brackets**
- **FR-017**: System MUST generate winner bracket (places 1-16) from pool positions 1-2
- **FR-018**: System MUST generate consolation bracket (places 17-32) from pool positions 3-4
- **FR-019**: System MUST implement "winners play for higher positions, losers for lower positions" bracket logic
- **FR-020**: System MUST support configurable frame format per knockout round

**Ranking & Points**
- **FR-021**: System MUST calculate final tournament positions (1-32)
- **FR-022**: System MUST award position points (32 for 1st, 31 for 2nd, ... 1 for 32nd)
- **FR-023**: System MUST add 10 participation points to all players
- **FR-024**: System MUST display tournament break list (above configured threshold) sorted by value descending

**Season & Masters**
- **FR-025**: System MUST aggregate points across tournaments for season standings
- **FR-026**: System MUST display cumulative season standings on Masters page
- **FR-027**: System MUST display all season breaks (above configured Masters threshold) sorted by value descending on Masters page
- **FR-028**: System MUST support Masters finale format with configurable qualifiers (default: 16)
- **FR-029**: System MUST highlight top 16 players as Masters qualifiers in season standings

**Data Management**
- **FR-030**: System MUST store all data as JSON
- **FR-031**: System MUST support exporting tournament/season data as downloadable JSON file
- **FR-032**: System MUST support importing tournament/season data from JSON file
- **FR-033**: System MUST validate imported JSON data before applying
- **FR-034**: System SHOULD support Azure Storage as primary data persistence (with local fallback)

### Key Entities

- **Season**: A collection of tournaments (typically 10) culminating in a Masters finale; tracks cumulative player points
- **Tournament**: A single competition event with pools, knockout rounds, and final rankings; has format settings (regular/Masters)
- **Player**: A participant with name; accumulates points across tournaments; can have multiple high breaks
- **Pool**: A group of players (typically 4) who play round-robin; determines seeding for knockout brackets
- **Match**: A contest between two players; has frame scores, winner, and associated breaks; belongs to pool or knockout round
- **Frame**: A single game within a match; has a winner
- **Break**: A scoring run of 20+ points; associated with a player and match; used for tiebreakers and statistics
- **Knockout Round**: A bracket stage (winner or consolation); determines final positions through win/loss progression

## Assumptions

- Pool assignments support both random draw (default for regular tournaments) and manual seeding (used for Masters groups)
- The system does not need user authentication for the initial version (single organizer use)
- Break minimum thresholds are configurable per tournament (default: 20 for recording, 25 for Masters season statistics)
- All players in a pool play each other exactly once (round-robin) in pool stage
- The winner/consolation bracket split (top 2 vs bottom 2 per pool) is fixed
- Tournament data persists indefinitely (no automatic cleanup)
- When fewer than 32 players register, "bye" placeholders are added to maintain the 32-player bracket structure; matches against a bye are automatic wins (1-0 frame score, no breaks recorded)

## Technical Constraints

- **TC-001**: Application MUST be built with Vite as the build tool
- **TC-002**: Application MUST use vanilla HTML, CSS, and JavaScript (minimal external libraries)
- **TC-003**: Data MUST be stored as JSON files (preferably in Azure Storage)
- **TC-004**: Application MUST support JSON data export functionality
- **TC-005**: Application MUST support JSON data import functionality
- **TC-006**: No heavy frameworks (React, Vue, Angular) - vanilla JS only

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tournament organizer can create and configure a complete 32-player tournament in under 5 minutes
- **SC-002**: Match result entry (including breaks) takes less than 30 seconds per match
- **SC-003**: Pool standings update within 2 seconds after entering a match result
- **SC-004**: System correctly applies all tiebreaker rules in proper sequence without manual intervention
- **SC-005**: Final rankings and points are calculated correctly for all 32 positions immediately after last match
- **SC-006**: Season standings on Masters page update immediately after each tournament is completed
- **SC-007**: All break statistics (above configured thresholds) are accurately tracked and displayed
- **SC-008**: Organizer can complete an entire tournament (setup through final rankings) using only the platform (no spreadsheets needed)
