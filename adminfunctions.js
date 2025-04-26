// adminfunctions.js
(() => {
  const STORAGE_KEY = 'armoryData';
  const STAT_DEFS = [
    { key: 'life',             label: 'Life' },
    { key: 'weaponPower',      label: 'Weapon Power' },
    { key: 'abilityPower',     label: 'Ability Power' },
    { key: 'attackSpeed',      label: 'Attack Speed' },
    { key: 'cooldownReduction',label: 'Cooldown Reduction' },
    { key: 'maxAmmo',          label: 'Max Ammo' },
    { key: 'weaponLifesteal',  label: 'Weapon Lifesteal' },
    { key: 'abilityLifesteal', label: 'Ability Lifesteal' },
    { key: 'moveSpeed',        label: 'Move Speed' },
    { key: 'reloadSpeed',      label: 'Reload Speed' },
    { key: 'meleeDamage',      label: 'Melee Damage' },
    { key: 'criticalDamage',   label: 'Critical Damage' },
  ];

  let data = { heroes: [], globalAbilities: [] };
  let selectedGlobalTab = parseInt(localStorage.getItem('selectedGlobalTab'), 10) || 0;

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { data = JSON.parse(raw); } catch {}
    }
    data.heroes = Array.isArray(data.heroes) ? data.heroes : [];
    data.globalAbilities = Array.isArray(data.globalAbilities) ? data.globalAbilities : [];
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderGlobalTabs();
    renderGlobalAbilities();
    renderHeroes();
  }

  // ── GLOBAL TABS ───────────────────────────────────────────────────────────
  function renderGlobalTabs() {
    const container = document.getElementById('globalTabs');
    container.innerHTML = '';
    ['Weapon','Ability','Survival'].forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      if (i === selectedGlobalTab) btn.classList.add('active');
      btn.addEventListener('click', () => {
        selectedGlobalTab = i;
        localStorage.setItem('selectedGlobalTab', i);
        renderGlobalTabs();
        renderGlobalAbilities();
      });
      container.appendChild(btn);
    });
  }

  // ── GLOBAL ABILITIES ──────────────────────────────────────────────────────
  function renderGlobalAbilities() {
    const out = document.getElementById('globalAbilitiesList');
    out.innerHTML = '';

    const tabsOpts = ['Weapon','Ability','Survival']
      .map((t,i) => `<option value="${i}">${t}</option>`)
      .join('');
    const statKeyOpts = STAT_DEFS
      .map(s => `<option value="${s.key}">${s.label}</option>`)
      .join('');

    data.globalAbilities
      .filter(a => a.tabIdx === selectedGlobalTab)
      .forEach((a, gi) => {
        out.insertAdjacentHTML('beforeend', `
          <div class="global-ability" data-gi="${gi}">
            <div class="global-header">
              <img src="${a.icon}" class="global-header-icon" alt="">
              <span class="global-header-name">${a.name}</span>
              <button type="button" class="collapse-btn">–</button>
            </div>
            <div class="global-grid">
              <div class="global-main panel">
                <input class="editGlobalName"     value="${a.name}"    placeholder="Name">
                <select class="editGlobalTab">
                  ${tabsOpts.replace(`value="${a.tabIdx}"`, `value="${a.tabIdx}" selected`)}
                </select>
                <select class="editGlobalCat">
                  <option value="common"${a.category==='common'?' selected':''}>Common</option>
                  <option value="rare"${a.category==='rare'?' selected':''}>Rare</option>
                  <option value="epic"${a.category==='epic'?' selected':''}>Epic</option>
                </select>
                <input class="editGlobalIcon"     value="${a.icon}"    placeholder="Icon URL">
                <input class="editGlobalCost" type="number" value="${a.cost}" placeholder="Cost">
                <input class="editGlobalTooltip"  value="${a.tooltip}" placeholder="Tooltip">
                <button type="button" class="btn-delete deleteGlobalAbility">Delete</button>
              </div>
              <div class="global-details panel">
                <div class="statsList">
                  ${a.stats.map((st, si) => `
                    <div class="statRow" data-si="${si}">
                      <select class="editGlobalStatKey">
                        ${statKeyOpts.replace(`value="${st.key}"`, `value="${st.key}" selected`)}
                      </select>
                      <input class="editGlobalStatValue" type="number" value="${st.value}">
                      <button type="button" class="btn-delete deleteGlobalStat">Delete</button>
                    </div>`).join('')}
                </div>
                <div class="addStatForm">
                  <select class="newGlobalStatKey">${statKeyOpts}</select>
                  <input class="newGlobalStatValue" type="number" placeholder="Value">
                  <button type="button" class="btn-add addGlobalStat">Add Stat</button>
                </div>
              </div>
            </div>
          </div>`);
      });

    bindGlobalListeners();
    bindCollapseButtons();
  }

  function bindGlobalListeners() {
    document.getElementById('addGlobalAbilityForm').addEventListener('submit', e => {
      e.preventDefault();
      const name     = document.getElementById('newGlobalName').value.trim();
      const tabIdx   = +document.getElementById('newGlobalTab').value;
      const category = document.getElementById('newGlobalCat').value;
      const icon     = document.getElementById('newGlobalIcon').value.trim();
      const cost     = +document.getElementById('newGlobalCost').value;
      const tooltip  = document.getElementById('newGlobalTooltip').value.trim();
      if (!name || !icon || isNaN(cost)) {
        return alert('Name, Icon URL, and Cost are required.');
      }
      data.globalAbilities.push({ name, tabIdx, category, icon, cost, tooltip, stats: [] });
      e.target.reset();
      saveData();
    });

    document.querySelectorAll('.global-ability').forEach(item => {
      const gi = +item.dataset.gi;

      item.querySelector('.deleteGlobalAbility').addEventListener('click', () => {
        if (!confirm('Delete this global ability?')) return;
        data.globalAbilities.splice(gi, 1);
        saveData();
      });

      item.querySelector('.editGlobalName').addEventListener('change',    e => { data.globalAbilities[gi].name    = e.target.value; saveData(); });
      item.querySelector('.editGlobalTab').addEventListener('change',     e => { data.globalAbilities[gi].tabIdx  = +e.target.value; saveData(); });
      item.querySelector('.editGlobalCat').addEventListener('change',     e => { data.globalAbilities[gi].category= e.target.value; saveData(); });
      item.querySelector('.editGlobalIcon').addEventListener('change',    e => { data.globalAbilities[gi].icon    = e.target.value; saveData(); });
      item.querySelector('.editGlobalCost').addEventListener('change',    e => { data.globalAbilities[gi].cost    = +e.target.value; saveData(); });
      item.querySelector('.editGlobalTooltip').addEventListener('change', e => { data.globalAbilities[gi].tooltip = e.target.value; saveData(); });

      item.querySelectorAll('.deleteGlobalStat').forEach(btn => {
        btn.addEventListener('click', () => {
          const si = +btn.closest('.statRow').dataset.si;
          data.globalAbilities[gi].stats.splice(si, 1);
          saveData();
        });
      });
      item.querySelectorAll('.editGlobalStatKey').forEach(sel => {
        sel.addEventListener('change', e => {
          const si = +sel.closest('.statRow').dataset.si;
          data.globalAbilities[gi].stats[si].key = e.target.value;
          saveData();
        });
      });
      item.querySelectorAll('.editGlobalStatValue').forEach(inp => {
        inp.addEventListener('change', e => {
          const si = +inp.closest('.statRow').dataset.si;
          data.globalAbilities[gi].stats[si].value = +e.target.value;
          saveData();
        });
      });
      item.querySelector('.addGlobalStat').addEventListener('click', () => {
        const key = item.querySelector('.newGlobalStatKey').value;
        const val = +item.querySelector('.newGlobalStatValue').value;
        if (isNaN(val)) return alert('Enter a number');
        data.globalAbilities[gi].stats.push({ key, value: val });
        saveData();
      });
    });
  }

  // ── HERO MANAGEMENT ────────────────────────────────────────────────────────
  function renderHeroes() {
    const out = document.getElementById('heroesList');
    out.innerHTML = '';

    data.heroes.forEach((h, idx) => {
      h.tabs        = Array.isArray(h.tabs)        ? h.tabs        : ['Weapon','Ability','Survival','Power'];
      h.abilities   = Array.isArray(h.abilities)   ? h.abilities   : [];
      h.stats       = Array.isArray(h.stats)       ? h.stats       : [];
      h.buildPowers = Array.isArray(h.buildPowers) ? h.buildPowers : [];
      h.buildItems  = Array.isArray(h.buildItems)  ? h.buildItems  : [];

      let lifeStat = h.stats.find(s => s.key === 'life');
      if (!lifeStat) {
        lifeStat = { key: 'life', value: 0 };
        h.stats.push(lifeStat);
      }

      const tabsOpts    = h.tabs.map((t, ti) => `<option value="${ti}">${t}</option>`).join('');
      const statKeyOpts = STAT_DEFS.map(s => `<option value="${s.key}">${s.label}</option>`).join('');

      out.insertAdjacentHTML('beforeend', `
        <div class="hero" data-idx="${idx}">
          <button type="button" class="collapse-btn">–</button>
          <div class="hero-grid">
            <div class="hero-info panel">
              <label>Name:
                <input class="editNameHero" value="${h.name}">
              </label>
              <label>Avatar URL:
                <input class="editAvatar" value="${h.avatar}">
              </label>
              <label>Health:
                <input type="number" class="editHealth" value="${lifeStat.value}">
              </label>
              <div class="actions">
                <button type="button" class="btn-delete deleteHero">Delete Hero</button>
                <button type="button" class="btn-export exportHero">Export JSON</button>
              </div>
            </div>
            <div class="panel">
              <h3>Tabs</h3>
              <div class="tabsList">
                ${h.tabs.map((t, ti) => `
                  <div>
                    <input class="editTabName" data-ti="${ti}" value="${t}">
                    <button type="button" class="btn-delete deleteTab" data-ti="${ti}">✕</button>
                  </div>`).join('')}
              </div>
              <div class="addTabForm">
                <input class="newTabName" placeholder="New Tab">
                <button type="button" class="btn-add addTab">Add Tab</button>
              </div>
              <h3>Abilities</h3>
              <div class="adminTabs">
                ${h.tabs.map((t, ti) => `
                  <button type="button" data-ti="${ti}" class="${ti===0?'active':''}">${t}</button>`).join('')}
              </div>
              <div class="abilitiesList">
                ${h.abilities.map((a, ai) => `
                  <div class="abilityItem" data-ai="${ai}" data-tab-idx="${a.tabIdx}">
                    <div class="mainFields">
                      <input class="editName"      value="${a.name}"    placeholder="Name">
                      <select class="editTab">${tabsOpts.replace(`value="${a.tabIdx}"`,`value="${a.tabIdx}" selected`)}</select>
                      <select class="editCat">
                        <option value="common"${a.category==='common'?' selected':''}>Common</option>
                        <option value="rare"${a.category==='rare'?' selected':''}>Rare</option>
                        <option value="epic"${a.category==='epic'?' selected':''}>Epic</option>
                      </select>
                      <input class="editIcon"      value="${a.icon}"    placeholder="Icon URL">
                      <input class="editCost" type="number" value="${a.cost}" placeholder="Cost">
                      <input class="editTooltip"   value="${a.tooltip}" placeholder="Tooltip">
                      <button type="button" class="btn-delete deleteAbility">Delete</button>
                    </div>
                    <div class="statsList">
                      ${a.stats.map((st, si) => `
                        <div class="statRow" data-si="${si}">
                          <select class="editStatKey">${statKeyOpts.replace(`value="${st.key}"`,`value="${st.key}" selected`)}</select>
                          <input class="editStatValue" type="number" value="${st.value}">
                          <button type="button" class="btn-delete deleteStat">Delete</button>
                        </div>`).join('')}
                    </div>
                    <div class="addStatForm">
                      <select class="newStatKey">${statKeyOpts}</select>
                      <input class="newStatValue" type="number" placeholder="Value">
                      <button type="button" class="btn-add addStat">Add Stat</button>
                    </div>
                  </div>`).join('')}
              </div>
              <div class="addAbilityForm">
                <input class="newName" placeholder="Name">
                <select class="newCat">
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                </select>
                <input class="newIcon" placeholder="Icon URL">
                <input class="newCost" type="number" placeholder="Cost">
                <input class="newTooltip" placeholder="Tooltip">
                <button type="button" class="btn-add addAbility">Add Ability</button>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    bindHeroListeners();
    bindCollapseButtons();
  }

  function bindHeroListeners() {
    document.getElementById('clearData').addEventListener('click', () => {
      if (!confirm('Erase all data?')) return;
      data = { heroes: [], globalAbilities: data.globalAbilities };
      saveData();
    });

    document.getElementById('addHeroForm').addEventListener('submit', e => {
      e.preventDefault();
      const name   = document.getElementById('newHeroName').value.trim();
      const avatar = document.getElementById('newHeroAvatar').value.trim();
      if (!name) return alert('Hero name is required.');
      data.heroes.push({
        name,
        avatar,
        stats: [{ key: 'life', value: 0 }],
        tabs: ['Weapon','Ability','Survival','Power'],
        abilities: []
      });
      e.target.reset();
      saveData();
    });

    document.querySelectorAll('.hero').forEach(card => {
      const idx = +card.dataset.idx;

      card.querySelector('.deleteHero').addEventListener('click', () => {
        if (!confirm('Delete this hero?')) return;
        data.heroes.splice(idx, 1);
        saveData();
      });
      card.querySelector('.exportHero').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(data.heroes[idx], null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${data.heroes[idx].name}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });

      card.querySelector('.editNameHero').addEventListener('change', e => {
        data.heroes[idx].name = e.target.value; saveData();
      });
      card.querySelector('.editAvatar').addEventListener('change', e => {
        data.heroes[idx].avatar = e.target.value; saveData();
      });
      card.querySelector('.editHealth').addEventListener('change', e => {
        const val = +e.target.value;
        const st  = data.heroes[idx].stats.find(s => s.key === 'life');
        if (st) st.value = val;
        else data.heroes[idx].stats.push({ key: 'life', value: val });
        saveData();
      });

      card.querySelectorAll('.deleteTab').forEach(btn => {
        btn.addEventListener('click', () => {
          const ti = +btn.dataset.ti;
          if (!confirm('Delete tab?')) return;
          data.heroes[idx].tabs.splice(ti, 1);
          data.heroes[idx].abilities = data.heroes[idx].abilities
            .filter(a => a.tabIdx !== ti)
            .map(a => { if (a.tabIdx > ti) a.tabIdx--; return a; });
          saveData();
        });
      });
      card.querySelectorAll('.editTabName').forEach(inp => {
        inp.addEventListener('change', e => {
          const ti = +inp.dataset.ti;
          data.heroes[idx].tabs[ti] = e.target.value;
          saveData();
        });
      });
      card.querySelector('.addTab').addEventListener('click', () => {
        const nm = card.querySelector('.newTabName').value.trim();
        if (!nm) return alert('Tab name required.');
        data.heroes[idx].tabs.push(nm);
        saveData();
      });

      const adminTabs = card.querySelectorAll('.adminTabs button');
      adminTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          adminTabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const ti = +btn.dataset.ti;
          card.querySelectorAll('.abilityItem').forEach(ai => {
            ai.style.display = +ai.dataset.tabIdx === ti ? '' : 'none';
          });
        });
      });

      card.querySelectorAll('.abilityItem').forEach(aiEl => {
        const ai = +aiEl.dataset.ai;
        aiEl.querySelector('.deleteAbility').addEventListener('click', () => {
          if (!confirm('Delete ability?')) return;
          data.heroes[idx].abilities.splice(ai, 1);
          saveData();
        });

        ['name','tabIdx','category','icon','cost','tooltip'].forEach(prop => {
          const cls = prop === 'tabIdx' ? 'editTab'
                    : prop === 'category' ? 'editCat'
                    : prop === 'icon' ? 'editIcon'
                    : prop === 'cost' ? 'editCost'
                    : prop === 'tooltip' ? 'editTooltip'
                    : 'editName';
          aiEl.querySelector(`.${cls}`).addEventListener('change', e => {
            data.heroes[idx].abilities[ai][prop] =
              (prop === 'cost' || prop === 'tabIdx') ? +e.target.value : e.target.value;
            saveData();
          });
        });

        aiEl.querySelectorAll('.deleteStat').forEach(btn => {
          btn.addEventListener('click', () => {
            const si = +btn.closest('.statRow').dataset.si;
            data.heroes[idx].abilities[ai].stats.splice(si, 1);
            saveData();
          });
        });
        aiEl.querySelectorAll('.editStatKey').forEach(sel => {
          sel.addEventListener('change', e => {
            const si = +sel.closest('.statRow').dataset.si;
            data.heroes[idx].abilities[ai].stats[si].key = e.target.value;
            saveData();
          });
        });
        aiEl.querySelectorAll('.editStatValue').forEach(inp => {
          inp.addEventListener('change', e => {
            const si = +inp.closest('.statRow').dataset.si;
            data.heroes[idx].abilities[ai].stats[si].value = +e.target.value;
            saveData();
          });
        });
        aiEl.querySelector('.addStat').addEventListener('click', () => {
          const key = aiEl.querySelector('.newStatKey').value;
          const val = +aiEl.querySelector('.newStatValue').value;
          if (isNaN(val)) return alert('Enter a number');
          data.heroes[idx].abilities[ai].stats.push({ key, value: val });
          saveData();
        });
      });

      card.querySelector('.addAbility').addEventListener('click', () => {
        const ti       = +card.querySelector('.adminTabs button.active').dataset.ti;
        const nm       = card.querySelector('.newName').value.trim();
        const category = card.querySelector('.newCat').value;
        const icon     = card.querySelector('.newIcon').value.trim();
        const cost     = +card.querySelector('.newCost').value;
        const tooltip  = card.querySelector('.newTooltip').value.trim();
        if (!nm) return alert('Ability name required.');
        if (!icon || isNaN(cost)) return alert('Icon & cost required.');
        data.heroes[idx].abilities.push({
          name: nm, tabIdx: ti, category, icon, cost, tooltip, stats: []
        });
        saveData();
      });
    });
  }

  // ── COLLAPSE BUTTON ────────────────────────────────────────────────────────
  function bindCollapseButtons() {
    document.querySelectorAll('.collapse-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.global-ability') || btn.closest('.hero');
        card.classList.toggle('collapsed');
        btn.textContent = card.classList.contains('collapsed') ? '+' : '–';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderGlobalTabs();
    renderGlobalAbilities();
    renderHeroes();
  });
})();
