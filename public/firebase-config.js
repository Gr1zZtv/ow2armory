// public/firebase-config.js

// ── 1) Pull in only the bits we need from Firebase’s CDN (v9 modular) ─────────────────
import { initializeApp }               from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth }                     from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore }                from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// ── 2) Read your Firebase config from Render’s env vars ────────────────────────────────
// In your Render service settings, add these keys under “Environment Variables”:
//   FIREBASE_API_KEY
//   FIREBASE_AUTH_DOMAIN
//   FIREBASE_PROJECT_ID
//   FIREBASE_STORAGE_BUCKET
//   FIREBASE_MESSAGING_SENDER_ID
//   FIREBASE_APP_ID
//
// Then Render will inject them at runtime.
const firebaseConfig = {
  apiKey:            window.__env__.FIREBASE_API_KEY,
  authDomain:        window.__env__.FIREBASE_AUTH_DOMAIN,
  projectId:         window.__env__.FIREBASE_PROJECT_ID,
  storageBucket:     window.__env__.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.__env__.FIREBASE_MESSAGING_SENDER_ID,
  appId:             window.__env__.FIREBASE_APP_ID
};

// ── 3) Initialize the SDKs ─────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── 4) Export for use in your other modules ────────────────────────────────────────────
export { auth, db };
