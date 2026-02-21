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

  // Match history: show MY matches + opponent's matches (for cross-league multiplayer)
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

  // Finances
  const f = state.finances;
  const totalIncome = f.ticketIncome + f.sponsorIncome + f.prizeIncome;
  const totalExpenses = f.totalWages + f.transferSpending;
  const net = totalIncome - totalExpenses;

  // Effective lineup
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

  // Danger warning: bottom 3 places in A Division OR prestige ≤ 1
  const dangerWarning = (() => {
    if (state.phase !== "regular" && state.phase !== "playoffs") return null;
    if (playerTeam.division === "rkl" && myRank >= standings.length - 2 && myRank > 0) {
      return `⚠️ DANGER: You're in relegation zone (rank ${myRank}/${standings.length}). Finish above last place!`;
    }
    if (playerTeam.prestige <= 1 && myRank > Math.ceil(standings.length / 2)) {
      return "⚠️ WARNING: Low prestige + poor standings — keep winning or face game over!";
    }
    return null;
  })();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Team Header */}
      <div className="fm-header px-4 py-4 rounded-xl">
        <div className="flex items-center gap-4">
          <TeamLogo shortName={playerTeam.shortName} color={playerTeam.color} size="lg" />
          <div className="flex-1">
            <div className="text-xs font-bold text-primary uppercase tracking-wider">{playerTeam.shortName}</div>
            <h2 className="text-lg font-bold text-foreground leading-tight">{playerTeam.name}</h2>
            <p className="text-sm text-muted-foreground">{divisionName} · Season {state.season}</p>
            {state.coachName && (
              <p className="text-xs text-primary font-medium mt-0.5">🎽 Coach: {state.coachName}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-mono" style={{ color: playerTeam.color }}>{teamOVR}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Team OVR</div>
          </div>
        </div>
      </div>

      {/* Danger Warning */}
      {dangerWarning && (
        <div className="bg-destructive/15 border-2 border-destructive rounded-xl px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🚨</span>
          <div>
            <div className="text-sm font-bold text-destructive">DANGER ZONE</div>
            <div className="text-xs text-destructive/80 mt-0.5">{dangerWarning}</div>
          </div>
        </div>
      )}

      {/* Season Bonus Picker */}
      {needsBonusChoice && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">🎁 Pick a Season Bonus</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {seasonBonusChoices.map(id => {
              const info = SEASON_BONUSES.find(b => b.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => chooseSeasonBonus(id)}
                  className="flex flex-col items-start gap-1 border-2 border-border rounded-xl p-3 hover:border-primary hover:bg-primary/5 transition-all text-left active:scale-95"
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{info.name}</span>
                  <span className="text-xs text-muted-foreground">{info.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Off-Season Banner */}
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
              <div className="bg-green-500/10 border-2 border-green-500/40 rounded-xl p-4 flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <div className="text-sm font-bold text-green-400">PROMOTED TO A DIVISION!</div>
                  <div className="text-xs text-muted-foreground mt-0.5">You finished 1st in B Division — promoted to RKL next season!</div>
                </div>
              </div>
            )}
            {wasRelegated && (
              <div className="bg-destructive/10 border-2 border-destructive/40 rounded-xl p-4 flex items-center gap-3">
                <span className="text-3xl">📉</span>
                <div>
                  <div className="text-sm font-bold text-destructive">RELEGATED TO B DIVISION</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Finished last in A Division — relegated to LKL next season.</div>
                </div>
              </div>
            )}
            <div className="bg-primary/10 border-2 border-primary/30 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">🏖️</span>
              <div>
                <div className="text-sm font-bold text-primary">OFF-SEASON PHASE</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {freeAgents.length} players available · Renew contracts, sign free agents
                </div>
              </div>
            </div>
            {/* Market shrink warning */}
            <div className="bg-warning/15 border-2 border-warning rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <div className="text-base font-bold text-warning">MARKET SHRINKS NEXT SEASON!</div>
                  <div className="text-sm text-warning/80 mt-1">
                    Off-season market: <strong>{isBLeague ? "10–12" : "18–27"} players</strong> available now.<br/>
                    Regular season: drops to <strong>{isBLeague ? "5–6" : "7–11"} players</strong> — sign key players NOW!
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Modifier + Bonus Active */}
      {modifierInfo && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">{modifierInfo.emoji}</span>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Season Modifier</div>
            <div className="text-sm font-semibold text-foreground">{modifierInfo.name}</div>
            <div className="text-xs text-muted-foreground">{modifierInfo.description}</div>
          </div>
        </div>
      )}
      {bonusInfo && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <span className="text-3xl">{bonusInfo.emoji}</span>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Season Bonus</div>
            <div className="text-sm font-semibold text-foreground">{bonusInfo.name}</div>
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

      {/* Finance Summary Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Finances This Season</span>
        </div>
        <div className="p-4 space-y-2">
          {/* Income */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-foreground font-medium">Income</span>
              <span className="text-xs text-muted-foreground ml-2">Tickets + Sponsor</span>
            </div>
            <span className="text-mono text-sm font-bold text-success">+${(f.ticketIncome + f.sponsorIncome).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-foreground font-medium">Expenses</span>
              <span className="text-xs text-muted-foreground ml-2">Wages + Transfers</span>
            </div>
            <span className="text-mono text-sm font-bold text-destructive">-${(f.totalWages + f.transferSpending).toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between items-center">
            <span className="text-sm font-bold text-foreground">Net Result</span>
            <span className={`text-mono text-lg font-black ${net >= 0 ? "text-success" : "text-destructive"}`}>
              {net >= 0 ? "+" : ""}${net.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Budget: <span className="text-mono font-medium text-foreground">${f.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Last Matches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lastMatch && (
          <MatchResultCard
            match={lastMatch}
            teams={state.teams}
            label="Last Match"
            myTeamId={state.selectedTeamId}
          />
        )}
        {lastOpponentMatch && opponentTeamId && (
          <MatchResultCard
            match={lastOpponentMatch}
            teams={state.teams}
            label="Opponent's Last Match"
            myTeamId={opponentTeamId}
          />
        )}
      </div>

      {/* Standings Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{divisionName} Standings</span>
          <span className="text-xs text-muted-foreground">🪨📄✂️ Strategy</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs w-6">#</th>
                <th className="text-left px-2 py-2 text-muted-foreground font-medium text-xs">Team</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-8">Strat</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-8">W</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-8">L</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-10 hidden sm:table-cell">PF</th>
                <th className="px-2 py-2 text-muted-foreground font-medium text-xs text-center w-10 hidden sm:table-cell">PA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {standings.map((entry, i) => {
                const team = state.teams.find(t => t.id === entry.teamId);
                if (!team) return null;
                const isPlayer = entry.teamId === state.selectedTeamId;
                const teamStrategy = getTeamStrategy(team);
                const bonusAgainstPlayer = isPlayer ? 0 : getStrategyBonus(teamStrategy, playerStrategy);
                return (
                  <tr key={entry.teamId} className={isPlayer ? "bg-primary/10" : ""}>
                    <td className="px-3 py-2.5 text-mono text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <TeamLogo shortName={team.shortName} color={team.color} size="sm" />
                        <span className={`font-semibold text-xs ${isPlayer ? "text-primary" : "text-foreground"}`}>
                          {team.shortName}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-sm">
                      {teamStrategy === "defensive" ? "🛡️" : teamStrategy === "offensive" ? "🎯" : teamStrategy === "playmaking" ? "🏀" : "⚖️"}
                      {bonusAgainstPlayer > 0 && <span className="text-[9px] text-green-500 ml-0.5">+{bonusAgainstPlayer}%</span>}
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
        <div className="bg-destructive/20 border-2 border-destructive rounded-xl p-8 text-center">
          <div className="text-3xl font-bold text-destructive mb-2">Game Over</div>
          <div className="text-sm text-foreground mb-4">{state.gameOverReason}</div>
          <div className="mt-4 text-xs text-muted-foreground">Refresh the page to start a new career.</div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="pt-1 space-y-2">
          {state.phase === "preseason" && (
            <button onClick={startRegularSeason} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-md">
              Start Regular Season →
            </button>
          )}
          {state.phase === "regular" && (() => {
            if (multiplayerLobby) {
              const myReady = multiplayerLobby.myReady;
              const opponentReady = multiplayerLobby.opponentReady;
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`}></span>
                    Opponent {opponentReady ? "ready ✓" : "not ready"}
                  </div>
                  <button onClick={playWeek} className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-95 shadow-md ${myReady ? "bg-green-600 text-white hover:bg-green-700" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                    {myReady ? "✓ Ready — tap to cancel" : `Ready for Week ${state.week + 1} →`}
                  </button>
                </div>
              );
            }
            return (
              <button onClick={playWeek} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-md">
                ▶ Play Week {state.week + 1}
              </button>
            );
          })()}
          {state.phase === "playoffs" && (() => {
            const myReady = multiplayerLobby?.myReady ?? false;
            const opponentReady = multiplayerLobby?.opponentReady ?? false;
            return (
              <div className="flex flex-col gap-3">
                {multiplayerLobby && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`}></span>
                    Opponent {opponentReady ? "ready ✓" : "not ready"}
                  </div>
                )}
                <button onClick={simulateAllPlayoffs} className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-95 shadow-md ${multiplayerLobby ? (myReady ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90") : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                  {multiplayerLobby ? (myReady ? "✓ Ready — tap to cancel" : "🏆 Ready for Playoffs →") : "🏆 Simulate All Playoffs →"}
                </button>
                <button onClick={() => setView("playoffs")} className="w-full py-3 rounded-xl border-2 border-border text-muted-foreground text-sm font-medium hover:text-foreground hover:border-primary/40 transition-all">
                  View Bracket →
                </button>
              </div>
            );
          })()}
          {state.phase === "offseason" && (
            <div className="flex flex-col gap-3">
              {multiplayerLobby ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${multiplayerLobby.opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`}></span>
                    Opponent {multiplayerLobby.opponentReady ? "ready ✓" : "not ready"}
                  </div>
                  <button onClick={startNewSeason} className={`w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all active:scale-95 shadow-md ${multiplayerLobby.myReady ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
                    {multiplayerLobby.myReady ? "✓ Ready — tap to cancel" : "Ready for Next Season →"}
                  </button>
                </>
              ) : (
                <button onClick={startNewSeason} className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-md">
                  Start New Season →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-mono text-foreground">{value}</div>
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
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <TeamLogo shortName={home.shortName} color={home.color} size="sm" />
          <span className="text-xs font-semibold text-foreground">{home.shortName}</span>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black text-mono ${won ? "text-success" : "text-destructive"}`}>
            {match.homeScore} – {match.awayScore}
          </div>
          <div className={`text-[10px] font-bold uppercase ${won ? "text-success" : "text-destructive"}`}>
            {won ? "WIN" : "LOSS"}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs font-semibold text-foreground">{away.shortName}</span>
          <TeamLogo shortName={away.shortName} color={away.color} size="sm" />
        </div>
      </div>
    </div>
  );
}
