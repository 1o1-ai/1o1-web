/**
 * Guest read-only access — blocks submits, tests, practice, and mock exams on education portal.
 */
(function (global) {
  'use strict';

  const GUEST_MESSAGE =
    'Please sign in with Google to continue. Guest access is view-only.';

  const WRITE_CLICK_SELECTOR = [
    '#btnSubmitMock',
    '#btnEvaluate',
    '#btnEvaluateSubmit',
    '#evalConfirm',
    '#evalCancel',
    '#btnReveal',
    '#btnNext',
    '#btnStart',
    '#btnSubmit',
    '#btnPost',
    '#btnSend',
    '#btnRun',
    '#btnDemoRun',
    '#lluDemoRun',
    'button[type="submit"]',
    'input[type="submit"]',
    '[data-requires-auth]',
    '[data-write-action]',
  ].join(',');

  function isEducationPath() {
    return (global.location?.pathname || '').includes('/portal/education');
  }

  function currentUser() {
    return global.SaasAuth?.getUser?.() || null;
  }

  function isPracticeDrillPage() {
    return /\/practice\.html(?:$|\?)/i.test(global.location?.pathname || '');
  }

  function isBlockedWriteTarget(el) {
    if (!el) return false;
    // World practice/mock drills are read-only reveal flows — allow guests to try them.
    if (isPracticeDrillPage() && el.matches('#btnStart, #btnReveal, #btnNext')) {
      return false;
    }
    return el.matches(WRITE_CLICK_SELECTOR);
  }

  function isRegistered() {
    return Boolean(global.SaasAuth?.isRegistered?.());
  }

  function canWrite() {
    if (!isEducationPath()) return true;
    return isRegistered() && !isGuest();
  }

  function showGuestPrompt() {
    if (global.AnyoOnboarding?.showOverlay) {
      global.AnyoOnboarding.showOverlay();
    } else if (global.SaasAuth?.openRegisterModal) {
      global.SaasAuth.openRegisterModal({ allowDismiss: true });
    }
    const toast = document.createElement('div');
    toast.className = 'anyo-guest-toast';
    toast.setAttribute('role', 'alert');
    toast.textContent = GUEST_MESSAGE;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, 4800);
  }

  function guardWrite(event) {
    if (canWrite()) return true;
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    }
    showGuestPrompt();
    return false;
  }

  function mountGuestBanner() {
    if (!isEducationPath() || !isGuest() || document.getElementById('anyoGuestBanner')) return;
    const bar = document.createElement('div');
    bar.id = 'anyoGuestBanner';
    bar.className = 'anyo-guest-banner';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span>Guest mode — browse only.</span> <button type="button" class="anyo-guest-banner-btn" id="anyoGuestUpgrade">Sign in with Google</button>';
    document.body.prepend(bar);
    bar.querySelector('#anyoGuestUpgrade')?.addEventListener('click', () => showGuestPrompt());
  }

  function wireGlobalGuards() {
    if (!isEducationPath()) return;

    document.addEventListener(
      'click',
      (e) => {
        if (canWrite()) return;
        const blocked = e.target.closest(WRITE_CLICK_SELECTOR);
        if (blocked && isBlockedWriteTarget(blocked)) guardWrite(e);
      },
      true
    );

    document.addEventListener(
      'submit',
      (e) => {
        if (!canWrite()) guardWrite(e);
      },
      true
    );

    document.addEventListener('keydown', (e) => {
      if (canWrite() || e.key !== 'Enter') return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'textarea' && e.target.closest('#phaseEvaluate, #prActive, .practice-card')) {
        guardWrite(e);
      }
    });
  }

  function wireFormGuard(root) {
    const scope = root || document;
    scope.querySelectorAll('form[data-requires-auth], [data-write-action]').forEach((el) => {
      if (el.dataset.anyoGuardWired) return;
      el.dataset.anyoGuardWired = '1';
      el.addEventListener('submit', (e) => {
        if (!canWrite()) guardWrite(e);
      });
      if (el.matches('[data-write-action]')) {
        el.addEventListener('click', (e) => {
          if (!canWrite()) guardWrite(e);
        });
      }
    });
  }

  function init() {
    wireGlobalGuards();
    wireFormGuard(document);
    mountGuestBanner();
    global.addEventListener('saas:auth', () => {
      document.getElementById('anyoGuestBanner')?.remove();
      if (isGuest()) mountGuestBanner();
    });
    global.dispatchEvent(new CustomEvent('anyo:access-ready', { detail: { isGuest: isGuest() } }));
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    init();
  }

  function scheduleStart() {
    const usesBootstrap = Boolean(document.querySelector('script[src*="anyo-education-bootstrap"]'));
    if (!usesBootstrap || global.SaasAuth) {
      start();
      return;
    }
    document.addEventListener('anyo:bootstrap-ready', start, { once: true });
  }

  document.addEventListener('DOMContentLoaded', scheduleStart);
  scheduleStart();

  global.AnyoAccess = {
    isGuest,
    isRegistered,
    canWrite,
    guardWrite,
    showGuestPrompt,
    wireFormGuard,
    GUEST_MESSAGE,
  };
})(typeof window !== 'undefined' ? window : globalThis);
