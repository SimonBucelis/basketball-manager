// Game engine - ported from game.js
import { CONFIG } from './gameConfig';
import { Utils } from './gameUtils';
import {
  type PlayerData, type TeamData, type LeagueState, type MatchLog,
  createTeam, createLeague, calculateWage, resetSeasonStats,
  updateBudgets, recordFinanceHistory, addTransaction, calculateRequiredWages,
} from './gameModels';

let playerIdCounter = 0;

function calculatePotentialStars(age: number, hiddenPotential: number): number {
  if (age >= 35) return 1;
  if (age <= 22) {
    if (hiddenPotential > 85) return 5;
    if (hiddenPotential > 75) return 4;
    if (hiddenPotential > 65) return 3;
    if (hiddenPotential > 55) return 2;
    return 1;
  }
  const remainingGrowth = hiddenPotential - 65;
  if (remainingGrowth > 20) return 5;
  if (remainingGrowth > 15) return 4;
  if (remainingGrowth > 10) return 3;
  if (remainingGrowth > 5) return 2;
  return 1;
}

function generatePlayer(teamId: number | null, prestige: number = 3, isYouth: boolean = false): PlayerData {
  const fName = CONFIG.PLAYER_DB.firstNames[Utils.randInt(0, CONFIG.PLAYER_DB.firstNames.length - 1)];
  const lName = CONFIG.PLAYER_DB.lastNames[Utils.randInt(0, CONFIG.PLAYER_DB.lastNames.length - 1)];
  const role = CONFIG.ROLES[Utils.randInt(0, 2)];

  let age: number;
  if (isYouth) {
    age = Utils.randInt(18, 20);
  } else {
    const ageGroup = Utils.weightedChoice([
      { item: "young", weight: Utils.clamp(20 + (3 - prestige) * 5, 5, 60) },
      { item: "prime", weight: Utils.clamp(50 + (prestige - 3) * 10, 20, 80) },
      { item: "veteran", weight: Utils.clamp(30 + (3 - prestige) * 5, 5, 60) },
    ]);
    if (ageGroup === "young") age = Utils.randInt(18, 22);
    else if (ageGroup === "prime") age = Utils.randInt(23, 30);
    else age = Utils.randInt(31, 36);
  }

  const prestigeBase: Record<number, number> = {
    5: Utils.randInt(70, 80), 4: Utils.randInt(65, 75), 3: Utils.randInt(60, 70),
    2: Utils.randInt(55, 65), 1: Utils.randInt(48, 60),
  };
  const base = prestigeBase[Math.round(prestige)] || Utils.randInt(55, 70);

  let ageModifier = 0;
  if (age <= 22) ageModifier = -5 + Utils.randInt(0, 6);
  else if (age <= 27) ageModifier = Utils.randInt(0, 6);
  else if (age <= 31) ageModifier = Utils.randInt(-2, 4);
  else ageModifier = -Utils.randInt(0, 8);
  if (isYouth) ageModifier -= Utils.randInt(5, 10);

  const currentRating = Utils.clamp(base + ageModifier + Utils.randInt(-3, 3), 30, 95);
  let potential: number;
  if (age <= 22) potential = Utils.clamp(currentRating + Utils.randInt(5, 25), currentRating, 95);
  else if (age <= 27) potential = Utils.clamp(currentRating + Utils.randInt(2, 15), currentRating, 95);
  else potential = Utils.clamp(currentRating + Utils.randInt(0, 8), currentRating, 95);
  if (isYouth) potential = Utils.clamp(currentRating + Utils.randInt(20, 35), currentRating, 95);

  const contractYears = isYouth ? CONFIG.YOUTH_CONTRACT_YEARS : Utils.randInt(1, 4);
  const potentialStars = calculatePotentialStars(age, potential);

  return {
    id: playerIdCounter++,
    name: `${fName} ${lName}`,
    age,
    rating: Math.round(currentRating),
    hiddenPotential: Math.round(potential),
    potentialStars,
    role,
    contractYears,
    teamId,
    retired: false,
    status: 'reserve',
    extendAttempted: false,
    wage: 0,
    acquisitionType: isYouth ? 'youth' : 'initial',
    transferFee: 0,
  };
}

