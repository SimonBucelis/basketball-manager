import React from "react";
import { useGame } from "@/hooks/useGameState";

export default function PlayoffsView() {
  const { state, simulateAllPlayoffs, playPlayoffGame, multiplayerLobby } = useGame();
  if (!state) return null;

  const playerTeam = state.teams.find(t => t.id === state.selectedTeamId);
  const isBLeague = playerTeam?.division === "lkl";
  const bracket = state.playoffBracket ?? [];
  const semis = bracket.filter(m => m.round === 1);
  const finals = bracket.find(m => m.round === 2);
  const finalsIdx = bracket.findIndex(m => m.round === 2);
  const playoffsOngoing = state.phase === "playoffs" && bracket.some(m => !m.winnerId);

  const isMultiplayer = !!multiplayerLobby;
  const myReady = multiplayerLobby?.myReady ?? false;
  const opponentReady = multiplayerLobby?.opponentReady ?? false;

  // ── B Division: no playoffs ───────────────────────────────────────────────
  if (isBLeague) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="fm-header px-3 py-2 rounded-lg">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Playoffs</h2>
          <p className="text-xs text-muted-foreground">B Division (LKL) · No Playoffs</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3">
          <div className="text-4xl">🏅</div>
          <p className="text-sm font-semibold text-foreground">B Division teams don't compete in playoffs</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Only A Division (RKL) top 4 advance to the playoffs.<br />
            Win the B Division championship to earn automatic promotion to the A Division next season!
          </p>
        </div>
      </div>
    );
  }

  // ── A Division playoffs ───────────────────────────────────────────────────
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="fm-header px-3 py-2 rounded-lg">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Playoffs</h2>
        <p className="text-xs text-muted-foreground">Top 4 · Best of 3 · Semifinals → Finals</p>
      </div>

      {bracket.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Playoffs haven't started yet. Complete the regular season first.
          </p>
        </div>
      )}

      {/* ── Simulate controls ── */}
      {playoffsOngoing && (
        <div className="space-y-2">
          {isMultiplayer ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground self-center">
                <span className={`w-2 h-2 rounded-full ${opponentReady ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                Opponent {opponentReady ? "ready ✓" : "not ready"}
              </div>
              <button
                onClick={simulateAllPlayoffs}
                className={`flex-1 lg:flex-initial lg:px-8 py-3 rounded-lg font-bold text-sm tracking-wide transition-all ${
                  myReady ? "bg-green-600 text-white hover:bg-green-700" : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {myReady ? "✓ Ready — click to cancel" : "🏆 Ready for Playoffs →"}
              </button>
              {myReady && opponentReady && (
                <span className="text-xs text-green-500 self-center animate-pulse">Simulating…</span>
              )}
            </div>
          ) : (
            <button
              onClick={simulateAllPlayoffs}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              🏆 Simulate All Playoffs
            </button>
          )}
        </div>
      )}

      {/* ── Semifinals ── */}
      {semis.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider px-1">Semifinals</div>
          {semis.map((matchup, i) => (
            <MatchupCard
              key={i}
              matchup={matchup}
              teams={state.teams}
              playerTeamId={state.selectedTeamId}
              onSimulateGame={!isMultiplayer && !matchup.winnerId ? () => playPlayoffGame(i) : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Finals ── */}
      {finals && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wider px-1">Finals</div>
          <MatchupCard
            matchup={finals}
            teams={state.teams}
            playerTeamId={state.selectedTeamId}
            onSimulateGame={!isMultiplayer && !finals.winnerId && finalsIdx >= 0 ? () => playPlayoffGame(finalsIdx) : undefined}
          />
          {finals.winnerId && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-sm font-bold text-yellow-500">
                {state.teams.find(t => t.id === finals.winnerId)?.name} wins the RKL Championship!
              </div>
            </div>
          )}
        </div>
      )}

      {state.phase === "offseason" && bracket.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Playoffs complete — go to Dashboard to start the next season.</p>
        </div>
      )}
    </div>
  );
}

function MatchupCard({ matchup, teams, playerTeamId, onSimulateGame }: {
  matchup: any; teams: any[]; playerTeamId: string; onSimulateGame?: () => void;
}) {
  const team1 = teams.find((t: any) => t.id === matchup.team1Id);
  const team2 = teams.find((t: any) => t.id === matchup.team2Id);
  if (!team1 || !team2) return null;
  const isPlayerInvolved = matchup.team1Id === playerTeamId || matchup.team2Id === playerTeamId;

  return (
    <div className={`bg-card border rounded-lg p-3 ${isPlayerInvolved ? "border-primary/40 glow-primary" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: team1.color + "33", color: team1.color }}
          >
            {team1.shortName}
          </div>
          <span className={`text-xs font-medium ${matchup.winnerId === team1.id ? "text-green-400 font-bold" : "text-foreground"}`}>
            {team1.name}
          </span>
        </div>

        <div className="flex items-center gap-1 px-3">
          <span className={`text-mono text-lg font-bold ${matchup.winnerId === team1.id ? "text-green-400" : "text-foreground"}`}>
            {matchup.team1Wins}
          </span>
          <span className="text-muted-foreground text-xs">–</span>
          <span className={`text-mono text-lg font-bold ${matchup.winnerId === team2.id ? "text-green-400" : "text-foreground"}`}>
            {matchup.team2Wins}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`text-xs font-medium ${matchup.winnerId === team2.id ? "text-green-400 font-bold" : "text-foreground"}`}>
            {team2.name}
          </span>
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: team2.color + "33", color: team2.color }}
          >
            {team2.shortName}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {matchup.winnerId ? (
          <span className="text-[10px] text-green-400 font-medium w-full text-center">
            {teams.find((t: any) => t.id === matchup.winnerId)?.name} advances ✓
          </span>
        ) : (
          <>
            <span className="text-[10px] text-muted-foreground">First to 2 wins (Best of 3)</span>
            {onSimulateGame && (
              <button
                onClick={onSimulateGame}
                className="text-[10px] font-semibold text-primary hover:opacity-80 transition-opacity px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/5"
              >
                Sim Game →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
