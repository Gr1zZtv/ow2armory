// public/viewerfunctions.js

// grab the compat instances you initialized in viewer.html
const auth = window.auth;
const db   = window.db;

document.addEventListener("DOMContentLoaded", () => {
  // ── CONSTANTS & STORAGE Keys ──────────────────────────────────────────────
  const STORAGE_KEY = 'armoryData';
  const STAT_DEFS = [
    { key: 'life',             label: 'Life',               icon: 'images/stats/stat-life.png' },
    { key: 'weaponPower',      label: 'Weapon Power',       icon: 'images/stats/weaponpowericon.png' },
    { key: 'abilityPower',     label: 'Ability Power',      icon: 'images/stats/stat-ability-power.png' },
    { key: 'attackSpeed',      label: 'Attack Speed',       icon: 'images/stats/stat-attack-speed.png' },
    { key: 'cooldownReduction',label: 'Cooldown Reduction', icon: 'images/stats/stat-cdr.png' },
    { key: 'maxAmmo',          label: 'Max Ammo',           icon: 'images/stats/stat-max-ammo.png' },
    { key: 'weaponLifesteal',  label: 'Weapon Lifesteal',   icon: 'images/stats/stat-weapon-lifesteal.png' },
    { key: 'abilityLifesteal', label: 'Ability Lifesteal',  icon: 'images/stats/stat-ability-lifesteal.png' },
    { key: 'moveSpeed',        label: 'Move Speed',         icon: 'images/stats/stat-move-speed.png' },
    { key: 'reloadSpeed',      label: 'Reload Speed',       icon: 'images/stats/stat-reload-speed.png' },
    { key: 'meleeDamage',      label: 'Melee Damage',       icon: 'images/stats/stat-melee-dmg.png' },
    { key: 'criticalDamage',   label: 'Critical Damage',     icon: 'images/stats/stat-critical-dmg.png' },
  ];

  // ── LOAD & NORMALIZE LOCAL DATA ──────────────────────────────────────────
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  data.heroes          = Array.isArray(data.heroes)          ? data.heroes          : [];
  data.globalAbilities = Array.isArray(data.globalAbilities) ? data.globalAbilities : [];
  data.heroes.forEach(h => {
    h.tabs        = Array.isArray(h.tabs)        ? h.tabs        : ['Weapon','Ability','Survival','Power'];
    h.abilities   = Array.isArray(h.abilities)   ? h.abilities   : [];
    h.stats       = Array.isArray(h.stats)       ? h.stats       : [];
    h.buildPowers = Array.isArray(h.buildPowers) ? h.buildPowers : [];
    h.buildItems  = Array.isArray(h.buildItems)  ? h.buildItems  : [];
    if (!h.stats.find(s => s.key === 'life')) {
      h.stats.push({ key:'life', value:0 });
    }
  });

  let selectedHeroIdx = parseInt(localStorage.getItem('selectedHeroIdx')) || 0;
  let selectedTabIdx  = parseInt(localStorage.getItem('selectedTabIdx'))  || 0;

  const tooltip = document.getElementById('tooltip');

  // ── TOOLTIP HANDLERS ──────────────────────────────────────────────────────
  function showTooltip(a) {
    const statLines = (a.stats||[]).map(s => {
      const def = STAT_DEFS.find(d=>d.key===s.key) || {label:s.key,icon:''};
      return `
        <div class="tooltip-line">
          <img src="${def.icon}" alt="${def.label}">
          <strong>${s.value>0? '+'+s.value : s.value}%</strong>
          <span class="tooltip-label">${def.label}</span>
        </div>`;
    }).join('');
    const ctx = a.tooltip
      ? `<div class="tooltip-context">${a.tooltip}</div>`
      : '';
    tooltip.innerHTML = `
      <div class="tooltip-header">${a.name||''}</div>
      <div class="tooltip-body">${statLines}${ctx}</div>
      <div class="tooltip-footer">
        <img src="assets/diamond-icon.png" alt="Cost">
        <span>${a.cost.toLocaleString()}</span>
        <span class="tooltip-buy">Buy</span>
      </div>`;
    tooltip.style.display = 'block';
  }
  function hideTooltip() { tooltip.style.display = 'none'; }
  function onMouseMove(e) {
    if (tooltip.style.display==='block') {
      tooltip.style.left = (e.pageX + 12) + 'px';
      tooltip.style.top  = (e.pageY + 12) + 'px';
    }
  }

  // ── STAT CALCULATION & RENDER ─────────────────────────────────────────────
  function calculateStats(hero) {
    const out = {};
    STAT_DEFS.forEach(s => out[s.key] = 0);
    (hero.stats||[]).forEach(s => out[s.key] += s.value);
    hero.buildPowers.forEach(a =>
      (a.stats||[]).forEach(s => out[s.key] += s.value)
    );
    hero.buildItems.forEach(a =>
      (a.stats||[]).forEach(s => out[s.key] += s.value)
    );
    return out;
  }
  function renderStats(stats) {
    const cont = document.getElementById('statsContainer');
    cont.innerHTML = '';
    STAT_DEFS.forEach(({key,label,icon}) => {
      if (key==='life') return;
      const pct = Math.min(Math.round(stats[key]), 100);
      const statEl = document.createElement('div');
      statEl.className = 'stat';
      statEl.innerHTML = `
        <img class="icon" src="${icon}" alt="${label}">
        <span class="stat-label">${label}</span>
        <div class="bar" data-percent="${pct}">
          <div class="fill" style="width:${pct}%;"></div>
        </div>`;
      cont.appendChild(statEl);
    });
  }

  // ── TAB RENDERING ─────────────────────────────────────────────────────────
  function renderTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';
    const hero = data.heroes[selectedHeroIdx] || { tabs: [] };
    hero.tabs.forEach((tab,i) => {
      const btn = document.createElement('button');
      btn.textContent = tab;
      if (i === selectedTabIdx) btn.classList.add('active');
      btn.onclick = () => {
        selectedTabIdx = i;
        localStorage.setItem('selectedTabIdx', i);
        renderTabs();
        renderAbilities();
      };
      container.appendChild(btn);
    });
  }

  // ── ABILITY GRID ──────────────────────────────────────────────────────────
  function renderAbilities() {
    const hero = data.heroes[selectedHeroIdx];
    const pool = [...data.globalAbilities, ...(hero.abilities||[])];
    ['common','rare','epic'].forEach(rarity => {
      const grid = document.getElementById(rarity + 'Grid');
      grid.innerHTML = '';
      pool
        .filter(a => a.tabIdx===selectedTabIdx && a.category===rarity)
        .forEach(a => {
          const wrap = document.createElement('div');
          wrap.className = 'ability';
          const card = document.createElement('div');
          card.className = 'card';
          card.__ability = a;
          card.innerHTML = `<img src="${a.icon}" alt="">`;
          card.addEventListener('click',    ()=> purchaseAbility(a));
          card.addEventListener('mouseover',()=> showTooltip(a));
          card.addEventListener('mousemove', onMouseMove);
          card.addEventListener('mouseout',  hideTooltip);
          wrap.appendChild(card);
          const costEl = document.createElement('div');
          costEl.className = 'ability-cost';
          costEl.textContent = a.cost.toLocaleString();
          wrap.appendChild(costEl);
          grid.appendChild(wrap);
        });
    });
  }

  // ── BUILD PANEL ───────────────────────────────────────────────────────────
  function renderBuildSlots() {
    const hero = data.heroes[selectedHeroIdx];
    const total = hero.buildPowers.reduce((s,a)=>s+a.cost,0)
                + hero.buildItems .reduce((s,a)=>s+a.cost,0);
    document.querySelector('.build-cost .cost-value')
      .textContent = total.toLocaleString();

    // power slots
    document.querySelectorAll('.left-panel .slots.powers .circle')
      .forEach((el,i) => {
        const a = hero.buildPowers[i];
        el.innerHTML = a
          ? `<img src="${a.icon}" style="width:100%;height:100%;object-fit:cover">`
          : '';
        el.style.cursor = a?'pointer':'default';
        el.onmouseover = ()=> a && showTooltip(a);
        el.onmousemove = onMouseMove;
        el.onmouseout  = hideTooltip;
        el.onclick     = ()=> {
          if (!a) return;
          hero.buildPowers.splice(i,1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          renderBuildSlots();
          renderStats(calculateStats(hero));
        };
      });

    // item slots
    document.querySelectorAll('.left-panel .slots.items .circle')
      .forEach((el,i) => {
        const a = hero.buildItems[i];
        el.innerHTML = a
          ? `<img src="${a.icon}" style="width:100%;height:100%;object-fit:cover">`
          : '';
        el.style.cursor = a?'pointer':'default';
        el.onmouseover = ()=> a && showTooltip(a);
        el.onmousemove = onMouseMove;
        el.onmouseout  = hideTooltip;
        el.onclick     = ()=> {
          if (!a) return;
          hero.buildItems.splice(i,1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          renderBuildSlots();
          renderStats(calculateStats(hero));
        };
      });
  }

  // ── PURCHASE LOGIC ────────────────────────────────────────────────────────
  function purchaseAbility(a) {
    const hero    = data.heroes[selectedHeroIdx];
    const isPower = hero.tabs[selectedTabIdx] === 'Power';
    if (isPower) {
      if (hero.buildPowers.length >= 4) return alert('Power slots full');
      hero.buildPowers.push(a);
    } else {
      if (hero.buildItems.length >= 6) return alert('Item slots full');
      hero.buildItems.push(a);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderBuildSlots();
    renderStats(calculateStats(hero));
  }

  // ── SAVE & SHARE ──────────────────────────────────────────────────────────
  function bindSaveShare() {
    document.getElementById('btnSaveBuild')
      .addEventListener('click', async () => {
        const hero = data.heroes[selectedHeroIdx];
        const user = auth.currentUser;
        const payload = {
          creator:   user ? (user.displayName || user.email) : 'anonymous',
          uid:       user ? user.uid : null,
          character: hero.name,
          powers:    hero.buildPowers.map(a=>a.name),
          items:     hero.buildItems.map(a=>a.name),
          timestamp: Date.now()
        };
        try {
          const docRef = await db.collection('builds').add(payload);
          const id     = docRef.id;
          const link   = `${window.location.origin}/viewer.html?buildId=${id}`;
          const a      = document.getElementById('buildLink');
          a.href        = link;
          a.textContent = link;
          document.getElementById('shareLink').style.display = 'block';
        } catch(err) {
          console.error('Error saving build:', err);
          alert('Failed to save build. Please try again.');
        }
      });
  }

  // ── LOAD BUILD FROM ?buildId=… ───────────────────────────────────────────
  async function loadBuildFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('buildId')) return;
    const id   = params.get('buildId');
    const snap = await db.collection('builds').doc(id).get();
    if (!snap.exists) return;
    const b    = snap.data();
    selectedHeroIdx = data.heroes.findIndex(h=>h.name===b.character);
    document.getElementById('heroSelect').value = selectedHeroIdx;
    const pool = [...data.globalAbilities, ...data.heroes[selectedHeroIdx].abilities];
    data.heroes[selectedHeroIdx].buildPowers =
      pool.filter(a=> b.powers.includes(a.name));
    data.heroes[selectedHeroIdx].buildItems  =
      pool.filter(a=> b.items.includes(a.name));
    renderTabs();
    renderAbilities();
    renderBuildSlots();
    renderStats(calculateStats(data.heroes[selectedHeroIdx]));
  }

  // ── COMMUNITY GALLERY ─────────────────────────────────────────────────────
  async function renderCommunity() {
    const grid  = document.getElementById('communityGrid');
    const snaps = await db.collection('builds').get();
    const all   = [];
    snaps.forEach(d => all.push({ id: d.id, ...d.data() }));
    grid.innerHTML = all.map(b=>`
      <div class="community-card">
        <strong>${b.character}</strong> by ${b.creator}<br>
        Powers: ${b.powers.join(', ')}<br>
        Items:  ${b.items.join(', ')}<br>
        <a href="/viewer.html?buildId=${b.id}">Load Build</a>
      </div>
    `).join('');
  }

  // ── INITIALIZATION ────────────────────────────────────────────────────────
  function initViewer() {
    const sel = document.getElementById('heroSelect');
    sel.innerHTML = data.heroes
      .map((h,i)=>`<option value="${i}">${h.name}</option>`)
      .join('');
    sel.value = selectedHeroIdx;
    sel.onchange = () => {
      selectedHeroIdx = +sel.value;
      localStorage.setItem('selectedHeroIdx', selectedHeroIdx);
      selectedTabIdx  = 0;
      localStorage.setItem('selectedTabIdx', 0);
      renderTabs();
      renderAbilities();
      renderBuildSlots();
      renderStats(calculateStats(data.heroes[selectedHeroIdx]));
    };

    renderTabs();
    renderAbilities();
    renderBuildSlots();
    renderStats(calculateStats(data.heroes[selectedHeroIdx]));

    bindSaveShare();
    loadBuildFromURL();
    renderCommunity();
  }

  initViewer();
});