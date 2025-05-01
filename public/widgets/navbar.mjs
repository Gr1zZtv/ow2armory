// public/widgets/navbar.mjs
import { auth } from '../firebase-config.js';

function buildNavbar() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="nav-container">
      <a href="/index.html" class="logo">
        <img src="/images/logo.png" alt="Logo">
        <span>The Armory</span>
      </a>
      <nav class="site-nav">
        <ul>
          <li><a href="/index.html">Home</a></li>
          <li><a href="/viewer.html">Builder</a></li>
          <li><a href="/admin.html">Admin</a></li>
        </ul>
      </nav>
      <div class="site-user">
        <img class="site-user__avatar" src="" alt="Avatar" hidden>
        <span class="site-user__name"></span>
        <a href="/login.html" class="site-user__login" hidden>Log In</a>
        <button class="site-user__logout" hidden>Log Out</button>
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
      // Signed in
      avatar.src       = user.photoURL || '/images/default-avatar.png';
      avatar.hidden    = false;
      name.textContent = user.displayName || user.email;
      logout.hidden    = false;
      login.hidden     = true;
      logout.onclick   = () =>
        auth.signOut().then(() => window.location.href = '/login.html');
    } else {
      // Signed out
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
