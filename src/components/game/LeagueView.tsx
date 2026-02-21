import React from "react";
import { useGame } from "@/hooks/useGameState";
import { DIVISIONS } from "@/lib/gameData";
import { TeamLogo } from "./TeamSelect";

export default function LeagueView() {
  const { state } = useGame();
  if (!state) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header px-4 py-3 rounded-xl">
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
            <div key={div.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                <span className="text-sm text-foreground uppercase tracking-wider font-semibold">{div.name}</span>
                {!isRkl && (
                  <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded font-medium">1 promotion spot</span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs w-6">#</th>
                    <th className="text-left px-2 py-2 text-muted-foreground font-medium text-xs">Team</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">W</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">L</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">PF</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">PA</th>
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
                        className={`${isPlayer ? "bg-primary/10" : ""} ${isPromotion ? "border-l-4 border-l-success" : ""} ${isRelegation ? "border-l-4 border-l-destructive" : ""}`}
                      >
                        <td className="px-3 py-2.5 text-mono text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <TeamLogo shortName={team.shortName} color={team.color} size="sm" />
                            <span className={`font-semibold text-xs ${isPlayer ? "text-primary" : "text-foreground"}`}>
                              {team.shortName}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center text-mono font-medium text-foreground">{entry.wins}</td>
                        <td className="px-2 py-2 text-center text-mono text-muted-foreground">{entry.losses}</td>
                        <td className="px-2 py-2 text-center text-mono text-muted-foreground text-xs">{entry.pointsFor}</td>
                        <td className="px-2 py-2 text-center text-mono text-muted-foreground text-xs">{entry.pointsAgainst}</td>
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
