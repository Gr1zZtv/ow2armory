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
        <span class="site-user__name" hidden></span>
        <a href="/login.html" class="site-user__login" hidden>Log In</a>
        <div class="site-user__menu" hidden>
          <a href="/profile.html" class="site-user__menu-item">Profile</a>
          <a href="/settings.html" class="site-user__menu-item">Settings</a>
          <button class="site-user__menu-item site-user__logout">Log Out</button>
        </div>
      </div>
    </div>`;
  document.body.prepend(header);
}

function wireAuthUI() {
  const avatar = document.querySelector('.site-user__avatar');
  const name   = document.querySelector('.site-user__name');
  const login  = document.querySelector('.site-user__login');
  const menu   = document.querySelector('.site-user__menu');
  const logout = menu.querySelector('.site-user__logout');

  auth.onAuthStateChanged(user => {
    if (user) {
      // show avatar & name, hide “Log In”
      avatar.src        = user.photoURL || '/images/default-avatar.png';
      avatar.hidden     = false;
      name.textContent  = user.displayName || user.email;
      name.hidden       = false;
      login.hidden      = true;

      // toggle dropdown when clicking avatar or name
      const toggleMenu = () => menu.hidden = !menu.hidden;
      avatar.onclick = toggleMenu;
      name.onclick   = toggleMenu;

      // hide dropdown when clicking elsewhere
      document.addEventListener('click', e => {
        if (!menu.contains(e.target) && e.target !== avatar && e.target !== name) {
          menu.hidden = true;
        }
      });

      // wire up Log Out
      logout.onclick = () => {
        auth.signOut().then(() => {
          menu.hidden   = true;
          avatar.hidden = true;
          name.hidden   = true;
          login.hidden  = false;
          location.href = '/login.html';
        });
      };
    } else {
      // signed out → show “Log In”, hide everything else
      avatar.hidden = true;
      name.hidden   = true;
      menu.hidden   = true;
      login.hidden  = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildNavbar();
  wireAuthUI();
});
