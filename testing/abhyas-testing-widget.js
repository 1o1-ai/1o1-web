/**
 * Abhyas Testing embed — drop-in iframe widget for partner sites.
 *
 * Option A — script tag (recommended):
 *   <div id="abhyas-testing"></div>
 *   <script
 *     src="https://yogabrata.com/testing/abhyas-testing-widget.js"
 *     data-container="abhyas-testing"
 *     data-base-url="https://yogabrata.com/testing/"
 *     data-token="YOUR_ABHYAS_BEARER_TOKEN"
 *     data-embed-key="YOUR_EDUCATION_EMBED_KEY"
 *     data-subject="Science"
 *     data-count="8"
 *     data-mode="practice"
 *     data-height="920px">
 *   </script>
 *
 * Option B — direct iframe (see embed.html):
 *   <iframe src="https://yogabrata.com/testing/?embed=1&token=…&subject=Science&count=8"></iframe>
 *
 * Partners need:
 *   - Abhyas Bearer token (Authorization) from Brahmando team
 *   - Optional X-Education-Embed-Key if calling from a non-allowlisted origin
 *   - Their domain allowlisted on api.brahmando.com CORS / origin guard
 */
(function () {
  'use strict';

  var script = document.currentScript || document.querySelector('script[src*="abhyas-testing-widget"]');
  if (!script) return;

  var CONFIG = {
    baseUrl: (script.getAttribute('data-base-url') || 'https://yogabrata.com/testing/').replace(/\/?$/, '/'),
    containerId: script.getAttribute('data-container') || 'abhyas-testing',
    token: script.getAttribute('data-token') || '',
    embedKey: script.getAttribute('data-embed-key') || '',
    api: script.getAttribute('data-api') || '',
    subject: script.getAttribute('data-subject') || '',
    chapter: script.getAttribute('data-chapter') || '',
    count: script.getAttribute('data-count') || '',
    mode: script.getAttribute('data-mode') || '',
    scope: script.getAttribute('data-scope') || '',
    grade: script.getAttribute('data-grade') || '',
    title: script.getAttribute('data-title') || 'Abhyas CBSE Class 10 Practice',
    height: script.getAttribute('data-height') || '920px',
    minHeight: script.getAttribute('data-min-height') || '640px',
    borderRadius: script.getAttribute('data-border-radius') || '16px',
  };

  var container = document.getElementById(CONFIG.containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = CONFIG.containerId;
    script.parentNode.insertBefore(container, script);
  }

  var q = new URLSearchParams();
  q.set('embed', '1');
  if (CONFIG.token) q.set('token', CONFIG.token);
  if (CONFIG.embedKey) q.set('embed_key', CONFIG.embedKey);
  if (CONFIG.api) q.set('api', CONFIG.api);
  if (CONFIG.subject) q.set('subject', CONFIG.subject);
  if (CONFIG.chapter) q.set('chapter', CONFIG.chapter);
  if (CONFIG.count) q.set('count', CONFIG.count);
  if (CONFIG.mode) q.set('mode', CONFIG.mode);
  if (CONFIG.scope) q.set('scope', CONFIG.scope);
  if (CONFIG.grade) q.set('grade', CONFIG.grade);

  var iframe = document.createElement('iframe');
  iframe.src = CONFIG.baseUrl + '?' + q.toString();
  iframe.title = CONFIG.title;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'clipboard-write');
  iframe.style.cssText = [
    'width:100%',
    'height:' + CONFIG.height,
    'min-height:' + CONFIG.minHeight,
    'border:0',
    'border-radius:' + CONFIG.borderRadius,
    'display:block',
    'background:#f8fafc',
  ].join(';');
  container.innerHTML = '';
  container.appendChild(iframe);

  window.AbhyasTestingWidget = {
    iframe: iframe,
    reload: function (overrides) {
      overrides = overrides || {};
      Object.keys(overrides).forEach(function (k) {
        if (overrides[k]) q.set(k, overrides[k]);
      });
      iframe.src = CONFIG.baseUrl + '?' + q.toString();
    },
  };
})();
