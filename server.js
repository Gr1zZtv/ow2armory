// server.js
const express = require('express');
const path    = require('path');

const app = express();

// ── 0) Body parser for JSON ───────────────────────────────────────────────
app.use(express.json());

// ── 1) Expose your Firebase config to the client ─────────────────────────
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

// ── 2) In-memory “database” keyed by code ────────────────────────────────
const builds = {};
function makeCode(len = 6) {
  // generate a random uppercase alphanumeric code
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

// ── 3) API: Save a new build ─────────────────────────────────────────────
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
  // return both the code and the full pretty URL
  res.json({
    code,
    url: `/${encodeURIComponent(creator)}/${encodeURIComponent(character)}/${code}`
  });
});

// ── 4) API: List all builds ───────────────────────────────────────────────
app.get('/api/builds', (req, res) => {
  res.json(Object.values(builds));
});

// ── 5) API: Fetch one build by code ──────────────────────────────────────
app.get('/api/builds/:code', (req, res) => {
  const b = builds[req.params.code];
  if (!b) return res.status(404).json({ error: 'Build not found' });
  res.json(b);
});

// ── 6) Dynamic route for pretty share URLs ────────────────────────────────
app.get('/:creator/:character/:code', (req, res, next) => {
  const { creator, character, code } = req.params;
  // Optional: validate the build exists & matches creator+character
  const b = builds[code];
  if (!b || b.creator !== creator || b.character !== character) {
    return next(); // fall back to 404/static handler
  }
  // serve viewer.html (it will parse the path and load the build via JS)
  res.sendFile(path.join(__dirname, 'public/viewer.html'));
});

// ── 7) Serve static files & catch-all ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ── 8) Start the server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
