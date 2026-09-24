/**
 * Country Resolution Service — Google profile → IP → supported check → fallback.
 * Centralizes onboarding country detection for Brahmexa education portal.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'anyo_country_resolution';
  const CHOSEN_KEY = 'anyo_chosen_country';
  const MANIFEST_URL = '/portal/education/assets/world-countries.json';
  const DEFAULT_LEFT = 'india';
  const DEFAULT_RIGHT = 'usa';
  const CENTER_ID = 'international';

  const ISO_ALIASES = { UK: 'GB' };

  let manifestCache = null;

  function readStored() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeStored(data) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    global.dispatchEvent(new CustomEvent('anyo:country-resolved', { detail: data }));
  }

  function buildIsoToSlug() {
    const map = {};
    const meta = global.AnyoCountryConfig?.COUNTRY_META || {};
    Object.keys(meta).forEach((slug) => {
      const code = (meta[slug].code || '').toUpperCase();
      if (code) map[code] = slug;
    });
    map.GB = 'uk';
    map.UK = 'uk';
    return map;
  }

  function isoToSlug(iso) {
    if (!iso) return '';
    const norm = String(iso).toUpperCase();
    const aliased = ISO_ALIASES[norm] || norm;
    return buildIsoToSlug()[aliased] || '';
  }

  function localeToIso(locale) {
    if (!locale) return '';
    const parts = String(locale).replace('_', '-').split('-');
    if (parts.length >= 2 && parts[1].length === 2) return parts[1].toUpperCase();
    return '';
  }

  async function loadManifest() {
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

  function supportedIds(manifest) {
    return new Set((manifest?.countries || []).map((c) => c.id));
  }

  function countryRecord(manifest, id) {
    if (id === CENTER_ID) return manifest?.center || { id: CENTER_ID, href: '/portal/education/international/' };
    return (manifest?.countries || []).find((c) => c.id === id) || null;
  }

  function resolveFromGoogleProfile(profile) {
    if (!profile) return { iso: '', source: 'none' };
    if (profile.countryCode) {
      return { iso: String(profile.countryCode).toUpperCase(), source: 'google-country' };
    }
    if (profile.locale) {
      const iso = localeToIso(profile.locale);
      if (iso) return { iso, source: 'google-locale' };
    }
    return { iso: '', source: 'none' };
  }

  async function resolveFromNavigatorLocale() {
    const langs = global.navigator?.languages || [global.navigator?.language].filter(Boolean);
    for (const lang of langs) {
      const iso = localeToIso(lang);
      if (iso) return { iso, source: 'browser-locale' };
    }
    return { iso: '', source: 'none' };
  }

  async function resolveFromEducationApi(manifest) {
    const base = (manifest?.educationApi || 'https://api.brahmando.com/education').replace(/\/$/, '');
    try {
      const res = await fetch(`${base}/geo/country`, { credentials: 'omit', cache: 'no-store' });
      if (!res.ok) return { iso: '', source: 'none' };
      const data = await res.json();
      if (data?.countryCode) {
        return { iso: String(data.countryCode).toUpperCase(), source: data.source || 'ip-api' };
      }
    } catch {
      /* fall through */
    }
    return { iso: '', source: 'none' };
  }

  async function resolveFromCloudflareTrace() {
    try {
      const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
      if (!res.ok) return { iso: '', source: 'none' };
      const text = await res.text();
      const match = text.match(/^loc=([A-Z]{2})/m);
      if (match) return { iso: match[1], source: 'ip-cloudflare' };
    } catch {
      /* fall through */
    }
    return { iso: '', source: 'none' };
  }

  async function resolveFromIp(manifest) {
    const api = await resolveFromEducationApi(manifest);
    if (api.iso) return api;
    return resolveFromCloudflareTrace();
  }

  function buildShortcuts(detectedSlug, isSupported) {
    if (isSupported && detectedSlug && detectedSlug !== CENTER_ID) {
      const companion = detectedSlug === DEFAULT_LEFT ? DEFAULT_RIGHT : DEFAULT_LEFT;
      return { left: detectedSlug, right: companion, detected: detectedSlug };
    }
    return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT, detected: detectedSlug || '' };
  }

  function setChosenCountry(countryId) {
    if (countryId) sessionStorage.setItem(CHOSEN_KEY, countryId);
    else sessionStorage.removeItem(CHOSEN_KEY);
  }

  function getChosenCountry() {
    return sessionStorage.getItem(CHOSEN_KEY) || '';
  }

  async function listCountriesForPicker() {
    const manifest = await loadManifest();
    const list = (manifest?.countries || [])
      .slice()
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    const center = manifest?.center;
    if (center) {
      list.unshift({
        id: center.id || CENTER_ID,
        title: center.title || 'International',
        flag: '🌍',
        href: center.href,
      });
    }
    return list;
  }

  function buildResult(manifest, slug, source, opts) {
    const supported = supportedIds(manifest);
    const isSupported = Boolean(slug && supported.has(slug));
    const shortcuts = buildShortcuts(slug, isSupported);
    const landingCountryId =
      slug && (isSupported || slug === CENTER_ID) ? slug : isSupported ? slug : CENTER_ID;
    const landingCountry = countryRecord(manifest, landingCountryId);
    const firstLand = !sessionStorage.getItem('anyo_landed_once');
    const landingHref =
      isSupported && slug !== CENTER_ID && firstLand && landingCountry?.href
        ? landingCountry.href
        : '/portal/education/';

    return {
      iso: opts?.iso || '',
      detectedCountryId: slug,
      chosenCountryId: opts?.chosenCountryId || getChosenCountry() || '',
      landingCountryId,
      landingHref,
      supported: isSupported,
      source,
      shortcuts,
      subscribedCountries: isSupported && slug && slug !== CENTER_ID ? [slug] : [DEFAULT_LEFT, DEFAULT_RIGHT],
      centerId: CENTER_ID,
    };
  }

  /**
   * @param {{ user?: object, profile?: object, force?: boolean, chosenCountryId?: string }} opts
   */
  async function resolveUserCountry(opts) {
    opts = opts || {};
    if (!opts.force) {
      const cached = readStored();
      if (cached?.landingCountryId && !opts.chosenCountryId) return cached;
    }

    const manifest = await loadManifest();
    const supported = supportedIds(manifest);
    const chosen =
      opts.chosenCountryId || getChosenCountry() || opts.user?.preferredCountry || '';

    if (chosen) {
      setChosenCountry(chosen);
      const slug = chosen === CENTER_ID || chosen === 'international' ? CENTER_ID : chosen;
      const isSupported = supported.has(slug) || slug === CENTER_ID;
      const result = buildResult(manifest, slug, 'user-choice', {
        chosenCountryId: chosen,
        iso: '',
      });
      result.supported = isSupported && slug !== CENTER_ID ? true : result.supported;
      writeStored(result);
      return result;
    }

    let iso = '';
    let source = 'fallback-default';

    if (opts.profile) {
      const g = resolveFromGoogleProfile(opts.profile);
      if (g.iso) {
        iso = g.iso;
        source = g.source;
      }
    }

    if (!iso && opts.user?.locale) {
      const g = resolveFromGoogleProfile({ locale: opts.user.locale });
      if (g.iso) {
        iso = g.iso;
        source = g.source;
      }
    }

    if (!iso) {
      const ip = await resolveFromIp(manifest);
      if (ip.iso) {
        iso = ip.iso;
        source = ip.source;
      }
    }

    if (!iso) {
      const nav = await resolveFromNavigatorLocale();
      if (nav.iso) {
        iso = nav.iso;
        source = nav.source;
      }
    }

    const detectedSlug = isoToSlug(iso);
    const result = buildResult(manifest, detectedSlug, source, { iso });
    writeStored(result);
    return result;
  }

  function getStored() {
    return readStored();
  }

  function getShortcutCountryIds() {
    const r = readStored();
    if (!r?.shortcuts) return [DEFAULT_LEFT, DEFAULT_RIGHT];
    return [r.shortcuts.left, r.shortcuts.right].filter(Boolean);
  }

  global.AnyoCountryResolution = {
    resolveUserCountry,
    getStored,
    getShortcutCountryIds,
    setChosenCountry,
    getChosenCountry,
    listCountriesForPicker,
    isoToSlug,
    loadManifest,
    DEFAULT_LEFT,
    DEFAULT_RIGHT,
    CENTER_ID,
  };
})(typeof window !== 'undefined' ? window : globalThis);