function generateRoster(teamId: number, prestige: number, size: number = CONFIG.ROSTER_SIZE): PlayerData[] {
  const roster: PlayerData[] = [];
  for (let i = 0; i < size; i++) {
    roster.push(generatePlayer(teamId, prestige, false));
  }
  return roster;
}

function autoSetLineup(team: TeamData) {
  const active = team.players.filter(p => !p.retired);
  active.sort((a, b) => b.rating - a.rating);
  team.players.forEach(p => p.status = 'reserve');
  for (let i = 0; i < Math.min(5, active.length); i++) active[i].status = 'starter';
  for (let i = 5; i < active.length; i++) active[i].status = 'bench';
}

function getTeamRating(team: TeamData, league: LeagueState | null): number {
  const sorted = [...team.players].filter(p => !p.retired).sort((a, b) => b.rating - a.rating);
  const top7 = sorted.slice(0, 7);
  let totalRating: number;
  if (league && league.seasonModifier === "Injury Crisis") {
    totalRating = top7.reduce((sum, p) => sum + Math.max(30, p.rating - Utils.randInt(3, 8)), 0);
  } else {
    totalRating = top7.reduce((sum, p) => sum + p.rating, 0);
  }
  return totalRating / Math.max(1, top7.length);
}

function simulateMatch(homeTeam: TeamData, awayTeam: TeamData, league: LeagueState): MatchLog {
  let homePower = getTeamRating(homeTeam, league) + (homeTeam.prestige * 2) + 5;
  let awayPower = getTeamRating(awayTeam, league) + (awayTeam.prestige * 2);
  homePower += Utils.randInt(0, 15);
  awayPower += Utils.randInt(0, 15);

  const margin = Math.abs(homePower - awayPower);
  let homeScore = 80 + Utils.randInt(0, 20);
  let awayScore = 80 + Utils.randInt(0, 20);

  if (homePower > awayPower) {
    homeScore += Math.floor(margin / 2);
    if (awayScore >= homeScore) awayScore = homeScore - Utils.randInt(1, 10);
    homeTeam.seasonStats.wins++;
    awayTeam.seasonStats.losses++;
  } else {
    awayScore += Math.floor(margin / 2);
    if (homeScore >= awayScore) homeScore = awayScore - Utils.randInt(1, 10);
    awayTeam.seasonStats.wins++;
    homeTeam.seasonStats.losses++;
  }

  homeScore = Math.floor(homeScore);
  awayScore = Math.floor(awayScore);
  homeTeam.seasonStats.pointsFor += homeScore;
  homeTeam.seasonStats.pointsAgainst += awayScore;
  awayTeam.seasonStats.pointsFor += awayScore;
  awayTeam.seasonStats.pointsAgainst += homeScore;

  const matchLog: MatchLog = {
    home: homeTeam.abbrev, away: awayTeam.abbrev,
    scoreHome: homeScore, scoreAway: awayScore,
    winner: homePower > awayPower ? homeTeam.abbrev : awayTeam.abbrev,
  };
  if (league.matchLog) league.matchLog.push(matchLog);
  return matchLog;
}

function simulatePlayoffGame(teamA: TeamData, teamB: TeamData, league: LeagueState, roundName: string) {
  let powerA = getTeamRating(teamA, league) + (teamA.prestige * 2) + Utils.randInt(0, 15);
  let powerB = getTeamRating(teamB, league) + (teamB.prestige * 2) + Utils.randInt(0, 15);
  const margin = Math.abs(powerA - powerB);
  let scoreA = 80 + Utils.randInt(0, 20);
  let scoreB = 80 + Utils.randInt(0, 20);

  let winner: TeamData;
  if (powerA > powerB) {
    scoreA += Math.floor(margin / 2);
    if (scoreB >= scoreA) scoreB = scoreA - Utils.randInt(1, 10);
    winner = teamA;
    teamA.playoffSeriesWins++;
  } else {
    scoreB += Math.floor(margin / 2);
    if (scoreA >= scoreB) scoreA = scoreB - Utils.randInt(1, 10);
    winner = teamB;
    teamB.playoffSeriesWins++;
  }

  teamA.playoffRoundReached = roundName;
  teamB.playoffRoundReached = roundName;
  if (winner === teamA) teamA.playoffRoundReached = roundName + " Winner";
  if (winner === teamB) teamB.playoffRoundReached = roundName + " Winner";

  return {
    winnerTeam: winner,
    log: {
      home: teamA.abbrev, away: teamB.abbrev,
      scoreHome: Math.floor(scoreA), scoreAway: Math.floor(scoreB),
      winner: winner.abbrev,
    },
  };
}

