/**
 * Multi-track Study Room — exam → section → chapter → learn|evaluate
 * Data-driven from curriculum JSON (sectionOrder, sectionMeta, trackButtons).
 */
(function () {
  'use strict';

  const SKU = document.body.dataset.sku || window.MultiTrackShared?.skuId?.() || '';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);

  const TRACK_ICONS = {
    gre: '📊',
    gmat: '🎓',
    toefl: '🗣️',
    ielts: '🌍',
    det: '🦉',
    sat: '📝',
    act: '🎯',
  };

  let curriculum = null;
  let verifiedBank = [];
  let track = '';
  let subjectId = '';
  let chapterId = '';
  let chapterTitle = '';
  let quizQuestions = [];
  let quizIndex = 0;
  let quizAnswers = [];

  const phases = {
    track: document.getElementById('phaseTrack'),
    section: document.getElementById('phaseSection'),
    chapter: document.getElementById('phaseChapter'),
    intent: document.getElementById('phaseIntent'),
    learn: document.getElementById('phaseLearn'),
    evaluate: document.getElementById('phaseEvaluate'),
  };

  const curPath = cfg.curriculumPath || `/portal/data/${SKU}-curriculum.json`;

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    window.MultiTrackShared?.loadVerifiedBank?.() || Promise.resolve([]),
    window.AnyoBots?.loadRoster?.() || Promise.resolve({ students: [] }),
  ])
    .then(([cur, bank, roster]) => {
      curriculum = cur;
      verifiedBank = bank;
      renderTrackButtons();
      renderStudents(roster?.students || [], 'studentsRoster');
      renderStudents(roster?.students || [], 'learnStudentsRoster');
      renderIngestBadge();
      bindTrackButtons();
      bindNavigation();
      bindIntent();
      bindEvaluate();
      if (!applyEntryFromUrl()) showPhase('track');
    })
    .catch((err) => showLoadError('Could not load curriculum. ' + (err?.message || err)));

  function sectionMeta() {
    return curriculum?.sectionMeta?.[track]?.[subjectId] || null;
  }

  function legacySectionKey() {
    const meta = sectionMeta();
    return meta?.legacySection || curriculum?.subjects?.[subjectId]?.section || '';
  }

  function showLoadError(msg) {
    const el = document.getElementById('srLoadError');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    showPhase('track');
  }

  function showPhase(name) {
    Object.entries(phases).forEach(([k, el]) => {
      if (el) el.classList.toggle('hidden', k !== name);
    });
    document.body.classList.toggle('sr-eval-active', name === 'evaluate');
    document.body.classList.toggle('sr-learn-active', name === 'learn');
  }

  function renderTrackButtons() {
    const host = document.getElementById('trackCircles');
    if (!host || !curriculum?.trackButtons) return;
    host.innerHTML = '';
    Object.entries(curriculum.trackButtons).forEach(([tid, meta]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sr-subject-circle ${meta.cssClass || tid}`;
      btn.dataset.track = tid;
      btn.innerHTML = `<span class="sr-circle-icon">${TRACK_ICONS[tid] || '📘'}</span>
        <span class="sr-circle-title">${meta.label}</span>
        <span class="sr-circle-code">${meta.subtitle || ''}</span>`;
      host.appendChild(btn);
    });
  }

  function chaptersForSubject() {
    return curriculum?.subjects?.[subjectId]?.chapters || [];
  }

  function currentChapter() {
    return chaptersForSubject().find((c) => c.id === chapterId);
  }

  function bindTrackButtons() {
    document.querySelectorAll('[data-track]').forEach((btn) => {
      btn.addEventListener('click', () => {
        track = btn.getAttribute('data-track');
        renderSectionGrid();
        showPhase('section');
      });
    });
  }

  function renderSectionGrid() {
    const grid = document.getElementById('sectionGrid');
    const lead = document.getElementById('sectionLead');
    if (!grid) return;
    const trackLabel = curriculum?.trackButtons?.[track]?.label || track.toUpperCase();
    lead.textContent = `${trackLabel} — choose a section`;
    grid.innerHTML = '';
    const ids = curriculum?.sectionOrder?.[track] || [];
    ids.forEach((id) => {
      const meta = curriculum?.sectionMeta?.[track]?.[id];
      if (!meta) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-section-card';
      btn.innerHTML = `<strong>${meta.label}</strong><small>${meta.note}</small>`;
      btn.addEventListener('click', () => {
        subjectId = id;
        renderChapterGrid();
        showPhase('chapter');
      });
      grid.appendChild(btn);
    });
  }

  function renderChapterGrid() {
    const grid = document.getElementById('chapterGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const chapters = chaptersForSubject();
    if (!chapters.length) {
      grid.innerHTML = '<p class="sr-eval-hint">No chapters in curriculum yet for this section.</p>';
      return;
    }
    chapters.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-chapter-pick';
      btn.textContent = ch.title;
      btn.addEventListener('click', () => {
        chapterId = ch.id;
        chapterTitle = ch.title;
        document.getElementById('intentChapterLabel').textContent = ch.title;
        showPhase('intent');
      });
      grid.appendChild(btn);
    });
  }

  function bindNavigation() {
    document.getElementById('backToTrack')?.addEventListener('click', () => showPhase('track'));
    document.getElementById('backToSection')?.addEventListener('click', () => {
      renderSectionGrid();
      showPhase('section');
    });
    document.getElementById('backToChapter')?.addEventListener('click', () => showPhase('chapter'));
    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('intent'));
    document.getElementById('backFromEvaluate')?.addEventListener('click', () => showPhase('intent'));
  }

  function bindIntent() {
    document.getElementById('btnLearn')?.addEventListener('click', openLearn);
    document.getElementById('btnEvaluate')?.addEventListener('click', openEvaluate);
  }

  function sectionLabel() {
    return sectionMeta()?.label || curriculum?.subjects?.[subjectId]?.label || subjectId;
  }

  function metaLine() {
    return `${(curriculum?.trackButtons?.[track]?.label || track).toUpperCase()} · ${sectionLabel()}`;
  }

  function openLearn() {
    document.getElementById('learnTitle').textContent = chapterTitle;
    document.getElementById('learnSubtitle').textContent = metaLine();
    const box = document.getElementById('learnContent');
    const ch = currentChapter();
    const fallback = `<p><strong>${sectionLabel()}</strong></p>
      <p style="color:#94a3b8;font-size:0.9rem">${ch?.topic_count || 0} topic(s) in this chapter.</p>`;
    showPhase('learn');
    const render = () => {
      const guide = window.MultiTrackStudyMaterial?.skill?.(chapterId);
      if (window.MultiTrackStudyMaterial?.renderLearn) {
        window.MultiTrackStudyMaterial.renderLearn(box, guide, fallback);
      } else {
        box.innerHTML = fallback;
      }
    };
    if (window.MultiTrackStudyMaterial?.load) {
      window.MultiTrackStudyMaterial.load().then(render).catch(() => {
        box.innerHTML = fallback;
      });
    } else {
      box.innerHTML = fallback;
    }
  }

  function openEvaluate() {
    document.getElementById('evalTitle').textContent = chapterTitle;
    document.getElementById('evalSubtitle').textContent = metaLine();
    const chat = document.getElementById('evalChat');
    const avail = filterQuestions(99).length;
    chat.innerHTML = `<p class="sr-eval-hint">${
      avail > 0
        ? `${avail} verified item(s) for this chapter.`
        : 'Question bank coming soon — use Learn mode for study guides and RAG excerpts.'
    }</p>`;
    quizQuestions = [];
    showPhase('evaluate');
  }

  function bindEvaluate() {
    document.getElementById('btnStartQuiz')?.addEventListener('click', startQuiz);
  }

  function filterQuestions(limit) {
    if (window.MultiTrackShared?.filterQuestions) {
      const pool = window.MultiTrackShared.filterQuestions(verifiedBank, {
        track,
        section: legacySectionKey(),
        chapter: chapterId,
        limit,
      });
      if (pool.length) return pool;
    }
    return [];
  }

  function startQuiz() {
    const found = filterQuestions(5);
    const chat = document.getElementById('evalChat');
    if (!found.length) {
      chat.innerHTML =
        '<p class="sr-eval-hint">No verified practice items yet. Study materials are ready in Learn mode.</p>';
      return;
    }
    quizQuestions = found;
    quizIndex = 0;
    quizAnswers = [];
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const chat = document.getElementById('evalChat');
    const q = quizQuestions[quizIndex];
    if (!q) return;
    chat.innerHTML = `<p style="font-size:0.75rem;color:#94a3b8">Question ${quizIndex + 1} of ${quizQuestions.length}</p>
      <p style="margin:12px 0;font-weight:500">${String(q.prompt || '').replace(/\n/g, '<br>')}</p>
      <div id="quizOpts"></div>`;
    const opts = chat.querySelector('#quizOpts');
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.textContent = `${q.optionLabels?.[i] || String.fromCharCode(65 + i)}. ${opt}`;
      b.addEventListener('click', () => {
        quizAnswers.push(i);
        quizIndex++;
        if (quizIndex >= quizQuestions.length) {
          const score = quizAnswers.filter((a, j) => a === quizQuestions[j].correctIndex).length;
          chat.innerHTML = `<p style="color:#6ee7b7;font-weight:600">Score: ${score} / ${quizQuestions.length}</p>`;
        } else {
          renderQuizQuestion();
        }
      });
      opts.appendChild(b);
    });
  }

  function renderIngestBadge() {
    const el = document.getElementById('ingestBadge');
    if (!el) return;
    const n = curriculum?.stats?.verified_questions || verifiedBank.length || 0;
    const topics = curriculum?.stats?.topics || 0;
    el.textContent = n > 0 ? `${n} verified items` : `${topics} topics · Learn ready`;
    el.hidden = false;
  }

  function renderStudents(students, listId) {
    const ul = document.getElementById(listId);
    if (!ul) return;
    ul.innerHTML = '';
    (students || []).slice(0, 12).forEach((s) => {
      const li = document.createElement('li');
      li.className = 'sr-student-item';
      li.innerHTML = `<img src="${s.photo || ''}" alt="" width="32" height="32" /><span>${s.name}</span>`;
      ul.appendChild(li);
    });
  }

  function applyEntryFromUrl() {
    const p = new URLSearchParams(location.search);
    const t = p.get('track');
    if (!t || !curriculum?.trackButtons?.[t]) return false;
    track = t;
    renderSectionGrid();
    const sub = p.get('section');
    if (sub && curriculum?.subjects?.[sub]) {
      subjectId = sub;
      renderChapterGrid();
      const ch = p.get('chapter');
      if (ch) {
        chapterId = ch;
        const found = chaptersForSubject().find((c) => c.id === ch);
        chapterTitle = found?.title || ch;
        document.getElementById('intentChapterLabel').textContent = chapterTitle;
        if (p.get('intent') === 'evaluate') {
          openEvaluate();
          return true;
        }
        if (p.get('intent') === 'learn') {
          openLearn();
          return true;
        }
        showPhase('intent');
        return true;
      }
      showPhase('chapter');
      return true;
    }
    showPhase('section');
    return true;
  }
})();
