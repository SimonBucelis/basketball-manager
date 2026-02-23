import React, { useState } from "react";
import { get, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { useLobby } from "@/hooks/useLobby";
import { TEAMS_DATA, DIVISIONS } from "@/lib/gameData";
import { DivisionId, CoachType } from "@/lib/types";
import { LobbyFirebaseData } from "@/lib/multiplayerTypes";
import GameLayout from "@/components/game/GameLayout";
import { TeamLogo } from "@/components/game/TeamSelect";
import { MultiplayerGameProvider } from "@/hooks/useGameState";

type LobbyView =
  | "menu"
  | "create_pick_coach"
  | "create_pick_team"
  | "join_enter_code"
  | "join_pick_coach"
  | "join_pick_team"
  | "waiting"
  | "in_game";

export interface CoachDef {
  type: CoachType;
  emoji: string;
  label: string;
  synergyRole: string;
  bonus: string;
  color: string;
}

export const COACH_DEFS: CoachDef[] = [
  {
    type: "attack",
    emoji: "⚔️",
    label: "Attack Coach",
    synergyRole: "Sharpshooters",
    bonus: "+5% Shooting Power",
    color: "#f59e0b",
  },
  {
    type: "defense",
    emoji: "🛡️",
    label: "Defense Coach",
    synergyRole: "Defenders",
    bonus: "+5% Defensive Strength",
    color: "#3b82f6",
  },
  {
    type: "playmaking",
    emoji: "🏀",
    label: "Playmaking Coach",
    synergyRole: "Playmakers",
    bonus: "+5% Playmaking Edge",
    color: "#22c55e",
  },
];

interface LobbyScreenProps {
  onBack: () => void;
}

export default function LobbyScreen({ onBack }: LobbyScreenProps) {
  const {
    lobbyState, gameState, myFinances,
    isCreatingOrJoining, error,
    createLobby, joinLobby, startGame, setReady, cancelReady,
    updateMyTeam, leaveLobby,
  } = useLobby();

  const [view, setView] = useState<LobbyView>("menu");
  const [joinCode, setJoinCode] = useState("");
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);
  const [pendingCoachType, setPendingCoachType] = useState<CoachType | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<DivisionId>("rkl");
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [hostCoachPreview, setHostCoachPreview] = useState<{ name: string; type: CoachType } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const coachInputRef = React.useRef<HTMLInputElement>(null);
  const savedCoachName = React.useRef<string>("Coach");
  const savedCoachType = React.useRef<CoachType>("attack");

  const displayError = error || localError;

  // ── IN GAME ───────────────────────────────────────────────────────────────
  if (lobbyState?.status === "in_game" && gameState && myFinances) {
    const isHost = lobbyState.myRole === "host";
    const enrichedGameState = {
      ...gameState,
      // Always inject as coachName/coachType so UI displays for both host and guest
      coachName: savedCoachName.current,
      coachType: savedCoachType.current,
      ...(isHost
        ? {}
        : { guestCoachName: savedCoachName.current, guestCoachType: savedCoachType.current }),
    };
    return (
      <MultiplayerGameProvider
        initialGameState={enrichedGameState}
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

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  async function handleCreateLobby() {
    if (!pendingTeamId || !pendingCoachType) return;
    savedCoachName.current = coachInputRef.current?.value?.trim() || "Coach";
    savedCoachType.current = pendingCoachType;
    setLocalError(null);
    try {
      const code = await createLobby(pendingTeamId, pendingCoachType, savedCoachName.current);
      setGeneratedCode(code);
      setView("waiting");
    } catch {
      setLocalError("Failed to create lobby. Check your internet connection.");
    }
  }

  async function handleStartGame() {
    setIsStartingGame(true);
    setLocalError(null);
    try {
      await startGame();
    } catch (e: any) {
      setLocalError("Failed to start game. Please try again.");
      console.error("startGame error:", e);
    } finally {
      setIsStartingGame(false);
    }
  }

  async function handleJoinLobby() {
    if (!pendingTeamId || !joinCode.trim() || !pendingCoachType) return;
    savedCoachName.current = coachInputRef.current?.value?.trim() || "Coach";
    savedCoachType.current = pendingCoachType;
    setLocalError(null);
    const success = await joinLobby(
      joinCode.trim().toUpperCase(),
      pendingTeamId,
      pendingCoachType,
      savedCoachName.current,
    );
    if (success) {
      setView("waiting");
    } else {
      setLocalError("Failed to join lobby. The code may be invalid or the lobby is full.");
    }
  }

  async function handleFindLobby() {
    if (joinCode.length !== 6) return;
    setIsLoadingPreview(true);
    setLocalError(null);
    try {
      const snapshot = await get(ref(db, `lobbies/${joinCode.trim().toUpperCase()}`));
      if (!snapshot.exists()) {
        setLocalError("Lobby not found. Check the code and try again.");
        return;
      }
      const data: LobbyFirebaseData = snapshot.val();
      if (data.status !== "waiting") { setLocalError("This lobby has already started."); return; }
      if (data.guestTeamId) { setLocalError("This lobby is full."); return; }
      setHostCoachPreview(
        data.hostCoachType && data.hostCoachName
          ? { name: data.hostCoachName, type: data.hostCoachType as CoachType }
          : null
      );
      setView("join_pick_coach");
    } catch {
      setLocalError("Failed to connect. Check your internet connection.");
    } finally {
      setIsLoadingPreview(false);
    }
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
    setPendingCoachType(null);
    setLocalError(null);
    setHostCoachPreview(null);
  }

  const takenTeamId = lobbyState?.myRole === "guest" ? lobbyState.opponentTeamId : null;

  // ── COACH PICKER ─────────────────────────────────────────────────────────
  function CoachPicker({ hostCoach, onNext }: {
    hostCoach?: { name: string; type: CoachType } | null;
    onNext: () => void;
  }) {
    return (
      <div className="space-y-4">
        {/* Host's coach preview for guests */}
        {hostCoach && (() => {
          const hDef = COACH_DEFS.find(c => c.type === hostCoach.type)!;
          return (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                🕵️ Opponent's Coach
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{hDef.emoji}</span>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {hostCoach.name} — {hDef.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hDef.bonus} when {hDef.synergyRole} dominate lineup
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Choose Your Coach Style
        </div>

        {COACH_DEFS.map((coach) => {
          const isSelected = pendingCoachType === coach.type;
          return (
            <button
              key={coach.type}
              onClick={() => setPendingCoachType(coach.type)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{coach.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    {coach.label}
                    {isSelected && (
                      <span className="text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Synergy: lineup dominated by{" "}
                    <span className="font-semibold text-foreground">{coach.synergyRole}</span>
                  </div>
                  <div className="text-xs font-semibold mt-1" style={{ color: coach.color }}>
                    ✦ {coach.bonus}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Coach name */}
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
        </div>

        {displayError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {displayError}
          </div>
        )}

        <button
          onClick={onNext}
          disabled={!pendingCoachType}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shadow-md"
        >
          {pendingCoachType ? "Pick Your Team →" : "Select a Coach Style"}
        </button>
      </div>
    );
  }

  // ── TEAM PICKER ──────────────────────────────────────────────────────────
  function TeamPicker({ onConfirm, confirmLabel, disabledTeamId }: {
    onConfirm: () => void;
    confirmLabel: string;
    disabledTeamId?: string | null;
  }) {
    const selectedCoach = pendingCoachType ? COACH_DEFS.find(c => c.type === pendingCoachType) : null;

    return (
      <div>
        {/* Coach badge */}
        {selectedCoach && (
          <div
            className="flex items-center gap-3 rounded-xl p-3 mb-4 border"
            style={{ borderColor: selectedCoach.color + "55", background: selectedCoach.color + "11" }}
          >
            <span className="text-2xl">{selectedCoach.emoji}</span>
            <div>
              <div className="text-xs font-bold text-foreground">{selectedCoach.label}</div>
              <div className="text-[10px] text-muted-foreground">
                {selectedCoach.bonus} · synergy with {selectedCoach.synergyRole}
              </div>
            </div>
          </div>
        )}

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
                  <TeamLogo shortName={team.shortName} color={team.color} size="sm" />
                  <div>
                    <div className="text-xs font-bold text-foreground leading-tight">{team.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {"★".repeat(team.prestige)}{"☆".repeat(5 - team.prestige)}
                    </div>
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
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base tracking-wide hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 shadow-md"
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
            onClick={() => setView("create_pick_coach")}
            className="w-full rounded-xl bg-primary text-primary-foreground px-6 py-4 text-left hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-0.5">Host</div>
            <div className="text-lg font-black">Create Lobby</div>
            <div className="text-sm opacity-70">Pick coach → pick team → share code</div>
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
        <button onClick={onBack} className="mt-8 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to menu
        </button>
      </div>
    );
  }

  if (view === "create_pick_coach") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">← Back</button>
          <h2 className="text-2xl font-black text-foreground">Choose Your Coach</h2>
          <p className="text-muted-foreground text-sm">Step 1 of 2 · Pick your coaching style</p>
        </div>
        <CoachPicker onNext={() => pendingCoachType && setView("create_pick_team")} />
      </div>
    );
  }

  if (view === "create_pick_team") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("create_pick_coach")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">← Back</button>
          <h2 className="text-2xl font-black text-foreground">Pick Your Team</h2>
          <p className="text-muted-foreground text-sm">Step 2 of 2 · You'll manage this team as the host</p>
        </div>
        <TeamPicker onConfirm={handleCreateLobby} confirmLabel="Create Lobby →" />
      </div>
    );
  }

  if (view === "join_enter_code") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">← Back</button>
          <h2 className="text-2xl font-black text-foreground">Enter Lobby Code</h2>
          <p className="text-muted-foreground text-sm">Ask your friend for their 6-letter code</p>
        </div>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABC123"
          maxLength={6}
          className="w-full text-center text-3xl font-black tracking-[0.5em] bg-card border border-border rounded-xl py-4 px-6 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary mb-4"
        />
        {displayError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {displayError}
          </div>
        )}
        <button
          onClick={handleFindLobby}
          disabled={joinCode.length !== 6 || isLoadingPreview}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {isLoadingPreview ? "Looking up lobby..." : "Find Lobby →"}
        </button>
      </div>
    );
  }

  if (view === "join_pick_coach") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => { setView("join_enter_code"); setLocalError(null); }} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">← Back</button>
          <h2 className="text-2xl font-black text-foreground">Choose Your Coach</h2>
          <p className="text-muted-foreground text-sm">
            Joining <span className="font-mono text-primary">{joinCode}</span> · Step 1 of 2
          </p>
        </div>
        <CoachPicker hostCoach={hostCoachPreview} onNext={() => pendingCoachType && setView("join_pick_team")} />
      </div>
    );
  }

  if (view === "join_pick_team") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
        <div className="mb-6">
          <button onClick={() => setView("join_pick_coach")} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">← Back</button>
          <h2 className="text-2xl font-black text-foreground">Pick Your Team</h2>
          <p className="text-muted-foreground text-sm">
            Step 2 of 2 · Joining <span className="font-mono text-primary">{joinCode}</span>
          </p>
        </div>
        <TeamPicker onConfirm={handleJoinLobby} confirmLabel="Join Lobby →" disabledTeamId={takenTeamId} />
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────────────────────
  if (view === "waiting") {
    const isHost = lobbyState?.myRole === "host";
    const guestConnected = !!lobbyState?.opponentTeamId;
    const myTeam = TEAMS_DATA.find((t) => t.id === lobbyState?.myTeamId);
    const opponentTeam = TEAMS_DATA.find((t) => t.id === lobbyState?.opponentTeamId);
    const myCoachDef = pendingCoachType ? COACH_DEFS.find(c => c.type === pendingCoachType) : null;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {isHost && generatedCode && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Share this code</div>
              <div className="text-4xl font-black tracking-[0.3em] text-foreground font-mono mb-4">{generatedCode}</div>
              <button onClick={handleCopyCode} className="text-sm text-primary hover:opacity-80 transition-opacity font-medium">
                {copied ? "✓ Copied!" : "Copy to clipboard"}
              </button>
            </div>
          )}

          {myCoachDef && (
            <div
              className="rounded-xl p-3 mb-4 border flex items-center gap-3"
              style={{ borderColor: myCoachDef.color + "44", background: myCoachDef.color + "0f" }}
            >
              <span className="text-xl">{myCoachDef.emoji}</span>
              <div>
                <div className="text-xs font-bold text-foreground">Your Coach: {myCoachDef.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {savedCoachName.current} · {myCoachDef.bonus}
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Players</div>
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
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">?</div>
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

          {isHost && guestConnected && (
            <button onClick={handleStartGame} disabled={isStartingGame} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-60 mb-3">
              {isStartingGame ? "Starting..." : "🏀 Start Game →"}
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
          <button onClick={handleLeave} className="w-full py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground transition-colors">
            Leave Lobby
          </button>
        </div>
      </div>
    );
  }

  return null;
}
