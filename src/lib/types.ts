export type PlayerRole = "Sharpshooter" | "Defender" | "Playmaker";

export interface PlayerAttributes {
  height: number; // cm
  shooting: number; // 1-99
  defending: number; // 1-99
  dribbling: number; // 1-99
  passing: number; // 1-99
}

export type PlayerRarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface Player {
  id: string;
  name: string;
  age: number;
  role: PlayerRole;
  attributes: PlayerAttributes;
  overall: number;
  salary: number;
  contractYears: number;
  isYouth?: boolean;
  isStarter?: boolean;
  seasonsWithoutPlay?: number;
  rarity?: PlayerRarity;
  // Used to avoid instantly burning a contract year for players signed during the off-season
  joinedThisOffseason?: boolean;
}

export type DivisionId = "rkl" | "lkl";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  division: DivisionId;
  prestige: number; // 1-5
  color: string;
  budget: number;
  players: Player[];
}

export interface StandingsEntry {
  teamId: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: number;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  week: number;
}

export type SeasonModifier =
  | "foreign_investment"
  | "financial_crisis"
  | "injury_crisis"
  | "fan_boom";

export interface SeasonModifierInfo {
  id: SeasonModifier;
  name: string;
  description: string;
  emoji: string;
}

export type SeasonBonusId =
  | "bonus_ticket_10"
  | "bonus_sponsor_10"
  | "bonus_wage_minus10";

export interface SeasonBonusInfo {
  id: SeasonBonusId;
  name: string;
  description: string;
  emoji: string;
}

export interface GameState {
  selectedTeamId: string;
  season: number;
  week: number;
  phase: "team_select" | "preseason" | "regular" | "playoffs" | "offseason";

  teams: Team[];
  standings: Record<DivisionId, StandingsEntry[]>;
  schedule: MatchResult[];
  seasonModifier: SeasonModifier | null;
  declinedPlayerIds: string[];
  playoffBracket: PlayoffMatchup[];
  gameOver: boolean;
  gameOverReason?: string;
  finances: FinanceRecord;
  youthIntakeUsed?: boolean;
  consecutiveNegativeSeasons?: number;
  seasonBonus?: SeasonBonusId | null;
}

export interface FinanceRecord {
  ticketIncome: number;
  sponsorIncome: number;
  prizeIncome: number;
  totalWages: number;
  transferSpending: number;
  balance: number;
}

export interface PlayoffMatchup {
  round: number;
  team1Id: string;
  team2Id: string;
  team1Wins: number;
  team2Wins: number;
  winnerId?: string;
}

export interface FreeAgent extends Player {
  askingSalary: number;
  // For B League: store real attributes and ranges for display
  realAttributes?: PlayerAttributes;
  realOverall?: number;
  attributeRanges?: {
    shooting: { min: number; max: number };
    defending: { min: number; max: number };
    dribbling: { min: number; max: number };
    passing: { min: number; max: number };
    overall: { min: number; max: number };
  };
}

export type GameView = "dashboard" | "squad" | "transfers" | "finance" | "league" | "playoffs";
