import {
  GameState,
  Team,
  MatchResult,
  StandingsEntry,
  DivisionId,
  SeasonModifier,
  PlayoffMatchup,
  FinanceRecord,
  Player,
  FreeAgent,
} from "./types";
import { createInitialTeams, SEASON_MODIFIERS, DIVISIONS, estimateFairSalary } from "./gameData";

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTeamStrength(team: Team, modifier: SeasonModifier | null): number {
  if (team.players.length === 0) return 30;
  let avg = team.players.reduce((sum, p) => sum + p.overall, 0) / team.players.length;
  if (modifier === "injury_crisis") {
    avg -= randomBetween(0, 8);
  }
  return Math.max(20, avg + team.prestige * 3);
}

function getTeamStrategy(team: Team): string {
  const starters = team.players.filter(p => p.isStarter);
  if (starters.length < 5) return "balanced";

  const defenders = starters.filter(p => p.role === "Defender").length;
  const sharpshooters = starters.filter(p => p.role === "Sharpshooter").length;
  const playmakers = starters.filter(p => p.role === "Playmaker").length;

  // Pick dominant role (at least 2 players) to avoid everything being "balanced"
  const maxCount = Math.max(defenders, sharpshooters, playmakers);
  if (maxCount >= 2) {
    if (defenders === maxCount) return "defensive";
    if (sharpshooters === maxCount) return "offensive";
    if (playmakers === maxCount) return "playmaking";
  }

  return "balanced";
}

function getStrategyBonus(strategy: string, opponentStrategy: string): number {
  // Rock Paper Scissors system
  // Defensive beats Playmaking
  // Playmaking beats Offensive
  // Offensive beats Defensive
  // Balanced is neutral

  if (strategy === "balanced" || opponentStrategy === "balanced") return 0;

  if (strategy === "defensive" && opponentStrategy === "playmaking") return 0.10; // 10% boost
  if (strategy === "playmaking" && opponentStrategy === "offensive") return 0.10;
  if (strategy === "offensive" && opponentStrategy === "defensive") return 0.10;

  return 0; // No bonus for wrong matchups
}

// Deterministic, balanced round-robin schedule generator per division.
// For N teams, produces 2*(N-1) rounds where each pair meets exactly twice (home/away) when N is even.
function generateBalancedSchedule(teamIds: string[]): { homeTeamId: string; awayTeamId: string }[][] {
  if (teamIds.length === 0) return [];

  const teams = [...teamIds];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) {
    teams.push("__BYE__");
  }

  const n = teams.length;
  const rounds: { homeTeamId: string; awayTeamId: string }[][] = [];

  // Single round-robin (each opponent once)
  for (let round = 0; round < n - 1; round++) {
    const pairings: { homeTeamId: string; awayTeamId: string }[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = teams[i];
      const away = teams[n - 1 - i];
      if (home !== "__BYE__" && away !== "__BYE__") {
        pairings.push({ homeTeamId: home, awayTeamId: away });
      }
    }
    rounds.push(pairings);

    // Rotate all but first team
    const fixed = teams[0];
    const rest = teams.slice(1);
    rest.unshift(rest.pop()!);
    teams.splice(0, teams.length, fixed, ...rest);
  }

  // Double round-robin: second half with swapped home/away
  const secondHalf = rounds.map(round =>
    round.map(match => ({
      homeTeamId: match.awayTeamId,
      awayTeamId: match.homeTeamId,
    })),
  );

  return [...rounds, ...secondHalf];
}

export function simulateMatch(
  home: Team, away: Team, modifier: SeasonModifier | null
): { homeScore: number; awayScore: number } {
  const homeStrategy = getTeamStrategy(home);
  const awayStrategy = getTeamStrategy(away);
  
  const homeBonus = getStrategyBonus(homeStrategy, awayStrategy);
  const awayBonus = getStrategyBonus(awayStrategy, homeStrategy);
  
  const homeStr = getTeamStrength(home, modifier) * (1 + homeBonus) + randomBetween(0, 6);
  const awayStr = getTeamStrength(away, modifier) * (1 + awayBonus);

  const homeBase = 60 + (homeStr - 50) * 0.5;
  const awayBase = 60 + (awayStr - 50) * 0.5;

  const homeScore = Math.max(40, Math.round(homeBase + randomBetween(-8, 8)));
  const awayScore = Math.max(40, Math.round(awayBase + randomBetween(-8, 8)));

  if (homeScore === awayScore) {
    return { homeScore: homeScore + 1, awayScore };
  }

  return { homeScore, awayScore };
}

