import { useGame } from '@/contexts/GameContext';
import { CONFIG } from '@/lib/gameConfig';
import PlayerCard from './PlayerCard';

export default function TransferMarketView() {
  const { league, buyTransfer } = useGame();
  if (!league || !league.userTeamId) return null;

  const isOffseason = league.phase === CONFIG.PHASES.OFFSEASON;
  const userTeam = league.teams.find(t => t.id === league.userTeamId)!;

  return (
    <div className="animate-fade-in-up space-y-4">
      <div>
        <h2 className="font-display text-3xl tracking-wide">Transfer Market</h2>
        <p className="text-sm text-muted-foreground mt-1">Buy players from other teams. Acceptance varies by contract length.</p>
      </div>

      {!isOffseason ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Transfer market opens in offseason.
        </div>
      ) : !league.transferMarket || league.transferMarket.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No players on the transfer market.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {league.transferMarket.map(item => (
            <PlayerCard key={item.player.id} player={item.player} teamPrestige={userTeam.prestige}>
              <div className="mt-3 bg-muted rounded-lg p-2 text-center mb-2">
                <p className="text-xs text-muted-foreground">Transfer Fee</p>
                <p className="text-lg font-bold">${item.price.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => buyTransfer(item.player.id, 1)}
                  className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                >
                  Buy 1yr (75%)
                </button>
                <button
                  onClick={() => buyTransfer(item.player.id, 2)}
                  className="flex-1 px-3 py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                >
                  Buy 2yr (55%)
                </button>
              </div>
            </PlayerCard>
          ))}
        </div>
      )}
    </div>
  );
}
