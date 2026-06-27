/**
 * Injects slow subject-themed SVG doodles for education portal pages.
 */
(function () {
  'use strict';
  if (!document.body.classList.contains('education-ambient')) return;
  if (document.querySelector('.edu-ambient-layer')) return;

  const layer = document.createElement('div');
  layer.className = 'edu-ambient-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = `
    <svg class="edu-ambient-atom" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="4" fill="#34d399"/>
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#67e8f9" stroke-width="1.2"/>
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#a78bfa" stroke-width="1.2" transform="rotate(60 50 50)"/>
      <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#fbbf24" stroke-width="1.2" transform="rotate(120 50 50)"/>
    </svg>
    <svg class="edu-ambient-triangle" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 8 L72 68 H8 Z" stroke="#fbbf24" stroke-width="1.5" fill="rgba(251,191,36,0.06)"/>
      <path d="M40 22 L58 58 H22 Z" stroke="#67e8f9" stroke-width="1" fill="none"/>
    </svg>
    <svg class="edu-ambient-wave" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 20 Q25 4 50 20 T100 20 T150 20 T200 20" stroke="#34d399" stroke-width="1.5" fill="none"/>
    </svg>
    <svg class="edu-ambient-formula" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="8" y="28" fill="#94a3b8" font-size="14" font-family="serif">a²+b²</text>
      <text x="12" y="52" fill="#67e8f9" font-size="12" font-family="serif">= c²</text>
      <circle cx="62" cy="58" r="10" stroke="#f472b6" stroke-width="1.2" fill="none"/>
    </svg>`;

  const anchor = document.getElementById('cosmos') || document.body.firstChild;
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(layer, anchor.nextSibling);
  } else {
    document.body.prepend(layer);
  }
})();
