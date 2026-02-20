import React from "react";
import { TEAMS_DATA, DIVISIONS } from "@/lib/gameData";
import { DivisionId } from "@/lib/types";

interface TeamSelectProps {
  onSelectTeam: (teamId: string) => void;
}

export default function TeamSelect({ onSelectTeam }: TeamSelectProps) {
  const [selectedDiv, setSelectedDiv] = React.useState<DivisionId>("rkl");

  const teamsInDiv = TEAMS_DATA.filter(t => t.division === selectedDiv);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="fm-header px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">🏀 Basketball Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">Select your team to begin</p>
        </div>

        {/* Division Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-border bg-card/50">
          {DIVISIONS.map(div => (
            <button
              key={div.id}
              onClick={() => setSelectedDiv(div.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                selectedDiv === div.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {div.name}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teamsInDiv.map(team => (
            <button
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 hover:glow-primary transition-all group text-left"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: team.color + "33", color: team.color }}
              >
                {team.shortName}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {team.name}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Prestige: {"⭐".repeat(team.prestige)}
                  </span>
                  <span className="text-xs text-mono text-muted-foreground">
                    ${(team.budget / 2).toLocaleString()}
                  </span>
                </div>
              </div>
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
