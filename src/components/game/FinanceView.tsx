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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header px-4 py-3 rounded-xl">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Finances</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Season {state.season} financial summary</p>
      </div>

      {/* Income Block */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-success/5 flex items-center justify-between">
          <span className="text-sm font-bold text-success uppercase tracking-wider">📈 Income</span>
          <span className="text-mono text-sm font-bold text-success">+${(income + prizeIncome).toLocaleString()}</span>
        </div>
        <div className="divide-y divide-border">
          <FinanceRow label="🎫 Ticket Sales" amount={f.ticketIncome} positive />
          <FinanceRow label="📢 Sponsorship" amount={f.sponsorIncome} positive />
          <FinanceRow label="🏆 Prize Money" amount={f.prizeIncome} positive />
        </div>
      </div>

      {/* Expenses Block */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-destructive/5 flex items-center justify-between">
          <span className="text-sm font-bold text-destructive uppercase tracking-wider">📉 Expenses</span>
          <span className="text-mono text-sm font-bold text-destructive">-${expenses.toLocaleString()}</span>
        </div>
        <div className="divide-y divide-border">
          <FinanceRow label="💰 Player Wages" amount={f.totalWages} />
          <FinanceRow label="🔄 Transfer Spending" amount={f.transferSpending} />
        </div>
      </div>

      {/* Net Result */}
      <div className={`rounded-xl border-2 p-5 ${net >= 0 ? "bg-success/10 border-success/40" : "bg-destructive/10 border-destructive/40"}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Net Result</div>
            <div className="text-sm text-muted-foreground mt-0.5">Income − Expenses</div>
          </div>
          <span className={`text-mono text-3xl font-black ${net >= 0 ? "text-success" : "text-destructive"}`}>
            {net >= 0 ? "+" : ""}${net.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Budget */}
      <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Available Budget</div>
          <div className="text-xs text-muted-foreground mt-0.5">Cash on hand for transfers</div>
        </div>
        <span className="text-mono text-xl font-bold text-foreground">${f.balance.toLocaleString()}</span>
      </div>
    </div>
  );
}

function FinanceRow({ label, amount, positive }: {
  label: string; amount: number; positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-mono text-sm font-semibold ${positive ? "text-success" : "text-destructive"}`}>
        {positive ? "+" : "-"}${amount.toLocaleString()}
      </span>
    </div>
  );
}
