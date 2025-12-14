// js/league.js
const LeagueManager = {
  initLeague(rosterSize = CONFIG.ROSTER_SIZE) {
    PlayerManager.globalPlayerId = 0;
    const league = new League();
    
    league.teams = CONFIG.TEAMS.map(t => new Team({
      id: t.id,
      name: t.name,
      abbrev: t.abbrev,
      prestige: t.prestige,
      startingCash: t.startingCash // Pass team-specific starting cash
    }));

    for (const team of league.teams) {
      team.players = PlayerManager.generateRoster(team.id, Math.round(team.prestige), rosterSize);
      this.autoSetLineup(team);
      team.updateBudgets(); // Initialize budgets
    }
    return league;
  },

  resetSeasonStats(leagueState) {
    for (const t of leagueState.teams) {
      t.resetSeasonStats();
    }
  },

  autoSetLineup(team) {
    const active = team.players.filter(p => !p.retired);
    active.sort((a, b) => b.rating - a.rating);
    team.players.forEach(p => p.status = 'reserve');
    for(let i=0; i < Math.min(5, active.length); i++) {
        active[i].status = 'starter';
    }
    for(let i=5; i < active.length; i++) {
        active[i].status = 'bench';
    }
  },

  simulateSeason(leagueState) {
    leagueState.matchLog = [];
    leagueState.playoffLog = {};
    this.resetSeasonStats(leagueState);
    
    const teams = leagueState.teams;
    teams.forEach(t => this.autoSetLineup(t));

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        MatchEngine.simulateMatch(teams[i], teams[j], leagueState);
      }
    }
    this.runPlayoffs(leagueState);
    this.updatePrestigeAfterSeason(leagueState);

    const prizes = [0, 500000, 350000, 280000, 220000, 180000, 140000, 105000, 90000, 65000, 65000, 65000, 65000, 65000, 45000, 45000, 45000];
    const sorted = [...leagueState.teams].sort((a,b) =>
      b.seasonStats.wins - a.seasonStats.wins ||
      b.seasonStats.pointsFor - a.seasonStats.pointsFor
    );
    sorted.forEach((t, i) => {
      const prize = prizes[i + 1] || 0;
      t.cash += prize;
    });

    
    for (const team of teams) {
      const seasonWages = team.calculateRequiredWages();
      team.cash -= seasonWages;
      team.updateBudgets();              
      team.recordFinanceHistory(leagueState.year);
    }

    leagueState.season++;
    leagueState.year++;
    return true;
    },

  runPlayoffs(leagueState) {
    const sorted = [...leagueState.teams].sort((a,b) => b.seasonStats.wins - a.seasonStats.wins || b.seasonStats.pointsFor - a.seasonStats.pointsFor);
    sorted.forEach((t, idx) => t.seasonStats.place = idx + 1);

    const top8 = sorted.slice(0, 8);
    if (top8.length < 2) {
      leagueState.playoffLog = { rounds: [], champion: null };
      return;
    }
    const rounds = [];
    
    const runSeries = (teamA, teamB, roundName) => {
        this.autoSetLineup(teamA);
        this.autoSetLineup(teamB);
        return MatchEngine.simulatePlayoffGame(teamA, teamB, leagueState, roundName);
    };

    // Quarterfinals
    const qfPairs = [[top8[0], top8[7]], [top8[1], top8[6]], [top8[2], top8[5]], [top8[3], top8[4]]];
    const qfWinners = [];
    const qfGames = [];
    for (const [a, b] of qfPairs) {
      const g = runSeries(a, b, "Quarterfinal");
      qfGames.push(g.log);
      qfWinners.push(g.winnerTeam);
    }
    rounds.push({ name: "Quarterfinals", games: qfGames });

    // Semifinals
    const sfPairs = [[qfWinners[0], qfWinners[3]], [qfWinners[1], qfWinners[2]]];
    const sfWinners = [];
    const sfGames = [];
    for (const [a, b] of sfPairs) {
      const g = runSeries(a, b, "Semifinal");
      sfGames.push(g.log);
      sfWinners.push(g.winnerTeam);
    }
    rounds.push({ name: "Semifinals", games: sfGames });

    // Final
    const finalGame = runSeries(sfWinners[0], sfWinners[1], "Final");
    rounds.push({ name: "Final", games: [finalGame.log] });
    
    leagueState.playoffLog = { rounds, champion: finalGame.winnerTeam.abbrev };
  },

  updatePrestigeAfterSeason(leagueState) {
    const teams = leagueState.teams;
    const n = teams.length;
    
    const sorted = [...teams].sort((a, b) => b.seasonStats.wins - a.seasonStats.wins);
    sorted.forEach((t, idx) => t.seasonStats.place = idx + 1);

    for (const t of teams) {
      const P0 = Number(t.prestige);
      const place = t.seasonStats.place;

      const performance = 1 + ((n - place) / (n - 1)) * 4;
      let change = 0;
      
      if (performance < P0) {
          const diff = P0 - performance;
          change = -(diff * 0.25);
      } else {
          const diff = performance - P0;
          change = diff * 0.15;
      }

      const newPrestige = Utils.clamp(P0 + change, 1, 5);
      t.prestige = Number(newPrestige);
    }
  },

  initializeFreeAgentPool(league) {
    league.freeAgentPool = [];
    for (let i = 0; i < CONFIG.FREE_AGENT_POOL_SIZE; i++) {
      const randomPrestige = Utils.randInt(1, 4);
      const fa = PlayerManager.generatePlayer(null, randomPrestige, false);
      fa.inMarket = false;
      league.freeAgentPool.push(fa);
    }
  },

  generateFreeAgents(league) {
    if (!league.freeAgentPool || league.freeAgentPool.length === 0) {
      this.initializeFreeAgentPool(league);
    }
    
    const available = league.freeAgentPool.filter(p => !p.signed && !p.declined);
    const shuffled = Utils.shuffle([...available]);
    const toDisplay = shuffled.slice(0, CONFIG.FREE_AGENT_DISPLAY);
    
    toDisplay.forEach(p => p.inMarket = true);
    league.freeAgents = toDisplay;
  },

  refreshFreeAgentPool(league) {
    this.initializeFreeAgentPool(league);
    const toDisplay = league.freeAgentPool.slice(0, CONFIG.FREE_AGENT_DISPLAY);
    toDisplay.forEach(p => p.inMarket = true);
    league.freeAgents = toDisplay;
  },

  doYouthIntake(league, teamId) {
    const team = league.teams.find(t => t.id === teamId);
    if (!team) return null;

    const youth = [];
    for (let i = 0; i < CONFIG.YOUTH_COUNT; i++) {
      const youthPlayer = PlayerManager.generatePlayer(teamId, team.prestige, true);
      youthPlayer.age = Utils.randInt(18, 22);
      youthPlayer.acquisitionType = 'youth';
      youthPlayer.wage = youthPlayer.calculateWage(team.prestige);
      youth.push(youthPlayer);
    }
    league.didYouthThisOffseason = true;
    return youth;
  },

  releasePlayer(league, teamId, playerId) {
    const team = league.teams.find(t => t.id === teamId);
    if (!team) return { success: false, reason: "Team not found." };

    if (league.phase !== CONFIG.PHASES.OFFSEASON) {
      return { success: false, reason: "Can only release players in the Off-season." };
    }
    
    const idx = team.players.findIndex(p => p.id === playerId);
    if (idx === -1) return { success: false, reason: "Player not found on your team." };

    const p = team.players[idx];
    
    // Calculate release cost
    let releaseCost = 0;
    if (p.acquisitionType === 'transfer' || p.acquisitionType === 'renewed') {
      releaseCost = p.contractYears * p.wage;
    }
    
    if (team.transferBudget < releaseCost) {
      return { success: false, reason: `Not enough budget. Release cost: ${releaseCost.toLocaleString()}` };
    }
    
    // Deduct cost
    team.cash -= releaseCost;
    team.updateBudgets();
    
    // Remove player
    team.players.splice(idx, 1);
    p.teamId = null;
    p.contractYears = 0;
    p.signed = false;
    p.declined = false;
    p.inMarket = false;
    
    if (!league.freeAgentPool) league.freeAgentPool = [];
    league.freeAgentPool.push(p);
    
    return { success: true, player: p, cost: releaseCost };
  },

  signFreeAgentToBestTeam(league, playerId, userTeamId) {
    const p = league.freeAgents.find(fa => fa.id === playerId);
    if (!p) return { success: false, reason: "Player not found." };

    const userTeam = league.teams.find(t => t.id === userTeamId);
    if (!userTeam) return { success: false, reason: "Team not found." };
    
    if (userTeam.players.length >= CONFIG.ROSTER_SIZE) {
        return { success: false, reason: `Roster full (${CONFIG.ROSTER_SIZE} limit).` };
    }
    
    // Free agents don't cost transfer fee, just wages
    const wage = p.calculateWage(userTeam.prestige);
    
    if (userTeam.transferBudget < 0) {
      return { success: false, reason: "Negative transfer budget!" };
    }

    // High potential players (3+ stars) = competitive bidding
    if (p.potentialStars >= 3) {
      const aiTeams = league.teams.filter(t => t.id !== userTeamId);
      const comp1 = aiTeams[Utils.randInt(0, aiTeams.length - 1)];
      const comp2 = aiTeams[Utils.randInt(0, aiTeams.length - 1)];
      
      const luckOptions = [0.2, 0.4, 0.6];
      const userLuck = luckOptions[Utils.randInt(0, 2)];
      const comp1Luck = luckOptions[Utils.randInt(0, 2)];
      const comp2Luck = luckOptions[Utils.randInt(0, 2)];
      
      const userScore = userTeam.prestige + (userTeam.prestige * userLuck);
      const comp1Score = comp1.prestige + (comp1.prestige * comp1Luck);
      const comp2Score = comp2.prestige + (comp2.prestige * comp2Luck);
      
      if (userScore < comp1Score || userScore < comp2Score) {
        p.declined = true;
        p.inMarket = false;
        const idx = league.freeAgents.findIndex(fa => fa.id === playerId);
        if (idx !== -1) league.freeAgents.splice(idx, 1);
        return { success: false, reason: "Another team outbid you!" };
      }
    } else {
      // Lower potential (1-2 stars) = 70% accept, 30% decline
      if (Math.random() > 0.7) {
        p.declined = true;
        p.inMarket = false;
        const idx = league.freeAgents.findIndex(fa => fa.id === playerId);
        if (idx !== -1) league.freeAgents.splice(idx, 1);
        return { success: false, reason: "Player declined your offer." };
      }
    }
    
    // Success - remove from display and pool
    const faIdx = league.freeAgents.findIndex(fa => fa.id === playerId);
    if (faIdx !== -1) league.freeAgents.splice(faIdx, 1);
    
    const poolIdx = league.freeAgentPool.findIndex(fa => fa.id === playerId);
    if (poolIdx !== -1) league.freeAgentPool.splice(poolIdx, 1);
    
    // Sign player - 1 year contract for free agent
    p.teamId = userTeamId;
    p.contractYears = 1;
    p.wage = wage;
    p.acquisitionType = 'free';
    p.status = 'reserve';
    userTeam.players.push(p);
    
    // Update budgets to reflect new wages
    userTeam.updateBudgets();
    
    return { success: true, player: p, team: userTeam };
  },

  extendContract(league, playerId, years) {
    const userTeam = league.teams.find(t => t.id === league.userTeamId);
    if (!userTeam) return { success: false, reason: "Team not found." };
    
    const p = userTeam.players.find(pl => pl.id === playerId);
    
    if (!p) return { success: false, reason: "Player not found." };
    if (p.extendAttempted) return { success: false, reason: "Already attempted this season." };

    p.extendAttempted = true;
    
    // Calculate new wage
    const newWage = p.calculateWage(userTeam.prestige);
    const totalCost = newWage * years;
    
    // Check if can afford
    if (userTeam.transferBudget < totalCost) {
      return { success: false, reason: `Not enough budget. Cost: ${totalCost.toLocaleString()}` };
    }

    let acceptChance = 0;
    if (years === 1) acceptChance = 0.75;
    else if (years === 2) acceptChance = 0.90;
    
    // Age penalties
    if (p.age > 30) acceptChance -= 0.1;
    if (p.age > 34) acceptChance -= 0.2;
    
    acceptChance = Math.max(0, acceptChance);
    
    const roll = Math.random();
    
    if (roll < acceptChance) {
        // Deduct cost ONCE
        userTeam.cash -= totalCost;
        userTeam.updateBudgets();
        
        // Add years (no tick during offseason)
        p.contractYears += years;   
        p.wage = newWage;
        p.acquisitionType = 'renewed';
        return { success: true, extended: true, years: years, cost: totalCost };
    } else {
        return { success: true, extended: false };
    }
  },

  autoFillAITeams(league) {
    // First, AI teams release expired contracts to pool
    for (const team of league.teams) {
      if (team.id === league.userTeamId) continue;
      
      const remaining = [];
      for (const p of team.players) {
        if (p.retired) continue;
        
        if (p.contractYears <= 0) {
          p.teamId = null;
          p.status = "reserve";
          p.signed = false;
          p.declined = false;
          p.inMarket = false;
          if (!league.freeAgentPool) league.freeAgentPool = [];
          league.freeAgentPool.push(p);
        } else {
          remaining.push(p);
        }
      }
      team.players = remaining;
    }
    
    // Then fill rosters from pool
    for (const team of league.teams) {
      if (team.id === league.userTeamId) continue;
      
      while (team.players.length < CONFIG.ROSTER_SIZE) {
        if (!league.freeAgentPool || league.freeAgentPool.length === 0) break;
        
        const available = league.freeAgentPool.filter(p => !p.signed && !p.declined);
        if (available.length === 0) break;
        
        const idx = Utils.randInt(0, available.length - 1);
        const p = available[idx];
        
        const poolIdx = league.freeAgentPool.findIndex(fa => fa.id === p.id);
        if (poolIdx !== -1) league.freeAgentPool.splice(poolIdx, 1);
        
        p.teamId = team.id;
        p.contractYears = Utils.randInt(1, 3);
        p.signed = true;
        p.inMarket = false;
        p.wage = p.calculateWage(team.prestige);
        team.players.push(p);
      }
      this.autoSetLineup(team);
      team.updateBudgets();
    }
  },

  generateTransferPrice(stars) {
    // Star transfer price ranges
    const ranges = {
      1: [1500, 10000],
      2: [4000, 30000],
      3: [15000, 60000],
      4: [40000, 125000],
      5: [60000, 250000]
    };
    const [min, max] = ranges[stars] || [5000, 30000];
    return Utils.randInt(min, max);
  },

  generateTransferMarket(league) {
    league.transferMarket = []; // Clear old market
    const userTeamId = league.userTeamId;
    
    // Pick random players from OTHER teams
    league.teams.forEach(t => {
      if (t.id === userTeamId) return;
      
      // Pick 1 or 2 best players to list
      const candidates = t.players.filter(p => !p.retired && p.contractYears > 0);
      // Sort by rating desc
      candidates.sort((a,b) => b.rating - a.rating);
      
      // Take top 2
      const toSell = candidates.slice(0, 2);
      
      toSell.forEach(p => {
        const price = this.generateTransferPrice(p.potentialStars);
        // Mark as on market
        league.transferMarket.push({
          player: p,
          price: price,
          fromTeamId: t.id
        });
      });
    });
    
    // Shuffle market for variety
    league.transferMarket = Utils.shuffle(league.transferMarket);
  },

  buyTransfer(playerId, years) {
    const res = LeagueManager.buyTransferPlayer(window.league, window.league.userTeamId, Number(playerId), years);
    
    if (res.success) {
        this.notify(`Signed ${res.player.name} for $${res.cost.toLocaleString()}`, "success");
        this.updateAll();
    } else {
        this.notify(res.reason, "error");
    }
    },
    
 // In league.js, update buyTransferPlayer method:
