import { useGame } from '@/contexts/GameContext';

export default function PlayoffsView() {
  const { league } = useGame();
  if (!league) return null;

  const log = league.playoffLog;
  if (!log || !log.rounds || log.rounds.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <h2 className="font-display text-3xl tracking-wide mb-4">Playoff Bracket</h2>
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No playoff data available yet. Simulate a season first.
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <h2 className="font-display text-3xl tracking-wide">Playoff Bracket</h2>

      {log.rounds.map((round, ri) => (
        <div key={ri} className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{round.name}</h3>
          <div className="grid gap-2">
            {round.games.map((game, gi) => (
              <div key={gi} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-4 flex-1">
                  <span className={`font-bold ${game.winner === game.home ? 'text-success' : 'text-muted-foreground'}`}>{game.home}</span>
                  <span className="text-lg font-bold">{game.scoreHome}</span>
                  <span className="text-muted-foreground">–</span>
                  <span className="text-lg font-bold">{game.scoreAway}</span>
                  <span className={`font-bold ${game.winner === game.away ? 'text-success' : 'text-muted-foreground'}`}>{game.away}</span>
                </div>
                <span className="text-xs text-success font-medium">Winner: {game.winner}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {log.champion && (
        <div className="rounded-xl p-6 text-center text-primary-foreground font-bold text-2xl" style={{ background: 'var(--gradient-champion)' }}>
          🏆 Champion: {log.champion} 🏆
        </div>
      )}
    </div>
  );
}
