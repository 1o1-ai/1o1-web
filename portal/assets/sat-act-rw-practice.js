/**
 * SAT/ACT Reading & Writing practice — untimed passage blocks (Exam Center Practice Test).
 */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  let track = params.get('track') || 'sat';
  let subjectId =
    params.get('section') ||
    (track === 'sat' ? 'sat-reading-writing' : 'act-english');
  let chapterId = params.get('chapter') || '';

  const trackSel = document.getElementById('rwTrack');
  const sectionSel = document.getElementById('rwSection');
  const chapterSel = document.getElementById('rwChapter');
  const practiceRoot = document.getElementById('rwPracticeRoot');
  const statsEl = document.getElementById('rwStats');

  const SECTIONS = {
    sat: [{ id: 'sat-reading-writing', label: 'Reading & Writing', legacy: 'reading_writing' }],
    act: [
      { id: 'act-english', label: 'English', legacy: 'english' },
      { id: 'act-reading', label: 'Reading', legacy: 'reading' },
    ],
  };

  let curriculum = null;
  let bank = [];
  let answered = 0;
  let correct = 0;

  function legacySection() {
    const sec = SECTIONS[track]?.find((s) => s.id === subjectId);
    return sec?.legacy || '';
  }

  function updateStats() {
    if (!statsEl) return;
    statsEl.textContent =
      answered > 0 ? `${correct} / ${answered} correct this session` : 'Answer questions to track progress';
  }

  function groupByPassage(questions) {
    const groups = [];
    const map = new Map();
    questions.forEach((q) => {
      const key = q.passageContext || `__${q.id}`;
      if (!map.has(key)) {
        const g = { passage: q.passageContext || '', items: [] };
        map.set(key, g);
        groups.push(g);
      }
      map.get(key).items.push(q);
    });
    return groups;
  }

  function renderPractice() {
    if (!practiceRoot) return;
    const pool = window.SatActShared?.filterQuestions
      ? window.SatActShared.filterQuestions(bank, {
          track,
          section: legacySection(),
          chapter: chapterId || undefined,
          limit: 40,
        })
      : [];
    if (!pool.length) {
      practiceRoot.innerHTML =
        '<p class="rw-empty">No verified items for this selection. ACT English has the largest bank — try that section.</p>';
      return;
    }
    const groups = groupByPassage(pool);
    practiceRoot.innerHTML = `<p class="rw-practice-lead">${pool.length} official items · ${groups.length} passage block(s) · untimed</p>`;
    groups.forEach((g, gi) => {
      const art = document.createElement('article');
      art.className = 'rw-passage-card';
      if (g.passage) {
        const pass = document.createElement('div');
        pass.className = 'mock-passage-block rw-passage';
        pass.innerHTML = `<h4>Passage ${gi + 1}</h4><p>${String(g.passage).replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`;
        art.appendChild(pass);
      }
      g.items.forEach((q, qi) => {
        const block = document.createElement('div');
        block.className = 'rw-mini-q';
        block.innerHTML = `<p class="rw-q-prompt"><strong>Question ${qi + 1}</strong> ${String(q.prompt).replace(/</g, '&lt;')}</p>`;
        const opts = document.createElement('div');
        opts.className = 'rw-q-opts';
        q.options.forEach((opt, oi) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quiz-option';
          const letter = q.optionLabels?.[oi] || String.fromCharCode(65 + oi);
          btn.textContent = `${letter}. ${opt}`;
          btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const ok = oi === q.correctIndex;
            answered++;
            if (ok) correct++;
            btn.style.borderColor = ok ? '#34d399' : '#f87171';
            opts.querySelectorAll('button').forEach((b) => {
              b.disabled = true;
              if (!ok && b === btn) return;
              if (
                !ok &&
                q.options.indexOf(
                  q.options[parseInt(b.textContent.charCodeAt(0) - 65, 10)] || ''
                ) === q.correctIndex
              ) {
                /* highlight correct on miss */
              }
            });
            const correctBtn = opts.querySelectorAll('button')[q.correctIndex];
            if (correctBtn && !ok) correctBtn.style.borderColor = '#34d399';
            updateStats();
          });
          opts.appendChild(btn);
        });
        block.appendChild(opts);
        art.appendChild(block);
      });
      practiceRoot.appendChild(art);
    });
  }

  function fillSections() {
    if (!sectionSel) return;
    sectionSel.innerHTML = '';
    (SECTIONS[track] || []).forEach((s) => {
      const o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.label;
      if (s.id === subjectId) o.selected = true;
      sectionSel.appendChild(o);
    });
    subjectId = sectionSel.value;
  }

  function fillChapters() {
    if (!chapterSel || !curriculum) return;
    chapterSel.innerHTML = '<option value="">All skills in section</option>';
    const chs = curriculum.subjects?.[subjectId]?.chapters || [];
    chs.forEach((ch) => {
      const o = document.createElement('option');
      o.value = ch.id;
      o.textContent = ch.title;
      if (ch.id === chapterId) o.selected = true;
      chapterSel.appendChild(o);
    });
    if (!chapterId && chs[0]) chapterId = '';
  }

  function syncUrl() {
    const u = new URL(location.href);
    u.searchParams.set('track', track);
    u.searchParams.set('section', subjectId);
    if (chapterId) u.searchParams.set('chapter', chapterId);
    else u.searchParams.delete('chapter');
    history.replaceState(null, '', u);
  }

  function onFilterChange() {
    track = trackSel?.value || track;
    fillSections();
    subjectId = sectionSel?.value || subjectId;
    chapterId = chapterSel?.value || '';
    syncUrl();
    answered = 0;
    correct = 0;
    updateStats();
    renderPractice();
  }

  trackSel?.addEventListener('change', onFilterChange);
  sectionSel?.addEventListener('change', onFilterChange);
  chapterSel?.addEventListener('change', onFilterChange);

  document.getElementById('btnRwLab')?.addEventListener('click', () => {
    const url = window.SatActRwRoom?.rwRoomUrl?.({
      track,
      subjectId,
      chapterId: chapterId || undefined,
    });
    if (url) location.href = url;
  });

  const curPath =
    window.AnyoAcademyConfig?.get?.('sat-act')?.curriculumPath ||
    '/portal/data/sat-act-curriculum.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    window.SatActShared?.loadVerifiedBank?.() || Promise.resolve([]),
  ])
    .then(([cur, b]) => {
      curriculum = cur;
      bank = b;
      if (trackSel) trackSel.value = track;
      fillSections();
      fillChapters();
      updateStats();
      renderPractice();
    })
    .catch((err) => {
      if (practiceRoot) {
        practiceRoot.innerHTML = `<p class="rw-empty">Load error: ${err.message}</p>`;
      }
    });
})();
