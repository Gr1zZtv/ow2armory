// 1) Import your Firebase services
import { auth, db } from './firebase-config.js';
import {
  doc, getDoc, setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// 2) Wait for auth state
auth.onAuthStateChanged(async user => {
  if (!user) {
    // Not signed in → send to login
    return window.location.href = '/login.html';
  }

  const uid = user.uid;
  const profileRef = doc(db, 'profiles', uid);

  // 3) Load existing profile data
  const snap = await getDoc(profileRef);
  const data = snap.exists() ? snap.data() : {};

  document.getElementById('displayName').value = data.displayName || '';
  document.getElementById('favoriteColor').value = data.color || '#ffffff';

  // 4) Handle form submission
  document.getElementById('profileForm').onsubmit = async e => {
    e.preventDefault();
    const updates = {
      displayName: document.getElementById('displayName').value,
      color:       document.getElementById('favoriteColor').value
    };
    await setDoc(profileRef, updates, { merge: true });
    alert('Profile saved!');
  };

  // 5) Log out
  document.getElementById('logoutBtn').onclick = () => {
    auth.signOut().then(() => {
      window.location.href = '/login.html';
    });
  };
});
