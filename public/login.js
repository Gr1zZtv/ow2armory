// public/login.js

// 1) Get our initialized auth instance
import { auth } from './firebase-config.js';

// 2) Import the bits of Firebase Auth you need
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// 3) Bring in FirebaseUI
import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.0/firebase-ui-auth.js';

// 4) Configure FirebaseUI
const uiConfig = {
  callbacks: {
    // on successful sign-in, redirect back to home
    signInSuccessWithAuthResult: () => {
      window.location.href = '/index.html';
      return false; // don't auto-redirect
    }
  },
  signInFlow: 'popup',
  signInOptions: [
    EmailAuthProvider.PROVIDER_ID,
    GoogleAuthProvider.PROVIDER_ID
  ]
};

// 5) Initialize the FirebaseUI Widget
const ui = new firebaseui.auth.AuthUI(auth);
ui.start('#firebaseui-auth-container', uiConfig);

// 6) If already signed in, go straight to home
onAuthStateChanged(auth, user => {
  if (user) window.location.href = '/index.html';
});
