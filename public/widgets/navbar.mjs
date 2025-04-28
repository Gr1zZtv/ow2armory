// public/widgets/navbar.mjs
import { auth } from '../firebase-config.js';
import { onAuthStateChanged, signOut } 
  from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// 1) Stamp out the header HTML
document.write(`
  <header class="site-header">
    <div class="site-header__inner">
      <a href="index.html" class="site-header__logo">
        <img src="images/logo.png" alt="The Armory"><span>The Armory</span>
      </a>
      <nav class="site-nav"><ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="viewer.html">Builder</a></li>
        <li><a href="admin.html">Admin</a></li>
        <li><a href="profile.html">Profile</a></li>
      </ul></nav>
      <div class="site-user">
        <img src="/images/default-avatar.png" class="site-user__avatar" alt="">
        <span class="site-user__name">Guest</span>
        <a href="/login.html" class="site-user__login">Log In</a>
      </div>
    </div>
  </header>
`);

// 2) Update avatar / name / log-in-out as soon as auth state changes
onAuthStateChanged(auth, user => {
  const avatarEl = document.querySelector('.site-user__avatar');
  const nameEl   = document.querySelector('.site-user__name');
  const linkEl   = document.querySelector('.site-user__login');

  if (user) {
    // show actual user
    avatarEl.src           = user.photoURL || '/images/default-avatar.png';
    nameEl.textContent     = user.displayName || user.email;
    linkEl.textContent     = 'Log Out';
    linkEl.href            = '#';
    linkEl.onclick         = e => {
      e.preventDefault();
      signOut(auth).then(() => window.location.href = '/login.html');
    };
  } else {
    // revert to Guest
    avatarEl.src           = '/images/default-avatar.png';
    nameEl.textContent     = 'Guest';
    linkEl.textContent     = 'Log In';
    linkEl.href            = '/login.html';
    linkEl.onclick         = null;
  }
});
