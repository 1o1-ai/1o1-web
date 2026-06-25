/**
 * Simple portal sign-in for yogabrata.com (sessionStorage).
 */
(function (global) {
  'use strict';

  const SESSION_KEY = 'yogabrata_portal_user';

  const USERS = {
    aam: 'aam',
    sas: 'sas',
    meghnad: 'meghnad',
    sujoy: 'sujoy',
    pradip: 'pradip',
    biplab: 'biplab',
    hamsa: 'hamsa',
  };

  function getSession() {
    const u = sessionStorage.getItem(SESSION_KEY);
    return u && USERS[u] ? u : null;
  }

  function login(username, password) {
    const user = String(username || '')
      .trim()
      .toLowerCase();
    const pass = String(password || '');
    if (USERS[user] && USERS[user] === pass) {
      sessionStorage.setItem(SESSION_KEY, user);
      return user;
    }
    return null;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isAuthPage() {
    const p = global.location?.pathname || '';
    return p.includes('/portal/') && !p.includes('admin.html');
  }

  function mountLoginGate() {
    if (!isAuthPage() || getSession()) return;

    const overlay = document.createElement('div');
    overlay.className = 'portal-login-overlay';
    overlay.innerHTML = `
      <div class="portal-login-card" role="dialog" aria-labelledby="portalLoginTitle">
        <p class="eyebrow">ManjuLAB Portal</p>
        <h2 id="portalLoginTitle">Sign in to continue</h2>
        <p class="portal-login-lead">Use your student or teacher username and password.</p>
        <form id="portalLoginForm" class="portal-login-form">
          <label>Username <input type="text" id="portalLoginUser" autocomplete="username" required /></label>
          <label>Password <input type="password" id="portalLoginPass" autocomplete="current-password" required /></label>
          <p id="portalLoginError" class="login-error" hidden></p>
          <button type="submit" class="btn-portal btn-portal-primary">Sign in</button>
        </form>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('portal-login-locked');

    const form = overlay.querySelector('#portalLoginForm');
    const err = overlay.querySelector('#portalLoginError');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = overlay.querySelector('#portalLoginUser')?.value;
      const pass = overlay.querySelector('#portalLoginPass')?.value;
      if (login(user, pass)) {
        overlay.remove();
        document.body.classList.remove('portal-login-locked');
        global.dispatchEvent(new CustomEvent('portal:auth', { detail: { user: getSession() } }));
        const btn = document.getElementById('btnLogout');
        if (btn) {
          btn.hidden = false;
          btn.removeAttribute('aria-hidden');
        }
        return;
      }
      if (err) {
        err.hidden = false;
        err.textContent = 'Invalid username or password.';
      }
    });
  }

  function wireLogoutButton() {
    const btn = document.getElementById('btnLogout');
    if (!btn) return;
    const user = getSession();
    if (user) {
      btn.hidden = false;
      btn.removeAttribute('aria-hidden');
      btn.textContent = `Sign out (${user})`;
    }
    btn.addEventListener('click', () => {
      logout();
      global.location.href = '/portal/';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    mountLoginGate();
    wireLogoutButton();
  });

  global.PortalAuth = { getSession, login, logout, USERS, mountLoginGate };
  global.getPortalSession = getSession;
  global.portalLogout = () => {
    logout();
    global.location.href = '/portal/';
  };
})(typeof window !== 'undefined' ? window : globalThis);
