// public/widgets/navbar.mjs
import { auth } from '../firebase-config.js';

function buildNavbar() {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="site-header__inner">
      <a href="index.html" class="site-header__logo">
        <img src="/images/logo.png" alt="Logo"><span>The Armory</span>
      </a>
      <nav class="site-nav">
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="viewer.html">Builder</a></li>
          <li><a href="admin.html">Admin</a></li>
        </ul>
      </nav>
      <div class="site-user">
        <a href="#" id="profileLink" class="site-user__link">
          <img id="userAvatar" class="site-user__avatar" src="" alt="Avatar" hidden>
          <span id="userName"   class="site-user__name"></span>
        </a>
        <button id="btnLogout" class="site-user__login" hidden>Log Out</button>
      </div>
    </div>
  `;
  document.body.prepend(header);
}

function wireAuthUI() {
  const avatarEl    = document.getElementById('userAvatar');
  const nameEl      = document.getElementById('userName');
  const linkEl      = document.getElementById('profileLink');
  const logoutBtn   = document.getElementById('btnLogout');

  auth.onAuthStateChanged(user => {
    if (user) {
      // point link to their profile by UID
      linkEl.href = `/profile.html?uid=${user.uid}`;

      // show avatar / name / logout
      avatarEl.src          = user.photoURL || '/images/default-avatar.png';
      avatarEl.hidden       = false;
      nameEl.textContent    = user.displayName || user.email;
      logoutBtn.hidden      = false;
    } else {
      // if not signed in, link to login
      linkEl.href       = '/login.html';
      avatarEl.hidden   = true;
      nameEl.textContent = 'Sign In';
      logoutBtn.hidden  = true;
    }
  });

  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      window.location.href = '/login.html';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildNavbar();
  wireAuthUI();
});
