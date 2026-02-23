import React, { useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { Player, CoachType } from "@/lib/types";
import { TeamLogo } from "./TeamSelect";
import { COACH_DEFS } from "@/components/multiplayer/LobbyScreen";

function getRatingColor(rating: number): string {
  if (rating >= 80) return "hsl(195 85% 50%)";
  if (rating >= 65) return "hsl(152 60% 48%)";
  if (rating >= 50) return "hsl(38 95% 52%)";
  return "hsl(0 72% 58%)";
}

function StatBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 16%)' }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: getRatingColor(value) }} />
    </div>
  );
}

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

  const isHost = !multiplayerLobby || multiplayerLobby.myRole === "host";
  const canIntakeYouth = state.phase === "offseason" &&
    !(isHost ? state.youthIntakeUsed : state.youthIntakeUsedGuest);
  const squadFull = players.length >= 12;

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
        <div className="rounded-xl p-3.5 flex items-center gap-3 border"
          style={{
            borderColor: hasSynergy ? coachDef.color + '55' : 'hsl(220 20% 13%)',
            background: hasSynergy ? coachDef.color + '0E' : 'hsl(220 22% 8%)',
          }}>
          <span className="text-2xl shrink-0">{coachDef.emoji}</span>
          <div className="flex-1">
            <div className="text-xs font-bold font-condensed uppercase tracking-wide flex items-center gap-2"
              style={{ color: hasSynergy ? coachDef.color : 'hsl(210 20% 85%)' }}>
              {coachName ? `${coachName} — ` : ""}{coachDef.label}
              {hasSynergy && (
                <span className="text-[10px] rounded-sm px-1.5 py-0.5 font-black uppercase font-condensed tracking-widest"
                  style={{ background: coachDef.color, color: "#000" }}>SYNERGY ACTIVE</span>
              )}
            </div>
            <div className="text-[11px] mt-0.5 text-muted-foreground">
              {hasSynergy
                ? `✦ ${coachDef.bonus} — lineup matches coach style!`
                : `Needs ${coachDef.synergyRole} dominant lineup for ${coachDef.bonus}`}
            </div>
          </div>
        </div>
      )}

      {/* Squad Header */}
      <div className="rounded-xl p-4" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div className="flex items-center gap-3 mb-1">
          <TeamLogo shortName={team.shortName} color={team.color} size="sm" />
          <h2 className="text-base font-bold font-condensed uppercase tracking-wider text-foreground">{team.shortName} Squad</h2>
          <div className="ml-auto flex items-baseline gap-1">
            <span className="text-2xl font-black text-mono" style={{ color: getRatingColor(teamOVR) }}>{teamOVR}</span>
            <span className="text-xs text-muted-foreground font-condensed">OVR</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {players.length}/12 players · {starters.length}/5 starters set
        </div>
        {squadFull && (
          <div className="text-xs mt-1 font-condensed" style={{ color: 'hsl(0 72% 58%)' }}>
            Squad at maximum capacity (12)
          </div>
        )}
        {starters.length < 5 && (
          <div className="text-xs mt-1 font-condensed" style={{ color: 'hsl(38 95% 55%)' }}>
            {5 - starters.length} starter slot{5 - starters.length > 1 ? "s" : ""} auto-filled from bench
          </div>
        )}
      </div>

      {/* Starters */}
      {starters.length > 0 && (
        <PlayerTable
          title={`Starters (${starters.length}/5)`}
          isStarters={true}
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
          title={`Bench (${bench.length})`}
          isStarters={false}
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
        <div className="rounded-xl p-4" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
          <div className="text-sm font-bold font-condensed uppercase tracking-wide text-foreground mb-1">Youth Intake</div>
          <div className="text-xs text-muted-foreground mb-3">Bring in 3 young prospects (free contracts) — once per off-season</div>
          {canIntakeYouth ? (
            <button
              onClick={intakeYouth}
              disabled={squadFull}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-[0.1em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
              style={{
                background: squadFull ? 'hsl(220 20% 14%)' : 'hsl(38 95% 52%)',
                color: squadFull ? 'hsl(215 15% 40%)' : 'hsl(220 25% 5%)',
                cursor: squadFull ? 'not-allowed' : 'pointer',
              }}
            >
              Run Youth Intake (3 Players)
            </button>
          ) : (
            <div className="text-center py-2">
              <span className="text-sm font-medium font-condensed" style={{ color: 'hsl(152 60% 48%)' }}>
                ✓ Youth intake done for this off-season
              </span>
            </div>
          )}
          {squadFull && canIntakeYouth && (
            <p className="text-xs mt-2 text-center font-condensed" style={{ color: 'hsl(0 72% 58%)' }}>Release players first — squad is full.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerTable({ title, isStarters, players, toggleStarter, releasePlayer, renewContract, teamPrestige, phase }: {
  title: string;
  isStarters: boolean;
  players: Player[];
  toggleStarter: (id: string) => void;
  releasePlayer: (id: string) => void;
  renewContract: (id: string) => { success: boolean; reason?: string };
  teamPrestige: number;
  phase: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{
        borderBottom: '1px solid hsl(220 20% 12%)',
        background: isStarters ? 'hsl(38 95% 52% / 0.08)' : 'hsl(220 20% 9%)',
      }}>
        <h3 className="text-xs font-bold uppercase tracking-wider font-condensed"
          style={{ color: isStarters ? 'hsl(38 95% 55%)' : 'hsl(215 15% 55%)' }}>{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid hsl(220 20% 11%)', background: 'hsl(220 20% 9%)' }}>
            <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">Player</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">OVR</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">Role</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Age</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">Salary</th>
            <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center">CTR</th>
          </tr>
        </thead>
        <tbody>
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

  const roleStyle: Record<string, string> = {
    Sharpshooter: 'hsl(38 95% 55%)',
    Defender: 'hsl(195 85% 50%)',
    Playmaker: 'hsl(152 60% 48%)',
  };

  const handleToggleStarter = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarter(player.id);
  };

  const handleRelease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Release ${player.name}? This cannot be undone.`)) releasePlayer(player.id);
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
      <tr onClick={() => setExpanded(!expanded)}
        className="cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid hsl(220 20% 11%)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'hsl(220 20% 10%)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleStarter}
              className="text-xs px-2 py-1 rounded-lg font-bold transition-all min-w-[28px] cursor-pointer"
              style={{
                background: player.isStarter ? 'hsl(38 95% 52%)' : 'hsl(220 20% 14%)',
                color: player.isStarter ? 'hsl(220 25% 5%)' : 'hsl(215 15% 50%)',
              }}
            >
              {player.isStarter ? "★" : "☆"}
            </button>
            {player.isYouth && (
              <svg viewBox="0 0 24 24" fill="hsl(152 60% 48%)" style={{width:12,height:12}}>
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            )}
            <span className="font-medium text-foreground text-sm">{player.name}</span>
            {(player.seasonsWithoutPlay || 0) > 0 && (
              <span className="text-xs" style={{ color: 'hsl(0 72% 58%)' }} title={`${player.seasonsWithoutPlay} season(s) without play`}>
                ⏳{player.seasonsWithoutPlay}
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-3 text-center">
          <span className="text-mono font-bold text-sm" style={{ color: getRatingColor(player.overall) }}>{player.overall}</span>
        </td>
        <td className="px-2 py-3 text-center text-xs font-bold font-condensed uppercase tracking-wide"
          style={{ color: roleStyle[player.role] || 'hsl(215 15% 55%)' }}>
          {player.role.slice(0, 3)}
        </td>
        <td className="px-2 py-3 text-center text-muted-foreground text-xs hidden sm:table-cell text-mono">
          {player.age}{player.age >= 30 && <span style={{ color: 'hsl(0 72% 58%)' }} className="ml-0.5">!</span>}
        </td>
        <td className="px-2 py-3 text-center text-xs text-mono hidden sm:table-cell">
          {player.salary === 0
            ? <span className="font-bold" style={{ color: 'hsl(152 60% 48%)' }}>FREE</span>
            : <span className="text-muted-foreground">${player.salary.toLocaleString()}</span>}
        </td>
        <td className="px-2 py-3 text-center text-muted-foreground text-xs text-mono">{player.contractYears}yr</td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: 'hsl(220 22% 9%)', borderBottom: '1px solid hsl(220 20% 12%)' }}>
            <div className="px-4 py-3">
              {/* Stat bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  { label: 'SHO', value: player.attributes.shooting },
                  { label: 'DEF', value: player.attributes.defending },
                  { label: 'DRI', value: player.attributes.dribbling },
                  { label: 'PAS', value: player.attributes.passing },
                ].map(attr => (
                  <div key={attr.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-condensed uppercase tracking-wider">{attr.label}</span>
                      <span className="text-[10px] text-mono font-bold" style={{ color: getRatingColor(attr.value) }}>{attr.value}</span>
                    </div>
                    <StatBar value={attr.value} />
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mb-3 flex gap-3">
                <span className="text-mono">{player.attributes.height}cm</span>
                <span>Age {player.age}</span>
                <span className="sm:hidden">
                  {player.salary === 0 ? <span style={{ color: 'hsl(152 60% 48%)' }}>FREE</span> : `$${player.salary.toLocaleString()}/yr`}
                </span>
              </div>
              {player.age < 23 && <div className="text-xs mb-2 font-condensed" style={{ color: 'hsl(152 60% 48%)' }}>Young — develops faster</div>}
              {player.age >= 30 && <div className="text-xs mb-2 font-condensed" style={{ color: 'hsl(0 72% 58%)' }}>Veteran — may retire</div>}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleRelease}
                  className="px-4 py-2 text-xs rounded-lg font-bold font-condensed uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
                  style={{ background: 'hsl(0 72% 55% / 0.15)', color: 'hsl(0 72% 60%)', border: '1px solid hsl(0 72% 55% / 0.3)' }}
                >
                  Release
                </button>
                {player.contractYears === 1 && (
                  <button
                    onClick={handleRenew}
                    className="px-4 py-2 text-xs rounded-lg font-bold font-condensed uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
                    style={{ background: 'hsl(38 95% 52%)', color: 'hsl(220 25% 5%)' }}
                  >
                    {player.isYouth && player.salary === 0 ? "Sign Contract" : "Renew +15%"}
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
