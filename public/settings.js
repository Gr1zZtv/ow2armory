// public/settings.js
import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = '/login.html';

  document.getElementById('btnLogout').onclick = () =>
    signOut(auth).then(() => location.href = '/login.html');

  const ref     = doc(db, 'profiles', user.uid);
  const snap    = await getDoc(ref);
  const form    = document.getElementById('settingsForm');
  const inpName = document.getElementById('inpDisplayName');
  const inpCol  = document.getElementById('inpColor');

  if (snap.exists()) {
    const { displayName, color } = snap.data();
    inpName.value = displayName   || '';
    inpCol.value  = color || '#ffffff';
  }

  form.onsubmit = async e => {
    e.preventDefault();
    const newName  = inpName.value.trim();
    const newColor = inpCol.value;

    if (!newName) {
      return alert('Please enter a display name.');
    }

    // 1) Check Firestore for existing profile with this displayName
    const q = query(
      collection(db, 'profiles'),
      where('displayName', '==', newName)
    );
    const existing = await getDocs(q);

    // If there’s any doc with the same name *and* it’s not the current user, reject
    const conflict = existing.docs.some(d => d.id !== user.uid);
    if (conflict) {
      return alert('That display name is already taken. Please choose another.');
    }

    // 2) Update Firebase Auth profile
    await updateProfile(auth.currentUser, { displayName: newName });

    // 3) Mirror it in Firestore
    await setDoc(ref, {
      displayName: newName,
      color:       newColor
    }, { merge: true });

    alert('Profile saved!');
  };
});
