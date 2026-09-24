/**
 * Curriculum track hub — CBSE10-identical UI via shared renderTrackHubPage.
 */
(function () {
  const H = window.AnyoEducationHub;
  const MANIFEST_URL = H?.MANIFEST_URL || '/portal/education/assets/world-countries.json';

  function partsFromPath() {
    const parts = (window.location.pathname || '').split('/').filter(Boolean);
    const i = parts.indexOf('education');
    return {
      country: i >= 0 ? parts[i + 1] : '',
      service: i >= 0 ? parts[i + 2] : '',
    };
  }

  function esc(s) {
    return H ? H.esc(s) : String(s || '');
  }

  function render(country, svc) {
    const mount = document.getElementById('microHubMount');
    if (!mount || !country || !svc) return;

    window.ANYO_MICROSERVICE = {
      sku: svc.sku || `${country.slug}-${svc.slug}`,
      country: country.id,
      countryTitle: country.title,
      serviceTitle: svc.title,
      dataPrefix: svc.dataPrefix || `/portal/data/${country.slug}-${svc.slug}`,
      curriculumPath: svc.curriculumPath || `/portal/data/${country.slug}-${svc.slug}-curriculum.json`,
      bankPath: svc.bankPath || `/portal/data/${country.slug}-${svc.slug}-questions.json`,
      forumPath: svc.forumPath || `/portal/data/${country.slug}-${svc.slug}-forum.json`,
      educationApi: svc.educationApi || 'https://api.brahmando.com/education',
    };

    const base = window.location.pathname.replace(/\/?index\.html?$/, '');

    mount.className = 'country-hub-root country-hub-root--loaded';
    mount.innerHTML = H.renderTrackHubPage({
      backHref: country.href || `/portal/education/${country.slug}/`,
      backLabel: country.title,
      title: svc.title,
      openBadge: true,
      eyebrow: `${country.title} · ${svc.subtitle || svc.title}`,
      heroLead: 'Study room is open to all — no login required. Work with the full syllabus when chapter lists are not yet available.',
      baseHref: base,
      footerNote: '📚 AI study guides in Study Room · <a href="/portal/education/international/">International exams</a>',
    });

    document.title = `${svc.title} · ${country.title}`;
  }

  function renderError(msg) {
    const mount = document.getElementById('microHubMount');
    if (!mount) return;
    mount.innerHTML = `<main class="portal-main"><p class="portal-note">${esc(msg)}</p></main>`;
  }

  async function init() {
    const { country: cslug, service: sslug } = partsFromPath();
    if (!cslug || !sslug) return;
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest unavailable');
      const manifest = await res.json();
      const country = (manifest.countries || []).find((c) => c.slug === cslug);
      const svc = (country?.microservices || []).find((s) => s.slug === sslug);
      if (!country || !svc) {
        renderError('Track not found. Return to your country hub.');
        return;
      }
      render(country, svc);
    } catch (err) {
      console.warn('microservice-hub:', err);
      renderError('Unable to load track hub.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
