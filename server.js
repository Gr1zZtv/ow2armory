// server.js

const express = require('express');
const path    = require('path');
const axios   = require('axios');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa            = require('jwks-rsa');

const app = express();

// ── Load Auth0 config from env vars ────────────────────────────────────────
const AUTH0_DOMAIN        = process.env.AUTH0_DOMAIN;            // e.g. 'dev-...auth0.com'
const MGMT_CLIENT_ID      = process.env.AUTH0_MGMT_CLIENT_ID;    // from your M2M app
const MGMT_CLIENT_SECRET  = process.env.AUTH0_MGMT_CLIENT_SECRET;
if (!AUTH0_DOMAIN || !MGMT_CLIENT_ID || !MGMT_CLIENT_SECRET) {
  console.error('Missing AUTH0_DOMAIN or MGMT_CLIENT_ env vars!');
  process.exit(1);
}

// ── JWT middleware to protect API endpoints ───────────────────────────────
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: `https://${AUTH0_DOMAIN}/api/v2/`,
  issuer:   `https://${AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

// ── Management API token handling ─────────────────────────────────────────
let mgmtToken = null;

// Fetch a fresh Management API token
async function renewMgmtToken() {
  try {
    const resp = await axios.post(`https://${AUTH0_DOMAIN}/oauth/token`, {
      grant_type:    'client_credentials',
      client_id:     MGMT_CLIENT_ID,
      client_secret: MGMT_CLIENT_SECRET,
      audience:      `https://${AUTH0_DOMAIN}/api/v2/`
    });
    mgmtToken = resp.data.access_token;
    console.log('✅ Obtained new Auth0 Management API token');
  } catch (err) {
    console.error('❌ Failed to obtain Management API token', err.response?.data || err.message);
  }
}

// Initial fetch + refresh every 24h
renewMgmtToken();
setInterval(renewMgmtToken, 1000 * 60 * 60 * 24);

// ── Static assets ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // for parsing JSON in PATCH /api/profile

// ── Protected profile endpoints ───────────────────────────────────────────

// GET /api/profile → returns the user_metadata object
app.get('/api/profile', checkJwt, async (req, res) => {
  try {
    const userId = encodeURIComponent(req.auth.sub);
    const resp = await axios.get(
      `https://${AUTH0_DOMAIN}/api/v2/users/${userId}`,
      { headers: { Authorization: `Bearer ${mgmtToken}` } }
    );
    res.json(resp.data.user_metadata || {});
  } catch (err) {
    console.error('Error fetching profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

// PATCH /api/profile → replaces the user_metadata object
app.patch('/api/profile', checkJwt, async (req, res) => {
  try {
    const userId = encodeURIComponent(req.auth.sub);
    const resp = await axios.patch(
      `https://${AUTH0_DOMAIN}/api/v2/users/${userId}`,
      { user_metadata: req.body },
      { headers: {
          Authorization: `Bearer ${mgmtToken}`,
          'Content-Type': 'application/json'
      }}
    );
    res.json(resp.data.user_metadata);
  } catch (err) {
    console.error('Error updating profile:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

// ── Fallback to index.html for client-side routes ─────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
