// server.js

const express = require('express');
const path    = require('path');

const app = express();

// ── Serve static assets (your public folder) ───────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Fallback to index.html for client-side routing ────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ── Start the server ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
