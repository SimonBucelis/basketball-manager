import React from "react";
import { useGame } from "@/hooks/useGameState";
import { SEASON_MODIFIERS, SEASON_BONUSES, DIVISIONS } from "@/lib/gameData";
import { TeamLogo } from "./TeamSelect";

function getTeamStrategy(team: any): string {
  let starters = team.players.filter((p: any) => p.isStarter);
  if (starters.length < 5) {
    const bench = [...team.players.filter((p: any) => !p.isStarter)].sort((a: any, b: any) => b.overall - a.overall);
    starters = [...starters, ...bench.slice(0, 5 - starters.length)];
  }
  if (starters.length < 5) return "balanced";
  const defenders = starters.filter((p: any) => p.role === "Defender").length;
  const sharpshooters = starters.filter((p: any) => p.role === "Sharpshooter").length;
  const playmakers = starters.filter((p: any) => p.role === "Playmaker").length;
  if (defenders >= 3) return "defensive";
  if (sharpshooters >= 3) return "offensive";
  if (playmakers >= 3) return "playmaking";
  return "balanced";
}

function getStrategyBonus(strategy: string, opponentStrategy: string): number {
  if (strategy === "balanced" || opponentStrategy === "balanced") return 0;
  if (strategy === "defensive" && opponentStrategy === "offensive") return 10;
  if (strategy === "offensive" && opponentStrategy === "playmaking") return 10;
  if (strategy === "playmaking" && opponentStrategy === "defensive") return 10;
  return 0;
}

function StrategyIcon({ strategy }: { strategy: string }) {
  if (strategy === "defensive") return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14,color:'hsl(195 85% 50%)'}} title="Defensive">
      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.704-3.08z" clipRule="evenodd" />
    </svg>
  );
  if (strategy === "offensive") return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14,color:'hsl(0 72% 58%)'}} title="Offensive">
      <path d="M10.5 1.875a1.125 1.125 0 012.25 0v8.219c.517.162 1.02.382 1.5.659V3.375a1.125 1.125 0 012.25 0v9.45l.534.03a1.5 1.5 0 011.447 1.59l-.3 5.25a4.5 4.5 0 01-4.49 4.255h-1.443a4.5 4.5 0 01-4.325-3.285l-1.432-5.373a1.125 1.125 0 01.82-1.371 1.125 1.125 0 011.371.821l.803 3.012a.75.75 0 001.45-.386l-.812-3.045a2.625 2.625 0 00-2.53-1.949l-.09-.003A2.625 2.625 0 004.5 14.25v-6a1.125 1.125 0 012.25 0v4.219c.48-.277.983-.497 1.5-.659V3.375a1.125 1.125 0 012.25 0V1.875z" />
    </svg>
  );
  if (strategy === "playmaking") return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14,color:'hsl(38 95% 55%)'}} title="Playmaking">
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-.53 14.03a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V8.25a.75.75 0 00-1.5 0v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3z" clipRule="evenodd" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14,color:'hsl(215 15% 50%)'}} title="Balanced">
      <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
  );
}

