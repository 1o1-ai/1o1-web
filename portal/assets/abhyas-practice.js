/**
 * Abhyas Practice — embeds the official outsider testing UI (same contract as /testing).
 */
(function (global) {
  'use strict';

  const DEFAULT_API = 'https://api.brahmando.com/education/abhyas';
  const DEFAULT_TOKEN = 'abhyas-test-token-sangati-2026';
  const TESTING_BASE = 'https://yogabrata.com/testing/';

  function buildUrl(opts) {
    const params = new URLSearchParams({
      embed: '1',
      token: opts.token || DEFAULT_TOKEN,
      api: opts.api || DEFAULT_API,
    });
    if (opts.subject) params.set('subject', opts.subject);
    if (opts.count) params.set('count', String(opts.count));
    if (opts.mode) params.set('mode', opts.mode);
    if (opts.scope) params.set('scope', opts.scope);
    if (opts.grade) params.set('grade', opts.grade);
    return `${TESTING_BASE}?${params.toString()}`;
  }

  function mount(container, opts) {
    opts = opts || {};
    const src = buildUrl(opts);
    container.innerHTML = `
      <iframe
        src="${src}"
        title="Abhyas practice test"
        style="width:100%;min-height:880px;height:92vh;max-height:1200px;border:0;border-radius:12px;background:#f8fafc"
        allow="clipboard-write"
        loading="lazy"
      ></iframe>
      <p class="portal-note" style="margin-top:12px;font-size:0.78rem">
        Powered by Abhyas API · <code>POST /v1/session/start</code> · 1–40 questions · answer pack on submit
      </p>`;
  }

  global.AbhyasPractice = { mount, buildUrl };
})(typeof window !== 'undefined' ? window : globalThis);
