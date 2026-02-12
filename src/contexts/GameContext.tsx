import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type LeagueState } from '@/lib/gameModels';
import { GameEngine } from '@/lib/gameEngine';
import { CONFIG } from '@/lib/gameConfig';
import { updateBudgets } from '@/lib/gameModels';
import { toast } from 'sonner';

type View = 'dashboard' | 'squad' | 'playoffs' | 'recruitment' | 'transfers' | 'finance';

interface GameContextType {
  league: LeagueState | null;
  currentView: View;
  setView: (view: View) => void;
  startGame: (teamId: number) => void;
  simSeason: () => void;
  nextSeason: () => void;
  youthIntake: () => void;
  releasePlayer: (playerId: number) => void;
  extendContract: (playerId: number, years: number) => void;
  setStarter: (playerId: number) => void;
  signFreeAgent: (playerId: number) => void;
  buyTransfer: (playerId: number, years: number) => void;
  saveGame: () => void;
  loadGame: () => void;
  forceUpdate: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const update = useCallback((l: LeagueState) => {
    setLeague({ ...l });
  }, []);

  const startGame = useCallback((teamId: number) => {
    const l = GameEngine.initLeague(CONFIG.ROSTER_SIZE);
    l.userTeamId = teamId;
    l.phase = CONFIG.PHASES.REGULAR;
    update(l);
    setCurrentView('dashboard');
    toast.success("Career Started!");
  }, [update]);

  const simSeason = useCallback(() => {
    if (!league || league.phase !== CONFIG.PHASES.REGULAR) return;
    GameEngine.simulateSeason(league);
    league.phase = CONFIG.PHASES.OFFSEASON;
    league.teams.forEach(t => updateBudgets(t));
    GameEngine.generateFreeAgents(league);
    GameEngine.generateTransferMarket(league);
    update(league);
    toast.info("Season Finished! Transfer market updated.");
  }, [league, update]);

  const nextSeason = useCallback(() => {
    if (!league) return;
    const err = GameEngine.startNextSeason(league);
    if (err) { toast.error(err); return; }
    update(league);
    toast.success(`New Season! Modifier: ${league.seasonModifier}`);
  }, [league, update]);

  const youthIntake = useCallback(() => {
    if (!league) return;
    const team = league.teams.find(t => t.id === league.userTeamId);
    if (!team) return;
    if (league.phase !== CONFIG.PHASES.OFFSEASON) { toast.error("Only available in offseason."); return; }
    if (league.didYouthThisOffseason) { toast.error("Already claimed youth this offseason."); return; }
    if (team.players.length + CONFIG.YOUTH_COUNT > CONFIG.ROSTER_SIZE) { toast.error("Not enough roster space."); return; }
    const youth = GameEngine.doYouthIntake(league, league.userTeamId!);
    if (youth) {
      youth.forEach(p => team.players.push(p));
      updateBudgets(team);
      update(league);
      toast.success("Youth players signed!");
    }
  }, [league, update]);

  const releasePlayer = useCallback((playerId: number) => {
    if (!league) return;
    const res = GameEngine.releasePlayer(league, league.userTeamId!, playerId);
    if (res.success) {
      toast.success(`Released ${res.player.name}${res.cost > 0 ? ` (Cost: $${res.cost.toLocaleString()})` : ''}`);
      update(league);
    } else toast.error(res.reason);
  }, [league, update]);

  const extendContract = useCallback((playerId: number, years: number) => {
    if (!league) return;
    const res = GameEngine.extendContract(league, playerId, years);
    if (res.success && res.extended) { toast.success(`Contract extended by ${res.years} years!`); update(league); }
    else if (res.success && !res.extended) { toast.error("Player declined extension."); update(league); }
    else toast.error(res.reason);
  }, [league, update]);

  const setStarter = useCallback((playerId: number) => {
    if (!league) return;
    const err = GameEngine.setStarter(league, playerId);
    if (err) toast.error(err);
    update(league);
  }, [league, update]);

  const signFreeAgent = useCallback((playerId: number) => {
    if (!league) return;
    const res = GameEngine.signFreeAgent(league, playerId, league.userTeamId!);
    if (res.success) { toast.success(`Signed ${res.player.name}!`); update(league); }
    else toast.error(res.reason);
  }, [league, update]);

  const buyTransfer = useCallback((playerId: number, years: number) => {
    if (!league) return;
    const res = GameEngine.buyTransferPlayer(league, league.userTeamId!, playerId, years);
    if (res.success) { toast.success(`Signed ${res.player.name} for $${res.cost.toLocaleString()}`); update(league); }
    else toast.error(res.reason);
  }, [league, update]);

  const saveGame = useCallback(() => {
    if (!league) return;
    if (GameEngine.saveGame(league)) toast.success("Game Saved");
    else toast.error("Save failed");
  }, [league]);

  const loadGame = useCallback(() => {
    const data = GameEngine.loadGame();
    if (data) { setLeague(data); setCurrentView('dashboard'); toast.success("Game Loaded"); }
    else toast.error("No save found");
  }, []);

  return (
    <GameContext.Provider value={{
      league, currentView, setView: setCurrentView,
      startGame, simSeason, nextSeason, youthIntake,
      releasePlayer, extendContract, setStarter,
      signFreeAgent, buyTransfer, saveGame, loadGame, forceUpdate,
    }}>
      {children}
    </GameContext.Provider>
  );
}
