import React from "react";
import { useGame } from "@/hooks/useGameState";
import { GameView } from "@/lib/types";
import Dashboard from "./Dashboard";
import SquadView from "./SquadView";
import TransferMarket from "./TransferMarket";
import FinanceView from "./FinanceView";
import PlayoffsView from "./PlayoffsView";
import LeagueView from "./LeagueView";

const NAV_ITEMS: { id: GameView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "🏠" },
  { id: "squad", label: "Squad", icon: "👥" },
  { id: "league", label: "League", icon: "🏆" },
  { id: "transfers", label: "Market", icon: "💸" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "playoffs", label: "Playoffs", icon: "🎯" }, // Also shows Promotion Game
];

export default function GameLayout() {
  const { view, setView, state } = useGame();

  if (!state || !state.teams || !state.selectedTeamId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const playerTeam = state.teams.find(t => t.id === state.selectedTeamId);

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard />;
      case "squad": return <SquadView />;
      case "transfers": return <TransferMarket />;
      case "finance": return <FinanceView />;
      case "league": return <LeagueView />;
      case "playoffs": return <PlayoffsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-card border-r border-border shrink-0 h-screen sticky top-0">
        {/* Logo / Club Header */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: playerTeam?.color + "33", color: playerTeam?.color }}
            >
              {playerTeam?.shortName}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{playerTeam?.name}</div>
              <div className="text-[10px] text-muted-foreground">S{state.season} · W{state.week}</div>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                view === item.id
                  ? "bg-primary/15 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Finance Summary in Sidebar */}
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Net Result</div>
          <div className={`text-sm text-mono font-bold ${
            (state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) >= 0 
              ? "text-success" 
              : "text-destructive"
          }`}>
            {(state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) >= 0 ? "+" : ""}
            ${(state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending).toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Budget: ${state.finances.balance.toLocaleString()}
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-card border-b border-border px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-black"
            style={{ backgroundColor: playerTeam?.color + "33", color: playerTeam?.color }}
          >
            {playerTeam?.shortName}
          </div>
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            {playerTeam?.shortName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">S{state.season} W{state.week}</span>
          <span className={`text-xs text-mono font-bold ${
            (state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) >= 0 
              ? "text-success" 
              : "text-destructive"
          }`}>
            {(state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) >= 0 ? "+" : ""}
            ${((state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) / 1000).toFixed(0)}K
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-4 lg:py-6 pb-20 lg:pb-6">
          {renderView()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center py-1.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-all ${
                view === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
