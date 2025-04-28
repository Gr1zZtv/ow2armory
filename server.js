// server.js
const express = require('express');
const path    = require('path');
const app     = express();

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

// ── 2) Serve your static files ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── 3) Fallback all other routes to index.html ───────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ── 4) Start the server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
