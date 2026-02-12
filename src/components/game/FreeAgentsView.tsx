import { useGame } from '@/contexts/GameContext';
import { CONFIG } from '@/lib/gameConfig';
import PlayerCard from './PlayerCard';

export default function FreeAgentsView() {
  const { league, signFreeAgent } = useGame();
  if (!league || !league.userTeamId) return null;

  const isOffseason = league.phase === CONFIG.PHASES.OFFSEASON;
  const userTeam = league.teams.find(t => t.id === league.userTeamId)!;
  const rosterFull = userTeam.players.length >= CONFIG.ROSTER_SIZE;

  return (
    <div className="animate-fade-in-up space-y-4">
      <div>
        <h2 className="font-display text-3xl tracking-wide">Free Agent Market</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign available players to 1-year contracts.</p>
      </div>

      {!isOffseason ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Free agent market opens in offseason.
        </div>
      ) : !league.freeAgents || league.freeAgents.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No free agents available.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {league.freeAgents.map(p => (
            <PlayerCard key={p.id} player={p} teamPrestige={userTeam.prestige}>
              <button
                onClick={() => signFreeAgent(p.id)}
                disabled={rosterFull}
                className={`w-full mt-3 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                  rosterFull
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {rosterFull ? 'Roster Full' : 'Sign (1yr)'}
              </button>
            </PlayerCard>
          ))}
        </div>
      )}
    </div>
  );
}
