# Data Model: Snooker Tournament Platform

**Feature**: `001-tournament-platform`  
**Date**: 2025-11-27  
**Status**: Complete

## Entity Overview

```
Season (1) ──────┬────── (*) Tournament
                 │
Tournament (1) ──┼────── (*) Pool
                 │
                 ├────── (*) Match
                 │
                 ├────── (*) KnockoutRound
                 │
                 └────── (*) TournamentPlayer (join)

Player (1) ──────┬────── (*) TournamentPlayer
                 │
                 └────── (*) Break

Match (1) ───────┬────── (*) Frame
                 │
                 └────── (*) Break
```

## Entities

### Season

A collection of tournaments culminating in a Masters finale.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| name | string | Season name (e.g., "2024-2025") |
| year | number | Starting year |
| tournamentIds | string[] | References to tournaments |
| settings | SeasonSettings | Configuration |
| createdAt | ISO timestamp | Creation date |
| updatedAt | ISO timestamp | Last modification |

**SeasonSettings**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| breakThreshold | number | 20 | Minimum break to record |
| mastersBreakThreshold | number | 25 | Minimum break for Masters stats |
| mastersQualifiers | number | 16 | Top N qualify for Masters |
| participationPoints | number | 10 | Points for participation |

### Tournament

A single competition event.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| seasonId | string | Reference to season |
| name | string | Tournament name (e.g., "Tournament 1") |
| date | ISO date | Tournament date |
| format | TournamentFormat | "regular" or "masters" |
| status | TournamentStatus | "draft", "pools", "knockout", "complete" |
| config | TournamentConfig | Configuration |
| playerIds | string[] | Participating players (including byes) |
| pools | Pool[] | Pool definitions |
| brackets | Brackets | Knockout bracket structure |
| rankings | Ranking[] | Final positions (when complete) |
| createdAt | ISO timestamp | Creation date |
| updatedAt | ISO timestamp | Last modification |

**TournamentConfig**:
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| playerCount | number | 32 | Total players (including byes) |
| poolCount | number | 8 | Number of pools |
| playersPerPool | number | 4 | Players in each pool |
| poolFrames | number | 1 | Frames per pool match |
| knockoutFormats | KnockoutFormats | {...} | Frames per knockout round |
| drawType | DrawType | "random" | "random" or "seeded" |
| tiebreakers | Tiebreaker[] | [...] | Ordered tiebreaker rules |

**KnockoutFormats** (regular tournament):
| Round | Default Frames | Description |
|-------|----------------|-------------|
| round16 | 1 | First knockout round |
| quarterFinal | 1 | Quarter-finals |
| semiFinal | 3 | Best of 3 |
| final | 3 | Best of 3 |

**KnockoutFormats** (Masters):
| Round | Default Frames | Description |
|-------|----------------|-------------|
| quarterFinal | 5 | Best of 5 |
| semiFinal | 7 | Best of 7 |
| final | 7 | Best of 7 |

**Tiebreaker** (enum):
- `head-to-head` - Direct match result
- `matches-won` - Total matches won
- `highest-break` - Highest recorded break
- `shootout` - Manual shootout result

### Player

A tournament participant.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| name | string | Player display name |
| isBye | boolean | True if placeholder bye |
| createdAt | ISO timestamp | Creation date |

### Pool

A group of players for round-robin phase.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| name | string | Pool name (e.g., "Pool A") |
| tournamentId | string | Reference to tournament |
| playerIds | string[] | Players in this pool (ordered) |
| matchIds | string[] | All pool matches |
| standings | PoolStanding[] | Calculated standings |
| isFinalized | boolean | True when standings confirmed |

**PoolStanding**:
| Field | Type | Description |
|-------|------|-------------|
| position | number | 1-4 (position in pool) |
| playerId | string | Player reference |
| played | number | Matches played |
| won | number | Matches won |
| lost | number | Matches lost |
| framesFor | number | Frames won |
| framesAgainst | number | Frames lost |
| highestBreak | number | Highest break in pool |
| shootoutPosition | number? | Manual override (if needed) |

