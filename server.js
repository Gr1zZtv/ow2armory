const express = require('express');
const path    = require('path');
const app     = express();

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for client-side routing (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
