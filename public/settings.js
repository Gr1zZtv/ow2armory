// public/settings.js
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = '/login.html';

  // Wire up Log Out
  document.getElementById('btnLogout').onclick = () =>
    signOut(auth).then(() => location.href = '/login.html');

  // Reference to their Firestore profile
  const ref  = doc(db, 'profiles', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { displayName, color } = snap.data();
    document.getElementById('inpDisplayName').value = displayName || '';
    document.getElementById('inpColor').value       = color       || '#ffffff';
  }

  document.getElementById('settingsForm').onsubmit = async e => {
    e.preventDefault();
    const newName  = document.getElementById('inpDisplayName').value.trim();
    const newColor = document.getElementById('inpColor').value;

    // 1) Update the Firebase Auth profile name
    await updateProfile(auth.currentUser, { displayName: newName });

    // 2) Mirror it in Firestore
    await setDoc(ref, {
      displayName: newName,
      color:       newColor
    }, { merge: true });

    alert('Profile saved!');
  };
});
