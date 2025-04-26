const express = require('express');
const path    = require('path');
const app     = express();
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa            = require('jwks-rsa');

// 1) Middleware to validate the access token
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `dev-bx2itlkpy8ayes2m.us.auth0.com/.well-known/jwks.json`
  }),
  audience: 'https://dev-bx2itlkpy8ayes2m.us.auth0.com/api/v2/',   // create an API in Auth0 to get this, or use your Client ID
  issuer:   `dev-bx2itlkpy8ayes2m.us.auth0.com`,
  algorithms: ['RS256']
});

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for client-side routing (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