function runPlayoffs(league: LeagueState) {
  const sorted = [...league.teams].sort((a, b) => b.seasonStats.wins - a.seasonStats.wins || b.seasonStats.pointsFor - a.seasonStats.pointsFor);
  sorted.forEach((t, idx) => t.seasonStats.place = idx + 1);
  const top8 = sorted.slice(0, 8);
  if (top8.length < 2) { league.playoffLog = { rounds: [], champion: null }; return; }
  const rounds: { name: string; games: MatchLog[] }[] = [];

  const runSeries = (tA: TeamData, tB: TeamData, rName: string) => {
    autoSetLineup(tA); autoSetLineup(tB);
    return simulatePlayoffGame(tA, tB, league, rName);
  };

  const qfPairs: [TeamData, TeamData][] = [[top8[0], top8[7]], [top8[1], top8[6]], [top8[2], top8[5]], [top8[3], top8[4]]];
  const qfWinners: TeamData[] = [];
  const qfGames: MatchLog[] = [];
  for (const [a, b] of qfPairs) { const g = runSeries(a, b, "Quarterfinal"); qfGames.push(g.log); qfWinners.push(g.winnerTeam); }
  rounds.push({ name: "Quarterfinals", games: qfGames });

  const sfPairs: [TeamData, TeamData][] = [[qfWinners[0], qfWinners[3]], [qfWinners[1], qfWinners[2]]];
  const sfWinners: TeamData[] = [];
  const sfGames: MatchLog[] = [];
  for (const [a, b] of sfPairs) { const g = runSeries(a, b, "Semifinal"); sfGames.push(g.log); sfWinners.push(g.winnerTeam); }
  rounds.push({ name: "Semifinals", games: sfGames });

  const finalGame = runSeries(sfWinners[0], sfWinners[1], "Final");
  rounds.push({ name: "Final", games: [finalGame.log] });
  league.playoffLog = { rounds, champion: finalGame.winnerTeam.abbrev };
}

function updatePrestigeAfterSeason(league: LeagueState) {
  const teams = league.teams;
  const n = teams.length;
  const sorted = [...teams].sort((a, b) => b.seasonStats.wins - a.seasonStats.wins);
  sorted.forEach((t, idx) => t.seasonStats.place = idx + 1);

  for (const t of teams) {
    const P0 = Number(t.prestige);
    const place = t.seasonStats.place!;
    const performance = 1 + ((n - place) / (n - 1)) * 4;
    let change = 0;
    if (performance < P0) change = -(P0 - performance) * 0.25;
    else change = (performance - P0) * 0.15;
    if (league.seasonModifier === "Fan Boom") change *= 1.5;
    t.prestige = Number(Utils.clamp(P0 + change, 1, 5));
  }
}

function progressPlayers(league: LeagueState) {
  for (const team of league.teams) {
    for (const p of team.players) {
      if (p.retired) continue;
      let rating = p.rating;
      const potential = p.hiddenPotential;
      const age = p.age;

      if (age <= 24) {
        if (rating < potential) {
          const gap = potential - rating;
          let chance = gap < 5 ? 0.3 : gap < 10 ? 0.45 : 0.6;
          if (Math.random() < chance) {
            let delta = 1;
            if (gap > 10 && Math.random() < 0.5) delta = 2;
            if (gap > 20 && Math.random() < 0.3) delta = 3;
            rating = Math.min(potential, rating + delta);
          }
        }
      } else if (age >= 25 && age <= 29) {
        if (rating < potential && Math.random() < 0.3) rating = Math.min(potential, rating + 1);
      } else if (age >= 30) {
        let dropChance = age >= 36 ? 0.9 : age >= 33 ? 0.7 : 0.5;
        let maxDrop = age >= 36 ? 3 : age >= 33 ? 2 : 1;
        if (Math.random() < dropChance) rating = Math.max(30, rating - Utils.randInt(1, maxDrop));
      }

      p.rating = Math.round(rating);
      p.age += 1;
      if (p.age > 37 && p.rating < 65 && Math.random() < 0.4) { p.retired = true; p.teamId = null; }
      p.extendAttempted = false;
    }
  }
}

