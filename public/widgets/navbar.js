// public/widgets/navbar.js

// WARNING: uses document.write — runs *before* the browser starts rendering,
// so you won’t see any flicker or empty placeholder.
document.write(`
  <header class="site-header">
    <div class="site-header__inner">
      <a href="index.html" class="site-header__logo">
        <img src="images/logo.png" alt="The Armory">
        <span>The Armory</span>
      </a>
      <nav class="site-nav">
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="viewer.html">Builder</a></li>
          <li><a href="admin.html">Admin</a></li>
          <li><a href="profile.html">Profile</a></li>
        </ul>
      </nav>
      <div class="site-user">
        <img src="images/default-avatar.png" class="site-user__avatar" alt="">
        <span class="site-user__name">Guest</span>
        <a href="login.html" class="site-user__login">Log In</a>
      </div>
    </div>
  </header>
`);