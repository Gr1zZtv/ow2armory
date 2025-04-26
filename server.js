const express = require('express');
const path    = require('path');
const app     = express();

// 1) Serve your static front end
app.use(express.static(path.join(__dirname, 'public')));

// 2) JSON API endpoints
app.get('/api/heroes',   (req,res)=>{/* fetch from DB or JSON */});
app.get('/api/globals',  (req,res)=>{/* … */});
app.post('/api/builds',  (req,res)=>{/* save to DB */});

// 3) Fallback to index.html (for client-side routing, if any)
app.get('*', (req,res)=> {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Listening on ${port}`));