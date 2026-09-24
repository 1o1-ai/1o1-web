/**
 * Signature country shortcuts — large flank portals with flag + landmark.
 */
(function () {
  const MANIFEST_URL = '/portal/education/assets/world-countries.json';
  const ACTIVE_KEY = 'anyo_signature_active_country';
  const H = window.AnyoEducationHub;
  const CFG = () => window.AnyoCountryConfig;
  const USERS = () => window.AnyoUserCountries;
  const RESOLVE = () => window.AnyoCountryResolution;

  let manifestCache = null;

  function esc(s) {
    return H ? H.esc(s) : String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  function currentUser() {
    return window.PortalAuth?.getSession?.() || window.getPortalSession?.() || null;
  }

  function saasUser() {
    return window.SaasAuth?.getUser?.() || null;
  }

  function activeCountryId() {
    const stored = RESOLVE()?.getStored?.();
    if (stored?.landingCountryId && stored.supported) return stored.landingCountryId;
    return sessionStorage.getItem(ACTIVE_KEY) || stored?.detectedCountryId || '';
  }

  function setActiveCountryId(id) {
    if (id) sessionStorage.setItem(ACTIVE_KEY, id);
    else sessionStorage.removeItem(ACTIVE_KEY);
  }

  function countryById(manifest, id) {
    return (manifest.countries || []).find((c) => c.id === id || c.slug === id);
  }

  function shortcutIdsForUser(username) {
    const hardcoded = USERS()?.forUser(username);
    if (hardcoded?.length) return hardcoded.slice(0, 2);

    const subs = saasUser()?.subscribedCountries;
    if (Array.isArray(subs) && subs.length) return subs.slice(0, 2);

    const stored = RESOLVE()?.getStored?.();
    if (stored?.shortcuts) {
      return [stored.shortcuts.left, stored.shortcuts.right].filter(Boolean);
    }

    const ids = RESOLVE()?.getShortcutCountryIds?.();
    if (ids?.length) return ids.slice(0, 2);

    return [RESOLVE()?.DEFAULT_LEFT || 'india', RESOLVE()?.DEFAULT_RIGHT || 'usa'];
  }

  function signatureItem(country, isActive) {
    const u = CFG()?.metaFor(country) || {};
    const code = u.code || country.id.slice(0, 2).toUpperCase();
    const css = H?.flagClass?.(country.id) || 'portal--country-generic';
    const flag = country.flag || '🌍';
    const landmark = u.landmark || '🌍';
    const landmarkLabel = u.landmarkLabel || '';
    const curriculum = u.curriculumLine || country.subtitle || '';
    const grades = u.grades || '';
    const primary = u.emblemPrimary || 'flag';
    const emblemMain = primary === 'landmark' ? landmark : flag;
    const emblemAlt = primary === 'landmark' ? flag : landmark;
    const activeClass = isActive ? ' signature-country--active' : '';
    const detectedClass = isActive ? ' signature-country--detected' : '';

    return `<a class="portal ${css} signature-country-portal${activeClass}${detectedClass}"
      href="${esc(country.href)}" data-country-id="${esc(country.id)}"
      title="${esc(country.title)} — ${esc(curriculum)}">
      <div class="portal-ring"></div>
      <div class="portal-orbit"></div>
      <div class="portal-core">
        <span class="sig-emblem-main" aria-hidden="true">${emblemMain}</span>
        <span class="sig-emblem-alt" aria-hidden="true">${emblemAlt}</span>
        <span class="portal-title">${esc(country.title)}</span>
        <span class="portal-sub">${esc(code)}</span>
        <span class="sig-hover-panel">
          ${landmarkLabel ? `<span class="sig-landmark-name">${esc(landmarkLabel)}</span>` : ''}
          <span class="sig-curriculum-line">${esc(curriculum)}</span>
          <span class="sig-grades-line">${esc(grades)}</span>
        </span>
      </div>
    </a>`;
  }

  function bindPortal(link) {
    link.addEventListener('click', () => {
      const id = link.getAttribute('data-country-id');
      if (id) setActiveCountryId(id);
    });
  }

  function setSlot(mount, html) {
    if (!mount) return;
    if (!html) {
      mount.hidden = true;
      mount.innerHTML = '';
      mount.setAttribute('aria-hidden', 'true');
      return;
    }
    mount.hidden = false;
    mount.removeAttribute('aria-hidden');
    mount.innerHTML = html;
    mount.querySelectorAll('.signature-country-portal').forEach(bindPortal);
  }

  function renderPanel(manifest, username) {
    const leftMount = document.getElementById('signatureCountryLeft');
    const rightMount = document.getElementById('signatureCountryRight');
    const legacyMount = document.getElementById('signatureCountriesMount');

    const ids = shortcutIdsForUser(username);
    const active = activeCountryId();
    const countries = ids.map((id) => countryById(manifest, id)).filter(Boolean);

    if (!countries.length) {
      setSlot(leftMount, '');
      setSlot(rightMount, '');
      if (legacyMount) {
        legacyMount.hidden = true;
        legacyMount.innerHTML = '';
      }
      return;
    }

    const left = countries[0] ? signatureItem(countries[0], countries[0].id === active) : '';
    const right = countries[1] ? signatureItem(countries[1], countries[1].id === active) : '';

    setSlot(leftMount, left);
    setSlot(rightMount, right);

    if (legacyMount) {
      legacyMount.hidden = true;
      legacyMount.innerHTML = '';
    }
  }

  function refresh() {
    const portalUser = currentUser();
    const saas = saasUser();
    const leftMount = document.getElementById('signatureCountryLeft');
    const rightMount = document.getElementById('signatureCountryRight');

    if (!portalUser && !saas && !RESOLVE()?.getStored?.()) {
      setSlot(leftMount, '');
      setSlot(rightMount, '');
      return;
    }
    if (!manifestCache) return;
    renderPanel(manifestCache, portalUser || saas?.name || '');
  }

  function onManifest(manifest) {
    manifestCache = manifest;
    refresh();
  }

  async function loadManifestIfNeeded() {
    if (manifestCache) return manifestCache;
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      manifestCache = await res.json();
      return manifestCache;
    } catch {
      return null;
    }
  }

  document.addEventListener('anyo:world-hub-ready', (e) => onManifest(e.detail || {}));

  document.addEventListener('anyo:country-resolved', async () => {
    await loadManifestIfNeeded();
    refresh();
  });

  document.addEventListener('portal:auth', async (e) => {
    await loadManifestIfNeeded();
    const user = e.detail?.user || currentUser();
    if (manifestCache) renderPanel(manifestCache, user);
  });

  global.addEventListener('saas:auth', async () => {
    await loadManifestIfNeeded();
    refresh();
  });

  document.addEventListener('DOMContentLoaded', async () => {
    await loadManifestIfNeeded();
    refresh();
  });

  window.AnyoSignatureCountries = {
    refresh,
    setActiveCountryId,
    activeCountryId,
    shortcutIdsForUser,
  };
})();