export function createInitialStandings(teams: Team[]): Record<DivisionId, StandingsEntry[]> {
  const standings: Record<string, StandingsEntry[]> = {};

  for (const div of DIVISIONS) {
    standings[div.id] = teams
      .filter(t => t.division === div.id)
      .map(t => ({
        teamId: t.id,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        streak: 0,
      }));
  }

  return standings as Record<DivisionId, StandingsEntry[]>;
}

export function initializeGame(teamId: string): GameState {
  const teams = createInitialTeams();
  const modifier = getRandomModifier();

  return {
    selectedTeamId: teamId,
    season: 1,
    week: 0,
    phase: "preseason",
    teams,
    standings: createInitialStandings(teams),
    schedule: [],
    seasonModifier: modifier,
    declinedPlayerIds: [],
    playoffBracket: [],
    gameOver: false,
    finances: calculateInitialFinances(teams.find(t => t.id === teamId)!, modifier),
    youthIntakeUsed: false,
    consecutiveNegativeSeasons: 0,
  };
}

export function calculateInitialFinances(team: Team, modifier: SeasonModifier | null): FinanceRecord {
  const prestigeMultiplier = team.prestige * 0.5;
  let ticketIncome = Math.round((20000 + prestigeMultiplier * 30000) / 2);
  let sponsorIncome = Math.round((15000 + prestigeMultiplier * 25000) / 2);
  let prizeIncome = 0;

  if (modifier === "financial_crisis") {
    ticketIncome = Math.round(ticketIncome * 0.7);
    sponsorIncome = Math.round(sponsorIncome * 0.7);
  }

  const totalWages = team.players.reduce((sum, p) => sum + p.salary, 0);

  return {
    ticketIncome,
    sponsorIncome,
    prizeIncome,
    totalWages,
    transferSpending: 0,
    balance: team.budget,
  };
}

export function getRandomModifier(): SeasonModifier {
  const mods: SeasonModifier[] = ["foreign_investment", "financial_crisis", "injury_crisis", "fan_boom"];
  return mods[Math.floor(Math.random() * mods.length)];
}

export function simulateAITransfers(state: GameState): GameState {
  const newState = { ...state };
  
  // Mid-season transfers: rare (only weeks 7 and 8)
  const isMidSeasonTransferWeek = state.week === 7 || state.week === 8;
  if (!isMidSeasonTransferWeek) return state;
  
  // Top teams (prestige 4-5) pick 2-3 best players
  const topTeams = newState.teams.filter(t => !t.players.find(p => p.isStarter) && t.prestige >= 4 && t.id !== state.selectedTeamId);
  
  topTeams.forEach(team => {
    const starters = team.players.filter(p => p.isStarter);
    const needSharpshooter = starters.filter(s => s.role === "Sharpshooter").length < 2;
    const needDefender = starters.filter(s => s.role === "Defender").length < 2;
    const needPlaymaker = starters.filter(s => s.role === "Playmaker").length < 1;
    
    // Prioritize filling missing roles
    const neededRoles: string[] = [];
    if (needSharpshooter) neededRoles.push("Sharpshooter");
    if (needDefender) neededRoles.push("Defender");
    if (needPlaymaker) neededRoles.push("Playmaker");
    
    // Sign 2-3 players if needed
    const playersToSign = Math.min(3, neededRoles.length);
    for (let i = 0; i < playersToSign; i++) {
      const role = neededRoles[i];
      
      // Generate a high-quality player for this role
      const base = 30 + team.prestige * 10;
      const variance = 8; // Better players for top teams
      const attrs = {
        height: role === "Defender" ? randomBetween(195, 212) : role === "Sharpshooter" ? randomBetween(185, 205) : randomBetween(178, 195),
        shooting: randomBetween(base - variance, base + variance),
        defending: randomBetween(base - variance, base + variance),
        dribbling: randomBetween(base - variance, base + variance),
        passing: randomBetween(base - variance, base + variance),
      };
      
      if (role === "Sharpshooter") {
        attrs.shooting = Math.min(99, attrs.shooting + 15);
      } else if (role === "Defender") {
        attrs.defending = Math.min(99, attrs.defending + 15);
      } else {
        attrs.passing = Math.min(99, attrs.passing + 12);
        attrs.dribbling = Math.min(99, attrs.dribbling + 10);
      }
      
      const overall = Math.round((attrs.shooting + attrs.defending + attrs.dribbling + attrs.passing) / 4);
      const salary = estimateFairSalary(overall, team.prestige);
      
      const newPlayer = {
        id: `ai_transfer_${team.id}_${Date.now()}_${i}`,
        name: `${["Mantas", "Lukas", "Tomas", "Domantas", "Jonas"][Math.floor(Math.random() * 5)]} ${["Sabonis", "Valančiūnas", "Jasikevičius", "Kleiza", "Songaila"][Math.floor(Math.random() * 5)]}`,
        age: randomBetween(19, 30),
        role: role as any,
        attributes: attrs,
        overall: overall,
        salary: salary,
        contractYears: randomBetween(2, 4),
        isStarter: false, // Not immediately a starter
      };
      
      newState.teams = newState.teams.map(t =>
        t.id === team.id ? { ...t, players: [...t.players, newPlayer] } : t
      );
    }
  });
  
  return newState;
}

