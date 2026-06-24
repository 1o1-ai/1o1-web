/**
 * CBSE XII Science Study Room — subject → chapter → learn|evaluate (initial preview).
 */
(function () {
  'use strict';

  const SKU = 'cbse12-science';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);

  let curriculum = null;
  let subjectId = '';
  let chapterId = '';
  let chapterTitle = '';

  const phases = {
    subject: document.getElementById('phaseSubject'),
    chapter: document.getElementById('phaseChapter'),
    intent: document.getElementById('phaseIntent'),
    learn: document.getElementById('phaseLearn'),
    evaluate: document.getElementById('phaseEvaluate'),
  };

  const curPath = cfg.curriculumPath || '/portal/data/cbse12-science-curriculum.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    window.AnyoBots?.loadRoster?.() || Promise.resolve({ students: [] }),
  ])
    .then(([cur, roster]) => {
      curriculum = cur;
      renderSubjectCircles();
      renderStudents(roster?.students || [], 'studentsRoster');
      renderStudents(roster?.students || [], 'learnStudentsRoster');
      renderStatsBadge();
      bindNavigation();
      bindIntent();
      if (!applyEntryFromUrl()) showPhase('subject');
    })
    .catch((err) => showLoadError('Could not load CBSE XII curriculum. ' + (err?.message || err)));

  function subjects() {
    return curriculum?.subjects || {};
  }

  function subjectMeta() {
    return subjects()[subjectId] || null;
  }

  function chaptersForSubject() {
    return subjectMeta()?.chapters || [];
  }

  function currentChapter() {
    return chaptersForSubject().find((c) => c.id === chapterId);
  }

  function showLoadError(msg) {
    const el = document.getElementById('srLoadError');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
    showPhase('subject');
  }

  function showPhase(name) {
    Object.entries(phases).forEach(([k, el]) => {
      if (el) el.classList.toggle('hidden', k !== name);
    });
    document.body.classList.toggle('sr-learn-active', name === 'learn');
    document.body.classList.toggle('sr-eval-active', name === 'evaluate');
  }

  function renderSubjectCircles() {
    const wrap = document.getElementById('subjectCircles');
    if (!wrap) return;
    wrap.innerHTML = '';
    Object.entries(subjects()).forEach(([id, sub]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sr-subject-circle ${id}`;
      btn.dataset.subject = id;
      btn.innerHTML = `
        <span class="sr-circle-icon">${sub.icon || '📚'}</span>
        <span class="sr-circle-title">${sub.label}</span>
        <span class="sr-circle-code">${sub.code || 'XII'}</span>`;
      btn.addEventListener('click', () => {
        subjectId = id;
        renderChapterGrid();
        showPhase('chapter');
      });
      wrap.appendChild(btn);
    });
  }

  function renderChapterGrid() {
    const grid = document.getElementById('chapterGrid');
    const lead = document.getElementById('chapterLead');
    if (!grid) return;
    const sub = subjectMeta();
    if (lead) lead.innerHTML = `Select <strong>one</strong> chapter · ${sub?.label || subjectId}`;
    grid.innerHTML = '';
    const chapters = chaptersForSubject();
    if (!chapters.length) {
      grid.innerHTML = '<p class="sr-eval-hint">No chapters in curriculum yet.</p>';
      return;
    }
    chapters.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-chapter-pick';
      btn.innerHTML = `${ch.title}<small>${ch.questionCount || 0} questions in bank</small>`;
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
    document.getElementById('backToSubject')?.addEventListener('click', () => showPhase('subject'));
    document.getElementById('backToChapter')?.addEventListener('click', () => showPhase('chapter'));
    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('intent'));
    document.getElementById('backFromEvaluate')?.addEventListener('click', () => showPhase('intent'));
  }

  function bindIntent() {
    document.getElementById('btnLearn')?.addEventListener('click', openLearn);
    document.getElementById('btnEvaluate')?.addEventListener('click', openEvaluate);
  }

  function metaLine() {
    const sub = subjectMeta();
    return `CBSE XII · ${sub?.label || subjectId} (${sub?.code || ''})`;
  }

  function openLearn() {
    const ch = currentChapter();
    document.getElementById('learnTitle').textContent = chapterTitle;
    document.getElementById('learnSubtitle').textContent = metaLine();
    const box = document.getElementById('learnContent');
    box.innerHTML = `
      <section class="sr-learn-section">
        <h3>Chapter overview</h3>
        <p>Board-aligned chapter from the CBSE Class 12 ${subjectMeta()?.label || ''} question bank.
        Study notes and NCERT summaries will be linked here as the microservice ingests syllabus PDFs.</p>
        <ul class="sr-learn-list">
          <li><strong>${ch?.questionCount || 0}</strong> practice items tagged to this chapter</li>
          <li>Includes previously-asked CBSE XII markers where available</li>
          <li>Use <strong>Evaluate</strong> once the verified export is wired (next pipeline step)</li>
        </ul>
      </section>`;
    showPhase('learn');
  }

  function openEvaluate() {
    const ch = currentChapter();
    document.getElementById('evalTitle').textContent = chapterTitle;
    document.getElementById('evalSubtitle').textContent = metaLine();
    document.getElementById('evalChat').innerHTML = `
      <p class="sr-eval-hint">
        <strong>${ch?.questionCount || 0}</strong> questions available in the source bank for
        <em>${chapterTitle}</em>. Portal export and 5-question drills are the next build step —
        taxonomy and study room shell are live.
      </p>`;
    showPhase('evaluate');
  }

  function renderStatsBadge() {
    const el = document.getElementById('statsBadge');
    if (!el || !curriculum?.stats) return;
    el.textContent = `${curriculum.stats.total_questions?.toLocaleString() || '—'} bank items`;
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
      li.innerHTML = `<img src="${s.photo}" alt="" width="32" height="32" /><span>${s.name}</span><em>${s.city || ''}</em>`;
      ul.appendChild(li);
    });
  }

  function applyEntryFromUrl() {
    const p = new URLSearchParams(location.search);
    const sub = p.get('subject');
    if (!sub || !subjects()[sub]) return false;
    subjectId = sub;
    renderChapterGrid();
    const ch = p.get('chapter');
    if (ch) {
      chapterId = ch;
      const found = chaptersForSubject().find((c) => c.id === ch);
      chapterTitle = found?.title || ch;
      document.getElementById('intentChapterLabel').textContent = chapterTitle;
      if (p.get('intent') === 'learn') {
        openLearn();
        return true;
      }
      if (p.get('intent') === 'evaluate') {
        openEvaluate();
        return true;
      }
      showPhase('intent');
      return true;
    }
    showPhase('chapter');
    return true;
  }
})();
