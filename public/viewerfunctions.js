// public/viewerfunctions.js
import { auth, db } from './firebase-config.js';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  // ── CONSTANTS & STORAGE KEYS ─────────────────────────────────────────────
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

  // ── LOAD + NORMALIZE LOCAL DATA ──────────────────────────────────────────
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
  const tooltip       = document.getElementById('tooltip');

  // ── TOOLTIP HANDLERS ──────────────────────────────────────────────────────
  function showTooltip(a) {
    const statLines = (a.stats || []).map(s => {
      const def = STAT_DEFS.find(d => d.key === s.key) || { label: s.key, icon: '' };
      return `
        <div class="tooltip-line">
          <img src="${def.icon}" alt="${def.label}">
          <strong>${s.value > 0 ? '+' + s.value : s.value}%</strong>
          <span class="tooltip-label">${def.label}</span>
        </div>
      `;
    }).join('');

    const ctx = a.tooltip
      ? `<div class="tooltip-context">${a.tooltip}</div>`
      : '';

    tooltip.innerHTML = `
      <div class="tooltip-header">${a.name || ''}</div>
      <div class="tooltip-body">${statLines}${ctx}</div>
      <div class="tooltip-footer">
        <img src="assets/diamond-icon.png" alt="Cost">
        <span>${a.cost.toLocaleString()}</span>
        <span class="tooltip-buy">Buy</span>
      </div>
    `;
    tooltip.style.display = 'block';
  }
  function hideTooltip() { tooltip.style.display = 'none'; }
  function onMouseMove(e) {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = (e.pageX + 12) + 'px';
      tooltip.style.top  = (e.pageY + 12) + 'px';
    }
  }

  // ── STAT CALCULATION & RENDER ─────────────────────────────────────────────
  function calculateStats(hero) {
    const out = {};
    STAT_DEFS.forEach(s => out[s.key] = 0);
    (hero.stats || []).forEach(s => out[s.key] += s.value);
    hero.buildPowers.forEach(a => (a.stats||[]).forEach(s => out[s.key] += s.value));
    hero.buildItems.forEach(a => (a.stats||[]).forEach(s => out[s.key] += s.value));
    return out;
  }
  function renderStats(stats) {
    const cont = document.getElementById('statsContainer');
    cont.innerHTML = '';
    STAT_DEFS.forEach(({ key, label, icon }) => {
      if (key === 'life') return;
      const pct = Math.min(Math.round(stats[key]), 100);
      cont.innerHTML += `
        <div class="stat">
          <img class="icon" src="${icon}" alt="${label}">
          <span class="stat-label">${label}</span>
          <div class="bar" data-percent="${pct}">
            <div class="fill" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    });
  }

  // ── TAB RENDERING ─────────────────────────────────────────────────────────
  function renderTabs() {
    const container = document.getElementById('tabsContainer');
    container.innerHTML = '';
    const hero = data.heroes[selectedHeroIdx] || { tabs: [] };
    hero.tabs.forEach((tab, i) => {
      container.innerHTML += `
        <button class="${i===selectedTabIdx?'active':''}" data-idx="${i}">
          ${tab}
        </button>
      `;
    });
    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTabIdx = +btn.dataset.idx;
        localStorage.setItem('selectedTabIdx', selectedTabIdx);
        renderTabs();
        renderAbilities();
      });
    });
  }

  // ── ABILITY GRID ──────────────────────────────────────────────────────────
  function renderAbilities() {
    const hero = data.heroes[selectedHeroIdx];
    const pool = [...data.globalAbilities, ...(hero.abilities||[])];
    ['common','rare','epic'].forEach(rarity => {
      const grid = document.getElementById(rarity + 'Grid');
      grid.innerHTML = '';
      pool.filter(a => a.tabIdx===selectedTabIdx && a.category===rarity)
          .forEach(a => {
        grid.innerHTML += `
          <div class="ability">
            <div class="card" data-name="${a.name}">
              <img src="${a.icon}" alt="${a.name}">
            </div>
            <div class="ability-cost">${a.cost.toLocaleString()}</div>
          </div>
        `;
      });
      // attach events
      grid.querySelectorAll('.card').forEach(card => {
        const ability = pool.find(a => a.name === card.dataset.name);
        card.addEventListener('click', () => purchaseAbility(ability));
        card.addEventListener('mouseover', () => showTooltip(ability));
        card.addEventListener('mousemove', onMouseMove);
        card.addEventListener('mouseout', hideTooltip);
      });
    });
  }

  // ── BUILD PANEL ───────────────────────────────────────────────────────────
  function renderBuildSlots() {
    const hero = data.heroes[selectedHeroIdx];
    const total = hero.buildPowers.reduce((s,a)=>s+a.cost,0)
                + hero.buildItems.reduce((s,a)=>s+a.cost,0);
    document.querySelector('.build-cost .cost-value').textContent = total.toLocaleString();

    ['powers','items'].forEach(type => {
      document.querySelectorAll(`.left-panel .slots.${type} .circle`)
        .forEach((el,i) => {
          const arr = type==='powers' ? hero.buildPowers : hero.buildItems;
          const a = arr[i];
          el.innerHTML = a
            ? `<img src="${a.icon}" style="width:100%;height:100%;object-fit:cover">`
            : '';
          el.style.cursor = a ? 'pointer' : 'default';
          if (a) {
            el.onmouseover = () => showTooltip(a);
            el.onmousemove = onMouseMove;
            el.onmouseout  = hideTooltip;
            el.onclick     = () => {
              arr.splice(i,1);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
              renderBuildSlots();
              renderStats(calculateStats(hero));
            };
          }
        });
    });
  }

  // ── PURCHASE LOGIC ────────────────────────────────────────────────────────
  function purchaseAbility(a) {
    const hero    = data.heroes[selectedHeroIdx];
    const isPower = hero.tabs[selectedTabIdx] === 'Power';
    const arr     = isPower ? hero.buildPowers : hero.buildItems;
    const limit   = isPower ? 4 : 6;
    if (arr.length >= limit) {
      return alert(`${isPower?'Power':'Item'} slots full`);
    }
    arr.push(a);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderBuildSlots();
    renderStats(calculateStats(hero));
  }

  // ── SAVE & SHARE into Firestore ─────────────────────────────────────────
  async function bindSaveShare() {
    document.getElementById('btnSaveBuild').onclick = async () => {
      const hero = data.heroes[selectedHeroIdx];
      const user = auth.currentUser;
      const payload = {
        creator:   user ? (user.displayName||user.email) : 'anonymous',
        uid:       user ? user.uid : null,
        character: hero.name,
        powers:    hero.buildPowers.map(a=>a.name),
        items:     hero.buildItems.map(a=>a.name),
        timestamp: Date.now()
      };
      try {
        const ref = await addDoc(collection(db,'builds'), payload);
        const url = `${location.origin}/viewer.html?buildId=${ref.id}`;
        const a   = document.getElementById('buildLink');
        a.href    = url;
        a.textContent = url;
        document.getElementById('shareLink').style.display = 'block';
      } catch(err) {
        console.error(err);
        alert('Failed to save build.');
      }
    };
  }

  // ── LOAD a single build from ?buildId=… ───────────────────────────────────
  async function loadBuildFromURL() {
    const params = new URLSearchParams(location.search);
    if (!params.has('buildId')) return;
    const snap = await getDoc(doc(db,'builds', params.get('buildId')));
    if (!snap.exists()) return;
    const b = snap.data();
    selectedHeroIdx = data.heroes.findIndex(h=>h.name===b.character);
    document.getElementById('heroSelect').value = selectedHeroIdx;
    const pool = [...data.globalAbilities, ...data.heroes[selectedHeroIdx].abilities];
    data.heroes[selectedHeroIdx].buildPowers = pool.filter(a=>b.powers.includes(a.name));
    data.heroes[selectedHeroIdx].buildItems  = pool.filter(a=>b.items.includes(a.name));
    renderTabs();
    renderAbilities();
    renderBuildSlots();
    renderStats(calculateStats(data.heroes[selectedHeroIdx]));
  }

  // ── COMMUNITY GALLERY from Firestore ────────────────────────────────────
  async function renderCommunity() {
    const snaps = await getDocs(collection(db,'builds'));
    document.getElementById('communityGrid').innerHTML = snaps.docs.map(d => {
      const b = d.data();
      return `
        <div class="community-card">
          <strong>${b.character}</strong> by ${b.creator}<br>
          Powers: ${b.powers.join(', ')}<br>
          Items:  ${b.items.join(', ')}<br>
          <a href="viewer.html?buildId=${d.id}">Load Build</a>
        </div>
      `;
    }).join('');
  }

  // ── INITIALIZE EVERYTHING ────────────────────────────────────────────────
  function initViewer() {
    document.getElementById('heroSelect').innerHTML =
      data.heroes.map((h,i) => `<option value="${i}">${h.name}</option>`).join('');
    document.getElementById('heroSelect').value = selectedHeroIdx;
    document.getElementById('heroSelect').onchange = e => {
      selectedHeroIdx = +e.target.value;
      localStorage.setItem('selectedHeroIdx', selectedHeroIdx);
      selectedTabIdx = 0;
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
