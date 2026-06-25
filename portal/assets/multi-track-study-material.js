/**
 * Generic study material loader — uses {sku}-study-material.json
 */
(function (global) {
  'use strict';

  const catalogs = {};

  function skuId() {
    return document.body?.dataset?.sku || global.AnyoAcademyConfig?.detectSku?.() || '';
  }

  function materialPath() {
    const cfg = global.AnyoAcademyConfig?.get?.(skuId()) || {};
    return cfg.studyMaterialPath || `/portal/data/${skuId()}-study-material.json`;
  }

  function mdToHtml(text) {
    if (!text) return '';
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return esc(text)
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  function renderLearn(root, guide, fallback) {
    if (!root) return;
    root.innerHTML = '';
    if (guide?.studySummary) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Study guide</h3><div class="sr-learn-body"></div>';
      sec.querySelector('.sr-learn-body').innerHTML = mdToHtml(guide.studySummary);
      root.appendChild(sec);
      return;
    }
    if (fallback) root.innerHTML = fallback;
  }

  function load() {
    const id = skuId();
    if (catalogs[id]) return Promise.resolve(catalogs[id]);
    return fetch(materialPath())
      .then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      })
      .then((data) => {
        catalogs[id] = data;
        return data;
      });
  }

  function skill(skillId) {
    return catalogs[skuId()]?.chapters?.[skillId] || null;
  }

  global.MultiTrackStudyMaterial = { load, skill, renderLearn, mdToHtml };
})(typeof window !== 'undefined' ? window : globalThis);
