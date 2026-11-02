/* yogabrata.com sign-in gate for the home-page items (not JanDrishti, which has its own).
 * Load synchronously as the first thing in <head>: <script src="/assets/site-gate.js"></script>
 * Passwords are checked by the yogabrata-gate Worker (ops/yogabrata-gate); nothing secret is here.
 * This hides pages from casual visitors; it does not make the files private (the repo is public). */
(function () {
  'use strict';
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = local ? 'http://127.0.0.1:8793' : 'https://yogabrata-auth.brahmexa.com';
  var KEY = 'yogabrata_gate_session';
  var root = document.documentElement;

  function session() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return v && v.expires > Date.now() ? v : null;
    } catch (e) { return null; }
  }
  function save(v) {
    try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch (e) { /* storage blocked */ }
  }

  var s = session();
  if (s) {
    // Show immediately; re-check with the server and lock again if the session was revoked.
    fetch(API + '/check', { headers: { Authorization: 'Bearer ' + s.token } }).then(function (r) {
      if (r.status === 401) { save(null); location.reload(); }
    }).catch(function () { /* offline: keep the cached session */ });
    window.yogabrataSignOut = function () { save(null); location.reload(); };
    return;
  }

  root.style.visibility = 'hidden';

  var CSS = [
    ':host{all:initial;position:fixed;inset:0;z-index:2147483647;visibility:visible;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef6fb}',
    '.bg{position:absolute;inset:0;background:radial-gradient(ellipse at 80% -10%,#16405a 0,transparent 45%),radial-gradient(ellipse at 0% 100%,#2a1e3f 0,transparent 45%),#070d18;overflow:hidden}',
    '.ring{position:absolute;border:1px solid #52d3d026;border-radius:50%;left:55%;top:-30vh}',
    '.r1{width:70vh;height:70vh}.r2{width:100vh;height:100vh;margin:-15vh;border-color:#f0b25a1f}.r3{width:130vh;height:130vh;margin:-30vh}',
    '.wrap{position:relative;min-height:100%;display:grid;place-items:center;padding:24px 16px;box-sizing:border-box}',
    'form{width:min(380px,100%);box-sizing:border-box;background:#0d1b2bcc;backdrop-filter:blur(8px);border:1px solid #2a4a63;border-radius:22px;padding:28px 24px 20px;display:grid;gap:6px;box-shadow:0 20px 60px #0009}',
    '.mark{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;border:1.5px solid #52d3d0;color:#52d3d0;font-weight:800;font-size:22px;position:relative;margin-bottom:8px;background:#11303d}',
    '.mark:before{content:"";position:absolute;width:82px;height:24px;border:1px solid #f0b25a;border-radius:50%;transform:rotate(-28deg)}',
    '.eyebrow{color:#52d3d0;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}',
    'h1{margin:0;font-size:26px;letter-spacing:-.03em;font-weight:750}',
    '.sub{margin:0 0 10px;color:#b9cddb;font-size:14px}',
    'label{font-size:13px;font-weight:600;color:#c9dbe6;margin-top:6px}',
    'input{font:inherit;font-size:16px;color:#eef6fb;background:#081422;border:1px solid #35566e;border-radius:11px;padding:12px 13px;outline:none}',
    'input:focus{border-color:#52d3d0;box-shadow:0 0 0 2px #52d3d055}',
    '.err{min-height:20px;margin:6px 0 0;color:#ff9c8a;font-size:13px;font-weight:600}',
    'button{font:inherit;margin-top:4px;border:0;border-radius:12px;padding:13px;background:#52d3d0;color:#04212a;font-weight:750;font-size:16px;cursor:pointer}',
    'button:disabled{opacity:.6;cursor:default}',
    '.foot{margin:10px 0 0;color:#a3b9c8;font-size:12px;text-align:center}',
    '.foot a{color:#52d3d0}'
  ].join('');

  function mount() {
    var host = document.createElement('div');
    host.setAttribute('id', 'yogabrata-gate');
    var shadow = host.attachShadow({ mode: 'open' });
    var title = (document.title || 'Yogabrata').split(/[|·—–-]/)[0].trim();
    shadow.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="bg"><span class="ring r1"></span><span class="ring r2"></span><span class="ring r3"></span></div>' +
      '<div class="wrap"><form novalidate autocomplete="on">' +
      '<div class="mark" aria-hidden="true">Y</div><div class="eyebrow">Yogabrata · Brahmexa</div>' +
      '<h1></h1><p class="sub">Sign in to continue</p>' +
      '<label for="u">User ID</label><input id="u" name="username" autocomplete="username" autocapitalize="none" spellcheck="false">' +
      '<label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password">' +
      '<p class="err" role="alert"></p><button type="submit">Sign in</button>' +
      '<p class="foot">One sign-in opens every Yogabrata project. User IDs are not case-sensitive.<br><a href="/">← Back to all projects</a></p>' +
      '</form></div>';
    shadow.querySelector('h1').textContent = title;
    root.appendChild(host);

    var form = shadow.querySelector('form'), u = shadow.getElementById('u'), p = shadow.getElementById('p');
    var err = shadow.querySelector('.err'), btn = shadow.querySelector('button');
    setTimeout(function () { u.focus(); }, 0);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!u.value.trim() || !p.value) { err.textContent = 'Enter your user ID and password.'; return; }
      btn.disabled = true;
      err.textContent = '';
      fetch(API + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: u.value.trim(), password: p.value }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, status: r.status, b: b }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.b.error || 'Sign-in failed (HTTP ' + res.status + ')');
          save(res.b);
          host.remove();
          root.style.visibility = '';
        })
        .catch(function (e2) {
          err.textContent = e2.message === 'Failed to fetch' ? 'Cannot reach the sign-in service. Check your connection.' : e2.message;
          btn.disabled = false;
          p.value = '';
          p.focus();
        });
    });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
