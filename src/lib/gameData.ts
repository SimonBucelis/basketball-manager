import {
  Team,
  Player,
  PlayerRole,
  PlayerAttributes,
  DivisionId,
  SeasonModifierInfo,
  SeasonBonusInfo,
  PlayerRarity,
  FreeAgent,
} from "./types";

const FIRST_NAMES = [
  "Mantas", "Lukas", "Tomas", "Domantas", "Jonas", "Mindaugas", "Arvydas", "Šarūnas",
  "Donatas", "Paulius", "Rokas", "Ignas", "Deividas", "Karolis", "Martynas", "Edgaras",
  "Aurimas", "Giedrius", "Renaldas", "Eimantas", "Marius", "Dovydas", "Justas", "Linas",
  "Arnas", "Benas", "Vytautas", "Gediminas", "Andrius", "Žygimantas"
];

const LAST_NAMES = [
  "Sabonis", "Valančiūnas", "Jasikevičius", "Kleiza", "Songaila", "Kavaliauskas",
  "Motiejūnas", "Kuzminskas", "Lekavicius", "Grigonis", "Jokubaitis", "Brazdeikis",
  "Butkevicius", "Dimša", "Echodas", "Geben", "Jankunas", "Kalnietis", "Likauskis",
  "Maciulis", "Normantas", "Orelik", "Pocius", "Seibutis", "Tubelis", "Ulanovas",
  "Velička", "Žukauskas", "Birutis", "Bendzius"
];

let playerId = 0;

function generateId(): string {
  return `p_${++playerId}`;
}

