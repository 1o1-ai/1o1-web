/**
 * SAT/ACT Reading & Writing room — passage-centric study hub (replaces syllabus-extension Learn).
 */
(function (global) {
  'use strict';

  const RW_SECTIONS = new Set([
    'sat-reading-writing',
    'act-english',
    'act-reading',
  ]);

  let material = null;
  let curriculum = null;

  function isRwSection(subjectId) {
    return RW_SECTIONS.has(subjectId);
  }

  function rwRoomUrl({ track, subjectId, chapterId, tab }) {
    const p = new URLSearchParams();
    if (track) p.set('track', track);
    if (subjectId) p.set('section', subjectId);
    if (chapterId) p.set('chapter', chapterId);
    if (tab) p.set('tab', tab);
    const q = p.toString();
    return `rw-room.html${q ? `?${q}` : ''}`;
  }

  function loadMaterial() {
    if (material) return Promise.resolve(material);
    return fetch('/portal/data/sat-act-rw-material.json')
      .then((r) => {
        if (!r.ok) throw new Error('R&W material not found');
        return r.json();
      })
      .then((data) => {
        material = data;
        return data;
      });
  }

  function loadCurriculum() {
    if (curriculum) return Promise.resolve(curriculum);
    const cfg = global.AnyoAcademyConfig?.get?.('sat-act') || {};
    const path = cfg.curriculumPath || '/portal/data/sat-act-curriculum.json';
    return fetch(path)
      .then((r) => r.json())
      .then((data) => {
        curriculum = data;
        return data;
      });
  }

  function chapterMaterial(chapterId) {
    return material?.chapters?.[chapterId] || null;
  }

  function topicsForSubject(subjectId) {
    const chs = curriculum?.subjects?.[subjectId]?.chapters || [];
    return chs.map((ch) => ({
      ...ch,
      material: chapterMaterial(ch.id),
    }));
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSummary(text) {
    if (!text) return '<p class="rw-empty">No reading summary yet for this skill — check supplemental videos below.</p>';
    const blocks = text.split(/\n\n+/).map((para) => {
      if (para.startsWith('Related Articles:')) {
        const links = para
          .split('\n')
          .slice(1)
          .filter((ln) => ln.trim().startsWith('-'))
          .map((ln) => {
            const m = ln.match(/^-\s*(.+?):\s*(https?:\/\/\S+)/);
            if (!m) return `<li>${escapeHtml(ln.replace(/^-\s*/, ''))}</li>`;
            return `<li><a href="${escapeHtml(m[2])}" target="_blank" rel="noopener">${escapeHtml(m[1])}</a></li>`;
          })
          .join('');
        return links ? `<h4>Related reading</h4><ul class="rw-related-links">${links}</ul>` : '';
      }
      return `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`;
    });
    return blocks.join('');
  }

  function renderVideos(links) {
    if (!links?.length) return '';
    const items = links
      .map(
        (v) =>
          `<li><a href="${escapeHtml(v.url)}" target="_blank" rel="noopener">${escapeHtml(v.label)}</a></li>`
      )
      .join('');
    return `<section class="rw-panel"><h3>Lecture videos</h3><ul class="rw-video-list">${items}</ul></section>`;
  }

  function renderReadTab(root, chapter, meta) {
    root.innerHTML = `
      <section class="rw-panel rw-read-panel">
        <h3>${escapeHtml(chapter?.title || meta?.topicTitle || 'Skill area')}</h3>
        <p class="rw-meta">${escapeHtml(meta?.sectionLabel || '')}${chapter?.unit ? ` · ${escapeHtml(chapter.unit)}` : ''}</p>
        <div class="rw-summary">${formatSummary(meta?.readingSummary)}</div>
      </section>
      ${renderVideos(meta?.supplementalLinks)}
      <section class="rw-panel rw-skills-panel">
        <h3>Skills in this chapter</h3>
        <ul class="rw-skill-list">${(chapter?.skills || [])
          .map((s) => `<li>${escapeHtml(s.title || s)}</li>`)
          .join('') || '<li>See curriculum keywords below</li>'}</ul>
        ${chapter?.keywords?.length ? `<p class="rw-keywords">Keywords: ${chapter.keywords.map(escapeHtml).join(' · ')}</p>` : ''}
      </section>`;
  }

  function groupByPassage(questions) {
    const groups = [];
    const map = new Map();
    questions.forEach((q) => {
      const key = q.passageContext || `__solo_${q.id || groups.length}`;
      if (!map.has(key)) {
        const g = { passage: q.passageContext || '', items: [] };
        map.set(key, g);
        groups.push(g);
      }
      map.get(key).items.push(q);
    });
    return groups;
  }

  function renderPracticeTab(root, ctx) {
    const { bank, track, subjectId, chapterId, legacySection } = ctx;
    const pool = global.SatActShared?.filterQuestions
      ? global.SatActShared.filterQuestions(bank, {
          track,
          section: legacySection,
          chapter: chapterId,
          limit: 30,
        })
      : [];
    if (!pool.length) {
      root.innerHTML = `<p class="rw-empty">No verified passage items for this skill yet. Try ACT English or visit Exam Center for math mocks.</p>
        <a class="btn-portal btn-portal-primary" href="practice.html?track=${track}&section=${subjectId}">Open section practice</a>`;
      return;
    }
    const groups = groupByPassage(pool).slice(0, 4);
    root.innerHTML = '';
    groups.forEach((g, gi) => {
      const card = document.createElement('article');
      card.className = 'rw-passage-card';
      if (g.passage) {
        card.innerHTML = `<div class="mock-passage-block rw-passage"><h4>Passage ${gi + 1}</h4><p>${escapeHtml(g.passage).replace(/\n/g, '<br>')}</p></div>`;
      }
      const qWrap = document.createElement('div');
      qWrap.className = 'rw-passage-questions';
      g.items.slice(0, 3).forEach((q, qi) => {
        const block = document.createElement('div');
        block.className = 'rw-mini-q';
        block.innerHTML = `<p class="rw-q-prompt"><strong>Q${qi + 1}.</strong> ${escapeHtml(q.prompt)}</p>`;
        const opts = document.createElement('div');
        opts.className = 'rw-q-opts';
        q.options.forEach((opt, oi) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quiz-option';
          const letter = q.optionLabels?.[oi] || String.fromCharCode(65 + oi);
          btn.textContent = `${letter}. ${opt}`;
          btn.addEventListener('click', () => {
            const ok = oi === q.correctIndex;
            btn.style.borderColor = ok ? '#34d399' : '#f87171';
            opts.querySelectorAll('button').forEach((b) => {
              b.disabled = true;
            });
          });
          opts.appendChild(btn);
        });
        block.appendChild(opts);
        qWrap.appendChild(block);
      });
      card.appendChild(qWrap);
      root.appendChild(card);
    });
    const more = document.createElement('p');
    more.className = 'rw-more-link';
    more.innerHTML = `<a class="btn-portal btn-portal-ghost" href="practice.html?track=${track}&section=${subjectId}&chapter=${chapterId}">Full untimed practice for this skill →</a>`;
    root.appendChild(more);
  }

  function mountRoom(root, opts) {
    const track = opts.track || '';
    const subjectId = opts.subjectId || '';
    const chapterId = opts.chapterId || '';
    let tab = opts.tab || 'read';

    const tabs = [
      { id: 'read', label: 'Read' },
      { id: 'practice', label: 'Practice' },
    ];

    function render() {
      const chapter =
        curriculum?.subjects?.[subjectId]?.chapters?.find((c) => c.id === chapterId) || null;
      const meta = chapterMaterial(chapterId) || chapterMaterial(chapter?.id);
      const legacySection =
        subjectId === 'sat-reading-writing'
          ? 'reading_writing'
          : curriculum?.subjects?.[subjectId]?.section || '';

      root.querySelector('.rw-tab-bar')?.querySelectorAll('button').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
      });
      const body = root.querySelector('.rw-tab-body');
      if (!body) return;
      if (tab === 'practice') {
        renderPracticeTab(body, {
          bank: opts.bank || [],
          track,
          subjectId,
          chapterId,
          legacySection,
        });
      } else {
        renderReadTab(body, chapter, meta);
      }
    }

    root.innerHTML = `
      <div class="rw-room-header">
        <h2 id="rwRoomTitle">Reading &amp; Writing Lab</h2>
        <p id="rwRoomSubtitle" class="rw-meta"></p>
      </div>
      <nav class="rw-tab-bar" role="tablist">
        ${tabs.map((t) => `<button type="button" role="tab" data-tab="${t.id}" class="${t.id === tab ? 'active' : ''}">${t.label}</button>`).join('')}
      </nav>
      <div class="rw-tab-body" role="tabpanel"></div>`;

    root.querySelector('.rw-tab-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      tab = btn.dataset.tab;
      render();
    });

    const subjLabel = curriculum?.subjects?.[subjectId]?.label || subjectId;
    root.querySelector('#rwRoomSubtitle').textContent = `${track.toUpperCase()} · ${subjLabel}`;
    const ch = curriculum?.subjects?.[subjectId]?.chapters?.find((c) => c.id === chapterId);
    if (ch) root.querySelector('#rwRoomTitle').textContent = ch.title;

    render();
  }

  function initFromPage() {
    const root = document.getElementById('rwRoomRoot');
    if (!root) return;

    const p = new URLSearchParams(location.search);
    const track = p.get('track') || 'sat';
    const subjectId = p.get('section') || (track === 'sat' ? 'sat-reading-writing' : 'act-english');
    const chapterId = p.get('chapter') || '';
    const tab = p.get('tab') || 'read';

    const bankP = global.SatActShared?.loadVerifiedBank?.() || Promise.resolve([]);
    Promise.all([loadMaterial(), loadCurriculum(), bankP])
      .then(([, , bank]) => {
        const chapters = topicsForSubject(subjectId);
        const sidebar = document.getElementById('rwTopicNav');
        if (sidebar && chapters.length) {
          sidebar.innerHTML = '';
          chapters.forEach((ch) => {
            const a = document.createElement('a');
            a.href = rwRoomUrl({ track, subjectId, chapterId: ch.id, tab });
            a.className = 'rw-topic-link' + (ch.id === chapterId ? ' active' : '');
            a.textContent = ch.title;
            sidebar.appendChild(a);
          });
        }
        const activeChapter = chapterId || chapters[0]?.id;
        if (!chapterId && activeChapter) {
          const u = new URL(location.href);
          u.searchParams.set('chapter', activeChapter);
          history.replaceState(null, '', u);
        }
        mountRoom(root, {
          track,
          subjectId,
          chapterId: activeChapter,
          tab,
          bank,
        });
      })
      .catch((err) => {
        root.innerHTML = `<p class="rw-empty">Could not load R&W room: ${escapeHtml(err.message)}</p>`;
      });
  }

  global.SatActRwRoom = {
    RW_SECTIONS,
    isRwSection,
    rwRoomUrl,
    loadMaterial,
    loadCurriculum,
    chapterMaterial,
    topicsForSubject,
    mountRoom,
    initFromPage,
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initFromPage);
  }
})(typeof window !== 'undefined' ? window : globalThis);
