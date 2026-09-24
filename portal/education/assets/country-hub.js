/**
 * Country hub — CBSE10 / India portal-circle-grid (track picker).
 */
(function () {
  const H = window.AnyoEducationHub;
  const MANIFEST_URL = H?.MANIFEST_URL || '/portal/education/assets/world-countries.json';
  const CFG = () => window.AnyoCountryConfig;

  function slugFromPath() {
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('education');
    return i >= 0 && parts[i + 1] ? parts[i + 1] : '';
  }

  function esc(s) {
    return H ? H.esc(s) : String(s || '');
  }

  const TRACK_ICONS = ['📐', '⚛️', '🧪', '📚', '🎓'];

  function trackHref(country, svc) {
    if (svc.href) return svc.href;
    return `/portal/education/${country.slug}/${svc.slug}/index.html`;
  }

  function trackCircles(country) {
    const services = country.microservices || [];
    return services
      .map((svc, i) =>
        H.portalCircle({
          href: trackHref(country, svc),
          title: svc.title,
          subtitle: svc.subtitle || svc.equivalent || '',
          icon: TRACK_ICONS[i % TRACK_ICONS.length],
          css: H.STYLE_CYCLE[i % H.STYLE_CYCLE.length],
        })
      )
      .join('\n');
  }

  function render(country) {
    const mount = document.getElementById('countryHubMount');
    if (!mount || !country) return;

    if (country.isIndia) {
      window.location.replace('/portal/education/india/');
      return;
    }

    const u = CFG()?.metaFor(country) || {};
    const services = country.microservices || [];

    mount.className = 'country-hub-root country-hub-root--loaded';

    if (!services.length) {
      mount.innerHTML = H.renderCountryHubPage({
        title: `${country.flag || ''} ${country.title}`.trim(),
        eyebrow: u.curriculumLine || country.subtitle || '',
        heroLead: `Tracks publishing soon for ${country.title}.`,
        trackCirclesHtml: '',
      });
      return;
    }

    mount.innerHTML = H.renderCountryHubPage({
      title: `${country.flag || ''} ${country.title} Curricula`.trim(),
      eyebrow: u.curriculumLine || country.subtitle || '',
      heroLead: u.blurb || country.subtitle || '',
      trackCirclesHtml: trackCircles(country),
    });

    document.title = `${country.title} · Brahmexa Anyo Academy`;
  }

  function renderError(msg) {
    const mount = document.getElementById('countryHubMount');
    if (!mount) return;
    mount.className = 'country-hub-root country-hub-root--loaded';
    mount.innerHTML = `
      <header class="portal-header">
        <a class="back-link" href="/portal/education/">← Brahmexa Anyo Academy</a>
      </header>
      <main class="portal-main"><p class="portal-note">${esc(msg)}</p></main>`;
  }

  async function init() {
    const slug = slugFromPath();
    if (!slug) return;
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest unavailable');
      const manifest = await res.json();
      const country = (manifest.countries || []).find((c) => c.slug === slug || c.id === slug);
      if (!country) {
        renderError('Country not found in curriculum manifest.');
        return;
      }
      if (window.AnyoSignatureCountries?.setActiveCountryId) {
        window.AnyoSignatureCountries.setActiveCountryId(country.id);
      } else {
        try {
          sessionStorage.setItem('anyo_signature_active_country', country.id);
        } catch (_) { /* ignore */ }
      }
      render(country);
    } catch (err) {
      console.warn('country-hub:', err);
      renderError('Unable to load this country dashboard.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
