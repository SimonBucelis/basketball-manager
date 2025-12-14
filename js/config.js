// js/config.js
const CONFIG = {
  ROSTER_SIZE: 12,
  MIN_ROSTER_SIZE: 8,
  MAX_STARTERS: 5,
  YOUTH_COUNT: 3,
  YOUTH_CONTRACT_YEARS: 2,
  FREE_AGENT_POOL_SIZE: 24,
  FREE_AGENT_DISPLAY: 6, // Changed from 8 to 6
  SAVE_KEY: 'ltbball_manager_v5',
  
  // Game Roles
  ROLES: ['Defender', 'Sharpshooter', 'Playmaker'],
  
  // Game Phases
  PHASES: {
    TEAM_SELECTION: 'team_selection',
    REGULAR: 'regular',
    OFFSEASON: 'offseason'
  },
  
  // Player Names Database
  PLAYER_DB: {
    firstNames: [
      "Jonas", "Mindaugas", "Lukas", "Rokas", "Mantas", "Arnas", "Paulius", "Tomas", "Edgaras", "Gytis", 
      "Ignas", "Domantas", "Tadas", "Karolis", "Deividas", "Martynas", "Justas", "Kevin", "Mike", "John"
    ],
    lastNames: [
      "Kazlauskas", "Jankūnas", "Lekavičius", "Giedraitis", "Kuzminskas", "Ulanovas", "Dimša", "Blaževič", 
      "Birutis", "Sabonis", "Valančiūnas", "Motiejūnas", "Kalnietis", "Mačiulis", "Seibutis", "Jasikevičius",
      "Gudaitis", "Sirvydis", "Brown", "Williams", "Davis", "Miller", "Wilson"
    ]
  },

  // Teams Data - Each team has unique starting cash based on prestige
  TEAMS: [
    { id: 1, name: "Žalgiris", abbrev: "ZAL", prestige: 4.6, startingCash: 1200000 },
    { id: 2, name: "Rytas", abbrev: "RYT", prestige: 4.1, startingCash: 550000 },
    { id: 3, name: "Lietkabelis", abbrev: "LIE", prestige: 4.0, startingCash: 260000 },
    { id: 4, name: "CBet", abbrev: "CBT", prestige: 2.5, startingCash: 100000 },
    { id: 5, name: "Mažeikiai", abbrev: "MAZ", prestige: 2.0, startingCash: 70000 },
    { id: 6, name: "Šiauliai", abbrev: "SIA", prestige: 3.5, startingCash: 140000 },
    { id: 7, name: "Nevėžis", abbrev: "NEV", prestige: 2.8, startingCash: 140000 },
    { id: 8, name: "Neptūnas", abbrev: "NEP", prestige: 3.7, startingCash: 160000 },
    { id: 9, name: "Prienai", abbrev: "PRI", prestige: 1.7, startingCash: 95000 },
    { id: 10, name: "BC Wolves", abbrev: "WOL", prestige: 4.0, startingCash: 440000 },
    { id: 11, name: "Juventus", abbrev: "JUV", prestige: 3.3, startingCash: 170000 },
    { id: 12, name: "Gargždai", abbrev: "GAR", prestige: 2.8, startingCash: 130000 },
    { id: 13, name: "Pieno Žvaigždės", abbrev: "PZV", prestige: 2.5, startingCash: 100000 },
    { id: 14, name: "Kruoja", abbrev: "KRU", prestige: 1.2, startingCash: 55000 },
    { id: 15, name: "Rida", abbrev: "RID", prestige: 1.3, startingCash: 65000 },
    { id: 16, name: "Sūduva", abbrev: "SUD", prestige: 2.0, startingCash: 90000 }
  ]
};