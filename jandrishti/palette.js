/* Palette switcher. Loaded in <head> so the saved palette applies before first paint. */
(() => {
  'use strict';
  const PALETTES = [
    ['dawn', 'Dawn — ivory, teal and saffron'],
    ['lotus', 'Lotus — blush, plum and indigo'],
    ['monsoon', 'Monsoon — mint, sea blue and green'],
    ['cosmos', 'Cosmos — original dark Brahmexa']
  ];
  const KEY = 'jandrishti_palette';
  const root = document.documentElement;
  let saved = 'dawn';
  try { saved = localStorage.getItem(KEY) || 'dawn'; } catch (e) { /* storage blocked: use default */ }
  if (!PALETTES.some(([id]) => id === saved)) saved = 'dawn';
  root.setAttribute('data-palette', saved);

  function set(id) {
    root.setAttribute('data-palette', id);
    try { localStorage.setItem(KEY, id); } catch (e) { /* not persisted */ }
    document.querySelectorAll('#palette button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.palette === id)));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('palette');
    if (!host) return;
    host.innerHTML = PALETTES.map(([id, label]) =>
      `<button type="button" class="sw-${id}" data-palette="${id}" title="${label}" aria-label="${label}" aria-pressed="${id === saved}"></button>`).join('');
    host.addEventListener('click', e => { const b = e.target.closest('button[data-palette]'); if (b) set(b.dataset.palette); });
  });
})();
