import { useGame } from '@/contexts/GameContext';
import { getProfit } from '@/lib/gameModels';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function FinanceView() {
  const { league } = useGame();
  if (!league || !league.userTeamId) return null;

  const team = league.teams.find(t => t.id === league.userTeamId)!;
  const profit = getProfit(team);

  const recentTrans = [...(team.transactions || [])].reverse().slice(0, 20);

  return (
    <div className="animate-fade-in-up space-y-6">
      <h2 className="font-display text-3xl tracking-wide">Financial Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cash Balance', value: `$${team.cash.toLocaleString()}`, color: team.cash < 0 ? 'text-destructive' : 'text-foreground', desc: 'Total available cash' },
          { label: 'Wage Budget', value: `$${team.wageBudget.toLocaleString()}`, color: 'text-warning', desc: 'Total annual wages for all players' },
          { label: 'Transfer Budget', value: `$${team.transferBudget.toLocaleString()}`, color: team.transferBudget < 0 ? 'text-destructive' : 'text-success', desc: 'Cash minus wages – available for transfers' },
          { label: 'Profit/Loss', value: `${profit >= 0 ? '+' : ''}$${profit.toLocaleString()}`, color: profit >= 0 ? 'text-success' : 'text-destructive', desc: 'Total profit since team was founded' },
        ].map((stat, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent><p>{stat.desc}</p></TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Transactions */}
      {recentTrans.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Transaction Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                  <th className="text-left py-2 px-2">Year</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-right py-2 px-2">Amount</th>
                  <th className="text-left py-2 px-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {recentTrans.map((t, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-2 px-2">{t.year}</td>
                    <td className="py-2 px-2 capitalize">{t.type}</td>
                    <td className={`py-2 px-2 text-right font-medium ${t.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      {team.financeHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Financial History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                <th className="text-left py-2 px-2">Year</th>
                <th className="text-right py-2 px-2">Cash</th>
                <th className="text-right py-2 px-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {team.financeHistory.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2 px-2">{r.year}</td>
                  <td className="py-2 px-2 text-right">${r.cash.toLocaleString()}</td>
                  <td className={`py-2 px-2 text-right font-medium ${r.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {r.profit >= 0 ? '+' : ''}${r.profit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
