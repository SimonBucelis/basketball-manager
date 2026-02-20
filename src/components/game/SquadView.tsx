import React, { useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { Player } from "@/lib/types";

export default function SquadView() {
  const { state, intakeYouth, toggleStarter, releasePlayer, renewContract } = useGame();
  if (!state) return null;

  const team = state.teams.find(t => t.id === state.selectedTeamId)!;
  const players = team.players;
  const starters = players.filter(p => p.isStarter);
  const bench = players.filter(p => !p.isStarter);

  const avgAttrs = players.length > 0 ? {
    height: Math.round(players.reduce((s, p) => s + p.attributes.height, 0) / players.length),
    shooting: Math.round(players.reduce((s, p) => s + p.attributes.shooting, 0) / players.length),
    defending: Math.round(players.reduce((s, p) => s + p.attributes.defending, 0) / players.length),
    dribbling: Math.round(players.reduce((s, p) => s + p.attributes.dribbling, 0) / players.length),
    passing: Math.round(players.reduce((s, p) => s + p.attributes.passing, 0) / players.length),
  } : null;

  const avgOverall = players.length > 0
    ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length)
    : 0;

  const canIntakeYouth = (state.phase === "preseason" || state.phase === "offseason") && !state.youthIntakeUsed;
  const squadFull = players.length >= 12;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="fm-header px-4 py-3 rounded-lg">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider">Squad</h2>
        <p className="text-sm text-muted-foreground">
          {players.length}/12 players · {starters.length}/5 starters · Avg OVR {avgOverall}
        </p>
        {squadFull && (
          <p className="text-xs text-destructive mt-1">⚠️ Squad at maximum capacity</p>
        )}
      </div>

      {/* Team Averages */}
      {avgAttrs && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Team Averages</div>
          <div className="grid grid-cols-5 gap-2">
            <MiniStat label="HGT" value={`${avgAttrs.height}`} />
            <MiniStat label="SHO" value={`${avgAttrs.shooting}`} rating={avgAttrs.shooting} />
            <MiniStat label="DEF" value={`${avgAttrs.defending}`} rating={avgAttrs.defending} />
            <MiniStat label="DRI" value={`${avgAttrs.dribbling}`} rating={avgAttrs.dribbling} />
            <MiniStat label="PAS" value={`${avgAttrs.passing}`} rating={avgAttrs.passing} />
          </div>
        </div>
      )}

      {/* Starters Section */}
      {starters.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-primary/10 border-b border-border">
            <h3 className="text-sm font-bold text-primary">🏀 STARTERS ({starters.length}/5)</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Player</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">OVR</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">Role</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Age</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Salary</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {starters.sort((a, b) => b.overall - a.overall).map(player => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  toggleStarter={toggleStarter}
                  releasePlayer={releasePlayer}
                  renewContract={renewContract}
                  teamPrestige={team.prestige}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bench Section */}
      {bench.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/50 border-b border-border">
            <h3 className="text-sm font-bold text-muted-foreground">BENCH ({bench.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Player</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">OVR</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">Role</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Age</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Salary</th>
                <th className="px-3 py-2.5 text-muted-foreground font-medium text-xs text-center">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bench.sort((a, b) => b.overall - a.overall).map(player => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  toggleStarter={toggleStarter}
                  releasePlayer={releasePlayer}
                  renewContract={renewContract}
                  teamPrestige={team.prestige}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Youth Intake Button */}
      {canIntakeYouth && (
        <div className="flex flex-col items-center pt-2 space-y-2">
          <button
            onClick={intakeYouth}
            disabled={squadFull}
            className={`px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-opacity ${
              squadFull
                ? "bg-secondary text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
            }`}
          >
            🧑‍🌾 Youth Intake (2 Players)
          </button>
          {squadFull && (
            <p className="text-xs text-muted-foreground">
              Squad is full. Release some players before youth intake.
            </p>
          )}
          {state.youthIntakeUsed && (
            <p className="text-xs text-muted-foreground">
              Youth intake already used this season
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player, toggleStarter, releasePlayer, renewContract, teamPrestige }: { 
  player: Player; 
  toggleStarter: (id: string) => void;
  releasePlayer: (id: string) => void;
  renewContract: (id: string) => { success: boolean; reason?: string };
  teamPrestige: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const roleColors: Record<string, string> = {
    Sharpshooter: "text-warning",
    Defender: "text-primary",
    Playmaker: "text-success",
  };

  const handleToggleStarter = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarter(player.id);
  };

  const handleRelease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Release ${player.name}? This cannot be undone.`)) {
      releasePlayer(player.id);
    }
  };

  const handleRenew = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newSalary: number;
    let message: string;
    
    if (player.isYouth && player.salary === 0) {
      const prestigeBonus = 1 + (teamPrestige * 0.10);
      newSalary = Math.round(player.overall * 100 * prestigeBonus);
      message = `Sign ${player.name} to paid contract for 1 more year?\nNew salary: $${newSalary.toLocaleString()} (currently FREE)`;
    } else {
      const prestigeBonus = 1 + (teamPrestige * 0.10);
      newSalary = Math.round(player.salary * 1.15 * prestigeBonus);
      message = `Renew ${player.name}'s contract for 1 more year?\nNew salary: $${newSalary.toLocaleString()}`;
    }
    
    if (confirm(message)) {
      const result = renewContract(player.id);
      if (!result.success) {
        alert(result.reason || "Cannot renew contract");
      }
    }
  };

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer hover:bg-secondary/30 transition-colors"
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStarter}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                player.isStarter
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
              title={player.isStarter ? "Remove from starters" : "Set as starter"}
            >
              {player.isStarter ? "★" : "☆"}
            </button>
            {player.isYouth && <span className="text-xs">🌟</span>}
            <span className="font-medium text-foreground">{player.name}</span>
            {(player.seasonsWithoutPlay || 0) > 0 && (
              <span className="text-xs text-destructive" title={`${player.seasonsWithoutPlay} season(s) without play`}>
                ⏳{player.seasonsWithoutPlay}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-center">
          <span className={`text-mono font-bold ${getRatingColor(player.overall)}`}>
            {player.overall}
          </span>
        </td>
        <td className={`px-3 py-2.5 text-center font-medium ${roleColors[player.role] || ""}`}>
          {player.role.slice(0, 3).toUpperCase()}
        </td>
        <td className="px-3 py-2.5 text-center text-muted-foreground hidden sm:table-cell">
          {player.age}
          {player.age >= 30 && <span className="text-destructive ml-1">⚠</span>}
        </td>
        <td className="px-3 py-2.5 text-center text-mono text-muted-foreground hidden sm:table-cell">
          {player.salary === 0 ? (
            <span className="text-success font-bold">FREE</span>
          ) : (
            `$${player.salary.toLocaleString()}`
          )}
        </td>
        <td className="px-3 py-2.5 text-center text-muted-foreground">{player.contractYears}yr</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-panel">
            <div className="grid grid-cols-5 gap-3 max-w-md">
              <AttrBadge label="Height" value={`${player.attributes.height}cm`} />
              <AttrBadge label="Shooting" value={`${player.attributes.shooting}`} rating={player.attributes.shooting} />
              <AttrBadge label="Defending" value={`${player.attributes.defending}`} rating={player.attributes.defending} />
              <AttrBadge label="Dribbling" value={`${player.attributes.dribbling}`} rating={player.attributes.dribbling} />
              <AttrBadge label="Passing" value={`${player.attributes.passing}`} rating={player.attributes.passing} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground sm:hidden">
              Age {player.age} · {player.salary === 0 ? <span className="text-success font-bold">FREE</span> : `$${player.salary.toLocaleString()}/yr`}
            </div>
            {player.age < 23 && (
              <div className="mt-2 text-xs text-success">
                🌱 Young player - develops faster
              </div>
            )}
            {player.age >= 30 && (
              <div className="mt-2 text-xs text-destructive">
                ⚠️ Veteran - may retire due to stress
              </div>
            )}
            {/* Action Buttons */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleRelease}
                className="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity font-medium"
              >
                🚫 Release Player
              </button>
              {player.contractYears === 1 && (
                <button
                  onClick={handleRenew}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity font-medium"
                >
                  {player.isYouth && player.salary === 0 ? "📝 Sign Contract" : "↻ Renew Contract (+15%)"}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AttrBadge({ label, value, rating }: { label: string; value: string; rating?: number }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold text-mono ${rating ? getRatingColor(rating) : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value, rating }: { label: string; value: string; rating?: number }) {
  return (
    <div className="text-center bg-panel rounded p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-base font-bold text-mono ${rating ? getRatingColor(rating) : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function getRatingColor(rating: number): string {
  if (rating >= 75) return "text-success";
  if (rating >= 55) return "text-warning";
  return "text-destructive";
}
