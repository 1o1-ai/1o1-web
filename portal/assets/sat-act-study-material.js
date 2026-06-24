/**
 * SAT/ACT study guide loader — maps skill chapter IDs to ingested markdown guides.
 */
(function (global) {
  'use strict';

  let catalog = null;

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return fetch('/portal/data/sat-act-study-material.json')
      .then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      })
      .then((data) => {
        catalog = data;
        return data;
      });
  }

  function skill(skillId) {
    return catalog?.chapters?.[skillId] || null;
  }

  function mdToHtml(text) {
    if (!text) return '';
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    return esc(text)
      .replace(/^### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="sr-learn-list">${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
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
      if (guide.source) {
        const note = document.createElement('p');
        note.className = 'sr-section-hint';
        note.textContent = 'Source: ' + guide.source;
        root.appendChild(note);
      }
      return;
    }
    if (fallback) root.innerHTML = fallback;
  }

  global.SatActStudyMaterial = { load, skill, mdToHtml, renderLearn };
})(typeof window !== 'undefined' ? window : globalThis);
