// viewer-auth.js
let auth0;

window.addEventListener('DOMContentLoaded', async () => {
  // 1) Initialize the Auth0 client
  auth0 = await createAuth0Client({
    domain:        'YOUR_AUTH0_DOMAIN',      // e.g. dev-xxx.us.auth0.com
    client_id:     'YOUR_VIEWER_CLIENT_ID',  // from your SPA app
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
    audience:      'https://my-armory-api',  // match your server's JWT audience
    redirect_uri:  window.location.origin + '/index.html'
  });

  // 2) If returning from Auth0 with code/state, handle it
  if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
    await auth0.handleRedirectCallback();
    window.history.replaceState({}, document.title, '/index.html');
  }

  // 3) Wire up buttons
  document.getElementById('btnLogin').onclick = () =>
    auth0.loginWithRedirect({ redirect_uri: window.location.origin + '/index.html' });

  document.getElementById('btnSignup').onclick = () =>
    auth0.loginWithRedirect({
      redirect_uri: window.location.origin + '/index.html',
      screen_hint:  'signup'
    });

  document.getElementById('btnLogout').onclick = () =>
    auth0.logout({ returnTo: window.location.origin + '/index.html' });

  // 4) Check authentication state
  const isAuthenticated = await auth0.isAuthenticated();

  document.getElementById('btnLogin').hidden  = isAuthenticated;
  document.getElementById('btnSignup').hidden = isAuthenticated;
  document.getElementById('btnLogout').hidden = !isAuthenticated;

  // 5) If authenticated, show profile form and load data
  if (isAuthenticated) {
    document.getElementById('profileSection').hidden = false;

    // Fetch existing profile from your server
    const token = await auth0.getTokenSilently();
    const profile = await fetch('/api/profile', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    // Populate form fields
    document.getElementById('profileDisplayName').value = profile.displayName || '';
    document.getElementById('profileColor').value       = profile.color       || '#ffffff';

    // Handle form submission
    document.getElementById('profileForm').onsubmit = async e => {
      e.preventDefault();
      const updates = {
        displayName: document.getElementById('profileDisplayName').value,
        color:       document.getElementById('profileColor').value
      };
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) alert('Profile saved!');
      else alert('Error saving profile');
    };

    // Now that login is done, you can safely initialize the rest of your viewer:
    // e.g. call initViewer() from viewerfunctions.js
    if (typeof initViewer === 'function') initViewer();
  }
});