// Central salary curve helper so wages stay realistic and scale mainly with overall + team prestige
export function estimateFairSalary(overall: number, prestige: number): number {
  // Base grows linearly with overall; tweak 120 if overall salary levels feel too high/low
  const base = overall * 120;
  // Prestige gives a moderate bump without exploding for top clubs
  const prestigeBonus = 1 + prestige * 0.06; // 6% per prestige level (max +30%)
  return Math.round(base * prestigeBonus);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAttributes(role: PlayerRole, prestige: number): PlayerAttributes {
  const base = 30 + prestige * 10;
  // Reduced variance for more consistent team strength within same prestige
  const variance = prestige >= 3 ? 12 : 10;

  const attrs: PlayerAttributes = {
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
    attrs.height = Math.max(attrs.height, 198);
  } else {
    attrs.passing = Math.min(99, attrs.passing + 12);
    attrs.dribbling = Math.min(99, attrs.dribbling + 10);
  }

  attrs.shooting = Math.max(1, Math.min(99, attrs.shooting));
  attrs.defending = Math.max(1, Math.min(99, attrs.defending));
  attrs.dribbling = Math.max(1, Math.min(99, attrs.dribbling));
  attrs.passing = Math.max(1, Math.min(99, attrs.passing));

  return attrs;
}

function calculateOverall(attrs: PlayerAttributes): number {
  return Math.round((attrs.shooting + attrs.defending + attrs.dribbling + attrs.passing) / 4);
}

function getRarityFromOverall(overall: number): PlayerRarity {
  if (overall >= 80) return "Legendary";
  if (overall >= 70) return "Epic";
  if (overall >= 60) return "Rare";
  return "Common";
}

function generatePlayer(prestige: number, forceRole?: PlayerRole): Player {
  const roles: PlayerRole[] = ["Sharpshooter", "Defender", "Playmaker"];
  const role = forceRole || roles[Math.floor(Math.random() * roles.length)];
  const attrs = generateAttributes(role, prestige);
  const overall = calculateOverall(attrs);
  const baseSalary = estimateFairSalary(overall, prestige);

  return {
    id: generateId(),
    name: `${FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)]}`,
    age: randomBetween(19, 34),
    role,
    attributes: attrs,
    overall,
    salary: baseSalary,
    contractYears: randomBetween(1, 3),
    rarity: getRarityFromOverall(overall),
    joinedThisOffseason: false,
    seasonsWithoutPlay: 0,
  };
}

function generateRoster(count: number, prestige: number): Player[] {
  const players: Player[] = [];
  const rolesNeeded: PlayerRole[] = ["Sharpshooter", "Sharpshooter", "Defender", "Defender", "Playmaker", "Playmaker"];
  for (let i = 0; i < count; i++) {
    const role = i < rolesNeeded.length ? rolesNeeded[i] : undefined;
    players.push(generatePlayer(prestige, role));
  }
  return players;
}

// 2025-2026 Lithuanian RKL Season
export const TEAMS_DATA: Omit<Team, "players">[] = [
  // ── A Division (RKL) — 8 teams ────────────────────────────────────────────
  { id: "striptejas", name: 'Molėtų "Striptizo Šokėjai"',  shortName: "STR", division: "rkl", prestige: 4, color: "#1a237e", budget: 380000 },
  { id: "rusiai",     name: 'Kupiškio "Rūsio Bėgikai"',    shortName: "RŪS", division: "rkl", prestige: 4, color: "#b71c1c", budget: 360000 },
  { id: "desros",     name: 'Vilniaus "Samsono Dešros"',    shortName: "DŠR", division: "rkl", prestige: 3, color: "#006064", budget: 280000 },
  { id: "uzbekai",    name: 'Kauno "Uzbekų Kraštas"',       shortName: "UZB", division: "rkl", prestige: 3, color: "#1b5e20", budget: 260000 },
  { id: "benamiai",   name: 'Garliavos "Benamių Sostinė"',  shortName: "BEN", division: "rkl", prestige: 2, color: "#4a148c", budget: 200000 },
  { id: "hirosima",   name: 'Ignalinos "Hirošimos Vaikai"', shortName: "HIR", division: "rkl", prestige: 2, color: "#e65100", budget: 190000 },
  { id: "degiai",     name: 'Elektrėnų "Žydų Degėsiai"',   shortName: "DEG", division: "rkl", prestige: 2, color: "#880e4f", budget: 185000 },
  { id: "pedofilai",  name: 'Marijampolės "Pedofilų Rojus"',shortName: "PED", division: "rkl", prestige: 2, color: "#f57f17", budget: 180000 },
  // ── B Division (LKL) — 8 teams ────────────────────────────────────────────
  { id: "dinge",      name: 'Pakruojo "Dingę Vaikai"',      shortName: "DNG", division: "lkl", prestige: 2, color: "#00838f", budget: 130000 },
  { id: "imigrantai", name: 'Švenčionėlių "Imigrantų Miestas"', shortName: "IMG", division: "lkl", prestige: 1, color: "#558b2f", budget: 105000 },
  { id: "teletubbies",name: 'Druskininkų "Teletabių Toucheriai"', shortName: "TEL", division: "lkl", prestige: 1, color: "#6a1b9a", budget: 100000 },
  { id: "ceburekai",  name: 'Kretingos "Žali Čeburekai"',   shortName: "ČEB", division: "lkl", prestige: 1, color: "#c62828", budget: 95000 },
  { id: "mocutes",    name: 'Zarasų "Močiūčių Turgus"',     shortName: "MOČ", division: "lkl", prestige: 1, color: "#37474f", budget: 90000 },
  { id: "duona",      name: 'Biržų "Nekepta Duona"',         shortName: "DUO", division: "lkl", prestige: 1, color: "#4e342e", budget: 88000 },
  { id: "sala",       name: 'Neringos "Slapta Sala"',        shortName: "SAL", division: "lkl", prestige: 1, color: "#0277bd", budget: 85000 },
  { id: "bombos",     name: 'Visagino "Putino Bombos"',      shortName: "BOM", division: "lkl", prestige: 1, color: "#2e7d32", budget: 83000 },
];

export function createInitialTeams(): Team[] {
  return TEAMS_DATA.map(t => {
    const roster = generateRoster(t.prestige >= 3 ? 10 : 8, t.prestige);
    // Auto-select the 5 highest overall players as starters to create varied strategies
    const sortedByOverall = [...roster].sort((a, b) => b.overall - a.overall);
    const starterIds = new Set(sortedByOverall.slice(0, 5).map(p => p.id));

    const playersWithStarters = roster.map(player => ({
      ...player,
      isStarter: starterIds.has(player.id),
    }));

    return {
      ...t,
      budget: Math.round(t.budget / 2),
      players: playersWithStarters,
    };
  });
}

export function generateFreeAgents(division: DivisionId, isOffseason: boolean = false, teamPrestige: number = 2): FreeAgent[] {
  const agents: FreeAgent[] = [];
  const isBLeague = division === "lkl";
  
  // Adjust market based on team prestige
  // Higher prestige = more players and better quality
  const prestigeModifier = teamPrestige >= 4 ? 1.5 : teamPrestige >= 3 ? 1.2 : teamPrestige >= 2 ? 1.0 : 0.7;
  
  // Determine how many players based on league, phase, and prestige
  let count: number;
  if (isBLeague) {
    // B League: 5 regular, 10 off-season (adjusted by prestige)
    count = Math.round((isOffseason ? 10 : 5) * prestigeModifier);
  } else {
    // A League: 7 regular, 18 off-season (adjusted by prestige)
    count = Math.round((isOffseason ? 18 : 7) * prestigeModifier);
  }
  
  // Determine quality range based on prestige
  const minQuality = Math.max(1, teamPrestige - 1);
  const maxQuality = Math.min(5, teamPrestige + 1);
  
  for (let i = 0; i < count; i++) {
    const playerPrestige = randomBetween(minQuality, maxQuality);
    const player = generatePlayer(playerPrestige);
    
    if (isBLeague) {
      // B League: Show RANGES with uncertainty (5-15 points difference)
      const uncertainty = randomBetween(5, 15);
      
      // Create ranges for display (player.attributes are the BASE/MIN values)
      agents.push({
        ...player,
        // Display attributes as ranges in the market
        attributes: player.attributes, // These are the MIN values
        overall: player.overall, // This is the MIN overall
        askingSalary: 0,
        salary: 0,
        contractYears: 0,
        // Store the uncertainty amount so we can show ranges and calculate on purchase
        attributeRanges: {
          shooting: { min: player.attributes.shooting, max: Math.min(99, player.attributes.shooting + uncertainty) },
          defending: { min: player.attributes.defending, max: Math.min(99, player.attributes.defending + uncertainty) },
          dribbling: { min: player.attributes.dribbling, max: Math.min(99, player.attributes.dribbling + uncertainty) },
          passing: { min: player.attributes.passing, max: Math.min(99, player.attributes.passing + uncertainty) },
          overall: { min: player.overall, max: Math.min(99, player.overall + uncertainty) }
        }
      });
    } else {
      // A League: Normal market with accurate ratings
      agents.push({
        ...player,
        askingSalary: Math.round(player.salary * (1 + Math.random() * 0.3)),
        contractYears: 0,
      });
    }
  }
  
  return agents;
}

// Titas Samsonas — legendary local hero. Appears rarely in the market.
// Call this to check if he should appear; returns him or null.
export function tryGenerateTitasSamsonas(alreadyExists: boolean): FreeAgent | null {
  if (alreadyExists) return null;       // Only one per save
  if (Math.random() > 0.08) return null; // ~8% chance per market refresh
  const attrs: PlayerAttributes = {
    height: 196,
    shooting: randomBetween(68, 78),
    defending: randomBetween(55, 68),
    dribbling: randomBetween(60, 72),
    passing: randomBetween(62, 74),
  };
  const overall = Math.round((attrs.shooting + attrs.defending + attrs.dribbling + attrs.passing) / 4);
  return {
    id: "titas_samsonas_legend",
    name: "Titas Samsonas",
    age: randomBetween(26, 31),
    role: "Sharpshooter" as PlayerRole,
    attributes: attrs,
    overall,
    salary: Math.round(overall * 180),
    contractYears: 0,
    askingSalary: Math.round(overall * 200),
    rarity: "Epic" as PlayerRarity,
    isTitasSamsonas: true,
  };
}

export function generateYouthPlayer(prestige: number): Player {
  const roles: PlayerRole[] = ["Sharpshooter", "Defender", "Playmaker"];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const attrs = generateAttributes(role, Math.max(1, prestige - 1));
  const overall = calculateOverall(attrs);
  return {
    id: generateId(),
    name: `${FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)]}`,
    age: randomBetween(17, 20),
    role,
    attributes: attrs,
    overall,
    salary: 0, // Youth players start with free contracts
    contractYears: 2,
    isYouth: true,
    rarity: getRarityFromOverall(overall),
  };
}

export const SEASON_MODIFIERS: SeasonModifierInfo[] = [
  { id: "foreign_investment", name: "Foreign Investment", description: "+15% transfer budget", emoji: "💰" },
  { id: "financial_crisis", name: "Financial Crisis", description: "–30% income", emoji: "📉" },
  { id: "injury_crisis", name: "Injury Crisis", description: "Random rating penalties during matches", emoji: "🏥" },
  { id: "fan_boom", name: "Fan Boom", description: "Bonus prestige growth", emoji: "🎉" },
];

export const SEASON_BONUSES: SeasonBonusInfo[] = [
  {
    id: "bonus_ticket_10",
    name: "Packed Arena",
    description: "+10% ticket income this season",
    emoji: "🎫",
  },
  {
    id: "bonus_sponsor_10",
    name: "New Sponsor Deal",
    description: "+10% sponsor income this season",
    emoji: "📢",
  },
  {
    id: "bonus_wage_minus10",
    name: "Salary Restructure",
    description: "Player wage bill -10% this season",
    emoji: "✂️",
  },
];

export const DIVISIONS: { id: DivisionId; name: string }[] = [
  { id: "rkl", name: "A Division (RKL)" },
  { id: "lkl", name: "B Division (LKL)" },
];
