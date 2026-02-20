import React, { useState } from "react";
import { useLobby } from "@/hooks/useLobby";
import { TEAMS_DATA, DIVISIONS } from "@/lib/gameData";
import { DivisionId } from "@/lib/types";
import GameLayout from "@/components/game/GameLayout";
import { MultiplayerGameProvider } from "@/hooks/useGameState";

type LobbyView = "menu" | "create_pick_team" | "join_enter_code" | "join_pick_team" | "waiting" | "in_game";

interface LobbyScreenProps {
  onBack: () => void;
}

export default function LobbyScreen({ onBack }: LobbyScreenProps) {
  const {
    lobbyState, gameState, myFinances, opponentFinances,
    isCreatingOrJoining, error,
    createLobby, joinLobby, startGame, setReady, cancelReady,
    updateMyTeam, leaveLobby,
  } = useLobby();

  const [view, setView] = useState<LobbyView>("menu");
  const [joinCode, setJoinCode] = useState("");
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<DivisionId>("rkl");
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error || localError;

  // If game is in progress, render the full game layout in multiplayer mode
  if (lobbyState?.status === "in_game" && gameState && myFinances) {
    return (
      <MultiplayerGameProvider
        initialGameState={gameState}
        initialFinances={myFinances}
        lobbyState={lobbyState}
        onReady={setReady}
        onCancelReady={cancelReady}
        onUpdateTeam={updateMyTeam}
        onLeave={() => { leaveLobby(); onBack(); }}
      >
        <GameLayout />
      </MultiplayerGameProvider>
    );
  }

  async function handleCreateLobby() {
    if (!pendingTeamId) return;
    setLocalError(null);
    try {
      const code = await createLobby(pendingTeamId);
      setGeneratedCode(code);
      setView("waiting");
    } catch {
      setLocalError("Failed to create lobby. Check your internet connection.");
    }
  }

  async function handleJoinLobby() {
    if (!pendingTeamId || !joinCode.trim()) return;
    setLocalError(null);
    const success = await joinLobby(joinCode.trim().toUpperCase(), pendingTeamId);
    if (success) {
      setView("waiting");
    } else {
      // Error is already set by the hook, just ensure we show the error message
      setLocalError("Failed to join lobby. The code may be invalid or the lobby is full.");
    }
  }

  async function handleStartGame() {
    await startGame();
  }

  function handleCopyCode() {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleLeave() {
    leaveLobby();
    setView("menu");
    setGeneratedCode(null);
    setPendingTeamId(null);
    setLocalError(null);
  }

  const takenTeamId = lobbyState?.myRole === "guest" ? lobbyState.opponentTeamId : null;

  // ── TEAM PICKER ──────────────────────────────────────────────────────────
  function TeamPicker({
    onConfirm,
    confirmLabel,
    disabledTeamId,
  }: {
    onConfirm: () => void;
    confirmLabel: string;
    disabledTeamId?: string | null;
  }) {
    return (
      <div>
        {/* Division tabs */}
        <div className="flex gap-2 mb-4">
          {DIVISIONS.map((div) => (
            <button
              key={div.id}
              onClick={() => setSelectedDivision(div.id as DivisionId)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedDivision === div.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {div.name}
            </button>
          ))}
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {TEAMS_DATA.filter((t) => t.division === selectedDivision).map((team) => {
            const isTaken = team.id === disabledTeamId;
            const isSelected = team.id === pendingTeamId;
            return (
              <button
                key={team.id}
                onClick={() => !isTaken && setPendingTeamId(team.id)}
                disabled={isTaken}
                className={`relative p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : isTaken
                    ? "opacity-40 cursor-not-allowed border-border bg-card"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {isTaken && (
                  <div className="absolute top-1.5 right-1.5 text-[9px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-bold">
                    TAKEN
                  </div>
                )}
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{ backgroundColor: team.color + "33", color: team.color }}
                  >
                    {team.shortName}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">{team.name}</div>
                    <div className="text-[10px] text-muted-foreground">{"★".repeat(team.prestige)}{"☆".repeat(5 - team.prestige)}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {displayError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {displayError}
          </div>
        )}

        <button
          onClick={onConfirm}
          disabled={!pendingTeamId || isCreatingOrJoining}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isCreatingOrJoining ? "Please wait..." : confirmLabel}
        </button>
      </div>
    );
  }

  // ── VIEWS ─────────────────────────────────────────────────────────────────

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="text-3xl font-black text-foreground">Multiplayer</h1>
          <p className="text-muted-foreground text-sm mt-1">Play against a friend in real time</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => setView("create_pick_team")}
            className="w-full rounded-xl bg-primary text-primary-foreground px-6 py-4 text-left hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-0.5">Host</div>
            <div className="text-lg font-black">Create Lobby</div>
            <div className="text-sm opacity-70">Get a 6-letter code to share</div>
          </button>

          <button
            onClick={() => setView("join_enter_code")}
            className="w-full rounded-xl bg-card border border-border px-6 py-4 text-left hover:border-primary/50 active:scale-[0.98] transition-all"
          >
            <div className="text-xs font-semibold uppercase tracking-widest text-primary opacity-80 mb-0.5">Join</div>
            <div className="text-lg font-black text-foreground">Join Lobby</div>
            <div className="text-sm text-muted-foreground">Enter your friend's code</div>
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to menu
        </button>
      </div>
    );
  }

  if (view === "create_pick_team") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">
            ← Back
          </button>
          <h2 className="text-2xl font-black text-foreground">Pick Your Team</h2>
          <p className="text-muted-foreground text-sm">You'll manage this team as the host</p>
        </div>
        <TeamPicker onConfirm={handleCreateLobby} confirmLabel="Create Lobby →" />
      </div>
    );
  }

  if (view === "join_enter_code") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">
            ← Back
          </button>
          <h2 className="text-2xl font-black text-foreground">Enter Lobby Code</h2>
          <p className="text-muted-foreground text-sm">Ask your friend for their 6-letter code</p>
        </div>

        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          className="w-full text-center text-3xl font-black tracking-[0.5em] bg-card border border-border rounded-xl py-4 px-6 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary mb-6"
        />

        <button
          onClick={() => joinCode.length === 6 && setView("join_pick_team")}
          disabled={joinCode.length !== 6}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Find Lobby →
        </button>
      </div>
    );
  }

  if (view === "join_pick_team") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("join_enter_code")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">
            ← Back
          </button>
          <h2 className="text-2xl font-black text-foreground">Pick Your Team</h2>
          <p className="text-muted-foreground text-sm">Joining lobby <span className="font-mono text-primary">{joinCode}</span></p>
        </div>
        <TeamPicker
          onConfirm={handleJoinLobby}
          confirmLabel="Join Lobby →"
          disabledTeamId={takenTeamId}
        />
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────
  if (view === "waiting") {
    const isHost = lobbyState?.myRole === "host";
    const guestConnected = !!lobbyState?.opponentTeamId;
    const myTeam = TEAMS_DATA.find((t) => t.id === lobbyState?.myTeamId);
    const opponentTeam = TEAMS_DATA.find((t) => t.id === lobbyState?.opponentTeamId);

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Code display */}
          {isHost && generatedCode && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Share this code</div>
              <div className="text-4xl font-black tracking-[0.3em] text-foreground font-mono mb-4">
                {generatedCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="text-sm text-primary hover:opacity-80 transition-opacity font-medium"
              >
                {copied ? "✓ Copied!" : "Copy to clipboard"}
              </button>
            </div>
          )}

          {/* Players */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Players</div>

            {/* Me */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black"
                style={{ backgroundColor: (myTeam?.color ?? "#666") + "33", color: myTeam?.color ?? "#666" }}
              >
                {myTeam?.shortName ?? "?"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{myTeam?.name ?? "You"}</div>
                <div className="text-xs text-muted-foreground">{isHost ? "Host (you)" : "Guest (you)"}</div>
              </div>
              <span className="text-green-500 text-xs font-semibold">✓ Ready</span>
            </div>

            {/* Opponent */}
            <div className="flex items-center gap-3">
              {opponentTeam ? (
                <>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black"
                    style={{ backgroundColor: opponentTeam.color + "33", color: opponentTeam.color }}
                  >
                    {opponentTeam.shortName}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground">{opponentTeam.name}</div>
                    <div className="text-xs text-muted-foreground">{isHost ? "Guest" : "Host"}</div>
                  </div>
                  <span className="text-green-500 text-xs font-semibold">✓ Joined</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                    ?
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-muted-foreground">Waiting for player...</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Not connected
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Start / status */}
          {isHost && guestConnected && (
            <button
              onClick={handleStartGame}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity mb-3"
            >
              🏀 Start Game →
            </button>
          )}

          {isHost && !guestConnected && (
            <div className="text-center text-sm text-muted-foreground animate-pulse mb-3 bg-secondary/50 rounded-lg py-3">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping mr-2"></span>
              Waiting for player to join...
            </div>
          )}

          {!isHost && (
            <div className="text-center text-sm text-muted-foreground animate-pulse mb-3 bg-secondary/50 rounded-lg py-3">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping mr-2"></span>
              Waiting for host to start the game...
            </div>
          )}

          <button
            onClick={handleLeave}
            className="w-full py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Leave Lobby
          </button>
        </div>
      </div>
    );
  }

  return null;
}
