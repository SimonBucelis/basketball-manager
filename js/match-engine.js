// js/match-engine.js
const MatchEngine = {
  simulateMatch(homeTeam, awayTeam, leagueState) {
    // Basic Simulation Logic
    const getTeamRating = (team) => {
        const sorted = [...team.players].filter(p => !p.retired).sort((a,b) => b.rating - a.rating);
        const top7 = sorted.slice(0, 7);
        const avg = top7.reduce((sum, p) => sum + p.rating, 0) / Math.max(1, top7.length);
        return avg;
    };

    let homePower = getTeamRating(homeTeam) + (homeTeam.prestige * 2) + 5; // +5 Home court
    let awayPower = getTeamRating(awayTeam) + (awayTeam.prestige * 2);

    // Add RNG variance
    homePower += Utils.randInt(0, 15);
    awayPower += Utils.randInt(0, 15);

    // Determine Winner
    const margin = Math.abs(homePower - awayPower);
    let homeScore = 80 + Utils.randInt(0, 20);
    let awayScore = 80 + Utils.randInt(0, 20);

    // Adjust scores based on winner
    if (homePower > awayPower) {
        homeScore += Math.floor(margin / 2); 
        if(awayScore >= homeScore) awayScore = homeScore - Utils.randInt(1, 10);
        homeTeam.seasonStats.wins++;
        awayTeam.seasonStats.losses++;
    } else {
        awayScore += Math.floor(margin / 2);
        if(homeScore >= awayScore) homeScore = awayScore - Utils.randInt(1, 10);
        awayTeam.seasonStats.wins++;
        homeTeam.seasonStats.losses++;
    }

    homeScore = Math.floor(homeScore);
    awayScore = Math.floor(awayScore);

    homeTeam.seasonStats.pointsFor += homeScore;
    homeTeam.seasonStats.pointsAgainst += awayScore;
    awayTeam.seasonStats.pointsFor += awayScore;
    awayTeam.seasonStats.pointsAgainst += homeScore;

    const matchLog = {
      home: homeTeam.abbrev,
      away: awayTeam.abbrev,
      scoreHome: homeScore,
      scoreAway: awayScore,
      winner: homePower > awayPower ? homeTeam.abbrev : awayTeam.abbrev
    };

    if(leagueState && leagueState.matchLog) {
      leagueState.matchLog.push(matchLog);
    }

    return matchLog;
  },

  simulatePlayoffGame(teamA, teamB, leagueState, roundName) {
    const getTeamRating = (team) => {
        const sorted = [...team.players].filter(p => !p.retired).sort((a,b) => b.rating - a.rating);
        const top7 = sorted.slice(0, 7);
        const avg = top7.reduce((sum, p) => sum + p.rating, 0) / Math.max(1, top7.length);
        return avg;
    };

    let powerA = getTeamRating(teamA) + (teamA.prestige * 2) + Utils.randInt(0, 15);
    let powerB = getTeamRating(teamB) + (teamB.prestige * 2) + Utils.randInt(0, 15);

    const margin = Math.abs(powerA - powerB);
    let scoreA = 80 + Utils.randInt(0, 20);
    let scoreB = 80 + Utils.randInt(0, 20);

    let winner;
    if (powerA > powerB) {
        scoreA += Math.floor(margin / 2);
        if(scoreB >= scoreA) scoreB = scoreA - Utils.randInt(1, 10);
        winner = teamA;
        teamA.playoffSeriesWins++;
    } else {
        scoreB += Math.floor(margin / 2);
        if(scoreA >= scoreB) scoreA = scoreB - Utils.randInt(1, 10);
        winner = teamB;
        teamB.playoffSeriesWins++;
    }

    teamA.playoffRoundReached = roundName;
    teamB.playoffRoundReached = roundName;
    if(winner === teamA) teamA.playoffRoundReached = roundName + " Winner";
    if(winner === teamB) teamB.playoffRoundReached = roundName + " Winner";

    return {
      winnerTeam: winner,
      log: {
        home: teamA.abbrev,
        away: teamB.abbrev,
        scoreHome: Math.floor(scoreA),
        scoreAway: Math.floor(scoreB),
        winner: winner.abbrev
      }
    };
  }
};