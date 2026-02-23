import React from "react";
import { useGame } from "@/hooks/useGameState";
import { GameView } from "@/lib/types";
import Dashboard from "./Dashboard";
import SquadView from "./SquadView";
import TransferMarket from "./TransferMarket";
import FinanceView from "./FinanceView";
import PlayoffsView from "./PlayoffsView";
import LeagueView from "./LeagueView";
import { TeamLogo } from "./TeamSelect";

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
  </svg>
);

const SquadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const LeagueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const TransferIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const FinanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
  </svg>
);

const PlayoffsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{width:18,height:18}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.175-1.125-1.175h-.375m-9 3.375v-3.375c0-.621.504-1.175 1.125-1.175h.375M12 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
  </svg>
);

const NAV_ITEMS: { id: GameView; label: string; Icon: React.FC }[] = [
  { id: "dashboard", label: "Home", Icon: HomeIcon },
  { id: "squad", label: "Squad", Icon: SquadIcon },
  { id: "league", label: "League", Icon: LeagueIcon },
  { id: "transfers", label: "Market", Icon: TransferIcon },
  { id: "finance", label: "Finance", Icon: FinanceIcon },
  { id: "playoffs", label: "Playoffs", Icon: PlayoffsIcon },
];

export default function GameLayout() {
  const { view, setView, state } = useGame();

  if (!state || !state.teams || !state.selectedTeamId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm tracking-widest font-condensed uppercase">Loading…</p>
        </div>
      </div>
    );
  }

  const playerTeam = state.teams.find(t => t.id === state.selectedTeamId);
  const f = state.finances;
  const net = f.ticketIncome + f.sponsorIncome + f.prizeIncome - f.totalWages - f.transferSpending;

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
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0"
        style={{ background: 'hsl(220 28% 4%)', borderRight: '1px solid hsl(220 20% 10%)' }}
      >
        {/* Amber top line */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(38 95% 52%), transparent)' }} />

        {/* Club Header */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'hsl(220 20% 10%)' }}>
          <div className="flex items-center gap-3">
            {playerTeam && <TeamLogo shortName={playerTeam.shortName} color={playerTeam.color} size="md" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-foreground truncate font-condensed tracking-wider uppercase">{playerTeam?.shortName}</div>
              <div className="text-[10px] text-muted-foreground truncate">{playerTeam?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-muted-foreground/70 text-mono">S{state.season}</span>
                <span className="text-[9px] text-muted-foreground/40">·</span>
                <span className="text-[9px] text-muted-foreground/70 text-mono">W{state.week}</span>
              </div>
              {state.coachName && (
                <div className="text-[9px] mt-0.5 font-condensed tracking-wide" style={{ color: 'hsl(38 95% 55%)' }}>
                  {state.coachName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          <div className="text-[9px] font-bold text-muted-foreground/35 uppercase tracking-[0.15em] px-2 pb-2 font-condensed">Navigation</div>
          {NAV_ITEMS.map((item, i) => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative cursor-pointer"
                style={{
                  background: isActive ? 'hsl(38 95% 52% / 0.1)' : 'transparent',
                  color: isActive ? 'hsl(38 95% 55%)' : 'hsl(215 15% 50%)',
                  animationDelay: `${i * 30}ms`,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'hsl(38 95% 52% / 0.05)';
                    (e.currentTarget as HTMLElement).style.color = 'hsl(210 20% 80%)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'hsl(215 15% 50%)';
                  }
                }}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r" style={{ background: 'hsl(38 95% 52%)' }} />
                )}
                <item.Icon />
                <span className="text-[13px] font-condensed tracking-wide font-semibold uppercase">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Finance Summary */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid hsl(220 20% 10%)' }}>
          <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-bold mb-1.5 font-condensed">Season Net</div>
          <div
            className="text-lg font-display tracking-widest"
            style={{ color: net >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}
          >
            {net >= 0 ? "+" : ""}${net.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground/50 mt-0.5 text-mono">
            Budget: ${state.finances.balance.toLocaleString()}
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div
        className="lg:hidden border-b px-3 py-2.5 flex items-center justify-between shrink-0"
        style={{ background: 'hsl(220 28% 4%)', borderColor: 'hsl(220 20% 10%)' }}
      >
        <div className="flex items-center gap-2.5">
          {playerTeam && <TeamLogo shortName={playerTeam.shortName} color={playerTeam.color} size="sm" />}
          <div>
            <span className="text-xs font-bold text-foreground font-condensed tracking-wider uppercase">{playerTeam?.shortName}</span>
            {state.coachName && (
              <div className="text-[9px] font-condensed" style={{ color: 'hsl(38 95% 55%)' }}>{state.coachName}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground text-mono">S{state.season} W{state.week}</span>
          <span
            className="text-xs text-mono font-bold"
            style={{ color: net >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}
          >
            {net >= 0 ? "+" : ""}${(Math.abs(net) / 1000).toFixed(0)}K
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-5 lg:py-6 pb-24 lg:pb-6">
          {renderView()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom"
        style={{ background: 'hsl(220 28% 4% / 0.97)', backdropFilter: 'blur(16px)', borderTop: '1px solid hsl(220 20% 10%)' }}
      >
        <div className="flex justify-around items-center py-1">
          {NAV_ITEMS.map(item => {
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all min-w-[46px] cursor-pointer"
                style={{
                  color: isActive ? 'hsl(38 95% 55%)' : 'hsl(215 15% 46%)',
                  background: isActive ? 'hsl(38 95% 52% / 0.1)' : 'transparent',
                }}
              >
                <item.Icon />
                <span className="text-[9px] font-bold tracking-wider font-condensed uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
