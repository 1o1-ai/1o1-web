/**
 * ManjuLAB Online Portal — navigation; auth via portal-auth.js
 */
(function () {
  const ACADEMY_NAME = 'Anyo Brahmando Academy';
  const ACADEMY_TAGLINE = 'A different path to knowledge, infinite possibility';

  window.PORTAL_ACADEMY = { name: ACADEMY_NAME, tagline: ACADEMY_TAGLINE };

  window.openPortalLogin = function openPortalLogin() {
    if (window.PortalAuth?.getSession?.()) return window.PortalAuth.getSession();
    window.PortalAuth?.mountLoginGate?.();
    return null;
  };

  window.requirePortalLogin = function requirePortalLogin() {
    return window.PortalAuth?.getSession?.() || null;
  };

  const SKU_HUBS = {
    'cbse10-core': { title: 'CBSE 10 Core', path: '/portal/education/cbse10/index.html' },
    'sat-act': { title: 'SAT / ACT', path: '/portal/education/sat-act/index.html' },
    'english-tests': { title: 'TOEFL · IELTS · DET', path: '/portal/education/english-tests/index.html' },
    'gre-gmat': { title: 'GRE / GMAT', path: '/portal/education/gre-gmat/index.html' },
    'rhytoma-wbbse': { title: 'Rhytoma Academy', path: '/portal/education/rhytoma/index.html' },
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (window.AnyoPresence && typeof window.AnyoPresence.mountOnlineBadges === 'function') {
      window.AnyoPresence.mountOnlineBadges();
    }

    document.querySelectorAll('[data-portal-folder]').forEach((card) => {
      card.addEventListener('click', () => {
        const href = card.getAttribute('data-href');
        if (!href) return;
        const live = card.getAttribute('data-live') === 'true';
        if (live) window.location.href = href;
        else window.open(href, '_blank', 'noopener');
      });
    });

    document.querySelectorAll('[data-sku-login]').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.disabled) return;
        const sku = card.getAttribute('data-sku') || 'cbse10-core';
        const hub = SKU_HUBS[sku] || SKU_HUBS['cbse10-core'];
        window.location.href = hub.path;
      });
    });
  });
})();