export default function Dashboard() {
  const { state, playWeek, startRegularSeason, startNewSeason, simulateAllPlayoffs, setView, freeAgents, seasonBonusChoices, chooseSeasonBonus, multiplayerLobby } = useGame();
  if (!state) return null;

  const playerTeam = state.teams.find(t => t.id === state.selectedTeamId);
  if (!playerTeam) return <div className="p-8 text-center text-muted-foreground">Loading team...</div>;

  const modifierInfo = state.seasonModifier ? SEASON_MODIFIERS.find(m => m.id === state.seasonModifier) : null;
  const bonusInfo = state.seasonBonus ? SEASON_BONUSES.find(b => b.id === state.seasonBonus) : null;
  const divisionName = DIVISIONS.find(d => d.id === playerTeam.division)?.name || "";
  const isBLeague = playerTeam.division === "lkl";

  const standings = [...(state.standings[playerTeam.division] || [])].sort(
    (a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
  );
  const myStanding = standings.find(s => s.teamId === state.selectedTeamId);
  const myRank = standings.findIndex(s => s.teamId === state.selectedTeamId) + 1;
  const playerStrategy = getTeamStrategy(playerTeam);

  const opponentTeamId = multiplayerLobby?.opponentTeamId;
  const myMatches = [...(state.schedule ?? [])].filter(m =>
    m.homeTeamId === state.selectedTeamId || m.awayTeamId === state.selectedTeamId
  );
  const opponentMatches = opponentTeamId ? [...(state.schedule ?? [])].filter(m =>
    (m.homeTeamId === opponentTeamId || m.awayTeamId === opponentTeamId) &&
    m.homeTeamId !== state.selectedTeamId && m.awayTeamId !== state.selectedTeamId
  ) : [];
  const lastMatch = [...myMatches].reverse()[0] ?? null;
  const lastOpponentMatch = [...opponentMatches].reverse()[0] ?? null;

  const f = state.finances;
  const totalIncome = f.ticketIncome + f.sponsorIncome + f.prizeIncome;
  const totalExpenses = f.totalWages + f.transferSpending;
  const net = totalIncome - totalExpenses;

  const manualStarters = playerTeam.players.filter(p => p.isStarter);
  const effectiveStarters = (() => {
    let s = [...manualStarters];
    if (s.length < 5) {
      const bench = [...playerTeam.players.filter(p => !p.isStarter)].sort((a, b) => b.overall - a.overall);
      s = [...s, ...bench.slice(0, 5 - s.length)];
    }
    return s.slice(0, 5);
  })();
  const teamOVR = effectiveStarters.length > 0
    ? Math.round(effectiveStarters.reduce((sum, p) => sum + p.overall, 0) / effectiveStarters.length)
    : 0;

  const divTeamCount = state.teams.filter(t => t.division === playerTeam.division).length;
  const totalSeasonWeeks = 2 * (divTeamCount - 1);
  const displayWeek = state.phase === "preseason" ? 1 : state.week;

  const needsBonusChoice = state.phase === "preseason" && !state.gameOver && !state.seasonBonus && seasonBonusChoices.length > 0;

  const dangerWarning = (() => {
    if (state.phase !== "regular" && state.phase !== "playoffs") return null;
    if (playerTeam.division === "rkl" && myRank >= standings.length - 2 && myRank > 0) {
      return `Relegation zone — rank ${myRank}/${standings.length}. Finish above last place!`;
    }
    if (playerTeam.prestige <= 1 && myRank > Math.ceil(standings.length / 2)) {
      return "Low prestige + poor standings — keep winning or face game over!";
    }
    return null;
  })();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Team Header */}
      <div className="relative overflow-hidden rounded-2xl px-5 py-5 court-arc"
        style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 60% at 0% 50%, ${playerTeam.color}10, transparent)` }} />
        <div className="relative flex items-center gap-4">
          <TeamLogo shortName={playerTeam.shortName} color={playerTeam.color} size="lg" />
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] font-condensed"
              style={{ color: 'hsl(38 95% 55%)' }}>{playerTeam.shortName}</div>
            <h2 className="text-xl font-bold text-foreground leading-tight font-condensed uppercase tracking-wider">{playerTeam.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{divisionName} · Season {state.season}</p>
            {state.coachName && (
              <p className="text-[11px] mt-1 font-condensed tracking-wide" style={{ color: 'hsl(38 95% 55%)' }}>
                {state.coachName}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="font-display text-5xl" style={{ color: playerTeam.color }}>{teamOVR}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5 font-condensed">OVR</div>
          </div>
        </div>
      </div>

      {/* Danger Warning */}
      {dangerWarning && (
        <div className="rounded-xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'hsl(0 72% 55% / 0.08)', border: '1px solid hsl(0 72% 55% / 0.3)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{width:20,height:20,color:'hsl(0 72% 58%)',flexShrink:0}}>
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <div>
            <div className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(0 72% 60%)' }}>Danger Zone</div>
            <div className="text-xs mt-0.5" style={{ color: 'hsl(0 72% 60% / 0.8)' }}>{dangerWarning}</div>
          </div>
        </div>
      )}

      {/* Season Bonus Picker */}
      {needsBonusChoice && (
        <div className="rounded-2xl p-4" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 14%)' }}>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-condensed font-bold">Pick a Season Bonus</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {seasonBonusChoices.map(id => {
              const info = SEASON_BONUSES.find(b => b.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => chooseSeasonBonus(id)}
                  className="flex flex-col items-start gap-1 rounded-xl p-3.5 hover:border-primary hover:bg-primary/5 transition-all text-left active:scale-95 cursor-pointer"
                  style={{ border: '1px solid hsl(220 20% 14%)', background: 'hsl(220 20% 10%)' }}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider font-condensed">{info.name}</span>
                  <span className="text-xs text-muted-foreground">{info.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Off-Season banners */}
      {state.phase === "offseason" && (() => {
        const rklSorted = [...(state.standings["rkl"] || [])].sort((a, b) =>
          b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
        );
        const lklSorted = [...(state.standings["lkl"] || [])].sort((a, b) =>
          b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
        );
        const relegatedId = rklSorted.length > 0 ? rklSorted[rklSorted.length - 1].teamId : null;
        const promotedId  = lklSorted.length > 0 ? lklSorted[0].teamId : null;
        const wasPromoted  = promotedId  === state.selectedTeamId;
        const wasRelegated = relegatedId === state.selectedTeamId;
        return (
          <>
            {wasPromoted && (
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'hsl(152 60% 40% / 0.08)', border: '1px solid hsl(152 60% 40% / 0.3)' }}>
                <div className="text-2xl">🎉</div>
                <div>
                  <div className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(152 60% 48%)' }}>PROMOTED TO A DIVISION!</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Finished 1st in B Division — promoted to RKL next season!</div>
                </div>
              </div>
            )}
            {wasRelegated && (
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: 'hsl(0 72% 55% / 0.08)', border: '1px solid hsl(0 72% 55% / 0.3)' }}>
                <div className="text-2xl">📉</div>
                <div>
                  <div className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(0 72% 58%)' }}>RELEGATED TO B DIVISION</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Finished last in A Division — relegated to LKL next season.</div>
                </div>
              </div>
            )}
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'hsl(38 95% 52% / 0.08)', border: '1px solid hsl(38 95% 52% / 0.25)' }}>
              <div className="text-2xl">🏖️</div>
              <div>
                <div className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(38 95% 55%)' }}>OFF-SEASON</div>
                <div className="text-xs text-muted-foreground mt-0.5">{freeAgents.length} players available · Renew contracts, sign free agents</div>
              </div>
            </div>
            <div className="rounded-xl px-4 py-3.5" style={{ background: 'hsl(38 95% 52% / 0.06)', border: '1px solid hsl(38 95% 52% / 0.2)' }}>
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18,color:'hsl(38 95% 55%)',flexShrink:0,marginTop:2}}>
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(38 95% 55%)' }}>Market Shrinks Next Season</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Off-season: <strong style={{color:'hsl(38 95% 60%)' }}>{isBLeague ? "10–12" : "18–27"} players</strong> available now.{" "}
                    Regular season: drops to <strong style={{color:'hsl(38 95% 60%)'}}>{isBLeague ? "5–6" : "7–11"} players</strong> — sign key players NOW!
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Modifier / Bonus */}
      {modifierInfo && (
        <div className="rounded-xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 14%)' }}>
          <span className="text-2xl">{modifierInfo.emoji}</span>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-condensed font-bold">Season Modifier</div>
            <div className="text-sm font-semibold text-foreground font-condensed">{modifierInfo.name}</div>
            <div className="text-xs text-muted-foreground">{modifierInfo.description}</div>
          </div>
        </div>
      )}
      {bonusInfo && (
        <div className="rounded-xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'hsl(38 95% 52% / 0.06)', border: '1px solid hsl(38 95% 52% / 0.2)' }}>
          <span className="text-2xl">{bonusInfo.emoji}</span>
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-condensed font-bold">Season Bonus</div>
            <div className="text-sm font-semibold font-condensed" style={{ color: 'hsl(38 95% 58%)' }}>{bonusInfo.name}</div>
            <div className="text-xs text-muted-foreground">{bonusInfo.description}</div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Record" value={myStanding ? `${myStanding.wins}-${myStanding.losses}` : "0-0"} />
        <StatCard label="Rank" value={`#${myRank}`} />
        <StatCard label="Week" value={`${displayWeek}/${totalSeasonWeeks}`} />
      </div>

      {/* Finance Card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(220 20% 12%)' }}>
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-condensed font-bold">Finances This Season</span>
        </div>
        <div className="p-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-foreground font-medium">Income</span>
              <span className="text-xs text-muted-foreground ml-2">Tickets + Sponsor</span>
            </div>
            <span className="text-mono text-sm font-bold" style={{ color: 'hsl(152 60% 48%)' }}>+${(f.ticketIncome + f.sponsorIncome).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-foreground font-medium">Expenses</span>
              <span className="text-xs text-muted-foreground ml-2">Wages + Transfers</span>
            </div>
            <span className="text-mono text-sm font-bold" style={{ color: 'hsl(0 72% 58%)' }}>-${(f.totalWages + f.transferSpending).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid hsl(220 20% 14%)' }}>
            <span className="text-sm font-bold text-foreground">Net Result</span>
            <span className="text-mono text-xl font-black" style={{ color: net >= 0 ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
              {net >= 0 ? "+" : ""}${net.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Budget: <span className="text-mono font-semibold text-foreground">${f.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Last Matches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lastMatch && (
          <MatchResultCard match={lastMatch} teams={state.teams} label="Last Match" myTeamId={state.selectedTeamId} />
        )}
        {lastOpponentMatch && opponentTeamId && (
          <MatchResultCard match={lastOpponentMatch} teams={state.teams} label="Opponent's Last" myTeamId={opponentTeamId} />
        )}
      </div>

      {/* Standings Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid hsl(220 20% 12%)' }}>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-condensed font-bold">{divisionName} Standings</span>
          <span className="text-xs text-muted-foreground font-condensed">Strategy</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(220 20% 12%)', background: 'hsl(220 20% 9%)' }}>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs w-6">#</th>
                <th className="text-left px-2 py-2 text-muted-foreground font-medium text-xs">Team</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-8">Strat</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-8">W</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-8">L</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-10 hidden sm:table-cell">PF</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-10 hidden sm:table-cell">PA</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, i) => {
                const team = state.teams.find(t => t.id === entry.teamId);
                if (!team) return null;
                const isPlayer = entry.teamId === state.selectedTeamId;
                const teamStrategy = getTeamStrategy(team);
                const bonusAgainstPlayer = isPlayer ? 0 : getStrategyBonus(teamStrategy, playerStrategy);
                return (
                  <tr key={entry.teamId}
                    style={{
                      borderBottom: '1px solid hsl(220 20% 11%)',
                      background: isPlayer ? 'hsl(38 95% 52% / 0.06)' : 'transparent'
                    }}>
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
                    <td className="px-2 py-2 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <StrategyIcon strategy={teamStrategy} />
                        {bonusAgainstPlayer > 0 && <span className="text-[9px] ml-0.5" style={{ color: 'hsl(152 60% 48%)' }}>+{bonusAgainstPlayer}%</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-mono text-foreground font-medium">{entry.wins}</td>
                    <td className="px-2 py-2 text-center text-mono text-muted-foreground">{entry.losses}</td>
                    <td className="px-2 py-2 text-center text-mono text-muted-foreground hidden sm:table-cell text-xs">{entry.pointsFor}</td>
                    <td className="px-2 py-2 text-center text-mono text-muted-foreground hidden sm:table-cell text-xs">{entry.pointsAgainst}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Game Over */}
      {state.gameOver ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'hsl(0 72% 55% / 0.08)', border: '2px solid hsl(0 72% 55% / 0.3)' }}>
          <div className="font-display text-4xl tracking-widest mb-3" style={{ color: 'hsl(0 72% 58%)' }}>GAME OVER</div>
          <div className="text-sm text-foreground mb-4">{state.gameOverReason}</div>
          <div className="text-xs text-muted-foreground">Refresh the page to start a new career.</div>
        </div>
      ) : (
        <div className="pt-1 space-y-2">
          {state.phase === "preseason" && (
            <PrimaryBtn onClick={startRegularSeason}>Start Regular Season →</PrimaryBtn>
          )}
          {state.phase === "regular" && (() => {
            if (multiplayerLobby) {
              const myReady = multiplayerLobby.myReady;
              const opponentReady = multiplayerLobby.opponentReady;
              return (
                <div className="flex flex-col gap-3">
                  <ReadyIndicator ready={opponentReady} label="Opponent" />
                  <button onClick={playWeek}
                    className="w-full py-4 rounded-xl font-bold text-sm tracking-[0.1em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
                    style={{
                      background: myReady ? 'hsl(152 60% 38%)' : 'hsl(38 95% 52%)',
                      color: 'hsl(220 25% 5%)',
                    }}>
                    {myReady ? "✓ Ready — tap to cancel" : `Ready for Week ${state.week + 1} →`}
                  </button>
                </div>
              );
            }
            return <PrimaryBtn onClick={playWeek}>▶ Play Week {state.week + 1}</PrimaryBtn>;
          })()}
          {state.phase === "playoffs" && (() => {
            const myReady = multiplayerLobby?.myReady ?? false;
            const opponentReady = multiplayerLobby?.opponentReady ?? false;
            return (
              <div className="flex flex-col gap-3">
                {multiplayerLobby && <ReadyIndicator ready={opponentReady} label="Opponent" />}
                <button onClick={simulateAllPlayoffs}
                  className="w-full py-4 rounded-xl font-bold text-sm tracking-[0.1em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
                  style={{
                    background: (multiplayerLobby && myReady) ? 'hsl(152 60% 38%)' : 'hsl(38 95% 52%)',
                    color: 'hsl(220 25% 5%)',
                  }}>
                  {multiplayerLobby ? (myReady ? "✓ Ready — tap to cancel" : "Ready for Playoffs →") : "Simulate All Playoffs →"}
                </button>
                <button onClick={() => setView("playoffs")}
                  className="w-full py-3 rounded-xl border text-sm font-medium font-condensed uppercase tracking-wide transition-all hover:border-primary/40 cursor-pointer"
                  style={{ borderColor: 'hsl(220 20% 16%)', color: 'hsl(215 15% 55%)' }}>
                  View Bracket →
                </button>
              </div>
            );
          })()}
          {state.phase === "offseason" && (
            <div className="flex flex-col gap-3">
              {multiplayerLobby ? (
                <>
                  <ReadyIndicator ready={multiplayerLobby.opponentReady} label="Opponent" />
                  <button onClick={startNewSeason}
                    className="w-full py-4 rounded-xl font-bold text-sm tracking-[0.1em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
                    style={{
                      background: multiplayerLobby.myReady ? 'hsl(152 60% 38%)' : 'hsl(38 95% 52%)',
                      color: 'hsl(220 25% 5%)',
                    }}>
                    {multiplayerLobby.myReady ? "✓ Ready — tap to cancel" : "Ready for Next Season →"}
                  </button>
                </>
              ) : (
                <PrimaryBtn onClick={startNewSeason}>Start New Season →</PrimaryBtn>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full py-4 rounded-xl font-bold text-sm tracking-[0.12em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
      style={{ background: 'hsl(38 95% 52%)', color: 'hsl(220 25% 5%)', boxShadow: '0 0 20px hsl(38 95% 52% / 0.15)' }}>
      {children}
    </button>
  );
}

function ReadyIndicator({ ready, label }: { ready: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="w-2 h-2 rounded-full" style={{ background: ready ? 'hsl(152 60% 48%)' : 'hsl(215 15% 35%)' }} />
      {label} {ready ? "ready ✓" : "not ready"}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3.5 text-center transition-all card-hover"
      style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-bold font-condensed">{label}</div>
      <div className="font-display text-2xl text-foreground mt-1">{value}</div>
    </div>
  );
}

function MatchResultCard({ match, teams, label, myTeamId }: {
  match: any; teams: any[]; label: string; myTeamId: string;
}) {
  const home = teams.find(t => t.id === match.homeTeamId);
  const away = teams.find(t => t.id === match.awayTeamId);
  if (!home || !away) return null;
  const myTeamIsHome = match.homeTeamId === myTeamId;
  const myScore = myTeamIsHome ? match.homeScore : match.awayScore;
  const oppScore = myTeamIsHome ? match.awayScore : match.homeScore;
  const won = myScore > oppScore;

  return (
    <div className="rounded-xl p-4" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-condensed font-bold">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <TeamLogo shortName={home.shortName} color={home.color} size="sm" />
          <span className="text-xs font-semibold text-foreground font-condensed uppercase">{home.shortName}</span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-black text-mono" style={{ color: won ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
            {match.homeScore}–{match.awayScore}
          </div>
          <div className="text-[10px] font-bold uppercase font-condensed tracking-wider" style={{ color: won ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
            {won ? "WIN" : "LOSS"}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs font-semibold text-foreground font-condensed uppercase">{away.shortName}</span>
          <TeamLogo shortName={away.shortName} color={away.color} size="sm" />
        </div>
      </div>
    </div>
  );
}