function expireContracts(league: LeagueState) {
  for (const team of league.teams) {
    for (const p of team.players) p.contractYears = Math.max(0, p.contractYears - 1);
  }
  for (const team of league.teams) {
    const remaining: PlayerData[] = [];
    for (const p of team.players) {
      if (p.contractYears <= 0 && !p.retired) {
        p.teamId = null; p.status = "reserve"; league.freeAgents.push(p);
      } else remaining.push(p);
    }
    team.players = remaining;
  }
}

function applySeasonModifier(league: LeagueState) {
  if (!league.seasonModifier) return;
  if (league.seasonModifier === "Foreign Investment") {
    league.teams.forEach(team => {
      const bonus = Math.floor(team.transferBudget * 0.5);
      team.cash += bonus;
      addTransaction(team, league.year, 'modifier', bonus, 'Foreign Investment bonus');
      updateBudgets(team);
    });
  }
}

function initializeFreeAgentPool(league: LeagueState) {
  league.freeAgentPool = [];
  for (let i = 0; i < CONFIG.FREE_AGENT_POOL_SIZE; i++) {
    const fa = generatePlayer(null, Utils.randInt(1, 4), false);
    fa.inMarket = false;
    fa.acquisitionType = 'free';
    league.freeAgentPool.push(fa);
  }
}

function generateFreeAgents(league: LeagueState) {
  if (!league.freeAgentPool || league.freeAgentPool.length === 0) initializeFreeAgentPool(league);
  const available = league.freeAgentPool.filter(p => !p.signed && !p.declined);
  const shuffled = Utils.shuffle(available);
  const toDisplay = shuffled.slice(0, CONFIG.FREE_AGENT_DISPLAY);
  toDisplay.forEach(p => p.inMarket = true);
  league.freeAgents = toDisplay;
}

function refreshFreeAgentPool(league: LeagueState) {
  initializeFreeAgentPool(league);
  const toDisplay = league.freeAgentPool.slice(0, CONFIG.FREE_AGENT_DISPLAY);
  toDisplay.forEach(p => p.inMarket = true);
  league.freeAgents = toDisplay;
}

function generateTransferMarket(league: LeagueState) {
  league.transferMarket = [];
  const userTeamId = league.userTeamId;
  league.teams.forEach(t => {
    if (t.id === userTeamId) return;
    const candidates = t.players.filter(p => !p.retired && p.contractYears > 0);
    candidates.sort((a, b) => b.rating - a.rating);
    const toSell = candidates.slice(0, 2);
    toSell.forEach(p => {
      const [min, max] = CONFIG.ECONOMY.TRANSFER_PRICE_RANGES[p.potentialStars] || [5000, 30000];
      const price = Utils.randInt(min, max);
      league.transferMarket.push({ player: p, price, fromTeamId: t.id });
    });
  });
  league.transferMarket = Utils.shuffle(league.transferMarket);
}

function autoFillAITeams(league: LeagueState) {
  for (const team of league.teams) {
    if (team.id === league.userTeamId) continue;
    const remaining: PlayerData[] = [];
    for (const p of team.players) {
      if (p.retired) continue;
      if (p.contractYears <= 0) {
        p.teamId = null; p.status = "reserve"; p.signed = false; p.declined = false; p.inMarket = false; p.acquisitionType = 'free';
        if (!league.freeAgentPool) league.freeAgentPool = [];
        league.freeAgentPool.push(p);
      } else remaining.push(p);
    }
    team.players = remaining;
  }
  for (const team of league.teams) {
    if (team.id === league.userTeamId) continue;
    while (team.players.length < CONFIG.ROSTER_SIZE) {
      if (!league.freeAgentPool || league.freeAgentPool.length === 0) break;
      const available = league.freeAgentPool.filter(p => !p.signed && !p.declined);
      if (available.length === 0) break;
      const p = available[Utils.randInt(0, available.length - 1)];
      const poolIdx = league.freeAgentPool.findIndex(fa => fa.id === p.id);
      if (poolIdx !== -1) league.freeAgentPool.splice(poolIdx, 1);
      p.teamId = team.id; p.contractYears = Utils.randInt(1, 3); p.signed = true; p.inMarket = false;
      p.wage = calculateWage(p, team.prestige); p.acquisitionType = 'free';
      team.players.push(p);
    }
    autoSetLineup(team);
    updateBudgets(team);
  }
}

