/**
 * Onboarding — Google or Guest required before browsing education portal.
 */
(function (global) {
  'use strict';

  const PORTAL_PATH = '/portal/education/';
  const OVERLAY_ID = 'anyoOnboardingOverlay';
  const ENTRY_KEY = 'anyo_entry_choice_v1';
  const STYLE_ID = 'anyoOnboardingStyles';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent = `
      #anyoOnboardingOverlay.anyo-onboard-overlay{
        position:fixed !important;
        top:0 !important;
        left:0 !important;
        right:0 !important;
        bottom:0 !important;
        width:100vw !important;
        height:100vh !important;
        height:100dvh !important;
        margin:0 !important;
        z-index:2147483000 !important;
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        padding:max(12px, env(safe-area-inset-top)) 16px max(12px, env(safe-area-inset-bottom)) !important;
        box-sizing:border-box !important;
        overflow-y:auto !important;
        -webkit-overflow-scrolling:touch;
        background:rgba(2,6,23,.84) !important;
        backdrop-filter:blur(8px);
        overscroll-behavior:contain;
      }
      #anyoOnboardingOverlay .anyo-onboard-card{
        position:relative;
        width:min(420px,100%);
        max-height:calc(100dvh - 24px);
        margin:auto !important;
        overflow-y:auto;
        flex-shrink:0;
        background:linear-gradient(165deg,rgba(15,23,42,.98),rgba(30,41,59,.94));
        border:1px solid rgba(103,232,249,.28);
        border-radius:20px;
        padding:1.35rem 1.25rem 1.15rem;
        box-shadow:0 24px 64px rgba(0,0,0,.45);
        color:#f8fafc;
        text-align:center;
        box-sizing:border-box;
      }
      #anyoOnboardingOverlay .anyo-onboard-card .eyebrow{
        margin:0 0 .35rem;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:#67e8f9
      }
      #anyoOnboardingOverlay .anyo-onboard-card h2{
        margin:0 0 .55rem;font-size:clamp(1.15rem,4vw,1.35rem);line-height:1.25;color:#f8fafc;font-weight:800
      }
      #anyoOnboardingOverlay .anyo-onboard-lead{
        margin:0 0 .9rem;font-size:.9rem;line-height:1.5;color:#94a3b8
      }
      #anyoOnboardingOverlay .anyo-onboard-actions{
        display:grid;gap:.65rem;margin:.25rem 0 .85rem
      }
      #anyoOnboardingOverlay .anyo-onboard-actions .saas-oauth-btn,
      #anyoOnboardingOverlay .anyo-onboard-actions .anyo-onboard-guest{
        width:100%;min-height:44px;justify-content:center
      }
      #anyoOnboardingOverlay .anyo-onboard-fine{
        margin:.65rem 0 0;font-size:.75rem;line-height:1.4;color:#64748b
      }
      #anyoOnboardingOverlay .anyo-country-field{
        margin:.15rem 0 0;text-align:left
      }
      #anyoOnboardingOverlay .anyo-country-field label{
        display:block;font-size:.8rem;margin-bottom:.25rem;color:#94a3b8
      }
      #anyoOnboardingOverlay .anyo-country-select{
        width:100%;padding:.55rem .65rem;border:1px solid rgba(148,163,184,.35);
        border-radius:8px;background:rgba(15,23,42,.9);color:#f8fafc
      }
      #anyoOnboardingOverlay .anyo-country-hint{
        margin:.35rem 0 0;font-size:.72rem;color:#64748b
      }
      html.anyo-onboard-locked,body.anyo-onboard-locked{
        overflow:hidden !important;height:100% !important;touch-action:none
      }
      body.anyo-onboard-locked > *:not(#anyoOnboardingOverlay){
        pointer-events:none !important;user-select:none
      }
      body.anyo-onboard-locked #anyoOnboardingOverlay{pointer-events:auto !important}
    `;
    document.head.appendChild(css);
  }

  function getEntryChoice() {
    try {
      return localStorage.getItem(ENTRY_KEY) || '';
    } catch {
      return '';
    }
  }

  function setEntryChoice(choice) {
    try {
      localStorage.setItem(ENTRY_KEY, choice);
    } catch {
      /* ignore */
    }
  }

  function needsOnboarding() {
    return !getEntryChoice();
  }

  function getChosenCountryId() {
    const el = document.getElementById('anyoCountryPick');
    return el?.value?.trim() || '';
  }

  function googleSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path fill="#4285F4" d="M22 12c0-.82-.07-1.42-.2-2.04H12v3.72h5.76c-.12 1-.76 2.52-2.17 3.94l-.02.14 3.15 2.45.22.02C21.3 18.1 22 15.24 22 12z"/><path fill="#34A853" d="M12 22c2.88 0 5.3-.95 7.07-2.58l-3.37-2.62c-.9.62-2.1 1.05-3.7 1.05-2.83 0-5.22-1.9-6.08-4.47l-.13.01-3.3 2.55-.04.12C4.06 19.55 7.7 22 12 22z"/><path fill="#FBBC05" d="M5.92 9.53A6.5 6.5 0 0 1 5.6 8c0-.53.05-1.04.15-1.53l-.01-.15-3.34-2.6-.11.05A10.9 10.9 0 0 0 2 8c0 1.77.42 3.45 1.16 4.93l3.76-2.4z"/><path fill="#EA4335" d="M12 4.38c1.62 0 2.72.7 3.35 1.28l2.45-2.45C17.28 1.85 14.88 1 12 1 7.7 1 4.06 3.45 2.16 7.07l3.76 2.4C6.78 6.9 9.17 5 12 5c.73 0 1.43.1 2.08.28z"/></svg>';
  }

  function countryOptionsHtml(countries) {
    const opts = ['<option value="">Choose your country (optional)</option>'];
    countries.forEach((c) => {
      opts.push(`<option value="${c.id}">${c.flag || '🌍'} ${c.title}</option>`);
    });
    return opts.join('');
  }

  function overlayHtml(countries) {
    const countrySelect =
      countries.length > 0
        ? `<div class="anyo-country-field">
            <label for="anyoCountryPick">Your country (optional)</label>
            <select id="anyoCountryPick" class="anyo-country-select">${countryOptionsHtml(countries)}</select>
            <p class="anyo-country-hint">Leave blank and we will suggest a starting curriculum.</p>
          </div>`
        : '';

    // Buttons first so they stay visible above the fold; country is optional below.
    return `
      <div class="anyo-onboard-card" role="dialog" aria-modal="true" aria-labelledby="anyoOnboardTitle">
        <p class="eyebrow">Brahmexa Anyo Academy</p>
        <h2 id="anyoOnboardTitle">How do you want to enter?</h2>
        <p class="anyo-onboard-lead">
          Choose <strong>Continue with Google</strong> for full access, or <strong>Browse as Guest</strong> for read-only exploration.
        </p>
        <div class="anyo-onboard-actions">
          <button type="button" class="saas-oauth-btn" id="anyoOnboardGoogle">
            ${googleSvg()} Continue with Google
          </button>
          <button type="button" class="saas-btn saas-btn-ghost anyo-onboard-guest" id="anyoOnboardGuest">
            Browse as Guest
          </button>
        </div>
        ${countrySelect}
        <p class="anyo-onboard-fine">Guest access is view-only. Sign in with Google to submit answers, take tests, and save progress.</p>
      </div>`;
  }

  function removeOverlay() {
    document.getElementById(OVERLAY_ID)?.remove();
    document.documentElement.classList.remove('anyo-onboard-locked');
    document.body.classList.remove('anyo-onboard-locked');
  }

  function wireOverlayActions(el) {
    el.querySelector('#anyoOnboardGoogle')?.addEventListener('click', async () => {
      const btn = el.querySelector('#anyoOnboardGoogle');
      btn.disabled = true;
      const chosen = getChosenCountryId();
      if (chosen) global.AnyoCountryResolution?.setChosenCountry?.(chosen);
      try {
        const profile = await global.SaasAuth.simulateOAuth('google', 'Google Student');
        profile.locale = global.navigator?.language || 'en-US';
        await global.SaasAuth.completeRegistrationWithCountry(profile, { chosenCountryId: chosen });
        setEntryChoice('google');
        removeOverlay();
      } catch {
        btn.disabled = false;
        btn.innerHTML = `${googleSvg()} Continue with Google`;
      }
    });

    el.querySelector('#anyoOnboardGuest')?.addEventListener('click', async () => {
      const btn = el.querySelector('#anyoOnboardGuest');
      btn.disabled = true;
      const chosen = getChosenCountryId();
      if (chosen) global.AnyoCountryResolution?.setChosenCountry?.(chosen);
      await global.SaasAuth.completeGuestWithCountry({ chosenCountryId: chosen });
      setEntryChoice('guest');
      removeOverlay();
    });

    el.addEventListener('click', (e) => {
      if (e.target === el) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  async function showOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;
    ensureStyles();
    let countries = [];
    try {
      countries = (await global.AnyoCountryResolution?.listCountriesForPicker?.()) || [];
    } catch {
      countries = [];
    }

    const el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.className = 'anyo-onboard-overlay';
    el.setAttribute('role', 'presentation');
    el.innerHTML = overlayHtml(countries);
    // Always attach as last body child so fixed centering is relative to the viewport.
    document.body.appendChild(el);
    document.documentElement.classList.add('anyo-onboard-locked');
    document.body.classList.add('anyo-onboard-locked');
    wireOverlayActions(el);
    // Keep dialog in view if a parent layout shifted scroll.
    try {
      window.scrollTo(0, 0);
      el.scrollTop = 0;
      el.querySelector('#anyoOnboardGoogle')?.focus?.({ preventScroll: true });
    } catch {
      /* ignore */
    }
  }

  async function applyResolutionIfNeeded() {
    const u = global.SaasAuth?.getUser?.();
    if (!u?.id) return;
    if (!global.AnyoCountryResolution) return;
    const stored = global.AnyoCountryResolution.getStored();
    if (stored?.landingCountryId) return;
    await global.AnyoCountryResolution.resolveUserCountry({
      user: u,
      profile: { locale: u.locale, countryCode: u.countryCode },
    });
  }

  function init() {
    const onPortal = global.location.pathname.startsWith(PORTAL_PATH);
    if (!onPortal) return;

    if (needsOnboarding()) {
      showOverlay();
      return;
    }

    removeOverlay();
    applyResolutionIfNeeded();
  }

  function runWhenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  runWhenReady(init);
  global.addEventListener('saas:auth', () => {
    if (!needsOnboarding()) removeOverlay();
  });
  document.addEventListener('anyo:bootstrap-ready', init);

  global.AnyoOnboarding = { init, showOverlay, removeOverlay, needsOnboarding, setEntryChoice };
})(typeof window !== 'undefined' ? window : globalThis);