export function simulateWeek(state: GameState, guestTeamId?: string): GameState {
  const newState = { ...state };
  newState.week += 1;

  // Simulate AI transfers in mid-season (weeks 7-8)
  const transferState = simulateAITransfers(newState);
  
  // Use the state after transfers for the rest of the simulation
  const simState = transferState;
  
  // Simulate both leagues using a deterministic, balanced schedule per division
  const newStandings = { ...simState.standings };

  for (const div of DIVISIONS) {
    const divTeamIds = simState.teams.filter(t => t.division === div.id).map(t => t.id);
    const schedule = generateBalancedSchedule(divTeamIds);
    const weekIndex = newState.week - 1; // weeks are 1-based in state
    const round = schedule[weekIndex];
    const divStandings = [...(newStandings[div.id] || [])];

    if (!round) {
      // No scheduled games for this division in this week (can happen for small leagues)
      newStandings[div.id] = divStandings;
      continue;
    }

    for (const match of round) {
      const home = simState.teams.find(t => t.id === match.homeTeamId)!;
      const away = simState.teams.find(t => t.id === match.awayTeamId)!;
      const result = simulateMatch(home, away, simState.seasonModifier);

      const homeEntry = divStandings.find(s => s.teamId === home.id);
      const awayEntry = divStandings.find(s => s.teamId === away.id);

      if (homeEntry && awayEntry) {
        homeEntry.pointsFor += result.homeScore;
        homeEntry.pointsAgainst += result.awayScore;
        awayEntry.pointsFor += result.awayScore;
        awayEntry.pointsAgainst += result.homeScore;

        if (result.homeScore > result.awayScore) {
          homeEntry.wins += 1;
          awayEntry.losses += 1;
          homeEntry.streak = homeEntry.streak > 0 ? homeEntry.streak + 1 : 1;
          awayEntry.streak = awayEntry.streak < 0 ? awayEntry.streak - 1 : -1;
        } else {
          awayEntry.wins += 1;
          homeEntry.losses += 1;
          awayEntry.streak = awayEntry.streak > 0 ? awayEntry.streak + 1 : 1;
          homeEntry.streak = homeEntry.streak < 0 ? homeEntry.streak - 1 : -1;
        }
      }

      // Track schedule for player's matches
      const playerTeam = simState.teams.find(t => t.id === simState.selectedTeamId)!;
      if (home.division === playerTeam.division) {
        newState.schedule = [...(newState.schedule ?? []), {
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          week: newState.week,
        }];
      }
    }

    newStandings[div.id] = divStandings;
  }

  newState.standings = newStandings;

  // Check if regular season is over — total rounds = 2*(N-1) for N teams (double round-robin)
  const playerTeam = state.teams.find(t => t.id === state.selectedTeamId)!;
  const playerDivTeamCount = state.teams.filter(t => t.division === playerTeam.division).length;
  const playerTotalWeeks = 2 * (playerDivTeamCount - 1);

  // In multiplayer, wait for BOTH divisions to finish before transitioning phase.
  // This prevents the freeze when one player is in B League (6 weeks) and the
  // other is in A League (14 weeks) — we always advance to the LONGER season.
  let effectiveTotalWeeks = playerTotalWeeks;
  if (guestTeamId) {
    const guestTeam = state.teams.find(t => t.id === guestTeamId);
    if (guestTeam) {
      const guestDivCount = state.teams.filter(t => t.division === guestTeam.division).length;
      const guestTotalWeeks = 2 * (guestDivCount - 1);
      effectiveTotalWeeks = Math.max(playerTotalWeeks, guestTotalWeeks);
    }
  }

  // Award prize money exactly when THIS player's own division season ends
  if (newState.week === playerTotalWeeks) {
    const playerDivision = playerTeam.division;
    const divStandings = [...newStandings[playerDivision]].sort((a, b) => 
      b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
    );
    const playerPosition = divStandings.findIndex(s => s.teamId === state.selectedTeamId) + 1;
    
    let prizeMoney = 0;
    if (playerDivision === "rkl") {
      const prizeMap: Record<number, number> = {
        1: 230000, 2: 200000, 3: 190000, 4: 160000,
        5: 150000, 6: 125000, 7: 100000, 8: 75000
      };
      prizeMoney = prizeMap[playerPosition] || 0;
    } else {
      const prizeMap: Record<number, number> = {
        1: 50000, 2: 38000, 3: 30000, 4: 24000,
        5: 18000, 6: 14000, 7: 10000, 8: 7000
      };
      prizeMoney = prizeMap[playerPosition] || 0;
    }
    
    newState.finances = {
      ...newState.finances,
      prizeIncome: newState.finances.prizeIncome + prizeMoney,
    };
  }

  // Phase transition only after both divisions done
  if (newState.week >= effectiveTotalWeeks) {
    const playerDivision = playerTeam.division;
    const divStandings = [...newStandings[playerDivision]].sort((a, b) =>
      b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
    );

    if (playerTeam.division === "rkl") {
      newState.phase = "playoffs";
      newState.playoffBracket = [
        { round: 1, team1Id: divStandings[0].teamId, team2Id: divStandings[3].teamId, team1Wins: 0, team2Wins: 0 },
        { round: 1, team1Id: divStandings[1].teamId, team2Id: divStandings[2].teamId, team1Wins: 0, team2Wins: 0 },
      ];
    } else {
      // B Division: go straight to offseason (no playoff, promotion/relegation is automatic)
      newState.phase = "offseason";
    }
  }

  // Ticket income for home matches
  const playerMatch = (newState.schedule || []).filter(m => m.week === newState.week && m.homeTeamId === state.selectedTeamId);
  if (playerMatch.length > 0) {
    const ticketMultiplier =
      state.seasonBonus === "bonus_ticket_10" ? 1.1 : 1;
    newState.finances = {
      ...newState.finances,
      ticketIncome: newState.finances.ticketIncome + Math.round(playerTeam.prestige * 1500 / 2 * ticketMultiplier),
    };
  }

  return newState;
}

