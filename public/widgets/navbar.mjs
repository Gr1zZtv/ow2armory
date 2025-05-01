// public/widgets/navbar.mjs
import { auth } from '../firebase-config.js';

function buildNavbar() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="nav-container">
      <!-- Logo + title -->
      <a href="/index.html" class="logo">
        <img src="/images/logo.png" alt="Logo">
        <span>The Armory</span>
      </a>

      <!-- Horizontal nav, no bullets -->
      <div class="nav-links">
        <a href="/index.html">Home</a>
        <a href="/viewer.html">Builder</a>
        <a href="/admin.html">Admin</a>
      </div>

      <!-- User area -->
      <div class="site-user">
        <img    class="site-user__avatar" src=""                  alt="Avatar" hidden>
        <span   class="site-user__name"></span>
        <a      class="site-user__login"  href="/login.html"      hidden>Log In</a>
        <button class="site-user__login site-user__logout"       hidden>Log Out</button>
      </div>
    </div>`;
  document.body.prepend(header);
}

function wireAuthUI() {
  const avatar = document.querySelector('.site-user__avatar');
  const name   = document.querySelector('.site-user__name');
  const login  = document.querySelector('.site-user__login');
  const logout = document.querySelector('.site-user__logout');

  auth.onAuthStateChanged(user => {
    if (user) {
      // signed in
      avatar.src       = user.photoURL || '/images/default-avatar.png';
      avatar.hidden    = false;
      name.textContent = user.displayName || user.email;
      logout.hidden    = false;
      login.hidden     = true;

      logout.onclick = () =>
        auth.signOut().then(() => window.location.href = '/login.html');
    } else {
      // signed out
      avatar.hidden    = true;
      name.textContent = '';
      logout.hidden    = true;
      login.hidden     = false;
      login.href       = '/login.html';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildNavbar();
  wireAuthUI();
});
