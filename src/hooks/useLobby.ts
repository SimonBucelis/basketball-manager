import { useState, useEffect, useRef, useCallback } from "react";
import { ref, set, get, onValue, update, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { LobbyFirebaseData, LobbyStatus, MultiplayerLobbyState } from "@/lib/multiplayerTypes";
import { GameState, FinanceRecord, CoachType } from "@/lib/types";
import { initializeGame, simulateWeek, simulateAllPlayoffs, processOffseason, calculateInitialFinances } from "@/lib/gameEngine";
import { TEAMS_DATA } from "@/lib/gameData";

/**
 * Firebase does NOT store empty arrays — it converts [] to null (or omits the field).
 * This function normalises a GameState read from Firebase so that all array/object
 * fields are safe to use without null-checks throughout the UI.
 */
function normalizeGameState(gs: GameState): GameState {
  return {
    ...gs,
    schedule: gs.schedule ?? [],
    declinedPlayerIds: gs.declinedPlayerIds ?? [],
    playoffBracket: gs.playoffBracket ?? [],
    gameOver: gs.gameOver ?? false,
    youthIntakeUsed: gs.youthIntakeUsed ?? false,
    youthIntakeUsedGuest: gs.youthIntakeUsedGuest ?? false,
    consecutiveNegativeSeasons: gs.consecutiveNegativeSeasons ?? 0,
    week: gs.week ?? 0,
    // Multiplayer never uses preseason — if somehow preseason slips in, treat as regular
    phase: (gs.phase === "preseason" ? "regular" : gs.phase) ?? "regular",
    teams: (gs.teams ?? []).map(team => ({
      ...team,
      players: team.players ?? [],
    })),
    standings: {
      rkl: (gs.standings?.rkl ?? []),
      lkl: (gs.standings?.lkl ?? []),
    },
    finances: {
      ticketIncome: gs.finances?.ticketIncome ?? 0,
      sponsorIncome: gs.finances?.sponsorIncome ?? 0,
      prizeIncome: gs.finances?.prizeIncome ?? 0,
      totalWages: gs.finances?.totalWages ?? 0,
      transferSpending: gs.finances?.transferSpending ?? 0,
      balance: gs.finances?.balance ?? 0,
    },
  };
}

function generateLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface UseLobbyReturn {
  lobbyState: MultiplayerLobbyState | null;
  gameState: GameState | null;
  myFinances: FinanceRecord | null;
  opponentFinances: FinanceRecord | null;
  isCreatingOrJoining: boolean;
  error: string | null;

  createLobby: (teamId: string, coachType?: CoachType, coachName?: string) => Promise<string>;
  joinLobby: (code: string, teamId: string, coachType?: CoachType, coachName?: string) => Promise<boolean>;
  startGame: () => Promise<void>;
  setReady: () => Promise<void>;
  cancelReady: () => Promise<void>;
  updateMyTeam: (newGameState: GameState, newFinances: FinanceRecord) => Promise<void>;
  leaveLobby: () => void;
}

export function useLobby(): UseLobbyReturn {
  const [lobbyState, setLobbyState] = useState<MultiplayerLobbyState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myFinances, setMyFinances] = useState<FinanceRecord | null>(null);
  const [opponentFinances, setOpponentFinances] = useState<FinanceRecord | null>(null);
  const [isCreatingOrJoining, setIsCreatingOrJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lobbyCodeRef = useRef<string | null>(null);
  const myRoleRef = useRef<"host" | "guest" | null>(null);
  const myTeamIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  // Guard: prevent multiple concurrent week simulations
  const isSimulatingRef = useRef(false);

  const subscribeToLobby = useCallback((code: string, role: "host" | "guest", teamId: string) => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const lobbyRef = ref(db, `lobbies/${code}`);

    const unsub = onValue(lobbyRef, (snapshot) => {
      const data: LobbyFirebaseData | null = snapshot.val();
      if (!data) return;

      const myRole = myRoleRef.current ?? role;
      const myTeamId = myTeamIdRef.current ?? teamId;
      const opponentTeamId = myRole === "host" ? data.guestTeamId : data.hostTeamId;

      setLobbyState({
        lobbyCode: code,
        myRole,
        myTeamId,
        opponentTeamId,
        myReady: myRole === "host" ? data.hostReady : data.guestReady,
        opponentReady: myRole === "host" ? data.guestReady : data.hostReady,
        status: data.status,
      });

      if (data.gameState) {
        // CRITICAL: normalise before use — Firebase drops empty arrays ([] → null)
        const localState: GameState = {
          ...normalizeGameState(data.gameState),
          selectedTeamId: myTeamId,
        };
        setGameState(localState);
      }

      // CRITICAL FIX: Only update finances if data is present — never set to null mid-game
      // so we don't accidentally unmount the game UI
      // Also log for debugging black screen issues
      console.log('[useLobby] Firebase data received:', {
        status: data.status,
        hasGameState: !!data.gameState,
        myRole,
        hasHostFinances: !!data.hostFinances,
        hasGuestFinances: !!data.guestFinances,
      });

      if (myRole === "host") {
        if (data.hostFinances) {
          console.log('[useLobby] Setting host finances');
          setMyFinances(data.hostFinances);
        }
        if (data.guestFinances) {
          console.log('[useLobby] Setting guest finances (opponent)');
          setOpponentFinances(data.guestFinances);
        }
      } else {
        if (data.guestFinances) {
          console.log('[useLobby] Setting guest finances (my)');
          setMyFinances(data.guestFinances);
        }
        if (data.hostFinances) {
          console.log('[useLobby] Setting host finances (opponent)');
          setOpponentFinances(data.hostFinances);
        }
      }

      // Host only: when both ready, dispatch based on current phase
      if (
        myRole === "host" &&
        data.status === "in_game" &&
        data.hostReady &&
        data.guestReady &&
        data.gameState &&
        !isSimulatingRef.current
      ) {
        isSimulatingRef.current = true;
        const phase = data.gameState.phase;
        let pushFn: Promise<void>;
        if (phase === "regular") {
          pushFn = simulateWeekAndPush(code, data);
        } else if (phase === "playoffs") {
          pushFn = simulateAllPlayoffsAndPush(code, data);
        } else if (phase === "offseason") {
          pushFn = startNewSeasonAndPush(code, data);
        } else {
          pushFn = Promise.resolve();
        }
        pushFn.finally(() => {
          isSimulatingRef.current = false;
        });
      }
    });

    unsubscribeRef.current = () => off(lobbyRef);
    return unsub;
  }, []);

  async function simulateWeekAndPush(code: string, data: LobbyFirebaseData) {
    if (!data.gameState || !data.hostTeamId || !data.guestTeamId) return;

    const lobbyRef = ref(db, `lobbies/${code}`);

    // First, clear ready flags so no second simulation can be triggered
    // while we're computing (in case Firebase fires listener again)
    await update(lobbyRef, { hostReady: false, guestReady: false });

    const stateForSim: GameState = {
      ...normalizeGameState(data.gameState),
      // Must be "regular" for simulateWeek to produce correct results
      phase: "regular",
      selectedTeamId: data.hostTeamId,
      finances: data.hostFinances ?? data.gameState.finances,
    };

    const newState = simulateWeek(stateForSim, data.guestTeamId!);
    const newHostFinances = newState.finances;

    const guestTeam = newState.teams.find((t) => t.id === data.guestTeamId);
    if (!guestTeam) return;

    const guestTicketMultiplier =
      newState.seasonBonus === "bonus_ticket_10" ? 1.1 : 1;
    const guestHomeMatches = newState.schedule.filter(
      (m) => m.week === newState.week && m.homeTeamId === data.guestTeamId
    );
    const guestTicketIncome =
      guestHomeMatches.length > 0
        ? Math.round((guestTeam.prestige * 1500) / 2 * guestTicketMultiplier)
        : 0;

    const currentGuestFinances =
      data.guestFinances ?? calculateInitialFinances(guestTeam, newState.seasonModifier);
    const newGuestFinances: FinanceRecord = {
      ...currentGuestFinances,
      ticketIncome: currentGuestFinances.ticketIncome + guestTicketIncome,
    };

    // Season-end prize money for guest
    const guestDivTeamCount = newState.teams.filter(
      (t) => t.division === guestTeam.division
    ).length;
    const totalWeeks = 2 * (guestDivTeamCount - 1);

    if (newState.week >= totalWeeks) {
      const guestDivStandings = [...(newState.standings[guestTeam.division] || [])].sort(
        (a, b) =>
          b.wins - a.wins ||
          b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst)
      );
      const guestPosition =
        guestDivStandings.findIndex((s) => s.teamId === data.guestTeamId) + 1;

      const prizeMap: Record<string, Record<number, number>> = {
        rkl: { 1: 230000, 2: 200000, 3: 190000, 4: 160000, 5: 150000, 6: 125000, 7: 100000, 8: 75000 },
        lkl: { 1: 50000, 2: 38000, 3: 30000, 4: 24000, 5: 18000, 6: 14000, 7: 10000, 8: 7000 },
      };
      newGuestFinances.prizeIncome =
        (newGuestFinances.prizeIncome ?? 0) +
        (prizeMap[guestTeam.division]?.[guestPosition] ?? 0);
    }

    const sharedState: GameState = {
      ...newState,
      selectedTeamId: data.hostTeamId,
    };

    await update(lobbyRef, {
      gameState: sharedState,
      hostFinances: newHostFinances,
      guestFinances: newGuestFinances,
    });
  }

  const createLobby = useCallback(
    async (teamId: string, coachType?: CoachType, coachName?: string): Promise<string> => {
      setIsCreatingOrJoining(true);
      setError(null);
      try {
        let code = generateLobbyCode();
        for (let i = 0; i < 5; i++) {
          const existing = await get(ref(db, `lobbies/${code}`));
          if (!existing.exists()) break;
          code = generateLobbyCode();
        }

        const team = TEAMS_DATA.find((t) => t.id === teamId);
        if (!team) throw new Error("Team not found");

        const lobbyData: LobbyFirebaseData = {
          status: "waiting",
          hostTeamId: teamId,
          guestTeamId: null,
          hostReady: false,
          guestReady: false,
          gameState: null,
          hostFinances: null,
          guestFinances: null,
          hostCoachType: coachType ?? null,
          hostCoachName: coachName ?? null,
          guestCoachType: null,
          guestCoachName: null,
          createdAt: Date.now(),
        };

        await set(ref(db, `lobbies/${code}`), lobbyData);

        lobbyCodeRef.current = code;
        myRoleRef.current = "host";
        myTeamIdRef.current = teamId;

        subscribeToLobby(code, "host", teamId);
        return code;
      } catch (e: any) {
        setError(e.message ?? "Failed to create lobby");
        throw e;
      } finally {
        setIsCreatingOrJoining(false);
      }
    },
    [subscribeToLobby]
  );

  const joinLobby = useCallback(
    async (code: string, teamId: string, coachType?: CoachType, coachName?: string): Promise<boolean> => {
      setIsCreatingOrJoining(true);
      setError(null);
      try {
        const snapshot = await get(ref(db, `lobbies/${code}`));
        if (!snapshot.exists()) {
          setError("Lobby not found. Check the code and try again.");
          return false;
        }

        const data: LobbyFirebaseData = snapshot.val();
        if (data.status !== "waiting") {
          setError("This lobby has already started.");
          return false;
        }
        if (data.guestTeamId) {
          setError("This lobby is full.");
          return false;
        }
        if (data.hostTeamId === teamId) {
          setError("That team is already taken by the host. Pick a different team.");
          return false;
        }

        await update(ref(db, `lobbies/${code}`), {
          guestTeamId: teamId,
          guestCoachType: coachType ?? null,
          guestCoachName: coachName ?? null,
        });

        lobbyCodeRef.current = code;
        myRoleRef.current = "guest";
        myTeamIdRef.current = teamId;

        subscribeToLobby(code, "guest", teamId);
        return true;
      } catch (e: any) {
        setError(e.message ?? "Failed to join lobby");
        return false;
      } finally {
        setIsCreatingOrJoining(false);
      }
    },
    [subscribeToLobby]
  );

  const startGame = useCallback(async () => {
    const code = lobbyCodeRef.current;
    const myRole = myRoleRef.current;
    const myTeamId = myTeamIdRef.current;
    if (!code || myRole !== "host" || !myTeamId) return;

    console.log('[useLobby] Starting game for team:', myTeamId);

    const snapshot = await get(ref(db, `lobbies/${code}`));
    const data: LobbyFirebaseData = snapshot.val();
    if (!data?.guestTeamId) return;

    const initialState = initializeGame(myTeamId);

    const hostTeam = initialState.teams.find((t) => t.id === myTeamId)!;
    const guestTeam = initialState.teams.find((t) => t.id === data.guestTeamId!)!;

    const hostFinances = calculateInitialFinances(hostTeam, initialState.seasonModifier);
    const guestFinances = calculateInitialFinances(guestTeam, initialState.seasonModifier);

    console.log('[useLobby] Initialized finances:', {
      hostFinances,
      guestFinances,
      hostTeam: hostTeam.name,
      guestTeam: guestTeam.name,
    });

    // CRITICAL BUG FIX: Firebase Realtime Database throws a FirebaseError for ANY
    // undefined field value in set()/update() calls. The pattern (x ?? undefined)
    // evaluates to undefined when x is null, silently crashing startGame and
    // preventing the game from ever starting. Use conditional spreading instead.
    const sharedState: GameState = {
      ...initialState,
      phase: "regular",
      selectedTeamId: myTeamId,
      ...(data.hostCoachType  ? { coachType:      data.hostCoachType  as CoachType } : {}),
      ...(data.hostCoachName  ? { coachName:      data.hostCoachName              } : {}),
      ...(data.guestCoachType ? { guestCoachType: data.guestCoachType as CoachType } : {}),
      ...(data.guestCoachName ? { guestCoachName: data.guestCoachName             } : {}),
    };

    await update(ref(db, `lobbies/${code}`), {
      status: "in_game",
      gameState: sharedState,
      hostFinances,
      guestFinances,
    });

    console.log('[useLobby] Game started - Firebase updated');
  }, []);

  const setReady = useCallback(async () => {
    const code = lobbyCodeRef.current;
    const myRole = myRoleRef.current;
    if (!code || !myRole) return;
    const field = myRole === "host" ? "hostReady" : "guestReady";
    await update(ref(db, `lobbies/${code}`), { [field]: true });
  }, []);

  const cancelReady = useCallback(async () => {
    const code = lobbyCodeRef.current;
    const myRole = myRoleRef.current;
    if (!code || !myRole) return;
    const field = myRole === "host" ? "hostReady" : "guestReady";
    await update(ref(db, `lobbies/${code}`), { [field]: false });
  }, []);

  const updateMyTeam = useCallback(
    async (newGameState: GameState, newFinances: FinanceRecord) => {
      const code = lobbyCodeRef.current;
      const myRole = myRoleRef.current;
      const myTeamId = myTeamIdRef.current;
      if (!code || !myRole || !myTeamId) return;

      const snapshot = await get(ref(db, `lobbies/${code}/gameState`));
      const rawState: GameState = snapshot.val();
      if (!rawState) return;
      const currentSharedState = normalizeGameState(rawState);

      const updatedTeams = currentSharedState.teams.map((t) =>
        t.id === myTeamId ? newGameState.teams.find((nt) => nt.id === myTeamId)! : t
      );

      const financeKey = myRole === "host" ? "hostFinances" : "guestFinances";
      await update(ref(db, `lobbies/${code}`), {
        "gameState/teams": updatedTeams,
        // Persist both per-player youth intake flags so they survive Firebase sync
        "gameState/youthIntakeUsed": newGameState.youthIntakeUsed ?? false,
        "gameState/youthIntakeUsedGuest": newGameState.youthIntakeUsedGuest ?? false,
        [financeKey]: newFinances,
      });
    },
    []
  );

  // Internal: simulate all playoffs and push to Firebase (called from both-ready trigger)
  async function simulateAllPlayoffsAndPush(code: string, data: LobbyFirebaseData) {
    if (!data?.gameState) return;
    const lobbyRef = ref(db, `lobbies/${code}`);
    await update(lobbyRef, { hostReady: false, guestReady: false });
    const normalized = normalizeGameState(data.gameState);
    const stateForSim: GameState = {
      ...normalized,
      phase: "playoffs",
      selectedTeamId: data.hostTeamId,
      finances: data.hostFinances ?? normalized.finances,
    };
    const finalState = simulateAllPlayoffs(stateForSim);
    await update(lobbyRef, {
      gameState: {
        ...finalState,
        selectedTeamId: data.hostTeamId,
        // Reset both per-player youth intake flags when entering offseason
        youthIntakeUsed:      finalState.phase === "offseason" ? false : finalState.youthIntakeUsed,
        youthIntakeUsedGuest: finalState.phase === "offseason" ? false : finalState.youthIntakeUsedGuest,
      },
      hostFinances: finalState.finances,
    });
  }

  // Internal: run offseason for all teams and start a new season in Firebase
  async function startNewSeasonAndPush(code: string, data: LobbyFirebaseData) {
    if (!data?.gameState) return;
    const lobbyRef = ref(db, `lobbies/${code}`);
    await update(lobbyRef, { hostReady: false, guestReady: false });
    const normalized = normalizeGameState(data.gameState);
    const hostState: GameState = {
      ...normalized,
      selectedTeamId: data.hostTeamId,
      finances: data.hostFinances ?? normalized.finances,
    };

    const offseasonState = processOffseason(hostState);
    // Multiplayer has no preseason — go directly to regular, week 0
    const newState = {
      ...offseasonState,
      phase: "regular",
      week: 0,
      // youthIntakeUsed stays false (reset by processOffseason) but
      // multiplayer never shows the youth intake button (preseason-only),
      // so this is safe.
    };

    const hostTeam = newState.teams.find(t => t.id === data.hostTeamId)!;
    const guestTeam = newState.teams.find(t => t.id === data.guestTeamId);

    const hostFresh = calculateInitialFinances(hostTeam, newState.seasonModifier);
    hostFresh.balance = newState.finances.balance;

    let newGuestFinances = data.guestFinances;
    if (guestTeam && data.guestFinances) {
      const guestFresh = calculateInitialFinances(guestTeam, newState.seasonModifier);
      const guestOld = data.guestFinances;
      const guestEndBalance = guestOld.balance + guestOld.ticketIncome + guestOld.sponsorIncome +
        guestOld.prizeIncome - guestOld.totalWages - guestOld.transferSpending;
      guestFresh.balance = guestEndBalance;
      newGuestFinances = guestFresh;
    }

    await update(lobbyRef, {
      gameState: { ...newState, selectedTeamId: data.hostTeamId },
      hostFinances: hostFresh,
      guestFinances: newGuestFinances,
    });
  }

  const leaveLobby = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    isSimulatingRef.current = false;
    lobbyCodeRef.current = null;
    myRoleRef.current = null;
    myTeamIdRef.current = null;
    setLobbyState(null);
    setGameState(null);
    setMyFinances(null);
    setOpponentFinances(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    lobbyState,
    gameState,
    myFinances,
    opponentFinances,
    isCreatingOrJoining,
    error,
    createLobby,
    joinLobby,
    startGame,
    setReady,
    cancelReady,
    updateMyTeam,
    leaveLobby,
  };
}
