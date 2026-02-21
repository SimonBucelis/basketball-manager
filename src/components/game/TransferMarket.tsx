import React, { useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { FreeAgent } from "@/lib/types";

export default function TransferMarket() {
  const { freeAgents, makeTransferOffer, state } = useGame();
  const [contractYears, setContractYears] = useState<1 | 2>(1);
  const [offerResult, setOfferResult] = useState<{ msg: string; ok: boolean } | null>(null);

  if (!state) return null;

  const team = state.teams.find(t => t.id === state.selectedTeamId)!;
  const isBLeague = team.division === "lkl";
  const isOffseason = state.phase === "offseason";
  const availableAgents = freeAgents.filter(p => !state.declinedPlayerIds.includes(p.id));

  const handleOffer = (player: FreeAgent) => {
    const { success, reason } = makeTransferOffer(player, contractYears, player.askingSalary);
    if (success) {
      setOfferResult({ msg: `✅ ${player.name} signed!`, ok: true });
    } else {
      setOfferResult({ msg: `❌ ${reason || `${player.name} declined.`}`, ok: false });
    }
    setTimeout(() => setOfferResult(null), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header px-4 py-3 rounded-xl">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Transfer Market</h2>
        <p className="text-sm text-muted-foreground">
          {availableAgents.length} free agents · {isOffseason ? "Off-season expanded" : "Regular season"}
        </p>
      </div>

      {/* League info */}
      <div className={`border-2 rounded-xl px-4 py-3 ${isBLeague ? "bg-warning/10 border-warning/40" : "bg-primary/10 border-primary/30"}`}>
        <p className={`text-sm font-bold mb-1 ${isBLeague ? "text-warning" : "text-primary"}`}>
          {isBLeague ? "⚠️ B LEAGUE — UNCERTAIN RATINGS" : "ℹ️ A LEAGUE MARKET"}
        </p>
        <p className={`text-xs ${isBLeague ? "text-warning/80" : "text-primary/80"}`}>
          {isBLeague
            ? "Players are FREE. Ratings shown as RANGES — final value is random within range."
            : `${isOffseason ? "18–27" : "7–11"} players available. Exact ratings shown. Pay salary.`}
        </p>
      </div>

      {/* Market shrink warning — offseason only */}
      {isOffseason && (
        <div className="bg-warning/15 border-2 border-warning rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-warning">⚠️ MARKET SHRINKS NEXT SEASON!</p>
          <p className="text-xs text-warning/80 mt-0.5">
            Sign players NOW — regular season market drops to only {isBLeague ? "5–6" : "7–11"} players.
          </p>
        </div>
      )}

      <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3">
        <p className="text-xs text-warning">⚠️ Declined players are permanently removed this season.</p>
        <p className="text-xs text-warning mt-0.5">⚠️ Max squad capacity: 12 players.</p>
      </div>

      {/* Sign result toast */}
      {offerResult && (
        <div className={`border-2 rounded-xl p-4 animate-fade-in ${offerResult.ok ? "bg-success/10 border-success/40" : "bg-destructive/10 border-destructive/40"}`}>
          <p className="text-sm font-semibold text-foreground">{offerResult.msg}</p>
        </div>
      )}

      {/* Contract selector */}
      {!isBLeague && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">Contract:</span>
          {([1, 2] as const).map(yr => (
            <button
              key={yr}
              onClick={() => setContractYears(yr)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                contractYears === yr ? "bg-primary text-primary-foreground shadow" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {yr} Year{yr > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Player list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Player</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center">OVR</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center">Role</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">SHO</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DEF</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DRI</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">PAS</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-right">{isBLeague ? "Cost" : "Salary"}</th>
              <th className="px-4 py-2.5 text-muted-foreground font-medium text-xs text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {availableAgents.map(agent => {
              const isTitas = !!(agent as any).isTitasSamsonas;
              return (
                <tr key={agent.id} className={`hover:bg-secondary/20 transition-colors ${isTitas ? "bg-yellow-500/5" : ""}`}>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`font-semibold ${isTitas ? "text-yellow-400" : "text-foreground"}`}>{agent.name}</span>
                      {isTitas && <span className="ml-2 text-xs font-bold text-yellow-500 animate-pulse">⭐ LEGENDA</span>}
                      <div className="text-xs text-muted-foreground">Age {agent.age} · {agent.attributes.height}cm</div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className={`text-mono font-bold ${getRatingColor(agent.overall)}`}>{agent.overall}</span>
                  </td>
                  <td className={`px-2 py-3 text-center text-xs font-semibold ${getRoleBg(agent.role)}`}>
                    {agent.role.slice(0, 3).toUpperCase()}
                  </td>
                  <td className={`px-2 py-3 text-center text-mono text-xs hidden sm:table-cell ${getRatingColor(agent.attributes.shooting)}`}>{agent.attributes.shooting}</td>
                  <td className={`px-2 py-3 text-center text-mono text-xs hidden sm:table-cell ${getRatingColor(agent.attributes.defending)}`}>{agent.attributes.defending}</td>
                  <td className={`px-2 py-3 text-center text-mono text-xs hidden sm:table-cell ${getRatingColor(agent.attributes.dribbling)}`}>{agent.attributes.dribbling}</td>
                  <td className={`px-2 py-3 text-center text-mono text-xs hidden sm:table-cell ${getRatingColor(agent.attributes.passing)}`}>{agent.attributes.passing}</td>
                  <td className="px-2 py-3 text-right text-mono font-semibold text-sm">
                    {isBLeague ? <span className="text-success font-bold">FREE</span> : `$${agent.askingSalary.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleOffer(agent)}
                      className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow"
                    >
                      Sign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {availableAgents.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No free agents available</div>
        )}
      </div>
    </div>
  );
}

function getRoleBg(role: string): string {
  switch (role) {
    case "Sharpshooter": return "text-warning";
    case "Defender": return "text-primary";
    case "Playmaker": return "text-success";
    default: return "text-muted-foreground";
  }
}

function getRatingColor(rating: number): string {
  if (rating >= 75) return "text-success";
  if (rating >= 55) return "text-warning";
  return "text-destructive";
}
