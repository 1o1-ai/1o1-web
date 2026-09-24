/**
 * Shared script bundle for Anyo Academy education pages (auth + guest guard + page scripts).
 * Add data-page-scripts="/path/a.js,/path/b.js" on this tag for page-specific bundles.
 */
(function () {
  const base = document.currentScript;
  const parent = base?.parentNode || document.head;

  const core = [
    '/portal/education/assets/world-country-config.js?v=4',
    '/portal/education/assets/country-resolution.js?v=2',
    '/assets/saas-auth.js?v=4',
    '/portal/education/assets/anyo-access.js?v=4',
    '/portal/assets/portal-auth.js?v=12',
    '/portal/education/assets/anyo-onboarding.js?v=4',
  ];

  const pageRaw = base?.getAttribute('data-page-scripts') || '';
  const page = pageRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  function hasScript(src) {
    const root = src.split('?')[0];
    return Boolean(document.querySelector(`script[src^="${root}"]`));
  }

  function loadOne(src) {
    if (hasScript(src)) return Promise.resolve();
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = resolve;
      parent.appendChild(s);
    });
  }

  async function boot() {
    for (const src of core) await loadOne(src);
    for (const src of page) await loadOne(src);
    document.dispatchEvent(new CustomEvent('anyo:bootstrap-ready'));
  }

  boot();
})();
