import React from "react";
import { useGame } from "@/hooks/useGameState";

export default function FinanceView() {
  const { state } = useGame();
  if (!state) return null;

  const f = state.finances;
  const totalIncome = f.ticketIncome + f.sponsorIncome + f.prizeIncome;
  const totalExpenses = f.totalWages + f.transferSpending;
  const net = totalIncome - totalExpenses;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="fm-header px-3 py-2 rounded-lg">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Finances</h2>
        <p className="text-xs text-muted-foreground">All income halved this season</p>
      </div>

      {/* Income */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-success/5">
          <span className="text-xs text-success uppercase tracking-wider font-medium">Income</span>
        </div>
        <div className="divide-y divide-border">
          <FinanceRow label="Ticket Sales" amount={f.ticketIncome} positive />
          <FinanceRow label="Sponsorship" amount={f.sponsorIncome} positive />
          <FinanceRow label="Prize Money" amount={f.prizeIncome} positive />
          <FinanceRow label="Total Income" amount={totalIncome} positive bold />
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-destructive/5">
          <span className="text-xs text-destructive uppercase tracking-wider font-medium">Expenses</span>
        </div>
        <div className="divide-y divide-border">
          <FinanceRow label="Total Wages" amount={f.totalWages} />
          <FinanceRow label="Transfer Spending" amount={f.transferSpending} />
          <FinanceRow label="Total Expenses" amount={totalExpenses} bold />
        </div>
      </div>

      {/* Net */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-foreground">Net Result</span>
          <span className={`text-mono text-lg font-bold ${net >= 0 ? "text-success" : "text-destructive"}`}>
            {net >= 0 ? "+" : ""}${net.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function FinanceRow({ label, amount, positive, bold }: {
  label: string; amount: number; positive?: boolean; bold?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center px-3 py-2 ${bold ? "bg-secondary/30" : ""}`}>
      <span className={`text-xs ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-mono text-xs ${bold ? "font-bold" : "font-medium"} ${positive ? "text-success" : "text-destructive"}`}>
        {positive ? "+" : "-"}${amount.toLocaleString()}
      </span>
    </div>
  );
}
