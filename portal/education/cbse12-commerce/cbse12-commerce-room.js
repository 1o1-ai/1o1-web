/**
 * CBSE-XII-Commerce Study Room — subject → chapter → study hub (Classes XI–XII).
 */
(function () {
  'use strict';

  const SKU = 'cbse12-commerce';
  const cfg = window.AnyoAcademyConfig ? window.AnyoAcademyConfig.get(SKU) : {};
  if (window.AnyoBots?.configureForSku) window.AnyoBots.configureForSku(SKU);

  let curriculum = null;
  let subjectId = '';
  let chapterId = '';
  let chapterTitle = '';
  let gradeFilter = 'all';

  const phases = {
    subject: document.getElementById('phaseSubject'),
    chapter: document.getElementById('phaseChapter'),
    study: document.getElementById('phaseStudy'),
    evaluate: document.getElementById('phaseEvaluate'),
  };

  const curPath = cfg.curriculumPath || '/portal/data/cbse12-commerce-curriculum.json';

  Promise.all([
    fetch(curPath).then((r) => r.json()),
    window.CBSE12CommerceStudyMaterial?.load?.() || Promise.resolve(null),
  ])
    .then(([cur]) => {
      curriculum = cur;
      renderSubjectCircles();
      renderStatsBadge();
      bindNavigation();
      bindGradeFilter();
      if (!applyEntryFromUrl()) showPhase('subject');
    })
    .catch((err) => showLoadError('Could not load CBSE Commerce curriculum. ' + (err?.message || err)));

  function subjects() {
    return curriculum?.subjects || {};
  }

  function subjectMeta() {
    return subjects()[subjectId] || null;
  }

  function chaptersForSubject() {
    const all = subjectMeta()?.chapters || [];
    if (gradeFilter === 'all') return all;
    return all.filter((c) => String(c.grade) === gradeFilter);
  }

  function currentChapter() {
    return (subjectMeta()?.chapters || []).find((c) => c.id === chapterId);
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
    document.body.classList.toggle('cbse-study-active', name === 'study');
    if (name !== 'study') window.CBSEOfficialBooks?.stopLecture?.();
  }

  function openStudyHub(initialTab) {
    if (!window.CBSEStudyHub) return;
    const ch = currentChapter();
    window.CBSEStudyHub.open({
      sku: SKU,
      subjectId,
      subjectLabel: metaLine(),
      chapterId,
      chapterTitle,
      grade: ch?.grade || '12',
      initialTab: initialTab || 'regular',
      showPhase,
      listChapters: () =>
        chaptersForSubject().map((c) => ({
          id: c.id,
          title: c.title,
          meta: `Class ${c.grade || '12'}`,
        })),
      filterQuestions: () => [],
      onBeforePractice: () => {
        document.getElementById('evalChat').innerHTML =
          '<p class="sr-eval-hint">Board question bank ingest is pending for Commerce. Use Official Books and Regular Study tabs meanwhile.</p>';
      },
    });
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
        <span class="sr-circle-code">${sub.code || ''}</span>`;
      btn.addEventListener('click', () => {
        subjectId = id;
        gradeFilter = 'all';
        syncGradeButtons();
        renderChapterGrid();
        const gf = document.getElementById('gradeFilter');
        if (gf) gf.hidden = !(sub.grades && sub.grades.length > 1);
        showPhase('chapter');
      });
      wrap.appendChild(btn);
    });
  }

  function bindGradeFilter() {
    document.getElementById('gradeFilter')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-grade]');
      if (!btn) return;
      gradeFilter = btn.dataset.grade || 'all';
      syncGradeButtons();
      renderChapterGrid();
    });
  }

  function syncGradeButtons() {
    document.querySelectorAll('#gradeFilter [data-grade]').forEach((btn) => {
      btn.classList.toggle('on', btn.dataset.grade === gradeFilter);
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
      grid.innerHTML = '<p class="sr-eval-hint">No chapters for this filter.</p>';
      return;
    }
    chapters.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sr-chapter-pick';
      const tag = ch.hasNcert ? 'NCERT' : 'Syllabus unit';
      btn.innerHTML = `${ch.title}<small>Class ${ch.grade || '12'} · ${tag}</small>`;
      btn.addEventListener('click', () => {
        chapterId = ch.id;
        chapterTitle = ch.title;
        openStudyHub('regular');
      });
      grid.appendChild(btn);
    });
  }

  function bindNavigation() {
    document.getElementById('backToSubject')?.addEventListener('click', () => showPhase('subject'));
    document.getElementById('backFromStudy')?.addEventListener('click', () => showPhase('chapter'));
  }

  function metaLine() {
    const sub = subjectMeta();
    const ch = currentChapter();
    const grade = ch?.grade ? `Class ${ch.grade}` : 'Classes XI–XII';
    return `${grade} · ${sub?.label || subjectId} (${sub?.code || ''})`;
  }

  function renderStatsBadge() {
    const el = document.getElementById('statsBadge');
    if (!el) return;
    let units = 0;
    Object.values(subjects()).forEach((s) => {
      units += (s.chapters || []).length;
    });
    el.textContent = `${units} syllabus units`;
    el.hidden = false;
  }

  function applyEntryFromUrl() {
    const p = new URLSearchParams(location.search);
    const sub = p.get('subject');
    if (!sub || !subjects()[sub]) return false;
    subjectId = sub;
    if (p.get('grade')) gradeFilter = p.get('grade');
    renderChapterGrid();
    const ch = p.get('chapter');
    if (ch) {
      chapterId = ch;
      const found = (subjectMeta()?.chapters || []).find((c) => c.id === ch);
      chapterTitle = found?.title || ch;
      openStudyHub('regular');
      return true;
    }
    showPhase('chapter');
    return true;
  }
})();
