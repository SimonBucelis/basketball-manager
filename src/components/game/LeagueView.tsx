import React from "react";
import { useGame } from "@/hooks/useGameState";
import { DIVISIONS } from "@/lib/gameData";

export default function LeagueView() {
  const { state } = useGame();
  if (!state) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header px-4 py-3 rounded-lg">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider">League Tables</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DIVISIONS.map(div => {
          const standings = [...(state.standings[div.id] || [])].sort(
            (a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
          );

          if (standings.length === 0) return null;

          const isRkl = div.id === "rkl";

          return (
            <div key={div.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <span className="text-sm text-foreground uppercase tracking-wider font-semibold">{div.name}</span>
                {!isRkl && (
                  <span className="text-[10px] text-muted-foreground bg-success/10 text-success px-2 py-0.5 rounded">1 promotion spot</span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">#</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Team</th>
                    <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">W</th>
                    <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">L</th>
                    <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">PF</th>
                    <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">PA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {standings.map((entry, i) => {
                    const team = state.teams.find(t => t.id === entry.teamId)!;
                    const isPlayer = entry.teamId === state.selectedTeamId;
                    const isPromotion = !isRkl && i === 0;
                    const isRelegation = isRkl && i === standings.length - 1;

                    return (
                      <tr
                        key={entry.teamId}
                        className={`${isPlayer ? "bg-primary/10" : ""} ${isPromotion ? "border-l-2 border-l-success" : ""} ${isRelegation ? "border-l-2 border-l-destructive" : ""}`}
                      >
                        <td className="px-4 py-2 text-mono text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                            <span className={`font-medium ${isPlayer ? "text-primary" : "text-foreground"}`}>
                              {team.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center text-mono text-foreground">{entry.wins}</td>
                        <td className="px-3 py-2 text-center text-mono text-muted-foreground">{entry.losses}</td>
                        <td className="px-3 py-2 text-center text-mono text-muted-foreground">{entry.pointsFor}</td>
                        <td className="px-3 py-2 text-center text-mono text-muted-foreground">{entry.pointsAgainst}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
