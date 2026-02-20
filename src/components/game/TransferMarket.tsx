import React, { useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { FreeAgent } from "@/lib/types";

export default function TransferMarket() {
  const { freeAgents, makeTransferOffer, state } = useGame();
  const [contractYears, setContractYears] = useState<1 | 2>(1);
  const [offerResult, setOfferResult] = useState<string | null>(null);

  if (!state) return null;

  const team = state.teams.find(t => t.id === state.selectedTeamId)!;
  const isBLeague = team.division === "lkl";
  const isOffseason = state.phase === "offseason";
  const availableAgents = freeAgents.filter(p => !state.declinedPlayerIds.includes(p.id));

  const handleOffer = (player: FreeAgent) => {
    const { success, reason } = makeTransferOffer(player, contractYears, player.askingSalary);
    if (success) {
      setOfferResult(`✅ ${player.name} signed!`);
    } else {
      const message = reason || `${player.name} declined and left the market.`;
      setOfferResult(`❌ ${message}`);
    }
    setTimeout(() => setOfferResult(null), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header px-4 py-3 rounded-lg">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Transfer Market</h2>
        <p className="text-sm text-muted-foreground">
          {availableAgents.length} free agents available
          {isOffseason && " (Off-season expanded market)"}
        </p>
      </div>

      {/* Market Info Banner */}
      <div className={`border rounded-lg px-4 py-3 space-y-2 ${isBLeague ? "bg-warning/10 border-warning/30" : "bg-primary/10 border-primary/30"}`}>
        <p className={`text-sm font-bold ${isBLeague ? "text-warning" : "text-primary"}`}>
          {isBLeague ? "⚠️ B LEAGUE MARKET - UNCERTAIN RATINGS" : "ℹ️ A LEAGUE MARKET"}
        </p>
        <ul className={`text-xs space-y-1 ml-4 ${isBLeague ? "text-warning" : "text-primary"}`}>
          {isBLeague ? (
            <>
              <li>• Regular Season: {isOffseason ? "10 (now)" : "5 players available"}</li>
              <li>• Off-Season: {isOffseason ? "10 players (current)" : "10 players when in off-season"}</li>
              <li>• Players come FREE (no salary cost)</li>
              <li>• <strong>⚠️ Ratings shown as RANGES (e.g., 40-55)</strong></li>
              <li>• When you sign, player gets RANDOM rating in that range</li>
              <li>• Example: Shows "40-55" → You might get 43, 48, or 52</li>
            </>
          ) : (
            <>
              <li>• Regular Season: {isOffseason ? "18 (now)" : "7 players available"}</li>
              <li>• Off-Season: {isOffseason ? "18 players (current)" : "18 players when in off-season"}</li>
              <li>• Pay transfer fees and salaries</li>
              <li>• Accurate player ratings (exact values shown)</li>
            </>
          )}
        </ul>
      </div>

      {/* Warning */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 space-y-1">
        <p className="text-xs text-warning">⚠️ Declined players are permanently removed from the market this season.</p>
        <p className="text-xs text-warning">⚠️ Maximum squad capacity is 12 players.</p>
      </div>

      {/* Transfer Result */}
      {offerResult && (
        <div className="bg-card border border-border rounded-lg p-4 animate-slide-up">
          <p className="text-sm text-foreground">{offerResult}</p>
        </div>
      )}

      {/* Contract Length - Hide for B League since they're free */}
      {!isBLeague && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Contract:</span>
          {([1, 2] as const).map(yr => (
            <button
              key={yr}
              onClick={() => setContractYears(yr)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                contractYears === yr ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {yr} Year{yr > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Player List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Player</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">OVR</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">Role</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">SHO</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DEF</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DRI</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">PAS</th>
              <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-right">
                {isBLeague ? "Cost" : "Salary"}
              </th>
              <th className="px-4 py-2.5 text-muted-foreground font-medium text-xs text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {availableAgents.map(agent => (
              <tr key={agent.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-2.5">
                  <div>
                    <span className="font-medium text-foreground">{agent.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">Age {agent.age} · {agent.attributes.height}cm</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`text-mono font-bold ${getRatingColor(agent.overall)}`}>{agent.overall}</span>
                  {isBLeague && <span className="text-xs text-destructive ml-1" title="Inflated rating!">⚠️</span>}
                </td>
                <td className={`px-3 py-2.5 text-center font-medium ${getRoleBg(agent.role)}`}>
                  {agent.role.slice(0, 3).toUpperCase()}
                </td>
                <td className={`px-3 py-2.5 text-center text-mono hidden sm:table-cell ${getRatingColor(agent.attributes.shooting)}`}>{agent.attributes.shooting}</td>
                <td className={`px-3 py-2.5 text-center text-mono hidden sm:table-cell ${getRatingColor(agent.attributes.defending)}`}>{agent.attributes.defending}</td>
                <td className={`px-3 py-2.5 text-center text-mono hidden sm:table-cell ${getRatingColor(agent.attributes.dribbling)}`}>{agent.attributes.dribbling}</td>
                <td className={`px-3 py-2.5 text-center text-mono hidden sm:table-cell ${getRatingColor(agent.attributes.passing)}`}>{agent.attributes.passing}</td>
                <td className="px-3 py-2.5 text-right text-mono text-foreground font-medium">
                  {isBLeague ? (
                    <span className="text-success font-bold">FREE</span>
                  ) : (
                    `$${agent.askingSalary.toLocaleString()}`
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => handleOffer(agent)}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                  >
                    Sign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {availableAgents.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No free agents available
          </div>
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
