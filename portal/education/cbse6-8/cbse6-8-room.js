/**
 * CBSE Classes 6-8 Study Room — subject → chapter → learn|evaluate.
 * Structurally identical to cbse12-room.js; the only per-SKU differences are the SKU id,
 * the curriculum path, and showing the class (grade) on each chapter card, since this SKU
 * spans grades 6, 7 and 8 within one subject.
 */
(function () {
  'use strict';

  const SKU = 'cbse6-8';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);

  let curriculum = null;
  let subjectId = '';
  let gradeId = '';
  let chapterId = '';
  let chapterTitle = '';

  const phases = {
    subject: document.getElementById('phaseSubject'),
    class: document.getElementById('phaseClass'),
    chapter: document.getElementById('phaseChapter'),
    intent: document.getElementById('phaseIntent'),
    study: document.getElementById('phaseStudy'),
    learn: document.getElementById('phaseLearn'),
    evaluate: document.getElementById('phaseEvaluate'),
  };

  const curPath = cfg.curriculumPath || '/portal/data/cbse6-8-curriculum.json';

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
    .catch((err) => showLoadError('Could not load CBSE 6-8 curriculum. ' + (err?.message || err)));

  function subjects() {
    return curriculum?.subjects || {};
  }

  function subjectMeta() {
    return subjects()[subjectId] || null;
  }

  function chaptersForSubject() {
    return subjectMeta()?.chapters || [];
  }

  function gradesForSubject() {
    const seen = [];
    chaptersForSubject().forEach((c) => {
      if (c.grade && !seen.includes(c.grade)) seen.push(c.grade);
    });
    return seen.sort();
  }

  function chaptersForClass() {
    return chaptersForSubject().filter((c) => String(c.grade) === String(gradeId));
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
    document.body.classList.toggle('cbse-study-active', name === 'study');
    if (name !== 'study') window.CBSEOfficialBooks?.stopLecture?.();
  }

  function openStudyHub(initialTab) {
    if (!window.CBSEStudyHub) {
      showPhase('intent');
      return;
    }
    window.CBSEStudyHub.open({
      sku: SKU,
      subjectId,
      subjectLabel: metaLine(),
      chapterId,
      chapterTitle,
      initialTab: initialTab === 'random' ? 'quiz' : initialTab || 'regular',
      showPhase,
      listChapters: () =>
        chaptersForSubject().map((c) => ({ id: c.id, title: c.title })),
      filterQuestions: () => [],
      onBeforePractice: () => {
        const embed = document.getElementById('studyPracticeEmbed');
        const evalPhase = document.getElementById('phaseEvaluate');
        if (embed && evalPhase) {
          embed.classList.remove('hidden');
          embed.appendChild(evalPhase);
          evalPhase.classList.remove('hidden');
        }
        openEvaluate();
      },
      onLeavePractice: () => {
        const embed = document.getElementById('studyPracticeEmbed');
        const panel = document.getElementById('studyTabPanel');
        const evalPhase = document.getElementById('phaseEvaluate');
        if (embed) embed.classList.add('hidden');
        if (panel && evalPhase) {
          panel.after(evalPhase);
          evalPhase.classList.add('hidden');
        }
      },
      legacyIntent: () => showPhase('intent'),
    });
  }

  function renderSubjectCircles() {
    const wrap = document.getElementById('subjectCircles');
    if (!wrap) return;
    const mk = window.AnyoEducationHub?.createSubjectPortalButton;
    wrap.innerHTML = '';
    Object.entries(subjects()).forEach(([id, sub]) => {
      const btn = mk
        ? mk({
            subjectClass: id,
            icon: sub.icon || '📚',
            title: sub.label,
            subtitle: sub.code || 'VI-VIII',
            dataset: { subject: id },
          })
        : (() => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `portal portal--saas sr-subject-circle ${id}`;
            b.dataset.subject = id;
            b.innerHTML = `<div class="portal-ring"></div><div class="portal-orbit"></div><div class="portal-core"><span class="portal-icon">${sub.icon || '📚'}</span><span class="portal-title">${sub.label}</span><span class="portal-sub">${sub.code || 'VI-VIII'}</span></div>`;
            return b;
          })();
      btn.addEventListener('click', () => {
        subjectId = id;
        gradeId = '';
        renderClassCircles();
        showPhase('class');
      });
      wrap.appendChild(btn);
    });
  }

  function renderClassCircles() {
    const wrap = document.getElementById('classCircles');
    const lead = document.getElementById('classLead');
    if (!wrap) return;
    const sub = subjectMeta();
    if (lead) lead.innerHTML = `Choose your class · ${sub?.label || subjectId}`;
    const mk = window.AnyoEducationHub?.createSubjectPortalButton;
    wrap.innerHTML = '';
    const grades = gradesForSubject();
    // if the subject somehow has only one class, skip straight to its chapters
    if (grades.length === 1) {
      gradeId = grades[0];
      renderChapterGrid();
      showPhase('chapter');
      return;
    }
    grades.forEach((g) => {
      const count = chaptersForSubject().filter((c) => String(c.grade) === String(g)).length;
      const btn = mk
        ? mk({
            subjectClass: `grade-${g}`,
            icon: '🎓',
            title: `Class ${g}`,
            subtitle: `${count} chapters`,
            dataset: { grade: g },
          })
        : (() => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `portal portal--saas sr-subject-circle grade-${g}`;
            b.dataset.grade = g;
            b.innerHTML = `<div class="portal-ring"></div><div class="portal-orbit"></div><div class="portal-core"><span class="portal-icon">🎓</span><span class="portal-title">Class ${g}</span><span class="portal-sub">${count} chapters</span></div>`;
            return b;
          })();
      btn.addEventListener('click', () => {
        gradeId = g;
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
    if (lead) {
      lead.innerHTML = `Select <strong>one</strong> chapter · Class ${gradeId} ${sub?.label || subjectId}`;
    }
    grid.innerHTML = '';
    const chapters = chaptersForClass();
    if (!chapters.length) {
      grid.innerHTML = '<p class="sr-eval-hint">No chapters in curriculum yet.</p>';
      return;
    }
    chapters.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-chapter-pick';
      const badge = ch.hasExemplar ? ' · Exemplar' : '';
      btn.innerHTML = `${ch.title}<small>${ch.questionCount || 0} questions${badge}</small>`;
      btn.addEventListener('click', () => {
        chapterId = ch.id;
        chapterTitle = ch.title;
        document.getElementById('intentChapterLabel').textContent = ch.title;
        openStudyHub('regular');
      });
      grid.appendChild(btn);
    });
  }

  function bindNavigation() {
    document.getElementById('backToSubjectFromClass')?.addEventListener('click', () => showPhase('subject'));
    document.getElementById('backToClass')?.addEventListener('click', () => showPhase('class'));
    document.getElementById('backToChapter')?.addEventListener('click', () => showPhase('chapter'));
    document.getElementById('backFromStudy')?.addEventListener('click', () => showPhase('chapter'));
    document.getElementById('backFromLearn')?.addEventListener('click', () => showPhase('study'));
    document.getElementById('backFromEvaluate')?.addEventListener('click', () => showPhase('study'));
    window.addEventListener('cbse6-8:switch-practice', () => {
      document.querySelector('#studyTabBar .cbse-tab[data-tab="practice"]')?.click();
    });
  }

  function bindIntent() {
    document.getElementById('btnLearn')?.addEventListener('click', openLearn);
    document.getElementById('btnEvaluate')?.addEventListener('click', openEvaluate);
  }

  function metaLine() {
    const sub = subjectMeta();
    const ch = currentChapter();
    return `CBSE Class ${ch?.grade || gradeId || '6-8'} · ${sub?.label || subjectId}`;
  }

  function openLearn() {
    const ch = currentChapter();
    document.getElementById('learnTitle').textContent = chapterTitle;
    document.getElementById('learnSubtitle').textContent = metaLine();
    const box = document.getElementById('learnContent');
    box.innerHTML = `
      <section class="sr-learn-section">
        <h3>Chapter overview</h3>
        <p>NCERT chapter from the CBSE Class ${ch?.grade || ''} ${subjectMeta()?.label || ''} syllabus.
        Study notes, Eden Sutra concepts and a curated video companion appear in the study tabs.</p>
        <ul class="sr-learn-list">
          <li><strong>${ch?.questionCount || 0}</strong> practice items tagged to this chapter</li>
          <li>Official NCERT source${ch?.hasExemplar ? ' + Exemplar problems' : ''}</li>
          <li>AI-generated practice will be ingested into the board/synthetic buckets</li>
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
        <strong>${ch?.questionCount || 0}</strong> questions available for
        <em>${chapterTitle}</em>. AI-generated question ingestion is the next pipeline step —
        taxonomy, study room and Eden concepts are live.
      </p>`;
  }

  function renderStatsBadge() {
    const el = document.getElementById('statsBadge');
    if (!el || !curriculum?.stats) return;
    el.textContent = `${curriculum.stats.total_chapters || '—'} chapters`;
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

    const ch = p.get('chapter');
    if (ch) {
      const found = chaptersForSubject().find((c) => c.id === ch);
      chapterId = ch;
      chapterTitle = found?.title || ch;
      gradeId = found?.grade || gradeId;
      document.getElementById('intentChapterLabel').textContent = chapterTitle;
      openStudyHub(p.get('intent') === 'evaluate' ? 'practice' : 'regular');
      return true;
    }

    const cls = p.get('class') || p.get('grade');
    if (cls && gradesForSubject().includes(String(cls))) {
      gradeId = String(cls);
      renderChapterGrid();
      showPhase('chapter');
      return true;
    }

    renderClassCircles();
    showPhase('class');
    return true;
  }
})();