export function simulatePlayoffGame(state: GameState, matchupIndex: number): GameState {
  const newState = { ...state };
  const bracket = [...state.playoffBracket];
  const matchup = { ...bracket[matchupIndex] };

  const team1 = state.teams.find(t => t.id === matchup.team1Id)!;
  const team2 = state.teams.find(t => t.id === matchup.team2Id)!;
  const result = simulateMatch(team1, team2, state.seasonModifier);

  if (result.homeScore > result.awayScore) {
    matchup.team1Wins += 1;
  } else {
    matchup.team2Wins += 1;
  }

  if (matchup.team1Wins >= 2) {
    matchup.winnerId = matchup.team1Id;
  } else if (matchup.team2Wins >= 2) {
    matchup.winnerId = matchup.team2Id;
  }

  bracket[matchupIndex] = matchup;
  newState.playoffBracket = bracket;

  const allDecided = bracket.filter(m => m.round === 1).every(m => m.winnerId);
  if (allDecided && bracket.length === 2) {
    const winners = bracket.filter(m => m.round === 1).map(m => m.winnerId!);
    bracket.push({
      round: 2,
      team1Id: winners[0],
      team2Id: winners[1],
      team1Wins: 0,
      team2Wins: 0,
    });
    newState.playoffBracket = bracket;
  }

  const finals = bracket.find(m => m.round === 2);
  if (finals?.winnerId) {
    newState.phase = "offseason";
  }

  return newState;
}

