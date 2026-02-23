import React from "react";
import { useGame } from "@/hooks/useGameState";
import { TeamLogo } from "./TeamSelect";

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

  if (isBLeague) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="fm-header py-3 rounded-xl">
          <h2 className="text-base font-bold font-condensed uppercase tracking-wider text-foreground">Playoffs</h2>
          <p className="text-xs text-muted-foreground">B Division (LKL) · No Playoffs</p>
        </div>
        <div className="rounded-xl p-8 text-center space-y-3"
          style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
          <div className="text-4xl">🏅</div>
          <p className="text-sm font-semibold font-condensed text-foreground">B Division teams don't compete in playoffs</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Only A Division (RKL) top 4 advance to the playoffs.<br />
            Win the B Division championship to earn automatic promotion to the A Division!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="fm-header py-3 rounded-xl">
        <h2 className="text-base font-bold font-condensed uppercase tracking-wider text-foreground">Playoffs</h2>
        <p className="text-xs text-muted-foreground">Top 4 · Best of 3 · Semifinals → Finals</p>
      </div>

      {bracket.length === 0 && (
        <div className="rounded-xl p-6 text-center" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
          <p className="text-muted-foreground text-sm">Playoffs haven't started yet. Complete the regular season first.</p>
        </div>
      )}

      {/* Controls */}
      {playoffsOngoing && (
        <div className="space-y-2">
          {isMultiplayer ? (
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground self-center">
                <span className="w-2 h-2 rounded-full" style={{ background: opponentReady ? 'hsl(152 60% 48%)' : 'hsl(215 15% 35%)' }} />
                Opponent {opponentReady ? "ready ✓" : "not ready"}
              </div>
              <button
                onClick={simulateAllPlayoffs}
                className="flex-1 lg:flex-initial lg:px-8 py-3 rounded-xl font-bold text-sm tracking-[0.1em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
                style={{
                  background: myReady ? 'hsl(152 60% 38%)' : 'hsl(38 95% 52%)',
                  color: 'hsl(220 25% 5%)',
                }}>
                {myReady ? "✓ Ready — click to cancel" : "Ready for Playoffs →"}
              </button>
            </div>
          ) : (
            <button
              onClick={simulateAllPlayoffs}
              className="w-full py-3.5 rounded-xl font-bold text-sm tracking-[0.12em] uppercase transition-all active:scale-95 font-condensed cursor-pointer"
              style={{ background: 'hsl(38 95% 52%)', color: 'hsl(220 25% 5%)', boxShadow: '0 0 20px hsl(38 95% 52% / 0.15)' }}
            >
              Simulate All Playoffs →
            </button>
          )}
        </div>
      )}

      {/* Semifinals */}
      {semis.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] font-bold px-1 font-condensed">Semifinals</div>
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

      {/* Finals */}
      {finals && (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.18em] font-bold px-1 font-condensed">Championship Final</div>
          <MatchupCard
            matchup={finals}
            teams={state.teams}
            playerTeamId={state.selectedTeamId}
            onSimulateGame={!isMultiplayer && !finals.winnerId && finalsIdx >= 0 ? () => playPlayoffGame(finalsIdx) : undefined}
          />
          {finals.winnerId && (
            <div className="rounded-xl p-5 text-center"
              style={{ background: 'hsl(45 95% 52% / 0.08)', border: '1px solid hsl(45 95% 52% / 0.3)' }}>
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-lg font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(45 95% 58%)' }}>
                {state.teams.find(t => t.id === finals.winnerId)?.shortName} — RKL Champions!
              </div>
            </div>
          )}
        </div>
      )}

      {state.phase === "offseason" && bracket.length > 0 && (
        <div className="rounded-xl p-3 text-center" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
          <p className="text-xs text-muted-foreground font-condensed">Playoffs complete — go to Dashboard to start the next season.</p>
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
  const winner1 = matchup.winnerId === team1.id;
  const winner2 = matchup.winnerId === team2.id;

  return (
    <div className="rounded-xl p-4"
      style={{
        background: isPlayerInvolved ? 'hsl(38 95% 52% / 0.06)' : 'hsl(220 22% 8%)',
        border: `1px solid ${isPlayerInvolved ? 'hsl(38 95% 52% / 0.3)' : 'hsl(220 20% 12%)'}`,
      }}>
      <div className="flex items-center justify-between gap-3">
        {/* Team 1 */}
        <div className="flex items-center gap-2.5 flex-1">
          <TeamLogo shortName={team1.shortName} color={team1.color} size="sm" />
          <span className="text-xs font-bold font-condensed uppercase tracking-wide"
            style={{ color: winner1 ? 'hsl(152 60% 48%)' : 'hsl(210 20% 85%)' }}>
            {team1.shortName}
          </span>
          {winner1 && (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14,color:'hsl(152 60% 48%)'}}>
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-3">
          <span className="text-mono text-2xl font-black"
            style={{ color: winner1 ? 'hsl(152 60% 48%)' : 'hsl(210 20% 75%)' }}>{matchup.team1Wins}</span>
          <span className="text-muted-foreground text-sm font-condensed">–</span>
          <span className="text-mono text-2xl font-black"
            style={{ color: winner2 ? 'hsl(152 60% 48%)' : 'hsl(210 20% 75%)' }}>{matchup.team2Wins}</span>
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-2.5 flex-1 justify-end">
          {winner2 && (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14,color:'hsl(152 60% 48%)'}}>
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          )}
          <span className="text-xs font-bold font-condensed uppercase tracking-wide"
            style={{ color: winner2 ? 'hsl(152 60% 48%)' : 'hsl(210 20% 85%)' }}>
            {team2.shortName}
          </span>
          <TeamLogo shortName={team2.shortName} color={team2.color} size="sm" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {matchup.winnerId ? (
          <span className="text-[10px] font-condensed uppercase tracking-wide w-full text-center"
            style={{ color: 'hsl(152 60% 48%)' }}>
            {teams.find((t: any) => t.id === matchup.winnerId)?.shortName} advances to next round
          </span>
        ) : (
          <>
            <span className="text-[10px] text-muted-foreground font-condensed">Best of 3 — first to 2 wins</span>
            {onSimulateGame && (
              <button
                onClick={onSimulateGame}
                className="text-[10px] font-bold font-condensed uppercase tracking-wider px-3 py-1 rounded-lg transition-all cursor-pointer"
                style={{ background: 'hsl(38 95% 52% / 0.12)', color: 'hsl(38 95% 55%)', border: '1px solid hsl(38 95% 52% / 0.25)' }}
              >
                Simulate Game →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
