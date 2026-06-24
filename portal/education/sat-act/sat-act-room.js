/**
 * SAT / ACT Study Room — wizard: exam → section → chapter → learn|evaluate
 * Works with both curriculum shapes:
 *   • tracks.sat.sections (yogabrata portal export)
 *   • subjects.sat-reading-writing.chapters (full taxonomy export)
 */
(function () {
  'use strict';

  const SKU = 'sat-act';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);

  /** Official section cards — always shown (sat-suite.md / act-prep.md). */
  const SECTION_ORDER = {
    sat: ['sat-reading-writing', 'sat-math'],
    act: ['act-english', 'act-math', 'act-reading', 'act-science'],
  };

  const SECTION_META = {
    sat: {
      'sat-reading-writing': {
        label: 'Reading and Writing Section',
        note:
          '2 modules · 64 minutes total · 54 questions. Craft, structure, and standard grammar conventions.',
        legacySection: 'reading_writing',
      },
      'sat-math': {
        label: 'Mathematics Section',
        note:
          '2 modules · 70 minutes total · 44 questions. Calculator allowed — built-in Desmos graphing calculator.',
        legacySection: 'math',
      },
    },
    act: {
      'act-english': {
        label: 'English',
        note: '75 questions · 45 minutes. Usage, mechanics, and rhetorical flow.',
        legacySection: 'english',
      },
      'act-math': {
        label: 'Math',
        note: '60 questions · 60 minutes. Pre-algebra, algebra, geometry, trigonometry.',
        legacySection: 'math',
      },
      'act-reading': {
        label: 'Reading',
        note: '40 questions · 35 minutes. Social sciences, humanities, literature.',
        legacySection: 'reading',
      },
      'act-science': {
        label: 'Science',
        note: '40 questions · 35 minutes. Data analysis, experiments, scientific theories.',
        legacySection: 'science',
      },
    },
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

  const curPath = cfg.curriculumPath || '/portal/data/sat-act-curriculum.json';
  const bankPath = cfg.bankPath || '/portal/data/sat-act-questions.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    fetch(bankPath)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .catch(() => ({ questions: [] })),
    window.AnyoBots?.loadRoster?.() || Promise.resolve({ students: [] }),
  ])
    .then(([cur, bank, roster]) => {
      curriculum = cur;
      verifiedBank = (bank.questions || []).filter((q) => (q.options || []).length >= 2);
      renderStudents(roster?.students || [], 'studentsRoster');
      renderStudents(roster?.students || [], 'learnStudentsRoster');
      renderIngestBadge();
      bindTrackButtons();
      bindNavigation();
      bindIntent();
      bindEvaluate();
      if (!applyEntryFromUrl()) showPhase('track');
    })
    .catch((err) => showLoadError('Could not load SAT/ACT curriculum. ' + (err?.message || err)));

  function sectionMeta() {
    return SECTION_META[track]?.[subjectId] || null;
  }

  function legacySectionKey() {
    const meta = sectionMeta();
    if (meta?.legacySection) return meta.legacySection;
    return curriculum?.subjects?.[subjectId]?.section || '';
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

  function chaptersForSubject() {
    const fromSubjects = curriculum?.subjects?.[subjectId]?.chapters;
    if (Array.isArray(fromSubjects) && fromSubjects.length) return fromSubjects;

    const leg = legacySectionKey();
    const sec = curriculum?.tracks?.[track]?.sections?.[leg];
    if (sec?.skills?.length) {
      return sec.skills.map((sk) => ({
        id: sk.id,
        title: sk.title,
        unit: sec.label || sectionMeta()?.label || leg,
        skills: sk.skills || [],
        keywords: sk.keywords || [],
      }));
    }
    if (sec?.chapters?.length) return sec.chapters;

    return [];
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
    lead.textContent =
      track === 'sat'
        ? 'Digital SAT — choose a section (official timing)'
        : 'ACT — choose a section (official timing)';
    grid.innerHTML = '';
    const ids = SECTION_ORDER[track] || [];
    ids.forEach((id) => {
      const meta = SECTION_META[track]?.[id];
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
    if (!grid.children.length) {
      grid.innerHTML =
        '<p class="sr-eval-hint">Sections could not load — refresh or try again later.</p>';
    }
  }

  function renderChapterGrid() {
    const grid = document.getElementById('chapterGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const chapters = chaptersForSubject();
    if (!chapters.length) {
      grid.innerHTML =
        '<p class="sr-eval-hint">No skill chapters in curriculum yet for this section.</p>';
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
    return `${track.toUpperCase()} · ${sectionLabel()}`;
  }

  function openLearn() {
    const ch = currentChapter();
    document.getElementById('learnTitle').textContent = chapterTitle;
    document.getElementById('learnSubtitle').textContent = metaLine();
    const box = document.getElementById('learnContent');
    const nestedSkills = (ch?.skills || []).map((s) => `<li>${s.title || s}</li>`).join('');
    const fallback = `
      <p><strong>${ch?.unit || sectionLabel()}</strong></p>
      <p style="color:#94a3b8;font-size:0.9rem;margin:12px 0">
        Official College Board / ACT-aligned skill area. Study the concepts below, then use
        <strong>Evaluate</strong> for verified practice items from ingested official PDFs.
      </p>
      ${nestedSkills ? `<ul class="sr-skill-list">${nestedSkills}</ul>` : ''}
      <p style="color:#64748b;font-size:0.8rem;margin-top:16px">
        Keywords: ${(ch?.keywords || []).join(' · ') || '—'}
      </p>`;
    showPhase('learn');
    const render = () => {
      const guide = window.SatActStudyMaterial?.skill?.(chapterId);
      if (window.SatActStudyMaterial?.renderLearn) {
        window.SatActStudyMaterial.renderLearn(box, guide, fallback);
        return;
      }
      box.innerHTML = fallback;
    };
    if (window.SatActStudyMaterial?.load) {
      window.SatActStudyMaterial.load().then(render).catch(() => {
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
    chat.innerHTML = `<p class="sr-eval-hint">
      ${avail > 0 ? `${avail} official item(s) available for this skill.` : 'No verified items yet for this skill — try ACT English or check back after the next crawl.'}
      Press <strong>Start 5-question drill</strong> when ready.
    </p>`;
    quizQuestions = [];
    quizIndex = 0;
    quizAnswers = [];
    showPhase('evaluate');
  }

  function bindEvaluate() {
    document.getElementById('btnStartQuiz')?.addEventListener('click', startQuiz);
  }

  function filterQuestions(limit) {
    const legSec = legacySectionKey().toLowerCase();
    const subSection = (curriculum?.subjects?.[subjectId]?.section || '').toLowerCase();
    const sectionKey = subSection || legSec;

    let pool = verifiedBank.filter((q) => {
      const matchTrack = !track || (q.track || '').toLowerCase() === track;
      const matchSec = !sectionKey || (q.section || '').toLowerCase() === sectionKey;
      const matchCh = !chapterId || (q.chapter || '') === chapterId;
      return matchTrack && matchSec && matchCh;
    });

    if (pool.length < 2 && chapterId) {
      pool = verifiedBank.filter(
        (q) =>
          (q.track || '').toLowerCase() === track &&
          (!sectionKey || (q.section || '').toLowerCase() === sectionKey)
      );
    }

    return pool.slice(0, limit);
  }

  function toQuizItem(q) {
    return {
      prompt: q.question || q.prompt,
      options: q.options || [],
      correctIndex: q.correctIndex != null ? q.correctIndex : q.correct_index,
    };
  }

  function startQuiz() {
    const found = filterQuestions(5);
    if (!found.length) {
      document.getElementById('evalChat').innerHTML =
        '<p class="sr-eval-hint">No official items for this skill yet. Try ACT English or another section.</p>';
      return;
    }
    quizQuestions = found.map(toQuizItem);
    quizIndex = 0;
    quizAnswers = [];
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const chat = document.getElementById('evalChat');
    const q = quizQuestions[quizIndex];
    if (!q) return;
    chat.innerHTML = `<p style="font-size:0.75rem;color:#94a3b8">Question ${quizIndex + 1} of ${quizQuestions.length}</p>
      <p style="margin:12px 0;font-weight:500">${String(q.prompt).replace(/\n/g, '<br>')}</p>
      <div id="quizOpts"></div>`;
    const opts = chat.querySelector('#quizOpts');
    q.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      b.addEventListener('click', () => {
        quizAnswers.push(i);
        quizIndex++;
        if (quizIndex >= quizQuestions.length) {
          const score = quizAnswers.filter((a, j) => a === quizQuestions[j].correctIndex).length;
          chat.innerHTML = `<p style="color:#6ee7b7;font-weight:600;font-size:1.1rem">Score: ${score} / ${quizQuestions.length}</p>
            <p class="sr-eval-hint">Review missed skills, then try another chapter or a section mock from the hub.</p>`;
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
    el.textContent = `${n} verified practice items`;
    el.hidden = false;
  }

  function renderStudents(students, listId) {
    const ul = document.getElementById(listId);
    if (!ul) return;
    ul.innerHTML = '';
    if (!students.length) {
      const li = document.createElement('li');
      li.className = 'sr-students-empty';
      li.textContent = 'No classmates listed right now.';
      ul.appendChild(li);
      return;
    }
    students.slice(0, 12).forEach((s) => {
      const li = document.createElement('li');
      li.className = 'sr-student-item';
      const loc = [s.city, s.country].filter(Boolean).join(' ');
      li.innerHTML = `<img src="${s.photo || ''}" alt="" width="32" height="32" /><span>${s.name}</span><em>${loc}</em>`;
      ul.appendChild(li);
    });
  }

  function applyEntryFromUrl() {
    const p = new URLSearchParams(location.search);
    const t = p.get('track');
    if (t !== 'sat' && t !== 'act') return false;
    track = t;
    renderSectionGrid();
    const sub = p.get('section');
    const resolvedSub =
      sub && SECTION_META[track]?.[sub]
        ? sub
        : sub
          ? Object.keys(SECTION_META[track] || {}).find(
              (k) => SECTION_META[track][k].legacySection === sub
            )
          : null;
    if (resolvedSub) {
      subjectId = resolvedSub;
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
