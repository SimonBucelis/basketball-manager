import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { GameState, GameView, FreeAgent, SeasonBonusId, FinanceRecord } from "@/lib/types";
import { initializeGame, simulateWeek, simulatePlayoffGame, simulateAllPlayoffs as engineSimulateAllPlayoffs, processOffseason, attemptTransfer } from "@/lib/gameEngine";
import { generateFreeAgents, generateYouthPlayer, SEASON_BONUSES } from "@/lib/gameData";
import { MultiplayerLobbyState } from "@/lib/multiplayerTypes";

interface GameContextType {
  state: GameState | null;
  view: GameView;
  freeAgents: FreeAgent[];
  seasonBonusChoices: SeasonBonusId[];
  multiplayerLobby: MultiplayerLobbyState | null;
  setView: (v: GameView) => void;
  startGame: (teamId: string) => void;
  playWeek: () => void;
  playPlayoffGame: (matchupIndex: number) => void;
  simulateAllPlayoffs: () => void;
  makeTransferOffer: (player: FreeAgent, contractYears: 1 | 2, salary: number) => { success: boolean; reason?: string };
  intakeYouth: () => void;
  startRegularSeason: () => void;
  startNewSeason: () => void;
  toggleStarter: (playerId: string) => void;
  releasePlayer: (playerId: string) => void;
  renewContract: (playerId: string) => { success: boolean; reason?: string };
  chooseSeasonBonus: (bonusId: SeasonBonusId) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [view, setView] = useState<GameView>("dashboard");
  const [freeAgents, setFreeAgents] = useState<FreeAgent[]>([]);
  const [seasonBonusChoices, setSeasonBonusChoices] = useState<SeasonBonusId[]>([]);

  function rollSeasonBonusChoices(): SeasonBonusId[] {
    const ids = SEASON_BONUSES.map(b => b.id);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  const startGame = useCallback((teamId: string) => {
    const gs = initializeGame(teamId);
    setSeasonBonusChoices(rollSeasonBonusChoices());
    setState({ ...gs, seasonBonus: null });
    const team = gs.teams.find(t => t.id === teamId);
    if (team) setFreeAgents(generateFreeAgents(team.division, false, team.prestige));
    setView("dashboard");
  }, []);

  const startRegularSeason = useCallback(() => {
    if (!state) return;
    setState({ ...state, phase: "regular" });
  }, [state]);

  const startNewSeason = useCallback(() => {
    if (!state || state.phase !== "offseason") return;
    const offSeasonState = processOffseason(state);
    const team = offSeasonState.teams.find(t => t.id === offSeasonState.selectedTeamId);
    if (team) setFreeAgents(generateFreeAgents(team.division, false, team.prestige));
    setSeasonBonusChoices(rollSeasonBonusChoices());
    setState({ ...offSeasonState, seasonBonus: null });
  }, [state]);

  const chooseSeasonBonus = useCallback((bonusId: SeasonBonusId) => {
    if (!state) return;
    setSeasonBonusChoices([]);
    let newFinances = { ...state.finances };
    if (bonusId === "bonus_sponsor_10") {
      newFinances = { ...newFinances, sponsorIncome: Math.round(newFinances.sponsorIncome * 1.1) };
    } else if (bonusId === "bonus_wage_minus10") {
      newFinances = { ...newFinances, totalWages: Math.round(newFinances.totalWages * 0.9) };
    }
    setState({ ...state, seasonBonus: bonusId, finances: newFinances });
  }, [state]);

  const playWeek = useCallback(() => {
    if (!state || state.phase !== "regular") return;
    const newState = simulateWeek(state);
    if (newState.phase === "offseason") {
      const team = newState.teams.find(t => t.id === newState.selectedTeamId);
      if (team) setFreeAgents(generateFreeAgents(team.division, true, team.prestige));
    }
    setState(newState);
  }, [state]);

  const playPlayoffGame = useCallback((matchupIndex: number) => {
    if (!state || state.phase !== "playoffs") return;
    const newState = simulatePlayoffGame(state, matchupIndex);
    if (newState.phase === "offseason") {
      const team = newState.teams.find(t => t.id === newState.selectedTeamId);
      if (team) setFreeAgents(generateFreeAgents(team.division, true, team.prestige));
    }
    setState(newState);
  }, [state]);

  const simulateAllPlayoffs = useCallback(() => {
    if (!state || state.phase !== "playoffs") return;
    const newState = engineSimulateAllPlayoffs(state);
    if (newState.phase === "offseason") {
      const team = newState.teams.find(t => t.id === newState.selectedTeamId);
      if (team) setFreeAgents(generateFreeAgents(team.division, true, team.prestige));
    }
    setState(newState);
  }, [state]);

  const makeTransferOffer = useCallback((player: FreeAgent, contractYears: 1 | 2, salary: number): { success: boolean; reason?: string } => {
    if (!state) return { success: false, reason: "Game not initialized" };
    const { success, newState, reason } = attemptTransfer(state, player, contractYears, salary);
    setState(newState);
    setFreeAgents(prev => prev.filter(p => p.id !== player.id));
    return { success, reason };
  }, [state]);

  const intakeYouth = useCallback(() => {
    if (!state || state.youthIntakeUsed) return;
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const availableSlots = 12 - team.players.length;
    if (availableSlots <= 0) return;
    const playersToAdd = Math.min(2, availableSlots);
    const newYouthPlayers = [];
    let totalWages = 0;
    for (let i = 0; i < playersToAdd; i++) {
      const youth = generateYouthPlayer(team.prestige);
      youth.isStarter = false;
      youth.seasonsWithoutPlay = 0;
      newYouthPlayers.push(youth);
      totalWages += youth.salary;
    }
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId ? { ...t, players: [...t.players, ...newYouthPlayers] } : t
    );
    setState({ ...state, teams: newTeams, finances: { ...state.finances, totalWages: state.finances.totalWages + totalWages }, youthIntakeUsed: true });
  }, [state]);

