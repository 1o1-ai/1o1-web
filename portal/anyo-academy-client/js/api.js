/*
  Author: Yogabrata Mukhopadhyay
  Organization: Brahmexa
  Copyright (c) 2026 Brahmexa. All rights reserved.

  Direct Education API client. yogabrata.com is on the portal Origin allowlist,
  so the browser can call the API without a local proxy.
*/
(function (global) {
  'use strict';

  var DEFAULT_BASE = 'https://api.brahmando.com/education';

  function base() {
    try {
      var stored = sessionStorage.getItem('anyo_api_base');
      if (stored) return stored.replace(/\/$/, '');
    } catch (e) { /* ignore */ }
    return DEFAULT_BASE;
  }

  /* The Education API requires a credential on every route. This page is
     served from GitHub Pages, so the token can never be baked into the
     source — it is pasted by the operator and kept in sessionStorage, which
     drops it when the tab closes. */
  var TOKEN_KEY = 'anyo_api_token';

  function token() {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function setToken(value) {
    try {
      if (value) sessionStorage.setItem(TOKEN_KEY, value);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* private mode — no persistence, calls still work this tab */ }
  }

  function call(spec) {
    var method = (spec.method || 'GET').toUpperCase();
    var path = spec.path || '/';
    if (path.charAt(0) !== '/') path = '/' + path;
    var url = (spec.base || base()) + path;
    var query = spec.query || {};
    var qs = Object.keys(query)
      .filter(function (k) { return query[k] != null && String(query[k]) !== ''; })
      .map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]);
      })
      .join('&');
    if (qs) url += '?' + qs;

    var headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    /* An explicit spec.bearer still wins, so a caller can override per call. */
    var auth = spec.bearer || token();
    if (auth) headers.Authorization = 'Bearer ' + auth;

    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutMs = spec.timeout_ms || 90000;
    var timer = ctrl
      ? setTimeout(function () { ctrl.abort(); }, timeoutMs)
      : null;

    var started = performance.now();
    return fetch(url, {
      method: method,
      headers: headers,
      body: method === 'GET' || method === 'HEAD'
        ? undefined
        : (typeof spec.body === 'string' ? spec.body : JSON.stringify(spec.body || {})),
      signal: ctrl ? ctrl.signal : undefined,
      credentials: 'omit',
      mode: 'cors',
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var parsed = null;
          try { parsed = text ? JSON.parse(text) : null; } catch (e) { /* keep text */ }
          return {
            ok: res.ok,
            status: res.status,
            url: url,
            method: method,
            elapsed_ms: Math.round(performance.now() - started),
            bytes: text ? text.length : 0,
            json: parsed,
            text: parsed == null ? text : null,
          };
        });
      })
      .catch(function (err) {
        return {
          ok: false,
          status: 0,
          url: url,
          method: method,
          elapsed_ms: Math.round(performance.now() - started),
          error: err.name === 'AbortError'
            ? 'timed out after ' + Math.round(timeoutMs / 1000) + 's'
            : String(err.message || err),
        };
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  global.AnyoApi = {
    call: call,
    base: base,
    DEFAULT_BASE: DEFAULT_BASE,
    token: token,
    setToken: setToken,
    TOKEN_KEY: TOKEN_KEY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
