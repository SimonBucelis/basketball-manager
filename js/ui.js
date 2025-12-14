// js/ui.js - COMPLETE VERSION
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
    const bg = type==='error'?'#ff4081':(type==='success'?'#00e676':'#333');
    el.style.cssText = `background:${bg}; color:white; padding:12px 16px; border-radius:4px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); opacity:0; transition:0.3s; font-size:12px;`;
    const container = document.getElementById('notify-container') || document.body;
    container.appendChild(el);
    setTimeout(() => el.style.opacity = '1', 10);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!window.league || !window.league.userTeamId) return;
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
        window.league.teams.forEach(t => t.updateBudgets());
        LeagueManager.generateFreeAgents(window.league);
        LeagueManager.generateTransferMarket(window.league); // Ensure this is called
        this.updateAll();
        this.notify("Season Finished! Transfer market updated.", "info");
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
        LeagueManager.generateTransferMarket(window.league);
        window.league.didYouthThisOffseason = false;
        window.league.teams.forEach(t => t.updateBudgets());
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
        try {
          localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(window.league));
          this.notify("Game Saved", "success");
        } catch(e) {
          this.notify("Save failed", "error");
        }
      });
    }

    const btnLoad = document.getElementById('btnLoad');
    if(btnLoad) {
      const newBtn = btnLoad.cloneNode(true);
      btnLoad.parentNode.replaceChild(newBtn, btnLoad);
      newBtn.addEventListener('click', () => {
        try {
          const data = localStorage.getItem(CONFIG.SAVE_KEY);
          if(data) {
            window.league = JSON.parse(data);
            document.getElementById('introPanel').style.display = 'none';
            document.getElementById('dashboardPanel').style.display = 'block';
            this.updateAll();
            this.notify("Game Loaded", "success");
          } else {
            this.notify("No save found", "error");
          }
        } catch(e) {
          this.notify("Load failed", "error");
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
    if(this.currentView === 'transfers') this.renderTransfers();
    if(this.currentView === 'finance') this.renderFinance();
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

    const sorted = [...window.league.teams].sort((a,b) => b.seasonStats.wins - a.seasonStats.wins || b.seasonStats.pointsFor - a.seasonStats.pointsFor);
    let html = `<div class="card"><h3>League Standings</h3><div class="table-responsive"><table class="data-table zebra"><thead><tr><th>#</th><th>Team</th><th>★</th><th>W-L</th><th>PF</th></tr></thead><tbody>`;
    sorted.forEach((t, i) => {
      const isUser = t.id === window.league.userTeamId ? 'class="user-team"' : '';
      html += `<tr ${isUser}><td>${i+1}</td><td>${t.name}</td><td>${t.prestige.toFixed(1)}</td><td>${t.seasonStats.wins}-${t.seasonStats.losses}</td><td>${t.seasonStats.pointsFor}</td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    const container = document.getElementById('dashboardEvents');
    if(container) container.innerHTML = html;
  },

  renderSquad() {
    if(!window.league) return;
    const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
    if(!userTeam) return;
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
      const wage = p.wage || 0;
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.age}</td>
        <td style="color:#ff4081; font-weight:bold;">${p.rating}</td>
        <td class="role-${p.role.substring(0,3).toLowerCase()}">${p.role}</td>
        <td>${p.contractYears} yrs</td>
        <td>${wage.toLocaleString()}</td>
        <td class="${statusClass}"><b>${statusLabel}</b><button class="btn btn-sm btn-outline btn-toggle-status" data-id="${p.id}">⇄</button></td>
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
    const team = window.league.teams.find(t => t.id === window.league.userTeamId);
    const p = team.players.find(pl => pl.id === Number(playerId));
    if (!p) return;
    const wage1yr = p.calculateWage(team.prestige);
    const wage2yr = wage1yr * 2;
    document.getElementById('modalTitle').textContent = "Renew Contract";
    document.getElementById('modalText').innerHTML = `<p><strong>${p.name}</strong></p><p>Choose length:</p><button id="offer1yr" class="btn btn-outline" style="margin:5px;">1yr - ${wage1yr.toLocaleString()}</button><button id="offer2yr" class="btn btn-outline" style="margin:5px;">2yr - ${wage2yr.toLocaleString()}</button>`;
    document.getElementById('modalConfirm').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('offer1yr').onclick = () => {
      const res = LeagueManager.extendContract(window.league, Number(playerId), 1);
      if(res.success && res.extended) {
        this.notify(`Contract +1yr! Cost: ${res.cost.toLocaleString()}`, "success");
      } else {
        this.notify("Player declined.", "error");
      }
      this.updateAll();
      document.getElementById('modalOverlay').style.display = 'none';
    };
    document.getElementById('offer2yr').onclick = () => {
      const res = LeagueManager.extendContract(window.league, Number(playerId), 2);
      if(res.success && res.extended) {
        this.notify(`Contract +2yr! Cost: ${res.cost.toLocaleString()}`, "success");
      } else {
        this.notify("Player declined.", "error");
      }
      this.updateAll();
      document.getElementById('modalOverlay').style.display = 'none';
    };
  },

  confirmRelease(playerId) {
    const team = window.league.teams.find(t => t.id === window.league.userTeamId);
    const p = team.players.find(pl => pl.id === Number(playerId));
    if (!p) return;
    let cost = 0;
    if (p.acquisitionType === 'transfer' || p.acquisitionType === 'renewed') {
      cost = p.contractYears * p.wage;
    }
    const costText = cost > 0 ? `Cost: ${cost.toLocaleString()}` : 'No cost';
    document.getElementById('modalTitle').textContent = "Release Player";
    document.getElementById('modalText').innerHTML = `<p><strong>${p.name}</strong></p><p>${costText}</p><p>Confirm?</p>`;
    document.getElementById('modalConfirm').style.display = 'inline-block';
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('modalConfirm').onclick = () => {
      const res = LeagueManager.releasePlayer(window.league, window.league.userTeamId, Number(playerId));
      if(res.success) {
        this.notify("Player Released", "success");
      } else {
        this.notify(res.reason, "error");
      }
      this.updateAll();
      document.getElementById('modalOverlay').style.display = 'none';
    };
  },

  renderPlayoffs() {
    console.log('renderPlayoffs CALLED', window.league.playoffLog);
    const container = document.getElementById('playoffBracket');
    const log = window.league && window.league.playoffLog;

    if (!container || !log || !log.rounds || log.rounds.length === 0) {
      if (container) container.textContent = 'Playoffs data not available yet.';
      return;
    }

    let html = '';
    log.rounds.forEach(round => {
      html += `<h3>${round.name}</h3>
        <table class="data-table zebra">
          <tr><th>Home</th><th>Away</th><th>Score</th><th>Winner</th></tr>`;
      round.games.forEach(g => {
        html += `<tr>
            <td>${g.home}</td>
            <td>${g.away}</td>
            <td>${g.scoreHome} - ${g.scoreAway}</td>
            <td>${g.winner}</td>
          </tr>`;
      });
      html += `</table>`;
    });
    html += `<p>Champion: <b>${log.champion}</b></p>`;
    container.innerHTML = html;
  },

  renderRecruitment() {
    const container = document.getElementById('marketContainer');
    if(!container) return;
    container.innerHTML = '';
    
    if(window.league.phase !== CONFIG.PHASES.OFFSEASON) {
      container.innerHTML = '<p style="color:#888;">Free agent market opens in offseason.</p>';
      return;
    }
    
    const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
    
    // Youth Intake Section
    const youthSection = document.createElement('div');
    youthSection.style.cssText = 'margin-bottom:30px; padding:20px; background:rgba(0,230,118,0.1); border:1px solid #00e676; border-radius:8px;';
    const canClaimYouth = !window.league.didYouthThisOffseason && userTeam.players.length + CONFIG.YOUTH_COUNT <= CONFIG.ROSTER_SIZE;
    youthSection.innerHTML = `
        <h3 style="color:#00e676; margin:0 0 10px 0;">🌟 Youth Intake</h3>
        <p style="color:#a0a0a0; font-size:0.9rem;">Sign 3 young players (ages 18-22) with 2-year contracts.</p>
        ${canClaimYouth ? 
            `<button class="btn btn-success" id="btnClaimYouthMarket">Claim Now</button>` : 
            `<p style="color:#888;">${window.league.didYouthThisOffseason ? 'Already claimed youth this offseason.' : 'Not enough roster space.'}</p>`
        }
    `;
    container.appendChild(youthSection);
    
    const btnYouthMarket = document.getElementById('btnClaimYouthMarket');
    if(btnYouthMarket) {
        btnYouthMarket.addEventListener('click', () => {
            const youth = LeagueManager.doYouthIntake(window.league, window.league.userTeamId);
            userTeam.players.push(...youth);
            this.notify(`${CONFIG.YOUTH_COUNT} Youth Players Signed!`, "success");
            this.updateAll();
        });
    }
    
    // Free Agents Section
    const faSection = document.createElement('div');
    faSection.style.cssText = 'margin-top:30px;';
    faSection.innerHTML = '<h3 style="margin:0 0 20px 0;">📋 Free Agents</h3>';
    container.appendChild(faSection);
    
    const agents = window.league.freeAgents || [];
    if (agents.length === 0) {
        faSection.innerHTML += '<p style="color:#888;">No free agents available.</p>';
        return;
    }
    
    // Create filter controls
    const filterDiv = document.createElement('div');
    filterDiv.style.cssText = 'margin-bottom:20px; display:flex; gap:10px; flex-wrap:wrap;';
    filterDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:5px;">
            <span style="font-size:0.9rem; color:#a0a0a0;">Filter by Role:</span>
            <select id="roleFilter" style="background:#333; color:white; border:1px solid #555; border-radius:4px; padding:5px 10px;">
                <option value="all">All Roles</option>
                <option value="Defender">Defender</option>
                <option value="Sharpshooter">Sharpshooter</option>
                <option value="Playmaker">Playmaker</option>
            </select>
        </div>
        <div style="display:flex; align-items:center; gap:5px;">
            <span style="font-size:0.9rem; color:#a0a0a0;">Sort by:</span>
            <select id="sortFilter" style="background:#333; color:white; border:1px solid #555; border-radius:4px; padding:5px 10px;">
                <option value="potential">Potential (High to Low)</option>
                <option value="age">Age (Young to Old)</option>
                <option value="name">Name (A-Z)</option>
            </select>
        </div>
    `;
    faSection.appendChild(filterDiv);
    
    // Create card grid
    const faGrid = document.createElement('div');
    faGrid.className = 'card-grid';
    faGrid.id = 'freeAgentGrid';
    faSection.appendChild(faGrid);
    
    // Function to render filtered agents
    const renderFilteredAgents = () => {
        const roleFilter = document.getElementById('roleFilter').value;
        const sortFilter = document.getElementById('sortFilter').value;
        
        let filteredAgents = [...agents];
        
        // Apply role filter
        if (roleFilter !== 'all') {
            filteredAgents = filteredAgents.filter(p => p.role === roleFilter);
        }
        
        // Apply sorting
        switch(sortFilter) {
            case 'potential':
                filteredAgents.sort((a, b) => b.potentialStars - a.potentialStars);
                break;
            case 'age':
                filteredAgents.sort((a, b) => a.age - b.age);
                break;
            case 'name':
                filteredAgents.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        
        // Clear and render
        faGrid.innerHTML = '';
        
        if (filteredAgents.length === 0) {
            faGrid.innerHTML = '<p style="color:#888; grid-column:1/-1; text-align:center;">No free agents match your filter.</p>';
            return;
        }
        
        filteredAgents.forEach(p => {
            const wage = p.calculateWage(userTeam.prestige);
            const card = document.createElement('div');
            card.className = 'player-card';
            
            // Determine age color based on age range
            let ageColor = '#4fc3f7'; // Young blue
            if (p.age > 28) ageColor = '#ffb74d'; // Prime orange
            if (p.age > 32) ageColor = '#ba68c8'; // Veteran purple
            
            // Determine star color based on potential
            let starColor = '#888'; // 1-2 stars
            if (p.potentialStars >= 3) starColor = '#ffd700'; // 3+ stars gold
            if (p.potentialStars >= 4) starColor = '#ff4081'; // 4-5 stars pink
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h4 style="margin:0;">${p.name}</h4>
                    <span style="background:${p.role === 'Defender' ? '#4fc3f7' : p.role === 'Sharpshooter' ? '#ffb74d' : '#ba68c8'}; 
                        color:white; font-size:0.75rem; padding:2px 6px; border-radius:3px;">
                        ${p.role.charAt(0)}
                    </span>
                </div>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                    <div style="text-align:center;">
                        <div style="font-size:0.8rem; color:#a0a0a0;">Age</div>
                        <div style="font-size:1.5rem; font-weight:bold; color:${ageColor};">${p.age}</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:0.8rem; color:#a0a0a0;">Potential</div>
                        <div style="font-size:1.5rem; font-weight:bold; color:${starColor};">${'★'.repeat(p.potentialStars)}</div>
                    </div>
                </div>
                
                <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                        <span style="color:#a0a0a0;">Contract:</span>
                        <span style="color:#fff;">1 year</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-top:5px;">
                        <span style="color:#a0a0a0;">Wage/year:</span>
                        <span style="color:#ffd700;">$${wage.toLocaleString()}</span>
                    </div>
                </div>
                
                <button class="btn btn-sm btn-outline btn-sign full-width" 
                        data-id="${p.id}" 
                        style="margin-top:10px;"
                        ${userTeam.players.length >= CONFIG.ROSTER_SIZE ? 'disabled' : ''}>
                    ${userTeam.players.length >= CONFIG.ROSTER_SIZE ? 'Roster Full' : 'Sign Player (1yr)'}
                </button>
            `;
            faGrid.appendChild(card);
        });
        
        // Add event listeners for sign buttons
        faGrid.querySelectorAll('.btn-sign').forEach(b => {
            b.addEventListener('click', (e) => {
                if(userTeam.players.length >= CONFIG.ROSTER_SIZE) {
                    this.notify(`Roster full (${CONFIG.ROSTER_SIZE} limit). Release players first.`, "error");
                    return;
                }
                
                const res = LeagueManager.signFreeAgentToBestTeam(window.league, Number(e.target.dataset.id), window.league.userTeamId);
                if(res.success) {
                    this.notify(`Signed ${res.player.name}!`, "success");
                    this.updateAll();
                } else {
                    this.notify(res.reason, "error");
                }
            });
        });
    };
    
    // Initial render
    renderFilteredAgents();
    
    // Add event listeners to filters
    document.getElementById('roleFilter').addEventListener('change', renderFilteredAgents);
    document.getElementById('sortFilter').addEventListener('change', renderFilteredAgents);
    
    // Add roster status info
    const rosterStatus = document.createElement('div');
    rosterStatus.style.cssText = 'margin-top:20px; padding:10px; background:rgba(255,64,129,0.1); border-radius:4px;';
    rosterStatus.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
            <span style="color:#a0a0a0;">Your Roster:</span>
            <span style="color:${userTeam.players.length >= CONFIG.ROSTER_SIZE ? '#ff4081' : '#00e676'}">
                ${userTeam.players.length}/${CONFIG.ROSTER_SIZE} players
                ${userTeam.players.length >= CONFIG.ROSTER_SIZE ? ' (FULL)' : ''}
            </span>
        </div>
        <div style="font-size:0.8rem; color:#a0a0a0; margin-top:5px;">
            Free agents accept 1-year contracts with competitive bidding for high-potential players.
        </div>
    `;
    faSection.appendChild(rosterStatus);
  },

  renderTransfers() {
    const container = document.getElementById('transferContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Check if we're in offseason
    if (window.league.phase !== CONFIG.PHASES.OFFSEASON) {
      container.innerHTML = '<p style="color:#888;">Transfer market opens in offseason.</p>';
      return;
    }
    
    if (!window.league || !window.league.transferMarket || window.league.transferMarket.length === 0) {
      container.innerHTML = '<p>No players on the transfer market.</p>';
      return;
    }

    const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
    
    window.league.transferMarket.forEach(item => {
      const p = item.player;
      const wage = p.calculateWage(userTeam.prestige);
      
      const card = document.createElement('div');
      card.className = 'player-card';
      
      card.innerHTML = `
        <div>
          <h4>${p.name}</h4>
          <div style="font-size:0.9rem; color:#ccc; margin-top:5px;">
            Age: <b>${p.age}</b> | Rating: <b style="color:#00e676;">${p.rating}</b> | Pot: <b style="color:#ff4081;">${'★'.repeat(p.potentialStars)}</b>
          </div>
          <div style="font-size:0.85rem; color:#888;">${p.role}</div>
          <div style="font-size:0.85rem; color:#aaa; margin-top:5px;">
            Transfer Fee: <span style="color:#fff;">$${item.price.toLocaleString()}</span>
          </div>
          <div style="color:#ffd700; margin-top:5px;">Req. Wage: $${wage.toLocaleString()}/yr</div>
        </div>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="btn btn-sm btn-primary btn-transfer" data-id="${p.id}" data-years="1">Buy 1yr (90%)</button>
          <button class="btn btn-sm btn-primary btn-transfer" data-id="${p.id}" data-years="2">Buy 2yr (75%)</button>
        </div>
      `;
      container.appendChild(card);
    });

    // Add event listeners for transfer buttons
    container.querySelectorAll('.btn-transfer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playerId = e.target.dataset.id;
        const years = parseInt(e.target.dataset.years);
        this.buyTransfer(playerId, years);
      });
    });
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

  renderFinance() {
    const userTeam = window.league.teams.find(t => t.id === window.league.userTeamId);
    if (!userTeam) return;
    const overview = document.getElementById('financeOverview');
    const history = document.getElementById('financeHistory');
    if(!overview || !history) return;

    const profit = userTeam.getProfit();
    const profitClass = profit >= 0 ? 'finance-positive' : 'finance-negative';
    const cashClass = userTeam.cash < 0 ? 'finance-negative' : '';
    const transferClass = userTeam.transferBudget < 0 ? 'finance-negative' : '';

    overview.innerHTML = `
      <div class="finance-grid">
        <div class="finance-stat">
          <label>Cash Balance</label>
          <div class="value ${cashClass}">${userTeam.cash.toLocaleString()}</div>
        </div>
        <div class="finance-stat">
          <label>Wage Budget</label>
          <div class="value finance-warning">${userTeam.wageBudget.toLocaleString()}</div>
        </div>
        <div class="finance-stat">
          <label>Transfer Budget</label>
          <div class="value ${transferClass}">${userTeam.transferBudget.toLocaleString()}</div>
        </div>
        <div class="finance-stat">
          <label>Profit/Loss</label>
          <div class="value ${profitClass}">${profit >= 0 ? '+' : ''}${profit.toLocaleString()}</div>
        </div>
      </div>`;

    let historyHtml = '<table class="data-table"><thead><tr><th>Year</th><th>Cash</th><th>Profit</th></tr></thead><tbody>';
    (userTeam.financeHistory || []).forEach(record => {
      const pClass = record.profit >= 0 ? 'finance-positive' : 'finance-negative';
      historyHtml += `<tr><td>${record.year}</td><td>${record.cash.toLocaleString()}</td><td class="${pClass}">${record.profit >= 0 ? '+' : ''}${record.profit.toLocaleString()}</td></tr>`;
    });
    historyHtml += '</tbody></table>';
    history.innerHTML = historyHtml;
  }
};