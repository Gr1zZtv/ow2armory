// public/viewerfunctions.js

document.addEventListener("DOMContentLoaded", () => {
  // ── FIREBASE INSTANCES ────────────────────────────────────────────────────
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // ── CONSTANTS & STORAGE KEYS ─────────────────────────────────────────────
  const STORAGE_KEY = 'armoryData';
  const ROUND_KEY   = 'selectedRound';
  const MAX_ROUNDS  = 7;
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

  // Ensure each hero has per‐round build storage
  data.heroes.forEach(h => {
    if (!Array.isArray(h.roundBuilds) || h.roundBuilds.length !== MAX_ROUNDS) {
      h.roundBuilds = Array.from({ length: MAX_ROUNDS }, () => ({
        powers: [],
        items: []
      }));
    }
    h.tabs      = Array.isArray(h.tabs)      ? h.tabs      : ['Weapon','Ability','Survival','Power'];
    h.abilities = Array.isArray(h.abilities) ? h.abilities : [];
    h.stats     = Array.isArray(h.stats)     ? h.stats     : [];
    if (!h.stats.find(s => s.key === 'life')) {
      h.stats.push({ key:'life', value:0 });
    }
  });

  // ── STATE: selected hero, tab & round ─────────────────────────────────────
  let selectedHeroIdx = parseInt(localStorage.getItem('selectedHeroIdx')) || 0;
  let selectedTabIdx  = parseInt(localStorage.getItem('selectedTabIdx'))  || 0;
  let currentRound    = parseInt(localStorage.getItem(ROUND_KEY))       || 1;
  const tooltip       = document.getElementById('tooltip');

  // ── TOOLTIP HANDLERS ──────────────────────────────────────────────────────
  function showTooltip(a) {
    const statLines = (a.stats||[]).map(s => {
      const def = STAT_DEFS.find(d => d.key === s.key) || {label:s.key,icon:''};
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
    if (tooltip.style.display === 'block') {
      tooltip.style.left = (e.pageX + 12) + 'px';
      tooltip.style.top  = (e.pageY + 12) + 'px';
    }
  }

  // ── ROUND TABS ────────────────────────────────────────────────────────────
  function renderRoundTabs() {
    const tabs = document.getElementById('roundTabs');
    tabs.innerHTML = '';
    for (let i = 1; i <= MAX_ROUNDS; i++) {
      const btn = document.createElement('button');
      btn.textContent = `R${i}`;
      if (i === currentRound) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentRound = i;
        localStorage.setItem(ROUND_KEY, i);
        renderRoundTabs();
        renderBuildSlots();
        renderStats(calculateStats(data.heroes[selectedHeroIdx]));
      });
      tabs.appendChild(btn);
    }
  }

  // ── STAT CALCULATION & RENDER ─────────────────────────────────────────────
  function calculateStats(hero) {
    const out = {};
    STAT_DEFS.forEach(s => out[s.key] = 0);
    (hero.stats||[]).forEach(s => out[s.key] += s.value);
    const roundData = hero.roundBuilds[currentRound - 1];
    roundData.powers.forEach(a =>
      (a.stats||[]).forEach(s => out[s.key] += s.value)
    );
    roundData.items.forEach(a =>
      (a.stats||[]).forEach(s => out[s.key] += s.value)
    );
    return out;
  }
  function renderStats(stats) {
    const cont = document.getElementById('statsContainer');
    cont.innerHTML = '';
    STAT_DEFS.forEach(({key,label,icon}) => {
      if (key === 'life') return;
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

  // ── ABILITY TABS ──────────────────────────────────────────────────────────
  function renderTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';
    const hero = data.heroes[selectedHeroIdx] || { tabs: [] };
    hero.tabs.forEach((tab, i) => {
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
    const hero     = data.heroes[selectedHeroIdx];
    const combined = [...data.globalAbilities, ...(hero.abilities||[])];
    ['common','rare','epic'].forEach(rarity => {
      const grid = document.getElementById(rarity + 'Grid');
      grid.innerHTML = '';
      combined
        .filter(a => a.tabIdx === selectedTabIdx && a.category === rarity)
        .forEach(a => {
          const wrap = document.createElement('div');
          wrap.className = 'ability';
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `<img src="${a.icon}" alt="">`;
          card.addEventListener('click',    () => purchaseAbility(a));
          card.addEventListener('mouseover',() => showTooltip(a));
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
    const hero      = data.heroes[selectedHeroIdx];
    const roundData = hero.roundBuilds[currentRound - 1];
    const total = roundData.powers.reduce((s,a)=>s+a.cost,0)
                +  roundData.items .reduce((s,a)=>s+a.cost,0);
    document.querySelector('.build-cost .cost-value')
      .textContent = total.toLocaleString();

    // power slots
    document.querySelectorAll('.left-panel .slots.powers .circle')
      .forEach((el,i) => {
        const a = roundData.powers[i];
        el.innerHTML = a
          ? `<img src="${a.icon}" style="width:100%;height:100%;object-fit:cover">`
          : '';
        el.style.cursor = a ? 'pointer' : 'default';
        el.onmouseover = () => a && showTooltip(a);
        el.onmousemove = onMouseMove;
        el.onmouseout  = hideTooltip;
        el.onclick     = () => {
          if (!a) return;
          roundData.powers.splice(i,1);
          saveData();
          renderBuildSlots();
          renderStats(calculateStats(hero));
        };
      });

    // item slots
    document.querySelectorAll('.left-panel .slots.items .circle')
      .forEach((el,i) => {
        const a = roundData.items[i];
        el.innerHTML = a
          ? `<img src="${a.icon}" style="width:100%;height:100%;object-fit:cover">`
          : '';
        el.style.cursor = a ? 'pointer' : 'default';
        el.onmouseover = () => a && showTooltip(a);
        el.onmousemove = onMouseMove;
        el.onmouseout  = hideTooltip;
        el.onclick     = () => {
          if (!a) return;
          roundData.items.splice(i,1);
          saveData();
          renderBuildSlots();
          renderStats(calculateStats(hero));
        };
      });
  }

  // ── PURCHASE LOGIC ────────────────────────────────────────────────────────
  function purchaseAbility(a) {
    const hero     = data.heroes[selectedHeroIdx];
    const isPower  = hero.tabs[selectedTabIdx] === 'Power';
    const slotArr  = isPower ? 'powers' : 'items';
    const roundData= hero.roundBuilds[currentRound - 1];
    if (roundData[slotArr].length >= (isPower ? 4 : 6)) {
      return alert(`${isPower ? 'Power' : 'Item'} slots full`);
    }
    roundData[slotArr].push(a);
    saveData();
    renderBuildSlots();
    renderStats(calculateStats(hero));
  }

  // ── SAVE TO LOCAL ─────────────────────────────────────────────────────────
  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ── HERO‐DECK SIDEBAR ─────────────────────────────────────────────────────
  function renderHeroDeck() {
    const deck = document.getElementById('heroDeck');
    deck.innerHTML = '';
    data.heroes.forEach((h,i) => {
      const img = document.createElement('img');
      img.src = h.avatar || '/images/default-avatar.png';
      img.alt = h.name;
      img.className = 'deck-hero' + (i === selectedHeroIdx ? ' active' : '');
      img.onclick = () => {
        selectedHeroIdx = i;
        localStorage.setItem('selectedHeroIdx', i);
        selectedTabIdx = 0;
        localStorage.setItem('selectedTabIdx', 0);
        document.querySelector('.header .avatar').src =
          h.avatar || '/images/default-avatar.png';
        renderTabs();
        renderAbilities();
        renderBuildSlots();
        renderStats(calculateStats(h));
        renderRoundTabs();
        renderHeroDeck();
      };
      deck.appendChild(img);
    });
  }

  // ── SAVE & SHARE MODAL ─────────────────────────────────────────────────────
  function bindSaveShare() {
    const btn     = document.getElementById('btnSaveBuild');
    const dialog  = document.getElementById('saveDialog');
    const input   = document.getElementById('buildNameInput');
    const linkEl  = document.getElementById('buildLink');
    const shareEl = document.getElementById('shareLink');

    btn.addEventListener('click', () => {
      if (auth.currentUser) {
        input.value = '';
        dialog.showModal();
      } else {
        saveBuild(null);
      }
    });

    dialog.addEventListener('close', () => {
      if (dialog.returnValue === 'default') {
        const name = input.value.trim();
        if (!name) {
          alert('Please enter a build name.');
          return;
        }
        saveBuild(name);
      }
    });

    async function saveBuild(buildName) {
      const hero      = data.heroes[selectedHeroIdx];
      const roundData = hero.roundBuilds[currentRound - 1];
      const user      = auth.currentUser;
      const payload   = {
        creator:   user ? (user.displayName||user.email) : 'anonymous',
        uid:       user ? user.uid : null,
        character: hero.name,
        name:      buildName,
        round:     currentRound,
        powers:    roundData.powers.map(a => a.name),
        items:     roundData.items.map(a => a.name),
        timestamp: Date.now()
      };
      try {
        const docRef = await db.collection('builds').add(payload);
        const url    = `${window.location.origin}/viewer.html?buildId=${docRef.id}`;
        linkEl.href        = url;
        linkEl.textContent = url;
        shareEl.style.display = 'block';
      } catch(err) {
        console.error('Error saving build:', err);
        alert('Failed to save build. Please try again.');
      }
    }
  }

  // ── LOAD BUILD FROM URL ───────────────────────────────────────────────────
  async function loadBuildFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('buildId')) return;
    const snap = await db.collection('builds').doc(params.get('buildId')).get();
    if (!snap.exists) return;
    const b = snap.data();
    selectedHeroIdx = data.heroes.findIndex(h => h.name === b.character);
    currentRound    = b.round || 1;
    const hero = data.heroes[selectedHeroIdx];
    document.querySelector('.header .avatar').src =
      hero.avatar || '/images/default-avatar.png';
    const pool = [...data.globalAbilities, ...hero.abilities];
    // populate that saved round
    hero.roundBuilds[currentRound - 1].powers = pool.filter(a => b.powers.includes(a.name));
    hero.roundBuilds[currentRound - 1].items  = pool.filter(a => b.items.includes(a.name));
    renderTabs();
    renderAbilities();
    renderBuildSlots();
    renderStats(calculateStats(hero));
    renderRoundTabs();
  }

  // ── COMMUNITY GALLERY ─────────────────────────────────────────────────────
  async function renderCommunity() {
    const grid = document.getElementById('communityGrid');
    grid.innerHTML = '<p style="color:#888;">Loading community builds…</p>';
    try {
      const snaps = await db.collection('builds')
        .orderBy('timestamp','desc')
        .limit(12)
        .get();
      if (snaps.empty) {
        grid.innerHTML = '<p style="color:#888;">No community builds yet.</p>';
        return;
      }
      grid.innerHTML = '';
      const heroes  = data.heroes;
      const globals = data.globalAbilities;
      snaps.docs.forEach(docSnap => {
        const b       = docSnap.data();
        const heroDef = heroes.find(h => h.name === b.character) || {};
        const pool    = [...globals, ...(heroDef.abilities||[])];
        const powerObjs = pool.filter(a => b.powers.includes(a.name));
        const itemObjs  = pool.filter(a => b.items.includes(a.name));
        const totalCost = powerObjs.reduce((s,a)=>s+a.cost,0)
                        + itemObjs .reduce((s,a)=>s+a.cost,0);
        const squares = Array(4).fill().map((_,i) =>
          `<div class="square"><img class="icon" src="${powerObjs[i]?.icon||'images/placeholders/sq.png'}" alt=""></div>`
        ).join('');
        const circles = Array(6).fill().map((_,i) =>
          `<div class="circle"><img class="icon" src="${itemObjs[i]?.icon||'images/placeholders/circ.png'}" alt=""></div>`
        ).join('');
        const card = document.createElement('div');
        card.className = 'build-card';
        card.innerHTML = `
          <div class="card-header">
            <img src="${heroDef.avatar||'/images/default-avatar.png'}" alt="${b.character}">
            <h3>${b.character} (R${b.round||1})</h3>
            <a class="btn-view" href="viewer.html?buildId=${docSnap.id}">View</a>
          </div>
          <div class="card-body">
            <div class="squares">${squares}</div>
            <div class="circles">${circles}</div>
            <div class="cost">Total: ${totalCost.toLocaleString()}</div>
          </div>`;
        grid.appendChild(card);
      });
    } catch(err) {
      console.error('Error loading community builds:', err);
      grid.innerHTML = '<p style="color:#f88;">Failed to load community builds.</p>';
    }
  }

  // ── INIT VIEWER & HOOKS ──────────────────────────────────────────────────
  function initViewer() {
    // set header avatar
    document.querySelector('.header .avatar').src =
      data.heroes[selectedHeroIdx].avatar || '/images/default-avatar.png';

    renderTabs();
    renderAbilities();
    renderBuildSlots();
    renderStats(calculateStats(data.heroes[selectedHeroIdx]));
    bindSaveShare();
    renderRoundTabs();
    loadBuildFromURL();
    renderCommunity();
    renderHeroDeck();
  }

  initViewer();
});
