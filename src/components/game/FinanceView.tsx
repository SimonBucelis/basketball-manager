import React from "react";
import { useGame } from "@/hooks/useGameState";

export default function FinanceView() {
  const { state } = useGame();
  if (!state) return null;

  const f = state.finances;
  const income = f.ticketIncome + f.sponsorIncome;
  const prizeIncome = f.prizeIncome;
  const expenses = f.totalWages + f.transferSpending;
  const net = income + prizeIncome - expenses;

  const totalIn = income + prizeIncome;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header py-3 rounded-xl">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider font-condensed">Finances</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Season {state.season} financial summary</p>
      </div>

      {/* Net Result Hero */}
      <div className="rounded-2xl p-5 flex items-center justify-between"
        style={{
          background: net >= 0 ? 'hsl(152 60% 40% / 0.08)' : 'hsl(0 72% 55% / 0.08)',
          border: `2px solid ${net >= 0 ? 'hsl(152 60% 40% / 0.3)' : 'hsl(0 72% 55% / 0.3)'}`,
        }}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground font-condensed mb-0.5">Net Result</div>
          <div className="text-sm text-muted-foreground">Total income − expenses</div>
        </div>
        <span className="font-display text-5xl tracking-widest" style={{ color: net >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
          {net >= 0 ? "+" : ""}${net.toLocaleString()}
        </span>
      </div>

      {/* Income Block */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(220 20% 12%)', background: 'hsl(152 60% 40% / 0.06)' }}>
          <span className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(152 60% 48%)' }}>Income</span>
          <span className="text-mono text-sm font-bold" style={{ color: 'hsl(152 60% 48%)' }}>+${totalIn.toLocaleString()}</span>
        </div>
        <div>
          <FinanceRow icon="🎫" label="Ticket Sales" amount={f.ticketIncome} positive />
          <FinanceRow icon="📢" label="Sponsorship" amount={f.sponsorIncome} positive />
          <FinanceRow icon="🏆" label="Prize Money" amount={f.prizeIncome} positive />
        </div>
      </div>

      {/* Expenses Block */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(220 20% 12%)', background: 'hsl(0 72% 55% / 0.05)' }}>
          <span className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(0 72% 58%)' }}>Expenses</span>
          <span className="text-mono text-sm font-bold" style={{ color: 'hsl(0 72% 58%)' }}>-${expenses.toLocaleString()}</span>
        </div>
        <div>
          <FinanceRow icon="💰" label="Player Wages" amount={f.totalWages} positive={false} />
          <FinanceRow icon="🔄" label="Transfer Spending" amount={f.transferSpending} positive={false} />
        </div>
      </div>

      {/* Budget Card */}
      <div className="rounded-xl p-4 flex justify-between items-center"
        style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground font-condensed">Available Budget</div>
          <div className="text-xs text-muted-foreground mt-0.5">Cash on hand for transfers</div>
        </div>
        <span className="text-mono text-2xl font-black text-foreground">${f.balance.toLocaleString()}</span>
      </div>

      {/* Income breakdown bar */}
      {totalIn > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground font-condensed mb-3">Income Breakdown</div>
          <div className="space-y-2">
            {[
              { label: 'Tickets', value: f.ticketIncome, color: 'hsl(38 95% 52%)' },
              { label: 'Sponsor', value: f.sponsorIncome, color: 'hsl(195 85% 50%)' },
              { label: 'Prize', value: f.prizeIncome, color: 'hsl(152 60% 48%)' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground font-condensed uppercase tracking-wide">{item.label}</span>
                  <span className="text-xs text-mono font-medium text-foreground">${item.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 14%)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(item.value / totalIn) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceRow({ icon, label, amount, positive }: {
  icon: string; label: string; amount: number; positive: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3" style={{ borderBottom: '1px solid hsl(220 20% 11%)' }}>
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-mono text-sm font-semibold" style={{ color: positive ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
        {positive ? "+" : "-"}${amount.toLocaleString()}
      </span>
    </div>
  );
}
