// /src/server.js
const express = require('express');
const path    = require('path');
const app     = express();

// 1) Serve everything in /public as static
app.use(express.static(path.join(__dirname, '../public')));

// 2) Fallback so deep-links still load index.html (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 3) Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
