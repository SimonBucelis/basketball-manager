import React, { useEffect, useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { SEASON_MODIFIERS, SEASON_BONUSES, DIVISIONS } from "@/lib/gameData";

function getTeamStrategy(team: any): string {
  const starters = team.players.filter((p: any) => p.isStarter);
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
  const modifierInfo = state.seasonModifier
    ? SEASON_MODIFIERS.find(m => m.id === state.seasonModifier)
    : null;

  const bonusInfo = state.seasonBonus
    ? SEASON_BONUSES.find(b => b.id === state.seasonBonus)
    : null;

  const divisionName = DIVISIONS.find(d => d.id === playerTeam.division)?.name || "";
  const isBLeague = playerTeam.division === "lkl";

  const standings = [...(state.standings[playerTeam.division] || [])].sort(
    (a, b) => b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
  );

  const myStanding = standings.find(s => s.teamId === state.selectedTeamId);
  const myRank = standings.findIndex(s => s.teamId === state.selectedTeamId) + 1;

  const lastMatch = [...(state.schedule ?? [])].reverse().find(m => m.homeTeamId === state.selectedTeamId || m.awayTeamId === state.selectedTeamId);

  // Get player's team strategy
  const playerStrategy = getTeamStrategy(playerTeam);

  const needsBonusChoice =
    state.phase === "preseason" &&
    !state.gameOver &&
    !state.seasonBonus &&
    seasonBonusChoices.length > 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Team Header */}
      <div className="fm-header px-4 py-4 rounded-lg">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center text-lg font-black"
            style={{ backgroundColor: playerTeam.color + "33", color: playerTeam.color }}
          >
            {playerTeam.shortName}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{playerTeam.name}</h2>
            <p className="text-sm text-muted-foreground">{divisionName} · Season {state.season}</p>
          </div>
        </div>
      </div>

      {/* Season Bonus Picker (preseason) */}
      {needsBonusChoice && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Pick a Season Bonus
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {seasonBonusChoices.map(id => {
              const info = SEASON_BONUSES.find(b => b.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => chooseSeasonBonus(id)}
                  className="flex flex-col items-start gap-1 border border-border rounded-lg p-3 hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <span className="text-2xl">{info.emoji}</span>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    {info.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{info.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Off-Season Banner */}
      {state.phase === "offseason" && (() => {
        // Determine if this team just got promoted or relegated
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
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <div className="text-sm font-bold text-green-400">PROMOTED TO A DIVISION!</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      You finished 1st in B Division — automatically promoted to A Division (RKL) next season!
                    </div>
                  </div>
                </div>
              </div>
            )}
            {wasRelegated && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📉</span>
                  <div>
                    <div className="text-sm font-bold text-destructive">RELEGATED TO B DIVISION</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      You finished last in A Division — relegated to B Division (LKL) next season.
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🏖️</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-primary">OFF-SEASON PHASE</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Enhanced transfer market: {freeAgents.length} players available ({isBLeague ? "12 for B Division" : "18 for A Division"})
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Renew contracts, make transfers, and prepare for next season
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Season Modifier */}
      {modifierInfo && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Season Modifier</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{modifierInfo.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-foreground">{modifierInfo.name}</div>
              <div className="text-xs text-muted-foreground">{modifierInfo.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Season Bonus Active */}
      {bonusInfo && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Season Bonus</div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{bonusInfo.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-foreground">{bonusInfo.name}</div>
              <div className="text-xs text-muted-foreground">{bonusInfo.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Team Strategy */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Team Strategy</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {playerStrategy === "defensive" ? "🛡️" :
               playerStrategy === "offensive" ? "🎯" :
               playerStrategy === "playmaking" ? "🏀" : "⚖️"}
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground capitalize">
                {playerStrategy === "defensive" ? "Defense Focused" :
                 playerStrategy === "offensive" ? "Offense Focused" :
                 playerStrategy === "playmaking" ? "Playmaking" : "Balanced"}
              </div>
              <div className="text-xs text-muted-foreground">
                {playerStrategy === "defensive" ? "3+ Defenders → +10% vs Offense" :
                 playerStrategy === "offensive" ? "3+ Sharpshooters → +10% vs Playmaking" :
                 playerStrategy === "playmaking" ? "3+ Playmakers → +10% vs Defense" :
                 "Mix of roles - No bonus/penalty"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Starters</div>
            <div className="text-lg font-bold text-foreground">
              {playerTeam.players.filter(p => p.isStarter).length}/5
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Record" value={myStanding ? `${myStanding.wins}-${myStanding.losses}` : "0-0"} />
        <StatCard label="Rank" value={`#${myRank}`} />
        <StatCard label="Squad" value={`${playerTeam.players.length}`} />
        <StatCard label="Season" value={`${state.season}`} />
        <StatCard label="Week" value={`${state.week}/${2 * (state.teams.filter(t => t.division === playerTeam.division).length - 1)}`} />
        <StatCard label="Phase" value={state.phase.charAt(0).toUpperCase() + state.phase.slice(1)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Last Result */}
        {lastMatch && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Last Match</div>
            <div className="flex items-center justify-between">
              <TeamLabel teamId={lastMatch.homeTeamId} teams={state.teams} />
              <div className="text-mono text-2xl font-bold text-foreground">
                {lastMatch.homeScore} - {lastMatch.awayScore}
              </div>
              <TeamLabel teamId={lastMatch.awayTeamId} teams={state.teams} />
            </div>
          </div>
        )}

        {/* Finance Summary */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Finances</div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">Net Result</span>
            <span className={`text-mono text-lg font-bold ${
              (state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) >= 0 
                ? "text-success" 
                : "text-destructive"
            }`}>
              {(state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending) >= 0 ? "+" : ""}
              ${(state.finances.ticketIncome + state.finances.sponsorIncome + state.finances.prizeIncome - state.finances.totalWages - state.finances.transferSpending).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Standings Preview */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{divisionName} Standings</span>
          <span className="text-xs text-muted-foreground">Strategy: Rock Paper Scissors</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium text-xs">#</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium text-xs">Team</th>
              <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">Strategy</th>
              <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">W</th>
              <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center">L</th>
              <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">PF</th>
              <th className="px-3 py-2 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">PA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {standings.map((entry, i) => {
              const team = state.teams.find(t => t.id === entry.teamId);
              if (!team) return null;
              const isPlayer = entry.teamId === state.selectedTeamId;
              const teamStrategy = getTeamStrategy(team);
              const bonusAgainstPlayer = getStrategyBonus(teamStrategy, playerStrategy);
              const bonusAgainstPlayerText = isPlayer ? "" : (bonusAgainstPlayer > 0 ? `+${bonusAgainstPlayer}%` : "");
              
              return (
                <tr key={entry.teamId} className={isPlayer ? "bg-primary/10" : ""}>
                  <td className="px-4 py-2 text-mono text-muted-foreground text-sm">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                      <span className={`font-medium ${isPlayer ? "text-primary" : "text-foreground"}`}>
                        {team.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">
                        {teamStrategy === "defensive" ? "🛡️" :
                         teamStrategy === "offensive" ? "🎯" :
                         teamStrategy === "playmaking" ? "🏀" : "⚖️"}
                      </span>
                      {bonusAgainstPlayer > 0 && (
                        <span className="text-xs font-bold text-green-500">+{bonusAgainstPlayer}%</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center text-mono text-foreground">{entry.wins}</td>
                  <td className="px-3 py-2 text-center text-mono text-muted-foreground">{entry.losses}</td>
                  <td className="px-3 py-2 text-center text-mono text-muted-foreground hidden sm:table-cell">{entry.pointsFor}</td>
                  <td className="px-3 py-2 text-center text-mono text-muted-foreground hidden sm:table-cell">{entry.pointsAgainst}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Game Over Screen + Run Summary */}
      {state.gameOver ? (
        <div className="bg-destructive/20 border border-destructive rounded-lg p-8 text-center">
          <div className="text-3xl font-bold text-destructive mb-2">Game Over</div>
          <div className="text-sm text-foreground mb-4">{state.gameOverReason}</div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs text-muted-foreground">
            <div>
              <div className="font-semibold text-foreground mb-1">Run Summary</div>
              <div>Seasons managed: <span className="font-mono text-foreground">{state.season}</span></div>
              <div>Final division: <span className="font-mono text-foreground">
                {playerTeam.division === "rkl" ? "A Division (RKL)" : "B Division (LKL)"}
              </span></div>
              <div>
                Last net result:{" "}
                <span className={`font-mono ${(
                  state.finances.ticketIncome +
                  state.finances.sponsorIncome +
                  state.finances.prizeIncome -
                  state.finances.totalWages -
                  state.finances.transferSpending
                ) >= 0 ? "text-success" : "text-destructive"}`}>
                  {(state.finances.ticketIncome +
                    state.finances.sponsorIncome +
                    state.finances.prizeIncome -
                    state.finances.totalWages -
                    state.finances.transferSpending) >= 0 ? "+" : ""}
                  {(state.finances.ticketIncome +
                    state.finances.sponsorIncome +
                    state.finances.prizeIncome -
                    state.finances.totalWages -
                    state.finances.transferSpending).toLocaleString()}
                </span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-1">Achievements (this run)</div>
              <ul className="list-disc list-inside space-y-1">
                {state.season >= 3 && <li>Survivor: 3+ seasons managed</li>}
                {state.playoffBracket.length > 0 && <li>Playoff Contender: reached playoffs</li>}
                {(state.finances.ticketIncome +
                  state.finances.sponsorIncome +
                  state.finances.prizeIncome -
                  state.finances.totalWages -
                  state.finances.transferSpending) > 0 && (
                  <li>Big Earner: finished with positive net result</li>
                )}
                {state.season < 3 && state.playoffBracket.length === 0 && (
                  <li>Rookie Run: short first career</li>
                )}
              </ul>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <div className="font-semibold text-foreground mb-1">Next Steps</div>
                <div>Refresh the page to start a new career with a new team and new bonuses.</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Action Button */
        <div className="pt-1">
          {state.phase === "preseason" && (
            <button onClick={startRegularSeason} className="w-full lg:w-auto lg:px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity">
              Start Regular Season →
            </button>
          )}
          {state.phase === "regular" && (() => {
            if (multiplayerLobby) {
              // Multiplayer: show ready toggle button
              const myReady = multiplayerLobby.myReady;
              const opponentReady = multiplayerLobby.opponentReady;
              return (
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground self-center">
                    <span className={`w-2 h-2 rounded-full ${opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`}></span>
                    Opponent {opponentReady ? "ready ✓" : "not ready"}
                  </div>
                  <button
                    onClick={playWeek}
                    className={`w-full lg:w-auto lg:px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${
                      myReady
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {myReady ? "✓ Ready — click to cancel" : `Ready for Week ${state.week + 1} →`}
                  </button>
                  {myReady && opponentReady && (
                    <span className="text-xs text-green-500 self-center animate-pulse">Simulating...</span>
                  )}
                </div>
              );
            }
            // Single player: simulate immediately
            return (
              <button onClick={playWeek} className="w-full lg:w-auto lg:px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity">
                Play Week {state.week + 1} →
              </button>
            );
          })()}
          {state.phase === "playoffs" && (() => {
            const myReady = multiplayerLobby?.myReady ?? false;
            const opponentReady = multiplayerLobby?.opponentReady ?? false;
            return (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {multiplayerLobby && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground self-center">
                    <span className={`w-2 h-2 rounded-full ${opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`}></span>
                    Opponent {opponentReady ? "ready ✓" : "not ready"}
                  </div>
                )}
                <button
                  onClick={simulateAllPlayoffs}
                  className={`w-full lg:w-auto lg:px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${
                    multiplayerLobby
                      ? myReady
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {multiplayerLobby
                    ? myReady ? "✓ Ready — click to cancel" : "🏆 Ready for Playoffs →"
                    : "🏆 Simulate All Playoffs →"}
                </button>
                {multiplayerLobby && myReady && opponentReady && (
                  <span className="text-xs text-green-500 self-center animate-pulse">Simulating...</span>
                )}
                <button
                  onClick={() => setView("playoffs")}
                  className="lg:px-6 py-3 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:text-foreground hover:border-primary/40 transition-all"
                >
                  View Bracket →
                </button>
              </div>
            );
          })()}
          {state.phase === "offseason" && (
            <div className="flex flex-col sm:flex-row gap-3">
              {multiplayerLobby ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground self-center">
                    <span className={`w-2 h-2 rounded-full ${multiplayerLobby.opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`}></span>
                    Opponent {multiplayerLobby.opponentReady ? "ready ✓" : "not ready"}
                  </div>
                  <button
                    onClick={startNewSeason}
                    className={`flex-1 sm:flex-initial sm:px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${
                      multiplayerLobby.myReady
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {multiplayerLobby.myReady ? "✓ Ready — click to cancel" : "Ready for Next Season →"}
                  </button>
                  {multiplayerLobby.myReady && multiplayerLobby.opponentReady && (
                    <span className="text-xs text-green-500 self-center animate-pulse">Starting…</span>
                  )}
                </>
              ) : (
                <button onClick={startNewSeason} className="flex-1 sm:flex-initial sm:px-8 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity">
                  Start New Season →
                </button>
              )}
              <div className="text-xs text-muted-foreground self-center">
                Market will shrink to {isBLeague ? "6" : "7"} players in new season
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-mono text-foreground">{value}</div>
    </div>
  );
}

function TeamLabel({ teamId, teams }: { teamId: string; teams: any[] }) {
  const team = teams.find((t: any) => t.id === teamId);
  if (!team) return null;
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: team.color + "33", color: team.color }}
      >
        {team.shortName}
      </div>
      <span className="text-sm font-medium text-foreground hidden sm:inline">{team.shortName}</span>
    </div>
  );
}
