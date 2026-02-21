# Phase Transition Issues in Multiplayer

## Problem Identified

### Phase Mismatch in Firebase vs Game Engine

In the `useLobby.ts` hook, when simulating a week, the phase is **forced to "regular"**:

```javascript
const stateForSim: GameState = {
  ...normalizeGameState(data.gameState),
  // Must be "regular" for simulateWeek to produce correct results
  phase: "regular",  // <-- FORCED
  selectedTeamId: data.hostTeamId,
  finances: data.hostFinances ?? data.gameState.finances,
};
```

However, `simulateWeek` in `gameEngine.ts` naturally transitions the phase:
- When regular season ends → phase becomes "playoffs" (for RKL) or "offseason" (for LKL)
- This phase transition is saved back to Firebase

### Race Condition Risk

When both players click "Ready" simultaneously:

1. Firebase listener fires with `data.gameState.phase = "regular"`
2. Host starts simulation, phase changes to "playoffs"/"offseason"
3. Simulation completes and pushes new state with new phase
4. Firebase listener fires again with new phase
5. If both ready flags are still true (they were cleared but might race), another simulation could trigger

### Potential Crash Scenarios

1. **Week 14 (last regular season week)**:
   - Phase transitions to "playoffs" or "offseason"
   - Firebase updates with new phase
   - If both players click ready again before unsetting ready flags, incorrect simulation runs

2. **Different divisions**:
   - If one player is in RKL (has playoffs) and another in LKL (no playoffs)
   - Phase transitions at different times
   - Could cause sync issues

## Recommended Fixes

### Fix 1: Clear Ready Flags Before Simulation (Already Done)
✅ Already implemented in current code - this is good:
```javascript
await update(lobbyRef, { hostReady: false, guestReady: false });
```

### Fix 2: Add Phase Validation
Check if the phase is still valid for the intended simulation:

```javascript
// In simulateWeekAndPush
if (data.gameState.phase !== "regular") {
  console.log('[simulateWeekAndPush] Phase is not regular, skipping:', data.gameState.phase);
  return;
}
```

### Fix 3: Add Simulation Lock
Use a transaction or additional flag to prevent concurrent simulations:

```javascript
// Add to lobby state
isSimulating: false

// Before simulating
await update(lobbyRef, { isSimulating: true, hostReady: false, guestReady: false });
try {
  // ... simulation logic
} finally {
  await update(lobbyRef, { isSimulating: false });
}
```

### Fix 4: Add Defensive Phase Check
After simulation, verify the phase transition is correct:

```javascript
// After simulateWeek
if (newState.phase !== "regular" && (data.gameState.phase === "regular")) {
  console.log('[simulateWeekAndPush] Phase transition detected:', 
    data.gameState.phase, '->', newState.phase);
}
```