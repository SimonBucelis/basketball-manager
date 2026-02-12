import { useGame } from '@/contexts/GameContext';
import { CONFIG } from '@/lib/gameConfig';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const roleColor: Record<string, string> = {
  Defender: 'text-role-defender',
  Sharpshooter: 'text-role-sharpshooter',
  Playmaker: 'text-role-playmaker',
};

export default function SquadView() {
  const { league, youthIntake, releasePlayer, extendContract, setStarter } = useGame();
  if (!league || !league.userTeamId) return null;

  const team = league.teams.find(t => t.id === league.userTeamId)!;
  const isOffseason = league.phase === CONFIG.PHASES.OFFSEASON;

  const players = [...team.players].sort((a, b) => {
    if (a.status === 'starter' && b.status !== 'starter') return -1;
    if (a.status !== 'starter' && b.status === 'starter') return 1;
    return b.rating - a.rating;
  });

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl tracking-wide">Team Roster</h2>
        {isOffseason && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={youthIntake} className="px-4 py-2 rounded-md text-sm border border-border bg-transparent text-foreground hover:bg-accent transition-colors font-medium">
                ⭐ Youth Intake
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Sign {CONFIG.YOUTH_COUNT} young players on {CONFIG.YOUTH_CONTRACT_YEARS}-year contracts from your academy</p></TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs uppercase border-b border-border">
              <th className="text-left py-3 px-3">Name</th>
              <th className="text-center py-3 px-2">Age</th>
              <th className="text-center py-3 px-2">OVR</th>
              <th className="text-left py-3 px-2">Role</th>
              <th className="text-center py-3 px-2">Contract</th>
              <th className="text-right py-3 px-2">Wage/yr</th>
              <th className="text-center py-3 px-2">Status</th>
              <th className="text-center py-3 px-3">Potential</th>
              {isOffseason && <th className="text-right py-3 px-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <Tooltip key={p.id}>
                <TooltipTrigger asChild>
                  <tr className={`border-t border-border hover:bg-accent/50 transition-colors cursor-default ${p.status === 'starter' ? 'bg-primary/5' : ''}`}>
                    <td className="py-3 px-3 font-medium">
                      {p.status === 'starter' && <span className="text-star-gold mr-1">⭐</span>}
                      {p.name}
                    </td>
                    <td className={`text-center py-3 px-2 font-medium ${p.age < 24 ? 'text-success' : p.age > 30 ? 'text-warning' : ''}`}>
                      {p.age}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span className="font-bold text-success">{p.rating}</span>
                    </td>
                    <td className={`py-3 px-2 ${roleColor[p.role] || ''}`}>{p.role}</td>
                    <td className={`text-center py-3 px-2 ${p.contractYears === 1 ? 'text-warning font-semibold' : ''}`}>
                      {p.contractYears} yr
                    </td>
                    <td className="text-right py-3 px-2 text-star-gold">${p.wage.toLocaleString()}</td>
                    <td className="text-center py-3 px-2 capitalize text-muted-foreground">{p.status}</td>
                    <td className="text-center py-3 px-3">
                      <span className={p.potentialStars >= 4 ? 'text-star-gold' : p.potentialStars >= 3 ? 'text-star-silver' : 'text-star-dim'}>
                        {'★'.repeat(p.potentialStars)}
                      </span>
                    </td>
                    {isOffseason && (
                      <td className="text-right py-2 px-3">
                        <div className="flex gap-1 justify-end flex-wrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); setStarter(p.id); }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              p.status === 'starter' ? 'bg-success text-success-foreground' : 'border border-border text-foreground hover:bg-accent'
                            }`}
                          >
                            {p.status === 'starter' ? '★ Starter' : 'Set Starter'}
                          </button>
                          {!p.extendAttempted && p.contractYears === 1 && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); extendContract(p.id, 1); }} className="px-2 py-1 rounded text-xs border border-border text-foreground hover:bg-accent">+1yr</button>
                              <button onClick={(e) => { e.stopPropagation(); extendContract(p.id, 2); }} className="px-2 py-1 rounded text-xs border border-border text-foreground hover:bg-accent">+2yr</button>
                            </>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); releasePlayer(p.id); }} className="px-2 py-1 rounded text-xs bg-destructive text-destructive-foreground hover:opacity-90">Release</button>
                        </div>
                      </td>
                    )}
                  </tr>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{p.name} • {p.role} • Age {p.age} • OVR {p.rating} • Potential {'★'.repeat(p.potentialStars)} • Wage ${p.wage.toLocaleString()}/yr • Contract {p.contractYears}yr</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
