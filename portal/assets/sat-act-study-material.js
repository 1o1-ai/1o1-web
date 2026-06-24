/**
 * SAT/ACT study guide loader — maps skill chapter IDs to ingested markdown guides.
 */
(function (global) {
  'use strict';

  let catalog = null;

  function renderLearn(root, guide, fallback) {
    if (!root) return;
    root.innerHTML = '';
    if (guide?.studySummary) {
      const sec = document.createElement('section');
      sec.className = 'sr-learn-section';
      sec.innerHTML = '<h3>Study guide</h3><div class="sr-learn-body"></div>';
      sec.querySelector('.sr-learn-body').innerHTML = mdToHtml(guide.studySummary);
      root.appendChild(sec);

      const catalog = window._satActStudyCatalog;
      const videos = (catalog?.videoCatalog || []).filter((v) => {
        const subj = (v.subject || '').toLowerCase();
        const sid = (guide.skillId || '').toLowerCase();
        if (sid.includes('math') && subj.includes('math')) return true;
        if (sid.includes('rw') && subj.includes('reading')) return true;
        if (sid.startsWith('act-english') && subj.includes('english')) return true;
        if (sid.startsWith('act-science') && subj.includes('science')) return true;
        return subj === 'all';
      });
      if (videos.length) {
        const vsec = document.createElement('section');
        vsec.className = 'sr-learn-section';
        vsec.innerHTML = '<h3>Video &amp; official links</h3><ul class="sr-learn-links"></ul>';
        const ul = vsec.querySelector('ul');
        videos.slice(0, 6).forEach((v) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = v.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = `${v.provider}: ${v.title}`;
          li.appendChild(a);
          ul.appendChild(li);
        });
        root.appendChild(vsec);
      }

      const src = guide.sources || (guide.source ? [guide.source] : []);
      if (src.length) {
        const note = document.createElement('p');
        note.className = 'sr-section-hint';
        note.textContent = 'Sources: ' + src.filter(Boolean).join(' · ');
        root.appendChild(note);
      }
      return;
    }
    if (fallback) root.innerHTML = fallback;
  }

  function load() {
    if (catalog) return Promise.resolve(catalog);
    return fetch('/portal/data/sat-act-study-material.json')
      .then((r) => {
        if (!r.ok) throw new Error('Study material not found');
        return r.json();
      })
      .then((data) => {
        catalog = data;
        window._satActStudyCatalog = data;
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

  global.SatActStudyMaterial = { load, skill, mdToHtml, renderLearn };
})(typeof window !== 'undefined' ? window : globalThis);
