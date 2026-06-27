/**
 * Shared hub page wiring — online badge + optional SKU bots config.
 * Include after academy-config.js, presence.js, and portal.js on index.html.
 */
(function (global) {
  function wireOnlineBadge() {
    const badge = document.getElementById('onlineBadge');
    if (!badge || !global.AnyoPresence) return;

    const sku =
      document.body.dataset.sku ||
      (global.AnyoAcademyConfig && global.AnyoAcademyConfig.detectSku()) ||
      'cbse10-core';
    const cfg = global.AnyoAcademyConfig ? global.AnyoAcademyConfig.get(sku) : {};
    const pres = cfg.presence || {};
    const real = global.AnyoPresence.countRealByRole
      ? global.AnyoPresence.countRealByRole()
      : { students: 0, teachers: 0 };

    const counts = global.AnyoPresence.getOnlineCounts(real.students, real.teachers, pres);
    badge.hidden = false;
    badge.textContent = global.AnyoPresence.formatOnlineBadge(counts);
  }

  function wireSkuBots() {
    const sku = document.body.dataset.sku;
    if (sku && global.AnyoBots?.configureForSku) {
      global.AnyoBots.configureForSku(sku);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireSkuBots();
    wireOnlineBadge();
  });
})(typeof window !== 'undefined' ? window : globalThis);