// Public API
export const GameEngine = {
  initLeague(rosterSize: number = CONFIG.ROSTER_SIZE): LeagueState {
    playerIdCounter = 0;
    const league = createLeague();
    league.teams = CONFIG.TEAMS.map(t => createTeam({ id: t.id, name: t.name, abbrev: t.abbrev, prestige: t.prestige, startingCash: t.startingCash }));
    for (const team of league.teams) {
      team.players = generateRoster(team.id, Math.round(team.prestige), rosterSize);
      team.players.forEach(p => { p.wage = calculateWage(p, team.prestige); p.acquisitionType = 'initial'; });
      autoSetLineup(team);
      updateBudgets(team);
    }
    return league;
  },

  simulateSeason(league: LeagueState): boolean {
    league.matchLog = [];
    league.playoffLog = { rounds: [], champion: null };
    league.teams.forEach(t => resetSeasonStats(t));
    league.teams.forEach(t => autoSetLineup(t));

    for (let i = 0; i < league.teams.length; i++) {
      for (let j = i + 1; j < league.teams.length; j++) {
        simulateMatch(league.teams[i], league.teams[j], league);
      }
    }
    runPlayoffs(league);
    updatePrestigeAfterSeason(league);

    const prizes = [0, 500000, 350000, 280000, 220000, 180000, 140000, 105000, 90000, 65000, 65000, 65000, 65000, 65000, 45000, 45000, 45000];
    const sorted = [...league.teams].sort((a, b) => b.seasonStats.wins - a.seasonStats.wins || b.seasonStats.pointsFor - a.seasonStats.pointsFor);
    sorted.forEach((t, i) => {
      let prize = prizes[i + 1] || 0;
      if (league.seasonModifier === "Financial Crisis") prize = Math.floor(prize * 0.7);
      if (prize > 0) { t.cash += prize; addTransaction(t, league.year, 'prize', prize, `Place ${i + 1}`); }
    });

    const E = CONFIG.ECONOMY;
    for (const team of league.teams) {
      let ticketIncome = Math.floor(team.prestige * E.TICKET_INCOME_BASE + team.seasonStats.wins * E.TICKET_INCOME_PER_WIN);
      let sponsorIncome = Math.floor(team.prestige * E.SPONSOR_INCOME_BASE);
      if (league.seasonModifier === "Financial Crisis") { ticketIncome = Math.floor(ticketIncome * 0.7); sponsorIncome = Math.floor(sponsorIncome * 0.7); }
      team.cash += ticketIncome + sponsorIncome;
      addTransaction(team, league.year, 'income', ticketIncome, 'Ticket sales');
      addTransaction(team, league.year, 'income', sponsorIncome, 'Sponsorship');
      const seasonWages = calculateRequiredWages(team);
      team.cash -= seasonWages;
      addTransaction(team, league.year, 'wages', -seasonWages, 'Player wages');
      updateBudgets(team);
      recordFinanceHistory(team, league.year);
    }
    league.season++;
    league.year++;
    return true;
  },

  startNextSeason(league: LeagueState): string | null {
    const userTeam = league.teams.find(t => t.id === league.userTeamId);
    if (!userTeam) return "No team found";
    if (userTeam.players.length > CONFIG.ROSTER_SIZE) return "Roster too large - release players first";
    if (userTeam.players.length < CONFIG.MIN_ROSTER_SIZE) return `Need at least ${CONFIG.MIN_ROSTER_SIZE} players`;

    const modifiers = ["Foreign Investment", "Financial Crisis", "Golden Generation", "Injury Crisis", "Fan Boom"];
    league.seasonModifier = Utils.sample(modifiers);
    applySeasonModifier(league);
    progressPlayers(league);
    expireContracts(league);
    autoFillAITeams(league);
    refreshFreeAgentPool(league);
    generateTransferMarket(league);
    league.didYouthThisOffseason = false;
    league.teams.forEach(t => updateBudgets(t));
    league.phase = CONFIG.PHASES.REGULAR;
    return null;
  },

  doYouthIntake(league: LeagueState, teamId: number): PlayerData[] | null {
    const team = league.teams.find(t => t.id === teamId);
    if (!team) return null;
    const youth: PlayerData[] = [];
    const isGolden = league.seasonModifier === "Golden Generation";
    for (let i = 0; i < CONFIG.YOUTH_COUNT; i++) {
      const yp = generatePlayer(teamId, team.prestige, true);
      yp.age = Utils.randInt(18, 22);
      if (isGolden) {
        yp.hiddenPotential = Utils.clamp(yp.hiddenPotential + Utils.randInt(10, 20), yp.rating, 95);
        yp.potentialStars = calculatePotentialStars(yp.age, yp.hiddenPotential);
        yp.rating = Utils.clamp(yp.rating + Utils.randInt(2, 6), 30, 95);
      }
      yp.acquisitionType = 'youth';
      yp.wage = calculateWage(yp, team.prestige);
      youth.push(yp);
    }
    league.didYouthThisOffseason = true;
    return youth;
  },

  releasePlayer(league: LeagueState, teamId: number, playerId: number) {
    const team = league.teams.find(t => t.id === teamId);
    if (!team) return { success: false, reason: "Team not found." };
    if (league.phase !== CONFIG.PHASES.OFFSEASON) return { success: false, reason: "Can only release in Off-season." };
    const idx = team.players.findIndex(p => p.id === playerId);
    if (idx === -1) return { success: false, reason: "Player not found." };
    const p = team.players[idx];
    let releaseCost = 0;
    if (p.acquisitionType === 'transfer' || p.acquisitionType === 'renewed') {
      releaseCost = Math.floor(p.contractYears * p.wage * CONFIG.ECONOMY.RELEASE_COST_MULTIPLIER);
    }
    if (releaseCost > 0 && team.transferBudget < releaseCost) return { success: false, reason: `Not enough budget. Release cost: $${releaseCost.toLocaleString()}` };
    if (releaseCost > 0) { team.cash -= releaseCost; addTransaction(team, league.year, 'release', -releaseCost, `Released ${p.name}`); updateBudgets(team); }
    team.players.splice(idx, 1);
    p.teamId = null; p.status = "reserve"; p.signed = false; p.declined = false;
    if (!league.freeAgentPool) league.freeAgentPool = [];
    league.freeAgentPool.push(p);
    return { success: true, player: p, cost: releaseCost };
  },

  signFreeAgent(league: LeagueState, playerId: number, userTeamId: number) {
    const userTeam = league.teams.find(t => t.id === userTeamId);
    if (!userTeam) return { success: false, reason: "Team not found." };
    const p = league.freeAgents.find(fa => fa.id === playerId);
    if (!p) return { success: false, reason: "Player not found." };
    if (userTeam.players.length >= CONFIG.ROSTER_SIZE) return { success: false, reason: `Roster full (${CONFIG.ROSTER_SIZE} limit).` };
    const wage = calculateWage(p, userTeam.prestige);
    const E = CONFIG.ECONOMY;
    const acceptChance = p.potentialStars <= 2 ? E.FREE_AGENT_LOW_POT_ACCEPT : E.FREE_AGENT_HIGH_POT_ACCEPT;
    if (Math.random() > acceptChance) {
      p.declined = true; p.inMarket = false;
      league.freeAgents = league.freeAgents.filter(fa => fa.id !== playerId);
      return { success: false, reason: "Player declined your offer." };
    }
    league.freeAgents = league.freeAgents.filter(fa => fa.id !== playerId);
    league.freeAgentPool = league.freeAgentPool.filter(fa => fa.id !== playerId);
    p.teamId = userTeamId; p.contractYears = 1; p.wage = wage; p.acquisitionType = 'free'; p.status = 'reserve';
    userTeam.players.push(p);
    updateBudgets(userTeam);
    return { success: true, player: p, team: userTeam };
  },

  extendContract(league: LeagueState, playerId: number, years: number) {
    const userTeam = league.teams.find(t => t.id === league.userTeamId);
    if (!userTeam) return { success: false, reason: "Team not found." };
    const p = userTeam.players.find(pl => pl.id === playerId);
    if (!p) return { success: false, reason: "Player not found." };
    if (p.extendAttempted) return { success: false, reason: "Already attempted this season." };
    p.extendAttempted = true;
    const newWage = calculateWage(p, userTeam.prestige);
    const futureWageCost = newWage * years;
    if (userTeam.transferBudget < futureWageCost) return { success: false, reason: `Not enough budget. Future cost: $${futureWageCost.toLocaleString()}` };
    let acceptChance = years === 1 ? 0.75 : 0.90;
    if (p.age > 30) acceptChance -= 0.1;
    if (p.age > 34) acceptChance -= 0.2;
    acceptChance = Math.max(0, acceptChance);
    if (Math.random() < acceptChance) {
      p.contractYears += years; p.wage = newWage; p.acquisitionType = 'renewed';
      return { success: true, extended: true, years };
    }
    return { success: true, extended: false };
  },

  setStarter(league: LeagueState, playerId: number): string | null {
    const team = league.teams.find(t => t.id === league.userTeamId);
    if (!team) return "Team not found";
    const p = team.players.find(pl => pl.id === playerId);
    if (!p) return "Player not found";
    if (p.status === 'starter') { p.status = 'bench'; return null; }
    const currentStarters = team.players.filter(pl => pl.status === 'starter');
    if (currentStarters.length >= CONFIG.MAX_STARTERS) return `Maximum ${CONFIG.MAX_STARTERS} starters allowed.`;
    p.status = 'starter';
    return null;
  },

  buyTransferPlayer(league: LeagueState, userTeamId: number, playerId: number, years: number) {
    const userTeam = league.teams.find(t => t.id === userTeamId);
    const marketItem = league.transferMarket.find(m => m.player.id === playerId);
    if (!userTeam || !marketItem) return { success: false, reason: "Player not found." };
    const p = marketItem.player;
    const wage = calculateWage(p, userTeam.prestige);
    const transferFee = marketItem.price;
    if (userTeam.transferBudget < transferFee) return { success: false, reason: `Cannot afford: $${transferFee.toLocaleString()}` };
    const E = CONFIG.ECONOMY;
    let acceptChance = years === 1 ? E.TRANSFER_ACCEPT_1YR : E.TRANSFER_ACCEPT_2YR;
    const fromTeam = league.teams.find(t => t.id === marketItem.fromTeamId);
    const prestigeDiff = fromTeam ? userTeam.prestige - fromTeam.prestige : 0;
    if (prestigeDiff > 1) acceptChance += 0.1;
    if (prestigeDiff < -1) acceptChance -= 0.1;
    if (years === 2 && p.age > E.TRANSFER_AGE_PENALTY_THRESHOLD) acceptChance -= E.TRANSFER_AGE_PENALTY;
    if (years === 2 && p.age > 34) acceptChance -= 0.25;
    acceptChance = Math.max(0.1, Math.min(0.95, acceptChance));
    if (Math.random() > acceptChance) return { success: false, reason: `Player declined ${years}-year contract (${Math.round(acceptChance * 100)}% chance)` };
    userTeam.cash -= transferFee;
    addTransaction(userTeam, league.year, 'transfer', -transferFee, `Bought ${p.name}`);
    const oldTeam = league.teams.find(t => t.id === marketItem.fromTeamId);
    if (oldTeam) {
      oldTeam.players = oldTeam.players.filter(pl => pl.id !== p.id);
      oldTeam.cash += transferFee;
      addTransaction(oldTeam, league.year, 'transfer', transferFee, `Sold ${p.name}`);
      updateBudgets(oldTeam);
    }
    p.teamId = userTeam.id; p.contractYears = years; p.wage = wage; p.acquisitionType = 'transfer'; p.status = 'reserve';
    userTeam.players.push(p);
    league.transferMarket = league.transferMarket.filter(m => m.player.id !== playerId);
    updateBudgets(userTeam);
    return { success: true, player: p, cost: transferFee };
  },

  generateFreeAgents,
  generateTransferMarket,

  saveGame(league: LeagueState): boolean {
    try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(league)); return true; } catch { return false; }
  },

  loadGame(): LeagueState | null {
    try {
      const data = localStorage.getItem(CONFIG.SAVE_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
};
