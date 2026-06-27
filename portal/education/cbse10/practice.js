(function () {
  const shared = window.CBSE10Shared;
  let curriculum = null;
  let catalogQuestions = [];
  let boardQuestions = [];
  let syntheticQuestions = [];

  const prSubject = document.getElementById('prSubject');
  const prChapter = document.getElementById('prChapter');
  const prCount = document.getElementById('prCount');
  const quizArea = document.getElementById('quizArea');

  const urlParams = new URLSearchParams(location.search);

  Promise.all([
    shared.loadCurriculum(),
    shared.loadMasterCatalog(),
    shared.loadSyntheticBank(),
    fetch('../../data/cbse10-board-questions.json').then((r) => (r.ok ? r.json() : { questions: [] })),
  ]).then(([cur, catalog, synthetic, boardPayload]) => {
    curriculum = cur;
    catalogQuestions = catalog?.questions || [];
    syntheticQuestions = synthetic || [];
    boardQuestions = boardPayload?.questions || [];
    if (urlParams.get('subject')) prSubject.value = urlParams.get('subject');
    if (urlParams.get('count')) {
      const n = Math.min(15, Math.max(1, parseInt(urlParams.get('count'), 10) || 5));
      prCount.value = String(n);
    }
    fillChapters();
    prSubject.addEventListener('change', fillChapters);
  });

  function chapters(sub) {
    const s = curriculum.subjects[sub];
    return s?.chapters || s?.units || [];
  }

  function fillChapters() {
    prChapter.innerHTML = '';
    chapters(prSubject.value).forEach((ch) => {
      const o = document.createElement('option');
      o.value = ch.id;
      o.textContent = ch.title;
      prChapter.appendChild(o);
    });
  }

  function isUsableQuestion(q) {
    if (shared.isProceduralPlaceholderMcq(q)) return false;
    const text = shared.cleanDisplayText(q.text || q.prompt || q.question || '');
    if (shared.isInternalQaPrompt?.(text)) return false;
    return text.length >= 8;
  }

  function questionFingerprint(d) {
    const prompt = String(d.prompt || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    const opts = (d.options || []).map((o) => String(o).trim().toLowerCase()).join('|');
    return `${prompt}::${opts}`;
  }

  function pickPracticeQuestions(subject, chapter, count, preferFigure) {
    const fromCatalog = shared.filterMasterQuestions(catalogQuestions, {
      subject,
      chapter,
      limit: count * 12,
    });
    const fromSynthetic = shared.filterMasterQuestions(syntheticQuestions, {
      subject,
      chapter,
      mode: 'ai',
      limit: count * 12,
    });
    const chNorm = shared.normalizeChapterId(chapter);
    const fromBoard = boardQuestions.filter((q) => {
      if (shared.isAdvancedComplexity?.(q)) return false;
      const sub = (q.subject || '').toLowerCase();
      const matchSub =
        sub === subject ||
        (subject === 'mathematics' && sub.includes('math')) ||
        (subject === 'science' && sub === 'science');
      if (!matchSub) return false;
      return shared.normalizeChapterId(q.chapterId || q.chapter) === chNorm;
    });

    const seenIds = new Set();
    const seenPrompts = new Set();
    const pool = [];
    for (const q of [...fromCatalog, ...fromSynthetic, ...fromBoard]) {
      if (!isUsableQuestion(q)) continue;
      const d = shared.toDisplayQ(q);
      const idKey = String(q.id || d.id || '').trim();
      const fp = questionFingerprint(d);
      if (idKey && seenIds.has(idKey)) continue;
      if (seenPrompts.has(fp)) continue;
      if (idKey) seenIds.add(idKey);
      seenPrompts.add(fp);
      pool.push(d);
    }

    let ordered = shuffle(pool);
    if (preferFigure) {
      const fig = ordered.filter((q) => q.hasFigure);
      const rest = ordered.filter((q) => !q.hasFigure);
      ordered = [...fig, ...rest];
    }
    return ordered.slice(0, count);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function referenceHint(q) {
    const sol = q.raw?.solutions || q.solutions;
    if (!sol || typeof sol !== 'object') return '';
    const first = Object.values(sol).find((s) => s && String(s.text || '').trim());
    if (!first) return '';
    const text = String(first.text).replace(/\[.*?\]\s*/g, '').trim();
    return text.slice(0, 280) + (text.length > 280 ? '…' : '');
  }

  document.getElementById('btnChapterStart').addEventListener('click', () => {
    if (!curriculum) {
      alert('Still loading question bank — wait a moment and try again.');
      return;
    }
    const count = Math.min(15, Math.max(1, parseInt(prCount.value, 10) || 5));
    const preferFigure = document.getElementById('prFigureOnly').checked;
    const subject = prSubject.value;
    const chapter = prChapter.value;

    const questions = pickPracticeQuestions(subject, chapter, count, preferFigure);
    const chTitle = chapters(subject).find((c) => c.id === chapter)?.title || chapter;

    if (!questions.length) {
      alert('No questions for this chapter yet. Try another chapter or open Study Room → Evaluate.');
      return;
    }

    if (questions.length < count) {
      const ok = confirm(
        `Only ${questions.length} question(s) available for "${chTitle}" (requested ${count}). Start with ${questions.length}?`
      );
      if (!ok) return;
    }

    const mcqCount = questions.filter((q) => q.options?.length >= 2 && q.correctIndex != null).length;
    let title = `Chapter practice · ${questions.length} question(s) · ${chTitle}`;
    if (mcqCount < questions.length) {
      title += ` · ${mcqCount} auto-scored MCQ · ${questions.length - mcqCount} written`;
    }
    runQuiz(questions, title, { subject, chapter, chapterTitle: chTitle, grade: '10' });
  });

  function runQuiz(questions, title, meta) {
    quizArea.hidden = false;
    let idx = 0;
    const answers = [];
    let composer = null;
    const sessionStart = Date.now();
    const sessionId = 'prac_' + sessionStart;

    quizArea.innerHTML = `<h2 style="color:#f1f5f9;font-size:1rem">${title}</h2><div id="qBox"></div>`;
    const box = document.getElementById('qBox');

    function destroyComposer() {
      if (composer) {
        composer.destroy();
        composer = null;
      }
    }

    function finish() {
      destroyComposer();
      const ctx = {
        grade: meta?.grade || '10',
        subject: meta?.subject || prSubject.value,
        chapterId: meta?.chapter || prChapter.value,
        chapterTitle: meta?.chapterTitle || '',
        sessionTitle: title,
        sessionId,
        sessionStart,
        questions,
        answers: answers.slice(),
      };
      const practiceCard = document.querySelector('.practice-card');
      if (practiceCard) practiceCard.hidden = true;
      try {
        if (window.CBSEPracticeEval?.showResults) {
          window.CBSEPracticeEval.showResults(quizArea, ctx);
          return;
        }
      } catch (err) {
        console.error('Practice results failed:', err);
      }
      const mcqIdx = [];
      questions.forEach((q, i) => {
        if (q.options?.length >= 2 && q.correctIndex != null) mcqIdx.push(i);
      });
      const mcqScore = mcqIdx.filter((i) => answers[i] === questions[i].correctIndex).length;
      const written = questions.length - mcqIdx.length;
      quizArea.hidden = false;
      quizArea.innerHTML = `<div class="practice-results-fallback">
        <p style="color:#6ee7b7;font-weight:600">Practice complete · MCQ score: ${mcqScore}/${mcqIdx.length || '—'}</p>
        <p style="color:#94a3b8;font-size:0.85rem">${written ? `${written} written answer(s) saved.` : ''}</p>
        <p style="color:#fca5a5;font-size:0.82rem">Answer sheet module did not load — hard-refresh (Ctrl+Shift+R) and try again.</p>
      </div>`;
      quizArea.scrollIntoView({ behavior: 'smooth' });
    }

    function render() {
      destroyComposer();
      const q = questions[idx];
      const isMcq = q.options?.length >= 2 && q.correctIndex != null;
      const isLong = !isMcq && (q.marks || 0) >= 3;
      const fig = q.hasFigure ? '<p class="figure-badge">📐 Diagram/Figure question</p>' : '';
      const typeLabel = q.type || (isMcq ? 'MCQ' : 'Written');
      box.innerHTML = `${fig}<p style="color:#94a3b8;font-size:0.75rem">Q ${idx + 1}/${questions.length} · ${typeLabel} · ${q.marks || '?'} mark(s)</p>
        <p style="font-weight:500;margin:12px 0">${q.prompt}</p><div id="resp"></div>`;
      const resp = box.querySelector('#resp');

      if (isMcq) {
        q.options.forEach((opt, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn-portal btn-portal-ghost';
          b.style.cssText = 'display:block;width:100%;text-align:left;margin:4px 0';
          b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
          b.onclick = () => {
            answers[idx] = i;
            idx++;
            if (idx >= questions.length) finish();
            else render();
          };
          resp.appendChild(b);
        });
      } else {
        const hint = referenceHint(q);
        const hintHtml = hint
          ? `<p class="portal-note" style="font-size:0.78rem;margin-top:8px">Reference (partial): ${hint}</p>`
          : '';
        resp.innerHTML = `
          <div class="answer-composer-host" id="composerHost"></div>
          ${hintHtml}
          <button type="button" class="btn-portal btn-portal-primary" id="btnNextQ" style="margin-top:12px">
            ${idx + 1 >= questions.length ? 'Finish' : 'Next question'}
          </button>`;

        const host = resp.querySelector('#composerHost');
        if (window.AnswerComposer) {
          composer = AnswerComposer.mount(host, {
            qid: String(q.id || idx),
            isLong,
            value: answers[idx] || '',
            placeholder: isLong
              ? 'Write a full explanation with steps, formulas, and diagrams if needed…'
              : 'Type your answer — use symbols, draw, or upload an image…',
            onChange: (val) => {
              answers[idx] = val;
            },
          });
        } else {
          host.innerHTML =
            '<textarea rows="5" style="width:100%;padding:8px;font-family:inherit" placeholder="Write your answer…"></textarea>';
          const ta = host.querySelector('textarea');
          ta.value = answers[idx] || '';
          ta.addEventListener('input', () => {
            answers[idx] = ta.value;
          });
        }

        resp.querySelector('#btnNextQ').onclick = () => {
          if (composer) answers[idx] = composer.getValue();
          else answers[idx] = resp.querySelector('textarea')?.value || '';
          idx++;
          if (idx >= questions.length) finish();
          else render();
        };
      }
    }
    render();
    quizArea.scrollIntoView({ behavior: 'smooth' });
  }
})();