/**
 * Simulate every remaining playoff game in one shot.
 * Returns a state where phase === "offseason" and a champion is crowned.
 */
export function simulateAllPlayoffs(state: GameState): GameState {
  let s = { ...state };
  let safety = 0;
  while (s.phase === "playoffs" && safety < 50) {
    safety++;
    const unresolved = s.playoffBracket.findIndex(m => !m.winnerId);
    if (unresolved === -1) break;
    s = simulatePlayoffGame(s, unresolved);
  }
  return s;
}

export function processOffseason(state: GameState): GameState {
  const newState = { ...state };

  // Reset youth intake flag for new season
  newState.youthIntakeUsed = false;

  // Process all teams for contract years and aging
  const updatedTeams = newState.teams.map(team => {
    const isPlayerTeam = team.id === state.selectedTeamId;
    
    let players = team.players.map(p => {
      // Decrement contract years for players who were under contract during the just-finished season.
      // Players signed during the off-season keep their full contract length for the upcoming season.
      let newContractYears = (p.joinedThisOffseason === true) ? p.contractYears : p.contractYears - 1;

      // Age ALL players
      let newAge = p.age + 1;
      
      // Check for retirement (applies to all teams)
      let willRetire = false;
      if (newAge >= 32) {
        const retireChance = (newAge - 32) * 0.12; // 12% per year over 32 (less aggressive)
        if (Math.random() < retireChance) {
          willRetire = true;
          newContractYears = 0; // Force retirement
        }
      }
      
      let updatedPlayer = { 
        ...p, 
        contractYears: newContractYears,
        age: newAge,
        joinedThisOffseason: false, // reset flag after processing
      };
      
      // For player's team only: handle player development
      if (isPlayerTeam) {
        // Young players (under 23) develop faster
        if (updatedPlayer.age < 23 && Math.random() < 0.7) {
          const attrs = { ...updatedPlayer.attributes };
          
          // Increase random attributes based on role
          const growthPoints = randomBetween(1, 3);
          for (let i = 0; i < growthPoints; i++) {
            const attr = ['shooting', 'defending', 'dribbling', 'passing'][Math.floor(Math.random() * 4)] as keyof typeof attrs;
            if (typeof attrs[attr] === 'number' && attrs[attr] < 99) {
              attrs[attr] = Math.min(99, attrs[attr] + 1);
            }
          }
          
          updatedPlayer.attributes = attrs;
          updatedPlayer.overall = Math.round(
            (attrs.shooting + attrs.defending + attrs.dribbling + attrs.passing) / 4
          );
        }
        
        // Track seasons without play for non-starters
        if (!updatedPlayer.isStarter) {
          updatedPlayer.seasonsWithoutPlay = (updatedPlayer.seasonsWithoutPlay || 0) + 1;
        } else {
          updatedPlayer.seasonsWithoutPlay = 0;
        }
      }
      
      return updatedPlayer;
    }).filter(p => p.contractYears > 0); // Remove expired contracts

    return { ...team, players };
  });

  newState.teams = updatedTeams;

  // AI TEAMS: Fill empty roster spots after offseason
  newState.teams = newState.teams.map(team => {
    const isPlayerTeam = team.id === state.selectedTeamId;
    if (isPlayerTeam) return team; // Don't auto-fill player's team
    
    const currentPlayers = team.players;
    const playersNeeded = 10 - currentPlayers.length; // Need 10 players minimum
    
    if (playersNeeded <= 0) return team;
    
    // Generate replacement players based on team prestige
    const newPlayers = [];
    for (let i = 0; i < playersNeeded; i++) {
      const roles = ["Sharpshooter", "Defender", "Playmaker"];
      const role = roles[Math.floor(Math.random() * roles.length)];
      
      // Generate attributes based on prestige
      const base = 30 + team.prestige * 10;
      const variance = 10;
      const attrs = {
        height: role === "Defender" ? randomBetween(195, 212) : role === "Sharpshooter" ? randomBetween(185, 205) : randomBetween(178, 195),
        shooting: randomBetween(base - variance, base + variance),
        defending: randomBetween(base - variance, base + variance),
        dribbling: randomBetween(base - variance, base + variance),
        passing: randomBetween(base - variance, base + variance),
      };
      
      if (role === "Sharpshooter") {
        attrs.shooting = Math.min(99, attrs.shooting + 15);
      } else if (role === "Defender") {
        attrs.defending = Math.min(99, attrs.defending + 15);
      } else {
        attrs.passing = Math.min(99, attrs.passing + 12);
        attrs.dribbling = Math.min(99, attrs.dribbling + 10);
      }
      
      const overall = Math.round((attrs.shooting + attrs.defending + attrs.dribbling + attrs.passing) / 4);
      const salary = estimateFairSalary(overall, team.prestige);
      
      newPlayers.push({
        id: `ai_${team.id}_${Date.now()}_${i}`,
        name: `${["Mantas", "Lukas", "Tomas", "Domantas", "Jonas", "Mindaugas", "Arvydas", "Šarūnas", "Donatas", "Paulius"][Math.floor(Math.random() * 10)]} ${["Sabonis", "Valančiūnas", "Jasikevičius", "Kleiza", "Songaila", "Kavaliauskas", "Motiejūnas", "Kuzminskas", "Lekavicius", "Grigonis"][Math.floor(Math.random() * 10)]}`,
        age: randomBetween(19, 34),
        role: role as any,
        attributes: attrs,
        overall: overall,
        salary: salary,
        contractYears: randomBetween(1, 3),
        isStarter: currentPlayers.length + newPlayers.length <= 5, // First 5 become starters
      });
    }
    
    return { ...team, players: [...currentPlayers, ...newPlayers] };
  });

  // Check game over conditions for player's team
  const myTeam = newState.teams.find(t => t.id === state.selectedTeamId)!;
  
  // Game over if fewer than 5 players
  if (myTeam.players.length < 5) {
    newState.gameOver = true;
    newState.gameOverReason = "You started the off-season with fewer than 5 players under contract. Your career is over!";
    return newState;
  }
  
  // Check for consecutive negative balance seasons
  const finalBalance = state.finances.balance + state.finances.ticketIncome + 
                       state.finances.sponsorIncome + state.finances.prizeIncome - 
                       state.finances.totalWages - state.finances.transferSpending;
  
  if (finalBalance < -50000) {
    newState.consecutiveNegativeSeasons = (state.consecutiveNegativeSeasons || 0) + 1;
    if (newState.consecutiveNegativeSeasons >= 2) {
      newState.gameOver = true;
      newState.gameOverReason = "Your club has been in severe debt (below -$50,000) for consecutive seasons. The board has terminated your contract!";
      return newState;
    }
  } else {
    newState.consecutiveNegativeSeasons = 0;
  }

  // Automatic promotion/relegation: B Division #1 → promoted, A Division #8 → relegated
  {
    const rklSorted = [...(newState.standings.rkl || [])].sort((a, b) =>
      b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
    );
    const lklSorted = [...(newState.standings.lkl || [])].sort((a, b) =>
      b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
    );
    if (rklSorted.length > 0 && lklSorted.length > 0) {
      const relegatedId = rklSorted[rklSorted.length - 1].teamId; // A Division last place
      const promotedId  = lklSorted[0].teamId;                     // B Division champion
      newState.teams = newState.teams.map(t => {
        if (t.id === promotedId)  return { ...t, division: "rkl" as DivisionId };
        if (t.id === relegatedId) return { ...t, division: "lkl" as DivisionId };
        return t;
      });
    }
  }

  // New season
  newState.season += 1;
  newState.week = 0;
  newState.phase = "preseason";
  newState.seasonModifier = getRandomModifier();
  newState.declinedPlayerIds = [];
  newState.standings = createInitialStandings(newState.teams);
  newState.schedule = [];
  newState.playoffBracket = [];

  if (state.seasonModifier === "fan_boom") {
    newState.teams = newState.teams.map(t =>
      t.id === state.selectedTeamId
        ? { ...t, prestige: Math.min(5, t.prestige + 1) }
        : t
    );
  }

  const updatedPlayerTeam = newState.teams.find(t => t.id === state.selectedTeamId)!;
  newState.finances = {
    ...calculateInitialFinances(updatedPlayerTeam, newState.seasonModifier),
    balance: finalBalance,
  };

  if (newState.seasonModifier === "foreign_investment") {
    newState.finances.balance = Math.round(newState.finances.balance * 1.15);
  }

  return newState;
}

