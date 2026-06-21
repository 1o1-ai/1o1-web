/**
 * ManjuLAB Online Portal — login modal & navigation helpers
 * Demo credentials: yoga / yoga
 */
(function () {
  const STORAGE_KEY = 'manjulab_portal_session';
  const DEMO_USER = 'yoga';
  const DEMO_PASS = 'yoga';
  const ACADEMY_NAME = 'Anyo Brahmando Academy';
  const ACADEMY_TAGLINE = 'A different path to knowledge, infinite possibility';

  window.PORTAL_ACADEMY = { name: ACADEMY_NAME, tagline: ACADEMY_TAGLINE };

  function getSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.username) return null;
      return data;
    } catch {
      return null;
    }
  }

  function setSession(data) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function showLoginError(modal, message) {
    let err = modal.querySelector('#loginError');
    if (!err) return;
    err.textContent = message;
    err.hidden = !message;
  }

  function ensureLoginModal() {
    let el = document.getElementById('portalLoginModal');
    if (el) return el;

    el = document.createElement('div');
    el.id = 'portalLoginModal';
    el.className = 'modal-backdrop';
    el.innerHTML = `
      <div class="modal-panel" role="dialog" aria-labelledby="loginTitle">
        <h3 id="loginTitle">Sign in</h3>
        <p class="modal-sub" id="loginSub">ManjuLAB Online Portal</p>
        <div id="rolePickWrap" class="role-pick" hidden>
          <button type="button" data-role="student" class="active">Student</button>
          <button type="button" data-role="teacher">Teacher</button>
        </div>
        <label for="loginUser">Username</label>
        <input id="loginUser" type="text" placeholder="yoga" autocomplete="username" />
        <label for="loginPass">Password</label>
        <input id="loginPass" type="password" placeholder="yoga" autocomplete="current-password" />
        <p id="loginError" class="login-error" hidden></p>
        <div class="modal-actions">
          <button type="button" class="btn-portal btn-portal-ghost" id="loginCancel">Cancel</button>
          <button type="button" class="btn-portal btn-portal-primary" id="loginSubmit">Continue</button>
        </div>
        <p class="modal-sub" style="margin-top:14px;margin-bottom:0;font-size:0.72rem">Demo login: <strong>yoga</strong> / <strong>yoga</strong></p>
      </div>`;
    document.body.appendChild(el);

    el.querySelector('#loginCancel').addEventListener('click', () => closeLoginModal());
    el.addEventListener('click', (e) => {
      if (e.target === el) closeLoginModal();
    });

    el.querySelectorAll('.role-pick button').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        el.querySelectorAll('.role-pick button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    return el;
  }

  function closeLoginModal() {
    const el = document.getElementById('portalLoginModal');
    if (el) el.classList.remove('open');
  }

  /**
   * @param {{ title?: string, subtitle?: string, showRoles?: boolean, teacherDisabled?: boolean, vertical?: string, onSuccess?: (session: object) => void }} opts
   */
  window.openPortalLogin = function openPortalLogin(opts) {
    opts = opts || {};
    const modal = ensureLoginModal();
    modal.querySelector('#loginTitle').textContent = opts.title || 'Sign in';
    modal.querySelector('#loginSub').textContent = opts.subtitle || ACADEMY_NAME;
    showLoginError(modal, '');

    const roleWrap = modal.querySelector('#rolePickWrap');
    if (opts.showRoles) {
      roleWrap.hidden = false;
      roleWrap.querySelector('[data-role="student"]').classList.add('active');
      roleWrap.querySelector('[data-role="teacher"]').classList.remove('active');
      const teacherBtn = roleWrap.querySelector('[data-role="teacher"]');
      teacherBtn.disabled = !!opts.teacherDisabled;
      if (opts.teacherDisabled) teacherBtn.title = 'Teacher view coming soon';
    } else {
      roleWrap.hidden = true;
    }

    const session = getSession();
    modal.querySelector('#loginUser').value = session?.username || '';
    modal.querySelector('#loginPass').value = '';

    const submit = modal.querySelector('#loginSubmit');
    const newSubmit = submit.cloneNode(true);
    submit.parentNode.replaceChild(newSubmit, submit);
    newSubmit.addEventListener('click', () => {
      const username = modal.querySelector('#loginUser').value.trim();
      const password = modal.querySelector('#loginPass').value;
      if (username !== DEMO_USER || password !== DEMO_PASS) {
        showLoginError(modal, 'Invalid username or password. Use yoga / yoga for demo access.');
        return;
      }
      let role = 'subscriber';
      if (opts.showRoles) {
        const active = roleWrap.querySelector('.role-pick button.active');
        role = active ? active.getAttribute('data-role') : 'student';
      }
      const data = { username, role, vertical: opts.vertical || null, ts: Date.now() };
      setSession(data);
      if (window.AnyoPresence) {
        window.AnyoPresence.startHeartbeat(data);
      }
      closeLoginModal();
      if (typeof opts.onSuccess === 'function') opts.onSuccess(data);
    });

    modal.classList.add('open');
    modal.querySelector('#loginUser').focus();
  };

  window.requirePortalLogin = function requirePortalLogin(opts) {
    opts = opts || {};
    const session = getSession();
    if (session && session.username) {
      return session;
    }
    openPortalLogin(opts);
    return null;
  };

  window.getPortalSession = getSession;

  window.portalLogout = function portalLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = '/portal/';
  };

  /** Folder cards on SaaS hub */
  document.addEventListener('DOMContentLoaded', () => {
    const session = getSession();
    if (session && window.AnyoPresence) {
      window.AnyoPresence.startHeartbeat(session);
    }
    if (window.AnyoPresence && typeof window.AnyoPresence.mountOnlineBadges === 'function') {
      window.AnyoPresence.mountOnlineBadges();
    }

    document.querySelectorAll('[data-portal-folder]').forEach((card) => {
      card.addEventListener('click', () => {
        const vertical = card.getAttribute('data-portal-folder');
        const live = card.getAttribute('data-live') === 'true';
        const href = card.getAttribute('data-href');

        if (!live && href) {
          window.open(href, '_blank', 'noopener');
          return;
        }

        const session = getSession();
        if (session && href) {
          window.location.href = href;
          return;
        }

        openPortalLogin({
          title: card.querySelector('.folder-label')?.textContent?.trim() || ACADEMY_NAME,
          subtitle: ACADEMY_TAGLINE,
          vertical,
          onSuccess: () => {
            if (href) window.location.href = href;
          },
        });
      });
    });

    document.querySelectorAll('[data-sku-login]').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.disabled) return;
        const live = card.getAttribute('data-live') === 'true';
        if (!live) return;

        const session = getSession();
        if (session) {
          const role = session.role === 'teacher' ? 'teacher' : 'student';
          window.location.href = `/portal/education/cbse10/index.html`;
          return;
        }

        openPortalLogin({
          title: 'CBSE 10 Core',
          subtitle: `${ACADEMY_NAME} · choose your role`,
          showRoles: true,
          teacherDisabled: false,
          vertical: 'education',
          onSuccess: () => {
            window.location.href = `/portal/education/cbse10/index.html`;
          },
        });
      });
    });
  });
})();
