// public/login.js
import { auth }          from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import * as firebaseui   from 'https://www.gstatic.com/firebasejs/ui/6.0.0/firebase-ui-auth.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1) If already signed in, go straight home:
  onAuthStateChanged(auth, user => {
    if (user) window.location.href = '/index.html';
  });

  // 2) Configure the FirebaseUI widget:
  const uiConfig = {
    callbacks: {
      // After a successful sign-in, redirect manually:
      signInSuccessWithAuthResult: () => {
        window.location.href = '/index.html';
        return false; // don’t auto-redirect
      }
    },
    signInFlow: 'popup',
    signInOptions: [
      // email/password
      firebaseui.auth.EmailAuthProvider.PROVIDER_ID,
      // Google
      firebaseui.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    // Optional:
    tosUrl:     '/',  
    privacyPolicyUrl: '/'
  };

  // 3) Launch FirebaseUI:
  const ui = new firebaseui.auth.AuthUI(auth);
  ui.start('#firebaseui-auth-container', uiConfig);
});