export function attemptTransfer(
  state: GameState,
  player: FreeAgent,
  contractYears: 1 | 2,
  offeredSalary: number
): { success: boolean; newState: GameState; reason?: string } {
  const playerTeam = state.teams.find(t => t.id === state.selectedTeamId)!;

  // Check squad capacity (max 12 players)
  if (playerTeam.players.length >= 12) {
    return {
      success: false,
      newState: state,
      reason: "Squad is full! Maximum capacity is 12 players.",
    };
  }

  // Check if already offered to this player (prevent spamming)
  if (state.declinedPlayerIds.includes(player.id)) {
    return {
      success: false,
      newState: state,
      reason: "This player has already declined your offer. You cannot offer again.",
    };
  }

  // Check budget
  if (offeredSalary > playerTeam.budget + state.finances.balance) {
    return {
      success: false,
      newState: state,
      reason: "You don't have enough budget to afford this contract.",
    };
  }

  let chance = 0.5;
  if (offeredSalary >= player.askingSalary) chance += 0.25;
  if (offeredSalary >= player.askingSalary * 1.2) chance += 0.15;
  if (offeredSalary < player.askingSalary * 0.8) chance -= 0.3;
  if (contractYears === 2) chance += 0.1;
  chance += playerTeam.prestige * 0.05;
  chance = Math.max(0.05, Math.min(0.95, chance));

  const accepted = Math.random() < chance;

  if (accepted) {
    // For B League players with ranges, pick random values within the range
    let finalAttributes = player.attributes;
    let finalOverall = player.overall;
    
    if (player.attributeRanges) {
      // B League: Pick random values within each range
      finalAttributes = {
        height: player.attributes.height, // Height stays fixed
        shooting: Math.floor(Math.random() * (player.attributeRanges.shooting.max - player.attributeRanges.shooting.min + 1)) + player.attributeRanges.shooting.min,
        defending: Math.floor(Math.random() * (player.attributeRanges.defending.max - player.attributeRanges.defending.min + 1)) + player.attributeRanges.defending.min,
        dribbling: Math.floor(Math.random() * (player.attributeRanges.dribbling.max - player.attributeRanges.dribbling.min + 1)) + player.attributeRanges.dribbling.min,
        passing: Math.floor(Math.random() * (player.attributeRanges.passing.max - player.attributeRanges.passing.min + 1)) + player.attributeRanges.passing.min,
      };
      // Calculate actual overall from the randomized attributes
      finalOverall = Math.round((finalAttributes.shooting + finalAttributes.defending + finalAttributes.dribbling + finalAttributes.passing) / 4);
    }
    
    const newPlayer: Player = {
      id: player.id,
      name: player.name,
      age: player.age,
      role: player.role,
      attributes: finalAttributes, // Use randomized attributes for B League
      overall: finalOverall, // Use calculated overall
      salary: offeredSalary,
      contractYears,
      isStarter: false,
      seasonsWithoutPlay: 0,
      joinedThisOffseason: state.phase === "offseason",
    };

    const newTeams = state.teams.map(t =>
      t.id === state.selectedTeamId
        ? { ...t, players: [...t.players, newPlayer], budget: t.budget - offeredSalary }
        : t
    );

    return {
      success: true,
      newState: {
        ...state,
        teams: newTeams,
        finances: {
          ...state.finances,
          transferSpending: state.finances.transferSpending + offeredSalary,
          totalWages: state.finances.totalWages + offeredSalary,
          balance: state.finances.balance - offeredSalary,
        },
      },
    };
  } else {
    return {
      success: false,
      newState: {
        ...state,
        declinedPlayerIds: [...state.declinedPlayerIds, player.id],
      },
      reason: "Player declined your offer.",
    };
  }
}
