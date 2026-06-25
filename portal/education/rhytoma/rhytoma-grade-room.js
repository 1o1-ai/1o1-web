/**
 * Rhytoma Academy — grade → subject → chapter → learn|evaluate
 */
(function () {
  'use strict';

  const SKU = 'rhytoma-wbbse';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);

  const GRADES = ['9', '10', '11', '12'];
  let curriculum = null;
  let verifiedBank = [];
  let grade = '10';
  let subject = '';
  let chapterId = '';
  let chapterTitle = '';
  let quizQuestions = [];
  let quizIndex = 0;
  let quizAnswers = [];

  const phases = {
    grade: document.getElementById('phaseGrade'),
    subject: document.getElementById('phaseSubject'),
    chapter: document.getElementById('phaseChapter'),
    intent: document.getElementById('phaseIntent'),
    learn: document.getElementById('phaseLearn'),
    evaluate: document.getElementById('phaseEvaluate'),
  };

  const curPath = cfg.curriculumPath || '/portal/data/rhytoma-curriculum.json';
  const bankPath = cfg.bankPath || '/portal/data/rhytoma-questions.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    fetch(bankPath)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .catch(() => ({ questions: [] })),
    window.AnyoBots?.loadRoster?.() || Promise.resolve({ students: [] }),
  ])
    .then(([cur, bank, roster]) => {
      curriculum = cur;
      verifiedBank = (bank.questions || cur.verifiedQuestions || []).filter(
        (q) => q.answer_verified !== false && (q.correctIndex != null || q.correct_index != null)
      );
      renderGradeCircles();
      renderStudents(roster?.students || [], 'studentsRoster');
      renderStudents(roster?.students || [], 'learnStudentsRoster');
      renderIngestBadge();
      bindGradeButtons();
      bindSubjectButtons();
      bindNavigation();
      bindIntent();
      bindEvaluate();
      applyEntryFromUrl();
    })
    .catch((err) => showLoadError('Could not load curriculum. ' + (err?.message || err)));

  function boardForGrade(g) {
    return g === '11' || g === '12' ? 'WBCHSE' : 'WBBSE';
  }

  function showLoadError(msg) {
    const el = document.getElementById('srLoadError');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    showPhase('grade');
  }

  function showPhase(name) {
    Object.entries(phases).forEach(([k, el]) => {
      if (el) el.classList.toggle('hidden', k !== name);
    });
    document.body.classList.toggle('sr-eval-active', name === 'evaluate');
    document.body.classList.toggle('sr-learn-active', name === 'learn');
  }

  function renderGradeCircles() {
    const host = document.getElementById('gradeCircles');
    if (!host) return;
    host.innerHTML = '';
    GRADES.forEach((g) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sr-subject-circle ${g === '9' || g === '10' ? 'science' : 'math'}`;
      btn.dataset.grade = g;
      btn.innerHTML = `<span class="sr-circle-icon">${g === '9' || g === '10' ? '📘' : '🎓'}</span>
        <span class="sr-circle-title">Class ${g}</span>
        <span class="sr-circle-code">${boardForGrade(g)}</span>`;
      host.appendChild(btn);
    });
  }

  function chaptersForSubject() {
    const s = curriculum?.subjects?.[subject];
    const all = s?.chapters || s?.units || [];
    return all.filter((ch) => !ch.grades || ch.grades.includes(String(grade)));
  }

  function currentChapter() {
    return chaptersForSubject().find((c) => c.id === chapterId);
  }

  function metaLine() {
    const subj = subject === 'mathematics' ? 'Mathematics' : 'Science';
    return `Class ${grade} · ${boardForGrade(grade)} · ${subj}`;
  }

  function bindGradeButtons() {
    document.querySelectorAll('[data-grade]').forEach((btn) => {
      btn.addEventListener('click', () => {
        grade = btn.getAttribute('data-grade');
        const board = boardForGrade(grade);
        const scienceBoard = document.getElementById('scienceBoard');
        const mathBoard = document.getElementById('mathBoard');
        if (scienceBoard) scienceBoard.textContent = board;
        if (mathBoard) mathBoard.textContent = board;
        const lead = document.getElementById('subjectLead');
        if (lead) lead.textContent = `Class ${grade} · ${board} — choose subject`;
        renderIngestBadge();
        showPhase('subject');
      });
    });
  }

  function bindSubjectButtons() {
    document.querySelectorAll('[data-subject]').forEach((btn) => {
      btn.addEventListener('click', () => {
        subject = btn.getAttribute('data-subject');
        renderChapterGrid();
        showPhase('chapter');
      });
    });
  }

  function renderChapterGrid() {
    const grid = document.getElementById('chapterGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const chapters = chaptersForSubject();
    if (!chapters.length) {
      grid.innerHTML = '<p class="sr-eval-hint">No chapters for this class and subject yet.</p>';
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
    document.getElementById('backToGrade')?.addEventListener('click', () => showPhase('grade'));
    document.getElementById('backToSubject')?.addEventListener('click', () => showPhase('subject'));
    document.getElementById('backToChapter')?.addEventListener('click', () => showPhase('chapter'));
    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('intent'));
    document.getElementById('backFromEvaluate')?.addEventListener('click', () => showPhase('intent'));
  }

  function bindIntent() {
    document.getElementById('btnLearn')?.addEventListener('click', openLearn);
    document.getElementById('btnEvaluate')?.addEventListener('click', openEvaluate);
  }

  function fmt(text) {
    return window.AnyoQuestionFormat ? window.AnyoQuestionFormat.formatMathText(text) : text;
  }

  function openLearn() {
    document.getElementById('learnTitle').textContent = chapterTitle;
    document.getElementById('learnSubtitle').textContent = metaLine();
    const ch = currentChapter();
    const avail = filterQuestions(99).length;
    const box = document.getElementById('learnContent');
    box.innerHTML = `
      <p><strong>${chapterTitle}</strong></p>
      <p style="color:#94a3b8;font-size:0.9rem">${metaLine()}</p>
      <h3 style="margin-top:1.25rem;font-size:1rem;color:#e2e8f0">Overview</h3>
      <p>Study this chapter for ${boardForGrade(grade)} ${subject === 'mathematics' ? 'Mathematics' : 'Science'}.
      Use <strong>Evaluate</strong> for verified board-style MCQs when available.</p>
      <p style="margin-top:12px;color:#64748b;font-size:0.85rem">${avail} verified question(s) in bank for this chapter.</p>
      <p style="margin-top:12px"><a href="/rhytoma/#panel-practice" style="color:#67e8f9">Practice Test</a> · full paper simulation on Rhytoma API.</p>`;
    showPhase('learn');
  }

  function openEvaluate() {
    document.getElementById('evalTitle').textContent = chapterTitle;
    document.getElementById('evalSubtitle').textContent = metaLine();
    const chat = document.getElementById('evalChat');
    const avail = filterQuestions(99).length;
    chat.innerHTML = `<p class="sr-eval-hint">${
      avail > 0
        ? `${avail} verified board question(s) for this chapter.`
        : 'No verified questions yet — try another chapter or the Practice Test tab.'
    }</p>`;
    quizQuestions = [];
    showPhase('evaluate');
  }

  function filterQuestions(limit) {
    const subj = subject === 'mathematics' ? 'mathematics' : 'science';
    const pool = verifiedBank.filter((q) => {
      const qSub = (q.subject_slug || q.subject || '').toLowerCase();
      const matchSub =
        qSub === subj ||
        qSub === subject ||
        (subj === 'mathematics' && qSub.includes('math')) ||
        (subj === 'science' && qSub === 'science');
      const matchCh = (q.chapter || '') === chapterId;
      const qGrade = q.grade != null ? String(q.grade) : null;
      const matchGrade = !qGrade || qGrade === String(grade);
      return matchSub && matchCh && matchGrade;
    });
    return pool.slice(0, limit).map((q) => ({
      id: q.id,
      prompt: fmt(q.prompt || q.question || q.text),
      options: q.options || [],
      correctIndex: q.correctIndex != null ? q.correctIndex : q.correct_index,
    }));
  }

  function bindEvaluate() {
    document.getElementById('btnStartQuiz')?.addEventListener('click', startQuiz);
  }

  function startQuiz() {
    const found = filterQuestions(5);
    const chat = document.getElementById('evalChat');
    if (!found.length) {
      chat.innerHTML =
        '<p class="sr-eval-hint">No verified practice items yet. Try the Practice Test or pick another chapter.</p>';
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
      b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
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
    const n = verifiedBank.length;
    el.textContent = n > 0 ? `${n} verified · Class ${grade}` : `Class ${grade} · ${boardForGrade(grade)}`;
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
    const g = p.get('grade');
    if (g && GRADES.includes(g)) {
      grade = g;
      const board = boardForGrade(grade);
      document.getElementById('scienceBoard').textContent = board;
      document.getElementById('mathBoard').textContent = board;
      document.getElementById('subjectLead').textContent = `Class ${grade} · ${board} — choose subject`;
      showPhase('subject');
      return;
    }
    showPhase('grade');
  }
})();