buyTransferPlayer(league, userTeamId, playerId, years) {
    const userTeam = league.teams.find(t => t.id === userTeamId);
    const marketItem = league.transferMarket.find(m => m.player.id === playerId);
    
    if (!userTeam || !marketItem) return { success: false, reason: "Player not found." };
    
    const p = marketItem.player;
    const wage = p.calculateWage(userTeam.prestige);
    const transferFee = marketItem.price;
    
    if (userTeam.transferBudget < transferFee) {
        return { success: false, reason: `Cannot afford transfer fee: ${transferFee.toLocaleString()}` };
    }
    
    // Acceptance chance logic
    let acceptChance = years === 1 ? 0.90 : 0.75;
    
    // Add prestige bonus/penalty
    const prestigeDiff = userTeam.prestige - league.teams.find(t => t.id === marketItem.fromTeamId).prestige;
    if (prestigeDiff > 1) acceptChance += 0.1;
    if (prestigeDiff < -1) acceptChance -= 0.1;
    
    // Age penalty for longer contracts
    if (years === 2 && p.age > 30) acceptChance -= 0.15;
    if (years === 2 && p.age > 34) acceptChance -= 0.25;
    
    acceptChance = Math.max(0.1, Math.min(0.95, acceptChance));
    
    // Roll for acceptance
    if (Math.random() > acceptChance) {
        return { success: false, reason: `Player declined ${years}-year contract offer (${Math.round(acceptChance * 100)}% chance)` };
    }
    
    // Execute Transfer
    userTeam.cash -= transferFee;
    
    // Remove from old team
    const oldTeam = league.teams.find(t => t.id === marketItem.fromTeamId);
    if (oldTeam) {
        oldTeam.players = oldTeam.players.filter(pl => pl.id !== p.id);
        oldTeam.cash += transferFee; // They get the money
        oldTeam.updateBudgets();
    }
    
    // Add to user team
    p.teamId = userTeam.id;
    p.contractYears = years;
    p.wage = wage;
    p.acquisitionType = 'transfer';
    p.status = 'reserve';
    userTeam.players.push(p);
    
    // Remove from market
    league.transferMarket = league.transferMarket.filter(m => m.player.id !== playerId);
    
    userTeam.updateBudgets();
    
    return { success: true, player: p, cost: transferFee };
}};