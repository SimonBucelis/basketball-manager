// js/config.js
const CONFIG = {
  ROSTER_SIZE: 12,
  MIN_ROSTER_SIZE: 8,
  MAX_STARTERS: 5,
  YOUTH_COUNT: 3,
  YOUTH_CONTRACT_YEARS: 2,
  FREE_AGENT_POOL_SIZE: 24,
  FREE_AGENT_DISPLAY: 8,
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

  // Teams Data
  TEAMS: [
    { id: 0, name: "Žalgiris", abbrev: "ZAL", prestige: 4.6 },
    { id: 1, name: "Rytas", abbrev: "RYT", prestige: 4.1 },
    { id: 2, name: "Lietkabelis", abbrev: "LIE", prestige: 4.0 },
    { id: 3, name: "CBet", abbrev: "CBT", prestige: 2.5 },
    { id: 4, name: "Mažeikiai", abbrev: "MAZ", prestige: 2.0 },
    { id: 5, name: "Šiauliai", abbrev: "SIA", prestige: 3.5 },
    { id: 6, name: "Nevėžis", abbrev: "NEV", prestige: 2.8 },
    { id: 7, name: "Neptūnas", abbrev: "NEP", prestige: 3.7 },
    { id: 8, name: "Prienai", abbrev: "PRI", prestige: 1.7 },
    { id: 9, name: "BC Wolves", abbrev: "WOL", prestige: 4.0 },
    { id: 10, name: "Juventus", abbrev: "JUV", prestige: 3.3 },
    { id: 11, name: "Gargždai", abbrev: "GAR", prestige: 2.8 },
    { id: 12, name: "Pieno Žvaigždės", abbrev: "PZV", prestige: 2.5 },
    { id: 13, name: "Kruoja", abbrev: "KRU", prestige: 1.2 },
    { id: 14, name: "Rida", abbrev: "RID", prestige: 1.3 },
    { id: 15, name: "Sūduva", abbrev: "SUD", prestige: 2.0 }
  ]
};
