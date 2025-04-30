// server.js
const express = require('express');
const path    = require('path');
const admin   = require('firebase-admin');

const app = express();

// ── 0) Body parser for JSON ───────────────────────────────────────────────
app.use(express.json());

// ── 1) Initialize Firebase Admin SDK ─────────────────────────────────────
// Needs FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in env
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const dbAdmin   = admin.firestore();
const authAdmin = admin.auth();

// ── 2) Expose your Firebase config to the client ─────────────────────────
app.get('/env.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.__env__ = {
      FIREBASE_API_KEY:            "${process.env.FIREBASE_API_KEY}",
      FIREBASE_AUTH_DOMAIN:        "${process.env.FIREBASE_AUTH_DOMAIN}",
      FIREBASE_PROJECT_ID:         "${process.env.FIREBASE_PROJECT_ID}",
      FIREBASE_STORAGE_BUCKET:     "${process.env.FIREBASE_STORAGE_BUCKET}",
      FIREBASE_MESSAGING_SENDER_ID:"${process.env.FIREBASE_MESSAGING_SENDER_ID}",
      FIREBASE_APP_ID:             "${process.env.FIREBASE_APP_ID}"
    };
  `);
});

// ── 3) In-memory “database” keyed by code ────────────────────────────────
const builds = {};
function makeCode(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

// ── 4) API: Save a new build ─────────────────────────────────────────────
app.post('/api/builds', (req, res) => {
  const { creator, character, powers, items, timestamp } = req.body;
  if (
    !creator ||
    !character ||
    !Array.isArray(powers) ||
    !Array.isArray(items)
  ) {
    return res.status(400).json({ error: 'creator, character, powers & items required' });
  }
  const code = makeCode();
  builds[code] = { code, creator, character, powers, items, timestamp };
  res.json({
    code,
    url: `/${encodeURIComponent(creator)}/${encodeURIComponent(character)}/${code}`
  });
});

// ── 5) API: List all builds ───────────────────────────────────────────────
app.get('/api/builds', (req, res) => {
  res.json(Object.values(builds));
});

// ── 6) API: Fetch one build by code ──────────────────────────────────────
app.get('/api/builds/:code', (req, res) => {
  const b = builds[req.params.code];
  if (!b) return res.status(404).json({ error: 'Build not found' });
  res.json(b);
});

// ── 7) Migration logic ─────────────────────────────────────────────────────
async function migrateProfiles() {
  let pageToken = undefined;
  do {
    const listUsersResult = await authAdmin.listUsers(1000, pageToken);
    pageToken = listUsersResult.pageToken;
    for (const userRecord of listUsersResult.users) {
      const uid = userRecord.uid;
      const ref = dbAdmin.collection('profiles').doc(uid);
      const snap = await ref.get();
      const base = {
        displayName: userRecord.displayName || userRecord.email,
        avatarURL:   userRecord.photoURL   || '/images/default-avatar.png',
        color:       '#888888'
      };
      if (!snap.exists) {
        await ref.set(base);
        console.log(`Created profile for ${uid}`);
      } else {
        const updates = {};
        const data = snap.data();
        if (!data.displayName) updates.displayName = base.displayName;
        if (!data.avatarURL)   updates.avatarURL   = base.avatarURL;
        if (!data.color)       updates.color       = base.color;
        if (Object.keys(updates).length) {
          await ref.set(updates, { merge: true });
          console.log(`Updated profile for ${uid}`, updates);
        }
      }
    }
  } while (pageToken);
}

// ── 8) Protected migration endpoint ───────────────────────────────────────
app.post('/migrate-profiles', async (req, res) => {
  if (req.query.secret !== process.env.MIGRATE_SECRET) {
    return res.status(403).send('Forbidden');
  }
  try {
    await migrateProfiles();
    res.send('Migration complete');
  } catch (err) {
    console.error('Migration error', err);
    res.status(500).send('Migration failed');
  }
});

// ── 9) Dynamic route for pretty share URLs ────────────────────────────────
app.get('/:creator/:character/:code', (req, res, next) => {
  const { creator, character, code } = req.params;
  const b = builds[code];
  if (!b || b.creator !== creator || b.character !== character) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public/viewer.html'));
});

// ── 10) Serve static files & fallback ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ── 11) Start the server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));