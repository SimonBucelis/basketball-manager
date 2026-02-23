import React from "react";
import { useGame } from "@/hooks/useGameState";
import { DIVISIONS } from "@/lib/gameData";
import { TeamLogo } from "./TeamSelect";

export default function LeagueView() {
  const { state } = useGame();
  if (!state) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header py-3 rounded-xl">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider font-condensed">League Tables</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DIVISIONS.map(div => {
          const standings = [...(state.standings[div.id] || [])].sort(
            (a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
          );
          if (standings.length === 0) return null;
          const isRkl = div.id === "rkl";

          return (
            <div key={div.id} className="rounded-xl overflow-hidden"
              style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: '1px solid hsl(220 20% 12%)', background: 'hsl(220 20% 9%)' }}>
                <span className="text-sm font-bold font-condensed uppercase tracking-wider text-foreground">{div.name}</span>
                {!isRkl && (
                  <span className="badge-cyan">1 Promotion Spot</span>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(220 20% 11%)', background: 'hsl(220 20% 9%)' }}>
                    <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs w-6">#</th>
                    <th className="text-left px-2 py-2 text-muted-foreground font-medium text-xs">Team</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">W</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">L</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">PF</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">PA</th>
                    <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DIFF</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((entry, i) => {
                    const team = state.teams.find(t => t.id === entry.teamId)!;
                    const isPlayer = entry.teamId === state.selectedTeamId;
                    const isPromotion = !isRkl && i === 0;
                    const isRelegation = isRkl && i === standings.length - 1;
                    const diff = entry.pointsFor - entry.pointsAgainst;

                    return (
                      <tr
                        key={entry.teamId}
                        style={{
                          borderBottom: '1px solid hsl(220 20% 11%)',
                          background: isPlayer ? 'hsl(38 95% 52% / 0.06)' : 'transparent',
                          borderLeft: isPromotion ? '3px solid hsl(152 60% 48%)' : isRelegation ? '3px solid hsl(0 72% 55%)' : '3px solid transparent',
                        }}
                      >
                        <td className="px-3 py-2.5 text-mono text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <TeamLogo shortName={team.shortName} color={team.color} size="sm" />
                            <span className="font-semibold text-xs font-condensed uppercase tracking-wide"
                              style={{ color: isPlayer ? 'hsl(38 95% 55%)' : 'hsl(210 20% 88%)' }}>
                              {team.shortName}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center text-mono font-medium text-foreground">{entry.wins}</td>
                        <td className="px-2 py-2 text-center text-mono text-muted-foreground">{entry.losses}</td>
                        <td className="px-2 py-2 text-center text-mono text-muted-foreground text-xs">{entry.pointsFor}</td>
                        <td className="px-2 py-2 text-center text-mono text-muted-foreground text-xs">{entry.pointsAgainst}</td>
                        <td className="px-2 py-2 text-center text-mono text-xs hidden sm:table-cell"
                          style={{ color: diff >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
                          {diff >= 0 ? '+' : ''}{diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Legend */}
              <div className="px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground font-condensed"
                style={{ borderTop: '1px solid hsl(220 20% 11%)' }}>
                {!isRkl && <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'hsl(152 60% 48%)' }} />
                  Promotion
                </span>}
                {isRkl && <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'hsl(0 72% 55%)' }} />
                  Relegation
                </span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
