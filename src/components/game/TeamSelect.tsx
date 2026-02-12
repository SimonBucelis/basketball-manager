import { useState } from 'react';
import { CONFIG } from '@/lib/gameConfig';
import { useGame } from '@/contexts/GameContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function TeamSelect() {
  const [selectedTeam, setSelectedTeam] = useState(CONFIG.TEAMS[0].id);
  const { startGame, loadGame } = useGame();

  const team = CONFIG.TEAMS.find(t => t.id === selectedTeam)!;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        <h1 className="font-display text-6xl tracking-wider mb-2">Basketball Manager</h1>
        <p className="text-muted-foreground mb-8">Select your team to begin your career.</p>

        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-muted text-foreground border border-border text-base mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CONFIG.TEAMS.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({'★'.repeat(Math.round(t.prestige))}) — ${(t.startingCash / 1000).toFixed(0)}K
              </option>
            ))}
          </select>

          {/* Team preview */}
          <div className="rounded-lg p-4 text-left text-primary-foreground mb-4" style={{ background: 'var(--gradient-team)' }}>
            <h3 className="font-bold text-lg">{team.name}</h3>
            <div className="flex justify-between text-sm opacity-80 mt-1">
              <span>★ {team.prestige.toFixed(1)}</span>
              <span>${team.startingCash.toLocaleString()}</span>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => startGame(selectedTeam)}
                className="w-full px-6 py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
              >
                🏀 Start Career
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Begin a new career managing {team.name}</p></TooltipContent>
          </Tooltip>
        </div>

        <button
          onClick={loadGame}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Load Saved Game
        </button>
      </div>
    </div>
  );
}
