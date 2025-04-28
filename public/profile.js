// 1) Firebase imports
import { auth, db } from './firebase-config.js';
import {
  doc, getDoc, setDoc,
  collection, query, where, orderBy, getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// 2) Helper to build a card element
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

// 3) Wait for auth
auth.onAuthStateChanged(async user => {
  if (!user) {
    return window.location.href = '/login.html';
  }

  // Account info
  const { displayName, email, photoURL, metadata } = user;
  document.getElementById('displayNameHeader').textContent = displayName || '—';
  document.getElementById('email').textContent            = email;
  document.getElementById('avatar').src                   = photoURL || 'images/placeholders/hero.png';
  document.getElementById('createdAt').textContent        =
    new Date(metadata.creationTime).toLocaleDateString();

  // Preferences form
  const profileRef = doc(db, 'profiles', user.uid);
  const snap = await getDoc(profileRef);
  const profileData = snap.exists() ? snap.data() : {};
  document.getElementById('displayName').value    = profileData.displayName || displayName || '';
  document.getElementById('favoriteColor').value  = profileData.color       || '#ffffff';

  document.getElementById('profileForm').onsubmit = async e => {
    e.preventDefault();
    const updates = {
      displayName: document.getElementById('displayName').value,
      color:       document.getElementById('favoriteColor').value
    };
    await setDoc(profileRef, updates, { merge: true });
    alert('Preferences saved!');
  };

  // Log out
  document.getElementById('logoutBtn').onclick = () => {
    auth.signOut().then(() => window.location.href = '/login.html');
  };

  // Saved Builds
  const buildsQ = query(
    collection(db,'builds'),
    where('owner','==',user.uid),
    orderBy('createdAt','desc')
  );
  const buildsSnap = await getDocs(buildsQ);
  const container = document.getElementById('savedBuilds');
  if (buildsSnap.empty) {
    container.innerHTML = `<p style="grid-column:1/-1;color:#888;">
      You have no saved builds yet.
    </p>`;
  } else {
    buildsSnap.forEach(doc => {
      const b = doc.data();
      container.appendChild(createBuildCard(b));
    });
  }

  // Discussions placeholder (you can later fetch from `collection(db,'discussions')`)
});
