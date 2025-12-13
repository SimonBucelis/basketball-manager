// Player Generation & Progression
const PlayerManager = {
  globalPlayerId: 0,

  calculatePotentialStars(age, hiddenPotential) {
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
  },

  generatePlayer(teamId, prestige = 3, isYouth = false) {
    const fName = CONFIG.PLAYER_DB.firstNames[Utils.randInt(0, CONFIG.PLAYER_DB.firstNames.length - 1)];
    const lName = CONFIG.PLAYER_DB.lastNames[Utils.randInt(0, CONFIG.PLAYER_DB.lastNames.length - 1)];
    const fullName = `${fName} ${lName}`;
    
    const role = CONFIG.ROLES[Utils.randInt(0, 2)];

    let age;
    if (isYouth) {
      age = Utils.randInt(18, 20);
    } else {
      const ageGroup = Utils.weightedChoice([
        { item: "young", weight: Utils.clamp(20 + (3 - prestige) * 5, 5, 60) },
        { item: "prime", weight: Utils.clamp(50 + (prestige - 3) * 10, 20, 80) },
        { item: "veteran", weight: Utils.clamp(30 + (3 - prestige) * 5, 5, 60) }
      ]);
      if (ageGroup === "young") age = Utils.randInt(18, 22);
      else if (ageGroup === "prime") age = Utils.randInt(23, 30);
      else age = Utils.randInt(31, 36);
    }

    const prestigeBase = {
      5: Utils.randInt(70, 80),
      4: Utils.randInt(65, 75),
      3: Utils.randInt(60, 70),
      2: Utils.randInt(55, 65),
      1: Utils.randInt(48, 60)
    }[prestige] || Utils.randInt(55, 70);

    let ageModifier = 0;
    if (age <= 22) ageModifier = -5 + Utils.randInt(0, 6);
    else if (age <= 27) ageModifier = Utils.randInt(0, 6);
    else if (age <= 31) ageModifier = Utils.randInt(-2, 4);
    else ageModifier = -Utils.randInt(0, 8);

    if (isYouth) ageModifier -= Utils.randInt(5, 10);

    const currentRating = Utils.clamp(prestigeBase + ageModifier + Utils.randInt(-3, 3), 30, 95);

    let potential;
    if (age <= 22) potential = Utils.clamp(currentRating + Utils.randInt(5, 25), currentRating, 95);
    else if (age <= 27) potential = Utils.clamp(currentRating + Utils.randInt(2, 15), currentRating, 95);
    else potential = Utils.clamp(currentRating + Utils.randInt(0, 8), currentRating, 95);

    if (isYouth) {
      potential = Utils.clamp(currentRating + Utils.randInt(20, 35), currentRating, 95);
    }

    const contractYears = isYouth ? CONFIG.YOUTH_CONTRACT_YEARS : Utils.randInt(1, 4);
    const potentialStars = this.calculatePotentialStars(age, potential);

    return new Player({
      id: this.globalPlayerId++,
      name: fullName,
      age,
      rating: Math.round(currentRating),
      hiddenPotential: Math.round(potential),
      potentialStars,
      role,
      contractYears,
      teamId,
      retired: false,
      status: "reserve",
      extendAttempted: false
    });
  },

  generateRoster(teamId, prestige, size = CONFIG.ROSTER_SIZE) {
    const roster = [];
    for (let i = 0; i < size; i++) {
      roster.push(this.generatePlayer(teamId, prestige, false));
    }
    return roster;
  },

  progressPlayers(league) {
    for (const team of league.teams) {
      for (const p of team.players) {
        if (p.retired) continue;

        let rating = p.rating;
        const potential = p.hiddenPotential;
        const age = p.age;

        if (age <= 24) {
          if (rating < potential) {
            const gap = potential - rating;
            let chance = 0.6;
            if (gap < 5) chance = 0.3;
            else if (gap < 10) chance = 0.45;

            if (Math.random() < chance) {
              let delta = 1;
              if (gap > 10 && Math.random() < 0.5) delta = 2;
              if (gap > 20 && Math.random() < 0.3) delta = 3;
              rating = Math.min(potential, rating + delta);
            }
          }
        } else if (age >= 25 && age <= 29) {
          if (rating < potential && Math.random() < 0.3) {
            rating = Math.min(potential, rating + 1);
          }
        } else if (age >= 30) {
          let dropChance = 0.5;
          let maxDrop = 1;
          if (age >= 33) {
            dropChance = 0.7;
            maxDrop = 2;
          }
          if (age >= 36) {
            dropChance = 0.9;
            maxDrop = 3;
          }

          if (Math.random() < dropChance) {
            const drop = Utils.randInt(1, maxDrop);
            rating = Math.max(30, rating - drop);
          }
        }

        p.rating = Math.round(rating);
        p.age += 1;

        if (p.age > 37 && p.rating < 65 && Math.random() < 0.4) {
          p.retired = true;
          p.teamId = null;
        }

        p.extendAttempted = false;
      }
    }
  },

  expireContracts(league) {
    for (const team of league.teams) {
      for (const p of team.players) {
        p.contractYears = Math.max(0, p.contractYears - 1);
      }
    }

    for (const team of league.teams) {
      const remaining = [];
      for (const p of team.players) {
        if (p.contractYears <= 0 && !p.retired) {
          p.teamId = null;
          p.status = "reserve";
          league.freeAgents.push(p);
        } else {
          remaining.push(p);
        }
      }
      team.players = remaining;
    }
  }
};