// public/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth }       from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore }  from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// 1) Ensure env.js has run
const cfg = window.__env__;
if (!cfg) throw new Error('Make sure <script src="/env.js"></script> is included before this module');

const firebaseConfig = {
  apiKey:            cfg.FIREBASE_API_KEY,
  authDomain:        cfg.FIREBASE_AUTH_DOMAIN,
  projectId:         cfg.FIREBASE_PROJECT_ID,
  storageBucket:     cfg.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: cfg.FIREBASE_MESSAGING_SENDER_ID,
  appId:             cfg.FIREBASE_APP_ID
};

// 2) Initialize
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };
