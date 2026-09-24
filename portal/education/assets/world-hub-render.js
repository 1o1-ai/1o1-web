/**
 * World curriculum hub — elliptical orbits, larger planets, emblem-aware labels.
 *
 * BASELINE v6 — elliptical rings (wider horizontal spread).
 */
(function () {
  const MANIFEST_URL = '/portal/education/assets/world-countries.json';
  const H = window.AnyoEducationHub;
  const CFG = () => window.AnyoCountryConfig;
  const STAGE = 1080;

  const RINGS = [
    { radiusX: 198, radiusY: 142, capacity: 3, spin: 200 },
    { radiusX: 288, radiusY: 205, capacity: 4, spin: 270 },
    { radiusX: 378, radiusY: 268, capacity: 4, spin: 340 },
    { radiusX: 468, radiusY: 328, capacity: 5, spin: 410 },
  ];

  function esc(s) {
    return H ? H.esc(s) : String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  }

  function polarXY(index, total, radiusX, radiusY, ringIndex) {
    const stagger = ringIndex * 34;
    const deg = total ? (360 / total) * index - 90 + stagger : 0;
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * radiusX, y: Math.sin(rad) * radiusY };
  }

  function assignRings(countries) {
    const sorted = countries.slice().sort((a, b) => {
      if (a.isIndia) return -1;
      if (b.isIndia) return 1;
      return (a.title || '').localeCompare(b.title || '');
    });
    const out = [];
    let idx = 0;
    for (const ring of RINGS) {
      if (idx >= sorted.length) break;
      const take = Math.min(ring.capacity, sorted.length - idx);
      if (!take) continue;
      out.push({ ring, countries: sorted.slice(idx, idx + take) });
      idx += take;
    }
    if (idx < sorted.length) {
      const last = out[out.length - 1];
      if (last) last.countries.push(...sorted.slice(idx));
    }
    return out;
  }

  function emblemsFor(country, meta) {
    const flag = country.flag || '🌍';
    const landmark = meta.landmark || '🌍';
    const primary = meta.emblemPrimary || 'flag';
    if (primary === 'landmark') {
      return { compact: landmark, secondary: flag, compactClass: 'planet-landmark-primary' };
    }
    return { compact: flag, secondary: landmark, compactClass: 'planet-flag-primary' };
  }

  function planetHtml(country, leftPx, topPx) {
    const u = CFG()?.metaFor(country) || {};
    const code = u.code || country.id.slice(0, 2).toUpperCase();
    const curriculum = u.curriculumLine || country.subtitle || 'Grade 10 · Grade 12 · Science';
    const grades = u.grades || curriculum;
    const landmarkLabel = u.landmarkLabel || '';
    const em = emblemsFor(country, u);
    const isIndia = country.isIndia || country.id === 'india';

    return `<a class="country-planet${isIndia ? ' country-planet--india' : ''}"
      data-country-id="${esc(country.id)}" href="${esc(country.href)}" title="${esc(country.title)} — ${esc(curriculum)}"
      style="left:${leftPx.toFixed(1)}px;top:${topPx.toFixed(1)}px">
      <span class="planet-body">
        <span class="planet-compact">
          <span class="planet-emblem-primary ${em.compactClass}" aria-hidden="true">${em.compact}</span>
          ${em.secondary ? `<span class="planet-emblem-secondary" aria-hidden="true">${em.secondary}</span>` : ''}
          <span class="planet-code">${esc(code)}</span>
        </span>
        <span class="planet-expanded" aria-hidden="true">
          <span class="planet-flag-lg">${country.flag || '🌍'}</span>
          <span class="planet-landmark-lg">${u.landmark || '🌍'}</span>
          ${landmarkLabel ? `<span class="planet-landmark-label">${esc(landmarkLabel)}</span>` : ''}
          <span class="planet-title">${esc(country.title)}</span>
          <span class="planet-curriculum">${esc(curriculum)}</span>
          <span class="planet-grades">${esc(grades)}</span>
        </span>
      </span>
    </a>`;
  }

  function ringGuide(radiusX, radiusY) {
    const w = radiusX * 2;
    const h = radiusY * 2;
    return `<div class="orbit-ring-guide orbit-ring-guide--ellipse" style="width:${w}px;height:${h}px" aria-hidden="true"></div>`;
  }

  function ringBand(ringIndex, ringData, cx, cy) {
    const { ring, countries: list } = ringData;
    const n = list.length;
    const spin = ring.spin || 240;
    const dir = ringIndex % 2 === 0 ? 'normal' : 'reverse';
    const bodyDir = ringIndex % 2 === 0 ? 'reverse' : 'normal';
    const planets = list
      .map((c, i) => {
        const p = polarXY(i, n, ring.radiusX, ring.radiusY, ringIndex);
        return planetHtml(c, cx + p.x, cy + p.y);
      })
      .join('');

    return `<div class="orbit-ring-band orbit-ring-band--${ringIndex}"
      style="--ring-spin:${spin}s;--ring-dir:${dir};--body-dir:${bodyDir}">
      <div class="orbit-ring-spin">${planets}</div>
    </div>`;
  }

  function internationalCore(center) {
    return `<a class="universe-core" data-country-id="${esc(center.id)}" href="${esc(center.href)}">
      <span class="universe-core-glow" aria-hidden="true"></span>
      <span class="universe-core-globe" aria-hidden="true">
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs><radialGradient id="uniGlobe" cx="32%" cy="28%" r="70%">
            <stop offset="0%" stop-color="#7dd3fc"/><stop offset="55%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1e1b4b"/>
          </radialGradient></defs>
          <circle cx="40" cy="40" r="36" fill="url(#uniGlobe)"/>
          <ellipse cx="40" cy="40" rx="36" ry="12" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        </svg>
      </span>
      <span class="universe-core-title">${esc(center.title)}</span>
      <span class="universe-core-tagline">One world · One curriculum · Infinite learning</span>
      <span class="universe-core-sub">${esc(center.subtitle || 'SAT · ACT · TOEFL · GRE')}</span>
    </a>`;
  }

  function render(manifest) {
    const hub = document.getElementById('worldHubMount');
    if (!hub) return;

    const cx = STAGE / 2;
    const cy = STAGE / 2;
    const countries = manifest.countries || [];
    const center = manifest.center || {
      id: 'international',
      title: 'International',
      href: '/portal/education/international/',
      subtitle: 'SAT · ACT · TOEFL · GRE',
    };

    const rings = assignRings(countries);
    const guides = rings.map(({ ring }) => ringGuide(ring.radiusX, ring.radiusY)).join('');
    const bands = rings.map((r, i) => ringBand(i, r, cx, cy)).join('');

    hub.className = 'world-hub universe-orbit-system';
    hub.dataset.countryCount = String(countries.length);
    hub.dataset.ringCount = String(rings.length);
    hub.dataset.hubVersion = '6';
    hub.style.width = `${STAGE}px`;
    hub.style.height = `${STAGE}px`;
    hub.style.maxWidth = '98vw';
    hub.style.maxHeight = '98vw';

    hub.innerHTML = `
      <div class="orbit-stage" style="width:${STAGE}px;height:${STAGE}px">
        <div class="orbit-guides">${guides}</div>
        <div class="orbit-bands">${bands}</div>
        ${internationalCore(center)}
      </div>
      <p class="universe-orbit-hint">Hover a planet for full country details · Search above to jump</p>`;

    hub.querySelectorAll('.country-planet').forEach((el) => {
      el.addEventListener('mouseenter', () => el.querySelector('.planet-expanded')?.setAttribute('aria-hidden', 'false'));
      el.addEventListener('mouseleave', () => el.querySelector('.planet-expanded')?.setAttribute('aria-hidden', 'true'));
    });

    document.dispatchEvent(new CustomEvent('anyo:world-hub-ready', { detail: manifest }));
  }

  async function init() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      render(await res.json());
    } catch (err) {
      console.warn('world-hub-render:', err);
      const hub = document.getElementById('worldHubMount');
      if (hub) hub.innerHTML = '<p class="world-hub-loading">Unable to load universe map. Refresh to retry.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.AnyoWorldHubRender = { render, assignRings, polarXY, STAGE };
})();
