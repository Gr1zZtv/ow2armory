// public/profile.js

import { auth, db } from './firebase-config.js';
import {
  doc, getDoc, setDoc,
  collection, query, where, orderBy, getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// helper to render a build card
function createBuildCard(data) {
  const card = document.createElement('div');
  card.className = 'build-card';
  card.innerHTML = `
    <div class="card-header">
      <img src="${data.heroAvatar||'images/placeholders/hero.png'}" alt="">
      <h3>${data.heroName||'Unknown'}</h3>
    </div>
    <div class="card-body">
      <div class="squares">
        ${[0,1,2,3].map(i=>`
          <div class="square">
            <img class="icon" src="${data.squares[i]||'images/placeholders/sq.png'}">
          </div>`).join('')}
      </div>
      <div class="circles">
        ${[0,1,2,3,4,5].map(i=>`
          <div class="circle">
            <img class="icon" src="${data.circles[i]||'images/placeholders/circ.png'}">
          </div>`).join('')}
      </div>
      <div class="cost">Total: ${(data.totalCost||0).toLocaleString()}</div>
    </div>`;
  return card;
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    return window.location.href = '/login.html';
  }

  // --- Account Info Elements ---
  const headerEl      = document.getElementById('displayNameHeader');
  const avatarEl      = document.getElementById('avatar');
  const emailEl       = document.getElementById('email');
  const createdAtEl   = document.getElementById('createdAt');

  // pull out auth info
  const { displayName, email, photoURL, metadata } = user;
  emailEl.textContent     = email;
  avatarEl.src            = photoURL || 'images/placeholders/hero.png';
  createdAtEl.textContent = new Date(metadata.creationTime).toLocaleDateString();

  // --- Load preferences from Firestore ---
  const profileRef = doc(db, 'profiles', user.uid);
  let profileData  = {};
  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) profileData = snap.data();
  } catch (err) {
    console.error('Error reading profile:', err);
  }

  // effective display name (= saved prefs OR auth displayName OR placeholder)
  const effectiveName = profileData.displayName || displayName || '—';
  headerEl.textContent = effectiveName;

  // apply favorite color to avatar border
  const favColor = profileData.color || '#ffffff';
  avatarEl.style.borderColor = favColor;

  // populate the form fields
  document.getElementById('displayName').value   = profileData.displayName || displayName || '';
  document.getElementById('favoriteColor').value = favColor;

  // --- Handle preferences form submit ---
  document.getElementById('profileForm').onsubmit = async e => {
    e.preventDefault();
    const newName  = document.getElementById('displayName').value.trim();
    const newColor = document.getElementById('favoriteColor').value;
    const updates  = { displayName: newName, color: newColor };

    try {
      await setDoc(profileRef, updates, { merge: true });
      // immediately reflect the changes in the UI
      headerEl.textContent           = newName || '—';
      avatarEl.style.borderColor     = newColor;
      alert('Preferences saved!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('❌ Error saving preferences');
    }
  };

  // --- Log out button ---
  document.getElementById('logoutBtn').onclick = () => {
    auth.signOut().then(() => window.location.href = '/login.html');
  };

  // --- Load & render Saved Builds ---
  const buildsQ    = query(
    collection(db,'builds'),
    where('owner','==', user.uid),
    orderBy('createdAt','desc')
  );
  const buildsSnap = await getDocs(buildsQ);
  const container  = document.getElementById('savedBuilds');
  container.innerHTML = ''; // clear any placeholder
  if (buildsSnap.empty) {
    container.innerHTML = `<p style="grid-column:1/-1;color:#888;">
      You have no saved builds yet.
    </p>`;
  } else {
    buildsSnap.forEach(doc => {
      container.appendChild(createBuildCard(doc.data()));
    });
  }
});
