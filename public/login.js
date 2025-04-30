// public/login.js

// 1) Pull in your initialized auth & db instances
import { auth, db } from './firebase-config.js';

// 2) Import the Auth bits you need
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// 3) Import the Firestore bits you need
import {
  doc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// 4) Import FirebaseUI
import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.0/firebase-ui-auth.js';

// ── FirebaseUI config ───────────────────────────────────────────────────────
const uiConfig = {
  callbacks: {
    // After a successful sign-in / sign-up:
    signInSuccessWithAuthResult: async (authResult) => {
      const user = authResult.user;

      // If it's a brand-new user, give them a default avatar and Firestore profile
      if (authResult.additionalUserInfo.isNewUser) {
        try {
          // 1) set the Firebase Authentication profile photoURL
          await updateProfile(user, {
            photoURL: '/images/default-avatar.png'
          });

          // 2) write a matching document in /profiles/{uid}
          await setDoc(doc(db, 'profiles', user.uid), {
            displayName: user.displayName || user.email,
            avatarURL:  user.photoURL || '/images/default-avatar.png',
            color:      '#888'  // default accent color
          });
        } catch(err) {
          console.error('Error setting up new user profile:', err);
        }
      }

      // Finally, redirect home
      window.location.href = '/index.html';
      return false; // tell FirebaseUI not to auto-redirect again
    }
  },

  // Use popup flows, not full-page redirects
  signInFlow: 'popup',

  // Which providers to offer:
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID,
    GoogleAuthProvider.PROVIDER_ID
  ]
};

// ── Kick off the FirebaseUI widget ─────────────────────────────────────────
const ui = new firebaseui.auth.AuthUI(auth);
ui.start('#firebaseui-auth-container', uiConfig);

// ── If already signed in, go home immediately ──────────────────────────────
onAuthStateChanged(auth, user => {
  if (user) window.location.href = '/index.html';
});