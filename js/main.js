// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  console.log("Game Initializing...");
  
  // Initialize UI first
  // This automatically calls populateTeamSelect, bindNav, bindActions
  if (typeof UI !== 'undefined' && UI.init) {
      UI.init();
  } else {
      console.error("UI module failed to load.");
  }

  // Check for auto-load or other startup logic here if needed
});