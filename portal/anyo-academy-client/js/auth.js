/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Access gate for Anyo Academy Client on yogabrata.com.
  GitHub Pages cannot enforce HTTP Basic Auth, so this mirrors the portal's
  session gate with the credentials requested for this surface.
*/
(function (global) {
  'use strict';

  var SESSION_KEY = 'anyo_academy_client_user';

  // username -> password (exact match, case-sensitive password)
  var USERS = {
    yoga: 'yoga',
    deepak: 'Deepak@2026%100#',
  };

  var LABELS = {
    yoga: 'Yoga',
    deepak: 'Deepak',
  };

  function normalizeUser(u) {
    return String(u || '').trim().toLowerCase();
  }

  function getSession() {
    var u = null;
    try { u = sessionStorage.getItem(SESSION_KEY); } catch (e) { return null; }
    return u && USERS[u] != null ? u : null;
  }

  function login(username, password) {
    var user = normalizeUser(username);
    var pass = String(password || '');
    if (USERS[user] != null && USERS[user] === pass) {
      try { sessionStorage.setItem(SESSION_KEY, user); } catch (e) { /* ignore */ }
      return user;
    }
    return null;
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  function mountGate(onReady) {
    if (getSession()) {
      if (typeof onReady === 'function') onReady(getSession());
      return;
    }

    var overlay = document.createElement('div');
    overlay.id = 'anyoAuthGate';
    overlay.className = 'auth-gate';
    overlay.innerHTML =
      '<div class="auth-card" role="dialog" aria-labelledby="anyoAuthTitle">' +
        '<p class="eyebrow">Anyo Academy Client</p>' +
        '<h1 id="anyoAuthTitle">Sign in</h1>' +
        '<p class="auth-lead">Basic access for the Education API study console on yogabrata.com.</p>' +
        '<form id="anyoAuthForm" class="auth-form" autocomplete="on">' +
          '<label>Username<input id="anyoUser" name="username" type="text" autocomplete="username" required /></label>' +
          '<label>Password<input id="anyoPass" name="password" type="password" autocomplete="current-password" required /></label>' +
          '<p id="anyoAuthErr" class="auth-err" hidden></p>' +
          '<button type="submit" class="btn btn--primary">Enter</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add('is-locked');

    overlay.querySelector('#anyoAuthForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var user = login(
        overlay.querySelector('#anyoUser').value,
        overlay.querySelector('#anyoPass').value
      );
      var err = overlay.querySelector('#anyoAuthErr');
      if (!user) {
        err.hidden = false;
        err.textContent = 'Invalid username or password.';
        return;
      }
      overlay.remove();
      document.body.classList.remove('is-locked');
      if (typeof onReady === 'function') onReady(user);
    });
  }

  function labelFor(user) {
    return LABELS[user] || user;
  }

  global.AnyoAuth = {
    getSession: getSession,
    login: login,
    logout: logout,
    mountGate: mountGate,
    labelFor: labelFor,
  };
})(typeof window !== 'undefined' ? window : globalThis);
