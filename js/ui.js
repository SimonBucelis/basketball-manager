// js/ui.js
const UI = {
  currentView: 'dashboard',

  init() {
    console.log("UI Init");
    this.createNotificationContainer();
    this.populateTeamSelect();
    this.bindActions();
    this.bindNav();
  },

  populateTeamSelect() {
    const select = document.getElementById('teamPickSelect');
    if (!select || typeof CONFIG === 'undefined') return;
    
    select.innerHTML = '';
    CONFIG.TEAMS.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.name} (${t.prestige}★)`;
      select.appendChild(opt);
    });
  },

  createNotificationContainer() {
      if(document.getElementById('notify-container')) return;
      const div = document.createElement('div');
      div.id = 'notify-container';
      div.style.cssText = "position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;";
      document.body.appendChild(div);
  },

  notify(msg, type='info') {
      const el = document.createElement('div');
      el.textContent = msg;
      const bg = type==='error'?'#ff4081':(type==='success'?'#00e676':'#1e1e1e');
      el.style.cssText = `background:${bg}; color:white; padding:15px 25px; border-radius:5px; opacity:0; transition:0.3s;`;
      const container = document.getElementById('notify-container') || document.body;
      container.appendChild(el);
      setTimeout(() => el.style.opacity = '1', 10);
      setTimeout(() => el.remove(), 3000);
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!window.league || !window.league.userTeamId) {
            console.log("Game not started yet");
            return;
        }
        const view = e.target.getAttribute('data-view');
        this.switchView(view);
      });
    });
  },

  bindActions() {
    const btnStart = document.getElementById('btnStartGame');
    if(btnStart) {
        const newBtn = btnStart.cloneNode(true);
        btnStart.parentNode.replaceChild(newBtn, btnStart);
        newBtn.addEventListener('click', () => {
            const select = document.getElementById('teamPickSelect');
            const teamId = Number(select.value);
            console.log("Starting with team:", teamId);
            
            window.league = LeagueManager.initLeague(CONFIG.ROSTER_SIZE);
            window.league.userTeamId = teamId;
            window.league.phase = CONFIG.PHASES.REGULAR;
            
            document.getElementById('introPanel').style.display = 'none';
            document.getElementById('dashboardPanel').style.display = 'block';
            
            this.switchView('dashboard');
            this.notify("Career Started!", "success");
        });
    }

    const btnSim = document.getElementById('btnSimSeason');
    if(btnSim) {
         const newBtn = btnSim.cloneNode(true);
         btnSim.parentNode.replaceChild(newBtn, btnSim);
         newBtn.addEventListener('click', () => {
            if(!window.league || window.league.phase !== CONFIG.PHASES.REGULAR) return;
            LeagueManager.simulateSeason(window.league);
            window.league.phase = CONFIG.PHASES.OFFSEASON;
            LeagueManager.generateFreeAgents(window.league);
            this.updateAll();
            this.notify("Season Finished!", "info");
        });
    }

    const btnNext = document.getElementById('btnStartNextSeason');
    if(btnNext) {
        const newBtn = btnNext.cloneNode(true);
        btnNext.parentNode.replaceChild(newBtn, btnNext);
        newBtn.addEventListener('click', () => {
            if(!window.league) return;
            const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
            if (userTeam.players.length > CONFIG.ROSTER_SIZE) {
                this.notify("Roster too large - release players first", "error");
                return;
            }
            if (userTeam.players.length < CONFIG.MIN_ROSTER_SIZE) {
                this.notify(`Need at least ${CONFIG.MIN_ROSTER_SIZE} players`, "error");
                return;
            }
            
            PlayerManager.progressPlayers(window.league);
            PlayerManager.expireContracts(window.league);
            LeagueManager.autoFillAITeams(window.league);
            LeagueManager.refreshFreeAgentPool(window.league);
            window.league.didYouthThisOffseason = false;
            window.league.phase = CONFIG.PHASES.REGULAR;
            this.updateAll();
            this.notify("New Season Started!", "success");
        });
    }

    const btnSave = document.getElementById('btnSave');
    if(btnSave) {
        const newBtn = btnSave.cloneNode(true);
        btnSave.parentNode.replaceChild(newBtn, btnSave);
        newBtn.addEventListener('click', () => {
            if(!window.league) return;
            Utils.saveToLocalStorage(CONFIG.SAVE_KEY, window.league);
            this.notify("Game Saved", "success");
        });
    }

    const btnLoad = document.getElementById('btnLoad');
    if(btnLoad) {
        const newBtn = btnLoad.cloneNode(true);
        btnLoad.parentNode.replaceChild(newBtn, btnLoad);
        newBtn.addEventListener('click', () => {
            const data = Utils.loadFromLocalStorage(CONFIG.SAVE_KEY);
            if(data) {
                window.league = data;
                document.getElementById('introPanel').style.display = 'none';
                document.getElementById('dashboardPanel').style.display = 'block';
                this.updateAll();
                this.notify("Game Loaded", "success");
            } else {
                this.notify("No save found", "error");
            }
        });
    }
    
    const btnCancel = document.getElementById('modalCancel');
    if(btnCancel) {
        const newBtn = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtn, btnCancel);
        newBtn.addEventListener('click', () => {
             document.getElementById('modalOverlay').style.display = 'none';
        });
    }

    const btnYouth = document.getElementById('btnClaimYouth');
    if(btnYouth) {
        const newBtn = btnYouth.cloneNode(true);
        btnYouth.parentNode.replaceChild(newBtn, btnYouth);
        newBtn.addEventListener('click', () => {
            if(!window.league) return;
            const team = window.league.teams.find(t => t.id === window.league.userTeamId);
            if (!team) return;
            
            if(window.league.phase !== CONFIG.PHASES.OFFSEASON) {
                this.notify("Only available in offseason.", "error");
                return;
            }
            
            if(window.league.didYouthThisOffseason) {
                this.notify("Already claimed youth this offseason.", "error");
                return;
            }
            if(team.players.length + CONFIG.YOUTH_COUNT > CONFIG.ROSTER_SIZE) {
                this.notify("Not enough roster space.", "error");
                return;
            }
            
            document.getElementById('modalTitle').textContent = "Youth Intake";
            document.getElementById('modalText').textContent = `Sign ${CONFIG.YOUTH_COUNT} youth players (${CONFIG.YOUTH_CONTRACT_YEARS}yr contracts)?`;
            document.getElementById('modalConfirm').style.display = 'inline-block';
            document.getElementById('modalOverlay').style.display = 'flex';
            
            document.getElementById('modalConfirm').onclick = () => {
               const youth = LeagueManager.doYouthIntake(window.league, window.league.userTeamId);
               team.players.push(...youth);
               this.updateAll();
               this.notify(`${CONFIG.YOUTH_COUNT} Youth Players Signed!`, "success");
               document.getElementById('modalOverlay').style.display = 'none';
            };
        });
    }
  },

  switchView(viewName) {
    if(!window.league || !window.league.userTeamId) return;
    
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navBtn = document.querySelector(`[data-view="${viewName}"]`);
    if(navBtn) navBtn.classList.add('active');
    
    this.currentView = viewName;
    this.updateAll();
  },

  updateAll() {
    if(!window.league || !window.league.userTeamId) return;
    
    this.renderSidebar();
    if(this.currentView === 'dashboard') this.renderDashboard();
    if(this.currentView === 'squad') this.renderSquad();
    if(this.currentView === 'playoffs') this.renderPlayoffs();
    if(this.currentView === 'recruitment') this.renderRecruitment();
  },

  renderSidebar() {
    if(!window.league) return;
    const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
    if(!userTeam) return;

    const n = document.getElementById('sidebarTeamName');
    const p = document.getElementById('sidebarPrestige');
    const r = document.getElementById('sidebarRoster');
    const ph = document.getElementById('sidebarPhase');
    
    if(n) n.textContent = userTeam.name;
    if(p) p.textContent = `★ ${userTeam.prestige.toFixed(2)}`;
    if(r) r.textContent = `👥 ${userTeam.players.length}/${CONFIG.ROSTER_SIZE}`;
    if(ph) ph.textContent = window.league.phase === CONFIG.PHASES.REGULAR ? "Regular" : "Offseason";
  },

  renderDashboard() {
    const el = document.getElementById('dashSeason');
    if(el) el.textContent = `Year ${window.league.year}`;
    
    const isOff = window.league.phase === CONFIG.PHASES.OFFSEASON;
    const btnSim = document.getElementById('btnSimSeason');
    const btnNext = document.getElementById('btnStartNextSeason');
    if(btnSim) btnSim.disabled = isOff;
    if(btnNext) btnNext.disabled = !isOff;

    const sorted = [...window.league.teams].sort((a,b) => 
      b.seasonStats.wins - a.seasonStats.wins || b.seasonStats.pointsFor - a.seasonStats.pointsFor
    );
    
    let html = `<div class="card"><h3>League Standings</h3><div class="table-responsive">
      <table class="data-table zebra">
      <thead><tr><th>#</th><th>Team</th><th>★</th><th>W-L</th><th>PF</th></tr></thead><tbody>`;
    
    sorted.forEach((t, i) => {
        const isUser = t.id === window.league.userTeamId ? 'class="user-team"' : '';
        html += `<tr ${isUser}>
            <td>${i+1}</td>
            <td>${t.name}</td>
            <td>${t.prestige.toFixed(1)}</td>
            <td>${t.seasonStats.wins}-${t.seasonStats.losses}</td>
            <td>${t.seasonStats.pointsFor}</td>
        </tr>`;
    });
    html += `</tbody></table></div></div>`;
    
    const container = document.getElementById('dashboardEvents');
    if(container) container.innerHTML = html;
  },

  renderSquad() {
    if(!window.league) return;
    const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
    if(!userTeam) {
        console.error("User team not found!");
        return;
    }

    const tbody = document.getElementById('squadTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    const isOffseason = window.league.phase === CONFIG.PHASES.OFFSEASON;

    userTeam.players.sort((a,b) => {
        if(a.status === 'starter' && b.status !== 'starter') return -1;
        if(a.status !== 'starter' && b.status === 'starter') return 1;
        return b.rating - a.rating;
    });

    userTeam.players.forEach(p => {
        const tr = document.createElement('tr');
        const canExtend = isOffseason && !p.extendAttempted;
        const canRelease = isOffseason;
        
        const statusLabel = p.status === 'starter' ? 'STARTER' : 'BENCH';
        const statusClass = p.status === 'starter' ? 'starter' : '';
        
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.age}</td>
            <td style="color:#ff4081; font-weight:bold;">${p.rating}</td>
            <td class="role-${p.role.substring(0,3).toLowerCase()}">${p.role}</td>
            <td>${p.contractYears} yrs</td>
            <td class="${statusClass}">
                <b>${statusLabel}</b>
                <button class="btn btn-sm btn-outline btn-toggle-status" data-id="${p.id}">⇄</button>
            </td>
            <td class="actions">
                ${canExtend ? `<button class="btn btn-sm btn-success btn-extend" data-id="${p.id}">Renew</button>` : '<span class="disabled-text">Locked</span>'}
                ${canRelease ? `<button class="btn btn-sm btn-danger btn-release" data-id="${p.id}">Cut</button>` : ''}
            </td>`;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-extend').forEach(b => {
        b.addEventListener('click', (e) => this.confirmExtend(e.target.dataset.id));
    });
    tbody.querySelectorAll('.btn-release').forEach(b => {
        b.addEventListener('click', (e) => this.confirmRelease(e.target.dataset.id));
    });
    tbody.querySelectorAll('.btn-toggle-status').forEach(b => {
        b.addEventListener('click', (e) => this.togglePlayerStatus(e.target.dataset.id));
    });
  },

  togglePlayerStatus(playerId) {
      const id = Number(playerId);
      const team = window.league.teams.find(t => t.id === window.league.userTeamId);
      const p = team.players.find(pl => pl.id === id);
      
      if(p.status === 'starter') {
          p.status = 'reserve';
      } else {
          const starters = team.players.filter(pl => pl.status === 'starter').length;
          if (starters >= 5) {
              this.notify("You already have 5 starters.", "error");
              return;
          }
          p.status = 'starter';
      }
      this.renderSquad();
  },

  confirmExtend(playerId) {
    document.getElementById('modalTitle').textContent = "Renew Contract";
    document.getElementById('modalText').innerHTML = `
      <p style="margin-bottom:15px;">Choose contract length:</p>
      <button id="offer1yr" class="btn btn-outline" style="margin:5px;">1 Year (60% accept)</button>
      <button id="offer2yr" class="btn btn-outline" style="margin:5px;">2 Years (35% accept)</button>
    `;
    document.getElementById('modalConfirm').style.display = 'none';
    document.getElementById('modalCancel').textContent = 'Cancel';
    document.getElementById('modalOverlay').style.display = 'flex';
    
    document.getElementById('offer1yr').onclick = () => {
        const res = LeagueManager.extendContract(window.league, Number(playerId), 1);
        if(res.success) {
            if(res.extended) {
                this.notify(`Contract Extended +1 year!`, "success");
            } else {
                this.notify("Player declined the offer.", "error");
            }
            this.updateAll();
        }
        document.getElementById('modalOverlay').style.display = 'none';
    };
    
    document.getElementById('offer2yr').onclick = () => {
        const res = LeagueManager.extendContract(window.league, Number(playerId), 2);
        if(res.success) {
            if(res.extended) {
                this.notify(`Contract Extended +2 years!`, "success");
            } else {
                this.notify("Player declined the offer.", "error");
            }
            this.updateAll();
        }
        document.getElementById('modalOverlay').style.display = 'none';
    };
  },

  confirmRelease(playerId) {
    document.getElementById('modalTitle').textContent = "Release Player";
    document.getElementById('modalText').textContent = "Are you sure you want to cut this player?";
    document.getElementById('modalConfirm').style.display = 'inline-block';
    document.getElementById('modalOverlay').style.display = 'flex';
    
    document.getElementById('modalConfirm').onclick = () => {
        const res = LeagueManager.releasePlayer(window.league, window.league.userTeamId, Number(playerId));
        if(res.success) {
            this.notify("Player Released", "success");
            this.updateAll();
        }
        document.getElementById('modalOverlay').style.display = 'none';
    };
  },

  renderRecruitment() {
    const container = document.getElementById('marketContainer');
    container.innerHTML = '';
    
    if(window.league.phase !== CONFIG.PHASES.OFFSEASON) {
        container.innerHTML = '<p style="color:#888;">Free agent market opens in the offseason.</p>';
        return;
    }

    const agents = window.league.freeAgents;
    if (agents.length === 0) {
        container.innerHTML = '<p style="color:#888;">No free agents currently available. The market will refresh next offseason.</p>';
        return;
    }

    agents.forEach(p => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
           <h4>${p.name}</h4>
           <div>Age: ${p.age}</div>
           <div class="stars">${"★".repeat(p.potentialStars)}</div>
           <div style="font-size:0.85rem; color:#888; margin-top:5px;">${p.role}</div>
           <button class="btn btn-sm btn-outline btn-sign" data-id="${p.id}" style="margin-top:10px;">Sign</button>`;
        container.appendChild(card);
    });

    document.querySelectorAll('.btn-sign').forEach(b => {
        b.addEventListener('click', (e) => {
           const res = LeagueManager.signFreeAgentToBestTeam(window.league, Number(e.target.dataset.id), window.league.userTeamId);
           if(res.success) {
               this.notify("Player Signed!", "success");
           } else {
               this.notify(res.reason, "error");
           }
           this.updateAll(); // Refresh to remove player from display
        });
    });
  },

  renderPlayoffs() {
      const container = document.getElementById('bracketContainer');
      if(!container) return;
      
      const log = window.league.playoffLog;
      if(!log || !log.rounds || log.rounds.length === 0) {
          container.innerHTML = '<div>Playoffs have not started.</div>';
          return;
      }
      
      let html = '';
      log.rounds.forEach(round => {
         html += `<div class="round-column"><h4>${round.name}</h4>`;
         round.games.forEach(g => {
             const wHome = g.winner === g.home ? 'matchup-winner' : '';
             const wAway = g.winner === g.away ? 'matchup-winner' : '';
             html += `<div class="matchup-box">
                <div class="${wHome}">${g.home} <span>${g.scoreHome}</span></div>
                <div class="vs-divider">vs</div>
                <div class="${wAway}">${g.away} <span>${g.scoreAway}</span></div>
             </div>`;
         });
         html += `</div>`;
      });
      container.innerHTML = html;
  }
};
