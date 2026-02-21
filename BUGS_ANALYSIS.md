# Basketball Manager - Bug Analysis

## Issues Identified

### 1. Multiplayer - Simming Week Problem
**Location**: `src/lib/gameEngine.ts` - `simulateWeek` function

**Issue**: The effective total weeks calculation for multiplayer may cause issues when players are in different divisions with different team counts.

```javascript
// Current logic
const playerTotalWeeks = 2 * (playerDivTeamCount - 1);
let effectiveTotalWeeks = playerTotalWeeks;
if (guestTeamId) {
  const guestTeam = state.teams.find(t => t.id === guestTeamId);
  if (guestTeam) {
    const guestDivCount = state.teams.filter(t => t.division === guestTeam.division).length;
    const guestTotalWeeks = 2 * (guestDivCount - 1);
    effectiveTotalWeeks = Math.max(playerTotalWeeks, guestTotalWeeks);
  }
}
```

**Problem**: 
- If one player is in A League (8 teams = 14 weeks) and another in B League (fewer teams), the season waits for the longer one
- However, the schedule generation might not handle this correctly
- The B League player might have finished their games but the game still waits

### 2. Offseason Crashers in Second Season
**Location**: `src/lib/gameEngine.ts` - `processOffseason` function

**Potential Issues**:

#### a) Player Aging and Contract Expiry
```javascript
let newContractYears = p.joinedThisOffseason ? p.contractYears : p.contractYears - 1;
```

**Problem**: The `joinedThisOffseason` flag might not be set correctly for all players, causing contracts to expire prematurely.

#### b) Missing Property Initialization
The code references `p.joinedThisOffseason` and `p.seasonsWithoutPlay` but these properties might not exist on all players in the initial state.

#### c) AI Team Roster Filling
```javascript
const playersNeeded = 10 - currentPlayers.length;
```

**Problem**: If a team has fewer than 10 players after offseason processing, new players are generated. However, if the player's team ends up with fewer than 5 players, it triggers game over immediately without giving the player a chance to sign new players.

#### d) Promotion/Relegation
```javascript
const relegatedId = rklSorted[rklSorted.length - 1].teamId;
const promotedId = lklSorted[0].teamId;
```

**Problem**: If one of these teams is the player's team, the division changes but the schedule for the new season is generated with the old division structure.

### 3. Firebase Multiplayer Sync Issues
**Location**: `src/hooks/useLobby.ts`

**Potential Issues**:

#### a) Phase Transition Timing
The host checks both ready flags and triggers simulation:
```javascript
if (myRole === "host" && data.status === "in_game" && data.hostReady && data.guestReady)
```

**Problem**: If both players set ready simultaneously during phase transitions, this could cause race conditions.

#### b) Offseason Finance Calculation
```javascript
const guestEndBalance = guestOld.balance + guestOld.ticketIncome + guestOld.sponsorIncome +
  guestOld.prizeIncome - guestOld.totalWages - guestOld.transferSpending;
```

**Problem**: This calculation might not account for all season-end adjustments properly.

## Recommendations

1. **Add null checks** for player properties (`joinedThisOffseason`, `seasonsWithoutPlay`)
2. **Fix phase transition logic** to handle different division team counts properly
3. **Add more defensive checks** in the offseason processing
4. **Ensure promotion/relegation updates division before schedule generation**
5. **Add logging** to track phase transitions and detect where crashes occur

## Files to Check
- [ ] `src/lib/types.ts` - Check type definitions for Player interface
- [ ] `src/lib/gameData.ts` - Check initial team setup
- [ ] `src/components/game/*.tsx` - Check UI components for error handling