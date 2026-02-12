import { useGame } from '@/contexts/GameContext';
import { CONFIG } from '@/lib/gameConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { id: 'dashboard' as const, icon: '📊', label: 'Dashboard', desc: 'Overview of your team status, season progress, and alerts' },
  { id: 'squad' as const, icon: '👥', label: 'Squad', desc: 'Manage your roster, set starters, extend contracts' },
  { id: 'playoffs' as const, icon: '⚔️', label: 'Playoffs', desc: 'View playoff bracket and results' },
  { id: 'recruitment' as const, icon: '🤝', label: 'Free Agents', desc: 'Sign available free agents to 1-year deals' },
  { id: 'transfers' as const, icon: '💰', label: 'Transfers', desc: 'Buy players from other teams' },
  { id: 'finance' as const, icon: '📈', label: 'Finance', desc: 'Financial overview, budgets, and transaction history' },
];

export default function GameSidebar() {
  const { league, currentView, setView, saveGame, loadGame } = useGame();

  if (!league || !league.userTeamId) return null;
  const team = league.teams.find(t => t.id === league.userTeamId);
  if (!team) return null;

  const phaseLabel = league.phase === CONFIG.PHASES.REGULAR ? 'In Season' : 'Off-season';

  return (
    <aside className="w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col p-4 shrink-0">
      {/* Team card */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="rounded-lg p-4 mb-6 text-primary-foreground shadow-lg" style={{ background: 'var(--gradient-team)' }}>
            <h2 className="text-lg font-bold mb-1">{team.name}</h2>
            <div className="flex justify-between text-sm opacity-80">
              <span>★ {team.prestige.toFixed(1)}</span>
              <span>{phaseLabel}</span>
            </div>
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(0,0,0,0.3)' }}>
              👥 {team.players.length}/{CONFIG.ROSTER_SIZE}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Your team's prestige, phase, and roster count</p>
        </TooltipContent>
      </Tooltip>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(item => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setView(item.id)}
                className={`text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.desc}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border pt-3 flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={saveGame} className="flex-1 px-3 py-2 rounded-md text-sm border border-border bg-transparent text-foreground hover:bg-accent transition-colors">
              Save
            </button>
          </TooltipTrigger>
          <TooltipContent><p>Save game to browser storage</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={loadGame} className="flex-1 px-3 py-2 rounded-md text-sm border border-border bg-transparent text-foreground hover:bg-accent transition-colors">
              Load
            </button>
          </TooltipTrigger>
          <TooltipContent><p>Load previously saved game</p></TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
