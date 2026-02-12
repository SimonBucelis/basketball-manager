// Data models - ported from models.js
import { CONFIG, type Role } from './gameConfig';

export interface PlayerData {
  id: number;
  name: string;
  age: number;
  rating: number;
  hiddenPotential: number;
  potentialStars: number;
  role: Role;
  contractYears: number;
  teamId: number | null;
  retired: boolean;
  status: 'starter' | 'bench' | 'reserve';
  extendAttempted: boolean;
  wage: number;
  acquisitionType: string;
  transferFee: number;
  signed?: boolean;
  declined?: boolean;
  inMarket?: boolean;
}

export interface TransferItem {
  player: PlayerData;
  price: number;
  fromTeamId: number;
}

export interface SeasonStats {
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  place: number | null;
}

export interface Transaction {
  year: number;
  type: string;
  amount: number;
  description: string;
}

export interface FinanceRecord {
  year: number;
  cash: number;
  profit: number;
}

export interface MatchLog {
  home: string;
  away: string;
  scoreHome: number;
  scoreAway: number;
  winner: string;
}

export interface PlayoffRound {
  name: string;
  games: MatchLog[];
}

export interface PlayoffLog {
  rounds: PlayoffRound[];
  champion: string | null;
}

export function calculateWage(player: PlayerData, teamPrestige: number): number {
  const E = CONFIG.ECONOMY;
  const base = player.rating * E.WAGE_BASE;
  const prestigeFactor = E.PRESTIGE_FACTOR_MIN + (teamPrestige / E.PRESTIGE_FACTOR_DIVISOR);
  const ageFactor = player.age < E.AGE_YOUNG_THRESHOLD ? E.AGE_YOUNG_FACTOR :
                    player.age > E.AGE_OLD_THRESHOLD ? E.AGE_OLD_FACTOR : 1.0;
  const potentialBonus = 1 + Math.max(0, (player.potentialStars - E.POTENTIAL_BONUS_THRESHOLD) * E.POTENTIAL_BONUS_MULTIPLIER);
  return Math.round(base * prestigeFactor * ageFactor * potentialBonus);
}

export interface TeamData {
  id: number;
  name: string;
  abbrev: string;
  prestige: number;
  players: PlayerData[];
  seasonStats: SeasonStats;
  yearFounded: number;
  playoffSeriesWins: number;
  playoffRoundReached: string;
  startingCash: number;
  cash: number;
  wageBudget: number;
  transferBudget: number;
  financeHistory: FinanceRecord[];
  transactions: Transaction[];
}

export function createTeam(data: Partial<TeamData> & { id: number; name: string; abbrev: string; prestige: number }): TeamData {
  return {
    id: data.id,
    name: data.name,
    abbrev: data.abbrev,
    prestige: Math.min(5, Math.max(1, data.prestige || 3)),
    players: data.players || [],
    seasonStats: data.seasonStats || { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, place: null },
    yearFounded: data.yearFounded || new Date().getFullYear(),
    playoffSeriesWins: data.playoffSeriesWins || 0,
    playoffRoundReached: data.playoffRoundReached || "Did not qualify",
    startingCash: data.startingCash || 100000,
    cash: data.cash !== undefined ? data.cash : (data.startingCash || 100000),
    wageBudget: data.wageBudget || 0,
    transferBudget: data.transferBudget || 0,
    financeHistory: data.financeHistory || [],
    transactions: data.transactions || [],
  };
}

export function resetSeasonStats(team: TeamData) {
  team.seasonStats = { wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, place: null };
  team.playoffSeriesWins = 0;
  team.playoffRoundReached = "Did not qualify";
}

export function getProfit(team: TeamData): number {
  return team.cash - team.startingCash;
}

export function calculateRequiredWages(team: TeamData): number {
  return team.players.reduce((sum, p) => sum + (p.wage || 0), 0);
}

export function updateBudgets(team: TeamData) {
  team.wageBudget = calculateRequiredWages(team);
  team.transferBudget = team.cash - team.wageBudget;
}

export function recordFinanceHistory(team: TeamData, year: number) {
  team.financeHistory.push({ year, cash: team.cash, profit: getProfit(team) });
}

export function addTransaction(team: TeamData, year: number, type: string, amount: number, description: string = '') {
  team.transactions.push({ year, type, amount, description });
}

export interface LeagueState {
  year: number;
  season: number;
  teams: TeamData[];
  freeAgents: PlayerData[];
  freeAgentPool: PlayerData[];
  transferMarket: TransferItem[];
  userTeamId: number | null;
  phase: string;
  history: unknown[];
  matchLog: MatchLog[];
  playoffLog: PlayoffLog;
  didYouthThisOffseason: boolean;
  seasonStarted: boolean;
  seasonModifier: string | null;
}

export function createLeague(): LeagueState {
  return {
    year: new Date().getFullYear(),
    season: 1,
    teams: [],
    freeAgents: [],
    freeAgentPool: [],
    transferMarket: [],
    userTeamId: null,
    phase: CONFIG.PHASES.TEAM_SELECTION,
    history: [],
    matchLog: [],
    playoffLog: { rounds: [], champion: null },
    didYouthThisOffseason: false,
    seasonStarted: false,
    seasonModifier: null,
  };
}
