// public/widgets/navbar.mjs

import { auth } from '../firebase-config.js';

function buildNavbar() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="nav-container">
      <a href="index.html" class="logo">Armory</a>
      <nav class="nav-links">
        <a href="index.html">Home</a>
        <a href="viewer.html">Builder</a>
        <a href="admin.html">Admin</a>
      </nav>
      <div class="user-panel">
        <img class="user-avatar" src="" alt="User avatar" hidden>
        <span class="user-name"></span>
        <button class="btn-logout" hidden>Log Out</button>
      </div>
    </div>
  `;
  document.body.prepend(header);
}

function wireAuthUI() {
  const avatar   = document.querySelector('.user-avatar');
  const nameSpan = document.querySelector('.user-name');
  const logout   = document.querySelector('.btn-logout');

  auth.onAuthStateChanged(user => {
    if (user) {
      // show avatar & name & logout
      avatar.src       = user.photoURL || '/images/default-avatar.png';
      avatar.hidden    = false;
      nameSpan.textContent = user.displayName || user.email;
      logout.hidden    = false;
      logout.onclick   = () => auth.signOut().then(() => {
        // optionally redirect to login page
        window.location.href = '/login.html';
      });
    } else {
      avatar.hidden = true;
      nameSpan.textContent = '';
      logout.hidden = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildNavbar();
  wireAuthUI();
});
