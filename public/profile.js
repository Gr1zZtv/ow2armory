// public/profile.js

// 1) Import your initialized auth & db instances
import { auth, db } from './firebase-config.js';

// 2) Bring in only the bits you need from Auth and Firestore
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

onAuthStateChanged(auth, async user => {
  if (!user) {
    // Not signed in → send to login
    return window.location.href = '/login.html';
  }

  // Show username / avatar / logout
  document.getElementById('username').textContent = user.displayName || user.email;
  const picEl = document.getElementById('userpic');
  picEl.src = user.photoURL || '/images/default-avatar.png';
  picEl.hidden = false;
  document.getElementById('btnLogout').onclick = () => {
    signOut(auth).then(() => window.location.href = '/login.html');
  };
  document.getElementById('btnHome').hidden = false;

  // Load existing profile data from Firestore
  const profileRef  = doc(db, 'profiles', user.uid);
  const profileSnap = await getDoc(profileRef);
  if (profileSnap.exists()) {
    const { displayName, color } = profileSnap.data();
    document.getElementById('displayName').value   = displayName || '';
    document.getElementById('favoriteColor').value = color       || '#ffffff';
  }

  // Wire up the form to save back to Firestore
  document.getElementById('profileForm').onsubmit = async e => {
    e.preventDefault();
    const updates = {
      displayName: document.getElementById('displayName').value,
      color:       document.getElementById('favoriteColor').value
    };
    await setDoc(profileRef, updates, { merge: true });
    alert('Profile saved!');
  };

  // ── NEW: Fetch & render THIS USER’S builds ───────────────────────────────
  try {
    const resp = await fetch('/api/builds');
    const allBuilds = await resp.json();
    // match by creator === displayName (or email if you prefer)
    const mine = allBuilds.filter(b => b.creator === (user.displayName || user.email));
    const container = document.getElementById('userBuilds');

    function makeBuildCard(b) {
      const card = document.createElement('div');
      card.className = 'build-card';
      card.innerHTML = `
        <div class="card-header">
          <img src="images/placeholders/hero.png" alt="${b.character}">
          <h3>${b.character}</h3>
        </div>
        <div class="card-body">
          <div class="squares">
            ${b.powers.slice(0,4).map(_=>`
              <div class="square">
                <img class="icon" src="images/placeholders/sq.png" alt="">
              </div>
            `).join('')}
          </div>
          <div class="circles">
            ${b.items.slice(0,6).map(_=>`
              <div class="circle">
                <img class="icon" src="images/placeholders/circ.png" alt="">
              </div>
            `).join('')}
          </div>
          <div class="cost">Total: —</div>
        </div>`;
      return card;
    }

    mine.forEach(b => container.appendChild(makeBuildCard(b)));
  } catch (e) {
    console.error('Error loading user builds:', e);
  }
  // ──────────────────────────────────────────────────────────────────────────

});
