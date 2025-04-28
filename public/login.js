// public/login.js

// 1) Pull in your initialized Firebase auth instance
import { auth } from './firebase-config.js';

// 2) Import the bits of Firebase Auth you need
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// 3) Pull in the FirebaseUI library
import * as firebaseui from 'https://www.gstatic.com/firebasejs/ui/6.0.0/firebase-ui-auth.js';

// 4) Configure the UI
const uiConfig = {
  callbacks: {
    // Redirect to home page after a successful sign-in
    signInSuccessWithAuthResult: () => {
      window.location.href = '/index.html';
      return false; // Prevents auto-redirect by FirebaseUI itself
    }
  },
  signInFlow: 'popup', // Use pop-up for third-party providers
  signInOptions: [
    // Email/password signup
    firebaseui.auth.AuthUI.EmailAuthProvider.PROVIDER_ID,
    // Google OAuth
    firebaseui.auth.AuthUI.GoogleAuthProvider.PROVIDER_ID,
    // Add more providers here if desired
  ]
};

// 5) Initialize the FirebaseUI widget
const ui = new firebaseui.auth.AuthUI(auth);

// 6) Start the FirebaseUI auth interface
ui.start('#firebaseui-auth-container', uiConfig);

// 7) If the user is already signed in, send them straight to the app
onAuthStateChanged(auth, user => {
  if (user) {
    window.location.href = '/index.html';
  }
});
