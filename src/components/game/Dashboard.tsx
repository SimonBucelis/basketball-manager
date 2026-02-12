import { useGame } from '@/contexts/GameContext';
import { CONFIG } from '@/lib/gameConfig';
import { getProfit } from '@/lib/gameModels';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function Dashboard() {
  const { league, simSeason, nextSeason } = useGame();
  if (!league || !league.userTeamId) return null;

  const team = league.teams.find(t => t.id === league.userTeamId)!;
  const isRegular = league.phase === CONFIG.PHASES.REGULAR;
  const isOffseason = league.phase === CONFIG.PHASES.OFFSEASON;
  const profit = getProfit(team);

  // Build alerts
  const alerts: { icon: string; text: string; type: 'warning' | 'danger' | 'info' }[] = [];
  const expiringContracts = team.players.filter(p => p.contractYears === 1);
  if (expiringContracts.length > 0) alerts.push({ icon: '🔔', text: `${expiringContracts.length} contract(s) expiring`, type: 'warning' });
  if (team.transferBudget < 0) alerts.push({ icon: '⚠', text: 'Salary cap warning – negative budget', type: 'danger' });
  if (team.cash < 0) alerts.push({ icon: '💰', text: 'Negative balance!', type: 'danger' });
  if (isOffseason && !league.didYouthThisOffseason && team.players.length + CONFIG.YOUTH_COUNT <= CONFIG.ROSTER_SIZE) {
    alerts.push({ icon: '⭐', text: 'Youth promotion available', type: 'info' });
  }

  const standings = [...league.teams].sort((a, b) => b.seasonStats.wins - a.seasonStats.wins || b.seasonStats.pointsFor - a.seasonStats.pointsFor);

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* 1. Season Overview */}
      <div className="rounded-xl p-6 border border-border bg-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Season Overview</p>
            <h1 className="font-display text-5xl mt-1 tracking-wide">Year {league.year}</h1>
          </div>
          <div className="text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-primary/15 text-primary">
                  {isRegular ? '🏀 Regular Season' : '📋 Off-season'}
                </span>
              </TooltipTrigger>
              <TooltipContent><p>{isRegular ? 'Simulate the season to see results' : 'Manage roster, sign players, then start next season'}</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase">Record</p>
                <p className="text-2xl font-bold mt-1">{team.seasonStats.wins}–{team.seasonStats.losses}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Wins and losses this season</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase">Prestige</p>
                <p className="text-2xl font-bold mt-1 text-star-gold">{'★'.repeat(Math.round(team.prestige))}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Team prestige rating ({team.prestige.toFixed(1)}). Higher prestige attracts better players</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase">Standing</p>
                <p className="text-2xl font-bold mt-1">{team.seasonStats.place ? `#${team.seasonStats.place}` : '—'}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Current league standing out of {league.teams.length} teams</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase">Budget</p>
                <p className={`text-2xl font-bold mt-1 ${team.transferBudget < 0 ? 'text-destructive' : 'text-success'}`}>
                  ${(team.transferBudget / 1000).toFixed(0)}K
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Available transfer budget: ${team.transferBudget.toLocaleString()}</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Season Modifier Banner */}
        {league.seasonModifier && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground cursor-help" style={{ background: 'var(--gradient-team)' }}>
                ⚡ Season Modifier: {league.seasonModifier}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                {league.seasonModifier === 'Foreign Investment' && 'All teams receive 50% bonus on transfer budget'}
                {league.seasonModifier === 'Financial Crisis' && 'All income and prizes reduced by 30%'}
                {league.seasonModifier === 'Golden Generation' && 'Youth intake produces better players'}
                {league.seasonModifier === 'Injury Crisis' && 'Player ratings fluctuate during matches'}
                {league.seasonModifier === 'Fan Boom' && 'Prestige changes are amplified by 50%'}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* 2. Alerts Panel */}
      {alerts.length > 0 && (
        <div className="rounded-xl p-4 border border-border bg-card space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">⚠ Alerts</h3>
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
              alert.type === 'danger' ? 'bg-destructive/10 text-destructive' :
              alert.type === 'warning' ? 'bg-warning/10 text-warning' :
              'bg-primary/10 text-primary'
            }`}>
              <span>{alert.icon}</span>
              <span>{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Primary Action */}
      <div className="flex gap-3">
        {isRegular && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={simSeason}
                className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
              >
                ▶ Sim Season
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Simulate the entire regular season and playoffs</p></TooltipContent>
          </Tooltip>
        )}
        {isOffseason && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={nextSeason}
                className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity animate-pulse-glow"
              >
                ⭐ Start Next Season
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Progress to the next season. Players age, contracts expire, new modifier applied</p></TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Season Results (offseason) */}
      {isOffseason && (
        <div className="rounded-xl p-5 border border-border bg-card">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Season {league.season - 1} Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Final Standing</p>
              <p className="text-xl font-bold">{team.seasonStats.place || 'N/A'} / {league.teams.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Record</p>
              <p className="text-xl font-bold">{team.seasonStats.wins}W – {team.seasonStats.losses}L</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Playoff Result</p>
              <p className="text-xl font-bold">{team.playoffRoundReached}</p>
            </div>
          </div>
        </div>
      )}

      {/* League Standings */}
      <div className="rounded-xl p-5 border border-border bg-card">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">League Standings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Team</th>
                <th className="text-center py-2 px-2">W</th>
                <th className="text-center py-2 px-2">L</th>
                <th className="text-center py-2 px-2">PF</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((t, i) => (
                <tr key={t.id} className={`border-t border-border ${t.id === league.userTeamId ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}>
                  <td className="py-2 px-2 font-medium">{i + 1}</td>
                  <td className="py-2 px-2 font-medium">{t.abbrev}</td>
                  <td className="py-2 px-2 text-center">{t.seasonStats.wins}</td>
                  <td className="py-2 px-2 text-center">{t.seasonStats.losses}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground">{t.seasonStats.pointsFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
