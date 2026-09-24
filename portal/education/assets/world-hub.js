/**
 * World curriculum hub — country search (portal manifest)
 */
(function () {
  let COUNTRIES = [];
  let manifestReady = false;
  let manifestData = null;

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildCountryEntry(c) {
    const meta = window.AnyoCountryConfig?.metaFor?.(c) || {};
    const aliases = [
      c.id,
      c.title,
      c.slug,
      c.folder,
      c.subtitle,
      ...(c.searchAliases || []),
      ...(meta.searchAliases || []),
      ...(meta.boards || []),
      meta.curriculumLine,
      meta.grades,
    ].filter(Boolean);
    if (c.isIndia) aliases.push('cbse', 'icse', 'bharat', 'indian', 'launch country');
    return {
      id: c.id,
      href: c.href,
      title: c.title,
      names: aliases.map(normalize),
      el: null,
    };
  }

  function scoreMatch(query, country) {
    if (!query) return 0;
    const q = normalize(query);
    let best = 0;
    country.names.forEach((name) => {
      if (name === q) best = Math.max(best, 100);
      else if (name.startsWith(q)) best = Math.max(best, 80);
      else if (name.includes(q)) best = Math.max(best, 60);
      else if (q.includes(name) && name.length > 2) best = Math.max(best, 40);
    });
    const label = country.el?.querySelector('.planet-title, .portal-title')?.textContent || country.title || '';
    const sub =
      country.el?.querySelector('.planet-curriculum, .planet-grades, .portal-sub')?.textContent || '';
    const blob = normalize(label + ' ' + sub);
    if (blob.includes(q)) best = Math.max(best, 50);
    return best;
  }

  function bindElements(hub) {
    COUNTRIES.forEach((c) => {
      c.el = hub.querySelector(`[data-country-id="${c.id}"]`);
    });
    const center = hub.querySelector('[data-country-id="international"]');
    if (center) {
      COUNTRIES.unshift({
        id: 'international',
        href: center.getAttribute('href') || '/portal/education/international/',
        title: 'International',
        names: ['international', 'global', 'sat', 'act', 'toefl', 'gre'],
        el: center,
      });
    }
  }

  function wireSearch(hub) {
    const input = document.getElementById('countrySearchInput');
    const btn = document.getElementById('countrySearchBtn');
    const results = document.getElementById('countrySearchResults');
    if (!input || !btn || !results) return;

    function clearState() {
      hub.classList.remove('world-hub--filtered');
      hub.querySelectorAll('[data-country-id]').forEach((node) => {
        node.classList.remove('is-search-match', 'is-search-dim', 'is-search-focus');
      });
      results.hidden = true;
      results.innerHTML = '';
    }

    function applySearch(rawQuery, focusFirst) {
      const query = normalize(rawQuery);
      if (!query) {
        clearState();
        return [];
      }

      const ranked = COUNTRIES.filter((c) => c.id !== 'international')
        .map((c) => ({ country: c, score: scoreMatch(query, c) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

      hub.classList.add('world-hub--filtered');
      hub.querySelectorAll('[data-country-id]').forEach((node) => {
        node.classList.remove('is-search-match', 'is-search-dim', 'is-search-focus');
        const hit = ranked.some((r) => r.country.id === node.getAttribute('data-country-id'));
        node.classList.toggle('is-search-dim', !hit);
        node.classList.toggle('is-search-match', hit);
      });

      if (ranked.length && focusFirst) {
        const top = ranked[0].country;
        if (top.el) {
          top.el.classList.add('is-search-focus');
          top.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      results.innerHTML = '';
      if (!ranked.length) {
        results.hidden = false;
        results.innerHTML = '<li class="world-search-empty">No country matched — try a country name or International</li>';
        return ranked;
      }

      ranked.forEach(({ country }) => {
        const li = document.createElement('li');
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'world-search-result-item';
        const title = country.el?.querySelector('.planet-title')?.textContent || country.title || country.id;
        const sub =
          country.el?.querySelector('.planet-curriculum, .planet-grades')?.textContent ||
          country.names.slice(0, 3).join(' · ');
        item.innerHTML = `<div class="result-text"><strong>${title}</strong><span>${sub}</span></div>`;
        item.addEventListener('click', () => {
          const href = country.el?.href || country.href;
          if (href) window.location.href = href;
        });
        li.appendChild(item);
        results.appendChild(li);
      });
      results.hidden = false;
      return ranked;
    }

    input.addEventListener('input', () => applySearch(input.value, false));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const ranked = applySearch(input.value, true);
        const top = ranked[0]?.country;
        if (top) {
          const href = top.el?.href || top.href;
          if (href && top.el) window.location.href = href;
        }
      }
      if (e.key === 'Escape') {
        input.value = '';
        clearState();
        input.blur();
      }
    });
    btn.addEventListener('click', () => {
      const ranked = applySearch(input.value, true);
      const top = ranked[0]?.country;
      if (top) {
        const href = top.el?.href || top.href;
        if (href && top.el) window.location.href = href;
      } else input.focus();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.world-hub-search')) clearState();
    });
  }

  function onManifest(manifest) {
    manifestData = manifest;
    const hub = document.getElementById('worldHubMount');
    if (!hub) return;
    COUNTRIES = (manifest.countries || []).map(buildCountryEntry);
    bindElements(hub);
    if (!manifestReady) wireSearch(hub);
    manifestReady = true;
    applyDetectedCountryHighlight(hub);
  }

  function applyDetectedCountryHighlight(hub) {
    const resolution = window.AnyoCountryResolution?.getStored?.();
    if (!resolution) return;
    hub.querySelectorAll('[data-country-id]').forEach((node) => {
      node.classList.remove('is-detected-country', 'is-detected-center');
    });
    const targetId = resolution.supported
      ? resolution.detectedCountryId
      : resolution.centerId || 'international';
    const el = hub.querySelector(`[data-country-id="${targetId}"]`);
    if (el) {
      el.classList.add(resolution.supported ? 'is-detected-country' : 'is-detected-center');
      if (resolution.supported) {
        el.classList.add('is-search-focus');
        sessionStorage.setItem('anyo_signature_active_country', targetId);
      }
    }
  }

  document.addEventListener('anyo:country-resolved', () => {
    const hub = document.getElementById('worldHubMount');
    if (hub) applyDetectedCountryHighlight(hub);
    window.AnyoSignatureCountries?.refresh?.();
  });

  document.addEventListener('anyo:world-hub-ready', (e) => onManifest(e.detail || {}));

  document.addEventListener('DOMContentLoaded', () => {
    if (manifestReady) return;
    fetch('/portal/education/assets/world-countries.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m && window.AnyoWorldHubRender) window.AnyoWorldHubRender.render(m);
        if (m) onManifest(m);
      })
      .catch(() => {});
  });
})();
