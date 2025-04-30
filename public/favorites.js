// public/favorites.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async user => {
    if (!user) {
      // not signed in → send to login
      return location.href = '/login.html';
    }

    const container = document.getElementById('favoritesContainer');
    container.innerHTML = '<p style="color:#888;">Loading your favorites…</p>';

    try {
      // 1) Grab all favorites under this user
      const favsRef  = collection(db, 'profiles', user.uid, 'favorites');
      const favsSnap = await getDocs(query(favsRef, orderBy('timestamp','desc')));
      if (favsSnap.empty) {
        container.innerHTML = '<p style="color:#888;">You have no favorites yet.</p>';
        return;
      }

      // 2) Pull in your static armory data
      const stored   = JSON.parse(localStorage.getItem('armoryData') || '{}');
      const heroes   = stored.heroes          || [];
      const globals  = stored.globalAbilities || [];

      container.innerHTML = '';
      // 3) For each favorite, fetch the build doc and render a card
      for (const favDoc of favsSnap.docs) {
        const buildId = favDoc.id;
        const snap    = await getDoc(doc(db, 'builds', buildId));
        if (!snap.exists()) continue;
        const b       = snap.data();

        // lookup hero definition + combined pool
        const heroDef = heroes.find(h => h.name === b.character) || {};
        const pool    = [...globals, ...(heroDef.abilities||[])];

        // map saved names → full objects
        const powerObjs = pool.filter(a => b.powers.includes(a.name));
        const itemObjs  = pool.filter(a => b.items .includes(a.name));

        // compute cost
        const totalCost = powerObjs.reduce((s,a)=>s+a.cost,0)
                        + itemObjs .reduce((s,a)=>s+a.cost,0);

        // fill slots (4 squares, 6 circles) with placeholders as needed
        const squares = Array(4).fill(0).map((_,i) => {
          const a = powerObjs[i];
          return `
            <div class="square">
              <img class="icon" src="${a? a.icon : 'images/placeholders/sq.png'}" alt="">
            </div>`;
        }).join('');

        const circles = Array(6).fill(0).map((_,i) => {
          const a = itemObjs[i];
          return `
            <div class="circle">
              <img class="icon" src="${a? a.icon : 'images/placeholders/circ.png'}" alt="">
            </div>`;
        }).join('');

        // build-card markup
        const card = document.createElement('div');
        card.className = 'build-card';
        card.innerHTML = `
          <div class="card-header">
            <img src="${heroDef.avatar || '/images/default-avatar.png'}"
                 alt="${b.character}">
            <h3>${b.character}</h3>
            <a class="btn-view" href="/viewer.html?buildId=${buildId}">
              View
            </a>
          </div>
          <div class="card-body">
            <div class="squares">${squares}</div>
            <div class="circles">${circles}</div>
            <div class="cost">Total: ${totalCost.toLocaleString()}</div>
          </div>`;

        container.appendChild(card);
      }

    } catch(err) {
      console.error('Error loading favorites:', err);
      container.innerHTML =
        '<p style="color:#f88;">Failed to load your favorites.</p>';
    }
  });
});