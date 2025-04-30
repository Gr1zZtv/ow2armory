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

// ── 2) In-memory “database” for community builds ───────────────────────────
const builds = [];
let nextId = 1;

// ── 3) API: Save a new build ─────────────────────────────────────────────
app.post('/api/builds', (req, res) => {
  const { heroName, powers, items, timestamp } = req.body;
  if (!heroName || !Array.isArray(powers) || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid build payload' });
  }
  const id = String(nextId++);
  builds.push({ id, heroName, powers, items, timestamp });
  res.json({ id });
});

// ── 4) API: List all builds ───────────────────────────────────────────────
app.get('/api/builds', (req, res) => {
  res.json(builds);
});

// ── 5) API: Fetch one build by ID ────────────────────────────────────────
app.get('/api/builds/:id', (req, res) => {
  const b = builds.find(x => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: 'Build not found' });
  res.json(b);
});

// ── 6) Serve static files from /public ───────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── 7) Fallback all other routes to index.html ───────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ── 8) Start the server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
