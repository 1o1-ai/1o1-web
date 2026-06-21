/**
 * Yogabrata SaaS auth — education API login, profile menu, shared across landing pages.
 */
(function (global) {
  'use strict';

  const TOKEN_KEY = 'ml_student_token';
  const USER_KEY = 'ml_student_user';
  const EDUCATION_API = 'https://api.brahmando.com/education';

  let cachedUser = null;
  let cachedSub = null;

  function apiBase() {
    if (global.location.hostname.endsWith('yogabrata.com')) return EDUCATION_API;
    if (global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1') {
      return EDUCATION_API;
    }
    return EDUCATION_API;
  }

  function token() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    if (token()) h.Authorization = 'Bearer ' + token();
    return h;
  }

  function initials(name) {
    const parts = String(name || 'U').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || 'U').toUpperCase();
  }

  function emitChange() {
    global.dispatchEvent(new CustomEvent('saas-auth-changed', { detail: { user: cachedUser } }));
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    cachedUser = null;
    cachedSub = null;
    emitChange();
    mountAuthNav('saasAuthNav');
  }

  async function fetchMe() {
    if (!token()) {
      cachedUser = null;
      cachedSub = null;
      return null;
    }
    try {
      const res = await fetch(apiBase() + '/auth/me', { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error('Session expired');
      if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
      cachedUser = data.user || data;
      cachedSub = data.subscription || null;
      localStorage.setItem(USER_KEY, JSON.stringify(cachedUser));
      return data;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      cachedUser = null;
      cachedSub = null;
      return null;
    }
  }

  async function login(email, password) {
    const res = await fetch(apiBase() + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = typeof data.detail === 'string' ? data.detail : data.detail?.message || 'Sign in failed';
      throw new Error(msg);
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    cachedUser = data.user;
    cachedSub = data.subscription || null;
    localStorage.setItem(USER_KEY, JSON.stringify(cachedUser));
    emitChange();
    return data;
  }

  function getUser() {
    if (cachedUser) return cachedUser;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return !!token();
  }

  function subLabel() {
    if (!cachedSub) return 'No plan';
    if (cachedSub.access_active) {
      return cachedSub.status === 'trial' ? 'Free trial' : 'Subscribed';
    }
    return cachedSub.status || 'Inactive';
  }

  function ensureLoginModal() {
    let el = document.getElementById('saasLoginModal');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'saasLoginModal';
    el.className = 'saas-modal-backdrop';
    el.innerHTML = `
      <div class="saas-modal-panel" role="dialog" aria-labelledby="saasLoginTitle">
        <button type="button" class="saas-modal-close" id="saasLoginClose" aria-label="Close">&times;</button>
        <h3 id="saasLoginTitle">Sign in</h3>
        <p class="saas-modal-sub">Anyo Brahmando Academy · CBSE Class 10 SaaS</p>
        <form id="saasLoginForm">
          <label for="saasEmail">Email</label>
          <input id="saasEmail" name="email" type="email" autocomplete="email" required placeholder="you@school.com" />
          <label for="saasPassword">Password</label>
          <input id="saasPassword" name="password" type="password" autocomplete="current-password" required />
          <p id="saasLoginError" class="saas-login-error" hidden></p>
          <button type="submit" class="saas-btn saas-btn-primary">Sign in</button>
        </form>
        <p class="saas-modal-foot">
          New here? <a href="/subscribe/">Create account &amp; subscribe</a>
        </p>
        <p class="saas-modal-demo">Demo: <code>student.amit@yogabrata.com</code> / <code>Test@2026</code></p>
      </div>`;
    document.body.appendChild(el);

    el.querySelector('#saasLoginClose').addEventListener('click', closeLoginModal);
    el.addEventListener('click', (e) => {
      if (e.target === el) closeLoginModal();
    });
    el.querySelector('#saasLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = el.querySelector('#saasLoginError');
      errEl.hidden = true;
      const email = el.querySelector('#saasEmail').value;
      const password = el.querySelector('#saasPassword').value;
      const btn = el.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      try {
        await login(email, password);
        closeLoginModal();
        mountAuthNav('saasAuthNav');
      } catch (err) {
        errEl.textContent = err.message || 'Sign in failed';
        errEl.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    });
    return el;
  }

  function openLoginModal() {
    const modal = ensureLoginModal();
    modal.classList.add('open');
    modal.querySelector('#saasEmail').focus();
  }

  function closeLoginModal() {
    const el = document.getElementById('saasLoginModal');
    if (el) el.classList.remove('open');
  }

  function closeProfileMenu() {
    document.querySelectorAll('.saas-profile-menu.open').forEach((m) => m.classList.remove('open'));
    document.querySelectorAll('.saas-profile-trigger[aria-expanded="true"]').forEach((t) => {
      t.setAttribute('aria-expanded', 'false');
    });
  }

  function mountAuthNav(containerId) {
    const host = document.getElementById(containerId);
    if (!host) return;

    const user = getUser();
    if (!token() || !user) {
      host.innerHTML =
        '<button type="button" class="saas-btn saas-btn-ghost saas-login-btn" id="saasOpenLogin">Log in</button>' +
        '<a class="saas-btn saas-btn-primary" href="/subscribe/">Subscribe</a>';
      host.querySelector('#saasOpenLogin')?.addEventListener('click', openLoginModal);
      return;
    }

    const name = user.full_name || user.email || 'Account';
    const role = user.role || 'student';
    const sub = subLabel();
    const ini = initials(name);

    host.innerHTML = `
      <div class="saas-profile-wrap">
        <button type="button" class="saas-profile-trigger" id="saasProfileBtn" aria-expanded="false" aria-haspopup="true">
          <span class="saas-avatar" aria-hidden="true">${ini}</span>
          <span class="saas-profile-text">
            <span class="saas-profile-name">${name}</span>
            <span class="saas-profile-meta">${role === 'teacher' ? 'Teacher' : sub}</span>
          </span>
          <span class="saas-chevron" aria-hidden="true">▾</span>
        </button>
        <div class="saas-profile-menu" id="saasProfileMenu" role="menu">
          <div class="saas-profile-menu-head">
            <span class="saas-avatar saas-avatar-lg">${ini}</span>
            <div>
              <strong>${name}</strong>
              <span>${user.email || ''}</span>
            </div>
          </div>
          <a href="/account/" role="menuitem">My account</a>
          <a href="/subscribe/" role="menuitem">${cachedSub?.access_active ? 'Manage subscription' : 'Subscribe'}</a>
          <a href="/portal/education/" role="menuitem">Study portal</a>
          ${role === 'teacher' ? '<a href="https://api.brahmando.com/education/widget/teacher-review.html" role="menuitem">Teacher review</a>' : ''}
          <button type="button" id="saasSignOut" role="menuitem">Sign out</button>
        </div>
      </div>`;

    const trigger = host.querySelector('#saasProfileBtn');
    const menu = host.querySelector('#saasProfileMenu');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    host.querySelector('#saasSignOut').addEventListener('click', signOut);

    document.addEventListener('click', closeProfileMenu, { once: true });
  }

  async function init() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) cachedUser = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (token()) await fetchMe();
    mountAuthNav('saasAuthNav');
    emitChange();
  }

  global.YogabrataAuth = {
    TOKEN_KEY,
    EDUCATION_API,
    apiBase,
    token,
    headers,
    login,
    fetchMe,
    signOut,
    getUser,
    isLoggedIn,
    openLoginModal,
    closeLoginModal,
    mountAuthNav,
    init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