### Match

A contest between two players.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| tournamentId | string | Reference to tournament |
| poolId | string? | Pool reference (if pool match) |
| roundId | string? | Knockout round reference (if knockout) |
| stage | MatchStage | "pool", "winner-bracket", "consolation-bracket" |
| roundNumber | number | Round within stage |
| player1Id | string | First player |
| player2Id | string | Second player |
| frames | Frame[] | Frame results |
| winnerId | string? | Winner (null if incomplete) |
| status | MatchStatus | "pending", "in-progress", "complete" |
| bestOf | number | Frames to win (e.g., 3 for best of 5) |
| isByeMatch | boolean | True if one player is bye |
| nextMatchId | string? | Winner advances to (knockout) |
| loserMatchId | string? | Loser goes to (knockout) |
| createdAt | ISO timestamp | Creation date |
| updatedAt | ISO timestamp | Last modification |

### Frame

A single game within a match.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| matchId | string | Reference to match |
| frameNumber | number | 1-indexed frame number |
| winnerId | string | Frame winner |

### Break

A high scoring run.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| tournamentId | string | Reference to tournament |
| matchId | string | Reference to match |
| playerId | string | Player who made break |
| value | number | Break value (≥ threshold) |
| frameNumber | number? | Frame in which break occurred |
| createdAt | ISO timestamp | When recorded |

### KnockoutRound

A round in the knockout stage.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique identifier |
| tournamentId | string | Reference to tournament |
| bracket | BracketType | "winner" or "consolation" |
| roundNumber | number | Round within bracket |
| name | string | Display name (e.g., "Quarter-Finals") |
| positionRange | [number, number] | Positions being determined |
| matchIds | string[] | Matches in this round |
| bestOf | number | Frames to win |

**BracketType** (enum):
- `winner` - Places 1-16
- `consolation` - Places 17-32

### Ranking

Final tournament position and points.

| Field | Type | Description |
|-------|------|-------------|
| position | number | Final position (1-32) |
| playerId | string | Player reference |
| positionPoints | number | Points from position (32 down to 1) |
| participationPoints | number | Bonus points (default: 10) |
| totalPoints | number | Sum of all points |

## State Transitions

### Tournament Status

```
draft → pools → knockout → complete
  │       │        │
  └───────┴────────┴─── (can revert for corrections)
```

### Match Status

```
pending → in-progress → complete
            │
            └─── (can revert if correction needed)
```

## Validation Rules

### Tournament Creation
- `playerCount` must equal `poolCount × playersPerPool`
- `poolCount` must be power of 2 (2, 4, 8, 16)
- `playersPerPool` minimum 3, maximum 8
- Player count cannot exceed registered players + byes

### Match Completion
- All frames must have winner before match complete
- Winner determined by first to `(bestOf + 1) / 2` frames
- Bye matches auto-complete with 1-0 score

### Pool Finalization
- All pool matches must be complete
- Standings calculated with tiebreakers applied
- Shootout results entered if required

### Knockout Progression
- Pool standings finalized before knockout generation
- Each match winner/loser progresses to specified next match
- All positions (1-32) determined when final matches complete

## Indexes & Queries

### Primary Queries
1. **Get tournament by ID**: Direct lookup
2. **Get season standings**: Aggregate rankings across tournaments
3. **Get pool standings**: Calculate from matches in pool
4. **Get bracket matches**: Filter matches by stage and round
5. **Get breaks by tournament**: Filter breaks ≥ threshold
6. **Get season breaks**: Aggregate breaks ≥ masters threshold

### Derived Data (Calculated)
- Pool standings: From matches + breaks + shootout
- Season standings: Sum of tournament rankings per player
- Masters qualifiers: Top N from season standings
