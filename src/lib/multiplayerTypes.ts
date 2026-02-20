import { FinanceRecord, GameState } from "./types";

export type LobbyStatus = "waiting" | "in_game" | "finished";

export interface LobbyFirebaseData {
  status: LobbyStatus;
  hostTeamId: string;
  guestTeamId: string | null;
  hostReady: boolean;
  guestReady: boolean;
  gameState: GameState | null;
  hostFinances: FinanceRecord | null;
  guestFinances: FinanceRecord | null;
  createdAt: number;
}

export interface MultiplayerLobbyState {
  lobbyCode: string;
  myRole: "host" | "guest";
  myTeamId: string;
  opponentTeamId: string | null;
  myReady: boolean;
  opponentReady: boolean;
  status: LobbyStatus;
}