  const toggleStarter = useCallback((playerId: string) => {
    if (!state) return;
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const player = team.players.find(p => p.id === playerId);
    if (!player) return;
    if (!player.isStarter && team.players.filter(p => p.isStarter).length >= 5) return;
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId
        ? { ...t, players: t.players.map(p => p.id === playerId ? { ...p, isStarter: !p.isStarter } : p) }
        : t
    );
    setState({ ...state, teams: newTeams });
  }, [state]);

  const releasePlayer = useCallback((playerId: string) => {
    if (!state) return;
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const player = team.players.find(p => p.id === playerId);
    if (!player) return;
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId ? { ...t, players: t.players.filter(p => p.id !== playerId) } : t
    );
    setState({ ...state, teams: newTeams, finances: { ...state.finances, totalWages: state.finances.totalWages - player.salary } });
  }, [state]);

  const renewContract = useCallback((playerId: string): { success: boolean; reason?: string } => {
    if (!state) return { success: false, reason: "Game not initialized" };
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const player = team.players.find(p => p.id === playerId);
    if (!player) return { success: false, reason: "Player not found" };
    if (player.contractYears > 1) return { success: false, reason: "Can only renew with 1 year remaining" };
    let newSalary: number;
    let additionalCost: number;
    if (player.salary === 0) {
      const prestigeBonus = 1 + (team.prestige * 0.10);
      newSalary = Math.round(player.overall * 100 * prestigeBonus);
      additionalCost = newSalary;
    } else {
      const prestigeBonus = 1 + (team.prestige * 0.10);
      newSalary = Math.round(player.salary * 1.15 * prestigeBonus);
      additionalCost = newSalary - player.salary;
    }
    if (state.finances.balance < additionalCost) return { success: false, reason: "Insufficient funds for salary increase" };
    const yearsToAdd = state.phase === "offseason" ? 2 : 1;
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId
        ? { ...t, players: t.players.map(p => p.id === playerId ? { ...p, contractYears: p.contractYears + yearsToAdd, salary: newSalary, isYouth: false } : p) }
        : t
    );
    setState({ ...state, teams: newTeams, finances: { ...state.finances, totalWages: state.finances.totalWages + additionalCost, balance: state.finances.balance - additionalCost } });
    return { success: true };
  }, [state]);

  return (
    <GameContext.Provider value={{
      state, view, freeAgents, seasonBonusChoices,
      multiplayerLobby: null,
      setView, startGame, playWeek, playPlayoffGame, simulateAllPlayoffs,
      makeTransferOffer, intakeYouth, startRegularSeason, startNewSeason,
      toggleStarter, releasePlayer, renewContract, chooseSeasonBonus,
    }}>
      {children}
    </GameContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLAYER GAME PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
interface MultiplayerGameProviderProps {
  children: React.ReactNode;
  initialGameState: GameState;
  initialFinances: FinanceRecord;
  lobbyState: MultiplayerLobbyState;
  onReady: () => Promise<void>;
  onCancelReady: () => Promise<void>;
  onUpdateTeam: (newGameState: GameState, newFinances: FinanceRecord) => Promise<void>;
  onLeave: () => void;
}

export function MultiplayerGameProvider({
  children,
  initialGameState,
  initialFinances,
  lobbyState,
  onReady,
  onCancelReady,
  onUpdateTeam,
}: MultiplayerGameProviderProps) {
  const [state, setState] = useState<GameState>(() => ({
    ...initialGameState,
    selectedTeamId: lobbyState.myTeamId,
    finances: initialFinances,
  }));
  const [view, setView] = useState<GameView>("dashboard");
  const [freeAgents, setFreeAgents] = useState<FreeAgent[]>(() => {
    const myTeam = initialGameState.teams.find(t => t.id === lobbyState.myTeamId);
    return myTeam ? generateFreeAgents(myTeam.division, false, myTeam.prestige) : [];
  });
  const [seasonBonusChoices] = useState<SeasonBonusId[]>([]);

  // Sync incoming game state updates (week simulated by host)
  useEffect(() => {
    setState(prev => ({
      ...initialGameState,
      selectedTeamId: lobbyState.myTeamId,
      finances: initialFinances,
    }));
  }, [initialGameState.week, initialGameState.phase, initialGameState.standings, initialGameState.teams, initialGameState.schedule, lobbyState.myTeamId, initialFinances]);

  const syncToFirebase = useCallback(async (newState: GameState) => {
    setState(newState);
    await onUpdateTeam(newState, newState.finances);
  }, [onUpdateTeam]);

  // In multiplayer, ALL advance actions = toggle ready state.
  // The Firebase listener handles what to simulate based on phase.
  const toggleReady = useCallback(async () => {
    if (lobbyState.myReady) {
      await onCancelReady();
    } else {
      await onReady();
    }
  }, [lobbyState.myReady, onReady, onCancelReady]);

  const playWeek = useCallback(async () => {
    if (!state) return;
    await toggleReady();
  }, [state, toggleReady]);

  const startGame = useCallback((_teamId: string) => {}, []);
  const startRegularSeason = useCallback(() => {
    if (!state) return;
    setState({ ...state, phase: "regular" });
  }, [state]);
  // In multiplayer, next season = toggle ready (both must click)
  const startNewSeason = useCallback(async () => {
    await toggleReady();
  }, [toggleReady]);
  const playPlayoffGame = useCallback((_matchupIndex: number) => {}, []);
  // In multiplayer, playoffs = toggle ready (both must click)
  const simulateAllPlayoffs = useCallback(async () => {
    await toggleReady();
  }, [toggleReady]);

  const chooseSeasonBonus = useCallback((bonusId: SeasonBonusId) => {
    if (!state) return;
    let newFinances = { ...state.finances };
    if (bonusId === "bonus_sponsor_10") newFinances = { ...newFinances, sponsorIncome: Math.round(newFinances.sponsorIncome * 1.1) };
    else if (bonusId === "bonus_wage_minus10") newFinances = { ...newFinances, totalWages: Math.round(newFinances.totalWages * 0.9) };
    syncToFirebase({ ...state, seasonBonus: bonusId, finances: newFinances });
  }, [state, syncToFirebase]);

  const makeTransferOffer = useCallback((player: FreeAgent, contractYears: 1 | 2, salary: number): { success: boolean; reason?: string } => {
    if (!state) return { success: false, reason: "Game not initialized" };
    const { success, newState, reason } = attemptTransfer(state, player, contractYears, salary);
    setFreeAgents(prev => prev.filter(p => p.id !== player.id));
    if (success) syncToFirebase(newState); else setState(newState);
    return { success, reason };
  }, [state, syncToFirebase]);

  const intakeYouth = useCallback(() => {
    if (!state || state.youthIntakeUsed) return;
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const availableSlots = 12 - team.players.length;
    if (availableSlots <= 0) return;
    const playersToAdd = Math.min(2, availableSlots);
    const newYouthPlayers = [];
    let totalWages = 0;
    for (let i = 0; i < playersToAdd; i++) {
      const youth = generateYouthPlayer(team.prestige);
      youth.isStarter = false;
      newYouthPlayers.push(youth);
      totalWages += youth.salary;
    }
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId ? { ...t, players: [...t.players, ...newYouthPlayers] } : t
    );
    syncToFirebase({ ...state, teams: newTeams, finances: { ...state.finances, totalWages: state.finances.totalWages + totalWages }, youthIntakeUsed: true });
  }, [state, syncToFirebase]);

  const toggleStarter = useCallback((playerId: string) => {
    if (!state) return;
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const player = team.players.find(p => p.id === playerId);
    if (!player || (!player.isStarter && team.players.filter(p => p.isStarter).length >= 5)) return;
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId
        ? { ...t, players: t.players.map(p => p.id === playerId ? { ...p, isStarter: !p.isStarter } : p) }
        : t
    );
    syncToFirebase({ ...state, teams: newTeams });
  }, [state, syncToFirebase]);

  const releasePlayer = useCallback((playerId: string) => {
    if (!state) return;
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const player = team.players.find(p => p.id === playerId);
    if (!player) return;
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId ? { ...t, players: t.players.filter(p => p.id !== playerId) } : t
    );
    syncToFirebase({ ...state, teams: newTeams, finances: { ...state.finances, totalWages: state.finances.totalWages - player.salary } });
  }, [state, syncToFirebase]);

  const renewContract = useCallback((playerId: string): { success: boolean; reason?: string } => {
    if (!state) return { success: false, reason: "Game not initialized" };
    const team = state.teams.find(t => t.id === state.selectedTeamId)!;
    const player = team.players.find(p => p.id === playerId);
    if (!player) return { success: false, reason: "Player not found" };
    if (player.contractYears > 1) return { success: false, reason: "Can only renew with 1 year remaining" };
    let newSalary: number;
    let additionalCost: number;
    if (player.salary === 0) {
      newSalary = Math.round(player.overall * 100 * (1 + team.prestige * 0.10));
      additionalCost = newSalary;
    } else {
      newSalary = Math.round(player.salary * 1.15 * (1 + team.prestige * 0.10));
      additionalCost = newSalary - player.salary;
    }
    if (state.finances.balance < additionalCost) return { success: false, reason: "Insufficient funds" };
    const yearsToAdd = state.phase === "offseason" ? 2 : 1;
    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId
        ? { ...t, players: t.players.map(p => p.id === playerId ? { ...p, contractYears: p.contractYears + yearsToAdd, salary: newSalary, isYouth: false } : p) }
        : t
    );
    syncToFirebase({ ...state, teams: newTeams, finances: { ...state.finances, totalWages: state.finances.totalWages + additionalCost, balance: state.finances.balance - additionalCost } });
    return { success: true };
  }, [state, syncToFirebase]);

  return (
    <GameContext.Provider value={{
      state,
      view,
      freeAgents,
      seasonBonusChoices,
      multiplayerLobby: lobbyState,
      setView,
      startGame,
      playWeek,
      playPlayoffGame,
      simulateAllPlayoffs,
      makeTransferOffer,
      intakeYouth,
      startRegularSeason,
      startNewSeason,
      toggleStarter,
      releasePlayer,
      renewContract,
      chooseSeasonBonus,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
