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