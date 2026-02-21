import React from "react";

interface MultiplayerEntryProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
}

export default function MultiplayerEntry({ onSinglePlayer, onMultiplayer }: MultiplayerEntryProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">Basketball Manager</h1>
        <p className="text-muted-foreground mt-2 text-sm">Lithuanian Basketball League</p>
      </div>

      {/* Mode Selection */}
      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onSinglePlayer}
          className="w-full group relative overflow-hidden rounded-xl bg-primary text-primary-foreground px-6 py-5 text-left transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Solo</div>
              <div className="text-xl font-black">Single Player</div>
              <div className="text-sm opacity-70 mt-0.5">Manage your club alone</div>
            </div>
            <span className="text-3xl">👤</span>
          </div>
        </button>

        <button
          onClick={onMultiplayer}
          className="w-full group relative overflow-hidden rounded-xl bg-card border border-border px-6 py-5 text-left transition-all hover:border-primary/50 hover:bg-secondary/30 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-primary opacity-80 mb-1">Live</div>
              <div className="text-xl font-black text-foreground">Multiplayer</div>
              <div className="text-sm text-muted-foreground mt-0.5">Play against a friend</div>
            </div>
            <span className="text-3xl">⚔️</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-muted-foreground">Real-time · Free · No account needed</span>
          </div>
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-10 opacity-50">
        v1.0 · Basketball Manager
      </p>
    </div>
  );
}
