import React, { useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { Player, CoachType } from "@/lib/types";
import { TeamLogo } from "./TeamSelect";
import { COACH_DEFS } from "@/components/multiplayer/LobbyScreen";

function getStarterStrategy(players: Player[]): string {
  let starters = players.filter(p => p.isStarter);
  if (starters.length < 5) {
    const fill = [...players.filter(p => !p.isStarter)].sort((a, b) => b.overall - a.overall).slice(0, 5 - starters.length);
    starters = [...starters, ...fill];
  }
  if (starters.length < 5) return "balanced";
  const defenders = starters.filter(p => p.role === "Defender").length;
  const sharpshooters = starters.filter(p => p.role === "Sharpshooter").length;
  const playmakers = starters.filter(p => p.role === "Playmaker").length;
  const maxCount = Math.max(defenders, sharpshooters, playmakers);
  if (maxCount >= 2) {
    if (defenders === maxCount) return "defensive";
    if (sharpshooters === maxCount) return "offensive";
    if (playmakers === maxCount) return "playmaking";
  }
  return "balanced";
}

export default function SquadView() {
  const { state, intakeYouth, toggleStarter, releasePlayer, renewContract, multiplayerLobby } = useGame();
  if (!state) return null;

  const team = state.teams.find(t => t.id === state.selectedTeamId)!;
  const players = team.players;
  const starters = players.filter(p => p.isStarter);
  const bench = players.filter(p => !p.isStarter);

  // Effective starters for OVR display
  const effectiveStarters = (() => {
    let s = [...starters];
    if (s.length < 5) {
      const fill = [...bench].sort((a, b) => b.overall - a.overall).slice(0, 5 - s.length);
      s = [...s, ...fill];
    }
    return s.slice(0, 5);
  })();
  const teamOVR = effectiveStarters.length > 0
    ? Math.round(effectiveStarters.reduce((s, p) => s + p.overall, 0) / effectiveStarters.length)
    : 0;

  // Determine youth intake eligibility for this player
  const isHost = !multiplayerLobby || multiplayerLobby.myRole === "host";
  const canIntakeYouth = state.phase === "offseason" &&
    !(isHost ? state.youthIntakeUsed : state.youthIntakeUsedGuest);
  const squadFull = players.length >= 12;

  // Coach synergy calculation
  const coachType = state.coachType as CoachType | undefined;
  const coachName = state.coachName;
  const coachDef = coachType ? COACH_DEFS.find(c => c.type === coachType) : null;
  const starterStrategy = getStarterStrategy(players);
  const hasSynergy = coachType && (
    (coachType === "attack"     && starterStrategy === "offensive") ||
    (coachType === "defense"    && starterStrategy === "defensive") ||
    (coachType === "playmaking" && starterStrategy === "playmaking")
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Coach Synergy Card */}
      {coachDef && (
        <div
          className="rounded-xl p-3 border flex items-center gap-3"
          style={{
            borderColor: hasSynergy ? coachDef.color + "88" : "#ffffff22",
            background: hasSynergy ? coachDef.color + "18" : "transparent",
          }}
        >
          <span className="text-2xl">{coachDef.emoji}</span>
          <div className="flex-1">
            <div className="text-xs font-bold text-foreground flex items-center gap-2">
              {coachName ? `${coachName} — ` : ""}{coachDef.label}
              {hasSynergy && (
                <span
                  className="text-[10px] rounded px-1.5 py-0.5 font-black uppercase"
                  style={{ background: coachDef.color, color: "#000" }}
                >
                  SYNERGY ACTIVE
                </span>
              )}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: hasSynergy ? coachDef.color : undefined }}>
              {hasSynergy
                ? `✦ ${coachDef.bonus} — your lineup matches coach style!`
                : `Needs ${coachDef.synergyRole} dominant lineup for ${coachDef.bonus}`
              }
            </div>
          </div>
        </div>
      )}

      {/* Squad Header */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-1">
          <TeamLogo shortName={team.shortName} color={team.color} size="sm" />
          <h2 className="text-base font-bold text-foreground">{team.shortName} Squad</h2>
          <span className={`ml-auto text-2xl font-black text-mono ${teamOVR >= 75 ? "text-success" : teamOVR >= 55 ? "text-warning" : "text-destructive"}`}>{teamOVR}</span>
          <span className="text-xs text-muted-foreground">OVR</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {players.length}/12 players · {starters.length}/5 starters set
        </div>
        {squadFull && <div className="text-xs text-destructive mt-1 font-medium">⚠️ Squad at maximum capacity (12)</div>}
        {starters.length < 5 && (
          <div className="text-xs text-warning mt-1">⚡ {5 - starters.length} starter slot{5 - starters.length > 1 ? "s" : ""} auto-filled from bench</div>
        )}
      </div>

      {/* Starters */}
      {starters.length > 0 && (
        <PlayerTable
          title={`🏀 STARTERS (${starters.length}/5)`}
          titleClass="text-primary"
          headerClass="bg-primary/10"
          players={starters}
          toggleStarter={toggleStarter}
          releasePlayer={releasePlayer}
          renewContract={renewContract}
          teamPrestige={team.prestige}
          phase={state.phase}
        />
      )}

      {/* Bench */}
      {bench.length > 0 && (
        <PlayerTable
          title={`BENCH (${bench.length})`}
          titleClass="text-muted-foreground"
          headerClass="bg-secondary/30"
          players={bench}
          toggleStarter={toggleStarter}
          releasePlayer={releasePlayer}
          renewContract={renewContract}
          teamPrestige={team.prestige}
          phase={state.phase}
        />
      )}

      {/* Youth Intake */}
      {state.phase === "offseason" && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-sm font-bold text-foreground mb-1">🌱 Youth Intake</div>
          <div className="text-xs text-muted-foreground mb-3">Bring in 3 young prospects (free contracts) — once per off-season</div>
          {canIntakeYouth ? (
            <button
              onClick={intakeYouth}
              disabled={squadFull}
              className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-95 shadow-md ${
                squadFull
                  ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              🧑‍🌾 Run Youth Intake (3 Players)
            </button>
          ) : (
            <div className="text-center py-3">
              <span className="text-success text-sm font-medium">✅ Youth intake done for this off-season</span>
            </div>
          )}
          {squadFull && canIntakeYouth && (
            <p className="text-xs text-destructive mt-2 text-center">Release players first — squad is full.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerTable({
  title, titleClass, headerClass, players, toggleStarter, releasePlayer, renewContract, teamPrestige, phase
}: {
  title: string;
  titleClass: string;
  headerClass: string;
  players: Player[];
  toggleStarter: (id: string) => void;
  releasePlayer: (id: string) => void;
  renewContract: (id: string) => { success: boolean; reason?: string };
  teamPrestige: number;
  phase: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className={`px-4 py-2.5 border-b border-border ${headerClass}`}>
        <h3 className={`text-xs font-bold uppercase tracking-wider ${titleClass}`}>{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/20">
            <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Player</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">OVR</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">Role</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Age</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Salary</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">CTR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {[...players].sort((a, b) => b.overall - a.overall).map(player => (
            <PlayerRow
              key={player.id}
              player={player}
              toggleStarter={toggleStarter}
              releasePlayer={releasePlayer}
              renewContract={renewContract}
              teamPrestige={teamPrestige}
              phase={phase}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerRow({ player, toggleStarter, releasePlayer, renewContract, teamPrestige, phase }: {
  player: Player;
  toggleStarter: (id: string) => void;
  releasePlayer: (id: string) => void;
  renewContract: (id: string) => { success: boolean; reason?: string };
  teamPrestige: number;
  phase: string;
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
      message = `Sign ${player.name} to paid contract?\nNew salary: $${newSalary.toLocaleString()} (currently FREE)`;
    } else {
      const prestigeBonus = 1 + (teamPrestige * 0.10);
      newSalary = Math.round(player.salary * 1.15 * prestigeBonus);
      message = `Renew ${player.name}'s contract?\nNew salary: $${newSalary.toLocaleString()}`;
    }
    if (confirm(message)) {
      const result = renewContract(player.id);
      if (!result.success) alert(result.reason || "Cannot renew contract");
    }
  };

  return (
    <>
      <tr onClick={() => setExpanded(!expanded)} className="cursor-pointer hover:bg-secondary/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStarter}
              className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors min-w-[28px] ${
                player.isStarter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {player.isStarter ? "★" : "☆"}
            </button>
            {player.isYouth && <span className="text-xs">🌟</span>}
            <span className="font-medium text-foreground text-sm">{player.name}</span>
            {(player.seasonsWithoutPlay || 0) > 0 && (
              <span className="text-xs text-destructive" title={`${player.seasonsWithoutPlay} season(s) without play`}>⏳{player.seasonsWithoutPlay}</span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 text-center">
          <span className={`text-mono font-bold text-sm ${getRatingColor(player.overall)}`}>{player.overall}</span>
        </td>
        <td className={`px-2 py-3 text-center text-xs font-semibold ${roleColors[player.role] || ""}`}>
          {player.role.slice(0, 3).toUpperCase()}
        </td>
        <td className="px-2 py-3 text-center text-muted-foreground text-xs hidden sm:table-cell">
          {player.age}{player.age >= 30 && <span className="text-destructive ml-1">⚠</span>}
        </td>
        <td className="px-2 py-3 text-center text-mono text-muted-foreground text-xs hidden sm:table-cell">
          {player.salary === 0 ? <span className="text-success font-bold">FREE</span> : `$${player.salary.toLocaleString()}`}
        </td>
        <td className="px-2 py-3 text-center text-muted-foreground text-xs">{player.contractYears}yr</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="px-4 py-3 bg-secondary/10">
            <div className="grid grid-cols-5 gap-2 max-w-md mb-3">
              <AttrBadge label="Height" value={`${player.attributes.height}cm`} />
              <AttrBadge label="SHO" value={`${player.attributes.shooting}`} rating={player.attributes.shooting} />
              <AttrBadge label="DEF" value={`${player.attributes.defending}`} rating={player.attributes.defending} />
              <AttrBadge label="DRI" value={`${player.attributes.dribbling}`} rating={player.attributes.dribbling} />
              <AttrBadge label="PAS" value={`${player.attributes.passing}`} rating={player.attributes.passing} />
            </div>
            <div className="text-xs text-muted-foreground mb-3 sm:hidden">
              Age {player.age} · {player.salary === 0 ? <span className="text-success font-bold">FREE</span> : `$${player.salary.toLocaleString()}/yr`}
            </div>
            {player.age < 23 && <div className="text-xs text-success mb-2">🌱 Young — develops faster</div>}
            {player.age >= 30 && <div className="text-xs text-destructive mb-2">⚠️ Veteran — may retire</div>}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleRelease}
                className="px-4 py-2 text-xs bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all font-semibold"
              >
                🚫 Release
              </button>
              {player.contractYears === 1 && (
                <button
                  onClick={handleRenew}
                  className="px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all font-semibold"
                >
                  {player.isYouth && player.salary === 0 ? "📝 Sign Contract" : "↻ Renew (+15%)"}
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
    <div className="text-center bg-card border border-border rounded-lg p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold text-mono ${rating ? getRatingColor(rating) : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function getRatingColor(rating: number): string {
  if (rating >= 75) return "text-success";
  if (rating >= 55) return "text-warning";
  return "text-destructive";
}
