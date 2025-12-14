// Data Models
class Player {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.age = data.age;
    this.rating = data.rating;
    this.hiddenPotential = data.hiddenPotential;
    this.potentialStars = data.potentialStars;
    this.role = data.role;
    this.contractYears = data.contractYears;
    this.teamId = data.teamId;
    this.retired = data.retired || false;
    this.status = data.status || 'reserve';
    this.extendAttempted = data.extendAttempted || false;
    this.wage = data.wage || 0;
    this.acquisitionType = data.acquisitionType || 'youth'; // 'youth', 'free', 'transfer', 'renewed'
    this.transferFee = data.transferFee || 0;
  }
  
  calculateWage(teamPrestige) {
    // Wage formula: round((Age^2) * (prestige*0.5) * OVR * stars)
    return Math.round((this.age * (this.age/2)) * (teamPrestige*0.2) * this.rating * this.potentialStars);
  }
}

class Team {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.abbrev = data.abbrev;
    this.prestige = Number(Utils.clamp(data.prestige || 3, 1, 5));
    this.players = data.players || [];
    this.seasonStats = data.seasonStats || {
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      place: null
    };
    this.yearFounded = data.yearFounded || new Date().getFullYear();
    this.playoffSeriesWins = data.playoffSeriesWins || 0;
    this.playoffRoundReached = data.playoffRoundReached || "Did not qualify";
    
    // Finance properties - use team-specific starting cash
    this.startingCash = data.startingCash || 100000; // Fallback if not defined
    this.cash = data.cash !== undefined ? data.cash : this.startingCash;
    this.wageBudget = data.wageBudget || 0;
    this.transferBudget = data.transferBudget || 0;
    this.financeHistory = data.financeHistory || [];
  }

  resetSeasonStats() {
    this.seasonStats = {
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      place: null
    };
    this.playoffSeriesWins = 0;
    this.playoffRoundReached = "Did not qualify";
  }
  
  getProfit() {
    return this.cash - this.startingCash;
  }
  
  calculateRequiredWages() {
    return this.players.reduce((sum, p) => sum + (p.wage || 0), 0);
  }
  
  updateBudgets() {
    // Called when entering offseason
    this.wageBudget = this.calculateRequiredWages();
    this.transferBudget = this.cash - this.wageBudget;
  }
  
  recordFinanceHistory(year) {
    this.financeHistory.push({
      year: year,
      cash: this.cash,
      profit: this.getProfit()
    });
  }
}

class League {
  constructor() {
    this.year = new Date().getFullYear();
    this.season = 1;
    this.teams = [];
    this.freeAgents = [];
    this.userTeamId = null;
    this.phase = CONFIG.PHASES.TEAM_SELECTION;
    this.history = [];
    this.matchLog = [];
    this.playoffLog = {};
    this.didYouthThisOffseason = false;
    this.seasonStarted = false;
  }
}