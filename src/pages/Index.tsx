import React, { useState } from "react";
import { GameProvider, useGame } from "@/hooks/useGameState";
import TeamSelect from "@/components/game/TeamSelect";
import GameLayout from "@/components/game/GameLayout";
import MultiplayerEntry from "@/components/multiplayer/MultiplayerEntry";
import LobbyScreen from "@/components/multiplayer/LobbyScreen";

type AppMode = "menu" | "singleplayer" | "multiplayer";

function SinglePlayerApp() {
  const { state, startGame } = useGame();
  if (!state) return <TeamSelect onSelectTeam={startGame} />;
  return <GameLayout />;
}

const Index = () => {
  const [mode, setMode] = useState<AppMode>("menu");

  if (mode === "menu") {
    return (
      <MultiplayerEntry
        onSinglePlayer={() => setMode("singleplayer")}
        onMultiplayer={() => setMode("multiplayer")}
      />
    );
  }

  if (mode === "multiplayer") {
    return <LobbyScreen onBack={() => setMode("menu")} />;
  }

  // Single player
  return (
    <GameProvider>
      <SinglePlayerApp />
    </GameProvider>
  );
};

export default Index;
