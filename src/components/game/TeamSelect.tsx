import React from "react";
import { TEAMS_DATA, DIVISIONS } from "@/lib/gameData";
import { DivisionId, CoachType } from "@/lib/types";
import { COACH_DEFS } from "@/components/multiplayer/LobbyScreen";

// Team logo component: colored badge with short name
function TeamLogo({ shortName, color, size = "md" }: { shortName: string; color: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-[9px]", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-base" };
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-black shrink-0 border-2`}
      style={{ backgroundColor: color + "22", color, borderColor: color + "55" }}
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
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="fm-header px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">🏀 Basketball Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick your coach style and team to begin</p>
        </div>

        {/* Division Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-border bg-card/50">
          {DIVISIONS.map(div => (
            <button
              key={div.id}
              onClick={() => { setSelectedDiv(div.id); setSelectedTeamId(null); }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${
                selectedDiv === div.id
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {div.name}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teamsInDiv.map(team => {
            const isSelected = selectedTeamId === team.id;
            return (
              <button
                key={team.id}
                onClick={() => setSelectedTeamId(team.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <TeamLogo shortName={team.shortName} color={team.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {team.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{team.shortName}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">{"⭐".repeat(team.prestige)}</span>
                    <span className="text-xs text-mono text-muted-foreground">${(team.budget / 2).toLocaleString()}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Coach + Confirm Panel — shows after team selected */}
        {selectedTeam && (
          <div className="mx-6 mb-8 bg-card border-2 border-primary/40 rounded-2xl p-5 space-y-5 animate-fade-in">
            <div className="flex items-center gap-4">
              <TeamLogo shortName={selectedTeam.shortName} color={selectedTeam.color} size="lg" />
              <div>
                <div className="text-lg font-bold text-foreground">{selectedTeam.name}</div>
                <div className="text-sm text-muted-foreground">{DIVISIONS.find(d => d.id === selectedTeam.division)?.name}</div>
              </div>
            </div>

            {/* Coach Style Picker */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                🏆 Choose Your Coach Style
              </label>
              <div className="space-y-2">
                {COACH_DEFS.map(coach => {
                  const isSelected = selectedCoachType === coach.type;
                  return (
                    <button
                      key={coach.type}
                      onClick={() => setSelectedCoachType(coach.type)}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{coach.emoji}</span>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-foreground">{coach.label}</div>
                          <div className="text-xs text-muted-foreground">
                            Synergy with <span className="font-semibold">{coach.synergyRole}</span> starters
                          </div>
                        </div>
                        <div className="text-xs font-semibold" style={{ color: coach.color }}>{coach.bonus}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coach Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                🎽 Your Coach Name
              </label>
              <input
                ref={coachInputRef}
                type="text"
                defaultValue=""
                placeholder="Enter your coach name..."
                maxLength={24}
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Leave blank to use "Coach"</p>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              disabled={!selectedCoachType}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-40"
            >
              {selectedCoachType ? `Start Managing ${selectedTeam.shortName} →` : "Select a Coach Style to continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export the logo component for use in other parts of the app
export { TeamLogo };

