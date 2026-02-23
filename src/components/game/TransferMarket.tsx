import React, { useState } from "react";
import { useGame } from "@/hooks/useGameState";
import { FreeAgent } from "@/lib/types";

function getRatingColor(rating: number): string {
  if (rating >= 80) return "hsl(195 85% 50%)";
  if (rating >= 65) return "hsl(152 60% 48%)";
  if (rating >= 50) return "hsl(38 95% 52%)";
  return "hsl(0 72% 58%)";
}

function getRoleBadge(role: string): { color: string; bg: string } {
  if (role === "Sharpshooter") return { color: 'hsl(38 95% 55%)', bg: 'hsl(38 95% 52% / 0.12)' };
  if (role === "Defender") return { color: 'hsl(195 85% 50%)', bg: 'hsl(195 85% 45% / 0.12)' };
  if (role === "Playmaker") return { color: 'hsl(152 60% 48%)', bg: 'hsl(152 60% 40% / 0.12)' };
  return { color: 'hsl(215 15% 55%)', bg: 'hsl(220 20% 14%)' };
}

export default function TransferMarket() {
  const { freeAgents, makeTransferOffer, state } = useGame();
  const [contractYears, setContractYears] = useState<1 | 2>(1);
  const [offerResult, setOfferResult] = useState<{ msg: string; ok: boolean } | null>(null);

  if (!state) return null;

  const team = state.teams.find(t => t.id === state.selectedTeamId)!;
  const isBLeague = team.division === "lkl";
  const isOffseason = state.phase === "offseason";
  const availableAgents = freeAgents.filter(p => !state.declinedPlayerIds.includes(p.id));

  const handleOffer = (player: FreeAgent) => {
    const { success, reason } = makeTransferOffer(player, contractYears, player.askingSalary);
    if (success) {
      setOfferResult({ msg: `${player.name} signed!`, ok: true });
    } else {
      setOfferResult({ msg: reason || `${player.name} declined.`, ok: false });
    }
    setTimeout(() => setOfferResult(null), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="fm-header py-3 rounded-xl">
        <h2 className="text-base font-bold text-foreground uppercase tracking-wider font-condensed">Transfer Market</h2>
        <p className="text-sm text-muted-foreground">
          {availableAgents.length} free agents · {isOffseason ? "Off-season expanded market" : "Regular season"}
        </p>
      </div>

      {/* League info */}
      <div className="rounded-xl px-4 py-3.5"
        style={{
          background: isBLeague ? 'hsl(38 95% 52% / 0.06)' : 'hsl(195 85% 45% / 0.06)',
          border: `1px solid ${isBLeague ? 'hsl(38 95% 52% / 0.25)' : 'hsl(195 85% 45% / 0.25)'}`,
        }}>
        <p className="text-sm font-bold mb-1 font-condensed uppercase tracking-wide"
          style={{ color: isBLeague ? 'hsl(38 95% 55%)' : 'hsl(195 85% 52%)' }}>
          {isBLeague ? "B League — Uncertain Ratings" : "A League Market"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isBLeague
            ? "Players are FREE. Ratings shown as RANGES — final value is random within range."
            : `${isOffseason ? "18–27" : "7–11"} players available. Exact ratings shown. Pay salary.`}
        </p>
      </div>

      {/* Market shrink warning */}
      {isOffseason && (
        <div className="rounded-xl px-4 py-3.5 flex items-start gap-3"
          style={{ background: 'hsl(38 95% 52% / 0.06)', border: '1px solid hsl(38 95% 52% / 0.2)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18,color:'hsl(38 95% 55%)',flexShrink:0,marginTop:2}}>
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-bold font-condensed uppercase tracking-wide" style={{ color: 'hsl(38 95% 55%)' }}>Market Shrinks Next Season</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sign players NOW — regular season drops to only {isBLeague ? "5–6" : "7–11"} players.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl px-4 py-3 flex gap-3 text-xs text-muted-foreground"
        style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <span>• Declined players are permanently removed this season.</span>
        <span>• Max squad: 12 players.</span>
      </div>

      {/* Result toast */}
      {offerResult && (
        <div className="rounded-xl px-4 py-3 animate-fade-in"
          style={{
            background: offerResult.ok ? 'hsl(152 60% 40% / 0.1)' : 'hsl(0 72% 55% / 0.1)',
            border: `1px solid ${offerResult.ok ? 'hsl(152 60% 40% / 0.3)' : 'hsl(0 72% 55% / 0.3)'}`,
          }}>
          <p className="text-sm font-semibold font-condensed" style={{ color: offerResult.ok ? 'hsl(152 60% 48%)' : 'hsl(0 72% 58%)' }}>
            {offerResult.ok ? "✓" : "✗"} {offerResult.msg}
          </p>
        </div>
      )}

      {/* Contract selector */}
      {!isBLeague && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium font-condensed uppercase tracking-wide text-xs">Contract:</span>
          {([1, 2] as const).map(yr => (
            <button
              key={yr}
              onClick={() => setContractYears(yr)}
              className="px-5 py-2 rounded-lg text-xs font-bold font-condensed uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
              style={{
                background: contractYears === yr ? 'hsl(38 95% 52%)' : 'hsl(220 20% 12%)',
                color: contractYears === yr ? 'hsl(220 25% 5%)' : 'hsl(215 15% 55%)',
              }}
            >
              {yr} Year{yr > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Player list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'hsl(220 22% 8%)', border: '1px solid hsl(220 20% 12%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(220 20% 12%)', background: 'hsl(220 20% 9%)' }}>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">Player</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center">OVR</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center">Role</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">SHO</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DEF</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">DRI</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-center hidden sm:table-cell">PAS</th>
              <th className="px-2 py-2.5 text-muted-foreground font-medium text-xs text-right">{isBLeague ? "Cost" : "Salary"}</th>
              <th className="px-4 py-2.5 text-muted-foreground font-medium text-xs text-center"></th>
            </tr>
          </thead>
          <tbody>
            {availableAgents.map(agent => {
              const isTitas = !!(agent as any).isTitasSamsonas;
              const roleBadge = getRoleBadge(agent.role);
              return (
                <tr key={agent.id}
                  style={{
                    borderBottom: '1px solid hsl(220 20% 11%)',
                    background: isTitas ? 'hsl(45 95% 52% / 0.04)' : 'transparent',
                  }}>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-semibold" style={{ color: isTitas ? 'hsl(45 95% 55%)' : 'hsl(210 20% 92%)' }}>
                        {agent.name}
                      </span>
                      {isTitas && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider font-condensed animate-pulse"
                          style={{ color: 'hsl(45 95% 55%)' }}>LEGENDA</span>
                      )}
                      <div className="text-xs text-muted-foreground">Age {agent.age} · {agent.attributes.height}cm</div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-mono font-bold" style={{ color: getRatingColor(agent.overall) }}>{agent.overall}</span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span className="text-[10px] font-bold font-condensed uppercase tracking-wide px-1.5 py-0.5 rounded-sm"
                      style={{ color: roleBadge.color, background: roleBadge.bg }}>
                      {agent.role.slice(0, 3)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-mono text-xs hidden sm:table-cell"
                    style={{ color: getRatingColor(agent.attributes.shooting) }}>{agent.attributes.shooting}</td>
                  <td className="px-2 py-3 text-center text-mono text-xs hidden sm:table-cell"
                    style={{ color: getRatingColor(agent.attributes.defending) }}>{agent.attributes.defending}</td>
                  <td className="px-2 py-3 text-center text-mono text-xs hidden sm:table-cell"
                    style={{ color: getRatingColor(agent.attributes.dribbling) }}>{agent.attributes.dribbling}</td>
                  <td className="px-2 py-3 text-center text-mono text-xs hidden sm:table-cell"
                    style={{ color: getRatingColor(agent.attributes.passing) }}>{agent.attributes.passing}</td>
                  <td className="px-2 py-3 text-right text-mono font-semibold text-sm">
                    {isBLeague
                      ? <span className="font-bold font-condensed" style={{ color: 'hsl(152 60% 48%)' }}>FREE</span>
                      : `$${agent.askingSalary.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleOffer(agent)}
                      className="px-4 py-2 rounded-lg text-xs font-bold font-condensed uppercase tracking-wide transition-all active:scale-95 cursor-pointer"
                      style={{ background: 'hsl(38 95% 52%)', color: 'hsl(220 25% 5%)' }}
                    >
                      Sign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {availableAgents.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm font-condensed">No free agents available</div>
        )}
      </div>
    </div>
  );
}
