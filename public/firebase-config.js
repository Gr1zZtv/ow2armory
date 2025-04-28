// public/firebase-config.js
// ——————————
// 1) Pull in exactly the bits we need from the CDN (modular v9)
// ——————————
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth }        from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore }   from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

// ——————————
// 2) Your Firebase project settings (from the console “SDK setup”)
// ——————————
const firebaseConfig = {
  apiKey:            "firebaseapikey",
  authDomain:        "armoryapi-37b1a.firebaseapp.com",
  projectId:         "armoryapi-37b1a",
  storageBucket:     "armoryapi-37b1a.appspot.com",
  messagingSenderId: "892353609908",
  appId:             "1:892353609908:web:6eaf26924b3224799f57e1"
};

// ——————————
// 3) Initialize the core services
// ——————————
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ——————————
// 4) Export them for use elsewhere in your scripts
// ——————————
export { auth, db };
