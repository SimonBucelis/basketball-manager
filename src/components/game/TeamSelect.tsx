import React from "react";
import { TEAMS_DATA, DIVISIONS } from "@/lib/gameData";
import { DivisionId, CoachType } from "@/lib/types";
import { COACH_DEFS } from "@/components/multiplayer/LobbyScreen";

// Team logo component: colored hexagonal badge with short name
export function TeamLogo({ shortName, color, size = "md" }: { shortName: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-[9px]", md: "w-11 h-11 text-xs", lg: "w-16 h-16 text-sm" };
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-black shrink-0 border font-condensed tracking-wider`}
      style={{ backgroundColor: color + "18", color, borderColor: color + "35" }}
    >
      {shortName}
    </div>
  );
}

interface TeamSelectProps {
  onSelectTeam: (teamId: string, coachName: string, coachType?: CoachType) => void;
}

export default function TeamSelect({ onSelectTeam }: TeamSelectProps) {
  const [selectedDiv, setSelectedDiv] = React.useState<DivisionId>("rkl");
  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);
  const [selectedCoachType, setSelectedCoachType] = React.useState<CoachType | null>(null);
  const coachInputRef = React.useRef<HTMLInputElement>(null);

  const teamsInDiv = TEAMS_DATA.filter(t => t.division === selectedDiv);
  const selectedTeam = selectedTeamId ? TEAMS_DATA.find(t => t.id === selectedTeamId) : null;

  function handleConfirm() {
    if (!selectedTeamId || !selectedCoachType) return;
    const finalCoach = coachInputRef.current?.value?.trim() || "Coach";
    onSelectTeam(selectedTeamId, finalCoach, selectedCoachType);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Court arc decorative */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ border: '1px solid hsl(38 95% 52% / 0.04)', top: '-300px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full"
          style={{ border: '1px solid hsl(38 95% 52% / 0.025)', top: '-450px' }} />
        {/* Ambient glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 50% 30% at 50% 0%, hsl(38 95% 52% / 0.06) 0%, transparent 60%)',
        }} />
      </div>

      <div className="relative w-full max-w-3xl mx-auto px-4 py-10 animate-fade-in">

        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm mb-6 text-[11px] font-bold tracking-[0.2em] uppercase font-condensed"
            style={{ background: 'hsl(38 95% 52% / 0.1)', color: 'hsl(38 95% 58%)', border: '1px solid hsl(38 95% 52% / 0.2)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:12,height:12}}>
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            Basketball Manager
          </div>
          <h1 className="font-display text-6xl sm:text-7xl text-foreground mb-3 tracking-wider">
            PICK YOUR CLUB
          </h1>
          <p className="text-muted-foreground text-sm font-condensed tracking-wide">Select division · Choose team · Define coaching identity</p>
        </div>

        {/* Division Tabs */}
        <div className="flex gap-1.5 mb-6 p-1.5 rounded-xl" style={{ background: 'hsl(220 22% 8%)' }}>
          {DIVISIONS.map(div => (
            <button
              key={div.id}
              onClick={() => { setSelectedDiv(div.id); setSelectedTeamId(null); }}
              className="flex-1 px-4 py-2.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-200 tracking-[0.1em] font-condensed uppercase cursor-pointer"
              style={{
                background: selectedDiv === div.id ? 'hsl(38 95% 52%)' : 'transparent',
                color: selectedDiv === div.id ? 'hsl(220 25% 5%)' : 'hsl(215 15% 50%)',
                boxShadow: selectedDiv === div.id ? '0 0 16px hsl(38 95% 52% / 0.25)' : 'none',
              }}
            >
              {div.name}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {teamsInDiv.map(team => {
            const isSelected = selectedTeamId === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className="flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 card-hover cursor-pointer"
                style={{
                  background: isSelected ? `${team.color}10` : 'hsl(220 22% 8%)',
                  borderColor: isSelected ? team.color + '60' : 'hsl(220 20% 12%)',
                  boxShadow: isSelected ? `0 0 18px ${team.color}18` : 'none',
                }}
              >
                <TeamLogo shortName={team.shortName} color={team.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold tracking-tight font-condensed uppercase" style={{ color: isSelected ? team.color : 'hsl(210 20% 92%)' }}>
                    {team.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-mono mt-0.5">{team.shortName}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-sm"
                          style={{ background: i < team.prestige ? team.color : 'hsl(220 20% 18%)' }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-mono text-muted-foreground">${(team.budget / 2).toLocaleString()}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: team.color }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="hsl(220 25% 5%)" strokeWidth={3} style={{width:12,height:12}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Coach + Confirm Panel */}
        {selectedTeam && (
          <div className="rounded-2xl border p-6 space-y-6 animate-pop-in"
            style={{ background: 'hsl(220 22% 7%)', borderColor: 'hsl(38 95% 52% / 0.25)', boxShadow: '0 0 40px hsl(38 95% 52% / 0.06)' }}>

            {/* Selected Team Banner */}
            <div className="flex items-center gap-4 pb-5" style={{ borderBottom: '1px solid hsl(220 20% 12%)' }}>
              <TeamLogo shortName={selectedTeam.shortName} color={selectedTeam.color} size="lg" />
              <div>
                <div className="text-2xl font-bold font-condensed uppercase tracking-wide text-foreground">{selectedTeam.name}</div>
                <div className="text-sm text-muted-foreground">{DIVISIONS.find(d => d.id === selectedTeam.division)?.name}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: i < selectedTeam.prestige ? selectedTeam.color : 'hsl(220 20% 16%)' }} />
                    ))}
                  </div>
                  <span className="badge-amber">Prestige {selectedTeam.prestige}/5</span>
                </div>
              </div>
            </div>

            {/* Coach Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2 font-condensed">
                Your Name
              </label>
              <input
                ref={coachInputRef}
                type="text"
                placeholder="Enter coach name..."
                maxLength={24}
                defaultValue=""
                className="w-full rounded-lg px-4 py-3 text-sm font-condensed text-foreground placeholder-muted-foreground/40 outline-none focus:ring-2 transition-all"
                style={{ background: 'hsl(220 20% 10%)', border: '1px solid hsl(220 20% 16%)', '--tw-ring-color': 'hsl(38 95% 52% / 0.4)' } as React.CSSProperties}
              />
            </div>

            {/* Coach Style */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 font-condensed">
                Coaching Style
              </label>
              <div className="space-y-2">
                {COACH_DEFS.map(coach => {
                  const isCoachSelected = selectedCoachType === coach.type;
                  return (
                    <button
                      key={coach.type}
                      onClick={() => setSelectedCoachType(coach.type)}
                      className="w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150 cursor-pointer"
                      style={{
                        background: isCoachSelected ? coach.color + '12' : 'hsl(220 20% 9%)',
                        borderColor: isCoachSelected ? coach.color + '55' : 'hsl(220 20% 13%)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{coach.emoji}</div>
                        <div className="flex-1">
                          <div className="text-xs font-bold font-condensed uppercase tracking-wide"
                            style={{ color: isCoachSelected ? coach.color : 'hsl(210 20% 88%)' }}>
                            {coach.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{coach.bonus}</div>
                        </div>
                        {isCoachSelected && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: coach.color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="hsl(220 25% 5%)" strokeWidth={3} style={{width:10,height:10}}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm */}
            <button
              onClick={handleConfirm}
              disabled={!selectedCoachType}
              className="w-full py-4 rounded-xl font-bold tracking-[0.15em] uppercase text-sm transition-all active:scale-95 font-condensed cursor-pointer"
              style={{
                background: selectedCoachType ? 'hsl(38 95% 52%)' : 'hsl(220 20% 12%)',
                color: selectedCoachType ? 'hsl(220 25% 5%)' : 'hsl(215 15% 40%)',
                boxShadow: selectedCoachType ? '0 0 24px hsl(38 95% 52% / 0.2)' : 'none',
                cursor: selectedCoachType ? 'pointer' : 'not-allowed',
              }}
            >
              {selectedCoachType ? `Start Career with ${selectedTeam.shortName} →` : "Choose a Coaching Style First"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
